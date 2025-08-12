# 🔧 Database Setup Fix

## Quick Solution: Use Free Cloud Database

### Option 1: Neon (Recommended - 5 minutes)

1. **Go to Neon.tech**: https://neon.tech
2. **Sign up** with GitHub or email (free)
3. **Create project** - choose any name
4. **Copy connection string** - it looks like:
   ```
   postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb
   ```
5. **Update your .env**:
   ```bash
   cd /Users/leadfive/Desktop/system/031_Fleeks/src/backend
   nano .env
   # Replace the DATABASE_URL line with your Neon connection string
   ```

### Option 2: Supabase (Alternative)

1. **Go to Supabase**: https://supabase.com  
2. **Create account** and new project
3. **Go to Settings > Database**
4. **Copy connection string** under "Connection string"
5. **Update .env** with the connection string

## Local PostgreSQL Fix (If you prefer local)

### Check if PostgreSQL is installed:
```bash
psql --version
```

### If not installed (macOS):
```bash
brew install postgresql
brew services start postgresql
```

### Create database and user:
```bash
# Connect to PostgreSQL
psql postgres

# In psql prompt:
CREATE DATABASE task_platform;
CREATE USER taskuser WITH PASSWORD 'taskpass123';
GRANT ALL PRIVILEGES ON DATABASE task_platform TO taskuser;
\q
```

### Update .env for local:
```bash
DATABASE_URL="postgresql://taskuser:taskpass123@localhost:5432/task_platform"
```

## 🚀 Once Database is Ready

```bash
cd /Users/leadfive/Desktop/system/031_Fleeks/src/backend

# Test connection
npm run prisma:generate

# Create tables
npm run prisma:push

# Add demo data  
npm run prisma:seed

# Start server
npm run dev
```

## 🎯 Recommended: Use Neon (Cloud)

The fastest way is to use Neon.tech - it's free, takes 2 minutes to setup, and removes all local PostgreSQL complexity.

1. Visit https://neon.tech
2. Sign up (free)
3. Create project
4. Copy connection string to your .env
5. Run the prisma commands above

Your system will be running in minutes! 🎉