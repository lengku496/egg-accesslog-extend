'use strict';

const util = require('util');
const utility = require('utility');

const LOGGER = Symbol('Context#AccessLog');
const CUSTOM_LOG_MAP = Symbol('Context#AccessLog#customLog');

let reqId = 0;

class AccessLog {
  constructor(ctx) {
    this.ctx = ctx;
    this.app = ctx.app;

    // accessLog 的配置信息
    this.options = ctx.app.config.accessLog;
  }

  // 保存自定义日志信息
  get customLog() {
    if (!this[CUSTOM_LOG_MAP]) {
      this[CUSTOM_LOG_MAP] = new Map();
    }
    return this[CUSTOM_LOG_MAP];
  }

  /**
   * 请求时调用
   *
   *@return void
   */
  async onRequest() {
    if (!this.options.enable) {
      return;
    }

    // tracer优先级: egg-tracer插件 > genTracer > 默认tracer
    if (!this.ctx.tracer) { // egg-tracer插件提供的tracer
      if (typeof this.options.genTracer === 'function') { // 自定义tracer
        this.ctx.tracer = this.options.genTracer.call(this, this.ctx);
      } else { // 默认tracer
        this.ctx.tracer = { traceId: `${process.pid}-${Date.now()}-${reqId++}` };
      }
    }
  }

  /**
   * 响应时调用
   *
   *@return void
   */
  async onResponse() {
    if (!this.options.enable) {
      return;
    }

    // 获得userId优先级，应用已经初始化ctx.userId > genUserId > 默认获取userId方式
    if (!this.ctx.userId) {
      if (typeof this.options.genUserId === 'function') { // 自定义userid获取函数
        this.ctx.userId = this.options.genUserId.call(this, this.ctx);
      } else { // 默认userId获取方式
        this.ctx.userId = this.ctx.user && (this.ctx.user.uid || this.ctx.user.userId || this.ctx.user.userid || this.ctx.user.userID);
      }
    }

    const logMap = new Map();
    const keys = [];
    for (const [key] of this.customLog) {
      logMap.set(key, this._genCustomLog(key));
      keys[keys.length] = key;
    }

    keys.sort();
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      keys[i] = logMap.get(key);
    }
    const body = this._formatParamAndBody();
    if (body) {
      keys[keys.length] = body;
    }
    this._log('%s', keys.join(', '));
  }

  /**
   * 增加访问第三方服务日志
   *
   * @param {String} type - 日志类型, 如 sql,curl等
   * @param {int} startTime - 开始时间，时间戳 单位毫秒
   * @param {string} logStr - 日志详细信息,每个类型日志可以自己定义
   * @param {int} status - 访问状态 默认为零可以根据服务类型自定义
   *
   *@return {int} size - type类型日志数量
   */
  addAccessLog(type, startTime, logStr, status = 0) {
    if (!this.options.enable || !this.options.custom) {
      return 0;
    }

    const customLog = this.customLog;
    if (!customLog.has(type)) {
      customLog.set(type, []);
    }
    const time = Date.now() - startTime;
    customLog.get(type).push({ time, logStr, status });

    // 请求已经返回，这里直接记录日志（这个主要是 内部异步调用的返回）
    if (!this.ctx.writable) {
      this._log('%s', this._genCustomLog(type, true));
    }

    return customLog.size;
  }

  // 输出上行参数和下行的body
  _formatParamAndBody() {
    if (!this.options.debug) {
      return '';
    }
    const query = this.ctx.request.query;
    const post = this.ctx.request.body;
    const params = this.ctx.request.params;
    let body = this.ctx.response.body;
    const status = this.ctx.response.status;
    const message = this.ctx.response.message;
    if (Buffer.isBuffer(body)) {
      body = this._formatBuffer(body);
    } else if (typeof body === 'string') {
      body = this._formatString(body);
    }
    body = this._formatString(util.format('%o', body));
    return util.format('\nquery: %o\npost: %o\nparams: %o\nstatus: %s\nmessage: %s\nbody: %s', query, post, params, status, message, body);
  }

  // 生成指令类型自定义日志
  _genCustomLog(type, isAsync = false) {
    let total_time = 0;
    let counter = 0;
    if (type && this.customLog.has(type)) {
      const text = this.customLog.get(type).map(value => {
        const time = value.time;
        const logStr = value.logStr;
        const status = value.status;
        counter += 1;
        total_time += time;
        return `${time}ms ${status} ${logStr}`;
      }).join('|');
      if (text.length > 0) {
        const asyncStr = isAsync ? 'async' : 'sync';
        return `[${type} ${total_time}ms ${counter} ${asyncStr}|${text}]`;
      }
    }
    return '';
  }

  _formatBuffer(buf, length = 100) {
    const tail = buf.length > length ? ` ...(${buf.length}) ` : '';
    const bufStr = buf.slice(0, length).map(i => {
      i = i.toString(16);
      if (i.length === 1) i = `0${i}`;
      return i;
    }).join(' ');
    return `<Buffer ${bufStr}${tail}>`;
  }

  _formatString(str, length = 100) {
    if (str && typeof str === 'string' && str.length > length) {
      return `${str.substr(0, length)}...(${str.length})`;
    }
    return str;
  }

  _formatError(err) {
    if (err.name === 'Error' && typeof err.code === 'string') {
      err.name = err.code + err.name;
    }

    if (err.host) {
      err.message += ` (${err.host})`;
    }
    err.stack = err.stack || 'no_stack';
    const errStack = err.stack.split('\n')[0];
    return util.format('nodejs.%s: %s %s',
      err.name,
      err.message,
      errStack
    );
  }

  /**
   * 生成基础访问信息
   */
  _formatBaseAccessMessage() {
    const { app, ctx } = this;
    const data = {
      userId: ctx.userId || '-',
      traceId: ctx.tracer && ctx.tracer.traceId || '-',
      logDate: utility.logDate(','),
      ip: ctx.ip || '',
      Xip: ctx.get(app.config.ipHeaders) || '',
      method: ctx.method,
      url: ctx.url,
      host: ctx.host || '-',
      protocol: ctx.protocol || '-',
      httpVersion: ctx.req.httpVersion || '-',
      status: ctx.status || '-',
      contentLength: ctx.length || '-',
      userAgent: ctx.get('user-agent') || '-',
      referer: ctx.get('referer') || '-',
      useTime: Date.now() - ctx.starttime,
    };

    if (typeof this.options.format === 'function') {
      return this.options.format.call(this, data, this.ctx);
    }

    return util.format('%s,%s,%s,%s,[%sms %s %s %s/%s %s %s %s %s]',
      data.logDate,
      data.ip,
      data.userId,
      data.traceId,
      data.useTime,
      data.method,
      data.url,
      data.protocol,
      data.httpVersion,
      data.status,
      data.contentLength,
      data.referer,
      data.userAgent
    );
  }

  /**
   * 记录日志
   *
   * @param {string} fmt - 日志格式
   * @param {array} argv - 可变日志参数
   *
   */
  _log(fmt, ...argv) {
    if (!this[LOGGER]) {
      this[LOGGER] = this.app.getLogger('accessLogLogger');
    }

    argv.unshift(fmt);
    const extend = util.format.apply(util, argv);
    const base = this._formatBaseAccessMessage();
    if (extend) {
      this[LOGGER].write(`${base},${extend}`);
    } else {
      this[LOGGER].write(base);
    }
  }
}

module.exports = AccessLog;
