# 🚀 Cashfree Payment + Exchange System - Frontend Implementation Guide

## Part 1: Frontend Setup

### Environment Configuration

Add to `.env` file (or pass via settings):
```
VITE_CASHFREE_APP_ID=your_app_id_here
VITE_CASHFREE_MODE=TEST
VITE_BACKEND_URL=http://localhost:8000
VITE_FRONTEND_URL=http://localhost:5173
```

### Installation

The frontend services are already created:
- ✅ `src/services/cashfreeService.ts` - Cashfree payment handling
- ✅ `src/services/exchangeService.ts` - Exchange request management

---

## Part 2: Payment Integration in Checkout

### Current Status
- **Before**: Mock UPI QR code system
- **After**: Real Cashfree payment integration

### UI Flow

#### Step 1: Address (Unchanged)
```
User enters: Name, Phone, Address, City, Pincode
↓
Proceeds to Payment
```

#### Step 2: Payment (Modified - NEW)
```
User sees payment options:
- Cashfree (recommended)
- UPI (mock - optional)
↓
If Cashfree selected:
  - System creates payment session
  - Opens Cashfree payment modal
  - User chooses payment method (card, UPI, net banking, etc)
  - Pays amount
  - Returns to app after payment
↓
If UPI selected:
  - Falls back to current mock system
```

#### Step 3: Review & Confirmation (Modified)
```
Shows payment method used
Display return/exchange policy info
"Place Order" button
```

---

## Part 3: Code Integration Points

### Update CheckoutPage in src/app/App.tsx

**Add these imports:**
```typescript
import { cashfreeService } from './src/services/cashfreeService';
import { exchangeService } from './src/services/exchangeService';
```

**Modify payment step state:**
```typescript
// Instead of just UPI
type PaymentMethod = 'cashfree' | 'upi' | 'pending';
const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pending');
```

**Add Cashfree payment handler:**
```typescript
const handleCashfreePayment = async () => {
  try {
    // 1. Initiate payment session
    const result = await cashfreeService.initiatePayment({
      orderId: form.orderId || "ORD-" + Math.random().toString(36).substr(2, 9),
      amount: total,
      customerName: form.name,
      customerEmail: user?.email || "",
      customerPhone: form.phone,
    });

    // 2. Open Cashfree payment modal
    const paymentResult = await cashfreeService.openPaymentModal(
      result.session_data,
      result.order_id
    );

    // 3. Verify payment
    const verified = await cashfreeService.verifyPayment({
      orderId: result.order_id,
      paymentId: paymentResult.txnId,
      orderStatus: paymentResult.orderStatus,
      paymentMethod: paymentResult.paymentMethod,
    });

    if (verified.order.payment_status === 'success') {
      setPaymentMethod('cashfree');
      setStep(2); // Go to review
      toast.success("✅ Payment successful!");
    } else {
      toast.error("❌ Payment failed. Please try again.");
    }
  } catch (error) {
    toast.error(`❌ Payment error: ${error.message}`);
  }
};
```

---

## Part 4: Payment Step UI

### Option 1: Side-by-Side Payment Methods

```jsx
{step === 1 && (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      
      {/* Cashfree Option */}
      <button
        onClick={() => setPaymentMethod('cashfree')}
        className={`p-4 rounded-lg border-2 transition ${
          paymentMethod === 'cashfree'
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300'
        }`}
      >
        <div className="text-2xl mb-2">💳</div>
        <div className="font-bold">Cashfree</div>
        <div className="text-xs text-gray-600">Card, UPI, Net Banking</div>
      </button>

      {/* UPI Option */}
      <button
        onClick={() => setPaymentMethod('upi')}
        className={`p-4 rounded-lg border-2 transition ${
          paymentMethod === 'upi'
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300'
        }`}
      >
        <div className="text-2xl mb-2">📱</div>
        <div className="font-bold">UPI</div>
        <div className="text-xs text-gray-600">QR & UPI ID</div>
      </button>
    </div>

    {/* Show appropriate UI based on selection */}
    {paymentMethod === 'cashfree' && (
      <div className="p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold mb-2">💳 Cashfree Payment</h3>
        <p className="text-sm text-gray-700 mb-4">
          Secure payment via Cashfree Gateway. Choose from:
          • Credit/Debit Card • UPI • Net Banking • Wallets
        </p>
        <button
          onClick={handleCashfreePayment}
          className="w-full py-3 bg-green-600 text-white rounded-lg font-bold"
        >
          Proceed to Cashfree (₹{total.toLocaleString()})
        </button>
      </div>
    )}

    {paymentMethod === 'upi' && (
      <div className="p-4 bg-blue-50 rounded-lg">
        {/* Existing UPI UI code */}
      </div>
    )}
  </div>
)}
```

---

## Part 5: Order History - Exchange Requests

### Add Exchange Button in OrderHistory Component

```typescript
const handleRequestExchange = async (product: any, itemSize: string) => {
  // Show exchange form
  const newSize = prompt("What size would you like? (Current: " + itemSize + ")");
  if (!newSize || newSize === itemSize) return;

  const reason = prompt("Reason for exchange?\n1. Too Small\n2. Too Large\n3. Size Mismatch");
  
  const reasonMap: Record<string, string> = {
    '1': 'too_small',
    '2': 'too_large',
    '3': 'size_mismatch',
  };

  try {
    const result = await exchangeService.requestExchange(order.id, {
      product_id: product.id,
      product_name: product.name,
      size_old: itemSize,
      size_new: newSize,
      reason: reasonMap[reason] || 'size_mismatch',
      reason_description: "User requested size change",
    });

    toast.success(`✅ Exchange request submitted!\nStatus: ${result.status}`);
  } catch (error) {
    toast.error(`❌ Failed to request exchange: ${error.message}`);
  }
};
```

### Display Exchange Status in Order Details

```jsx
{/* Show exchange status if available */}
{order.exchange_status !== 'none' && (
  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
    <div className="font-bold mb-2">
      📦 Exchange Status: {exchangeService.formatStatus(order.exchange_status)}
    </div>
    {order.exchanges?.map((ex: any) => (
      <div key={ex.id} className="text-sm mb-2">
        <div>{ex.product_name}: {ex.size_old} → {ex.size_new}</div>
        <div className="text-gray-600">
          Reason: {exchangeService.getReasonDescription(ex.reason)}
        </div>
        {ex.admin_comment && (
          <div className="text-gray-700 mt-1">
            Admin: {ex.admin_comment}
          </div>
        )}
        {ex.return_label_url && (
          <a
            href={ex.return_label_url}
            target="_blank"
            className="text-blue-600 underline text-xs"
          >
            📄 Download Return Label
          </a>
        )}
        {ex.replacement_tracking && (
          <div className="text-green-600 text-sm">
            ✅ Replacement shipped: {ex.replacement_tracking}
          </div>
        )}
      </div>
    ))}
  </div>
)}
```

---

## Part 6: Exchange Policy Display

### Add Exchange Policy Info to Checkout Review

```jsx
{step === 2 && (
  <div className="space-y-4">
    {/* Existing review content */}
    
    {/* Exchange Policy Info */}
    <div className="p-3 bg-blue-50 rounded-lg text-sm">
      <div className="font-bold mb-2">📦 Exchange Policy (Size Mismatch)</div>
      <ul className="space-y-1 text-gray-700">
        <li>✅ <strong>Eligible Period:</strong> Within 3-4 days of delivery</li>
        <li>✅ <strong>Reason:</strong> Size mismatch only (too small/too large)</li>
        <li>✅ <strong>Condition:</strong> Product unworn & original packaging intact</li>
        <li>✅ <strong>Process:</strong> Submit request → Admin approval → Return shipment → Replacement</li>
      </ul>
    </div>
  </div>
)}
```

---

## Part 7: Environment Variables

### Required .env Variables

```bash
# Cashfree Configuration
VITE_CASHFREE_APP_ID=your_app_id_from_cashfree
VITE_CASHFREE_MODE=TEST  # Use TEST for sandbox testing, PROD for production

# Backend Configuration
VITE_BACKEND_URL=http://localhost:8000
VITE_FRONTEND_URL=http://localhost:5173

# API Configuration
VITE_API_TIMEOUT=30000
```

### Backend Environment (Django settings.py)

```python
# Cashfree Configuration
CASHFREE_APP_ID = os.getenv('CASHFREE_APP_ID', '')
CASHFREE_SECRET_KEY = os.getenv('CASHFREE_SECRET_KEY', '')
CASHFREE_MODE = os.getenv('CASHFREE_MODE', 'TEST')

# Frontend URLs
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:8000')
```

---

## Part 8: Testing Checklist

### ✅ Cashfree Payment Testing

1. **Test Mode Activation**
   - [ ] Use TEST mode credentials from Cashfree sandbox
   - [ ] Add product to cart
   - [ ] Go to checkout
   - [ ] Select "Cashfree" payment
   - [ ] Click "Proceed to Cashfree"

2. **Mock Payment (TEST MODE ONLY)**
   - [ ] Modal opens (or redirects)
   - [ ] Select test payment method
   - [ ] Complete payment
   - [ ] Return to app
   - [ ] See "✅ Payment successful" toast
   - [ ] Order placed successfully

3. **Order Creation**
   - [ ] Check database: Order status = 'processing'
   - [ ] Check payment_status = 'success'
   - [ ] Check payment_id populated
   - [ ] User receives order confirmation

### ✅ Exchange Testing

1. **Exchange Eligibility**
   - [ ] Order marked as delivered
   - [ ] delivered_at timestamp set
   - [ ] "Request Exchange" button visible for 3 days
   - [ ] Button hidden after 3 days pass

2. **Request Exchange**
   - [ ] Select product from order
   - [ ] Choose new size (different from current)
   - [ ] Select reason (too small, too large, size mismatch)
   - [ ] Submit request
   - [ ] Confirmation message appears
   - [ ] Order shows exchange_status = 'pending'

3. **Admin Approval**
   - [ ] Login as admin
   - [ ] Go to Admin Panel
   - [ ] Check "Pending Exchanges" section
   - [ ] Click approve/reject
   - [ ] Exchange status updates in user's order

4. **Exchange Workflow**
   - [ ] Admin approves exchange
   - [ ] Admin generates return label
   - [ ] User downloads label
   - [ ] User ships product back
   - [ ] Admin marks "Return Received"
   - [ ] Admin ships replacement
   - [ ] User sees replacement tracking
   - [ ] Exchange marked "Completed"

---

## Part 9: Common Issues & Solutions

### Issue: "Cashfree credentials not configured"
**Solution:** Make sure environment variables are set:
```bash
export CASHFREE_APP_ID=your_id
export CASHFREE_SECRET_KEY=your_secret
```

### Issue: Payment modal not opening
**Solution:** Check browser console for errors. Ensure Cashfree SDK is loaded if using SDK version.

### Issue: Exchange button not showing
**Solution:** 
- Check order status = 'delivered'
- Check order.delivered_at is set
- Check current date is within 3 days of delivered_at

### Issue: Admin can't see pending exchanges
**Solution:** 
- User must be admin (is_admin = true in UserProfile)
- Exchange must be created (status = 'pending')
- Check admin dashboard pending exchanges section

---

## Part 10: Next Steps After Implementation

1. **Test with real Cashfree account**
   - Create Cashfree account
   - Get production credentials
   - Switch to PROD mode
   - Test with real payments (small amounts)

2. **Deploy to production**
   - Set CASHFREE_MODE=PROD
   - Configure frontend URL (for callbacks)
   - Test full flow in production

3. **Monitor transactions**
   - Check Cashfree dashboard for all transactions
   - Verify order statuses sync correctly
   - Monitor exchange requests

4. **Customer communication**
   - Send exchange policy info with orders
   - Automate exchange eligibility notifications
   - Send email updates for exchange status changes

---

## Support & Resources

- Cashfree Documentation: https://docs.cashfree.com
- Django REST Framework: https://www.django-rest-framework.org
- React Best Practices: https://react.dev

---

**Status:** ✅ Ready for implementation  
**Backend:** Fully implemented with migrations  
**Frontend Services:** Created (cashfreeService.ts, exchangeService.ts)  
**Next:** Integrate into CheckoutPage component  

