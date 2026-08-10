═══════════════════════════════════════════════════════════════════════════════
  راهنمای راه‌اندازی محیط توسعه Saite
═══════════════════════════════════════════════════════════════════════════════

🎯 بهترین استراتژی: Docker Compose
───────────────────────────────────────────────────────────────────────────────

چرا Docker؟
  ✅ یک دستور = همه چیز آماده (PostgreSQL + Redis)
  ✅ محیط تمیز — آلودگی سیستم‌عامل نمی‌شه
  ✅ Reproducible — همون env روی هر ماشین کار می‌کنه
  ✅ Stop/Start آسان
  ✅ نیاز به نصب مستقیم PostgreSQL و Redis نیست


═══════════════════════════════════════════════════════════════════════════════
  مرحله ۱: نصب ابزارها
═══════════════════════════════════════════════════════════════════════════════

1️⃣ Docker Desktop (الزامی)
   📥 https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe
   📖 https://docs.docker.com/desktop/install/windows-install/

   بعد از نصب، سیستم رو restart کن و Docker Desktop رو باز کن.
   صبر کن تا "Docker Desktop is running" ببینی.

   تست:
   > docker --version
   > docker-compose --version

2️⃣ Node.js 22+ (الزامی)
   📥 https://nodejs.org/dist/v22.12.0/node-v22.12.0-x64.msi
   📖 https://nodejs.org/

   تست:
   > node --version   # باید v22.x.x باشه
   > npm --version

3️⃣ Git (احتمالاً داری)
   📥 https://git-scm.com/download/win

   تست:
   > git --version


═══════════════════════════════════════════════════════════════════════════════
  مرحله ۲: بررسی وضعیت (اسکریپت تشخیص)
═══════════════════════════════════════════════════════════════════════════════

این دستور رو اجرا کن تا ببینی چی داری و چی کم داری:

> cd D:\saite
> powershell -ExecutionPolicy Bypass -File scripts\check-env.ps1

یا این دستور کوتاه:

> docker --version && node --version && npm --version && git --version


═══════════════════════════════════════════════════════════════════════════════
  مرحله ۳: شروع Containers (یک بار)
═══════════════════════════════════════════════════════════════════════════════

# شروع PostgreSQL + Redis در پس‌زمینه
> docker-compose -f docker-compose.dev.yml up -d

# بررسی وضعیت
> docker ps

# باید دو container ببینی:
#   saite-dev-db     (PostgreSQL 17)
#   saite-dev-redis  (Redis 7)

# صبر کن تا health check پاس بشه (حدود ۱۰ ثانیه)
> docker-compose -f docker-compose.dev.yml ps


═══════════════════════════════════════════════════════════════════════════════
  مرحله ۴: تنظیم Environment
═══════════════════════════════════════════════════════════════════════════════

# کپی فایل نمونه
> copy .env.example .env.local

# ویرایش .env.local
> notepad .env.local

# این مقادیر رو ست کن:
DATABASE_URL=postgresql://saite_user:saite_dev_password@localhost:5432/saite_dev
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_USE_MOCK=true
CUSTOMER_SESSION_SECRET=saite-dev-customer-secret-do-not-use-in-production

# ذخیره و ببند


═══════════════════════════════════════════════════════════════════════════════
  مرحله ۵: نصب Dependencies و Migration
═══════════════════════════════════════════════════════════════════════════════

# نصب پکیج‌ها (یک بار)
> npm install

# اجرای migration (ایجاد جدول‌ها در دیتابیس)
> npx prisma migrate deploy

# تولید Prisma Client
> npx prisma generate


═══════════════════════════════════════════════════════════════════════════════
  مرحله ۶: اجرای برنامه
═══════════════════════════════════════════════════════════════════════════════

# شروع Dev Server
> npm run dev

# باز کن: http://localhost:3000
# پنل ادمین: http://localhost:3000/admin


═══════════════════════════════════════════════════════════════════════════════
  دستورات مفید روزمره
═══════════════════════════════════════════════════════════════════════════════

# توقف Containers
> docker-compose -f docker-compose.dev.yml down

# شروع مجدد Containers
> docker-compose -f docker-compose.dev.yml up -d

# دیدن لاگ‌ها
> docker-compose -f docker-compose.dev.yml logs -f

# ریست کامل دیتابیس (⚠️ همه داده‌ها پاک می‌شه)
> docker-compose -f docker-compose.dev.yml down -v
> docker-compose -f docker-compose.dev.yml up -d
> npx prisma migrate deploy

# Prisma Studio (UI دیتابیس)
> npx prisma studio
# باز می‌شه: http://localhost:5555


═══════════════════════════════════════════════════════════════════════════════
  عیب‌یابی
═══════════════════════════════════════════════════════════════════════════════

❌ Docker not running
   → Docker Desktop رو باز کن و صبر کن تا کامل استارت بشه

❌ Port 5432 already in use
   → PostgreSQL محلی رو stop کن (Services.msc)
   → یا پورت رو عوض کن در docker-compose.dev.yml

❌ Port 3000 already in use
   > npm run dev -- -p 3001

❌ Database connection failed
   > docker ps  # ببین container بالا هست؟
   > docker-compose -f docker-compose.dev.yml logs db

❌ Redis connection failed
   > docker ps  # ببین redis container بالا هست؟
   > docker-compose -f docker-compose.dev.yml logs redis


═══════════════════════════════════════════════════════════════════════════════
  خلاصه سریع (برای اجرا)
═══════════════════════════════════════════════════════════════════════════════

# ۱. Containers رو بالا بیار
docker-compose -f docker-compose.dev.yml up -d

# ۲. Environment رو ست کن
copy .env.example .env.local
notepad .env.local

# ۳. نصب و setup
npm install
npx prisma migrate deploy
npx prisma generate

# ۴. اجرا
npm run dev

# ۵. باز کن
# http://localhost:3000
# http://localhost:3000/admin


═══════════════════════════════════════════════════════════════════════════════
  ساختار محیط توسعه
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│  Windows Host                                               │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Docker Desktop                                       │  │
│  │                                                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │ PostgreSQL  │  │    Redis    │  │  Next.js    │  │  │
│  │  │    :5432    │  │    :6379    │  │    :3000    │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  │       ▲                ▲                ▲            │  │
│  └───────│────────────────│────────────────│────────────┘  │
│          │                │                │               │
│          └────────────────┴────────────────┘               │
│                      localhost                              │
└─────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
  لینک‌های مفید
═══════════════════════════════════════════════════════════════════════════════

📦 Docker Desktop:     https://www.docker.com/products/docker-desktop/
🟢 Node.js:            https://nodejs.org/
🐘 PostgreSQL:         https://www.postgresql.org/download/
🔴 Redis:              https://redis.io/download
📘 Prisma Docs:        https://www.prisma.io/docs
📘 Next.js Docs:       https://nextjs.org/docs

═══════════════════════════════════════════════════════════════════════════════
