#!/bin/bash
pushd `dirname $0`
pushd ../
docker pull emscripten/emsdk:latest
docker run --rm -v ${PWD}:/src emscripten/emsdk:latest npm run-script build
