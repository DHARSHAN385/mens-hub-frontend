# Google OAuth Implementation Guide - Setup Complete

## Overview
Google OAuth authentication has been successfully implemented for the Mens Hub application. Users can now log in using their Google accounts, and their information is stored in the database.

## What Was Implemented

### 1. **Backend Changes**

#### Models (`api/models.py`)
- Added `GoogleUser` model to store Google OAuth user data:
  - `google_id`: Unique Google identifier (required, unique)
  - `email`: User's email address (required, unique)
  - `name`: User's full name
  - `picture`: User's profile picture URL
  - `user`: OneToOne relationship with Django's User model
  - `created_at`, `updated_at`: Timestamps

#### Serializers (`api/serializers.py`)
- Added `GoogleUserSerializer`: Serializes Google OAuth user data
- Added `UserSerializer`: Serializes Django User model with Google user relationship

#### Views (`api/views.py`)
- Implemented `google_oauth_login` endpoint:
  - Accepts Google ID token from frontend
  - Verifies token using Google's OAuth2 library
  - Extracts user information (email, name, picture, google_id)
  - Creates/updates GoogleUser in database
  - Creates/links Django User account
  - Returns authentication token and user data
  - Full error handling with proper HTTP status codes

#### Database (`api/migrations/0005_googleuser.py`)
- Created migration for GoogleUser model

#### Admin Panel (`api/admin.py`)
- Registered GoogleUser model in Django admin
- Added custom admin interface with:
  - List display showing name, email, google_id, linked user, and created date
  - Search by name, email, or google_id
  - Filters by creation date
  - Organized fieldsets for user info and OAuth details

#### Settings (`backend_project/settings.py`)
- Added Google OAuth configuration:
  - `GOOGLE_CLIENT_ID`: Loaded from environment
  - `GOOGLE_CLIENT_SECRET`: Loaded from environment

### 2. **Environment Configuration**
- Updated `.env` file with:
  - Client ID: <your-google-client-id>.apps.googleusercontent.com
  - Client Secret: <your-google-client-secret>
- Frontend `.env.local` already configured with `VITE_GOOGLE_CLIENT_ID`

### 3. **Frontend Integration**
- `GoogleAuthProvider.tsx`: Provides Google OAuth context
- `GoogleLogin.tsx`: Handles Google login button and token verification
- Sends token to backend at `/api/auth/google/` endpoint
- Stores authentication token in localStorage
- Stores user data in localStorage

## How It Works

### Authentication Flow

```
1. User clicks "Sign in with Google" button
   ↓
2. Google presents login/consent screen
   ↓
3. User selects Google account and grants permissions
   ↓
4. Frontend receives Google ID token
   ↓
5. Frontend sends token to backend (/api/auth/google/)
   ↓
6. Backend verifies token with Google's servers
   ↓
7. Backend extracts user data (email, name, picture)
   ↓
8. Backend creates/updates GoogleUser in database
   ↓
9. Backend creates/links Django User account
   ↓
10. Backend generates authentication token
   ↓
11. Backend returns authentication token + user data
   ↓
12. Frontend stores token and user data in localStorage
   ↓
13. User is logged in and can access protected resources
```

## Setup Instructions

### 1. **Apply Database Migration**
```bash
cd c:\Users\dhars\Downloads\mens hub front end
python manage.py migrate
```

### 2. **Install Required Packages**
All required packages are already in `requirements.txt`:
- google-auth==2.27.0
- google-auth-oauthlib==1.2.0
- google-auth-httplib2==0.2.0
- djangorestframework==3.14.0
- rest_framework.authtoken

Install if not already done:
```bash
pip install -r requirements.txt
```

### 3. **Start the Backend Server**
```bash
python manage.py runserver
```

### 4. **Start the Frontend Development Server**
```bash
npm run dev
# or
pnpm dev
```

## API Endpoint

### POST `/api/auth/google/`

**Request:**
```json
{
  "token": "<google_id_token_from_frontend>"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "<django_auth_token>",
  "user": {
    "id": 1,
    "email": "user@gmail.com",
    "name": "John Doe",
    "username": "user",
    "google_id": "109876543210987654321",
    "picture": "https://lh3.googleusercontent.com/..."
  }
}
```

**Error Response (400/401):**
```json
{
  "error": "Invalid token: ..."
}
```

## Database Structure

### GoogleUser Table
```
├── id (PK)
├── google_id (UNIQUE)
├── email (UNIQUE)
├── name
├── picture (nullable)
├── user (FK to User model)
├── created_at
└── updated_at
```

## Testing the Implementation

### 1. **Test Google OAuth Login**
- Navigate to your app frontend
- Click "Sign in with Google" button
- Select a Google account
- Should redirect/display logged-in user

### 2. **Verify Data in Database**
```bash
# Access Django shell
python manage.py shell

# Check GoogleUser records
from api.models import GoogleUser
GoogleUser.objects.all()

# Check linked User records
from django.contrib.auth.models import User
User.objects.all()
```

### 3. **Check Admin Panel**
- Navigate to `http://localhost:8000/admin/`
- Login with Django admin credentials
- Go to "Google Users" section
- Should see created Google OAuth users

### 4. **Test API Endpoint Directly**
Using curl or Postman:
```bash
curl -X POST http://localhost:8000/api/auth/google/ \
  -H "Content-Type: application/json" \
  -d '{"token": "<your_google_id_token>"}'
```

## Features Implemented

✅ Google OAuth 2.0 authentication
✅ Token verification using Google's OAuth2 library
✅ User data extraction from Google ID token
✅ Automatic user account creation/updating
✅ Database persistence with GoogleUser model
✅ Django User model linking
✅ Token-based authentication (DRF Token)
✅ Comprehensive error handling
✅ Admin panel integration
✅ User profile picture storage
✅ Email uniqueness validation

## Security Notes

1. **Token Verification**: All tokens are verified server-side using Google's official libraries
2. **HTTPS Required**: In production, ensure HTTPS is used for all OAuth communications
3. **Client ID Validation**: Backend verifies the token was issued for your specific Client ID
4. **Environment Variables**: Credentials stored in `.env` file (not committed to version control)
5. **Email Uniqueness**: Only one account per email address to prevent duplicates

## Troubleshooting

### Issue: "Invalid token" error
- **Cause**: Google ID token expired or invalid
- **Solution**: Frontend should request fresh token; token expires after ~1 hour

### Issue: "Authentication failed" error
- **Cause**: Backend cannot verify token or missing credentials
- **Solution**: 
  - Check `.env` file has correct credentials
  - Ensure Django server is running
  - Restart Django server after updating `.env`

### Issue: User not saved in database
- **Cause**: Migration not applied
- **Solution**: Run `python manage.py migrate`

### Issue: CORS error from frontend
- **Cause**: Backend not allowing frontend origin
- **Solution**: Check `CORS_ALLOWED_ORIGINS` in `settings.py`

## Next Steps (Optional Enhancements)

1. Add user profile pages to display Google profile info
2. Implement logout functionality
3. Add role-based access control
4. Implement refresh token mechanism
5. Add social media linking (Facebook, GitHub, etc.)
6. Implement password-based authentication as fallback
7. Add two-factor authentication
8. Track user activity and analytics

## Files Modified

1. ✅ `.env` - Updated with Google credentials
2. ✅ `api/models.py` - Added GoogleUser model
3. ✅ `api/serializers.py` - Added GoogleUserSerializer and UserSerializer
4. ✅ `api/views.py` - Implemented google_oauth_login endpoint
5. ✅ `api/admin.py` - Registered GoogleUser in admin panel
6. ✅ `api/urls.py` - Already configured with google_oauth_login route
7. ✅ `api/migrations/0005_googleuser.py` - Created migration
8. ✅ `backend_project/settings.py` - Added Google OAuth settings
9. ✅ `.env.local` - Already has VITE_GOOGLE_CLIENT_ID

## Support

For any issues or questions about the implementation, refer to:
- Django REST Framework: https://www.django-rest-framework.org/
- Google OAuth 2.0: https://developers.google.com/identity/protocols/oauth2
- Google Auth Library: https://google-auth.readthedocs.io/

---
**Implementation Date**: May 2026
**Status**: ✅ Complete and Ready for Testing
