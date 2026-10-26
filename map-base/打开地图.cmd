@echo off
setlocal
cd /d "%~dp0"
where node.exe >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Please install Node.js, then try again.
  pause
  exit /b 1
)
node scripts\open-preview.mjs
if errorlevel 1 pause
