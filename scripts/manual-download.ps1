# ===========================================================
#  Saite - Manual tarball fetch (last-resort installer)
#
#  Usage:   .\scripts\manual-download.ps1
#
#  Why this exists:
#  pnpm does NOT resume partial downloads. Each retry restarts the
#  tarball from zero, so on a link that dies after ~20MB you can never
#  finish a 44MB file no matter how many times you retry.
#
#  This script uses BITS (the Windows background transfer service),
#  which DOES resume, then injects the files into the pnpm store.
# ===========================================================

$ErrorActionPreference = 'Stop'
$cacheDir = Join-Path $PSScriptRoot '..\.tarball-cache'
New-Item -ItemType Directory -Force -Path $cacheDir | Out-Null

$packages = @(
    @{ Name = 'next'
       Url  = 'https://registry.npmjs.org/next/-/next-16.2.12.tgz'
       File = 'next-16.2.12.tgz' },
    @{ Name = '@next/swc-win32-x64-msvc'
       Url  = 'https://registry.npmjs.org/@next/swc-win32-x64-msvc/-/swc-win32-x64-msvc-16.2.12.tgz'
       File = 'swc-win32-x64-msvc-16.2.12.tgz' }
)

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Manual download with resume support" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "BITS resumes interrupted transfers, unlike pnpm." -ForegroundColor Gray
Write-Host "You can stop this script and re-run it; it continues." -ForegroundColor Gray
Write-Host ""

foreach ($pkg in $packages) {
    $dest = Join-Path $cacheDir $pkg.File

    if (Test-Path $dest) {
        $sizeMB = [math]::Round((Get-Item $dest).Length / 1MB, 1)
        Write-Host ("  [have] {0} ({1} MB)" -f $pkg.Name, $sizeMB) -ForegroundColor Green
        continue
    }

    Write-Host ("  [get ] {0}" -f $pkg.Name) -ForegroundColor Yellow
    try {
        Start-BitsTransfer -Source $pkg.Url -Destination $dest -DisplayName $pkg.Name
        $sizeMB = [math]::Round((Get-Item $dest).Length / 1MB, 1)
        Write-Host ("  [done] {0} ({1} MB)" -f $pkg.Name, $sizeMB) -ForegroundColor Green
    }
    catch {
        Write-Host ("  [fail] {0}" -f $_.Exception.Message) -ForegroundColor Red
        Write-Host ""
        Write-Host "  BITS failed. Try downloading in your browser:" -ForegroundColor Yellow
        Write-Host ("    {0}" -f $pkg.Url) -ForegroundColor White
        Write-Host ("  Save it as: {0}" -f $dest) -ForegroundColor White
        Write-Host "  Then run this script again." -ForegroundColor Gray
        Write-Host ""
        exit 1
    }
}

Write-Host ""
Write-Host "Adding tarballs to the pnpm store..." -ForegroundColor Cyan
Write-Host ""

foreach ($pkg in $packages) {
    $dest = Join-Path $cacheDir $pkg.File
    pnpm store add $dest
    if ($LASTEXITCODE -ne 0) {
        Write-Host ("  Could not add {0} to store." -f $pkg.Name) -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Running install against the primed store..." -ForegroundColor Cyan
Write-Host ""
pnpm install --prefer-offline

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "  SUCCESS" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Run: pnpm dev" -ForegroundColor White
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "Install still failed. See docs/TROUBLESHOOTING.md" -ForegroundColor Red
exit 1
