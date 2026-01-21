# Debugging "Invalid Token" Error

## Quick Fix Steps

1. **Log out and log back in** - This will get a fresh token from the backend

2. **Check the console logs** - I've added logging to see what's happening:
   - Look for `[getAuthToken]` messages
   - Look for `[eventsApi.create]` messages  
   - Look for `[apiClient.post]` messages

3. **Try registering a NEW user** - Use a different email to make sure you get a fresh token

## What Could Be Wrong

The "invalid token" error usually means:
- The token stored in your app was created with an old/different backend
- The JWT_SECRET changed (but we checked, it's set)
- The token format is wrong (but it should be correct)

## Most Likely Fix

**Log out and log back in again!** 

The token stored in your device might be from before we connected to the real backend. A fresh login will get you a new token that matches the current backend.
