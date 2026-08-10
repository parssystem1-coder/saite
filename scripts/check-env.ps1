#!/usr/bin/env pwsh
# ═══════════════════════════════════════════════════════════
# Saite - Environment Check Script
# ═══════════════════════════════════════════════════════════
# این اسکریپت وضعیت محیط توسعه رو بررسی می‌کنه
# ═══════════════════════════════════════════════════════════

Write-Host "`n═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  بررسی محیط توسعه Saite" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════`n" -ForegroundColor Cyan

$issues = @()

# ─── 1. Docker ──────────────────────────────────────────
Write-Host "── Docker ──" -ForegroundColor Yellow
try {
    $dockerVer = docker --version 2>$null
    if ($dockerVer) {
        Write-Host "✅ $dockerVer" -ForegroundColor Green
    } else {
        Write-Host "❌ نصب نشده" -ForegroundColor Red
        $issues += "Docker نصب نشده → https://www.docker.com/products/docker-desktop/"
    }
} catch {
    Write-Host "❌ نصب نشده" -ForegroundColor Red
    $issues += "Docker نصب نشده → https://www.docker.com/products/docker-desktop/"
}

# ─── 2. Docker Compose ──────────────────────────────────
Write-Host "`n── Docker Compose ──" -ForegroundColor Yellow
try {
    $composeVer = docker-compose --version 2>$null
    if ($composeVer) {
        Write-Host "✅ $composeVer" -ForegroundColor Green
    } else {
        Write-Host "⚠️  نصب نشده (با Docker Desktop میاد)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  نصب نشده" -ForegroundColor Yellow
}

# ─── 3. Node.js ─────────────────────────────────────────
Write-Host "`n── Node.js ──" -ForegroundColor Yellow
try {
    $nodeVer = node --version 2>$null
    if ($nodeVer) {
        Write-Host "✅ Node.js $nodeVer" -ForegroundColor Green
        
        # بررسی نسخه
        $majorVer = [int]($nodeVer -replace 'v(\d+)\..*', '$1')
        if ($majorVer -lt 22) {
            Write-Host "⚠️  نسخه $nodeVer هست، اما 22+ نیاز است" -ForegroundColor Yellow
            $issues += "Node.js 22+ نیاز است → https://nodejs.org/"
        }
    } else {
        Write-Host "❌ نصب نشده" -ForegroundColor Red
        $issues += "Node.js نصب نشده → https://nodejs.org/"
    }
} catch {
    Write-Host "❌ نصب نشده" -ForegroundColor Red
    $issues += "Node.js نصب نشده → https://nodejs.org/"
}

# ─── 4. npm ─────────────────────────────────────────────
Write-Host "`n── npm ──" -ForegroundColor Yellow
try {
    $npmVer = npm --version 2>$null
    if ($npmVer) {
        Write-Host "✅ npm $npmVer" -ForegroundColor Green
    } else {
        Write-Host "❌ نصب نشده" -ForegroundColor Red
        $issues += "npm نصب نشده"
    }
} catch {
    Write-Host "❌ نصب نشده" -ForegroundColor Red
    $issues += "npm نصب نشده"
}

# ─── 5. Git ─────────────────────────────────────────────
Write-Host "`n── Git ──" -ForegroundColor Yellow
try {
    $gitVer = git --version 2>$null
    if ($gitVer) {
        Write-Host "✅ $gitVer" -ForegroundColor Green
    } else {
        Write-Host "❌ نصب نشده" -ForegroundColor Red
        $issues += "Git نصب نشده → https://git-scm.com/download/win"
    }
} catch {
    Write-Host "❌ نصب نشده" -ForegroundColor Red
    $issues += "Git نصب نشده → https://git-scm.com/download/win"
}

# ─── 6. node_modules ────────────────────────────────────
Write-Host "`n── Dependencies ──" -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules موجود است" -ForegroundColor Green
} else {
    Write-Host "❌ npm install اجرا نشده" -ForegroundColor Red
    $issues += "npm install لازم است"
}

# ─── 7. .env.local ──────────────────────────────────────
Write-Host "`n── Environment ──" -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "✅ .env.local موجود است" -ForegroundColor Green
    
    # بررسی DATABASE_URL
    $envContent = Get-Content .env.local -Raw
    if ($envContent -match "DATABASE_URL=postgresql://") {
        Write-Host "  ✅ DATABASE_URL تنظیم شده" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  DATABASE_URL تنظیم نشده" -ForegroundColor Yellow
        $issues += "DATABASE_URL در .env.local تنظیم نشده"
    }
    
    if ($envContent -match "REDIS_URL=redis://") {
        Write-Host "  ✅ REDIS_URL تنظیم شده" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  REDIS_URL تنظیم نشده" -ForegroundColor Yellow
        $issues += "REDIS_URL در .env.local تنظیم نشده"
    }
} else {
    Write-Host "❌ .env.local نیست" -ForegroundColor Red
    $issues += ".env.local لازم است → copy .env.example .env.local"
}

# ─── 8. Docker Containers ───────────────────────────────
Write-Host "`n── Containers ──" -ForegroundColor Yellow
try {
    $containers = docker ps --format "{{.Names}}" 2>$null
    if ($containers -match "saite-dev-db") {
        Write-Host "✅ PostgreSQL container در حال اجرا" -ForegroundColor Green
    } else {
        Write-Host "⚠️  PostgreSQL container اجرا نشده" -ForegroundColor Yellow
        $issues += "docker-compose -f docker-compose.dev.yml up -d"
    }
    
    if ($containers -match "saite-dev-redis") {
        Write-Host "✅ Redis container در حال اجرا" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Redis container اجرا نشده" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Docker در حال اجرا نیست" -ForegroundColor Yellow
    $issues += "Docker Desktop رو باز کن"
}

# ─── 9. Database Tables ─────────────────────────────────
Write-Host "`n── Database Tables ──" -ForegroundColor Yellow
try {
    $tableCount = docker exec saite-dev-db psql -U saite_user -d saite_dev -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>$null
    if ($tableCount) {
        $count = $tableCount.Trim()
        if ([int]$count -gt 0) {
            Write-Host "✅ دیتابیس: $count جدول" -ForegroundColor Green
        } else {
            Write-Host "⚠️  دیتابیس خالی است (migration لازم)" -ForegroundColor Yellow
            $issues += "npx prisma migrate deploy"
        }
    } else {
        Write-Host "⚠️  اتصال به دیتابیس ممکن نیست" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  اتصال به دیتابیس ممکن نیست" -ForegroundColor Yellow
}

# ─── خلاصه ──────────────────────────────────────────────
Write-Host "`n═══════════════════════════════════════" -ForegroundColor Cyan
if ($issues.Count -eq 0) {
    Write-Host "  ✅ همه چیز آماده است!" -ForegroundColor Green
    Write-Host "  می‌تونی npm run dev رو اجرا کنی" -ForegroundColor Green
} else {
    Write-Host "  ❌ $($issues.Count) مشکل شناسایی شد:" -ForegroundColor Red
    Write-Host "═══════════════════════════════════════`n" -ForegroundColor Cyan
    
    $i = 1
    foreach ($issue in $issues) {
        Write-Host "$i. $issue" -ForegroundColor Yellow
        $i++
    }
}
Write-Host "`n"
