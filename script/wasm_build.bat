@echo off
cd %~dp0
cd ..
docker pull emscripten/emsdk
docker run --rm -v %CD%:/src emscripten/emsdk npm run-script build
