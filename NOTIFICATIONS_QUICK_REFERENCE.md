# Real-Time Order Notifications - Quick Reference

## 🚀 Quick Start (5 Minutes)

### 1. Install Dependencies
```bash
# Backend
pip install -r requirements.txt

# Frontend
pnpm install
```

### 2. Start Services
```bash
# Terminal 1: Backend with Daphne
daphne -b 0.0.0.0 -p 8000 backend_project.asgi:application

# Terminal 2: Frontend
pnpm dev
```

### 3. Test It
1. Go to `http://localhost:5173/admin`
2. Create a test order via API or UI
3. Watch real-time notification appear! 🎉

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `backend_project/asgi.py` | WebSocket server setup |
| `backend_project/routing.py` | WebSocket URL routing |
| `backend_project/settings.py` | Channels configuration |
| `api/consumers.py` | WebSocket message handlers |
| `api/services.py` | Notification business logic |
| `api/views.py` | Order creation endpoint |
| `src/hooks/useOrderNotifications.ts` | React WebSocket hook |
| `src/components/AdminOrderNotificationCenter.tsx` | Notification UI |
| `src/components/NotificationBadge.tsx` | Badge component |
| `src/utils/notificationPermissions.ts` | Browser notification API |

---

## 💻 API Endpoints

### Create Order with Notification
```bash
POST /api/orders/create-with-notification/

{
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "total_amount": 5999.99,
  "address": "123 Main St",
  "pincode": "123456",
  "items": [
    {
      "product_name": "T-Shirt",
      "quantity": 2,
      "price": 500,
      "size": "M"
    }
  ]
}
```

### Get Notifications
```bash
GET /api/notifications/
GET /api/notifications/unread/
GET /api/notifications/count/
POST /api/notifications/{id}/mark_as_read/
```

---

## 🔗 WebSocket Events

### Client → Server
```javascript
// Ping (keep-alive)
{ "type": "ping" }

// Mark as read
{ "type": "mark_read", "notification_id": 123 }

// Get unread count
{ "type": "get_unread_count" }
```

### Server → Client
```javascript
// Connection established
{ "type": "connection_established", "message": "..." }

// New order notification
{
  "type": "order_notification",
  "order_id": 1,
  "order_number": "123456",
  "customer_name": "John",
  "total_amount": "5999.99",
  ...
}

// Unread count
{ "type": "unread_count", "count": 5 }

// Pong (keep-alive)
{ "type": "pong" }
```

---

## 🧪 Testing Commands

### Test WebSocket Connection
```bash
# Install wscat: npm install -g wscat
wscat -c ws://localhost:8000/ws/orders/notifications/
```

### Create Test Order (cURL)
```bash
curl -X POST http://localhost:8000/api/orders/create-with-notification/ \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name":"John","customer_email":"john@test.com",
    "total_amount":500,"items":[]
  }'
```

### Check Notifications
```bash
curl http://localhost:8000/api/notifications/unread/
```

---

## 🎯 Integration Checklist

- [ ] Installed Django Channels and dependencies
- [ ] Updated Django settings.py
- [ ] Created ASGI configuration
- [ ] Created WebSocket routing
- [ ] Created consumers.py
- [ ] Created notification service
- [ ] Updated views.py to trigger notifications
- [ ] Added React hooks and components
- [ ] Tested WebSocket connection
- [ ] Tested order creation
- [ ] Verified notifications display
- [ ] Tested browser notifications
- [ ] Configured production settings (Redis)

---

## 🔧 Configuration

### Django Settings
```python
# settings.py

INSTALLED_APPS = [
    'daphne',
    'channels',
    ...
]

ASGI_APPLICATION = 'backend_project.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer'
    }
}
```

### React Integration
```tsx
import AdminOrderNotificationCenter from '@/components/AdminOrderNotificationCenter';

<AdminOrderNotificationCenter 
  showBrowser={true}
  soundEnabled={true}
  onNotificationReceived={(notification) => {
    console.log('New order:', notification);
  }}
/>
```

---

## 🚨 Common Issues & Solutions

### WebSocket Connection Failed
**Problem**: `WebSocket connection failed`
**Solution**: 
- Ensure Daphne is running (not Django's runserver)
- Check firewall/proxy settings
- Verify URL: `ws://localhost:8000/ws/orders/notifications/`

### Notifications Not Appearing
**Problem**: Order created but no notification
**Solution**:
- Check admin is logged in
- Check WebSocket connection indicator
- Check browser console for errors
- Verify `create_order_with_notification` endpoint called

### Browser Notifications Not Working
**Problem**: System notification not showing
**Solution**:
- Request permission: `Notification.requestPermission()`
- Check browser settings (Chrome → Settings → Notifications)
- Verify HTTPS or localhost
- Check notification permission status

### Django Migrations Error
**Problem**: `AttributeError: 'str' object has no attribute '_meta'`
**Solution**:
```bash
python manage.py makemigrations api
python manage.py migrate
```

---

## 📊 Performance Tips

- **Reduce reconnect delay** for faster recovery (edit hook)
- **Disable sound** for better performance
- **Use Redis** for production scaling
- **Monitor WebSocket connections** with logging
- **Set connection timeouts** to prevent stale connections

---

## 🔒 Security Checklist

- [ ] Enforce admin-only WebSocket access
- [ ] Use HTTPS in production (WSS)
- [ ] Validate all input data
- [ ] Set CSRF_TRUSTED_ORIGINS
- [ ] Use environment variables for secrets
- [ ] Rate limit WebSocket connections
- [ ] Log all WebSocket events

---

## 📈 Scaling for Production

### Enable Redis
```python
# settings.py
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('127.0.0.1', 6379)],
        },
    },
}
```

### Run Multiple Daphne Workers
```bash
daphne -b 0.0.0.0 -p 8000 \
  --access-log - \
  --workers 4 \
  backend_project.asgi:application
```

### Nginx Configuration
```nginx
upstream asgi {
    server 127.0.0.1:8000;
}

server {
    location /ws/ {
        proxy_pass http://asgi;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 📚 Useful Links

- [Django Channels Documentation](https://channels.readthedocs.io/)
- [Daphne ASGI Server](https://github.com/django/daphne)
- [WebSocket API Reference](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Browser Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notification)

---

## 💡 Pro Tips

1. **Test with Multiple Tabs**: Open admin in multiple tabs, orders notify all
2. **Monitor Network**: Use DevTools Network tab to see WebSocket frames
3. **Custom Sounds**: Replace beep sound with custom audio file
4. **Batch Operations**: Create multiple orders to stress-test
5. **Mobile Testing**: Test on mobile using `ngrok` for tunneling

---

## 📞 Support

**File Structure**: See `REALTIME_NOTIFICATIONS_SETUP.md`

**Status**: ✅ Production Ready

**Version**: 1.0

**Last Updated**: 2024

