@echo off
setlocal
for %%I in ("%~dp0..") do set "APP_DIR=%%~fI"
rem Remove Mark-of-the-Web from shipped scripts (no-op if already clean).
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -LiteralPath '%APP_DIR%\windows-setup' -Filter *.ps1 -File | Unblock-File"
powershell -NoProfile -ExecutionPolicy Bypass -File "%APP_DIR%\windows-setup\common-startup.ps1" -Action install -Target llm -AppDir "%APP_DIR%"
pause
