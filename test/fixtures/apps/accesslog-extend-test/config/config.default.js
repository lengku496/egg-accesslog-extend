'use strict';

exports.keys = '123456';

let counter = 0;

exports.accessLog = {
  enable: true,
  debug: false,
  custom: true,
  logFolder: 'access',
  logName: 'access.log',
  /**
   * 自定义基础日志格式
   * @param {Object} data - 数据对象
   *        {string} userId 用户id, 如果没有设置 -
   *        {string} traceId 追踪id, 如果没有设置 -
   *        {string} logDate 记录日志用的时间字符串，格式 YYYY-MM-DD HH:mm:ss,SSS
   *        {string} ip 远程用户ip地址
   *        {string} Xip 远程用户ip地址 使用 HTTP header中的 X-Forwarded-For
   *        {string} method 访问的方法 POST GET 等
   *        {string} url 接口的地址
   *        {string} host HTTP header中的 host
   *        {string} protocol 协议类型，http、https
   *        {string} httpVersion http版本(1.0, 1.1)
   *        {string} status 接口返回的状态码
   *        {string} contentLength 下行的内容长度
   *        {string} userAgent 用户的浏览器代理
   *        {string} referer HTTP header中的referer
   *        {number} useTime 接口访问总用时，单位毫秒
   *
   * @param {Object} ctx - egg的context对象
   *
   * @return {string} 写入日志中的字符串
   */
  format: (data, ctx) => {
    return `${data.ip} ${data.userId} ${data.traceId} [${data.logDate}] "${data.method} ${data.url} ${data.protocol}/${data.httpVersion} ${data.status} ${data.contentLength} ${data.referer} ${data.userAgent}"`;
  },

  /**
   * 生成用户id
   *
   * @param {Object} ctx - egg的context对象
   *
   * @return {string} 用户id
   */
  genUserId: ctx => {
    return ctx.query.userid;
  },

  /**
   * 生成追踪对象（egg-tracer插件的优先级高于这个函数）
   * 最终对象优先级。 egg-tracer插件 > genTracer > 默认tracer
   *
   * @param {Object} ctx - egg的context对象
   *
   * @return {Object} 追踪对象，至少包含traceId属性
   */
  genTracer: ctx => {
    return {
      traceId: `${counter++}-${Date.now()}-${process.pid}`,
    };
  },
};
