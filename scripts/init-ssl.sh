#!/bin/bash
# اسکریپت اولیه‌سازی SSL برای اولین deploy
# Usage: ./scripts/init-ssl.sh saite.ir

set -e

DOMAIN=${1:-saite.ir}
EMAIL=${2:-admin@saite.ir}

echo "[init-ssl] Domain: $DOMAIN"

# ۱. nginx temp بدون SSL برای certbot
mkdir -p nginx/conf.d

cat > nginx/conf.d/init.conf <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        return 200 "Initializing...";
    }
}
EOF

# ۲. certbot standalone
echo "[init-ssl] Obtaining certificate..."
sudo certbot certonly --standalone -d "$DOMAIN" --agree-tos --no-eff-email -m "$EMAIL"

# ۳. پاکسازی temp
echo "[init-ssl] Cleaning up..."
rm -f nginx/conf.d/init.conf

echo "[init-ssl] Done. SSL certificates at /etc/letsencrypt/live/$DOMAIN/"
