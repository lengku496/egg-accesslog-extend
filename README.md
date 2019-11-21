# egg-accesslog-extend

[![NPM version][npm-image]][npm-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-accesslog-extend.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-accesslog-extend
[download-image]: https://img.shields.io/npm/dm/egg-accesslog-extend.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-accesslog-extend

<!--
Description here.
-->
## 插件说明
在某些情况下，需要在应用服务器上记录访问日志，方便统计PV和定位错误。本插件既可以记录基础访问日志，也可以记录一次请求中访问的第三方服务日志。通过基础日志和自定义的第三方访问日志可以方便定位错误和统计接口中的时间消耗。

## Install

```bash
$ npm i egg-accesslog-extend --save
```

## Usage

```js
// {app_root}/config/plugin.js
exports.accessLog = {
  enable: true,
  package: 'egg-accesslog-extend',
};
```

## Configuration

```js
// {app_root}/config/config.default.js
/**
 * egg-accesslog-extend default config
 * @member Config#accessLog
 * @property {boolean} enable - 是否开启记录访问日志功能
 * @property {boolean} debug - 是否开启记录上下行日志，一般调试的时候需要
 * @property {boolean} custom - 是否记录自定义访问日志, 开启后应用可以通过调用ctx.addAccessLog(type, startTime, logStr, status=0)
 *                              增加指定类型的访问日志，同一个类型可以增加多条 type日志类型，startTime开始时间(毫秒)，logStr日志内容，status状态码
 * @property {string} logFolder - 日志文件夹名字，false表示不单独存放文件夹 默认 access
 * @property {string} logName - 日志文件名 默认 accesslog-extend
 * @property {Function} format - 自定义基础日志格式 返回值直接写入日志 原型: (data, ctx) => string
 * @property {Function} genUserId - 获取userid的函数 返回值作为userid 原型: ctx => string
 * @property {Function} genTracer - 生成tracer的函数 返回一个对象，对象包含traceId属性 原型: ctx => Object
 *
 */
exports.accessLog = {
  enable: true,
  debug: false,
  custom: true,
  logFolder: 'access',
  logName: 'accesslog-extend',
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
   * 生成用户id（如果应用在其他地方已经给ctx.userId赋值，则优先级最高）
   * 优先级: ctx.userId > genUserId > 默认获取userId方式
   *
   * @param {Object} ctx - egg的context对象
   *
   * @return {string} 用户id
   */
  genUserId: undefined,

  /**
   * 生成追踪对象（egg-tracer插件的优先级高于这个函数）
   * 优先级: egg-tracer插件 > genTracer > 默认tracer
   *
   * @param {Object} ctx - egg的context对象
   *
   * @return {Object} 追踪对象，至少包含traceId属性
   */
  genTracer: undefined,
};
```
#### accessLog日志默认保存的路径logger.dir，如果没有配置logger.dir则保存到appInfo.root/logs目录中。
### 默认日志输出格式
```js
  // 基础访问日志
  '2019-11-20 13:31:28,349,127.0.0.1,-,78103-1574227888328-0,[21ms POST /homepage http/1.1 200 39 - node-superagent/3.8.3]'

  // 基础访问日志+第三方访问日志
  '2019-11-20 13:31:28,349,127.0.0.1,-,78103-1574227888328-0,[21ms POST /homepage http/1.1 200 39 - node-superagent/3.8.3],[curl 3717ms 2 sync|2249ms 200 https://github.com|1468ms 200 https://github.com]'
```

see [config/config.default.js](config/config.default.js) for more detail.

## Example

<!-- example here -->
### 自定义日志相关函数
```js
  exports.accessLog = {
    // 自定义基础日志格式
    format: (data, ctx) => {
      return `${data.ip} ${data.userId} ${data.traceId} [${data.logDate}] "${data.method} ${data.url} ${data.protocol}/${data.httpVersion} ${data.status} ${data.contentLength} ${data.referer} ${data.userAgent}"`;
    },

    // 自定义获得用户id方法
    genUserId: ctx => {
      // 假设用户id是通过query参数传入的
      return ctx.query.userid;
    },

    // 自定义追踪对象
    genTracer: ctx => {
      return {
        traceId: `${counter++}-${Date.now()}-${process.pid}`,
      };
    },
  }
  // 自定义日志输出格式
  '127.0.0.1 123 0-1574227792001-77873 [2019-11-20 13:29:55,727] "GET /?userid=123 http/1.1 200 17 - node-superagent/3.8.3"'
```
### 访问第三方服务的日志

#### 追加第三方服务日志函数原型
```js
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
  addAccessLog(type, startTime, logStr, status = 0);  
```

#### 追加第三方日志函数的使用
```js
  // 例如在service的某个访问redis的方法中可以调用addAccessLog记录redis访问信息
  const start = Date.now();
  const ret = app.redis.set('key', '1');
  ctx.addAccessLog('redis', start, 'set key 1', ret);

  // 记录访问第三方http接口日志
  const start = Date.now();
  const result = await ctx.curl(url);
  ctx.addAccessLog('curl', start, url, result.status);
```
see [test/fixtures/apps/accesslog-extend-test](test/fixtures/apps/accesslog-extend-test) for more detail.

## Questions & Suggestions

Please open an issue [here](https://github.com/lengku496/egg-accesslog-extend/issues).

## License

[MIT](LICENSE)
