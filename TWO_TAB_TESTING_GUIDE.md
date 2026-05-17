# 🧪 TWO-TAB TESTING GUIDE - Customer vs Admin

## 📋 What You'll Test

✅ **Customer Tab:**
- Place order with phone & pincode validation
- View order in history
- Orders persist after refresh
- Request exchange (if within 3 days)

✅ **Admin Tab:**
- See real-time notifications of new orders
- View all orders
- Update order status (pending → processing → shipped → delivered)
- Add tracking number when shipping
- Manage exchange requests

---

## 🔧 SETUP - Prerequisites

### 1. Backend Must Be Running
```bash
# Terminal 1: Backend
python manage.py runserver 0.0.0.0:8000
```

Check it's working:
```bash
curl http://localhost:8000/api/products/ | head -20
```

Expected: JSON array of products

### 2. Start Frontend
```bash
# Terminal 2: Frontend
cd "c:\Users\dhars\Downloads\mens hub front end"
npm run dev
```

Expected output:
```
➜  Local:   http://localhost:5173/
```

---

## 🎯 STEP-BY-STEP TESTING

### Phase 1: Setup Two Browser Tabs

#### Browser Setup
1. **Tab 1 (Customer):** http://localhost:5173
2. **Tab 2 (Admin):** http://localhost:5173
   - Use Side-by-side view or arrange windows

**OR Use Browser DevTools Split View:**
- Open DevTools (F12)
- Cmd/Ctrl + Shift + M (toggle device toolbar)
- Opens narrow view good for split screen

---

### Phase 2: Customer Registration & Admin Login

#### Tab 1 - Customer Registration
1. Click "Create Account"
2. Email: `customer1@test.com`
3. Password: `test123456`
4. Click "Register"
5. **COPY AUTH TOKEN from Console:**
   ```javascript
   // Open Console (F12 → Console tab)
   localStorage.getItem('authToken')
   // Copy the token value
   ```

#### Tab 2 - Admin Login
1. Click "Login with Email"
2. Email: `admin@menshub.com` (admin account)
3. Password: `admin123456`
4. Admin should have badge in header
5. **VERIFY ADMIN ACCESS:**
   - Should see "Admin" button in header
   - Can access `/admin` section

---

### Phase 3: Customer Places Order

#### Tab 1 - Customer Order Flow

**Step 1: Add Product to Cart**
- Browse products
- Click on a product (e.g., "Shirt")
- Select size (M, L, XL, etc.)
- Click "Buy Now" or "Add to Cart"

**Step 2: Checkout**
- Click "Cart" icon
- Click "Checkout"
- Fill form with **VALIDATION:**

```
Name: John Doe
Phone: 9876543210  ✅ Valid (10 digits, starts with 9)
       6234567890  ✅ Valid (10 digits, starts with 6)
       5234567890  ❌ Invalid (starts with 5)
       987654321   ❌ Invalid (only 9 digits)

Address: 123 Main Street
City: Chennai
Pincode: 600001  ✅ Valid (6 digits)
         600     ❌ Invalid (only 3 digits)
         60000X  ❌ Invalid (has letter)
```

- If validation fails → **Red error message appears**
- If valid → "Continue to Payment" button enables

**Step 3: Payment**
- Confirm UPI Payment (mock)
- Shows "Payment confirmed"

**Step 4: Review & Place Order**
- Review order details
- Click "Place Order"
- **Should see success:** "✅ Order placed! #ORD-XXXX"
- Redirected to "My Orders"

**Step 5: Verify Order Appears**
- Order should appear immediately in list
- Status: "pending"
- Shows order number, date, amount
- Click order to see full details

---

### Phase 4: Admin Sees Real-Time Notification

#### Tab 2 - Admin Verification

**Immediate Actions:**
1. Check "Notifications" section in Admin Panel
2. Should see new order notification:
   ```
   Order #ORD-XXXX
   Customer: John Doe
   Amount: ₹XXXX
   Status: Unread (red dot)
   ```

3. **If no notification:**
   - Refresh admin page (F5)
   - Check browser console for errors
   - Check backend logs for errors

**Mark as Read:**
1. Click notification
2. Status changes to read (gray)
3. Notification disappears from "Unread"

---

### Phase 5: Persistence Test - Refresh Orders

#### Tab 1 - Customer Refresh Test
1. Click "My Orders"
2. Verify order shows
3. **Press F5** to refresh
4. **Order should STILL appear** ✅ (persisted to database)
5. If order disappears ❌ → Database issue

#### Tab 2 - Admin Refresh Test
1. Go to Admin Panel
2. View "Orders" list
3. New order should be visible
4. **Press F5** to refresh
5. **Order should STILL appear** ✅

---

### Phase 6: Admin Updates Order Status

#### Tab 2 - Admin Panel

**Step 1: Find the Order**
- Click "Admin"
- Go to "Orders" section
- Find order #ORD-XXXX from customer

**Step 2: Update Status**
- Click on order
- Click "Update Status"
- Select: **pending** → **processing**
- Click "Save"
- Confirm: "✅ Order updated successfully"

**Step 3: Add Tracking (when shipped)**
- Update status again
- Select: **processing** → **shipped**
- Add tracking number: `DHL-123456789`
- Click "Save"

**Step 4: Mark Delivered**
- Update status again
- Select: **shipped** → **delivered**
- This sets `delivered_at` timestamp
- **IMPORTANT:** Exchange window is now 3 days from this moment

---

### Phase 7: Customer Sees Updated Status

#### Tab 1 - Customer View

**Step 1: Check Updated Status**
- Refresh "My Orders" page
- Order status should change from "pending" to "processing"
- Then "shipped"
- Then "delivered"

**Step 2: View Tracking Number**
- Click order details
- Should show:
  ```
  📦 ₹XXXX
  🚚 Tracking: DHL-123456789
  ✅ Delivered on May 10, 2024
  ```

**Step 3: Exchange Eligibility**
- If order is "delivered" and within 3 days
- Should show green box: "✅ Eligible for Size Exchange"
- Should show "3 days remaining"
- Exchange form should appear

---

### Phase 8: Exchange Request (3-Day Window)

#### Tab 1 - Customer Requests Exchange

**ONLY appears if:**
- ✅ Order status = "delivered"
- ✅ Within 3 days of delivered_at
- ✅ Not previously exchanged

**Step 1: Fill Exchange Form**
```
Product: Shirt
Current Size: M
New Size: L
Reason: Too Small
Details: "Shirt fits too small, need larger"
```

**Step 2: Submit**
- Click "Request Exchange"
- Should see: "✅ Exchange request submitted! Admin will review soon."

**Step 3: Verify Request Sent**
- Refresh order details
- Exchange status might show: "pending review" (if backend returns it)

---

### Phase 9: Admin Approves/Rejects Exchange

#### Tab 2 - Admin Reviews Exchange

**Step 1: View Exchange Requests**
- Go to Admin → "Exchanges" or "Exchange Requests"
- Should see pending exchange from customer

**Step 2: Approve Exchange**
- Click exchange request
- Click "Approve"
- Generate return label (system creates label URL)
- Click "Save"

**Step 3: After Return is Received**
- Click "Mark Return Received"
- System records return date
- Click "Save"

**Step 4: Ship Replacement**
- Click "Ship Replacement"
- Add replacement tracking: `DHL-999999999`
- Click "Save"

**Step 5: Mark Complete**
- Click "Complete Exchange"
- Exchange marked as completed
- Customer receives notification

---

## ✅ Validation Rules (MUST IMPLEMENT)

### Phone Number Validation
```
✅ VALID:
  - 9876543210 (10 digits, starts with 9)
  - 8765432109 (10 digits, starts with 8)
  - 7654321098 (10 digits, starts with 7)
  - 6543210987 (10 digits, starts with 6)

❌ INVALID:
  - 5876543210 (starts with 5)
  - 987654321  (only 9 digits)
  - 98765432100 (11 digits)
  - 98-7654-3210 (has special chars)
  - 987654abcd (has letters)

Rules:
- Exactly 10 digits
- First digit must be 6, 7, 8, or 9
- Only numeric digits allowed
```

### Pincode Validation
```
✅ VALID:
  - 600001 (6 digits)
  - 560001 (6 digits)
  - 110001 (6 digits)

❌ INVALID:
  - 60001  (only 5 digits)
  - 6000010 (7 digits)
  - 60000X (has letter)
  - 600-001 (has special char)

Rules:
- Exactly 6 digits
- Only numeric digits allowed
```

---

## 🔴 Troubleshooting

### Problem 1: "Order placed but doesn't appear in admin"
**Cause:** Orders not being saved to database
**Solution:**
1. Check backend logs for errors
2. Verify auth token is valid
3. Check database: `SELECT * FROM api_order LIMIT 5;`

### Problem 2: "Admin doesn't see real-time notification"
**Cause:** WebSocket or polling not working
**Solution:**
1. Refresh admin page
2. Check browser network tab for notification requests
3. Check backend for notification creation
4. May need to implement WebSocket for real-time (currently refreshing)

### Problem 3: "Order disappears after refresh"
**Cause:** Order not persisted to database
**Solution:**
1. Check Django database
2. Verify OrderSerializer is saving all fields
3. Check for validation errors in API response
4. Look at backend console for save() errors

### Problem 4: "Phone validation not working"
**Solution:**
- Check console for validation errors
- Look at form error messages
- Ensure validation function is called before step 1
- Phone field shows red error if invalid

### Problem 5: "Pincode validation not working"
**Solution:**
- Same as phone validation above
- Ensure exactly 6 digits
- Check if input field is restricting to 6 chars

---

## 📊 Data Flow Diagram

```
CUSTOMER TAB                          ADMIN TAB
┌─────────────────┐                ┌─────────────────┐
│  Add to Cart    │                │  Admin Panel    │
│  Fill Address   │                │  Orders List    │
└────────┬────────┘                └────────┬────────┘
         │                                  │
         │ Validate phone & pincode         │
         │ (10 digit, 6+ pincode)          │
         │                                  │
         ↓                                  │
┌─────────────────┐                        │
│ Place Order     │                        │
│ POST /orders/   │────────────────────────→ Real-time
└────────┬────────┘                        │ Notification
         │                                  │
         ↓                                  ↓
BACKEND (Django)                   ┌──────────────────┐
┌──────────────────────────────┐   │ View Notification│
│ Order.objects.create()       │   │ Update Status    │
│ ├─ user = customer           │   │ Add Tracking     │
│ ├─ items = cart items        │   │ Approve Exchange │
│ ├─ status = pending          │   └──────────────────┘
│ ├─ phone = 9876543210 ✓      │
│ ├─ pincode = 600001 ✓        │
│ └─ Save to MySQL database    │
└──────────────────────────────┘
         │
         ↓
┌─────────────────┐                ┌─────────────────┐
│ Order appears   │                │ Sees in list    │
│ in My Orders    │                │ Admin panel     │
│ Status: pending │────────────────│ Status: pending │
└─────────────────┘                └─────────────────┘
         │                                  │
         ↓                                  ↓
    (After Admin                  (Clicks Update Status)
     marks delivered)
         │                                  │
         ↓                                  ↓
┌─────────────────┐                ┌─────────────────┐
│ Shows tracking  │                │ Adds tracking   │
│ Exchange form   │                │ Changes status  │
│ 3-day window    │ ←───────────── │ Saves to DB     │
└─────────────────┘                └─────────────────┘
```

---

## 🎯 Complete Test Checklist

### Customer Flow
- [ ] Create account
- [ ] Add product to cart
- [ ] Fill address with valid phone (10 digits, 6-9)
- [ ] Fill address with valid pincode (6 digits)
- [ ] Error shows if phone invalid
- [ ] Error shows if pincode invalid
- [ ] Place order successfully
- [ ] Order appears in "My Orders"
- [ ] Refresh page → order still there ✅
- [ ] View order details (items, address, tracking)
- [ ] See exchange form (if within 3 days)
- [ ] Request exchange successfully

### Admin Flow
- [ ] Login as admin
- [ ] Access admin panel
- [ ] See notification when customer orders
- [ ] View all orders in list
- [ ] Update order status (pending → processing)
- [ ] Update order status (processing → shipped)
- [ ] Add tracking number
- [ ] Refresh → order still visible
- [ ] Update to delivered
- [ ] See exchange requests
- [ ] Approve/reject exchange

### Database Persistence
- [ ] Customer orders persist after refresh
- [ ] Admin sees same orders after refresh
- [ ] Tracking number saved
- [ ] All order data in database

---

## 🚀 Quick Start Commands

```bash
# Terminal 1
python manage.py runserver 0.0.0.0:8000

# Terminal 2
npm run dev

# Browser
Tab 1: http://localhost:5173  (Customer)
Tab 2: http://localhost:5173  (Admin)
```

---

## 📝 Important Notes

1. **Validation Happens Frontend:**
   - Phone: 10 digits, starts with 6-9
   - Pincode: 6 digits
   - Error messages appear in real-time

2. **Data Persists:**
   - All orders saved to MySQL database
   - Survives page refresh
   - Survives browser restart

3. **Admin Real-Time:**
   - Currently: Manual refresh shows new orders
   - Could be: WebSocket for live updates (future)

4. **Exchange Window:**
   - Starts: When admin marks delivered
   - Duration: 3 calendar days
   - Ends: Auto-expires after 3 days

5. **Two-Tab Testing:**
   - Use browser split-view or multiple windows
   - Both tabs connect to same backend
   - All data shared in real-time

---

**Ready to test! 🎉**
