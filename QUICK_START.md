# Quick Start Guide - Task Management Platform

## 🚀 Three Ways to Run the System

### Option 1: Docker (Recommended)
```bash
# Using modern Docker CLI
docker compose -f config/docker/docker-compose.dev.yml up --build

# Or using legacy docker-compose
docker-compose -f config/docker/docker-compose.dev.yml up --build
```

**Access Points:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api/v1
- API Documentation: http://localhost:3000/docs

### Option 2: Manual Setup (if Docker isn't available)

#### 1. Install Dependencies
```bash
# Backend
cd src/backend
npm install

# Frontend (in new terminal)
cd src/frontend  
npm install
```

#### 2. Setup Database (PostgreSQL required)
```bash
# In backend directory
npm run db:generate
npm run db:push
npm run db:seed    # Optional: adds demo data
```

#### 3. Start Services
```bash
# Terminal 1: Backend
cd src/backend
npm run dev

# Terminal 2: Frontend
cd src/frontend  
npm run dev
```

### Option 3: Cloud Database (Easiest)

#### 1. Use a cloud PostgreSQL service:
- **Neon** (free): https://neon.tech
- **Supabase** (free): https://supabase.com
- **PlanetScale** (free): https://planetscale.com

#### 2. Update environment:
```bash
# Create src/backend/.env
DATABASE_URL="your-cloud-database-url"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
REDIS_URL="redis://localhost:6379"  # or cloud Redis
```

#### 3. Start development:
```bash
cd src/backend && npm install && npm run dev &
cd src/frontend && npm install && npm run dev
```

## 🎯 Demo Credentials

Once running, login with:
- **Email**: admin@example.com
- **Password**: password123

## 📊 System Features

✅ **Complete Authentication System**
- JWT with refresh tokens
- Role-based access control
- Secure password hashing

✅ **Project Management**
- Create, edit, delete projects
- Team member management
- Project-based permissions

✅ **Task Management**
- Full CRUD operations
- Task assignments and priorities
- Due dates and status tracking

✅ **Real-time Collaboration**
- Live task updates
- Real-time notifications
- Activity feeds
- User presence indicators

✅ **Modern Tech Stack**
- React 18 + TypeScript frontend
- Node.js + Fastify backend
- PostgreSQL + Prisma ORM
- Socket.io for real-time features

## 🛠 Development Commands

```bash
# Root level
npm run docker:dev      # Start with Docker
npm run docker:down     # Stop Docker services
npm run docker:clean    # Clean up Docker volumes

# Backend specific (in src/backend/)
npm run dev            # Development server
npm run build          # Production build
npm run test           # Run tests
npm run db:studio      # Open Prisma Studio
npm run db:migrate     # Run migrations
npm run db:seed        # Seed demo data

# Frontend specific (in src/frontend/)
npm run dev            # Development server
npm run build          # Production build
npm run test           # Run tests
npm run preview        # Preview production build
```

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Kill processes on ports 3000, 5173
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Database Connection Issues
1. Ensure PostgreSQL is running
2. Check DATABASE_URL in .env file
3. Run `npm run db:push` to sync schema

### Docker Issues
```bash
# Clean up Docker
docker system prune -a
docker volume prune
```

## 📚 Next Steps

1. **Explore the API**: Visit http://localhost:3000/docs
2. **Check the Code**: Review `/src/backend` and `/src/frontend`
3. **Run Tests**: `npm run test` in both directories
4. **Add Features**: Follow the architecture in `/docs`

---

🎉 **Your Task Management Platform is Ready!**