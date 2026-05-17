# Google OAuth Origin Configuration Fix

## Issue
The Google Login is failing with error:
```
[GSI_LOGGER]: The given origin is not allowed for the given client ID.
```

This means the Google OAuth Client ID doesn't have your current origin authorized in Google Cloud Console.

## Root Cause
The current Google Client ID doesn't have these origins configured:
- `http://localhost:5173`
- `http://127.0.0.1:5173`

## Solution: Update Google Cloud Console

### Step 1: Access Google Cloud Console
1. Go to: https://console.cloud.google.com/
2. Select your **Mens Hub** project
3. Navigate to: **APIs & Services → Credentials**
4. Click on your **OAuth 2.0 Client ID** (should show type "Web application")

### Step 2: Add Authorized JavaScript Origins
In the OAuth 2.0 Client ID settings, find the section **"Authorized JavaScript Origins"**

Add these origins if not already present:
```
http://localhost:5173
http://127.0.0.1:5173
http://localhost:3000
http://127.0.0.1:3000
```

### Step 3: Add Authorized Redirect URIs (if needed)
Add these if your backend OAuth endpoint requires them:
```
http://localhost:8000/api/auth/google/
http://localhost:8000/api/auth/google/callback/
http://localhost:5173
http://127.0.0.1:5173
http://localhost:3000
http://127.0.0.1:3000
```

### Step 4: Save and Update Local Configuration

After saving changes in Google Cloud Console, copy your credentials:
1. Copy your **Client ID** from Google Console
2. Copy your **Client Secret** from Google Console (if needed for backend)

### Step 5: Update Environment Files

Update `.env` file:
```env
GOOGLE_CLIENT_ID=<your-client-id-from-google>
GOOGLE_CLIENT_SECRET=<your-client-secret-from-google>
```

Update `.env.local` file:
```env
VITE_GOOGLE_CLIENT_ID=<your-client-id-from-google>
VITE_API_URL=http://localhost:8000
VITE_API_BASE_PATH=/api
```

### Step 6: Restart Development Servers

**Terminal 1 - Backend:**
```bash
cd "c:\Users\dhars\Downloads\mens hub front end"
# If running, stop with Ctrl+C
daphne -b 0.0.0.0 -p 8000 backend_project.asgi:application
```

**Terminal 2 - Frontend:**
```bash
cd "c:\Users\dhars\Downloads\mens hub front end"
# If running, stop with Ctrl+C
pnpm dev
```

Wait for both servers to start (you should see "listening on" messages).

### Step 7: Test the Login
1. Go to http://localhost:5173
2. Click on the Profile icon (user button)
3. You should see the login page
4. Try clicking "Sign in with Google"
5. You should no longer see the origin error

## If You Don't Have Google Cloud Console Access

If you don't have access to the Google Cloud Console:
1. Contact the project admin or the person who set up the Google OAuth app
2. Ask them to add these origins to the OAuth Client ID:
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`
3. Ask them to provide the Client ID (if it changed)

## Alternative: Regenerate OAuth Credentials

If the current credentials are invalid or expired:
1. Go to Google Cloud Console
2. Delete the old OAuth 2.0 Client ID
3. Create a new one:
   - Application Type: **Web application**
   - Name: **Mens Hub Dev** (or similar)
   - Authorized origins:
     - http://localhost:5173
     - http://127.0.0.1:5173
     - http://localhost:3000
     - http://127.0.0.1:3000
   - Authorized redirect URIs:
     - http://localhost:8000/api/auth/google/
     - http://localhost:8000/api/auth/google/callback/
4. Copy the new Client ID
5. Update `.env` and `.env.local` with the new credentials
6. Restart both servers

## Testing

After applying the fix:

### Browser Console Check
1. Open DevTools: F12
2. Go to **Console** tab
3. Try Google login again
4. You should see success messages, not the origin error

### Successful Login Should Show:
```
✅ [GoogleLogin] Login attempt started
✅ [GoogleLogin] Token decoded successfully
✅ [GoogleLogin] Backend response successful
```

Instead of:
```
❌ [GSI_LOGGER]: The given origin is not allowed for the given client ID.
```

## Need Help?

If you still see the error after these steps:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Clear localStorage in DevTools Console: `localStorage.clear()`
3. Hard refresh the page (Ctrl+Shift+R)
4. Check that the Client ID in .env.local matches the one in Google Console
5. Verify both servers are running with the updated environment files
