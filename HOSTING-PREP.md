# Floscar Vanguard — Hosting Preparation Complete ✓

Your site is **ready for production hosting**. This document walks through the final checks and deployment paths.

---

## Pre-Deployment Checklist

### 1. **Git Repository Setup** ✓

Before pushing to GitHub, verify:

```bash
git status
```

**Required:**
- ✓ `.env` is **NOT** committed (in `.gitignore`)
- ✓ `data/users.json` is **NOT** committed (in `.gitignore`)
- ✓ `data/sessions.json` is **NOT** committed (in `.gitignore`)
- ✓ `node_modules/` is **NOT** committed (in `.gitignore`)

**Commit any changes:**
```bash
git add .
git commit -m "Site ready for hosting"
git push origin main
```

---

### 2. **Environment Configuration**

#### Local Development (Current)
Your `.env` file:
```env
HOST=127.0.0.1
PORT=3000
COOKIE_SECURE=false
PASSWORD_PEPPER=1c12cf9017fdfb0ea5be974bef1bf72a6179a691941122301adbf95acc771238
```

#### Production Configuration (Required)
When deploying, create a **new** `.env` on your host with:

```env
HOST=0.0.0.0
PORT=3000
COOKIE_SECURE=true
PASSWORD_PEPPER=[GENERATE A NEW LONG RANDOM SECRET]
SESSION_TTL_MS=86400000
DATA_DIR=/app/data

# Rate Limiting
LOGIN_WINDOW_MS=60000
LOGIN_MAX_ATTEMPTS=10
LOGIN_BLOCK_MS=300000
REGISTER_WINDOW_MS=60000
REGISTER_MAX_ATTEMPTS=5
REGISTER_BLOCK_MS=600000
DOWNLOAD_WINDOW_MS=60000
DOWNLOAD_MAX_ATTEMPTS=30
DOWNLOAD_BLOCK_MS=300000
```

**⚠️ IMPORTANT:**
- Generate a strong `PASSWORD_PEPPER` before deploying:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- Set `COOKIE_SECURE=true` in production (enforces HTTPS)
- Use `DATA_DIR=/app/data` or your host's persistent storage path

---

## Deployment Options

### **Option 1: Render (Recommended for Quick Deployment)**

Your `render.yaml` is configured and ready.

**Steps:**
1. Connect your GitHub repository to [Render](https://render.com)
2. Create a new **Web Service**
3. Select your repository and branch
4. Render auto-detects `render.yaml`
5. Set environment variables in Render dashboard:
   - `HOST=0.0.0.0`
   - `COOKIE_SECURE=true`
   - `PASSWORD_PEPPER=[NEW SECRET]`
   - `DATA_DIR=/var/data` (or Render's persistent disk mount)

**Note:** Attach a persistent disk for `/app/data` to avoid data loss on redeploy.

---

### **Option 2: Docker (Any Cloud Host)**

Your `Dockerfile` is optimized and production-ready.

**Build locally first:**
```bash
docker build -t floscar-vanguard .
docker run -p 3000:3000 \
  -e HOST=0.0.0.0 \
  -e COOKIE_SECURE=true \
  -e PASSWORD_PEPPER=[NEW SECRET] \
  -v /app/data \
  floscar-vanguard
```

**Deploy to:**
- **Heroku:** `heroku container:push web && heroku container:release web`
- **AWS ECS:** Push to ECR, deploy via Fargate
- **DigitalOcean App Platform:** Connect GitHub, set env vars
- **Azure Container Instances:** Push to ACR, deploy

---

### **Option 3: Traditional VPS (DigitalOcean, Hetzner, Linode)**

**Install Node.js (v18+):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Clone & Deploy:**
```bash
git clone <your-repo> /var/www/floscar-vanguard
cd /var/www/floscar-vanguard
npm install --omit=dev
```

**Create `.env` with production values**

**Run as a service (systemd):**
```ini
[Unit]
Description=Floscar Vanguard
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/floscar-vanguard
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
```

**Enable & start:**
```bash
sudo systemctl enable floscar-vanguard
sudo systemctl start floscar-vanguard
```

---

## Post-Deployment Validation

### **1. Health Check**
```bash
curl https://your-domain.com/api/health
# Expected: { "ok": true }
```

### **2. Site Accessibility**
- [ ] Homepage loads: `https://your-domain.com`
- [ ] Login page loads: `https://your-domain.com/login.html`
- [ ] Trends page loads: `https://your-domain.com/trends.html`
- [ ] Tools page loads: `https://your-domain.com/tools.html`

### **3. User Registration & Login Flow**
- [ ] Create test account via `/login.html`
- [ ] Log in successfully
- [ ] Profile page persists data
- [ ] Log out and log back in (session persistence)

### **4. HTTPS & Security**
- [ ] All assets load over HTTPS (no mixed-content warnings)
- [ ] Cookies are sent only over HTTPS (`SameSite=Strict`)
- [ ] HSTS headers present (if configured)

### **5. SEO Readiness**
- [ ] Robots.txt serves: `https://your-domain.com/robots.txt`
- [ ] Sitemap.xml serves: `https://your-domain.com/sitemap.xml`
- [ ] Canonical tags correct in source
- [ ] Open Graph metadata present

### **6. Database & Sessions**
- [ ] Create account → Check `data/users.json` on server
- [ ] Restart server → Session persists (users stay logged in)

---

## Domain Configuration

### **DNS Setup (Required)**

Point your domain registrar's DNS to your host:
- **Render:** Use provided DNS targets
- **Heroku:** `your-app.herokuapp.com` (or custom domain)
- **VPS:** Point A record to your server's IP

### **Subdomain Setup (Optional)**

Redirect `example.com` → `www.example.com`:
- **Render:** Configure domains in service settings
- **Heroku:** Add domain alias and set primary domain
- **VPS:** Configure nginx/Apache redirect

---

## Database Migration (Future)

Currently, data persists in JSON files. For production scaling, consider:

1. **SQLite** (local, simple)
   - No setup needed
   - Good for <10k users

2. **PostgreSQL** (scalable)
   - Rent from cloud provider (Heroku Postgres, Neon, etc.)
   - Add connection logic to `server.js`

3. **MongoDB** (flexible schema)
   - Rent from MongoDB Atlas
   - Add Mongoose ORM

---

## Monitoring & Maintenance

### **Logs**
- **Render:** Dashboard → Logs
- **Heroku:** `heroku logs --tail`
- **VPS:** `journalctl -u floscar-vanguard -f`

### **Backup Strategy**
1. **Daily backup** of `data/users.json` and `data/sessions.json`
2. **Weekly full backup** of entire database
3. **Test restore** quarterly

### **Security Updates**
```bash
# Weekly checks
npm outdated
npm audit fix --save
```

---

## Success Checklist ✓

- [ ] Git repo clean, `.env` not committed
- [ ] Production `.env` created with secure `PASSWORD_PEPPER`
- [ ] Deployment platform selected (Render / Docker / VPS)
- [ ] Environment variables set on host
- [ ] Site deployed and accessible
- [ ] Health check passes
- [ ] User registration & login tested
- [ ] HTTPS enabled with no warnings
- [ ] Robots.txt & sitemap.xml accessible
- [ ] Domain configured and resolving
- [ ] Monitoring logs flowing
- [ ] Backup strategy in place

---

## Quick Start: Render Deployment (Fastest)

```bash
# 1. Push to GitHub
git add .
git commit -m "Ready for production"
git push origin main

# 2. Go to https://render.com
# 3. Connect GitHub repo
# 4. Select "Web Service"
# 5. Render auto-detects render.yaml
# 6. Set env vars in dashboard
# 7. Deploy (takes ~2 min)
```

---

## Support & Troubleshooting

**Port 3000 already in use?**
```bash
lsof -i :3000
kill -9 <PID>
```

**Sessions not persisting?**
- Check `data/` directory exists and is writable
- Verify `DATA_DIR` env var points to correct path

**HTTPS mixed content warning?**
- Set `COOKIE_SECURE=true`
- Ensure all asset URLs use `https://`
- Check for hardcoded `http://` in templates

**Users not saving?**
- Check `data/users.json` file permissions
- Verify `PASSWORD_PEPPER` is set
- Look at server logs for errors

---

**Your site is production-ready. Deploy with confidence!** 🚀
