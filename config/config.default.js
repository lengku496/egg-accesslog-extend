'use strict';

const path = require('path');

module.exports = (appInfo, options) => {
  const config = {};

  /**
   * egg-access-log default config
   * @member Config#accessLog
   * @property {boolean} enable - 是否开启记录访问日志功能
   * @property {boolean} debug - 是否开启记录上下行日志，一般调试的时候需要
   * @property {boolean} custom - 是否记录自定义访问日志, 开启后应用可以通过调用ctx.addAccessLog(type, time, logStr, status=0)
   *                              增加指定类型的访问日志，一次访问同一个类型可以增加多条 type日志类型，time消耗时间，logStr日志内容，status状态码
   * @property {string} logFolder - 日志文件夹名字，false表示不单独存放文件夹 默认 access
   * @property {string} logName - 日志文件名 默认 access.log
   * @property {Function} format - 自定义基础日志格式 返回值直接写入日志 原型: (data, ctx) => string
   * @property {Function} genUserId - 获取userid的函数 返回值作为userId 原型: ctx => string
   * @property {Function} genTracer - 生成tracer的函数 返回一个对象，对象包含traceId属性 原型: ctx => Object
   *
   */
  config.accessLog = {
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
    format: undefined,

    /**
     * 生成用户id
     *
     * @param {Object} ctx - egg的context对象
     *
     * @return {string} 用户id
     */
    genUserId: undefined,

    /**
     * 生成追踪对象
     *
     * @param {Object} ctx - egg的context对象
     *
     * @return {Object} 追踪对象，至少包含traceId属性
     */
    genTracer: undefined,
  };

  let dir;
  if (options.logger && options.logger.dir) {
    dir = options.logger.dir;
  } else {
    dir = `${appInfo.root}/logs/${appInfo.name}`;
  }

  let logFolder;
  if (options.accessLog && options.accessLog.logFolder === false) {
    logFolder = '';
  } else {
    logFolder = options.accessLog && options.accessLog.logFolder || config.accessLog.logFolder;
  }

  const logName = options.accessLog && options.accessLog.logName || config.accessLog.logName;
  config.customLogger = {
    accessLogLogger: {
      file: path.join(dir, logFolder, logName),
    },
  };
  return config;
};
