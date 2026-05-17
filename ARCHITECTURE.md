# System Architecture & Data Flow

## Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                      │
│                   http://localhost:5173                          │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │            React Components                                 │ │
│  │  - ProductList                                             │ │
│  │  - ProductForm                                             │ │
│  │  - OrdersList                                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                          ↓                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         API Services (src/services/)                       │ │
│  │  - productService.ts                                       │ │
│  │  - orderService.ts                                         │ │
│  │  - API Methods: GET, POST, PUT, DELETE                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                          ↓                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         API Client (src/api/client.ts)                     │ │
│  │  - HTTP requests                                           │ │
│  │  - Error handling                                          │ │
│  │  - Headers & configuration                                │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                          ↕ (CORS enabled)
                    HTTP (JSON payloads)
                          ↕
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Django REST)                         │
│                   http://localhost:8000                         │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         Django REST Framework (DRF)                        │ │
│  │  - URL Router: /api/products/, /api/orders/              │ │
│  │  - ViewSets for CRUD operations                           │ │
│  │  - Serializers for JSON conversion                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                          ↓                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         Django Models                                       │ │
│  │  - Product model                                           │ │
│  │  - Order model                                             │ │
│  │  - Validation & ORM                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                          ↓                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         Django Admin Panel                                 │ │
│  │  http://localhost:8000/admin                              │ │
│  │  - Manual data management                                 │ │
│  │  - User authentication                                    │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                    MySQL Database                               │
│                   localhost:3306                                │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Database: mens_hub_db                                     │ │
│  │                                                            │ │
│  │  Tables:                                                   │ │
│  │  - api_product (name, price, category, stock, etc.)      │ │
│  │  - api_order (customer_name, total_amount, status, etc.) │ │
│  │  - Other system tables (auth, sessions, etc.)             │ │
│  │                                                            │ │
│  │  Credentials: root / 1127                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Creating a Product

```
User Types Product Name
         ↓
    ┌────────────┐
    │ React Form │
    └────────────┘
         ↓
    Form Submission
         ↓
    ┌─────────────────────────────────────────┐
    │ productService.createProduct({          │
    │   name: "T-Shirt",                      │
    │   price: 29.99,                         │
    │   category: "shirt",                    │
    │   ...                                   │
    │ })                                      │
    └─────────────────────────────────────────┘
         ↓
    ┌─────────────────────────────────────────┐
    │ POST http://localhost:8000/api/products/│
    │ Content-Type: application/json          │
    │                                         │
    │ {                                       │
    │   "name": "T-Shirt",                    │
    │   "price": "29.99",                     │
    │   "category": "shirt"                   │
    │ }                                       │
    └─────────────────────────────────────────┘
         ↓
    [Network Request]
         ↓
    ┌──────────────────────────────────────────┐
    │ Django REST Framework                    │
    │ - Route to ProductViewSet                │
    │ - Validate data with serializer          │
    │ - Check models & fields                  │
    └──────────────────────────────────────────┘
         ↓
    ┌──────────────────────────────────────────┐
    │ Product.objects.create()                 │
    │ - Create model instance                  │
    │ - Generate ID                            │
    │ - Set timestamps                         │
    └──────────────────────────────────────────┘
         ↓
    ┌──────────────────────────────────────────┐
    │ MySQL Database                           │
    │ INSERT INTO api_product ...              │
    │ VALUES (1, "T-Shirt", 29.99, "shirt"...) │
    └──────────────────────────────────────────┘
         ↓
    ┌──────────────────────────────────────────┐
    │ HTTP 201 Response                        │
    │ Content-Type: application/json           │
    │                                          │
    │ {                                        │
    │   "id": 1,                               │
    │   "name": "T-Shirt",                     │
    │   "price": "29.99",                      │
    │   "category": "shirt",                   │
    │   "created_at": "2026-05-05T...",        │
    │   ...                                    │
    │ }                                        │
    └──────────────────────────────────────────┘
         ↓
    [Network Response]
         ↓
    ┌──────────────────────────────────────────┐
    │ JavaScript receives response             │
    │ Update local state: setProducts(...)     │
    │ UI re-renders with new product           │
    └──────────────────────────────────────────┘
         ↓
    User sees new product in list!
    ✅ DATA SAVED TO MYSQL DATABASE
```

---

## Data Flow: Loading Products on Page Load

```
Component mounts
         ↓
    useEffect hook runs
         ↓
    productService.getAllProducts() called
         ↓
    ┌───────────────────────────────────┐
    │ GET http://localhost:8000/api/    │
    │ products/                         │
    └───────────────────────────────────┘
         ↓
    [Network Request]
         ↓
    ┌───────────────────────────────────┐
    │ Django receives GET request       │
    │ ProductViewSet.list()             │
    │ Query: Product.objects.all()      │
    └───────────────────────────────────┘
         ↓
    ┌───────────────────────────────────┐
    │ MySQL Query                       │
    │ SELECT * FROM api_product;        │
    │ ← Returns all stored products     │
    └───────────────────────────────────┘
         ↓
    ┌───────────────────────────────────┐
    │ Serialize to JSON                 │
    │ HTTP 200 OK                       │
    │                                   │
    │ [{                                │
    │   "id": 1,                        │
    │   "name": "T-Shirt",              │
    │   "price": "29.99",               │
    │   ...                             │
    │ }, ...]                           │
    └───────────────────────────────────┘
         ↓
    [Network Response]
         ↓
    JavaScript receives array
    setProducts(data)
    Component re-renders
         ↓
    ✅ ALL SAVED PRODUCTS DISPLAYED
```

---

## Data Flow: Page Refresh (Why Data Persists!)

```
User Refreshes Page (F5)
         ↓
    React App Reloads
    State resets to initial: []
         ↓
    useEffect runs again
         ↓
    productService.getAllProducts()
         ↓
    GET /api/products/
         ↓
    MySQL returns all stored products
         ↓
    setProducts(data)
         ↓
    ✅ Products display again!
    
NO DATA LOST! ✅
```

---

## API Endpoint Reference

### Products Endpoints
```
GET    /api/products/              → Get all products
GET    /api/products/?category=shirt → Filter by category
GET    /api/products/{id}/         → Get single product
POST   /api/products/              → Create product
PUT    /api/products/{id}/         → Update product
DELETE /api/products/{id}/         → Delete product
```

### Orders Endpoints
```
GET    /api/orders/                → Get all orders
GET    /api/orders/{id}/           → Get single order
POST   /api/orders/                → Create order
PUT    /api/orders/{id}/           → Update order
DELETE /api/orders/{id}/           → Delete order
```

---

## Service Method Mapping to API Endpoints

```
productService.getAllProducts()
    ↓ GET /api/products/

productService.getProduct(1)
    ↓ GET /api/products/1/

productService.createProduct(data)
    ↓ POST /api/products/
       Body: {...data}

productService.updateProduct(1, data)
    ↓ PUT /api/products/1/
       Body: {...data}

productService.deleteProduct(1)
    ↓ DELETE /api/products/1/

productService.getProductsByCategory('shirt')
    ↓ GET /api/products/?category=shirt
```

---

## File Structure & Responsibilities

```
src/
├── api/
│   ├── client.ts         ← Handles HTTP requests/responses
│   ├── config.ts         ← Constants & configuration
│   └── Types
│
├── services/
│   ├── productService.ts ← Product API methods
│   ├── orderService.ts   ← Order API methods
│   └── index.ts          ← Export all services
│
└── components/
    ├── ProductForm.tsx   ← Call createProduct()
    ├── ProductList.tsx   ← Call getAllProducts()
    └── OrdersList.tsx    ← Call getOrders()

backend/
├── backend_project/
│   └── settings.py       ← Database config, CORS, apps
├── api/
│   ├── models.py         ← Product, Order models
│   ├── views.py          ← ViewSets (handles requests)
│   ├── serializers.py    ← JSON converters
│   └── urls.py           ← Route endpoints
└── manage.py             ← Django CLI

Database/
└── MySQL
    └── mens_hub_db
        ├── api_product    ← Product data
        └── api_order      ← Order data
```

---

## Request/Response Examples

### Create Product Request
```
POST /api/products/ HTTP/1.1
Host: localhost:8000
Content-Type: application/json

{
  "name": "Blue T-Shirt",
  "description": "Premium 100% cotton",
  "price": "29.99",
  "category": "shirt",
  "stock": 100,
  "image_url": "https://example.com/shirt.jpg"
}
```

### Create Product Response
```
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": 1,
  "name": "Blue T-Shirt",
  "description": "Premium 100% cotton",
  "price": "29.99",
  "category": "shirt",
  "stock": 100,
  "image_url": "https://example.com/shirt.jpg",
  "created_at": "2026-05-05T10:30:00Z",
  "updated_at": "2026-05-05T10:30:00Z"
}
```

### Get All Products Response
```
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": 1,
    "name": "Blue T-Shirt",
    "price": "29.99",
    "category": "shirt",
    "stock": 100,
    ...
  },
  {
    "id": 2,
    "name": "Black Pants",
    "price": "49.99",
    "category": "pants",
    "stock": 50,
    ...
  }
]
```

---

## Technology Stack

```
Frontend Layer:
├── React 18+ (UI Framework)
├── Vite (Build Tool)
├── TypeScript (Type Safety)
└── Fetch API (HTTP Client)

Backend Layer:
├── Django 6.0 (Web Framework)
├── Django REST Framework (API)
└── Python 3.12 (Language)

Database Layer:
└── MySQL 8.0 (Database)

Networking:
├── HTTP/REST (Protocol)
└── JSON (Data Format)
```

---

## Security Features

✅ **CORS Configured** - Only allows specific origins
✅ **Type Safety** - TypeScript catches errors early
✅ **Error Handling** - Graceful error management
✅ **Validation** - Django validates all data
✅ **Authentication Ready** - Can add user auth to API
✅ **Database Protection** - Parameterized queries (ORM)

---

## Performance Considerations

```
Optimizations in place:
✅ Database indexing on id fields
✅ Serialized responses (compact JSON)
✅ Status codes follow REST standards
✅ Pagination ready (configured in settings)
✅ Error responses are consistent

Caching opportunities:
- Add Redis for session caching
- Implement ETag for browser caching
- Add query optimization for large datasets
```

---

## This Architecture Ensures:

✅ **Persistence** - Data survives page refreshes
✅ **Consistency** - Single source of truth (database)
✅ **Scalability** - Easy to add more endpoints
✅ **Maintainability** - Clear separation of concerns
✅ **Type Safety** - TypeScript + Django validation
✅ **RESTful** - Standard API design
✅ **Production Ready** - Can be deployed as-is

🎉 **You have a complete, functional web application!**
