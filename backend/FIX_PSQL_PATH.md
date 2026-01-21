# Fix PostgreSQL PATH Issue

PostgreSQL is installed but not in your PATH. Here are two solutions:

## Solution 1: Add PostgreSQL to PATH (Recommended)

1. **Find PostgreSQL bin folder:**
   - Usually: `C:\Program Files\PostgreSQL\18\bin`
   - (You have version 18 installed)

2. **Add to PATH:**
   - Press `Win + X` and select "System"
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "System variables", find "Path" and click "Edit"
   - Click "New"
   - Add: `C:\Program Files\PostgreSQL\18\bin`
   - Click "OK" on all windows
   - **Close and reopen PowerShell** (important!)

3. **Test:**
   ```powershell
   psql --version
   ```

## Solution 2: Use Full Path (Quick Fix)

Instead of `psql`, use the full path:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
```

## Solution 3: Use pgAdmin (GUI - Easiest)

1. Open **pgAdmin** from Start Menu
2. Enter your postgres password when prompted
3. Right-click "Databases" → "Create" → "Database"
4. Name: `socializing`
5. Click "Save"
