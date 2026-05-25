# serve-app.ps1
# Tiny static HTTP server for datannur, using System.Net.HttpListener.
# PowerShell 5.1+, zero dependencies. Serves files from the package root.
param(
    [int]$Port = 0,
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'

# --- Paths -------------------------------------------------------------------
$scriptPath = $MyInvocation.MyCommand.Path
$PackageDir = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $scriptPath)))
$configPath = Join-Path $PackageDir 'data\localhost-ports.config.json'

# --- Drive wait (defense in depth; bootstrap already waits) ------------------
while (-not (Test-Path $PackageDir)) { Start-Sleep -Seconds 5 }

# --- Port resolution ---------------------------------------------------------
if ($Port -le 0) {
    $Port = 61291
    if (Test-Path $configPath) {
        try {
            $cfg = Get-Content -Raw -LiteralPath $configPath | ConvertFrom-Json
            $p = [int]$cfg.appPort
            if ($p -gt 0) { $Port = $p }
        } catch {}
    }
}

# --- Duplicate-launch guard --------------------------------------------------
try {
    $probe = New-Object System.Net.Sockets.TcpClient
    $probe.Connect('localhost', $Port)
    $probe.Close()
    Write-Host "serve-app: port $Port already in use, assuming another instance is running"
    if (-not $NoBrowser) { Start-Process "http://localhost:$Port" }
    exit 0
} catch {
    # port free, proceed
}

# --- MIME map ----------------------------------------------------------------
$mime = @{
    '.html' = 'text/html; charset=utf-8'
    '.htm'  = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.mjs'  = 'application/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.xml'  = 'application/xml; charset=utf-8'
    '.txt'  = 'text/plain; charset=utf-8'
    '.md'   = 'text/markdown; charset=utf-8'
    '.csv'  = 'text/csv; charset=utf-8'
    '.ttl'  = 'text/turtle; charset=utf-8'
    '.map'  = 'application/json; charset=utf-8'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.gif'  = 'image/gif'
    '.webp' = 'image/webp'
    '.svg'  = 'image/svg+xml'
    '.ico'  = 'image/x-icon'
    '.pdf'  = 'application/pdf'
    '.woff' = 'font/woff'
    '.woff2'= 'font/woff2'
    '.ttf'  = 'font/ttf'
}

# --- In-memory cache ---------------------------------------------------------
$fileCache      = @{}
$cacheTotalBytes = [long]0
$cacheCapBytes   = [long](200MB)

function Get-CachedFile {
    param([string]$Path)
    $info = [IO.FileInfo]::new($Path)
    if (-not $info.Exists) { return $null }
    $mtime = $info.LastWriteTimeUtc.Ticks
    $len   = $info.Length

    $entry = $fileCache[$Path]
    if ($entry -and $entry.MTime -eq $mtime -and $entry.Length -eq $len) {
        return $entry
    }

    if ($entry) {
        $script:cacheTotalBytes -= $entry.Bytes.LongLength
        if ($entry.Gzip) { $script:cacheTotalBytes -= $entry.Gzip.LongLength }
    }

    $bytes = [IO.File]::ReadAllBytes($Path)
    if (($script:cacheTotalBytes + $bytes.LongLength) -gt $script:cacheCapBytes) {
        $script:fileCache.Clear()
        $script:cacheTotalBytes = 0
    }

    $entry = @{
        Bytes  = $bytes
        Gzip   = $null
        MTime  = $mtime
        Length = $len
        ETag   = '"{0:x}-{1:x}"' -f $mtime, $len
        LastModified = $info.LastWriteTimeUtc.ToString('R')
    }
    $script:fileCache[$Path] = $entry
    $script:cacheTotalBytes += $bytes.LongLength
    return $entry
}

function Get-GzipBytes {
    param($Entry)
    if ($Entry.Gzip) { return $Entry.Gzip }
    $ms = New-Object IO.MemoryStream
    $gz = New-Object IO.Compression.GZipStream($ms, [IO.Compression.CompressionLevel]::Optimal)
    $gz.Write($Entry.Bytes, 0, $Entry.Bytes.Length)
    $gz.Close()
    $result = $ms.ToArray()
    $ms.Close()
    $Entry.Gzip = $result
    $script:cacheTotalBytes += $result.LongLength
    return $result
}

# --- Listener ----------------------------------------------------------------
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try {
    $listener.Start()
} catch {
    Write-Host "serve-app: failed to start listener on port $Port : $_"
    exit 1
}
Write-Host "serve-app: listening on http://localhost:$Port/ (root: $PackageDir)"

if (-not $NoBrowser) { Start-Process "http://localhost:$Port/" }

$longCacheHeader = 'public, max-age=31536000, immutable'
$noCacheHeader   = 'no-cache'
$localBaseTag = '<base href="/" />'

function Test-SpaRoutePath {
    param([string]$UrlPath)
    if ([string]::IsNullOrEmpty($UrlPath) -or $UrlPath -eq '/') { return $false }

    $trimmed = $UrlPath.TrimStart('/')
    $firstSegment = ($trimmed -split '/', 2)[0]
    $leaf = [IO.Path]::GetFileName($trimmed)

    if ($leaf -like '*.*') { return $false }
    if (@('app', 'data', 'api') -contains $firstSegment) { return $false }
    return $true
}

while ($listener.IsListening) {
    try {
        $ctx = $listener.GetContext()
    } catch {
        break
    }

    $req = $ctx.Request
    $res = $ctx.Response
    try {
        $urlPath = [Uri]::UnescapeDataString($req.Url.AbsolutePath)
        if ($urlPath -eq '/' -or [string]::IsNullOrEmpty($urlPath)) { $urlPath = '/index.html' }
        $relPath = $urlPath.TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar)
        $fullPath = [IO.Path]::GetFullPath((Join-Path $PackageDir $relPath))

        # Path traversal check: require exact match OR prefix ending with separator
        $appRootNorm = [IO.Path]::GetFullPath($PackageDir).TrimEnd([IO.Path]::DirectorySeparatorChar)
        $sep = [IO.Path]::DirectorySeparatorChar
        $isInside = $fullPath.Equals($appRootNorm, [StringComparison]::OrdinalIgnoreCase) -or $fullPath.StartsWith($appRootNorm + $sep, [StringComparison]::OrdinalIgnoreCase)
        if (-not $isInside) {
            $res.StatusCode = 403
            $res.Close()
            continue
        }

        if ((Test-Path -LiteralPath $fullPath -PathType Container)) {
            $fullPath = Join-Path $fullPath 'index.html'
        }

        if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
            if (Test-SpaRoutePath -UrlPath $urlPath) {
                $fullPath = Join-Path $PackageDir 'index.html'
            } else {
                $res.StatusCode = 404
                $res.Close()
                continue
            }
        }

        $entry = Get-CachedFile -Path $fullPath
        if (-not $entry) {
            $res.StatusCode = 404
            $res.Close()
            continue
        }

        $ext = [IO.Path]::GetExtension($fullPath).ToLowerInvariant()
        $contentType = $mime[$ext]
        if (-not $contentType) { $contentType = 'application/octet-stream' }

        # Cache policy: manifest.json and index.html stay fresh, everything else is immutable
        $fileName = [IO.Path]::GetFileName($fullPath).ToLowerInvariant()
        $cacheHeader = if ($fileName -eq 'manifest.json' -or $fileName -eq 'index.html') { $noCacheHeader } else { $longCacheHeader }

        $res.Headers['Cache-Control'] = $cacheHeader
        $res.Headers['Vary']          = 'Accept-Encoding'
        $res.Headers['ETag']          = $entry.ETag
        $res.Headers['Last-Modified'] = $entry.LastModified

        # Conditional request
        $inm = $req.Headers['If-None-Match']
        $ims = $req.Headers['If-Modified-Since']
        $notModified = $false
        if ($inm -and $inm -eq $entry.ETag) { $notModified = $true }
        elseif ($ims) {
            try {
                $since = [DateTime]::Parse($ims).ToUniversalTime()
                $mt    = New-Object DateTime($entry.MTime, [DateTimeKind]::Utc)
                if (($mt - $since).TotalSeconds -le 1) { $notModified = $true }
            } catch {}
        }
        if ($notModified) {
            $res.StatusCode = 304
            $res.ContentLength64 = 0
            $res.Close()
            continue
        }

        $res.ContentType = $contentType

        $accept = $req.Headers['Accept-Encoding']
        $useGzip = $false
        if ($fileName -ne 'index.html' -and $accept -and $accept -match 'gzip' -and $entry.Bytes.Length -gt 1024) {
            if ($contentType -match '^(text/|application/json|application/javascript|application/xml|image/svg)') {
                $useGzip = $true
            }
        }

        if ($useGzip) {
            $body = Get-GzipBytes -Entry $entry
            $res.Headers['Content-Encoding'] = 'gzip'
        } elseif ($fileName -eq 'index.html') {
            $html = [Text.Encoding]::UTF8.GetString($entry.Bytes)
            $html = $html.Replace('<base href="" />', $localBaseTag)
            $body = [Text.Encoding]::UTF8.GetBytes($html)
        } else {
            $body = $entry.Bytes
        }

        $res.ContentLength64 = $body.LongLength
        $res.OutputStream.Write($body, 0, $body.Length)
    } catch {
        # Client disconnect or other transient error: swallow silently
    } finally {
        try { $res.Close() } catch {}
    }
}

$listener.Stop()
