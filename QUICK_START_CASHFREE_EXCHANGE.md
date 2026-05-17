# 🚀 Cashfree + Exchange - Quick Start (5 Minutes)

## Ready-to-Use Implementation

### ✅ What's Already Done
```
Backend API        → COMPLETE (payment + exchange endpoints)
Database Models    → COMPLETE (with migration)
Frontend Services  → COMPLETE (2 service files ready)
Documentation      → COMPLETE (detailed guides included)
```

### ⏳ What YOU Need to Do

---

## 1️⃣ Provide Credentials (2 min)

**When ready, share:**
```
Cashfree App ID: _____________________
Cashfree Secret Key: _____________________
```

Get from: https://cashfree.com → Settings → API Keys

---

## 2️⃣ Run Database Migration (1 min)

```bash
cd "c:\Users\dhars\Downloads\mens hub front end"
python manage.py migrate api
```

✅ Creates tables + adds payment/exchange fields

---

## 3️⃣ Add Environment Variables (1 min)

Create `.env` file in project root:
```
CASHFREE_APP_ID=your_app_id
CASHFREE_SECRET_KEY=your_secret_key
CASHFREE_MODE=TEST
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
```

---

## 4️⃣ Update Django Settings (1 min)

In `backend_project/settings.py`, add:
```python
import os

CASHFREE_APP_ID = os.getenv('CASHFREE_APP_ID', '')
CASHFREE_SECRET_KEY = os.getenv('CASHFREE_SECRET_KEY', '')
CASHFREE_MODE = os.getenv('CASHFREE_MODE', 'TEST')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:8000')
```

---

## API Endpoints Ready to Use

### Payment
```
POST /api/orders/initiate_payment/
POST /api/orders/verify_payment/
```

### Exchange
```
POST /api/orders/{id}/request_exchange/
GET /api/orders/{id}/exchange_status/
GET /api/exchanges/pending/
PATCH /api/exchanges/{id}/approve/
PATCH /api/exchanges/{id}/reject/
PATCH /api/exchanges/{id}/complete/
```

---

## Frontend Integration Template

### Import Services
```typescript
import { cashfreeService } from './src/services/cashfreeService';
import { exchangeService } from './src/services/exchangeService';
```

### Payment Handler
```typescript
const handlePayment = async () => {
  const result = await cashfreeService.initiatePayment({
    orderId: "ORD-123",
    amount: total,
    customerName: form.name,
    customerEmail: user?.email,
    customerPhone: form.phone
  });
  
  // Payment modal opens automatically
};
```

### Exchange Request
```typescript
const handleExchange = async () => {
  const result = await exchangeService.requestExchange(orderId, {
    product_id: 5,
    product_name: "Shirt",
    size_old: "M",
    size_new: "L",
    reason: "too_small"
  });
  
  toast.success("✅ Exchange request submitted!");
};
```

---

## Features Implemented

### 💳 Payment
- ✅ Cashfree integration (TEST + PROD modes)
- ✅ Multiple payment methods
- ✅ Secure transaction
- ✅ Order status tracking

### 📦 Exchange (3-4 Days Only)
- ✅ Size mismatch exchange only
- ✅ Automatic 3-day eligibility window
- ✅ Return label generation
- ✅ Replacement tracking
- ✅ Complete admin workflow

---

## Testing Workflow

### 1. Test Payment
1. Start servers: `python manage.py runserver` + `npm run dev`
2. Add product → Checkout
3. Select "Cashfree"
4. Complete mock payment (TEST mode)
5. Verify order created

### 2. Test Exchange
1. Mark order as delivered (admin)
2. User requests exchange (order history)
3. Admin approves/rejects (admin panel)
4. Complete exchange workflow

---

## Important Notes

⚠️ **TEST MODE FIRST**
- Use TEST credentials for sandbox testing
- No real money charged
- Perfect for verifying flow

⚠️ **3-4 DAY WINDOW**
- Exchange only for size mismatch
- Expires 3 days after delivery
- User must have unworn product

⚠️ **ADMIN REQUIRED**
- Only admins can approve exchanges
- Only admins can ship replacements
- Logged in as: menshubadmin01@gmail.com

---

## Files Location

| File | Location |
|------|----------|
| Cashfree Service | `src/services/cashfreeService.ts` |
| Exchange Service | `src/services/exchangeService.ts` |
| Migration | `api/migrations/0008_order_exchange_cashfree.py` |
| Setup Guide | `CASHFREE_EXCHANGE_SETUP.md` |
| Frontend Guide | `CASHFREE_EXCHANGE_FRONTEND_GUIDE.md` |
| Full Docs | `CASHFREE_EXCHANGE_COMPLETE.md` |

---

## Common Issues

### ❌ "Credentials not configured"
→ Check `.env` file + Django settings

### ❌ "Exchange button missing"
→ Order must be delivered + within 3 days

### ❌ "Admin can't see exchanges"
→ User must have `is_admin=true`

---

## Next Actions

```
1. Share Cashfree credentials
2. Run migration: python manage.py migrate api
3. Update .env + Django settings
4. Test payment flow
5. Test exchange flow
6. Deploy to production
```

**Everything else is ready! Just need credentials to test.** 🚀

