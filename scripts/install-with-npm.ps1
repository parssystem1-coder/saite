# ===========================================================
#  Saite - Resilient dependency install for Windows
#
#  Usage:   .\scripts\install-with-npm.ps1
#
#  Why this exists:
#  The "next" (35MB) and "@next/swc-win32-x64-msvc" (44MB) tarballs
#  time out on slow or throttled links. This script applies very
#  conservative network settings and retries automatically.
#
#  npm is the project's package manager. Plain "npm install" works
#  fine on a stable connection - use this script only if downloads
#  keep dropping.
# ===========================================================

$ErrorActionPreference = 'Continue'

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Saite - installing with npm" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Long timeouts and generous retries.
Write-Host "Applying npm network settings..." -ForegroundColor Gray
npm config set fetch-timeout 1800000        | Out-Null   # 30 min
npm config set fetch-retries 10             | Out-Null
npm config set fetch-retry-mintimeout 20000 | Out-Null
npm config set fetch-retry-maxtimeout 300000| Out-Null
npm config set maxsockets 3                 | Out-Null

Write-Host ("  fetch-timeout = {0}" -f (npm config get fetch-timeout))
Write-Host ("  fetch-retries = {0}" -f (npm config get fetch-retries))
Write-Host ("  maxsockets    = {0}" -f (npm config get maxsockets))
Write-Host ""
Write-Host "Downloading roughly 80MB. Please be patient." -ForegroundColor Gray
Write-Host "npm resumes interrupted downloads, so re-running is safe." -ForegroundColor Gray
Write-Host ""

for ($i = 1; $i -le 5; $i++) {
    Write-Host "-----------------------------------------" -ForegroundColor DarkGray
    Write-Host (" Attempt {0} of 5" -f $i) -ForegroundColor Yellow
    Write-Host "-----------------------------------------" -ForegroundColor DarkGray

    npm install --no-audit --no-fund

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "=========================================" -ForegroundColor Green
        Write-Host "  SUCCESS" -ForegroundColor Green
        Write-Host "=========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Start the dev server with:" -ForegroundColor Cyan
        Write-Host "  npm run dev" -ForegroundColor White
        Write-Host ""
        Write-Host "Then open http://localhost:3000" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Next step: npm run dev" -ForegroundColor DarkGray
        Write-Host ""
        exit 0
    }

    Write-Host ""
    Write-Host "  Attempt failed. npm keeps what it already fetched." -ForegroundColor Yellow

    if ($i -lt 5) {
        Write-Host "  Waiting 20s..." -ForegroundColor Gray
        Start-Sleep -Seconds 20
    }
}

Write-Host ""
Write-Host "Still failing. Next things to try:" -ForegroundColor Red
Write-Host "  1. Turn off VPN or proxy" -ForegroundColor White
Write-Host "  2. Use a phone hotspot" -ForegroundColor White
Write-Host "  3. See docs/TROUBLESHOOTING.md" -ForegroundColor White
Write-Host ""
exit 1
