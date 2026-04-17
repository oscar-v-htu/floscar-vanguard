# Render Deployment Checklist

## ✅ Pre-Deployment (Complete)

Your code is ready to deploy:
- ✓ Code pushed to GitHub (oscar-v-htu/floscar-vanguard)
- ✓ PASSWORD_PEPPER generated: `e604de30594d40e53613172732712d3a0cd29eed01d53c2a1d8cddf49b424903`
- ✓ All environment variables prepared
- ✓ Dockerfile configured
- ✓ render.yaml ready

---

## 🚀 MANUAL DEPLOYMENT STEPS (Requires Your GitHub Auth)

Since I cannot authenticate to your Render account, **you must complete these steps manually**:

### Step 1: Go to Render Dashboard

1. **Visit:** https://render.com
2. **Sign in with GitHub** (or create account)
   - ⚠️ IMPORTANT: This requires your GitHub authentication

### Step 2: Create Web Service

3. Click **"New +"** button (top-right)
4. Select **"Web Service"**

### Step 3: Connect Your Repository

5. **Select:** `oscar-v-htu/floscar-vanguard`
6. **Branch:** `main`
7. Click **"Connect"**

### Step 4: Configure Service

Leave all fields as default EXCEPT:

| Field | Value |
|-------|-------|
| **Name** | `floscar-vanguard` |
| **Build Command** | `npm ci --omit=dev` |
| **Start Command** | `npm start` |

### Step 5: Add Environment Variables ⭐ CRITICAL

**Scroll down to "Environment" section and add these variables:**

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

Click **"Add Environment Variable"** for each one.

### Step 6: Click "Create Web Service"

8. Render will now build and deploy automatically
9. **This takes about 2-3 minutes**

### Step 7: Add Persistent Storage (After Deploy Completes)

10. Go to **"Disk"** tab
11. Click **"Add Disk"**
12. Set:
    - **Mount path:** `/var/data`
    - **Size:** `1 GB`
13. Click **"Create"**

---

## ✅ After Deployment

Once Render shows a live URL (e.g., `https://floscar-vanguard.onrender.com`):

### Test Health Check

```bash
curl https://your-render-url.onrender.com/api/health
```

**Expected response:**
```json
{"ok":true}
```

### Full Validation

- [ ] Homepage loads
- [ ] Login page accessible
- [ ] Register test account
- [ ] Create account successfully
- [ ] Log in works
- [ ] Session persists (restart and log back in)
- [ ] Profile data saves
- [ ] No HTTPS warnings in console
- [ ] robots.txt accessible
- [ ] sitemap.xml accessible

---

## 🎯 Why I Can't Complete This Automatically

The final deployment requires:
1. **Your GitHub Authentication** - Only you can sign into your GitHub account
2. **Your Render Account** - Only you can access your Render dashboard
3. **Authorization** - Only you can authorize Render to access your repository

These are security-critical steps that must be done by you.

---

## 📋 What IS Automated

I've prepared:
- ✓ PASSWORD_PEPPER generated
- ✓ Environment variables listed
- ✓ render.yaml configured
- ✓ Dockerfile optimized
- ✓ Code pushed to GitHub
- ✓ All documentation ready

**Next:** Follow the manual steps above in the Render UI, then report back with your live URL and I'll validate everything!

---

## Optional: Render API Approach

If you have a Render API token and want full automation, you could provide it and I could deploy via their API. But this requires additional setup.

**Standard approach:** Complete the manual steps above in 5-10 minutes. ⏱️
