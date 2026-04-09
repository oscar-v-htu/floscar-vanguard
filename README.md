# Floscar Vanguard

Floscar Vanguard is a multi-page futuristic Node.js website with:

- cinematic splash entry experience
- session-cookie authentication
- profile persistence
- self-discovery and article consoles
- AI trends intelligence dashboard
- real AI tools catalog with local or account-backed history

## Stack

- Node.js HTTP server
- vanilla HTML, CSS, and JavaScript
- JSON file persistence for users and sessions

## Local Run

```powershell
npm install
npm start
```

Open:

```text
http://127.0.0.1:3000
```

## Environment

Copy from `.env.example` and set production values before hosting.

Important variables:

- `HOST`
- `PORT`
- `COOKIE_SECURE`
- `PASSWORD_PEPPER`
- `DATA_DIR`

## Hosting

The project is prepared for live hosting with:

- proxy-aware HTTPS origin handling
- `GET /api/health`
- configurable persistent storage via `DATA_DIR`
- Docker deployment support
- Render blueprint support through `render.yaml`

Recommended public domain identity:

- `www.floscarvanguard.com`

Start with [DEPLOY.md](DEPLOY.md) for the full deployment path.

## First Push

This workspace already has a Git repository, but no remote is configured yet.

Typical first-push flow:

```powershell
git status
git add .
git commit -m "Prepare Floscar Vanguard for live deployment"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

Before running `git add .`, confirm these stay untracked:

- `.env`
- `data/users.json`
- `data/sessions.json`
- `node_modules/`

## Production Note

This project currently stores users and sessions in JSON files. For the first live launch, use hosting with persistent disk. For later scale, migrate that storage to a real database.
