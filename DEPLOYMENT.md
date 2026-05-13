# Production deployment (SSH server)

**သင့် EC2 (AWS eu-north-1, Ubuntu) အတွက် အသေးစိတ်** — [deploy/EC2_AWS_SETUP.md](deploy/EC2_AWS_SETUP.md) (public IP, security group, IAM + S3, nginx HTTP bootstrap)။

မူလအက်ပ်ရပ်တည်သည့်ဖိုလ်ဒါမှာ deploy လမ်းညွှန်နှင့် ကိုက်ညီစေရန် **`/var/www/29-management`** ကို ဥပမာအဖြစ် သုံးထားသည်။ Server ပေါ်တွင် ကျသင့်သည့်အတိုင်း path/domain ပြင်ပါ။

---

## အလွယ်ဆုံး နည်းလမ်း — GitHub Actions (push တစ်ချက်နဲ့ deploy)

`main` သို့ push လုပ်လိုက်ရုံနဲ့ server ပေါ်မှာ script တိုးပါသည်။

### တစ်ကြိမ်လုပ်ရသော သတ်မှတ်ချက်များ

1. လုံခြုံရေးအတွက် **deploy-only SSH key** တစ်စုံ ဖန်တီးပါ (လက်ရှိ ကိုယ့်သုံးသင့် personal key မသုံးပါနှင့်)။
   ```bash
   ssh-keygen -t ed25519 -C "github-actions-deploy" -f ./gha_deploy -N ""
   ```
2. **Public key** (`gha_deploy.pub`) ကို server ပေါ်မှာ admin user (~/.ssh/authorized_keys) ထဲ ထည့်ပါ။
3. GitHub repo → **Settings → Secrets and variables → Actions** ထဲမှာ အောက်ပါတို့ ထည့်ပါ။

| Secret name | ဥပမာ အကြောင်းအရာ |
|-------------|-------------------|
| `DEPLOY_HOST` | `13.51.235.24` (public IPv4 သာ — user မပါရ) |
| `DEPLOY_USER` | `ubuntu` |
| `DEPLOY_PATH` | `/var/www/29-management` |
| `DEPLOY_SSH_KEY` | Private key မူလစာသား တစ်လုံးလုံး (`-----BEGIN OPENSSH PRIVATE KEY-----` …) |

4. `main` သို့ merge/push လုပ်ပါ — **Actions** tab မှာ workflow အောင်မြင်မှု စစ်ပါ။

Workflow ဖိုင် — `.github/workflows/deploy-production.yml`။ လက်ရှိလို လုပ်ချင်ရင် **Actions → Deploy production → Run workflow** ကနေ လည်း စတင်နိုင်ပါသည်။

> SSH မချိတ်သော Cursor စက်မှ မသရောက်ပါ။ လုံခြုံရေးအတွက် deploy key ကို GitHub Secrets ထဲသာ သိမ်းပါ။

---

## ဆယ်လက်များ (manual / script)

| ဖိုင် | ရည်ရွယ်ချက် |
|------|-------------|
| [deploy/EC2_AWS_SETUP.md](deploy/EC2_AWS_SETUP.md) | **EC2 + eu-north-1** production (console မှ instance အချက်အလက်) |
| `deploy/env.production.example` | `.env` ကော်ပီနမူနာ |
| `deploy/nginx/laravel-php.example.conf` | Laravel + PHP-FPM (domain + TLS) |
| `deploy/nginx/laravel-http-ip.example.conf` | **Public IP + HTTP** ယာယီ (Let's Encrypt မတိုင်မီ) |
| `deploy/nginx/reverb-subdomain.example.conf` | WebSocket အတွက် subdomain (အကြံပြု) |
| `deploy/nginx/reverb-same-host-locations.snippet.conf` | ဒိုမိန်နှင့်တူသော host ပေါ်မှာ `/app/`၊ `/apps/` proxy |
| `deploy/supervisor/reverb.conf.example` | Reverb process |
| `deploy/supervisor/laravel-queue.conf.example` | Queue worker |

---

## အဆင့် ၁ — Server ပြင်ဆင်

Ubuntu ဥပမာ။

```bash
sudo apt update
sudo apt install -y nginx php8.3-fpm php8.3-cli php8.3-mysql php8.3-mbstring php8.3-xml php8.3-curl php8.3-zip php8.3-bcmath php8.3-intl php8.3-redis mysql-server composer git supervisor certbot python3-certbot-nginx nodejs npm
```

PHP ဗားရှင်း ကိုယ့်စတက်နှင့် ကိုက်ညီအောင် ပြင်ပါ။

---

## အဆင့် ၂ — ကုဒ်ထည့်ခြင်း

```bash
sudo mkdir -p /var/www/29-management
sudo chown $USER:www-data /var/www/29-management
cd /var/www/29-management
git clone <your-repo-url> .
# သို့မဟုတ် rsync/scp ဖြင့် sync လုပ်ပါ
```

---

## အဆင့် ၃ — Environment

```bash
cp deploy/env.production.example .env
php artisan key:generate
nano .env   # DB, APP_URL, REVERB_*, VITE_* (build မတိုင်မီ)
```

**အရေးကြီးချက်**

- `APP_URL` နှင့် browser ရှိ URL တူညီရမည် (HTTPS)။
- Chat အတွက် `BROADCAST_CONNECTION=reverb`။
- Reverb နှစ်မျိုးမှ ရွေးပါ —
  - **Subdomain** (`reverb.example.com`) — nginx ဖိုင်မှာ `reverb-subdomain.example.conf` သုံး၊ `.env` မှာ `REVERB_HOST` က ဒီ hostname။
  - **တူညီသော host** — main nginx ထဲသို့ `reverb-same-host-locations.snippet.conf` ထည့်ပါ၊ `REVERB_HOST` က `APP_URL` hostname။

Client-side တူညီမှုအတွက် **`npm run build`** မလုပ်မီ `VITE_REVERB_*` များ `REVERB_*` နှင့် ကိုက်ညီရမည်။

`config/reverb.php` ထဲက `allowed_origins` ကို production မှာ `https://app.example.com` လို သင့်တော်သလို သတ်မှတ်ပါ။ `*` ဖြင့် စမ်းသပ်နိုင်သော်လည်း လုံခြုံရေး အားနည်းသည်။

---

## အဆင့် ၄ — Dependencies နှင့် build

```bash
composer install --no-dev --optimize-autoloader
npm ci
npm run build
php artisan storage:link
```

Database migrate။

```bash
php artisan migrate --force
```

ခွင့်ပြုချက်များ။

```bash
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R ug+rwx storage bootstrap/cache
```

---

## အဆင့် ၅ — Nginx

PHP ဖိုင်ကို `/etc/nginx/sites-available/` သို့ ကော်ပီပြုပြီး `sites-enabled` နှင့် symlink လုပ်ပါ။ WebSocket အတွက် subdomain သို့မဟုတ် snippet ထည့်ပါ။

```bash
sudo nginx -t && sudo systemctl reload nginx
```

TLS။

```bash
sudo certbot --nginx -d app.example.com -d reverb.example.com
```

(တူညီသော host သုံးပါက domain တစ်ခုတည်းသာ လိုအပ်နိုင်သည်။)

---

## အဆင့် ၆ — Supervisor (Reverb + Queue)

```bash
sudo cp deploy/supervisor/reverb.conf.example /etc/supervisor/conf.d/reverb.conf
sudo cp deploy/supervisor/laravel-queue.conf.example /etc/supervisor/conf.d/laravel-queue.conf
sudo nano /etc/supervisor/conf.d/reverb.conf   # paths စစ်
sudo supervisorctl reread && sudo supervisorctl update && sudo supervisorctl start all
```

---

## အဆင့် ၇ — Optimize

ဒီပရောဂျက်တွင် `routes/web.php` အတွင်း closure routes ရှိသဖြင့် **`php artisan route:cache` မသုံးပါနှင့်** (ပျက်နိုင်သည်)။

```bash
php artisan optimize:clear
composer prod:optimize
# သို့ @php artisan config:cache && php artisan event:cache
```

Deploy ပြီးတိုင်း သို့မဟုတ် env ပြောင်းပြီးနောက်မှာ အောက်ပါကို ထပ်လုပ်ပါ။

```bash
php artisan reverb:restart
sudo supervisorctl restart reverb:*
sudo supervisorctl restart laravel-worker:*
```

---

## နောက်ထပ် ကုဒ်တင်ခြင်း (ရိုးရှင်း workflow)

```bash
cd /var/www/29-management
git pull
composer install --no-dev --optimize-autoloader
npm ci && npm run build
php artisan migrate --force
php artisan optimize:clear
composer prod:optimize
php artisan reverb:restart
sudo supervisorctl restart laravel-worker:*
```

---

## ပြဿနာရှင်း checklist

1. **WebSocket မချိတ်** — Reverb process နေရင်၊ nginx proxy、`REVERB_HOST`/`PORT`/`SCHEME` နှင့် `VITE_REVERB_*` တူညီမှု၊ firewall ထဲမှာ 8080 ခွင့်ပြုရမည်မှာ nginx သာကြားပါက ပြင်ပသို့ မဖွင့်ရပါ။
2. **403 broadcasting auth** — Session cookie `SESSION_DOMAIN` / `SANCTUM_STATEFUL_DOMAINS` / HTTPS `SameSite` စစ်ပါ။
3. **Queue** — email တို့ queued ဖြစ်ပါက `laravel-worker` လည်နေရမည်။

အသေးစိတ်သည် [Laravel Reverb — Running Reverb in Production](https://laravel.com/docs/reverb#production) ကို ကိုးကားပါ။
