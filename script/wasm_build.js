const { execSync } = require("child_process");
const fpath = require("path");
const fs = require("fs");
const os = require("os");
const process = require("process");
const zlib = require("zlib");

const pkgobjs = [
  {
    name: "halfkp",
    edition: "YANEURAOU_ENGINE_NNUE",
    exportname: "YaneuraOu_HalfKP",
    extra: "ENGINE_NAME=Suisho5+YaneuraOu EVAL_EMBEDDING=ON EM_INITIAL_MEMORY_SIZE=100663296 EXTRA_CPPFLAGS='-DENGINE_OPTIONS=\\\"\"option=name=FV_SCALE=type=spin=default=24=min=1=max=128\\\"\"'",
  },
  {
    name: "k-p",
    edition: "YANEURAOU_ENGINE_NNUE_KP256",
    exportname: "YaneuraOu_K_P",
    extra: "EVAL_EMBEDDING=ON EM_INITIAL_MEMORY_SIZE=25165824 EXTRA_CPPFLAGS='-DENGINE_OPTIONS=\\\"\"option=name=FV_SCALE=type=spin=default=24=min=1=max=128\\\"\"'",
  },
  {
    name: "halfkp.noeval",
    edition: "YANEURAOU_ENGINE_NNUE",
    exportname: "YaneuraOu_HalfKP_noeval",
    extra: "EM_INITIAL_MEMORY_SIZE=100663296",
  },
  {
    name: "halfkpe9.noeval",
    edition: "YANEURAOU_ENGINE_NNUE_HALFKPE9",
    exportname: "YaneuraOu_HalfKPE9_noeval",
    extra: "EM_INITIAL_MEMORY_SIZE=100663296",
  },
  {
    name: "halfkpvm.noeval",
    edition: "YANEURAOU_ENGINE_NNUE_HALFKP_VM_256X2_32_32",
    exportname: "YaneuraOu_HalfKPvm_noeval",
    extra: "EM_INITIAL_MEMORY_SIZE=100663296",
  },
  {
    name: "k-p.noeval",
    edition: "YANEURAOU_ENGINE_NNUE_KP256",
    exportname: "YaneuraOu_K_P_noeval",
    extra: "EM_INITIAL_MEMORY_SIZE=25165824",
  },
  {
    name: "material",
    edition: "YANEURAOU_ENGINE_MATERIAL",
    exportname: "YaneuraOu_Material",
    extra: "MATERIAL_LEVEL=1 EM_INITIAL_MEMORY_SIZE=25165824",
  },
  {
    name: "material9",
    edition: "YANEURAOU_ENGINE_MATERIAL",
    exportname: "YaneuraOu_Material9",
    extra: "MATERIAL_LEVEL=9 EM_INITIAL_MEMORY_SIZE=335544320",
  },
];

const args = process.argv.slice(2);
const pkglist = args.length ? pkgobjs.filter((e) => (args.indexOf(e.name) >= 0)) : pkgobjs;

if(!fs.existsSync("source")) {
  console.error("source folder not found");
  process.exit();
}

const cwd = process.cwd();
const cpus = os.cpus().length;

for(const pkgobj of pkglist) {
  const pkgdir = `npmpackages/yaneuraou.${pkgobj.name}/lib/`;
  // embedded_nnue
  switch(pkgobj.name) {
    case "halfkp":
      if (!fs.existsSync(".dl/suisho5_20211123.halfkp.nnue.cpp.gz")) {
        execSync("curl --create-dirs -RLo .dl/suisho5_20211123.halfkp.nnue.cpp.gz https://github.com/mizar/YaneuraOu/releases/download/resource/suisho5_20211123.halfkp.nnue.cpp.gz");
      }
      execSync("gzip -cd .dl/suisho5_20211123.halfkp.nnue.cpp.gz > source/eval/nnue/embedded_nnue.cpp");
      break;
    case "k-p":
      if(!fs.existsSync(".dl/suishopetite_20211123.k_p.nnue.cpp.gz")) {
        execSync("curl --create-dirs -RLo .dl/suishopetite_20211123.k_p.nnue.cpp.gz https://github.com/mizar/YaneuraOu/releases/download/resource/suishopetite_20211123.k_p.nnue.cpp.gz");
      }
      execSync("gzip -cd .dl/suishopetite_20211123.k_p.nnue.cpp.gz > source/eval/nnue/embedded_nnue.cpp");
      break;
  }
  // mkdir
  fs.mkdirSync(pkgdir, { recursive: true });
  // rm
  for(const libfile of fs.readdirSync(pkgdir)) {
    fs.rmSync(fpath.join(pkgdir, libfile));
  }
  // make
  execSync(`make -j${cpus} clean tournament COMPILER=em++ TARGET_CPU=WASM YANEURAOU_EDITION=${pkgobj.edition} TARGET=../npmpackages/yaneuraou.${pkgobj.name}/lib/yaneuraou.${pkgobj.name}.js EM_EXPORT_NAME=${pkgobj.exportname} ${pkgobj.extra}`, { cwd: fpath.join(cwd, "source"), stdio: "inherit" });
  // compress
  for (const fext of ["js", "wasm", "worker.js"]) {
    const ipath = fpath.join(cwd, `npmpackages/yaneuraou.${pkgobj.name}/lib/yaneuraou.${pkgobj.name}.${fext}`);
    const opath_br = `${ipath}.br`;
    const opath_gz = `${ipath}.gz`;
    const ws_br = fs.createWriteStream(opath_br);
    const ws_gz = fs.createWriteStream(opath_gz);
    ws_br.on('finish', () => {
      fs.stat(ipath, (_err, stats) => {
        fs.utimesSync(opath_br, stats.atime, stats.mtime);
      });
    });
    ws_gz.on('finish', () => {
      fs.stat(ipath, (_err, stats) => {
        fs.utimesSync(opath_gz, stats.atime, stats.mtime);
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
  }
}
