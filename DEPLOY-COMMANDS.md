# Deployment Command Reference

Quick copy-paste commands for deploying to different platforms.

## Prerequisites (All Platforms)

```bash
# 1. Install dependencies
npm install --omit=dev

# 2. Generate a strong password pepper
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 3. Commit code to GitHub
git add .
git commit -m "Site ready for production hosting"
git push origin main
```

---

## 🟢 Render (Fastest - Recommended)

**Time to deploy:** ~5 minutes | **Cost:** $0-40/mo | **Uptime:** 99.9%

### Via Web Dashboard (No Command Line)

1. Go to [render.com](https://render.com)
2. Sign in with GitHub
3. Click "New +" → "Web Service"
4. Select your repository
5. Render auto-detects `render.yaml`
6. Click "Create Web Service"
7. Go to Environment tab, add:
   - `HOST=0.0.0.0`
   - `COOKIE_SECURE=true`
   - `PASSWORD_PEPPER=[your generated value]`
   - `DATA_DIR=/var/data` (if using persistent disk)
8. Click "Deploy"

**Attach persistent storage:**
- Go to Disk tab
- Click "Add Disk"
- Mount path: `/var/data`
- Size: 1 GB

---

## 🐳 Docker (Any Cloud Host)

**Time to deploy:** ~15 minutes | **Cost:** $6-50/mo | **Uptime:** 99.5%+

### Local Test

```bash
# Build image
docker build -t floscar-vanguard .

# Run locally
docker run -p 3000:3000 \
  -e HOST=0.0.0.0 \
  -e COOKIE_SECURE=true \
  -e PASSWORD_PEPPER=your-secret-here \
  -v floscar-data:/app/data \
  floscar-vanguard

# Visit http://localhost:3000
```

### Deploy to Heroku

```bash
# Install Heroku CLI
brew install heroku  # or: https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
heroku create your-app-name

# Push Docker image
heroku container:push web
heroku container:release web

# Set environment variables
heroku config:set \
  HOST=0.0.0.0 \
  COOKIE_SECURE=true \
  PASSWORD_PEPPER=your-secret-here

# View logs
heroku logs --tail
```

### Deploy to AWS ECS (Fargate)

```bash
# Install AWS CLI
brew install awscli

# Configure credentials
aws configure

# Create ECR repository
aws ecr create-repository --repository-name floscar-vanguard --region us-east-1

# Build and push
docker build -t floscar-vanguard .
docker tag floscar-vanguard:latest \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/floscar-vanguard:latest

aws ecr get-login-password --region us-east-1 | docker login \
  --username AWS \
  --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/floscar-vanguard:latest

# Create ECS task definition (use AWS Console for this step)
# Then create service pointing to this image
```

### Deploy to DigitalOcean App Platform

```bash
# Install doctl CLI
brew install doctl

# Authenticate
doctl auth init

# Build and push to DOCR
docker tag floscar-vanguard \
  registry.digitalocean.com/your-registry/floscar-vanguard:latest
docker push registry.digitalocean.com/your-registry/floscar-vanguard:latest

# Create app.yaml
cat > app.yaml << 'EOF'
name: floscar-vanguard
services:
- name: api
  github:
    repo: your-github/floscar-vanguard
    branch: main
  build_command: npm ci --omit=dev
  run_command: npm start
  envs:
  - key: HOST
    value: 0.0.0.0
  - key: COOKIE_SECURE
    value: "true"
  - key: PASSWORD_PEPPER
    value: ${PASSWORD_PEPPER}
  - key: DATA_DIR
    value: /opt/render/data
  http_port: 3000
EOF

# Deploy
doctl apps create --spec app.yaml
```

---

## 🖥️ VPS (Full Control - DIY)

**Time to deploy:** ~30 minutes | **Cost:** $6-20/mo | **Uptime:** 99.5%

### DigitalOcean Droplet / Hetzner Cloud / Linode

```bash
# SSH into your VPS
ssh root@your.server.ip

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Clone repository
cd /var/www
git clone https://github.com/your-user/floscar-vanguard.git
cd floscar-vanguard

# Install dependencies
npm install --omit=dev

# Create .env
cat > .env << 'EOF'
HOST=0.0.0.0
PORT=3000
COOKIE_SECURE=true
PASSWORD_PEPPER=your-secret-here
DATA_DIR=/var/www/floscar-vanguard/data
EOF

# Create data directory
mkdir -p data
chmod 755 data

# Test run
node server.js
# Ctrl+C to stop
```

### Setup systemd service

```bash
# Create service file
sudo tee /etc/systemd/system/floscar-vanguard.service > /dev/null << 'EOF'
[Unit]
Description=Floscar Vanguard API Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/floscar-vanguard
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
StandardOutput=append:/var/log/floscar-vanguard.log
StandardError=append:/var/log/floscar-vanguard.log
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable floscar-vanguard
sudo systemctl start floscar-vanguard

# View logs
sudo journalctl -u floscar-vanguard -f
```

### Setup nginx reverse proxy

```bash
# Install nginx
sudo apt install -y nginx

# Create config
sudo tee /etc/nginx/sites-available/floscar-vanguard > /dev/null << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/floscar-vanguard \
  /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Start nginx
sudo systemctl enable nginx
sudo systemctl restart nginx
```

### Setup HTTPS with Let's Encrypt

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renew
sudo systemctl enable certbot.timer
```

---

## ☁️ Azure Container Instances

```bash
# Login to Azure
az login

# Create resource group
az group create \
  --name floscar-vanguard \
  --location eastus

# Create container registry
az acr create \
  --resource-group floscar-vanguard \
  --name floscarregistry \
  --sku Basic

# Build and push image
az acr build \
  --registry floscarregistry \
  --image floscar-vanguard:latest .

# Deploy container
az container create \
  --resource-group floscar-vanguard \
  --name floscar-vanguard \
  --image floscarregistry.azurecr.io/floscar-vanguard:latest \
  --registry-login-server floscarregistry.azurecr.io \
  --port 3000 \
  --ip-address Public \
  --cpu 1 \
  --memory 1 \
  --environment-variables \
    HOST=0.0.0.0 \
    COOKIE_SECURE=true \
    PASSWORD_PEPPER=your-secret-here

# Get public IP
az container show \
  --resource-group floscar-vanguard \
  --name floscar-vanguard \
  --query ipAddress.ip
```

---

## 🔗 Post-Deployment

### Test deployment

```bash
# Health check
curl https://your-domain.com/api/health

# Should return:
# {"ok":true}
```

### Setup monitoring

```bash
# View logs (platform-specific)
# Render: Dashboard → Logs
# Heroku: heroku logs --tail
# VPS: sudo journalctl -u floscar-vanguard -f
```

### Setup backups

```bash
# Create backup script for VPS
cat > /var/www/backup-data.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=/backups
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf $BACKUP_DIR/floscar_$DATE.tar.gz \
  /var/www/floscar-vanguard/data
EOF

# Run daily
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/backup-data.sh") | crontab -
```

---

## 🆘 Troubleshooting

### Port 3000 already in use

```bash
lsof -i :3000
kill -9 <PID>
```

### Session not persisting

```bash
# Check data directory exists and is writable
ls -la data/
chmod 755 data

# Verify DATA_DIR env var
echo $DATA_DIR
```

### Users can't login

```bash
# Check .env has PASSWORD_PEPPER
grep PASSWORD_PEPPER .env

# Check logs for errors
sudo journalctl -u floscar-vanguard -f
```

### CORS errors

```bash
# Edit server.js
# Check CORS origin matches your deployed domain
```

---

**For more details, see [`HOSTING-PREP.md`](HOSTING-PREP.md)**
