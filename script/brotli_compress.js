const process = require("process");
const fs = require("fs");
const fpath = require("path");
const zlib = require("zlib");

process.argv.slice(2).forEach((rpath) => {
  const ipath = fpath.join(process.cwd(), rpath);
  const opath = `${ipath}.br`;
  const ws = fs.createWriteStream(opath);
  ws.on('finish', () => {
    fs.stat(ipath, (_err, stats) => {
      fs.utimesSync(opath, stats.atime, stats.mtime);
    });
  });
  fs.createReadStream(ipath)
    .pipe(zlib.createBrotliCompress({
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
      }
    }))
    .pipe(ws);
});
