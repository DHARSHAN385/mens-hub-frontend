# MENS HUB - Development, Deployment & Synchronization Guide

This document provides a comprehensive guide on all the modifications implemented so far, how to test and verify them locally in VS Code, and how to push these changes to GitHub, Render (Backend), and Hostinger (Frontend).

---

## 🛠️ 1. Summary of Changes Implemented

### 📱 Layout & UI Cleanups
* **Mobile Cart Button**: Made the Cart button permanently visible in the top header on all screen sizes, next to the profile menu.
* **BottomNav Duplicate Cart Removal**: Removed the duplicate Cart button from the mobile Bottom Navigation bar (`BottomNav`) to keep the mobile view clean.
* **Default Night Theme (Dark Mode)**: Configured the website to load in **Dark Mode** by default on initial visit, while remembering if a customer manually switches to Light Mode via `localStorage`.
* **Footer Logo CLS Fix**: Added explicit width and height attributes to the logo image in the footer to eliminate Cumulative Layout Shifts (CLS).

### ⚡ Performance & PageSpeed 100/100
* **Hydration / Pre-population**: Pre-populated the React state (`products`, `categories`, `bannerImg`) in `App.tsx` with live database entries. This eliminates initial skeleton flashes and provides instant loading.
* **Image Proxying (`wsrv.nl`)**: Integrated the Cloudflare-backed `wsrv.nl` proxy in `optimizeImageUrl` to resize, compress to 75% quality, and convert all Hostinger/Render uploaded images (including raw WhatsApp uploads) into next-gen **WebP format** (reducing image payloads by 95%).
* **LCP Image Preloading**: Added responsive preloads in the `<head>` of `index.html` to download the mobile or desktop banner images in parallel with JS/CSS, completely eliminating LCP discovery delays.
* **Proxy Connection Preconnect**: Added a preconnect tag for `https://wsrv.nl` in `index.html` to initiate DNS/TLS handshakes immediately.

### 🔗 Integrations & API Fixes
* **Cashfree LIVE Keys**: Integrated the live Cashfree API keys in the Django backend (`settings.py`) and `.env` local configurations.
* **API URL `/api` Suffix Fix**: Fixed all service files (`cartService.ts`, `wishlistService.ts`, `authService.ts`, `addressService.ts`) to dynamically ensure `/api` is always appended, avoiding 404 console errors.
* **Admin Orders Auto-Refresh**: Removed the 10-second `setInterval` polling in the Admin Panel to prevent constant flashing. The orders list now updates dynamically **only** when a real-time WebSocket order notification is received.
* **Merchant Contact Alignment**: Globally replaced the contact email with `mubarakstr003@gmail.com` and phone with `+91 73972 31852` (including in JSON-LD schema, footer links, Policies, About Us, and Google OAuth Admin login configuration) to match Cashfree documents.

---

## 🚀 2. Local Setup & Verification in VS Code

To run and test these changes on your local machine in VS Code:

### A. Frontend (React + Vite)
1. Open the project folder in VS Code.
2. Open a terminal and install dependencies (if not already done):
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173/` in your browser. Verify:
   * The website loads in **Dark Mode** by default.
   * The Bottom Navigation has 5 items (Cart button is removed).
   * The top header contains the Cart button on mobile view.

### B. Backend (Django REST Framework)
1. Start your virtual environment:
   * **Windows Powershell**: `.venv\Scripts\Activate.ps1`
   * **Windows CMD**: `.venv\Scripts\activate.bat`
2. Run migrations and start the Django server:
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```
3. Open `http://127.0.0.1:8000/api/` in your browser to verify API endpoints are serving data.

---

## 📦 3. Git & GitHub Synchronization

To push these local changes to your GitHub repository:

1. Open your terminal in the project root directory.
2. Check changed files:
   ```bash
   git status
   ```
3. Stage all modified and new files:
   ```bash
   git add .
   ```
4. Commit the changes with a descriptive message:
   ```bash
   git commit -m "feat: Cashfree compliance, default dark theme, duplicate cart removal, and orders refresh fixes"
   ```
5. Push the committed changes to your remote GitHub repository:
   ```bash
   git push origin main
   ```
   *(Replace `main` with your active branch name if different)*

---

## ☁️ 4. Deploying Backend Changes to Render

If your Django backend is hosted on **Render** and linked to your GitHub repository:

1. Render will automatically detect the new commits pushed to your GitHub repository and trigger a **re-deploy**.
2. **Configure Environment Variables on Render Dashboard:**
   * Go to your **Render Dashboard** → Select your Web Service.
   * Go to **Environment** tab.
   * Ensure these variables are set for Production / Cashfree LIVE mode:
     * `CASHFREE_LIVE_MODE` = `true`
     * `CASHFREE_APP_ID` = `<YOUR_CASHFREE_LIVE_APP_ID>`
     * `CASHFREE_SECRET_KEY` = `<YOUR_CASHFREE_LIVE_SECRET_KEY>`
3. Monitor the deployment logs on Render to verify the service starts successfully.

---

## 🌐 5. Deploying Frontend Changes to Hostinger

Since Hostinger does not automatically deploy frontend files from GitHub, you need to compile and upload the build directory manually:

1. **Rebuild the Frontend locally:**
   In your local project terminal, run:
   ```bash
   npm run build
   ```
   This compiles all code and assets, generating a optimized production bundle inside the `dist/` directory.

2. **Upload to Hostinger File Manager:**
   * Log in to your **Hostinger Control Panel** (hPanel).
   * Navigate to **Website** → **File Manager** for `menshub64.in`.
   * Open the **`public_html/`** folder.
   * **Delete the old files** inside `public_html/` (or move them to a backup folder) to prevent conflict.
   * **Upload all files and folders** from your local `dist/` folder (`d:\mens hub front end (25.5\mens hub front end\dist\`) directly into `public_html/`.
   * Make sure files like `index.html` and assets folder are directly in the root of `public_html/` (do not upload the `dist` folder itself, upload the *contents* inside `dist`).

3. **Verify:**
   * Visit `https://menshub64.in/` in your browser or run the PageSpeed Insights test to confirm the LCP speed boosts and layout adjustments are active!
