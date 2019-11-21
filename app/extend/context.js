/**
 * context对象扩展
 */

'use strict';

// 访问日志模块
const accessLog = require('../../lib/access_log');

const ACCESS_LOG = Symbol('Context#AccessLog');

module.exports = {
  /**
   * 获得访问日志对象
   */
  get accessLog() {
    if (!this[ACCESS_LOG]) {
      this[ACCESS_LOG] = new accessLog(this);
    }
    return this[ACCESS_LOG];
  },

  /**
   * 应用增加访问日志信息
   *
   * @param {String} type - 日志类型, 如 sql,curl等
   * @param {int} startTime - 开始时间，时间戳 单位毫秒
   * @param {string} logStr - 日志详细信息,每个类型日志可以自己定义
   * @param {int} status - 访问状态 默认为零可以根据服务类型自定义
   *
   *@return {int} size - type类型日志数量
   */
  addAccessLog(type, startTime, logStr, status) {
    return this.accessLog.addAccessLog(type, startTime, logStr, status);
  },
};
