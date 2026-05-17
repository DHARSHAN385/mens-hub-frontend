# 🚀 Mens Hub Backend & Frontend - Complete Startup Guide

## Prerequisites
- Python 3.8+ installed
- MySQL running on localhost:3306
- Node.js/npm or pnpm installed

---

## 🔧 Step 1: Start Django Backend Server

Open a terminal and run:

```bash
cd "c:\Users\dhars\Downloads\mens hub front end"
python manage.py runserver 8000
```

You should see:
```
Starting ASGI/Daphne version 4.0.0 development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

**Keep this terminal running!** (Backend must be running for admin updates to persist)

---

## 🎨 Step 2: Start Frontend Development Server

Open a **new terminal** and run:

```bash
cd "c:\Users\dhars\Downloads\mens hub front end"
pnpm dev
```

Or if using npm:
```bash
npm run dev
```

Visit: http://localhost:5173 (or the URL shown in terminal)

---

## 🔐 Admin Login Credentials

When you access the admin panel:

- **Email:** `mubarak.ali@menshub.com` or `menshubadmin01@gmail.com`
- **Password:** `S@kMf$34`

---

## ✅ Verify Everything is Working

### Test 1: Can you see products?
- Navigate to Home page → should show products

### Test 2: Can you login?
- Click "Account" → "Login with Email" → Use admin credentials above

### Test 3: Can you access admin panel?
- After login, click "Account" → should see "Admin Panel" option
- Click it → should see Products, Categories, Banner tabs

### Test 4: Can you update a product? (Main Test)
1. Click "Products" tab
2. Click Edit on any product
3. Change the name to something like "TEST UPDATE"
4. Click Save
5. You should see ✓ "Product saved to database"
6. **Now refresh the page (F5)**
7. The product name should STILL be "TEST UPDATE"
   - ✅ **If it is:** Persistence is working!
   - ❌ **If it's back to original:** Backend might not be running

---

## 🗄️ Database Info

- **Type:** MySQL
- **Name:** `mens_hub_db`
- **User:** `root`
- **Password:** `1127`
- **Host:** localhost:3306

### Check MySQL is running:
```bash
mysql -u root -p1127 -e "SELECT 1;"
```

---

## 🐛 Troubleshooting

### "Failed to save product" error
- **Cause:** Backend server not running
- **Fix:** Start backend with `python manage.py runserver 8000`

### "Admin access required" error
- **Cause:** Not logged in as admin
- **Fix:** Login with admin email and password (see above)

### Products show old data after refresh
- **Cause:** Backend server crashed or not running
- **Fix:** Check backend terminal, restart if needed

### MySQL connection error
- **Cause:** MySQL service not running
- **Fix:** Start MySQL service

---

## 📋 Summary

| Service | Port | Command | Status |
|---------|------|---------|--------|
| Backend (Django) | 8000 | `python manage.py runserver 8000` | ✅ Required |
| Frontend (React) | 5173 | `pnpm dev` | ✅ Required |
| MySQL | 3306 | System Service | ✅ Required |

---

## 📝 What Changed

All admin updates now:
- ✅ Save to MySQL database immediately
- ✅ Persist after page refresh
- ✅ Are reflected in real-time for all users
- ❌ NO temporary/memory-only storage
- ❌ Deletes are permanent (no undo)

---

**Last Updated:** May 10, 2026
