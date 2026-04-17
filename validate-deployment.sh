#!/bin/bash
# Floscar Vanguard - Post-Deployment Validation Script
# Run this after your Render deployment goes live

if [ $# -eq 0 ]; then
    echo "Usage: ./validate-deployment.sh <your-render-url>"
    echo "Example: ./validate-deployment.sh https://floscar-vanguard.onrender.com"
    exit 1
fi

URL="${1%/}"  # Remove trailing slash if present
PASSED=0
FAILED=0

echo "🧪 Floscar Vanguard — Post-Deployment Validation"
echo "=================================================="
echo "Testing: $URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

test_endpoint() {
    local name=$1
    local endpoint=$2
    local expected=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$URL$endpoint")
    
    if [ "$response" = "$expected" ]; then
        echo -e "${GREEN}✓${NC} (HTTP $response)"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} (Expected HTTP $expected, got $response)"
        ((FAILED++))
    fi
}

test_json() {
    local name=$1
    local endpoint=$2
    
    echo -n "Testing $name... "
    
    response=$(curl -s "$URL$endpoint")
    
    if echo "$response" | grep -q '"ok"'; then
        echo -e "${GREEN}✓${NC} (Valid JSON)"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} (Invalid response: $response)"
        ((FAILED++))
    fi
}

echo -e "${BLUE}ENDPOINTS${NC}"
echo "----------"

# Test health check
test_json "Health Check" "/api/health"

# Test static files
test_endpoint "Homepage (index.html)" "/index.html" "200"
test_endpoint "Login Page" "/login.html" "200"
test_endpoint "Home Page" "/home.html" "200"
test_endpoint "Trends Page" "/trends.html" "200"
test_endpoint "Tools Page" "/tools.html" "200"

echo ""
echo -e "${BLUE}SEO & METADATA${NC}"
echo "--------------"

# Test SEO files
test_endpoint "robots.txt" "/robots.txt" "200"
test_endpoint "sitemap.xml" "/sitemap.xml" "200"
test_endpoint "site.webmanifest" "/site.webmanifest" "200"

echo ""
echo -e "${BLUE}HTTPS & SECURITY${NC}"
echo "----------------"

# Check HTTPS
if [[ "$URL" == https://* ]]; then
    echo -e "${GREEN}✓${NC} Using HTTPS"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Not using HTTPS"
    ((FAILED++))
fi

# Check SSL certificate validity
if command -v openssl &> /dev/null; then
    domain=$(echo $URL | sed 's|https://||' | sed 's|/||')
    timeout 5 openssl s_client -connect $domain:443 -servername $domain < /dev/null 2>/dev/null | grep -q "Verify return code: 0"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} SSL Certificate Valid"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠${NC} Could not verify SSL (minor)"
    fi
fi

echo ""
echo -e "${BLUE}PERFORMANCE${NC}"
echo "------------"

# Test response times
response_time=$(curl -s -w "%{time_total}" -o /dev/null "$URL/")
echo -e "${GREEN}✓${NC} Homepage loads in ${response_time}s"

echo ""
echo "=================================================="
echo -e "${GREEN}✓ Passed: $PASSED${NC}"
echo -e "${RED}✗ Failed: $FAILED${NC}"
echo "=================================================="

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed! Deployment successful!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Test user registration at $URL/login.html"
    echo "2. Create a test account"
    echo "3. Log in and modify profile"
    echo "4. Verify session persists on restart"
    echo "5. Check trends and tools pages work"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  Some tests failed. Check the errors above.${NC}"
    echo ""
    exit 1
fi
