@echo off
cd %~dp0
cd ..
rem docker pull emscripten/emsdk
docker run --rm -v %CD%:/src emscripten/emsdk:3.1.2 npm run-script build
