# Google OAuth Login Fix Guide

## ⚠️ Current Issue
The Google Login button is showing "Google login failed. Please try again."

## Root Causes & Solutions

### 1. Check Google OAuth Credentials (CRITICAL)

Your credentials **may be invalid, expired, or misconfigured**. Follow these steps:

#### Step 1: Verify Credentials in Use
Current credentials in `.env`:
```
GOOGLE_CLIENT_ID=<your-google-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

These must be valid and properly configured in Google Cloud Console.

#### Step 2: Go to Google Cloud Console

1. Visit: https://console.cloud.google.com/
2. Select your **Mens Hub** project
3. Go to: **APIs & Services → Credentials**
4. Click on your **OAuth 2.0 Client ID**

#### Step 3: Verify Authorized URIs

Your OAuth client **MUST have these authorized origins and redirect URIs**:

**Authorized JavaScript Origins:**
```
http://localhost:3000
http://localhost:5173
http://127.0.0.1:5173
http://127.0.0.1:3000
```

**Authorized Redirect URIs:**
```
http://localhost:8000/api/auth/google/
http://localhost:8000/api/auth/google/callback/
http://localhost:3000
http://localhost:5173
```

✅ Add any missing origins/URIs
✅ Save changes

#### Step 4: Copy Correct Credentials

1. Copy the **Client ID** from Google Console
2. Copy the **Client Secret** from Google Console
3. Update your `.env` file:

```bash
GOOGLE_CLIENT_ID=<your-client-id-from-google>
GOOGLE_CLIENT_SECRET=<your-client-secret-from-google>
```

4. Update `.env.local`:

```bash
VITE_GOOGLE_CLIENT_ID=<your-client-id-from-google>
```

### 2. Restart Both Backend and Frontend

```bash
# Terminal 1 - Backend
# Stop current process (Ctrl+C)
# Restart:
python manage.py runserver
# or with Daphne:
daphne -b 0.0.0.0 -p 8000 backend_project.asgi:application

# Terminal 2 - Frontend
# Stop current process (Ctrl+C)
# Restart:
pnpm dev
```

### 3. Check Browser Console for Detailed Error

1. Open browser DevTools: **F12**
2. Go to **Console** tab
3. Try Google login again
4. Look for error messages that show what's failing:
   - "Token expired"
   - "Invalid client"
   - "CORS error"
   - Network error

### 4. Verify API Endpoint is Working

Test the backend endpoint directly:

```bash
# Test with a sample Google token (if you have one)
curl -X POST http://localhost:8000/api/auth/google/ \
  -H "Content-Type: application/json" \
  -d '{"token":"test-token"}'

# This should return an error about invalid token (expected)
# If you get a response, the endpoint is working
```

---

## Quick Fix Checklist

- [ ] Google Console OAuth client ID is valid (not deleted/revoked)
- [ ] All localhost origins (3000, 5173) are in "Authorized JavaScript origins"
- [ ] Redirect URI `http://localhost:8000/api/auth/google/` is in "Authorized redirect URIs"
- [ ] `.env` file has correct GOOGLE_CLIENT_ID
- [ ] `.env.local` file has correct VITE_GOOGLE_CLIENT_ID
- [ ] Backend is running on port 8000
- [ ] Frontend is running on port 5173
- [ ] Browser console shows no CORS errors
- [ ] No network errors when trying to login

---

## If Still Failing: Regenerate Credentials

If the above doesn't work, **regenerate credentials from scratch**:

### Generate New OAuth Credentials

1. Go to: https://console.cloud.google.com/apis/credentials
2. Delete your old OAuth 2.0 Client ID
3. Click **+ Create Credentials → OAuth client ID**
4. Select **Web application**
5. Add **Authorized JavaScript Origins:**
   ```
   http://localhost:3000
   http://localhost:5173
   ```
6. Add **Authorized Redirect URIs:**
   ```
   http://localhost:8000/api/auth/google/
   ```
7. Click Create
8. Copy the new Client ID and Secret
9. Update `.env` and `.env.local`
10. Restart backend and frontend
11. Try again

---

## Testing Without Google (Fallback)

For testing purposes, you can use the **admin credentials** shown on login page:

**Admin Login Credentials:**
```
Username: Dharshan
Password: 12345
```

This allows you to test the app while fixing OAuth issues.

---

## Common Issues

### "Google login failed"
- ✅ Check Google OAuth credentials are correct
- ✅ Check all localhost origins are authorized
- ✅ Restart backend and frontend

### "CORS error"
- ✅ Verify `CORS_ALLOWED_ORIGINS` in Django settings includes `http://localhost:5173`
- ✅ Check `.env` credentials are valid

### "Invalid token"
- ✅ Token verification is failing at backend
- ✅ Check `GOOGLE_CLIENT_ID` in `.env` is correct

### Still showing "Google login failed"
- ✅ Open browser DevTools (F12)
- ✅ Check **Console** and **Network** tabs for detailed error
- ✅ Look for error message
- ✅ Create new OAuth credentials from scratch

---

## Debug Mode

Enable detailed logging by modifying the GoogleLogin component:

```typescript
// In src/components/GoogleLogin.tsx
const handleGoogleLoginSuccess = async (credentialResponse: any) => {
  console.log('🔍 DEBUG: Google login attempt started');
  console.log('Token:', credentialResponse.credential);
  
  const decoded = jwtDecode(credentialResponse.credential);
  console.log('🔍 DEBUG: Decoded token:', decoded);
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  console.log('🔍 DEBUG: API URL:', apiUrl);
  
  try {
    const response = await fetch(`${apiUrl}/api/auth/google/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: credentialResponse.credential }),
    });
    
    console.log('🔍 DEBUG: Response status:', response.status);
    const data = await response.json();
    console.log('🔍 DEBUG: Response data:', data);
  } catch (error) {
    console.error('🔍 DEBUG: Error:', error);
  }
};
```

---

## Next Steps

1. **Verify your Google OAuth credentials** (most common issue)
2. **Update `.env` and `.env.local`** with correct credentials
3. **Restart backend and frontend**
4. **Test Google login** in browser
5. **Check browser console** if still failing
6. **Regenerate credentials** if needed

---

## Support

If you're still having issues:

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Try Google login
4. **Copy the error message** shown
5. Check the error against the troubleshooting section above

