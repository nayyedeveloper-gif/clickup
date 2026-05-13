# EC2 production — AWS (eu-north-1) နှင့် ချိန်ညှိခြင်း

ဤစာတမ်းသည် AWS Console မှ **EC2 instance summary** နှင့် **Connect** မျက်နှြင်များအရ production server ကို တင်ဆောင်ရန် အဆင့်များကို စုစည်းထားသည်။ လက်ရှိဥပမာ (ပြောင်းလဲနိုင်သည်) —

| အချက် | တန်ဖိုး (ဥပမာ) |
|--------|----------------|
| Region | `eu-north-1` (Stockholm) |
| OS user | `ubuntu` |
| Public IPv4 | `13.51.235.24` |
| Instance ID | `i-050e8f2c4466e6223` |
| VPC | `vpc-07b577cf6c48a693e` |
| Security group | `sg-0132a135820559417` |
| S3 bucket (repo `.env.example` နှင့် ကိုက်ညီ) | `clickup-854209350046-eu-north-1-an` |

> **Elastic IP မရှိသေးပါက** instance ကို stop/start လုပ်လျှင် public IP ပြောင်းသွားနိုင်သည်။ production အတွက် **Elastic IP ချိတ်ပြီး** DNS A record ထားရန် အကြံပြုသည်။

---

## ၁ — Security group (inbound)

AWS Console → EC2 → Security groups → `launch-wizard-1` (သို့ သင်သုံးသော SG) → Inbound rules —

| Type | Port | Source | ရည်ရွယ်ချက် |
|------|------|--------|-------------|
| SSH | 22 | သင့်ရုံး IP သို့ /32 | စီမံခန့်ခွဲမှု |
| HTTP | 80 | 0.0.0.0/0 | Web + Let’s Encrypt |
| HTTPS | 443 | 0.0.0.0/0 | TLS (domain ရှိလျှင်) |

Reverb ကို **nginx မှ reverse proxy** လုပ်ပါက port `8080` ကို ပြင်ပသို့ မဖွင့်ရပါ (Laravel docs အတိုင်း)။

---

## ၂ — S3 နှင့် IAM (အကြံပြု)

Console မှာ instance မှာ **IAM role မရှိသေးပါ**။ `FILESYSTEM_PUBLIC_DRIVER=s3` သုံးမည်ဆိုပါက —

1. IAM → Roles → **Create role** → Trusted entity: **EC2**.
2. Permission: `deploy/aws/s3-bucket-instance-policy.example.json` ကို ကိုးကားပြီး သင့် bucket ARN နှင့် ကိုက်ညီအောင် ပြင်ပါ (သို့ S3 managed **AmazonS3FullAccess** ကို စမ်းသပ်အတွက်သာ သုံး၍ နောက်မှ ကျဉ်းပါ)။
3. EC2 → Instance → **Actions → Security → Modify IAM role** မှ role ချိတ်ပါ။

ထိုသို့လုပ်ပါက `.env` တွင် `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` မထည့်ဘဲ instance metadata မှ credentials ရသည် (လုံခြုံရေးကောင်းသည်)။ role မသုံးပါက access key များကို server `.env` တွင်သာ သိမ်းပါ — Git ထဲ မတင်ပါနှင့်။

**S3 CORS** — browser မှ avatar/attachment URL တိုက်ရိုက်ဖတ်ပါက bucket CORS မှာ `GET` အတွက် သင့် `APP_URL` origin ထည့်ပါ။

---

## ၃ — Server ပက်ကေ့ချ် (Ubuntu)

`DEPLOYMENT.md` အဆင့် ၁ ကို လိုက်နာပြီး PHP 8.3, nginx, MySQL/MariaDB, Composer, Node, supervisor ထည့်ပါ။

အက်ပ် path ဥပမာ (deploy script နှင့် ကိုက်ညီစေရန်) —

```text
/var/www/29-management
```

---

## ၄ — ကုဒ်နှင့် `.env`

```bash
sudo mkdir -p /var/www/29-management
sudo chown ubuntu:www-data /var/www/29-management
cd /var/www/29-management
git clone <your-repo-url> .
cp deploy/env.production.example .env
php artisan key:generate
nano .env
```

ထည့်သင့်သော အချက်များ —

- `APP_URL` — domain ရှိလျှင် `https://your-domain.com`။ domain မရှိသေးပါက ယာယီ `http://13.51.235.24` (IP ပြောင်းပါ)။
- `APP_URL` သည် HTTP ဖြစ်လျှင် `SESSION_SECURE_COOKIE=false` ထားပါ (HTTPS ပြီးမှ `true`)။
- `AWS_DEFAULT_REGION=eu-north-1` နှင့် bucket / `AWS_URL` သည် Stockholm bucket နှင့် တူညီရမည်။
- `BROADCAST_CONNECTION=reverb` နှင့် `REVERB_*` / `VITE_REVERB_*` — `DEPLOYMENT.md` ကို ဖတ်ပါ။

```bash
composer install --no-dev --optimize-autoloader
npm ci && npm run build
php artisan storage:link
php artisan migrate --force
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R ug+rwx storage bootstrap/cache
```

---

## ၅ — Nginx

- **Domain + TLS ရှိပါက** — `deploy/nginx/laravel-php.example.conf` ကို ကော်ပီပြုပြီး `server_name` နှင့် path ပြင်ပါ။
- **Public IP ဖြင့် HTTP ယာယီစမ်းပါက** — `deploy/nginx/laravel-http-ip.example.conf` ကို သုံးပါ (`server_name` မှာ သင့် public IP)။

```bash
sudo ln -s /etc/nginx/sites-available/29-management /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Domain ရှိလျှင် —

```bash
sudo certbot --nginx -d your-domain.com
```

---

## ၆ — Supervisor (Reverb + queue)

```bash
sudo cp deploy/supervisor/reverb.conf.example /etc/supervisor/conf.d/reverb.conf
sudo cp deploy/supervisor/laravel-queue.conf.example /etc/supervisor/conf.d/laravel-queue.conf
```

ဖိုင်တွင်းရှိ `directory=` နှင့် `command=` path များကို `/var/www/29-management` နှင့် သင့် PHP binary နှင့် ကိုက်ညီအောင် ပြင်ပါ။ ပြီးလျှင် —

```bash
sudo supervisorctl reread && sudo supervisorctl update && sudo supervisorctl start all
```

---

## ၇ — လက်ရှိမှ remote deploy

လက်ခံ SSH key ထည့်ပြီးနောက် (GitHub Actions သို့ လက်ဖြင့်) —

```bash
DEPLOY_HOST=ubuntu@13.51.235.24 DEPLOY_PATH=/var/www/29-management bash deploy/deploy-remote.sh
```

IP ပြောင်းလျှင် `DEPLOY_HOST` ကို ပြင်ပါ။

---

## ပြဿနာရှင်း အတိုချုပ်

| ပြဿနာ | စစ်ဆေးရန် |
|--------|-----------|
| 502 Bad Gateway | `php8.3-fpm` လည်မှု၊ nginx `fastcgi_pass` socket |
| S3 403 / upload မရ | IAM role သို့မဟုတ် keys၊ bucket policy၊ `FILESYSTEM_PUBLIC_DRIVER` |
| WebSocket မချိတ် | Reverb process၊ nginx proxy、`VITE_REVERB_*` build ပြန်လုပ် |
| Session မထိန်းသိမ်း | `APP_URL` နှင့် cookie domain / `SESSION_SECURE_COOKIE` နှင့် HTTPS ကိုက်ညီမှု |

ပိုမိုအသေးစိတ် — [DEPLOYMENT.md](../DEPLOYMENT.md)။
