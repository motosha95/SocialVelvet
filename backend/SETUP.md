# Backend Setup Guide

## Quick Start for New Repository

### Step 1: Create New Repository

```bash
# Create a new directory for your backend repo
mkdir socializing-backend
cd socializing-backend

# Initialize git (if not done already)
git init

# Copy all files from the backend/ directory to your new repo
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Environment Setup

Create a `.env` file in the root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/socializing?schema=public"

# JWT Secret (generate a random string - use openssl rand -base64 32)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server
PORT=3001
NODE_ENV=development

# CORS (frontend URL)
FRONTEND_URL="http://localhost:8081"
```

### Step 4: Database Setup

1. **Install PostgreSQL** (if not already installed)

2. **Create database:**
```bash
# Using psql
createdb socializing

# Or manually
psql -U postgres
CREATE DATABASE socializing;
\q
```

3. **Update DATABASE_URL in .env** with your PostgreSQL credentials

4. **Run Prisma migrations:**
```bash
npm run db:generate
npm run db:push
```

### Step 5: Start Server

```bash
npm run dev
```

Server should start on `http://localhost:3001`

## What Was Created

✅ Complete Express + TypeScript backend
✅ Prisma schema matching frontend data models
✅ Authentication endpoints (register/login) with JWT
✅ Events CRUD endpoints matching frontend API contracts
✅ Error handling and validation
✅ Type-safe code matching frontend interfaces

## API Endpoints

All endpoints match your frontend API contracts exactly:

- `POST /auth/register` - Register user
- `POST /auth/login` - Login user  
- `GET /events` - List events (includes isJoined if authenticated)
- `GET /events/:id` - Get event details
- `POST /events` - Create event (auth required)
- `POST /events/:id/join` - Join event (auth required)
- `POST /events/:id/leave` - Leave event (auth required)
- `GET /events/:id/attendees` - Get attendees

## Next Steps

1. Test the API endpoints using Postman/Insomnia
2. Update your frontend to connect to this backend (change API base URL)
3. Deploy to production (Railway, Render, AWS, etc.)
