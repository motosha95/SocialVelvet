# Testing Your Backend API

## Quick Test Commands

### Test Health Endpoint
```powershell
# In PowerShell
Invoke-WebRequest -Uri http://localhost:3001/health
```

Or open in browser: http://localhost:3001/health

### Test Register (using PowerShell)
```powershell
$body = @{
    email = "test@example.com"
    password = "password123"
    name = "Test User"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3001/auth/register -Method POST -Body $body -ContentType "application/json"
```

### Test Login
```powershell
$body = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri http://localhost:3001/auth/login -Method POST -Body $body -ContentType "application/json"
$token = ($response.Content | ConvertFrom-Json).accessToken
Write-Host "Token: $token"
```

### Test Get Events (with token)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-WebRequest -Uri http://localhost:3001/events -Headers $headers
```

## Using Postman/Insomnia

1. **Register:**
   - POST `http://localhost:3001/auth/register`
   - Body (JSON):
     ```json
     {
       "email": "test@example.com",
       "password": "password123",
       "name": "Test User"
     }
     ```

2. **Login:**
   - POST `http://localhost:3001/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "test@example.com",
       "password": "password123"
     }
     ```
   - Copy the `accessToken` from response

3. **Get Events:**
   - GET `http://localhost:3001/events`
   - Headers: `Authorization: Bearer YOUR_TOKEN`

4. **Create Event:**
   - POST `http://localhost:3001/events`
   - Headers: `Authorization: Bearer YOUR_TOKEN`
   - Body (JSON):
     ```json
     {
       "title": "Test Event",
       "description": "This is a test",
       "location": "Test Location",
       "date": "2024-12-31T18:00:00.000Z",
       "maxAttendees": 50
     }
     ```
