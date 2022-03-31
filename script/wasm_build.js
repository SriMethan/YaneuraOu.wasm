#!/usr/bin/env node
const { execSync } = require("child_process");
const fpath = require("path");
const fs = require("fs");
const os = require("os");
const process = require("process");
const zlib = require("zlib");

const pkgobjs = [
  {
    name: "komoringheights-mate",
    edition: "USER_ENGINE",
    exportname: "KomoringHeights_MATE",
    extra: "EM_INITIAL_MEMORY_SIZE=25165824",
    evalfile: false,
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
  const builddirusi = `build/wasm/${pkgobj.name}/`;
  const builddirlib = `build/wasm/${pkgobj.name}/lib/`;
  const usijs_copy_dirs = [
    `npmpackages/yaneuraou.${pkgobj.name}/`,
  ];
  const dts_copy_dirs = [
    `npmpackages/yaneuraou.${pkgobj.name}/lib/`,
  ];
  const lib_copy_dirs = [
    `npmpackages/yaneuraou.${pkgobj.name}/lib/`,
  ];
  // embedded_nnue
  switch(pkgobj.name) {
  }
  // mkdir
  fs.mkdirSync(fpath.join(cwd, builddirlib), { recursive: true });
  for (const copy_dir of lib_copy_dirs) {
    fs.mkdirSync(fpath.join(cwd, copy_dir), { recursive: true });
  }
  // rm
  for(const libfile of fs.readdirSync(builddirlib)) {
    fs.rmSync(fpath.join(builddirlib, libfile), { force: true });
  }
  // usi.js
  const bpath_usijs = fpath.join(cwd, builddirusi, `usi.${pkgobj.name}.js`);
  const bpath_usits = fpath.join(cwd, builddirusi, `usi.${pkgobj.name}.ts`);
  fs.writeFileSync(bpath_usijs, `#!/usr/bin/env node
const process = require("process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const YaneuraOu = require("./lib/yaneuraou.${pkgobj.name}");

const USI_BOOK_FILE = process.env.USI_BOOK_FILE;
const USI_EVAL_FILE = process.env.USI_EVAL_FILE;

async function runRepl(yaneuraou) {
  const iface = readline.createInterface({ input: process.stdin });
  for await (const command of iface) {
    if (command == "quit") {
      break;
    }
    yaneuraou.postMessage(command);
  }
  yaneuraou.terminate();
}

async function main(argv) {
  const yaneuraou = await YaneuraOu();
  const FS = yaneuraou.FS;
  if (USI_BOOK_FILE) {
    const buffer = await fs.promises.readFile(USI_BOOK_FILE);
    FS.writeFile(\`/\${path.basename(USI_BOOK_FILE)}\`, buffer);
    yaneuraou.postMessage("setoption name BookDir value .");
    yaneuraou.postMessage(\`setoption name BookFile value \${path.basename(USI_BOOK_FILE)}\`);
  }
  const USE_EVAL_FILE = ${pkgobj.evalfile};
  if (USE_EVAL_FILE && USI_EVAL_FILE) {
    const buffer = await fs.promises.readFile(USI_EVAL_FILE);
    const filebase = path.basename(USI_EVAL_FILE);
    FS.writeFile(\`/\${filebase}\`, buffer);
    yaneuraou.postMessage("setoption name EvalDir value .");
    yaneuraou.postMessage(\`setoption name EvalFile value \${filebase}\`);
  }
  if (argv.length > 0) {
    const commands = argv.join(" ").split(" , ");
    for (const command of commands) {
      yaneuraou.postMessage(command);
    }
    yaneuraou.terminate();
    return;
  }
  runRepl(yaneuraou);
}

if (require.main === module) {
  main(process.argv.slice(2));
}
`);
  fs.writeFileSync(bpath_usits, `/// <reference types="emscripten" />
import process from "process";
import fs from "fs";
import path from "path";
import readline from "readline";
import YaneuraOu = require("./lib/yaneuraou.${pkgobj.name}");
import { YaneuraOuModule } from "./lib/yaneuraou.module";

const USI_BOOK_FILE = process.env.USI_BOOK_FILE;
const USI_EVAL_FILE = process.env.USI_EVAL_FILE;

async function runRepl(yaneuraou: YaneuraOuModule) {
  const iface = readline.createInterface({ input: process.stdin });
  for await (const command of iface) {
    if (command == "quit") {
      break;
    }
    yaneuraou.postMessage(command);
  }
  yaneuraou.terminate();
}

async function main(argv: string[]) {
  const yaneuraou: YaneuraOuModule = await YaneuraOu();
  const FS = yaneuraou.FS;
  if (USI_BOOK_FILE) {
    const buffer = await fs.promises.readFile(USI_BOOK_FILE);
    FS.writeFile(\`/\${path.basename(USI_BOOK_FILE)}\`, buffer);
    yaneuraou.postMessage("setoption name BookDir value .");
    yaneuraou.postMessage(\`setoption name BookFile value \${path.basename(USI_BOOK_FILE)}\`);
  }
  const USE_EVAL_FILE = ${pkgobj.evalfile};
  if (USE_EVAL_FILE && USI_EVAL_FILE) {
    const buffer = await fs.promises.readFile(USI_EVAL_FILE);
    const filebase = path.basename(USI_EVAL_FILE);
    FS.writeFile(\`/\${filebase}\`, buffer);
    yaneuraou.postMessage("setoption name EvalDir value .");
    yaneuraou.postMessage(\`setoption name EvalFile value \${filebase}\`);
  }
  if (argv.length > 0) {
    const commands = argv.join(" ").split(" , ");
    for (const command of commands) {
      yaneuraou.postMessage(command);
    }
    yaneuraou.terminate();
    return;
  }
  runRepl(yaneuraou);
}

if (require.main === module) {
  main(process.argv.slice(2));
}
`);
  for(const copy_dir of usijs_copy_dirs) {
    fs.copyFileSync(bpath_usijs, fpath.join(cwd, copy_dir, `usi.${pkgobj.name}.js`));
    fs.copyFileSync(bpath_usits, fpath.join(cwd, copy_dir, `usi.${pkgobj.name}.ts`));
  }
  // .d.ts
  const bpath_dts = fpath.join(cwd, builddirlib, `yaneuraou.${pkgobj.name}.d.ts`);
  const bpath_module_dts = fpath.join(cwd, builddirlib, `yaneuraou.module.d.ts`);
  fs.writeFileSync(bpath_module_dts, `/// <reference types="emscripten" />

export interface YaneuraOuModule extends EmscriptenModule
{
  addMessageListener: (listener: (line: string) => void) => void;
  removeMessageListener: (listener: (line: string) => void) => void;
  postMessage: (command: string) => void;
  terminate: () => void;
  ccall: typeof ccall;
  FS: typeof FS;
}
`);
  fs.writeFileSync(bpath_dts, `/// <reference types="emscripten" />
import { YaneuraOuModule } from "./yaneuraou.module";

declare const ${pkgobj.exportname}: EmscriptenModuleFactory<YaneuraOuModule>;
export = ${pkgobj.exportname};
`);
  for(const copy_dir of dts_copy_dirs) {
    fs.copyFileSync(bpath_module_dts, fpath.join(cwd, copy_dir, `yaneuraou.module.d.ts`));
    fs.copyFileSync(bpath_dts, fpath.join(cwd, copy_dir, `yaneuraou.${pkgobj.name}.d.ts`));
  }
  // make
  execSync(`make -j${cpus} clean tournament COMPILER=em++ TARGET_CPU=WASM YANEURAOU_EDITION=${pkgobj.edition} TARGET=../${builddirlib}yaneuraou.${pkgobj.name}.js EM_EXPORT_NAME=${pkgobj.exportname} ${pkgobj.extra}`, { cwd: fpath.join(cwd, "source"), stdio: "inherit" });
  // compress, public copy
  for (const fext of ["js", "worker.js", "wasm"]) {
    const bfile = `yaneuraou.${pkgobj.name}.${fext}`;
    const bfile_br = `yaneuraou.${pkgobj.name}.${fext}.br`;
    const bfile_gz = `yaneuraou.${pkgobj.name}.${fext}.gz`;
    const bpath = fpath.join(cwd, builddirlib, bfile);
    const bpath_br = fpath.join(cwd, builddirlib, bfile_br);
    const bpath_gz = fpath.join(cwd, builddirlib, bfile_gz);
    const ws_br = fs.createWriteStream(bpath_br);
    const ws_gz = fs.createWriteStream(bpath_gz);
    if(!fs.existsSync(bpath)) {
      console.error(`file not found: ${bpath}`);
      process.exit(1);
    }
    for(const copy_dir of lib_copy_dirs) {
      fs.copyFileSync(bpath, fpath.join(cwd, copy_dir, bfile));
    }
    const { atime, mtime } = fs.statSync(bpath);
    ws_br.on('finish', () => {
      fs.utimesSync(bpath_br, atime, mtime);
      for(const copy_dir of lib_copy_dirs) {
        fs.copyFileSync(bpath_br, fpath.join(cwd, copy_dir, bfile_br));
        fs.utimesSync(fpath.join(cwd, copy_dir, bfile_br), atime, mtime);
      }
      console.log(`compress finished: ${bpath_br}`);
    });
    ws_gz.on('finish', () => {
      fs.utimesSync(bpath_gz, atime, mtime);
      for(const copy_dir of lib_copy_dirs) {
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
