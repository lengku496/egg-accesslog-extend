'use strict';

const mock = require('egg-mock');

describe('test/accesslog-extend.test.js', () => {
  let app;
  before(() => {
    app = mock.app({
      baseDir: 'apps/accesslog-extend-test',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mock.restore);

  it('should GET /', () => {
    return app.httpRequest()
      .get('/?userid=123')
      .expect('hi, 123 accessLog')
      .expect(200);
  });
});
