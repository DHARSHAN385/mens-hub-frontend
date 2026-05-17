# 📚 Navigation Guide - User-Specific & Admin System

## 🎯 Start Here

**New to this implementation?** Read in this order:

1. **[QUICK_START_USER_ADMIN.md](./QUICK_START_USER_ADMIN.md)** (5 min read)
   - Visual overview
   - Database structure diagram
   - API routes summary
   - Example flows

2. **[USER_SPECIFIC_ADMIN_COMPLETE.md](./USER_SPECIFIC_ADMIN_COMPLETE.md)** (10 min read)
   - What was implemented
   - Complete feature checklist
   - Example user flow (step-by-step)
   - How to test

3. **[USER_SPECIFIC_ADMIN_GUIDE.md](./USER_SPECIFIC_ADMIN_GUIDE.md)** (Detailed reference)
   - Complete API documentation
   - All endpoints with examples
   - Frontend integration code
   - Error handling
   - Database queries

4. **[DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md)** (Technical details)
   - Database schema
   - Data isolation explanation
   - Admin features breakdown
   - Why it works like Amazon/Flipkart

---

## 📋 Documentation Files

| File | Purpose | Read Time | For Whom |
|------|---------|-----------|----------|
| **QUICK_START_USER_ADMIN.md** | Visual overview, quick reference | 5 min | Everyone |
| **USER_SPECIFIC_ADMIN_COMPLETE.md** | Implementation summary, testing guide | 10 min | Project managers, QA |
| **USER_SPECIFIC_ADMIN_GUIDE.md** | Complete API docs, integration code | 30 min | Frontend developers |
| **DATABASE_ARCHITECTURE.md** | Technical database design | 15 min | Backend developers, architects |

---

## 🔍 Finding Specific Information

### "How do I..."

**...authenticate users?**
- Read: USER_SPECIFIC_ADMIN_GUIDE.md → "Authentication Endpoints" section
- Code: `src/services/authService.ts`

**...get a user's cart?**
- Read: QUICK_START_USER_ADMIN.md → "User Routes" section
- API: `GET /api/me/cart/`
- Code example: USER_SPECIFIC_ADMIN_GUIDE.md → "User-Specific Endpoints"

**...view all customers as admin?**
- Read: USER_SPECIFIC_ADMIN_COMPLETE.md → "Step 5: Admin Sees Order"
- API: `GET /api/admin/customers/`
- Code example: USER_SPECIFIC_ADMIN_GUIDE.md → "Admin Endpoints"

**...update order status?**
- Read: USER_SPECIFIC_ADMIN_COMPLETE.md → "Step 6: Admin Updates Order"
- API: `PATCH /api/admin/orders/<id>/status/`
- Code example: USER_SPECIFIC_ADMIN_GUIDE.md → "Update Order Status"

**...ensure data isolation?**
- Read: DATABASE_ARCHITECTURE.md → "User-Specific Data Isolation"
- Read: USER_SPECIFIC_ADMIN_COMPLETE.md → "Data Isolation (Security)"

**...test the endpoints?**
- Read: USER_SPECIFIC_ADMIN_COMPLETE.md → "How to Test"
- Read: QUICK_START_USER_ADMIN.md → "Test It"

---

## 🏗️ Implementation Status

```
Backend (100% Complete)
├─ api/admin_views.py (NEW) ✅
├─ api/urls.py (UPDATED) ✅
├─ Database models ✅
└─ Documentation ✅

Frontend (Ready for Integration)
├─ authService.ts ✅ Ready
├─ cartService.ts ✅ Ready
├─ wishlistService.ts ✅ Ready
├─ addressService.ts ✅ Ready
├─ orderService.ts ✅ Ready
└─ Components (Await integration examples in USER_SPECIFIC_ADMIN_GUIDE.md)

Testing (Manual testing ready)
├─ API endpoints documented ✅
├─ Example requests provided ✅
└─ Test cases (pending)
```

---

## 💡 Key Concepts

### User-Specific Data
Each user has their own:
- Cart (OneToOne relationship)
- Wishlist (OneToOne relationship)
- Orders (Multiple)
- Addresses (Multiple)

Users **cannot** see other users' data.

### Admin Access
Admins can:
- View all customers
- View all orders
- Update order status & tracking
- See order notifications
- Access dashboard statistics

### Data Isolation
```
User 1 → Cart A, Orders 1-3, Addresses 1-2
User 2 → Cart B, Orders 4-5, Addresses 3-4
Admin   → Can see all of above
```

---

## 🚀 Quick Commands

```bash
# Start Django server
python manage.py runserver

# Register user
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123","name":"John","phone":"9999999999"}'

# Get user's profile
curl -H "Authorization: Token YOUR_TOKEN" \
  http://localhost:8000/api/me/profile/

# View all customers (admin only)
curl -H "Authorization: Token ADMIN_TOKEN" \
  http://localhost:8000/api/admin/customers/

# Update order (admin only)
curl -X PATCH http://localhost:8000/api/admin/orders/1/status/ \
  -H "Authorization: Token ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"shipped","tracking_number":"ABC123"}'
```

---

## 📞 Support

### Common Issues

**"Cannot access admin endpoints"**
- Check: Is user.is_staff=True or user.profile.is_admin=True?
- See: DATABASE_ARCHITECTURE.md → "Admin Setup"

**"Cannot see other users' data"**
- This is by design! Data isolation prevents users from accessing each other's data.
- See: USER_SPECIFIC_ADMIN_COMPLETE.md → "Data Isolation (Security)"

**"Token not working"**
- Check: Is Authorization header formatted as `Token YOUR_TOKEN`?
- Check: Is token still valid (not expired)?
- See: USER_SPECIFIC_ADMIN_GUIDE.md → "Authentication"

**"Need to reset everything"**
- See: BACKEND_SETUP.md for full reset instructions

---

## 📊 Database Schema (Quick Look)

```
User (id, email, password, is_staff)
  ├─ OneToOne → UserProfile (phone, is_admin)
  ├─ OneToOne → Cart (items_data: JSON)
  ├─ OneToOne → Wishlist (product_ids: JSON)
  ├─ OneToMany → Order (order_number, status, total_amount)
  │              └─ OneToMany → OrderItem (product, quantity)
  └─ OneToMany → Address (street, city, pincode)

Product (id, name, price, image)
  ├─ OneToMany → OrderItem
  └─ OneToMany → Wishlist (via product_ids)

OrderNotification (id, order, customer, is_read)
```

---

## ✅ Checklist for Next Steps

- [ ] Read QUICK_START_USER_ADMIN.md
- [ ] Read USER_SPECIFIC_ADMIN_GUIDE.md for integration details
- [ ] Test API endpoints with curl commands
- [ ] Review DATABASE_ARCHITECTURE.md
- [ ] Plan frontend integration:
  - [ ] Update AuthForm.tsx
  - [ ] Update App.tsx
  - [ ] Create AdminDashboard component
  - [ ] Create UserProfile component
- [ ] Test user flows (register → order → admin update → track)
- [ ] Deploy

---

## 📞 Questions?

See the specific documentation file listed above for your question, or:
1. Check **USER_SPECIFIC_ADMIN_GUIDE.md** → "Troubleshooting" section
2. Check **DATABASE_ARCHITECTURE.md** → "Technical Details"
3. Review example code in **USER_SPECIFIC_ADMIN_GUIDE.md** → "Frontend Integration Examples"

---

**Last Updated:** May 9, 2026  
**Status:** ✅ Complete and ready for use
