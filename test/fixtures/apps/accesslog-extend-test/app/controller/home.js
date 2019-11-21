'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    // 记录curl访问第三方接口的日志
    let start = Date.now();
    let result = await this.ctx.curl('https://github.com');
    this.ctx.addAccessLog('curl', start, 'https://github.com', result.status);

    start = Date.now();
    result = await this.ctx.curl('https://github.com');
    this.ctx.addAccessLog('curl', start, 'https://github.com', result.status);

    this.ctx.body = 'hi, ' + this.ctx.query.userid + ' ' + this.app.plugins.accessLog.name;
  }
}

module.exports = HomeController;
