# Google OAuth Setup Guide

## ⚠️ SECURITY ALERT

Your previous Google OAuth credentials were exposed. You **MUST regenerate them** immediately in the Google Cloud Console.

## Step 1: Regenerate Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID
5. Delete the old credentials and create new ones:
   - **Application type**: Web application
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000`
     - `http://localhost:5173`
     - `http://127.0.0.1:5173`
   - **Authorized redirect URIs**:
     - `http://localhost:8000/api/auth/google/`
     - `http://localhost:8000/api/auth/google/callback/`

6. Copy the new **Client ID** and **Client Secret**

## Step 2: Update Backend Configuration

1. Update `.env` file with new credentials:
```bash
GOOGLE_CLIENT_ID=your-new-client-id
GOOGLE_CLIENT_SECRET=your-new-client-secret
DEBUG=True
SECRET_KEY=your-secret-key
```

2. Install required packages:
```bash
pip install -r requirements.txt
```

3. Apply migrations if needed:
```bash
python manage.py migrate
```

## Step 3: Update Frontend Configuration

1. Update `.env.local` (or create if not exists):
```bash
VITE_GOOGLE_CLIENT_ID=your-new-client-id
VITE_API_BASE_URL=http://localhost:8000/api
```

2. Install frontend Google OAuth package:
```bash
npm install @react-oauth/google jwt-decode
# or
pnpm add @react-oauth/google jwt-decode
```

## Step 4: Wrap Your App with GoogleAuthProvider

In your main App component or entry point:

```tsx
import { GoogleAuthProvider } from '@/components/GoogleAuthProvider';

export function App() {
  return (
    <GoogleAuthProvider>
      {/* Your app content */}
    </GoogleAuthProvider>
  );
}
```

## Step 5: Use the Google Login Component

In your login page or component:

```tsx
import { GoogleLogin } from '@/components/GoogleLogin';

export function LoginPage() {
  return (
    <GoogleLogin
      onSuccess={(user) => {
        console.log('Login successful:', user);
        // User data is stored in localStorage
      }}
      onError={(error) => {
        console.error('Login failed:', error);
      }}
    />
  );
}
```

## API Endpoint

**POST** `/api/auth/google/`

### Request:
```json
{
  "token": "google-id-token"
}
```

### Response (Success):
```json
{
  "success": true,
  "token": "django-auth-token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "username": "username"
  }
}
```

### Response (Error):
```json
{
  "error": "Invalid token"
}
```

## How It Works

1. **Frontend**: User clicks "Continue with Google"
2. **Google**: Returns an ID token
3. **Frontend**: Sends token to backend API
4. **Backend**: Verifies token with Google's servers
5. **Backend**: Creates/updates user in database
6. **Backend**: Returns Django auth token
7. **Frontend**: Stores token and redirects to home

## Authentication Headers

For subsequent API requests, include the auth token:

```typescript
const response = await fetch('/api/products/', {
  headers: {
    'Authorization': `Token ${authToken}`,
    'Content-Type': 'application/json',
  }
});
```

## Troubleshooting

### "Invalid token" error
- Check that token was generated with the correct Client ID
- Verify GOOGLE_CLIENT_ID is correct in backend settings

### CORS errors
- Ensure frontend URL is in Google OAuth "Authorized JavaScript origins"
- Check CORS_ALLOWED_ORIGINS in Django settings

### Token not being saved
- Check browser console for errors
- Verify localStorage is not blocked

### Token verification fails
- Ensure `google-auth` package is installed
- Check that Google credentials are valid
- Verify token is not expired
