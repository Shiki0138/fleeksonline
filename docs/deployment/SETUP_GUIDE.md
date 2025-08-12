# 🚀 Setup Guide - Task Management Platform

## Step-by-Step Setup Instructions

### Step 1: Database Setup

#### Option A: Using Neon (Free Cloud PostgreSQL) - Recommended
1. Go to https://neon.tech
2. Sign up for free account
3. Create a new project
4. Copy the connection string (looks like: `postgresql://username:password@host/database`)

#### Option B: Local PostgreSQL
```bash
# Install PostgreSQL locally (macOS)
brew install postgresql
brew services start postgresql
createdb task_platform
```

### Step 2: Environment Configuration
```bash
# Copy environment template
cd /Users/leadfive/Desktop/system/031_Fleeks/src/backend
cp .env.example .env

# Edit .env file with your database URL
# DATABASE_URL="postgresql://username:password@host/database"
```

### Step 3: Database Setup (Correct Commands)
```bash
cd /Users/leadfive/Desktop/system/031_Fleeks/src/backend

# Generate Prisma client
npm run prisma:generate

# Push database schema (creates tables)
npm run prisma:push

# Seed demo data
npm run prisma:seed
```

### Step 4: Start Development Servers

#### Terminal 1 - Backend:
```bash
cd /Users/leadfive/Desktop/system/031_Fleeks/src/backend
npm run dev
```

#### Terminal 2 - Frontend:
```bash
cd /Users/leadfive/Desktop/system/031_Fleeks/src/frontend
npm run dev
```

## 🌐 Access Your Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api/v1
- **API Documentation**: http://localhost:3000/docs

## 👤 Demo Login Credentials

- **Email**: admin@example.com
- **Password**: password123

## 🔧 Troubleshooting

### Database Connection Error
```bash
# Check your .env file
cat .env

# Test database connection
npm run prisma:studio
```

### Port Already in Use
```bash
# Kill processes on ports
lsof -ti:3000 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
```

### Missing Dependencies
```bash
# Reinstall if needed
rm -rf node_modules package-lock.json
npm install
```

## 🎯 What You'll See

1. **Login Page** - Use demo credentials to sign in
2. **Dashboard** - Overview of projects and tasks
3. **Projects** - Create and manage projects
4. **Tasks** - Add tasks, assign to team members
5. **Real-time Updates** - See changes instantly across browsers

## 📊 Available Scripts

### Backend (`src/backend/`)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run prisma:studio` - Open database GUI
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:push` - Push schema to database
- `npm run prisma:seed` - Add demo data

### Frontend (`src/frontend/`)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

---

🎉 **Your Task Management Platform is Ready!**