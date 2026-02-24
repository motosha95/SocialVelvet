# Connect Frontend to Backend - Quick Guide

## ✅ What's Done

1. **Backend is running** on `http://localhost:3001`
2. **Frontend API updated** to call the real backend instead of mocks
3. **All endpoints match** between frontend and backend

## 🧪 Testing the Connection

### Step 1: Make sure both are running

**Backend** (in `backend/` folder):
```powershell
npm run dev
```
Should show: `🚀 Server running on http://localhost:3001`

**Frontend** (in root folder):
```powershell
npm start
```
Then scan QR code with Expo Go

### Step 2: Test Authentication

1. **Register a new user:**
   - Open the app
   - Go to Register screen
   - Fill in: name, email, password (min 6 chars)
   - Click "Create account"
   - Should log you in and show Events screen

2. **Login:**
   - Sign out
   - Try logging in with the same credentials
   - Should work!

### Step 3: Test Events

1. **View Events:**
   - Events list should load (might be empty at first)
   - Pull to refresh

2. **Create Event:**
   - Click "Create" button
   - Fill in event details
   - Submit
   - Should appear in the list!

3. **Join/Leave Event:**
   - Open an event
   - Click "Join event"
   - Should update immediately
   - Click "Leave event" to test leaving

## 🔧 Troubleshooting

### "Network request failed" or connection errors

**For Expo Go on physical device:**
- Your phone and computer must be on the same WiFi
- Use your computer's IP address instead of `localhost`
- Find your IP: In PowerShell run `ipconfig` and look for IPv4 Address
- Update `src/api/client.ts`:
  ```typescript
  const API_BASE_URL = 'http://YOUR_IP_ADDRESS:3001';
  // Example: const API_BASE_URL = 'http://192.168.1.100:3001';
  ```

**For Android Emulator:**
- Use `10.0.2.2` instead of `localhost`:
  ```typescript
  const API_BASE_URL = 'http://10.0.2.2:3001';
  ```

**For iOS Simulator:**
- `localhost` should work fine

### CORS errors

- Make sure `FRONTEND_URL` in backend `.env` matches your frontend URL
- For Expo Go, you might need to allow all origins temporarily:
  ```typescript
  // In backend/src/index.ts, change CORS to:
  app.use(cors());
  ```

### "Authentication required" errors

- Make sure you're logged in
- Check that the JWT token is being sent in requests
- Try logging out and back in

## 📝 Next Steps

Once everything is connected and working:

1. **Test all features:**
   - Register/Login
   - Create events
   - Join/Leave events
   - View attendees

2. **Add more features:**
   - User profiles
   - Event images upload
   - Chat functionality
   - Notifications

3. **Production setup:**
   - Deploy backend (Railway, Render, AWS, etc.)
   - Update frontend API URL to production
   - Set up proper CORS
   - Add environment-based config

## 🎉 You're Connected!

Your frontend and backend are now talking to each other. All API calls go to your real database, and everything persists!
