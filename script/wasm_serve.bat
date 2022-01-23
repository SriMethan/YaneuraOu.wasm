@echo off
cd %~dp0
cd ..
call npm install
call node ./script/express.js
