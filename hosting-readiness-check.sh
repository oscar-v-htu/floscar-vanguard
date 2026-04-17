#!/bin/bash
# Floscar Vanguard — Hosting Readiness Validator
# Run this script to check if your site is ready for deployment

echo "🔍 Floscar Vanguard — Hosting Readiness Check"
echo "=============================================="
echo ""

PASSED=0
FAILED=0
WARNINGS=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

echo "📦 DEPENDENCIES & CONFIGURATION"
echo "--------------------------------"

# Check Node version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check_pass "Node.js installed: $NODE_VERSION"
else
    check_fail "Node.js not installed (required: v18+)"
fi

# Check package.json
if [ -f "package.json" ]; then
    check_pass "package.json exists"
    if grep -q '"start":' package.json; then
        check_pass "npm start script defined"
    else
        check_fail "npm start script missing"
    fi
else
    check_fail "package.json not found"
fi

# Check node_modules
if [ -d "node_modules" ]; then
    check_pass "node_modules directory exists"
else
    check_warn "node_modules not installed (run: npm install)"
fi

echo ""
echo "🔐 ENVIRONMENT & SECRETS"
echo "------------------------"

# Check .env exists but is gitignored
if [ -f ".env" ]; then
    check_pass ".env file exists"
    if grep -q '\.env' .gitignore 2>/dev/null; then
        check_pass ".env is in .gitignore"
    else
        check_fail ".env is NOT in .gitignore (SECURITY RISK)"
    fi
else
    check_warn ".env file not found (needs to be created on host)"
fi

# Check .env.example
if [ -f ".env.example" ]; then
    check_pass ".env.example exists (safe template)"
else
    check_fail ".env.example not found"
fi

# Check PASSWORD_PEPPER in .env
if [ -f ".env" ] && grep -q "PASSWORD_PEPPER=" .env; then
    check_pass "PASSWORD_PEPPER is configured"
else
    check_warn "PASSWORD_PEPPER not set (will use default in dev)"
fi

echo ""
echo "🏗️  DEPLOYMENT INFRASTRUCTURE"
echo "----------------------------"

# Check Dockerfile
if [ -f "Dockerfile" ]; then
    check_pass "Dockerfile exists"
    if grep -q "FROM node" Dockerfile; then
        check_pass "Dockerfile uses Node base image"
    fi
else
    check_fail "Dockerfile not found"
fi

# Check .dockerignore
if [ -f ".dockerignore" ]; then
    check_pass ".dockerignore exists"
else
    check_warn ".dockerignore not found (optional)"
fi

# Check render.yaml
if [ -f "render.yaml" ]; then
    check_pass "render.yaml exists (Render deployment ready)"
else
    check_warn "render.yaml not found (optional for Render)"
fi

echo ""
echo "📄 SERVER & APPLICATION"
echo "----------------------"

# Check server.js
if [ -f "server.js" ]; then
    check_pass "server.js exists"
    if grep -q "HOST.*0\.0\.0\.0" server.js; then
        check_pass "Server defaults to 0.0.0.0 (cloud-ready)"
    else
        check_warn "Server may not default to 0.0.0.0"
    fi
    if grep -q "x-forwarded-proto" server.js; then
        check_pass "HTTPS proxy support included"
    fi
    if grep -q "/api/health" server.js; then
        check_pass "Health check endpoint available"
    fi
else
    check_fail "server.js not found"
fi

echo ""
echo "📱 FRONTEND & SEO"
echo "----------------"

# Check essential HTML files
for file in home.html login.html index.html; do
    if [ -f "$file" ]; then
        check_pass "$file exists"
    else
        check_warn "$file not found"
    fi
done

# Check robots.txt
if [ -f "robots.txt" ]; then
    check_pass "robots.txt exists (SEO ready)"
else
    check_fail "robots.txt not found"
fi

# Check sitemap.xml
if [ -f "sitemap.xml" ]; then
    check_pass "sitemap.xml exists (SEO ready)"
else
    check_fail "sitemap.xml not found"
fi

# Check site.webmanifest
if [ -f "site.webmanifest" ]; then
    check_pass "site.webmanifest exists (PWA ready)"
else
    check_warn "site.webmanifest not found (optional)"
fi

echo ""
echo "💾 DATA & PERSISTENCE"
echo "--------------------"

# Check data directory
if [ -d "data" ]; then
    check_pass "data/ directory exists"
    if [ -f "data/users.json" ]; then
        check_warn "data/users.json exists (should not be in git)"
    fi
    if [ -f "data/sessions.json" ]; then
        check_warn "data/sessions.json exists (should not be in git)"
    fi
else
    check_warn "data/ directory not created yet (will auto-create on first run)"
fi

# Check data files are gitignored
if grep -q "data/" .gitignore 2>/dev/null; then
    check_pass "data/ is in .gitignore"
else
    check_fail "data/ is NOT in .gitignore (SECURITY RISK)"
fi

echo ""
echo "📋 GIT & VERSION CONTROL"
echo "------------------------"

# Check .gitignore
if [ -f ".gitignore" ]; then
    check_pass ".gitignore exists"
    
    if grep -q "node_modules" .gitignore; then
        check_pass "node_modules/ in .gitignore"
    else
        check_fail "node_modules/ NOT in .gitignore"
    fi
    
    if grep -q "\.env" .gitignore; then
        check_pass ".env in .gitignore"
    else
        check_fail ".env NOT in .gitignore"
    fi
else
    check_fail ".gitignore not found"
fi

# Check git status
if command -v git &> /dev/null; then
    if git rev-parse --git-dir > /dev/null 2>&1; then
        check_pass "Git repository initialized"
        
        if git remote -v | grep -q origin; then
            check_pass "Git remote 'origin' configured"
        else
            check_warn "Git remote 'origin' not configured"
        fi
    else
        check_warn "Not a git repository"
    fi
else
    check_warn "Git not installed"
fi

echo ""
echo "📚 DOCUMENTATION"
echo "----------------"

for doc in DEPLOY.md LAUNCH-CHECKLIST.md HOSTING-PREP.md PRODUCTION-READY.md; do
    if [ -f "$doc" ]; then
        check_pass "$doc exists"
    else
        check_warn "$doc not found"
    fi
done

echo ""
echo "=============================================="
echo "✓ Passed: $PASSED"
echo -e "${RED}✗ Failed: $FAILED${NC}"
echo -e "${YELLOW}⚠ Warnings: $WARNINGS${NC}"
echo "=============================================="

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 Your site is READY FOR HOSTING!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review HOSTING-PREP.md for deployment options"
    echo "2. Generate a new PASSWORD_PEPPER for production"
    echo "3. Choose a deployment platform (Render recommended)"
    echo "4. Deploy and test at your domain"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  Please fix the failures above before deploying${NC}"
    echo ""
    exit 1
fi
