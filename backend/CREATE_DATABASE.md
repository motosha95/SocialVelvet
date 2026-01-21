# Create Database - Quick Guide

Now that PostgreSQL is in your PATH, follow these steps:

## Step 1: Create the Database

Open PowerShell and run:

```powershell
psql -U postgres
```

It will ask for your password (the one you set during PostgreSQL installation).

Once connected, you'll see a prompt like: `postgres=#`

Then run these SQL commands:

```sql
CREATE DATABASE socializing;
```

Verify it was created:
```sql
\l
```

You should see `socializing` in the list.

Exit psql:
```sql
\q
```

## Step 2: Create .env File

In the `backend` folder, create a file named `.env` with:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/socializing?schema=public"
JWT_SECRET="change-this-to-a-random-string-in-production"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:8081"
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

## Step 3: Install Dependencies

```powershell
cd backend
npm install
```

## Step 4: Set Up Database Schema

```powershell
npm run db:generate
npm run db:push
```

## Step 5: Start Server

```powershell
npm run dev
```
