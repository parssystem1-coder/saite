# Saite final complete bundle, payment included

این نسخه شامل همه اصلاحات قبلی به‌اضافه فاز 09 برای درگاه پرداخت است. شروع کار با `00-ARENA-INSTRUCTIONS/MASTER-PLAN.md` و سپس `PAYMENT-PHASE.md`.

جایگاه UI: `src/app/admin/(panel)/settings/payments/page.tsx`.

کدهای payment rule و adapter contract واقعی‌اند و تست دارند، اما اتصال واقعی زرین‌پال/IDPay، secret manager، database transaction و callback production باید توسط Arena در backend پیاده شود. UI به تنهایی پرداخت واقعی نیست.
