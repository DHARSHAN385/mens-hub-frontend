# Quick Start Guide - Django Backend

## One-Command Startup
```bash
cd "c:\Users\dhars\Downloads\mens hub front end"
venv\Scripts\activate
python manage.py runserver
```
Server: http://localhost:8000

## Database Details
| Setting | Value |
|---------|-------|
| Database | mens_hub_db |
| User | root |
| Password | 1127 |
| Host | localhost:3306 |

## First Steps
1. **Create Admin User**
   ```bash
   python manage.py createsuperuser
   ```
   Then login at: http://localhost:8000/admin

2. **Add Test Products**
   Visit Admin → Products and add some items

3. **Test API**
   - Products: http://localhost:8000/api/products/
   - Orders: http://localhost:8000/api/orders/

## Frontend Connection
Your React app at localhost:5173 can call:
```javascript
fetch('http://localhost:8000/api/products/')
```

## File Structure
```
├── backend_project/settings.py  ← Database config
├── api/models.py                ← Product/Order models
├── api/views.py                 ← API endpoints
├── manage.py                    ← Commands
└── requirements.txt             ← Dependencies
```

## Common Commands
```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Start server on different port
python manage.py runserver 8001

# Shell for debugging
python manage.py shell
```

## Troubleshooting
- **MySQL Error**: Make sure MySQL is running, password is 1127
- **Port Error**: Use `python manage.py runserver 8001`
- **Missing packages**: Run `pip install -r requirements.txt`
