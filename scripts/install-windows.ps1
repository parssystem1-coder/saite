# ═══════════════════════════════════════════════════════════
#  نصب مقاوم در برابر قطعی شبکه — ویندوز / PowerShell
#
#  اجرا:  .\scripts\install-windows.ps1
#
#  چرا این اسکریپت؟
#  بسته‌های next (۳۵MB) و swc-win32 (۴۴MB) روی اتصال‌های ناپایدار
#  وسط دانلود قطع می‌شوند. pnpm پیشرفت را کش می‌کند، پس تکرار خودکار
#  با تنظیمات محافظه‌کارانه معمولاً کار را تمام می‌کند.
# ═══════════════════════════════════════════════════════════

$ErrorActionPreference = 'Continue'
$maxAttempts = 8

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  نصب وابستگی‌های پروژهٔ Saite" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ── بررسی pnpm ──────────────────────────────────────────
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "pnpm نصب نیست. در حال نصب..." -ForegroundColor Yellow
    npm install -g pnpm
}

# ── اعمال تنظیمات شبکه به‌صورت سراسری ───────────────────
# اگر .npmrc پروژه به هر دلیل خوانده نشود، این تنظیمات سراسری
# پشتیبان هستند.
Write-Host "اعمال تنظیمات شبکه..." -ForegroundColor Gray
pnpm config set fetch-timeout 900000        | Out-Null
pnpm config set fetch-retries 5             | Out-Null
pnpm config set fetch-retry-mintimeout 20000 | Out-Null
pnpm config set fetch-retry-maxtimeout 180000 | Out-Null
pnpm config set network-concurrency 2       | Out-Null

Write-Host "  fetch-timeout        = $(pnpm config get fetch-timeout)"
Write-Host "  fetch-retries        = $(pnpm config get fetch-retries)"
Write-Host "  network-concurrency  = $(pnpm config get network-concurrency)"
Write-Host ""

# ── تلاش‌های پیاپی ──────────────────────────────────────
for ($i = 1; $i -le $maxAttempts; $i++) {
    Write-Host "───────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host " تلاش $i از $maxAttempts" -ForegroundColor Yellow
    Write-Host "───────────────────────────────────────────" -ForegroundColor DarkGray

    pnpm install --network-concurrency=2

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
        Write-Host "  ✅ نصب با موفقیت کامل شد" -ForegroundColor Green
        Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
        Write-Host ""
        Write-Host "حالا اجرا کنید:" -ForegroundColor Cyan
        Write-Host "  pnpm dev" -ForegroundColor White
        Write-Host ""
        Write-Host "سپس در مرورگر باز کنید: http://localhost:3000" -ForegroundColor Gray
        Write-Host ""
        exit 0
    }

    Write-Host ""
    Write-Host "  ⚠ این تلاش ناتمام ماند." -ForegroundColor Yellow
    Write-Host "  پیشرفت دانلود کش شده و از دست نرفته است." -ForegroundColor Gray

    if ($i -lt $maxAttempts) {
        Write-Host "  ۱۵ ثانیه صبر و تلاش دوباره..." -ForegroundColor Gray
        Start-Sleep -Seconds 15
    }
}

# ── اگر همهٔ تلاش‌ها ناکام ماند ─────────────────────────
Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Red
Write-Host "  نصب پس از $maxAttempts تلاش کامل نشد" -ForegroundColor Red
Write-Host "═══════════════════════════════════════════" -ForegroundColor Red
Write-Host ""
Write-Host "گزینه‌های بعدی:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  ۱. اگر VPN یا پروکسی روشن است، خاموش کنید و دوباره اجرا کنید" -ForegroundColor White
Write-Host "     (رایج‌ترین علت — پروکسی‌ها روی فایل بزرگ مهلت کوتاه دارند)" -ForegroundColor Gray
Write-Host ""
Write-Host "  ۲. استفاده از رجیستری آینه:" -ForegroundColor White
Write-Host "     pnpm config set registry https://registry.npmmirror.com" -ForegroundColor Gray
Write-Host "     pnpm install" -ForegroundColor Gray
Write-Host "     pnpm config set registry https://registry.npmjs.org" -ForegroundColor Gray
Write-Host ""
Write-Host "  ۳. اتصال دیگر (هات‌اسپات موبایل) را امتحان کنید" -ForegroundColor White
Write-Host ""
exit 1
