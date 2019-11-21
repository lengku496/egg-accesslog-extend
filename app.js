// app.js

'use strict';


class AppBootHook {
  constructor(app) {
    this.app = app;

    // 请求事件
    app.on('request', ctx => {
      try {
        ctx.accessLog.onRequest();
      } catch (err) {
        ctx.logger.error(err);
      }
    });

    // 回应事件
    app.on('response', ctx => {
      try {
        ctx.accessLog.onResponse();
      } catch (err) {
        ctx.logger.error(err);
      }
    });
  }
}

module.exports = AppBootHook;
