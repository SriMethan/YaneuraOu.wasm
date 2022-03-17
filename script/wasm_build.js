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

if(!fs.existsSync("source/Makefile")) {
  console.error("source folder not found");
  process.exit(1);
}

const cwd = process.cwd();
const cpus = os.cpus().length;

for(const pkgobj of pkglist) {
  const builddir = `build/wasm/${pkgobj.name}/`;
  const copy_dirs = [
    `public_wasm/${pkgobj.name}/`,
    `npmpackages/yaneuraou.${pkgobj.name}/lib`,
  ];
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
  fs.mkdirSync(fpath.join(cwd, builddir), { recursive: true });
  for (const copy_dir of copy_dirs) {
    fs.mkdirSync(fpath.join(cwd, copy_dir), { recursive: true });
  }
  // rm
  for(const libfile of fs.readdirSync(builddir)) {
    fs.rmSync(fpath.join(builddir, libfile), { force: true });
  }
  // make
  execSync(`make -j${cpus} clean tournament COMPILER=em++ TARGET_CPU=WASM YANEURAOU_EDITION=${pkgobj.edition} TARGET=../${builddir}yaneuraou.${pkgobj.name}.js EM_EXPORT_NAME=${pkgobj.exportname} ${pkgobj.extra}`, { cwd: fpath.join(cwd, "source"), stdio: "inherit" });
  // compress, public copy
  for (const fext of ["js", "worker.js", "wasm"]) {
    const bfile = `yaneuraou.${pkgobj.name}.${fext}`;
    const bfile_br = `yaneuraou.${pkgobj.name}.${fext}.br`;
    const bfile_gz = `yaneuraou.${pkgobj.name}.${fext}.gz`;
    const bpath = fpath.join(cwd, builddir, bfile);
    const bpath_br = fpath.join(cwd, builddir, bfile_br);
    const bpath_gz = fpath.join(cwd, builddir, bfile_gz);
    const ws_br = fs.createWriteStream(bpath_br);
    const ws_gz = fs.createWriteStream(bpath_gz);
    if(!fs.existsSync(bpath)) {
      console.error(`file not found: ${bpath}`);
      process.exit(1);
    }
    for(const copy_dir of copy_dirs) {
      fs.copyFileSync(bpath, fpath.join(cwd, copy_dir, bfile));
    }
    const { atime, mtime } = fs.statSync(bpath);
    ws_br.on('finish', () => {
      fs.utimesSync(bpath_br, atime, mtime);
      for(const copy_dir of copy_dirs) {
        fs.copyFileSync(bpath_br, fpath.join(cwd, copy_dir, bfile_br));
        fs.utimesSync(fpath.join(cwd, copy_dir, bfile_br), atime, mtime);
      }
      console.log(`compress finished: ${bpath_br}`);
    });
    ws_gz.on('finish', () => {
      fs.utimesSync(bpath_gz, atime, mtime);
      for(const copy_dir of copy_dirs) {
        fs.copyFileSync(bpath_gz, fpath.join(cwd, copy_dir, bfile_gz));
        fs.utimesSync(fpath.join(cwd, copy_dir, bfile_gz), atime, mtime);
      }
      console.log(`compress finished: ${bpath_gz}`);
    });
    // compress
    fs.createReadStream(bpath)
      .pipe(zlib.createBrotliCompress({
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
        }
      }))
      .pipe(ws_br);
    fs.createReadStream(bpath)
      .pipe(zlib.createGzip({
        level: zlib.constants.Z_MAX_LEVEL,
      }))
      .pipe(ws_gz);
  }
}
