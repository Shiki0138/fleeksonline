#!/bin/bash

# FLEEKS Login System Quick Manual Test Script
# This script opens all necessary URLs for manual testing

echo "🧪 FLEEKS Login System - Quick Manual Test"
echo "=========================================="

# Check if app is running
echo "📡 Checking if application is running..."
if curl -s http://localhost:3000/ > /dev/null; then
    echo "✅ Application is running on http://localhost:3000"
else
    echo "❌ Application is not running!"
    echo "💡 Please start it with: npm run dev"
    exit 1
fi

echo ""
echo "🌐 Opening test pages in browser..."

# Function to open URL based on OS
open_url() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "$1"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open "$1"
    else
        echo "Please open manually: $1"
    fi
}

# Open login page
echo "📄 Opening login page..."
open_url "http://localhost:3000/login"

sleep 2

# Open admin page (should redirect to login)
echo "👑 Opening admin page..."
open_url "http://localhost:3000/admin"

sleep 2

# Open dashboard page (should redirect to login) 
echo "📊 Opening dashboard page..."
open_url "http://localhost:3000/dashboard"

echo ""
echo "✅ All test pages opened!"
echo ""
echo "📋 Manual Test Checklist:"
echo "========================"
echo ""
echo "1. 管理者ログインテスト:"
echo "   • Email: greenroom51@gmail.com"
echo "   • Password: [Use actual admin password]"
echo "   • Expected: Redirect to /admin with success message"
echo ""
echo "2. エラーテスト:"
echo "   • Try wrong password: should show Japanese error"
echo "   • Try non-existent email: should show Japanese error"
echo ""
echo "3. UIテスト:"
echo "   • Check loading state ('ログイン中...')"
echo "   • Check success message styling (green background)"
echo "   • Check error message styling (red background)"
echo "   • Test on mobile/responsive"
echo ""
echo "4. リダイレクトテスト:"
echo "   • Admin login → /admin"
echo "   • Regular user login → /dashboard"
echo "   • Unauthenticated access → /login"
echo ""
echo "🔗 Test URLs:"
echo "   Login: http://localhost:3000/login"
echo "   Admin: http://localhost:3000/admin"
echo "   Dashboard: http://localhost:3000/dashboard"
echo ""
echo "Press any key to continue..."
read -n 1 -s

echo ""
echo "🎯 Test Results Documentation:"
echo "=============================="
echo ""
echo "After completing tests, please document results:"
echo ""
echo "✅ Working Features:"
echo "   [ ] Admin login and redirect"
echo "   [ ] Regular user login and redirect"
echo "   [ ] Japanese error messages"
echo "   [ ] Loading states"
echo "   [ ] Success/error message styling"
echo "   [ ] Responsive design"
echo "   [ ] Authentication protection"
echo ""
echo "❌ Issues Found:"
echo "   [ ] ________________________________"
echo "   [ ] ________________________________"
echo "   [ ] ________________________________"
echo ""
echo "💬 Overall Assessment:"
echo "   [ ] 🎉 Excellent - All features work perfectly"
echo "   [ ] ✅ Good - Minor issues, but functional"
echo "   [ ] ⚠️  Needs work - Several issues found"  
echo "   [ ] ❌ Critical - Major problems need fixing"
echo ""
echo "Thank you for testing FLEEKS!"