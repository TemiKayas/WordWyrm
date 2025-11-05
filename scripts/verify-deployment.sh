#!/bin/bash

# WordWyrm Deployment Verification Script
# Usage: ./scripts/verify-deployment.sh https://your-app.vercel.app

set -e

DOMAIN=${1:-"http://localhost:3000"}

echo "🔍 Verifying WordWyrm deployment at: $DOMAIN"
echo ""

# Test 1: Homepage
echo "✓ Testing homepage..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/")
if [ "$STATUS" -eq 200 ]; then
    echo "  ✅ Homepage: OK (200)"
else
    echo "  ❌ Homepage: Failed ($STATUS)"
    exit 1
fi

# Test 2: Login page
echo "✓ Testing login page..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/login")
if [ "$STATUS" -eq 200 ]; then
    echo "  ✅ Login page: OK (200)"
else
    echo "  ❌ Login page: Failed ($STATUS)"
    exit 1
fi

# Test 3: Signup page
echo "✓ Testing signup page..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/signup")
if [ "$STATUS" -eq 200 ]; then
    echo "  ✅ Signup page: OK (200)"
else
    echo "  ❌ Signup page: Failed ($STATUS)"
    exit 1
fi

# Test 4: API Health
echo "✓ Testing auth API..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/api/auth/session")
if [ "$STATUS" -eq 200 ]; then
    echo "  ✅ Auth API: OK (200)"
else
    echo "  ❌ Auth API: Failed ($STATUS)"
    exit 1
fi

# Test 5: Check for required headers
echo "✓ Testing security headers..."
HEADERS=$(curl -s -I "$DOMAIN/")
if echo "$HEADERS" | grep -q "x-"; then
    echo "  ✅ Security headers: Present"
else
    echo "  ⚠️  Security headers: Not detected (may be normal for dev)"
fi

echo ""
echo "🎉 All basic checks passed!"
echo ""
echo "📋 Manual verification needed:"
echo "  1. Sign up as a teacher"
echo "  2. Upload a PDF file"
echo "  3. Create a game"
echo "  4. Test game edit functionality"
echo "  5. Sign up as a student"
echo "  6. Join a game via share code"
echo ""
