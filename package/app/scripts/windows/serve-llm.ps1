# serve-llm.ps1
# Launcher for the Python LLM proxy sidecar (app/scripts/python/proxy_llm.py).
# Waits for the app directory, checks Python availability and the script file,
# guards against duplicate launches, then starts the Python process.

$ErrorActionPreference = 'Stop'

$scriptPath  = $MyInvocation.MyCommand.Path
$PackageDir  = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $scriptPath)))
$proxyScript = Join-Path $PackageDir 'app\scripts\python\proxy_llm.py'

while (-not (Test-Path $PackageDir)) { Start-Sleep -Seconds 5 }

if (-not (Test-Path $proxyScript)) {
    Write-Host "serve-llm: python script not found at $proxyScript"
    exit 1
}

try {
    $null = & python --version 2>&1
    if ($LASTEXITCODE -ne 0) { throw "python --version failed" }
} catch {
    Write-Host "serve-llm: python not found in PATH"
    exit 1
}

# Duplicate-launch guard
try {
    $existing = Get-CimInstance Win32_Process -Filter "Name='python.exe'" |
        Where-Object { $_.CommandLine -and ($_.CommandLine -like '*proxy_llm*') }
    if ($existing) {
        Write-Host "serve-llm: proxy_llm already running (PID $($existing.ProcessId -join ','))"
        exit 0
    }
} catch {}

Write-Host "serve-llm: starting $proxyScript"
& python $proxyScript
