# Database Setup Guide - Step by Step

## Step 1: Install PostgreSQL (if not already installed)

### Option A: Check if PostgreSQL is already installed
Open PowerShell and run:
```powershell
psql --version
```

If you see a version number (like `psql (PostgreSQL) 14.9`), you're good to go! Skip to Step 2.

### Option B: Install PostgreSQL on Windows

1. **Download PostgreSQL:**
   - Go to: https://www.postgresql.org/download/windows/
   - Click "Download the installer" 
   - Download the latest version (16.x recommended)

2. **Run the installer:**
   - Run the downloaded `.exe` file
   - **Important:** Remember the password you set for the `postgres` user (you'll need it!)
   - Default port is `5432` (keep it)
   - Keep all default options

3. **Verify installation:**
   - Open PowerShell
   - Run: `psql --version`
   - You should see a version number

## Step 2: Create the Database

### Method 1: Using psql Command Line (Recommended)

1. Open PowerShell
2. Connect to PostgreSQL:
   ```powershell
   psql -U postgres
   ```
   (Enter the password you set during installation)

3. Create the database:
   ```sql
   CREATE DATABASE socializing;
   ```

4. Verify it was created:
   ```sql
   \l
   ```
   (You should see `socializing` in the list)

5. Exit psql:
   ```sql
   \q
   ```

### Method 2: Using pgAdmin (GUI Tool)

1. Open **pgAdmin** (installed with PostgreSQL)
2. Connect to your server (enter postgres password)
3. Right-click on "Databases" → "Create" → "Database"
4. Name it: `socializing`
5. Click "Save"

## Step 3: Set Up Environment Variables

1. Navigate to your backend directory:
   ```powershell
   cd backend
   ```

2. Create a `.env` file (copy from example if exists, or create new):
   ```powershell
   # If .env.example exists:
   copy .env.example .env
   
   # Or create .env manually
   ```

3. Edit the `.env` file and update `DATABASE_URL`:
   ```
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/socializing?schema=public"
   ```
   
   Replace `YOUR_PASSWORD` with the password you set for the postgres user during installation.

   **Example:**
   ```
   DATABASE_URL="postgresql://postgres:mypassword123@localhost:5432/socializing?schema=public"
   ```

4. Also set the JWT_SECRET (generate a random string):
   ```
   JWT_SECRET="your-super-secret-key-change-this"
   ```
   
   For a secure random key, you can use:
   ```powershell
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
   ```

## Step 4: Install Backend Dependencies

In the backend directory, run:
```powershell
npm install
```

## Step 5: Set Up Database Schema

1. Generate Prisma client:
   ```powershell
   npm run db:generate
   ```

2. Push schema to database:
   ```powershell
   npm run db:push
   ```

You should see: "✅ Your database is now in sync with your Prisma schema"

## Step 6: Verify Everything Works

1. Start the server:
   ```powershell
   npm run dev
   ```

2. You should see: `🚀 Server running on http://localhost:3001`

3. Test the health endpoint in a browser:
   - Go to: http://localhost:3001/health
   - You should see: `{"status":"ok","timestamp":"..."}`

## Troubleshooting

### "psql: command not found"
- PostgreSQL is not installed or not in PATH
- Reinstall PostgreSQL and make sure "Command Line Tools" is checked
- Or add PostgreSQL bin folder to Windows PATH

### "password authentication failed"
- Check your password in the .env file
- Try resetting postgres password:
  ```sql
  ALTER USER postgres PASSWORD 'newpassword';
  ```

### "database socializing already exists"
- That's fine! The database already exists, you can continue.

### "connection refused" or "could not connect"
- Make sure PostgreSQL service is running
- Check Windows Services (services.msc) for "postgresql"
- Or restart PostgreSQL service

### Need to check if database exists?
```powershell
psql -U postgres -c "\l"
```

### Want to delete and recreate the database?
```sql
DROP DATABASE socializing;
CREATE DATABASE socializing;
```
