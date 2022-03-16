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
if(!fs.existsSync("public_wasm")) {
  console.error("public_wasm folder not found");
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
    fs.rmSync(fpath.join(pkgdir, libfile), { force: true });
  }
  // make
  execSync(`make -j${cpus} clean tournament COMPILER=em++ TARGET_CPU=WASM YANEURAOU_EDITION=${pkgobj.edition} TARGET=../npmpackages/yaneuraou.${pkgobj.name}/lib/yaneuraou.${pkgobj.name}.js EM_EXPORT_NAME=${pkgobj.exportname} ${pkgobj.extra}`, { cwd: fpath.join(cwd, "source"), stdio: "inherit" });
  // mkdir public
  fs.mkdirSync(fpath.join(cwd, `public_wasm/yaneuraou.${pkgobj.name}/`), { recursive: true });
  // compress, public copy
  for (const fext of ["js", "worker.js", "wasm"]) {
    const ipath = fpath.join(cwd, `npmpackages/yaneuraou.${pkgobj.name}/lib/yaneuraou.${pkgobj.name}.${fext}`);
    const opath_br = fpath.join(cwd, `npmpackages/yaneuraou.${pkgobj.name}/lib/yaneuraou.${pkgobj.name}.${fext}.br`);
    const opath_gz = fpath.join(cwd, `npmpackages/yaneuraou.${pkgobj.name}/lib/yaneuraou.${pkgobj.name}.${fext}.gz`);
    const ppath = fpath.join(cwd, `public_wasm/yaneuraou.${pkgobj.name}/yaneuraou.${pkgobj.name}.${fext}`);
    const ppath_br = fpath.join(cwd, `public_wasm/yaneuraou.${pkgobj.name}/yaneuraou.${pkgobj.name}.${fext}.br`);
    const ppath_gz = fpath.join(cwd, `public_wasm/yaneuraou.${pkgobj.name}/yaneuraou.${pkgobj.name}.${fext}.gz`);
    const ws_br = fs.createWriteStream(opath_br);
    const ws_gz = fs.createWriteStream(opath_gz);
    const { atime, mtime } = fs.statSync(ipath);
    // copy to public
    fs.copyFileSync(ipath, ppath);
    fs.utimesSync(ppath, atime, mtime);
    // finish caller
    ws_br.on('finish', () => {
      fs.copyFileSync(opath_br, ppath_br);
      fs.utimesSync(opath_br, atime, mtime);
      fs.utimesSync(ppath_br, atime, mtime);
      console.log(`compress finished: ${opath_br}`);
    });
    ws_gz.on('finish', () => {
      fs.copyFileSync(opath_gz, ppath_gz);
      fs.utimesSync(opath_gz, atime, mtime);
      fs.utimesSync(ppath_gz, atime, mtime);
      console.log(`compress finished: ${opath_gz}`);
    });
    // compress
    fs.createReadStream(ipath)
      .pipe(zlib.createBrotliCompress({
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
        }
      }))
      .pipe(ws_br);
    fs.createReadStream(ipath)
      .pipe(zlib.createGzip({
        level: zlib.constants.Z_MAX_LEVEL,
      }))
      .pipe(ws_gz);
  }
}
