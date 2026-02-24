# Quick Setup - Continue Here!

Assuming your database `socializing` is created, follow these steps:

## Step 1: Create .env File

1. Go to the `backend` folder
2. Create a new file named `.env` (not .env.txt, just `.env`)
3. Copy this content into it:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/socializing?schema=public"
JWT_SECRET="my-super-secret-jwt-key-12345"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:8081"
```

**IMPORTANT:** Replace `YOUR_PASSWORD` with the actual password you set for PostgreSQL during installation!

## Step 2: Install Dependencies

Open PowerShell in the `backend` folder and run:

```powershell
npm install
```

This will take a minute to install all packages.

## Step 3: Set Up Database Schema

Run these two commands:

```powershell
npm run db:generate
npm run db:push
```

The second command will create all the tables in your database.

## Step 4: Test the Server

Start the development server:

```powershell
npm run dev
```

You should see: `🚀 Server running on http://localhost:3001`

Then open your browser and go to: http://localhost:3001/health

You should see: `{"status":"ok","timestamp":"..."}`

## Troubleshooting

**If `npm install` fails:**
- Make sure you're in the `backend` folder
- Make sure Node.js is installed: `node --version`

**If `db:push` fails:**
- Check that your DATABASE_URL in .env is correct
- Make sure the `socializing` database exists
- Check your PostgreSQL password is correct

**If server won't start:**
- Check that PORT 3001 is not being used by another app
- Check the error message in the terminal
