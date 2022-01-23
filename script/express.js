const express = require('express');
const expressStaticGzip = require('express-static-gzip');
const app = express();
const cors = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Cross-Origin-Embedder-Policy', 'require-corp');
  res.header('Cross-Origin-Opener-Policy', 'same-origin');

  // intercept OPTIONS method
  if ('OPTIONS' === req.method) {
    res.send(200)
  } else {
    next()
  }
}
const port = 3000;

app.use(cors)
app.use("/", expressStaticGzip("./public/", {
  enableBrotli: true,
  orderPreference: ['br']
}));

app.listen(port, () => {
  console.log(`listening at http://localhost:${port}`);
});
