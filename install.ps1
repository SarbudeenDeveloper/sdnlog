# SDNLog - install, update, and run on Windows in one command:
#
#   irm https://raw.githubusercontent.com/SarbudeenDeveloper/sdnlog/main/install.ps1 | iex
#
# First run:  clones the app into %USERPROFILE%\.sdnlog, installs dependencies,
#             builds, and starts it at http://localhost:3456.
# Re-running: checks GitHub for updates - if there are new commits it pulls,
#             rebuilds, and restarts; otherwise it just makes sure the app
#             is running.
#
# Configuration (environment variables):
#   SDNLOG_PORT      port to serve on             (default: 3456)
#   SDNLOG_HOME      install location             (default: %USERPROFILE%\.sdnlog)
#   SDNLOG_DATA_DIR  where the SQLite db lives    (default: %SDNLOG_HOME%\data)
#   SDNLOG_BRANCH    branch to track              (default: main)
#   SDNLOG_NO_OPEN   set to 1 to skip opening the browser
#
# Local subcommands (after install):
#   powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\.sdnlog\app\install.ps1" stop
#   ... likewise: status | logs | uninstall

param([string]$Command = "run")

$ErrorActionPreference = "Stop"

$RepoUrl = if ($env:SDNLOG_REPO) { $env:SDNLOG_REPO } else { "https://github.com/SarbudeenDeveloper/sdnlog.git" }
$Branch  = if ($env:SDNLOG_BRANCH) { $env:SDNLOG_BRANCH } else { "main" }
$Root    = if ($env:SDNLOG_HOME) { $env:SDNLOG_HOME } else { Join-Path $env:USERPROFILE ".sdnlog" }
$AppDir  = Join-Path $Root "app"
$DataDir = if ($env:SDNLOG_DATA_DIR) { $env:SDNLOG_DATA_DIR } else { Join-Path $Root "data" }
$LogFile   = Join-Path $Root "server.log"
$ErrFile   = Join-Path $Root "server.err.log"
$BuildLog  = Join-Path $Root "build.log"
$PidFile   = Join-Path $Root "server.pid"
$BuiltFile = Join-Path $Root ".built-commit"
$PortFile  = Join-Path $Root ".port"
# Remember the port across runs so status/stop work without SDNLOG_PORT set.
$Port = if ($env:SDNLOG_PORT) { $env:SDNLOG_PORT }
        elseif (Test-Path $PortFile) { (Get-Content $PortFile -ErrorAction SilentlyContinue | Select-Object -First 1) }
        else { "3456" }
if (-not $Port) { $Port = "3456" }
$Url = "http://localhost:$Port"

function Info([string]$msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Ok([string]$msg)   { Write-Host " ok  $msg" -ForegroundColor Green }
function Fail([string]$msg) { Write-Host "error: $msg" -ForegroundColor Red; exit 1 }

function Get-ServerPid {
  if (-not (Test-Path $PidFile)) { return $null }
  $p = Get-Content $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $p) { return $null }
  if (Get-Process -Id $p -ErrorAction SilentlyContinue) { return $p }
  return $null
}

function Test-ServerHealthy {
  # Hit the loopback IP and bypass any configured proxy - corporate proxies
  # often intercept "localhost" and answer for it. curl.exe ships with Windows 10+.
  # (-s keeps stderr quiet; avoid 2> redirects, which can throw in PS 5.1.)
  & curl.exe -sf --noproxy "*" -o NUL "http://127.0.0.1:$Port" | Out-Null
  return ($LASTEXITCODE -eq 0)
}

function Stop-Server {
  $p = Get-ServerPid
  if ($p) {
    Info "Stopping SDNLog (pid $p)..."
    # /T kills the whole tree: next start spawns a next-server child process.
    & taskkill /PID $p /T /F | Out-Null
  }
  Remove-Item $PidFile -ErrorAction SilentlyContinue
}

switch ($Command) {
  "stop" {
    Stop-Server; Ok "SDNLog stopped."; exit 0
  }
  "status" {
    if ((Get-ServerPid) -and (Test-ServerHealthy)) {
      Ok "SDNLog is running at $Url (pid $(Get-ServerPid))."
    } else {
      Write-Host "SDNLog is not running."
    }
    exit 0
  }
  "logs" {
    Get-Content $LogFile -Tail 100 -Wait; exit 0
  }
  "uninstall" {
    Stop-Server
    Remove-Item -Recurse -Force $AppDir, $PidFile, $BuiltFile, $LogFile, $ErrFile -ErrorAction SilentlyContinue
    Ok "App removed. Your journal data was kept at $DataDir"
    Write-Host "     (delete it with: Remove-Item -Recurse -Force `"$DataDir`")"
    exit 0
  }
  "run" {}
  default { Fail "Unknown command: $Command (expected: stop | status | logs | uninstall)" }
}

# ---------------------------------------------------------------- prerequisites
if (-not (Get-Command git -ErrorAction SilentlyContinue))      { Fail "git is required. Install it from https://git-scm.com and re-run." }
if (-not (Get-Command node -ErrorAction SilentlyContinue))     { Fail "Node.js 20+ is required. Install it from https://nodejs.org and re-run." }
if (-not (Get-Command npm -ErrorAction SilentlyContinue))      { Fail "npm is required (it ships with Node.js)." }
if (-not (Get-Command curl.exe -ErrorAction SilentlyContinue)) { Fail "curl.exe is required (it ships with Windows 10 and later)." }
$nodeMajor = [int]((& node -v).TrimStart("v").Split(".")[0])
if ($nodeMajor -lt 20) { Fail "Node.js 20 or newer is required (found $(& node -v)). Update it from https://nodejs.org and re-run." }

New-Item -ItemType Directory -Force -Path $Root, $DataDir | Out-Null
Set-Content -Path $PortFile -Value $Port

# ------------------------------------------------------------- clone or update
$updated = $false
if (-not (Test-Path (Join-Path $AppDir ".git"))) {
  Info "Installing SDNLog into $AppDir..."
  & git clone --quiet --depth 1 --branch $Branch $RepoUrl $AppDir
  if ($LASTEXITCODE -ne 0) { Fail "git clone failed." }
  Ok "Downloaded SDNLog."
  $updated = $true
} else {
  Info "Checking for updates..."
  & git -C $AppDir fetch --quiet --depth 1 origin $Branch
  if ($LASTEXITCODE -ne 0) { Fail "git fetch failed - check your network connection." }
  $localRev  = (& git -C $AppDir rev-parse HEAD).Trim()
  $remoteRev = (& git -C $AppDir rev-parse "origin/$Branch").Trim()
  if ($localRev -ne $remoteRev) {
    Info "Update found - applying..."
    & git -C $AppDir reset --quiet --hard "origin/$Branch"
    Ok "Updated to the latest version."
    $updated = $true
  } else {
    Ok "Already up to date."
  }
}

# ------------------------------------------------------- install deps & build
$currentRev = (& git -C $AppDir rev-parse HEAD).Trim()
$builtRev = if (Test-Path $BuiltFile) { (Get-Content $BuiltFile -ErrorAction SilentlyContinue | Select-Object -First 1) } else { "" }
$needsRestart = $false
if (($currentRev -ne $builtRev) -or (-not (Test-Path (Join-Path $AppDir ".next\BUILD_ID")))) {
  Info "Installing dependencies (this can take a minute)..."
  & cmd /c "cd /d `"$AppDir`" && npm ci --no-audit --no-fund --loglevel=error"
  if ($LASTEXITCODE -ne 0) { Fail "npm ci failed." }
  Info "Building the app..."
  & cmd /c "cd /d `"$AppDir`" && npm run build > `"$BuildLog`" 2>&1"
  if ($LASTEXITCODE -ne 0) { Fail "Build failed - see $BuildLog" }
  Set-Content -Path $BuiltFile -Value $currentRev
  Ok "Build complete."
  $needsRestart = $true
}

# ------------------------------------------------------------------ start/stop
if ((-not $needsRestart) -and (Get-ServerPid) -and (Test-ServerHealthy)) {
  Ok "SDNLog is already running."
} else {
  Stop-Server
  if (Test-ServerHealthy) {
    Fail "Port $Port is in use by another app. Re-run with a different port, e.g.:`n       `$env:SDNLOG_PORT=4567; irm <install.ps1 url> | iex"
  }
  Info "Starting SDNLog on port $Port..."
  # Launch node directly (not next.cmd) so the pid we record owns the tree,
  # and keep the database outside the app checkout via SDNLOG_DATA_DIR.
  $env:SDNLOG_DATA_DIR = $DataDir
  $nextBin = Join-Path $AppDir "node_modules\next\dist\bin\next"
  $proc = Start-Process -FilePath "node" -ArgumentList @("`"$nextBin`"", "start", "-p", $Port) `
    -WorkingDirectory $AppDir -WindowStyle Hidden `
    -RedirectStandardOutput $LogFile -RedirectStandardError $ErrFile -PassThru
  Set-Content -Path $PidFile -Value $proc.Id
  $started = $false
  for ($i = 0; $i -lt 60; $i++) {
    if (Test-ServerHealthy) { $started = $true; break }
    if (-not (Get-ServerPid)) { break }
    Start-Sleep -Milliseconds 500
  }
  if (-not $started) { Fail "The app did not start - see $LogFile and $ErrFile" }
  Ok "SDNLog is running."
}

Write-Host ""
Write-Host "   Open $Url in your browser." -ForegroundColor White
Write-Host "   Your journal is stored in $DataDir"
Write-Host "   Re-run this same command anytime to update and restart."
Write-Host "   Stop it with: powershell -ExecutionPolicy Bypass -File `"$AppDir\install.ps1`" stop"
Write-Host ""

if (($env:SDNLOG_NO_OPEN -ne "1") -and $updated) {
  Start-Process $Url
}
