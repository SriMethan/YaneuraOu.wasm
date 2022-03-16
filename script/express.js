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
app.use("/", expressStaticGzip("./public_wasm/", { enableBrotli: true, orderPreference: ['br'] }));
app.use("/yaneuraou.halfkp/", expressStaticGzip("./npmpackages/yaneuraou.halfkp/lib/", { enableBrotli: true, orderPreference: ['br'] }));
app.use("/yaneuraou.halfkp.noeval/", expressStaticGzip("./npmpackages/yaneuraou.halfkp.noeval/lib/", { enableBrotli: true, orderPreference: ['br'] }));
app.use("/yaneuraou.halfkpe9.noeval/", expressStaticGzip("./npmpackages/yaneuraou.halfkpe9.noeval/lib/", { enableBrotli: true, orderPreference: ['br'] }));
app.use("/yaneuraou.halfkpvm.noeval/", expressStaticGzip("./npmpackages/yaneuraou.halfkpvm.noeval/lib/", { enableBrotli: true, orderPreference: ['br'] }));
app.use("/yaneuraou.k-p/", expressStaticGzip("./npmpackages/yaneuraou.k-p/lib/", { enableBrotli: true, orderPreference: ['br'] }));
app.use("/yaneuraou.k-p.noeval/", expressStaticGzip("./npmpackages/yaneuraou.k-p.noeval/lib/", { enableBrotli: true, orderPreference: ['br'] }));
app.use("/yaneuraou.material/", expressStaticGzip("./npmpackages/yaneuraou.material/lib/", { enableBrotli: true, orderPreference: ['br'] }));
app.use("/yaneuraou.material9/", expressStaticGzip("./npmpackages/yaneuraou.material9/lib/", { enableBrotli: true, orderPreference: ['br'] }));

app.listen(port, () => {
  console.log(`listening at http://localhost:${port}`);
});
