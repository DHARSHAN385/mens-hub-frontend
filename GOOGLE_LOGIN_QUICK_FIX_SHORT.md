# Quick Fix: How to Resolve Google Login Error

## Error You're Seeing
```
[GSI_LOGGER]: The given origin is not allowed for the given client ID.
```

## Why It's Happening
The Google OAuth Client ID being used doesn't have `http://localhost:5173` (your dev server) authorized in Google Cloud Console.

## Two Solutions

### SOLUTION 1: Update Existing Credentials (Recommended)

If you have access to Google Cloud Console:

#### Step 1: Login to Google Cloud Console
- Go to: https://console.cloud.google.com/
- Select your **"Mens Hub"** project

#### Step 2: Find Your OAuth Client ID
- Go to: **APIs & Services** → **Credentials**
- Find the OAuth 2.0 Client ID with type "Web application"
- Click on it to open details

#### Step 3: Add Localhost Origins
In **"Authorized JavaScript Origins"**, add:
```
http://localhost:5173
http://127.0.0.1:5173
```

#### Step 4: Save Changes
Click **SAVE** button

#### Step 5: Restart Servers
- Press `Ctrl+C` to stop both frontend and backend servers
- Run backend: `daphne -b 0.0.0.0 -p 8000 backend_project.asgi:application`
- Run frontend: `pnpm dev`

#### Step 6: Test Again
- Go to http://localhost:5173
- Click Profile → Login
- Try Google Sign in

---

### SOLUTION 2: Test with Hardcoded Login (Quick Testing)

If you don't have Google Cloud access or want to test the app quickly:

#### Use Demo Credentials
On the login page, enter:
- **Email/Username**: `dharshan`
- **Password**: `12345`

This lets you test the admin dashboard and app features without Google OAuth.

---

## What to Do If Google Cloud Access is Limited

If you don't have direct access to Google Cloud Console:

1. **Contact the person who set up the project** and ask them to:
   - Add `http://localhost:5173` to the OAuth Client ID's Authorized JavaScript Origins
   - Add `http://127.0.0.1:5173` as well
   - Confirm the changes are saved

2. **Get the current valid Client ID** from them and update:
   - `.env` file: `GOOGLE_CLIENT_ID=<their-id>`
   - `.env.local` file: `VITE_GOOGLE_CLIENT_ID=<their-id>`

3. **Restart both servers** after getting the credentials

---

## Verification Checklist

After applying the fix, confirm:

- [ ] Google Cloud Console has `http://localhost:5173` in Authorized Origins
- [ ] `.env` file has the correct `GOOGLE_CLIENT_ID`
- [ ] `.env.local` file has the correct `VITE_GOOGLE_CLIENT_ID`
- [ ] Both frontend and backend servers are restarted
- [ ] Browser cache is cleared (Ctrl+Shift+Delete)
- [ ] localStorage is cleared (open console, type: `localStorage.clear()`)
- [ ] Hard refresh page (Ctrl+Shift+R)

---

## Still Not Working?

1. **Open Browser DevTools** (F12)
2. **Go to Console tab**
3. **Look for any errors that say:**
   - "The given origin is not allowed" → OAuth not configured (follow Solution 1)
   - "Failed to load resource" → Network issue, check API_URL in .env.local
   - "Token verification failed" → Backend can't verify token (restart backend)

4. **Check that both servers are running:**
   - Frontend: http://localhost:5173 loads successfully
   - Backend: Open terminal and look for "Listening on TCP address" message

5. **Network troubleshooting:**
   - Check `VITE_API_URL=http://localhost:8000` in `.env.local`
   - Make sure backend is running on port 8000
   - Check CORS is enabled in Django settings (should be set up already)

---

## For Future Reference

When setting up Google OAuth locally, always add these to Authorized JavaScript Origins in Google Cloud:
- `http://localhost:5173` (your dev server)
- `http://127.0.0.1:5173` (alternate localhost)
- `http://localhost:3000` (if you ever use this port)
- `http://127.0.0.1:3000` (alternate)

And these to Authorized Redirect URIs:
- `http://localhost:8000/api/auth/google/` (your backend endpoint)
- `http://localhost:8000/api/auth/google/callback/` (if you use callbacks)

This prevents future "origin not allowed" errors.

---

## Testing Google Login When It Works

Once fixed, the console should show:
```
✅ [GoogleLogin] Login attempt started
✅ [GoogleLogin] Token decoded successfully
✅ [GoogleLogin] Backend response successful
Welcome Dharshan
```

If you see these messages, Google login is working!

---

## Need More Help?

1. **Check existing docs**: Read `GOOGLE_OAUTH_IMPLEMENTATION.md` for technical details
2. **Check setup guide**: Read `GOOGLE_OAUTH_SETUP.md` for initial setup
3. **Check fix guide**: Read `GOOGLE_OAUTH_FIX.md` for detailed troubleshooting

All documentation files are in the root directory of this project.
