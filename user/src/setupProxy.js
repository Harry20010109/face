const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://137.184.16.50:5000',
      changeOrigin: true,
    })
  );
};
