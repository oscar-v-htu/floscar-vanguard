# 🚀 RENDER DEPLOYMENT QUICK REFERENCE

## Your Production Secrets

**PASSWORD_PEPPER:** 
```
e604de30594d40e53613172732712d3a0cd29eed01d53c2a1d8cddf49b424903
```

**Save this somewhere safe.** You'll need it to configure Render.

---

## 5-Minute Deployment Steps

### 1. Go to render.com
- Sign in with GitHub
- Click "New +" → "Web Service"

### 2. Connect Your Repo
- Select: `oscar-v-htu/floscar-vanguard`
- Branch: `main`
- Click "Connect"

### 3. Configure Service
- **Build:** `npm ci --omit=dev`
- **Start:** `npm start`

### 4. Add Environment Variables ⭐
Copy-paste all these into the Environment section:

```
HOST=0.0.0.0
PORT=3000
NODE_ENV=production
COOKIE_SECURE=true
PASSWORD_PEPPER=e604de30594d40e53613172732712d3a0cd29eed01d53c2a1d8cddf49b424903
DATA_DIR=/var/data
SESSION_TTL_MS=86400000
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

### 5. Create & Deploy
- Click "Create Web Service"
- Wait 2-3 minutes for build ⏳

### 6. Add Persistent Disk
- Go to "Disk" tab
- Click "Add Disk"
- Path: `/var/data`
- Size: `1 GB`

---

## Test Your Deployment

Get your Render URL from the dashboard (e.g., `https://floscar-vanguard.onrender.com`)

### Health Check
```bash
curl https://your-url.onrender.com/api/health
```

Should return: `{"ok":true}`

### Manual Tests
1. Visit homepage
2. Go to `/login.html`
3. Register test account
4. Log in
5. Update profile
6. Verify it saved

---

## After Deployment is Live

Report back with your URL and I'll:
- ✓ Validate all endpoints
- ✓ Test SEO files
- ✓ Check HTTPS
- ✓ Verify user flows
- ✓ Monitor performance

---

## Support Files

- `RENDER-DEPLOYMENT-CHECKLIST.md` — Full step-by-step guide
- `.env.production-template` — Your production secrets
- `validate-deployment.sh` — Automated testing script
- `DEPLOY-COMMANDS.md` — All platform deployment commands

---

**Your site is ready. Deploy now!** 🎉
