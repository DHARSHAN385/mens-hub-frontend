# 🔧 Cashfree Payment + Exchange Policy Setup Guide

## Part 1: Cashfree Payment Integration

### Terminology Explanation (Thanglish)
- **Cashfree**: Online payment gateway (credit card, debit card, UPI, net banking ellam support pannuthey)
- **App ID**: Nee Cashfree account ka unique identifier
- **Secret Key**: Password jaathai, anyone kku kudukka koodathu
- **Test Mode (Sandbox)**: Money actual ah debit aagadhu, just testing ke for practice
- **Production**: Real money la transaction aanadhu

### Step 1: Get Cashfree Credentials
1. Go to [cashfree.com](https://cashfree.com)
2. Create account and login
3. Go to Settings → API Keys
4. Copy:
   - **App ID** (e.g., `1234567890ABCDEF`)
   - **Secret Key** (e.g., `abcd1234efgh5678ijkl9012`)
5. Keep **TEST MODE** enabled initially

### Step 2: Backend Setup
Environment variables to add in `.env` or Django settings:
```
CASHFREE_APP_ID=your_app_id_here
CASHFREE_SECRET_KEY=your_secret_key_here
CASHFREE_MODE=TEST  # Change to PROD after testing
```

### Step 3: Frontend Setup
The system automatically:
- ✅ Creates payment sessions with Cashfree
- ✅ Shows Cashfree payment modal to user
- ✅ Validates payment success/failure
- ✅ Creates order in database after payment
- ✅ Sends notifications

---

## Part 2: Exchange Policy (Size Mismatch - 3 to 4 Days)

### Exchange Eligibility
- **Duration**: 3-4 days from order delivery
- **Reason**: Size mismatch only (fabric quality issues, damage naan "Return" la count aakum)
- **Condition**: Product must be unworn, original packaging maintained
- **Process**: 
  1. User selects product from order
  2. Submits exchange request with reason
  3. Admin reviews and approves/rejects
  4. If approved, generates exchange shipping label
  5. User ships old product
  6. Admin sends replacement

### Status Flow
```
Order Placed (day 0)
    ↓
Order Delivered (day 1-2)
    ↓ (User can now initiate exchange within 3 days)
Exchange Request Pending (day 2-4)
    ↓ (Admin reviews)
Exchange Approved / Exchange Rejected
    ↓ (If approved)
Awaiting Return Shipment → Received → Replacement Shipped → Completed
```

---

## Implementation Status

### ✅ Completed
- [x] Order model migration - added exchange fields
- [x] Exchange request API endpoints
- [x] Cashfree payment setup (requires credentials)
- [x] Order history UI with exchange button
- [x] Admin dashboard exchange management

### 📝 Configuration Needed
- [ ] Add CASHFREE_APP_ID to environment
- [ ] Add CASHFREE_SECRET_KEY to environment
- [ ] Decide: Test mode vs Production

### 🧪 Testing Checklist
- [ ] Test payment with Cashfree sandbox
- [ ] Test exchange request creation
- [ ] Test admin approval/rejection
- [ ] Verify email notifications sent
- [ ] Check 3-day window enforcement

---

## API Endpoints Created

### Payment
- `POST /api/orders/initiate-payment/` - Start Cashfree session
- `POST /api/orders/verify-payment/` - Verify payment callback

### Exchange
- `POST /api/orders/{id}/request-exchange/` - Create exchange request
- `GET /api/orders/{id}/exchange-status/` - Check exchange status
- `PATCH /api/orders/{id}/exchange/{ex_id}/approve/` - Admin approve
- `PATCH /api/orders/{id}/exchange/{ex_id}/reject/` - Admin reject
- `GET /api/orders/active-exchanges/` - Admin view all exchanges

---

## Database Schema Changes

### Order Model - New Fields
```python
# Exchange eligibility
is_delivered = models.BooleanField(default=False)  # Set when marked shipped+delivered
delivered_at = models.DateTimeField(null=True)     # Delivery date
exchange_eligible_until = models.DateTimeField(null=True)  # Auto-calc: delivered_at + 3 days

# Exchange requests
has_exchange_request = models.BooleanField(default=False)
exchange_status = models.CharField(choices=[
    ('none', 'No exchange'),
    ('pending', 'Pending review'),
    ('approved', 'Approved'),
    ('rejected', 'Rejected'),
    ('completed', 'Completed')
])

# Payment
payment_id = models.CharField(null=True)  # Cashfree payment ID
payment_method = models.CharField(default='upi')  # 'upi', 'card', 'netbanking', etc
payment_status = models.CharField(choices=[('pending', 'Pending'), ('success', 'Success'), ('failed', 'Failed')])
```

### New Model: ExchangeRequest
```python
class ExchangeRequest(models.Model):
    order = ForeignKey(Order)
    product_id = models.IntegerField()  # Which item from order
    size_old = models.CharField()
    size_new = models.CharField()  # New size requested
    reason = models.TextField()  # "Too small", "Too large", etc
    status = models.CharField(choices=[
        ('pending', 'Pending admin review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('shipped', 'Return received, replacement shipped'),
        ('completed', 'Completed')
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    admin_comment = models.TextField(blank=True)
    return_label = models.URLField(blank=True)  # Shipping label for user to return
```

---

## Next Steps

1. **Provide Cashfree credentials** (App ID + Secret Key from your account)
2. **Decide test vs production** - Usually test first to verify integration works
3. **Test payment flow**:
   - Add product to cart
   - Go to checkout
   - Select "Cashfree" payment
   - Simulate payment
   - Verify order created
4. **Test exchange flow**:
   - Order delivered (admin marks status)
   - User sees "Request Exchange" button (only for 3 days)
   - Submit exchange request
   - Admin reviews in admin panel
   - Approve/reject

---

## Security Notes ⚠️
- Never commit credentials to Git (use `.env` file)
- Secret key is like password - keep private
- Test mode doesn't charge real money
- Production mode charges real money - be careful!

---

## Support
- Cashfree Docs: https://docs.cashfree.com
- Django REST: https://www.django-rest-framework.org
- React Payment Integration: Standard fetch + modal

