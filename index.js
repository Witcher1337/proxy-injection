const express = require('express')
const http = require('http')
const httpProxy = require('http-proxy')
const trumpet = require('trumpet')
const httpProxyInterceptor = require('http-proxy-interceptor')


const interceptorFactory = function () {
  var out = `
  <script defer src="sw.js"></script>
  <script defer>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('sw.js').then(function(registration) {
          console.log('Service worker registered with scope: ', registration.scope);
        }, function(err) {
        console.log('ServiceWorker registration failed: ', err);
      });
      });
    }
  </script>
  `;

  const tr = trumpet()
  const elem = tr.select('head')
  const rs = elem.createReadStream()
  const ws = elem.createWriteStream()

  rs.pipe(ws, { end: false })
  rs.on('end', function () {
    ws.end(out)
  })

  return tr
}

const port = process.env.PORT
const options = {
  target: process.env.BASE_URL,
  changeOrigin: true,
  hostRewrite: `localhost:${port}`,
  protocolRewrite: "http",
  cookieDomainRewrite: "localhost",
}

const proxy = httpProxy.createProxyServer(options)
const app = express();

app.use(express.static(__dirname + '/public'));
app.use(httpProxyInterceptor(interceptorFactory, { headers: { 'content-type': /text\/html/ } }))
app.use(function (req, res) {
  proxy.web(req, res)
})

http.createServer(app).listen(port)