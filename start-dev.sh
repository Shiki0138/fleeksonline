#!/bin/bash

echo "🚀 Starting Task Management Platform Development Environment"
echo "============================================================"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd src/backend
if [ ! -d "node_modules" ]; then
    npm install
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
fi

cd ../..

echo ""
echo "🎯 SETUP COMPLETE!"
echo "=================="
echo ""
echo "📋 NEXT STEPS:"
echo "1. Set up a PostgreSQL database (local or cloud)"
echo "2. Create src/backend/.env with your database URL"
echo "3. Run 'cd src/backend && npm run db:push' to create tables"
echo "4. Run 'cd src/backend && npm run db:seed' for demo data"
echo ""
echo "🚀 TO START DEVELOPMENT:"
echo "Terminal 1: cd src/backend && npm run dev"
echo "Terminal 2: cd src/frontend && npm run dev"
echo ""
echo "🌐 ACCESS POINTS:"
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:3000/api/v1"
echo "API Docs: http://localhost:3000/docs"
echo ""
echo "👤 DEMO LOGIN:"
echo "Email: admin@example.com"
echo "Password: password123"