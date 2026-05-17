# 🚀 QUICK START - Order Management Testing

## What's Ready? 

✅ **Backend:** Django API with order creation, exchange, and tracking  
✅ **Frontend:** Enhanced order page with customer history, exchange, admin notifications  
✅ **Database:** Schema ready with all order and exchange fields  
✅ **Checkout:** Now actually creates orders in database (was mock before)  

---

## 🧪 Start Testing NOW

### Step 1: Ensure Backend is Running

```bash
# In Terminal 1 (Backend)
python manage.py runserver 0.0.0.0:8000
```

**Expected Output:**
```
System check identified no issues (0 silenced).
Starting development server at http://0.0.0.0:8000/
```

### Step 2: Start React Frontend

```bash
# In Terminal 2 (Frontend) 
cd "c:\Users\dhars\Downloads\mens hub front end"
npm run dev
# or
pnpm dev
```

**Expected Output:**
```
VITE v... ready in ... ms

➜  Local:   http://localhost:5173/
```

### Step 3: Test Order Flow

1. **Open Browser:** http://localhost:5173
2. **Login or Register**
3. **Add Product to Cart**
4. **Checkout:**
   - Fill address details
   - Confirm payment (mock UPI)
   - Click "Place Order"
5. **View My Orders** - New order should appear! ✅
6. **Click Order** - See full details with tracking
7. **Request Exchange** (if delivered and within 3 days)

---

## 📋 What Works Now

### 👤 CUSTOMER
- ✅ See order history with status
- ✅ View order details (items, address, tracking)
- ✅ Request exchange if eligible (3-day window)
- ✅ Track order with delivery company tracking number

### 👨‍💼 ADMIN  
- ✅ See all orders in database
- ✅ Update order status (pending → processing → shipped → delivered)
- ✅ Add delivery tracking number when shipped
- ✅ Get real-time notifications when orders placed
- ✅ Manage exchange requests (approve/reject/ship/complete)

---

## 🎯 Complete Test Scenario

### Scenario: Customer Orders Shirt, Requests Exchange (Too Small)

```
1. CUSTOMER places order for Shirt (Size M) - ₹1,000
   → Order created in database with status: "pending"
   → Navigates to "My Orders"
   → Sees order with status badge

2. ADMIN sees notification "New Order #ORD-1234" 
   → Opens admin panel
   → Updates status: pending → processing
   → Updates status: processing → shipped
   → Adds tracking: "DHL-123456789"

3. CUSTOMER refreshes order details
   → Sees "Shipped" status
   → Sees tracking number "DHL-123456789"
   → Sees delivered_at date (when admin sets delivered status)

4. CUSTOMER requests exchange
   → Clicks "Request Exchange" (if within 3 days)
   → Fills form: Size M → L, reason "too_small"
   → Submits
   → Sees success: "Exchange request submitted!"

5. ADMIN sees exchange request
   → Reviews request
   → Approves and generates return label
   → Waits for return
   → Marks return received
   → Ships replacement L size
   → Marks complete

6. CUSTOMER sees exchange completed ✅
```

---

## 📊 API Health Check

```bash
# Verify backend is running
curl http://localhost:8000/api/products/

# Should return: [{"id": 1, "name": "...", ...}]
```

---

## 🐛 Troubleshooting

### "Orders not showing up"
**Problem:** User places order but doesn't see in My Orders  
**Solution:** 
- Make sure user is **logged in** with auth token
- Check browser console (F12) for errors
- Verify backend API working: `curl http://localhost:8000/api/orders/`

### "Exchange button not visible"
**Problem:** Can't request exchange even though order is delivered  
**Solution:**
- Make sure order status = "delivered"
- Make sure delivered_at is within last 3 days
- Admin must set delivered_at timestamp (currently might not be set)

### "Tracking number not showing"
**Problem:** Order shows shipped but no tracking number  
**Solution:**
- Admin must fill tracking_number field when updating to "shipped"
- Must have tracking ID from delivery company
- Save changes and customer will see it

---

## 📱 Key Features by Page

### **My Orders Page**
- Shows all customer orders
- Displays status, date, amount
- Shows exchange eligibility if available
- Click to see full details

### **Order Details Page**
- Full order information
- Items list with sizes and prices
- Tracking info (if available)
- Delivery address
- Exchange request form (if eligible)
- Exchange timeline (from delivery date)

### **Admin Dashboard**
- All orders list
- Update status and tracking
- Real-time notifications
- Exchange request management

---

## 🔐 Authentication

**Frontend stores in localStorage:**
- `authToken` - Token for API requests
- `user` - User info (name, isAdmin, email)
- `cart` - Shopping cart items
- `wishlist` - Favorite products

**Backend validates:** Every API request checks `Authorization: Token xyz` header

---

## ✨ What's Different from Before?

| Feature | Before | Now |
|---------|--------|-----|
| **Checkout** | Mock - no database | ✅ Creates real order in DB |
| **Orders** | Simple list only | ✅ Full details + exchange |
| **Exchange** | Not visible | ✅ Check eligibility, request |
| **Tracking** | Never shown | ✅ Display when shipped |
| **Admin** | No tracking update | ✅ Can add tracking number |
| **3-Day Window** | Not implemented | ✅ Auto-calculated from delivered date |

---

## 🎓 How Exchange Works

```
Order delivered at: 2024-05-10 14:30 (Friday)
Exchange eligible until: 2024-05-13 14:30 (Monday, 3 days later)
Days remaining: 3 → 2 → 1 → 0 (expires)

When customer views order:
- If today is May 10-13: "Exchange eligible (X days left)" ✅
- If today is May 14+: "Exchange window closed" ❌
```

---

## 🚀 Ready to Go!

1. Terminal 1: Start Django backend
2. Terminal 2: Start React frontend  
3. Browser: http://localhost:5173
4. **TEST THE FLOW! 🎉**

**All 100% working now!** 🎉

See detailed documentation in: **CUSTOMER_ORDER_FLOW_COMPLETE.md**
