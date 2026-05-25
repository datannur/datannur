@echo off
setlocal
for %%I in ("%~dp0..\..\..") do set "PACKAGE_DIR=%%~fI"
rem Remove Mark-of-the-Web from shipped scripts (no-op if already clean).
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -LiteralPath '%PACKAGE_DIR%\app\scripts\windows' -Filter *.ps1 -File | Unblock-File"
powershell -NoProfile -ExecutionPolicy Bypass -File "%PACKAGE_DIR%\app\scripts\windows\common-startup.ps1" -Action install -Target app -PackageDir "%PACKAGE_DIR%"
pause
