#!/bin/sh
set -e

# ── اجرای migrationهای Prisma قبل از شروع سرور ──────────────────
# اگر DATABASE_URL تنظیم نباشد (مثلاً در build) skip می‌شود
if [ -n "$DATABASE_URL" ]; then
  echo "[entrypoint] Running prisma migrate deploy..."
  npx prisma migrate deploy
  echo "[entrypoint] Migrations applied successfully."
else
  echo "[entrypoint] WARNING: DATABASE_URL not set — skipping migrations."
fi

# ── اجرای دستور اصلی ──────────────────────────────────────────────
exec "$@"
