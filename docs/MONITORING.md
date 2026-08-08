# مانیتورینگ — Saite Phase 1

## UptimeRobot (رایگان)

| نوع | URL | فاصله |
|-----|-----|-------|
| HTTP(s) | `https://saite.ir/api/health` | ۵ دقیقه |
| Keyword | `status":"ok"` در پاسخ health | ۵ دقیقه |

## لاگ‌ها

Pino JSONL → فایل → `tail -f` یا `jq`:

```bash
docker compose -f docker-compose.prod.yml logs -f app | jq '.level, .msg, .err'
```

## متریک‌های Docker

```bash
watch -n 5 'docker stats --no-stream'
```

## هشدارهای دستی

| نشانه | اقدام |
|-------|-------|
| CPU > 80% | بررسی queryهای سنگین Prisma |
| RAM > 7GB | افزایش swap یا scale up |
| Disk > 80% | پاکسازی لاگ / بکاپ‌های قدیمی |
| 5xx > 1% | بررسی `docker logs app` |

## فاز ۶+ (اختیاری)

- Prometheus + Grafana
- Sentry برای error tracking
- Alertmanager برای webhook به Telegram
