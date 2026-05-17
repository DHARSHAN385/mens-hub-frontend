# Django Backend Setup Complete ✓

## Project Overview
A fully functional Django backend has been set up for your Mens Hub application with MySQL database integration and REST API capabilities.

## Database Configuration
- **Type**: MySQL
- **Database**: mens_hub_db
- **User**: root
- **Password**: 1127
- **Host**: localhost
- **Port**: 3306

## Backend Structure
```
project_root/
├── backend_project/          # Django project settings
│   ├── settings.py          # Database & app configuration
│   ├── urls.py              # Main URL routing
│   ├── wsgi.py              # WSGI configuration
│   └── asgi.py              # ASGI configuration
├── api/                     # REST API app
│   ├── models.py            # Product & Order models
│   ├── views.py             # API ViewSets
│   ├── serializers.py       # DRF Serializers
│   ├── urls.py              # API routing
│   ├── admin.py             # Admin panel config
│   └── migrations/          # Database migrations
├── manage.py                # Django management script
├── venv/                    # Python virtual environment
├── requirements.txt         # Python dependencies
└── create_db.py            # Database creation script

```

## Installed Packages
- Django 6.0.5
- mysqlclient 2.2.8 (MySQL driver)
- djangorestframework 3.17.1 (REST API)
- django-cors-headers 4.9.0 (CORS support)
- python-decouple 3.8 (Environment variables)

## Database Models

### Product Model
- name (CharField)
- description (TextField)
- price (DecimalField)
- category (choices: shirt, pants, jacket, shoes, accessories)
- image_url (URLField)
- stock (IntegerField)
- created_at, updated_at (timestamps)

### Order Model
- customer_name (CharField)
- customer_email (EmailField)
- total_amount (DecimalField)
- status (choices: pending, processing, shipped, delivered, cancelled)
- created_at, updated_at (timestamps)

## API Endpoints

### Products
- `GET /api/products/` - List all products
- `POST /api/products/` - Create a new product
- `GET /api/products/{id}/` - Get product details
- `PUT /api/products/{id}/` - Update a product
- `DELETE /api/products/{id}/` - Delete a product
- `GET /api/products/?category=shirt` - Filter by category

### Orders
- `GET /api/orders/` - List all orders
- `POST /api/orders/` - Create a new order
- `GET /api/orders/{id}/` - Get order details
- `PUT /api/orders/{id}/` - Update an order
- `DELETE /api/orders/{id}/` - Delete an order

## Quick Start

### 1. Activate Virtual Environment
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. Run Development Server
```bash
python manage.py runserver
# Server runs at: http://localhost:8000/
```

### 3. Access Django Admin
```
URL: http://localhost:8000/admin/
Username: (create with: python manage.py createsuperuser)
Password: (set when creating superuser)
```

### 4. API Root
```
URL: http://localhost:8000/api/
```

## CORS Configuration
The backend is configured to accept requests from:
- http://localhost:5173 (Vite dev server)
- http://127.0.0.1:5173
- http://localhost:3000
- http://127.0.0.1:3000

## Creating a Superuser
```bash
python manage.py createsuperuser
# Follow the prompts to set username and password
```

## Database Migrations
```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Reset database (be careful!)
python manage.py migrate --plan
```

## Environment Variables
Copy `.env.example` to `.env` and update values as needed:
```
DEBUG=True
SECRET_KEY=your-secret-key-here
DB_NAME=mens_hub_db
DB_USER=root
DB_PASSWORD=1127
DB_HOST=localhost
DB_PORT=3306
```

## Frontend Integration
The backend CORS is already configured to work with your React frontend. Just ensure:
1. Frontend runs on port 5173 (Vite) or 3000 (Create React App)
2. API calls use: `http://localhost:8000/api/`

## Example API Calls

### Create a Product
```bash
curl -X POST http://localhost:8000/api/products/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Blue T-Shirt",
    "description": "Premium cotton T-shirt",
    "price": "29.99",
    "category": "shirt",
    "stock": 50
  }'
```

### Get All Products
```bash
curl http://localhost:8000/api/products/
```

### Create an Order
```bash
curl -X POST http://localhost:8000/api/orders/ \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "total_amount": "99.99",
    "status": "pending"
  }'
```

## Troubleshooting

### MySQL Connection Error
- Ensure MySQL server is running
- Verify password: root/1127
- Check host: localhost:3306

### Port 8000 Already in Use
```bash
python manage.py runserver 8001
```

### Missing Dependencies
```bash
pip install -r requirements.txt
```

### Database Issues
```bash
python manage.py migrate --run-syncdb
```

## Production Deployment Checklist
- [ ] Set DEBUG=False in settings.py
- [ ] Update SECRET_KEY with a secure value
- [ ] Configure ALLOWED_HOSTS
- [ ] Use environment variables for sensitive data
- [ ] Use Gunicorn/uWSGI instead of development server
- [ ] Set up proper logging
- [ ] Enable database backups
- [ ] Configure SSL/HTTPS

## Additional Resources
- Django Documentation: https://docs.djangoproject.com/
- Django REST Framework: https://www.django-rest-framework.org/
- MySQL Documentation: https://dev.mysql.com/doc/

---
**Backend Setup Date**: May 5, 2026
**Django Version**: 6.0.5
**Python Version**: 3.12+
