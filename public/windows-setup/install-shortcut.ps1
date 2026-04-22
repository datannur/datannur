# install-shortcut.ps1
# Create a Start Menu shortcut that opens index.html in a chromeless
# browser window via --app=. Server-less mode: no listener, no persistence,
# no PowerShell at runtime. LLM features are disabled in this mode.
param(
    [Parameter(Mandatory=$true)][string]$AppDir
)

$ErrorActionPreference = 'Stop'

# --- Paths -------------------------------------------------------------------
$startMenuDir = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'
$lnkPath      = Join-Path $startMenuDir 'datannur.lnk'
$indexPath    = Join-Path $AppDir 'index.html'
$localDir     = Join-Path $env:LOCALAPPDATA 'datannur'
$iconSrc      = Join-Path $AppDir 'assets\icon\icon.ico'
$iconDst      = Join-Path $localDir 'icon.ico'

if (-not (Test-Path $indexPath)) {
    throw "index.html not found at $indexPath"
}

# --- Browser detection (Edge, then Chrome) -----------------------------------
$candidates = @(
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
)
$browser = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) {
    throw "No supported browser found (Edge or Chrome)."
}

# --- Copy icon to a stable local location ------------------------------------
# The shortcut's IconLocation should point to a path the user keeps access to,
# independent of whether the app directory is a network share mounted on demand.
New-Item -ItemType Directory -Force -Path $localDir | Out-Null
if (Test-Path $iconSrc) {
    Copy-Item -LiteralPath $iconSrc -Destination $iconDst -Force
}

# --- Create shortcut ---------------------------------------------------------
$fileUrl = 'file:///' + ($indexPath -replace '\\', '/')

$WshShell = New-Object -ComObject WScript.Shell
$shortcut = $WshShell.CreateShortcut($lnkPath)
$shortcut.TargetPath       = $browser
$shortcut.Arguments        = "--app=`"$fileUrl`""
$shortcut.WorkingDirectory = Split-Path -Parent $browser
$shortcut.Description      = 'datannur (file:// mode)'
if (Test-Path $iconDst) { $shortcut.IconLocation = $iconDst }
$shortcut.Save()

Write-Host "==> datannur shortcut installed" -ForegroundColor Cyan
Write-Host "    $lnkPath"
Write-Host "    browser: $browser"
Write-Host "    target : $fileUrl"
Write-Host ""
Write-Host "Launch via Start menu, or search 'datannur'." -ForegroundColor Green
Write-Host "To uninstall: Start menu > right-click 'datannur' > Remove." -ForegroundColor Green
