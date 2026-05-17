# 🔧 Google OAuth Fix - 3 Steps

**Status:** ✅ Backend running on http://localhost:8000  
**Status:** ✅ Frontend running on http://localhost:5174  
**Issue:** Google OAuth not configured for localhost:5174

---

## Quick Fix (5 minutes)

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Create a new **OAuth 2.0 Client ID** (if you don't have one)
   - Application type: **Web application**
   - Add authorized JavaScript origins:
     - `http://localhost:5174`
     - `http://127.0.0.1:5174`
     - `http://localhost:5173`
     - `http://127.0.0.1:5173`
   - Add authorized redirect URIs:
     - `http://localhost:5174`
     - `http://localhost:8000/api/auth/google/`

3. Copy your **Client ID** (NOT Client Secret)

### Step 2: Update Frontend Configuration

**File:** `.env.local`

```
VITE_GOOGLE_CLIENT_ID=YOUR_NEW_CLIENT_ID_HERE
```

Replace `YOUR_NEW_CLIENT_ID_HERE` with the Client ID from Step 1.

### Step 3: Restart Frontend

In terminal:
```bash
# Press Ctrl+C to stop current dev server
# Then:
npm run dev
```

---

## Testing Google Login

1. Open http://localhost:5174
2. Click "Google Login" button
3. Sign in with your Google account
4. Should redirect back successfully

---

## Troubleshooting

### Still getting "origin is not allowed" error?

Check:
1. ✅ Is `http://localhost:5174` added in Google Cloud Console?
2. ✅ Did you restart the frontend server after updating .env.local?
3. ✅ Are you using the correct Client ID (starts with numbers)?

### Getting "accounts.google.com responded with 403"?

1. Clear browser cookies: Settings → Privacy → Clear browsing data
2. Clear .env cache: Delete `.env.local` and run `npm run dev` again
3. Wait 5 minutes for Google to update

### Getting "Cross-Origin-Opener-Policy would block"?

This is expected - COOP header prevents opening windows. The Google login library handles this.

---

## Backend is Ready ✅

- Django running on http://localhost:8000
- All admin routes fixed
- Database migration applied (0008)
- CORS configured for both ports

---

## Next Steps

1. ✅ Apply Google OAuth credentials (Steps 1-3 above)
2. ✅ Test Google login
3. ✅ Create a test user account
4. ✅ Test user-specific features:
   - Add to cart → Persist in database
   - Add to wishlist → Persist in database
   - Create order → Visible to admin

---

**Quick Links:**
- [Google Cloud Credentials](https://console.cloud.google.com/apis/credentials)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Frontend URL](http://localhost:5174)
- [Backend API](http://localhost:8000/api)
- [Django Admin](http://localhost:8000/admin)
