const process = require("process");
const fs = require("fs");
const fpath = require("path");
const zlib = require("zlib");

process.argv.slice(2).forEach((rpath) => {
  const ipath = fpath.join(process.cwd(), rpath);
  const opath_br = `${ipath}.br`;
  const opath_gz = `${ipath}.gz`;
  const ws_br = fs.createWriteStream(opath_br);
  const ws_gz = fs.createWriteStream(opath_gz);
  ws_br.on('finish', () => {
    fs.stat(ipath, (_err, stats) => {
      fs.utimesSync(opath_br, stats.atime, stats.mtime);
    });
  });
  fs.createReadStream(ipath)
    .pipe(zlib.createBrotliCompress({
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
      }
    }))
    .pipe(ws_br);
  fs.createReadStream(ipath)
    .pipe(zlib.createGzip({
      level: 9,
    }))
    .pipe(ws_gz);
});
