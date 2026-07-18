@echo off
setlocal
where node >nul 2>nul
if errorlevel 1 (
  echo MiniPMDB needs Node.js 20 or newer: https://nodejs.org/
  exit /b 1
)
node "%~dp0scripts\judge-demo.js" %*
