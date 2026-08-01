# ===========================================================
#  Saite - Resilient dependency installer for Windows
#
#  Usage:   .\scripts\install-windows.ps1
#
#  Why this exists:
#  The "next" (35MB) and "@next/swc-win32-x64-msvc" (44MB) tarballs
#  time out on slow or throttled connections. This script uses very
#  conservative network settings and retries automatically.
#
#  NOTE: This file is intentionally ASCII-only. Persian text inside a
#  .ps1 file breaks Windows PowerShell 5.1, which reads scripts as ANSI
#  unless they carry a UTF-8 BOM.
# ===========================================================

$ErrorActionPreference = 'Continue'
$maxAttempts = 10

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Saite - installing dependencies" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "pnpm not found. Installing globally..." -ForegroundColor Yellow
    npm install -g pnpm
}

# Apply settings globally so they work even if the project .npmrc
# is missing or ignored.
Write-Host "Applying network settings..." -ForegroundColor Gray
pnpm config set fetch-timeout 1800000        | Out-Null   # 30 min
pnpm config set fetch-retries 10             | Out-Null
pnpm config set fetch-retry-mintimeout 20000 | Out-Null
pnpm config set fetch-retry-maxtimeout 300000| Out-Null
pnpm config set network-concurrency 1        | Out-Null

Write-Host ("  fetch-timeout       = {0}" -f (pnpm config get fetch-timeout))
Write-Host ("  fetch-retries       = {0}" -f (pnpm config get fetch-retries))
Write-Host ("  network-concurrency = {0}" -f (pnpm config get network-concurrency))
Write-Host ""
Write-Host "Downloading ~80MB. This can take a while on a slow link." -ForegroundColor Gray
Write-Host ""

for ($i = 1; $i -le $maxAttempts; $i++) {
    Write-Host "-----------------------------------------" -ForegroundColor DarkGray
    Write-Host (" Attempt {0} of {1}" -f $i, $maxAttempts) -ForegroundColor Yellow
    Write-Host "-----------------------------------------" -ForegroundColor DarkGray

    pnpm install --network-concurrency=1

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "=========================================" -ForegroundColor Green
        Write-Host "  SUCCESS - install completed" -ForegroundColor Green
        Write-Host "=========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next step:" -ForegroundColor Cyan
        Write-Host "  pnpm dev" -ForegroundColor White
        Write-Host ""
        Write-Host "Then open http://localhost:3000" -ForegroundColor Gray
        Write-Host ""
        exit 0
    }

    Write-Host ""
    Write-Host "  Attempt failed." -ForegroundColor Yellow

    if ($i -lt $maxAttempts) {
        Write-Host "  Waiting 20s before retrying..." -ForegroundColor Gray
        Start-Sleep -Seconds 20
    }
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Red
Write-Host ("  Failed after {0} attempts" -f $maxAttempts) -ForegroundColor Red
Write-Host "=========================================" -ForegroundColor Red
Write-Host ""
Write-Host "Try these, in order:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Turn OFF any VPN or proxy, then run again." -ForegroundColor White
Write-Host "     This is the most common cause of error 23." -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Use a phone hotspot instead of your current network." -ForegroundColor White
Write-Host ""
Write-Host "  3. Manual download - see docs/TROUBLESHOOTING.md" -ForegroundColor White
Write-Host ""
exit 1
