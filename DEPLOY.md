# Floscar Vanguard Hosting Guide

This project is a Node.js server, not a static-only website. It must be deployed to a host that can run `node server.js` and keep a writable data directory for:

- `users.json`
- `sessions.json`

## What Was Prepared

- `server.js` now defaults to `HOST=0.0.0.0` for cloud hosting.
- `server.js` now supports `DATA_DIR` so you can mount persistent storage.
- `server.js` now exposes `GET /api/health` for host health checks.
- `server.js` now respects `x-forwarded-proto`, which fixes HTTPS origin checks behind proxy hosts.
- `Dockerfile` and `.dockerignore` were added for container-based deployment.

## Best Hosting Options

### Option 1: VPS or VM

Best if you want full control and stable file persistence.

Examples:

- DigitalOcean Droplet
- Hetzner Cloud
- Linode
- AWS EC2

Use this if you want the simplest long-term behavior with the current JSON-file storage.

### Option 2: Render or Railway

Works well for quick public deployment, but you should attach persistent storage or move to a database later.

Important:

- If the host filesystem is ephemeral, user/session data may reset on redeploy or restart.
- Set `DATA_DIR` to the mounted persistent volume path when your host supports it.

### Option 3: Docker Anywhere

Use the included `Dockerfile` on any VPS, container host, or platform that accepts Docker images.

## Required Environment Variables

Minimum production values:

```env
HOST=0.0.0.0
PORT=3000
COOKIE_SECURE=true
PASSWORD_PEPPER=use-a-long-random-secret-value
SESSION_TTL_MS=86400000
DATA_DIR=/persistent-data
```

Recommended login/rate-limit values are already shown in `.env.example`.

## Local Production-Like Test

```powershell
npm install
$env:HOST="0.0.0.0"
$env:PORT="3000"
$env:COOKIE_SECURE="false"
$env:PASSWORD_PEPPER="local-test-secret"
npm start
```

Health check:

```text
http://127.0.0.1:3000/api/health
```

## Deploy on Render

Fastest path: use the included `render.yaml` blueprint.

### Step 0: Push This Repo To GitHub

This workspace is already a git repository, but it currently has no configured remote.

Run this first from the project folder:

```powershell
git status
git add .
git commit -m "Prepare Floscar Vanguard for live deployment"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

If you already created a GitHub repo and want to verify the remote afterward:

```powershell
git remote -v
```

Render setup:

1. Push this project to GitHub.
2. In Render, choose Blueprint and connect the repository.
3. Render will read `render.yaml` and provision the web service plus persistent disk.
4. After the first deploy, open the service URL and verify `/api/health`.

### First Render Verification Order

After Render finishes the first deployment, verify in this order:

1. open the Render URL root page
2. open `/api/health`
3. register a fresh account
4. log out and log back in
5. save a profile update
6. open `tools.html` and confirm tool packet history works
7. open `trends.html` and confirm trend snapshot history works
8. then attach the custom domain and repeat the same checks over HTTPS

Manual fallback: create a new Web Service and point it to this project.

Settings:

- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/api/health`

Environment variables:

- `HOST=0.0.0.0`
- `COOKIE_SECURE=true`
- `PASSWORD_PEPPER=<long-random-secret>`
- `DATA_DIR=<persistent-disk-mount-or-default-data-path>`

If you attach a persistent disk, point `DATA_DIR` at that mount path.

## Recommended First Live Launch

For this codebase, the cleanest first public release is:

1. deploy with Render using `render.yaml`
2. verify `https://your-service.onrender.com/api/health`
3. add your root domain and `www`
4. set one canonical redirect, preferably `www` to root or root to `www`
5. test login, logout, profile save, and tool packet history over HTTPS

Recommended default for this brand site: use `www.floscarvanguard.com` as canonical and redirect the root domain to `www`.

## Deploy on Railway

Create a new project from the repo or local upload.

Settings:

- Start command: `npm start`
- Health check path: `/api/health`

Environment variables:

- `HOST=0.0.0.0`
- `COOKIE_SECURE=true`
- `PASSWORD_PEPPER=<long-random-secret>`
- `DATA_DIR=<mounted-volume-path-if-used>`

## Deploy with Docker

Build:

```powershell
docker build -t floscar-vanguard .
```

Run:

```powershell
docker run -d \
  -p 3000:3000 \
  -e HOST=0.0.0.0 \
  -e PORT=3000 \
  -e COOKIE_SECURE=true \
  -e PASSWORD_PEPPER=change-this-secret \
  -e DATA_DIR=/app/data \
  -v floscar-data:/app/data \
  --name floscar-vanguard \
  floscar-vanguard
```

## Domain and WWW Setup

After deployment, connect your domain like this:

- Root domain: `floscarvanguard.com`
- WWW alias: `www.floscarvanguard.com`

Important naming constraint:

- DNS names cannot contain spaces, so `www.FLOSCAR VANGUARD.COM` is not a valid domain string.
- The valid web form of that brand name is `www.floscarvanguard.com`.

Typical DNS pattern:

- `www` CNAME to your host-provided target
- root/apex domain via A record, ALIAS, or ANAME depending on your DNS provider and host

In your hosting dashboard:

- add both the root domain and `www`
- enable automatic HTTPS
- choose either root-to-www redirect or www-to-root redirect and keep one canonical version

Recommended canonical choice for Floscar Vanguard:

- canonical: `www.floscarvanguard.com`
- redirect: `floscarvanguard.com` -> `www.floscarvanguard.com`

### Recommended Host Dashboard Order

1. deploy successfully on the temporary Render domain
2. confirm `/api/health` and authenticated flows work there first
3. add `www.floscarvanguard.com`
4. add `floscarvanguard.com`
5. set the root domain to redirect to `www`
6. wait for HTTPS to finish provisioning
7. re-test login, profile save, Tools history, and Trends history on `https://www.floscarvanguard.com`

Suggested DNS pattern for Render:

- root domain: use the A record values Render provides
- `www`: use the CNAME target Render provides

## Production Caution

This app currently stores accounts and sessions in JSON files. That is acceptable for an early live version, but not ideal for scale.

For a stronger production setup, the next upgrade should be:

1. move users and sessions to a real database
2. add password-reset and email verification flows
3. add structured request logging
4. add automated backups for user data
