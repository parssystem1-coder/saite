# راهنمای Deploy — Saite

> VPS: 8GB RAM / 2 vCPU / 40GB SSD / Ubuntu 22.04+

## پیش‌نیازها

```bash
# روی VPS
sudo apt update && sudo apt install -y docker.io docker-compose-plugin nginx certbot
sudo systemctl enable docker
sudo usermod -aG docker $USER
# logout + login
```

## ۱. کد

```bash
git clone https://github.com/parssystem1-coder/saite.git /opt/saite
cd /opt/saite
git checkout arena/019fe061-saite
```

## ۲. env

```bash
cp .env.example .env.prod
nano .env.prod
```

مقادیر الزامی:

| متغیر | مقدار |
|-------|-------|
| `DATABASE_URL` | `postgresql://postgres:STRONG_PASS@db:5432/saite_prod` |
| `REDIS_URL` | `redis://redis:6379` |
| `NEXT_PUBLIC_SITE_URL` | `https://saite.ir` |
| `POSTGRES_PASSWORD` | رمز قوی |
| `DOMAIN` | `saite.ir` |
| `ADMIN_USERNAME` | — |
| `ADMIN_PASSWORD` | هش scrypt |
| `ADMIN_SESSION_SECRET` | — |
| `ZARINPAL_MERCHANT_ID` | — |
| `ANTHROPIC_API_KEY` | اختیاری |

## ۳. SSL اولیه

```bash
sudo certbot certonly --standalone -d saite.ir -d www.saite.ir
```

## ۴. Deploy

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## ۵. دیتابیس

```bash
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
# یا اگر اولین بار:
docker compose -f docker-compose.prod.yml exec app npx prisma db push
```

## ۶. بررسی سلامت

```bash
# process alive (برای Docker healthcheck)
curl -f https://saite.ir/api/health/live
# DB و Redis آمادهٔ سرویس‌دهی‌اند (برای monitoring خارجی)
curl -f https://saite.ir/api/health/ready
```

## به‌روزرسانی

```bash
cd /opt/saite
git pull origin arena/019fe061-saite
docker compose -f docker-compose.prod.yml up -d --build
```

## لاگ‌ها

```bash
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f nginx
```

## پشتیبان‌گیری

```bash
# دیتابیس
docker compose -f docker-compose.prod.yml exec db pg_dump -U postgres saite_prod > backup_$(date +%F).sql

# uploads
tar czf uploads_$(date +%F).tar.gz /opt/saite/public/uploads
```
