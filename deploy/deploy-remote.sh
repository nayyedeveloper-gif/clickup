#!/usr/bin/env bash
# Run where your SSH key works: bash deploy/deploy-remote.sh
#
# Production EC2 (eu-north-1, Ubuntu) — override when your IP or path changes:
#   DEPLOY_HOST=ubuntu@13.51.235.24 DEPLOY_PATH=/var/www/29-management bash deploy/deploy-remote.sh

set -euo pipefail

DEPLOY_HOST="${DEPLOY_HOST:-ubuntu@13.51.235.24}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/29-management}"

ssh -o StrictHostKeyChecking=accept-new "${DEPLOY_HOST}" "
set -euo pipefail
cd '${DEPLOY_PATH}'
echo \"==> \$(pwd) (\$(git rev-parse --short HEAD 2>/dev/null || echo '?'))\"
git fetch origin
git checkout main
git pull origin main
export COMPOSER_ALLOW_SUPERUSER=1
composer install --no-dev --optimize-autoloader --no-interaction
if command -v npm >/dev/null 2>&1; then
  npm ci
  npm run build
else
  echo 'WARN: npm not found on server.' >&2
fi
php artisan migrate --force --no-interaction
php artisan optimize:clear
composer prod:optimize --no-interaction || (php artisan config:cache && php artisan event:cache)
php artisan storage:link 2>/dev/null || true
php artisan reverb:restart || true
if command -v supervisorctl >/dev/null 2>&1; then
  supervisorctl restart reverb:* 2>/dev/null || true
  supervisorctl restart laravel-worker:* 2>/dev/null || true
fi
echo \"==> Done (\$(git rev-parse --short HEAD))\"
"
