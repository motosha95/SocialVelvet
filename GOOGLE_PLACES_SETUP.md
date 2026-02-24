# Google Places API Setup Guide

## Overview
The LocationPicker now uses Google Places Autocomplete API for rich location suggestions. This provides:
- ✅ Real-time autocomplete as you type
- ✅ Rich place suggestions (restaurants, cafes, addresses, etc.)
- ✅ Nearby places based on your location
- ✅ Works with Expo Go (no native modules required)

## Setup Steps

### 1. Get a Google Cloud API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Places API** (not Places SDK):
   - Navigate to "APIs & Services" > "Library"
   - Search for "Places API"
   - Click "Enable"

### 2. Create an API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy your API key

### 3. Secure Your API Key (Important!)

**Option A: Restrict by HTTP referrer (Recommended for web)**
- Click on your API key to edit it
- Under "Application restrictions", select "HTTP referrers"
- Add your domain(s)

**Option B: Restrict by Android/iOS app (Recommended for mobile)**
- Under "Application restrictions", select "Android apps" or "iOS apps"
- Add your app's package name and SHA-1 fingerprint

**Option C: For development/testing only**
- You can leave it unrestricted temporarily
- ⚠️ **Never commit an unrestricted API key to version control**

### 4. Add API Key to Your App

Create a `.env` file in the root of your project:

```env
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_api_key_here
```

Then add `.env` to your `.gitignore`:

```
.env
```

### 5. Restart Your Development Server

After adding the API key, restart Expo:
```bash
npm start
```

## Pricing

Google Places API has a **free tier**:
- **$200 credit per month** (free forever)
- Autocomplete requests: **$2.83 per 1,000 requests**
- Place Details requests: **$17 per 1,000 requests**
- This typically covers **~40,000 autocomplete requests** per month

For most apps, this is more than enough for development and moderate usage.

## Fallback Behavior

If no API key is configured, the LocationPicker will:
- Fall back to `expo-location` geocoding (basic functionality)
- Still allow manual location entry
- Still show current location

## Troubleshooting

### "Request Denied" Error
- Check that Places API is enabled (not Places SDK)
- Verify your API key is correct
- Check that billing is enabled (even with free tier)

### No Suggestions Appearing
- Verify API key is set correctly in `.env`
- Check browser/Expo console for errors
- Ensure you've restarted the dev server after adding the key

### API Key Not Working
- Make sure the key starts with `EXPO_PUBLIC_` prefix
- Check that `.env` file is in the project root
- Verify the key hasn't been restricted incorrectly

## Alternative: Use Without API Key

If you don't want to use Google Places API, the LocationPicker will automatically fall back to basic `expo-location` geocoding. You can still:
- Search for locations (limited results)
- Use current location
- Enter custom locations manually
