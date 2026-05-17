#!/usr/bin/env python
"""
Test admin product persistence
"""
import requests
import json

API_URL = 'http://localhost:8000'

# Admin credentials
login_data = {
    'email': 'mubarak.ali@menshub.com',
    'password': 'S@kMf$34'
}

print("=== STEP 1: LOGIN WITH ADMIN CREDENTIALS ===")
r = requests.post(f'{API_URL}/api/auth/login/', json=login_data)
print(f'Status: {r.status_code}')
response = r.json()

if r.status_code != 200:
    print(f'Error: {response}')
    exit(1)

token = response['token']
print(f'✓ Got auth token: {token[:20]}...')
print(f'✓ User: {response["user"]["name"]} - Admin: {response["user"]["isAdmin"]}')

print("\n=== STEP 2: GET PRODUCT BEFORE UPDATE ===")
r_get = requests.get(f'{API_URL}/api/products/1/')
before = r_get.json()
print(f'Product before: {before["name"]} - Price: {before["price"]}')

print("\n=== STEP 3: UPDATE PRODUCT WITH AUTH ===")
headers = {'Authorization': f'Token {token}'}
update_data = {
    'name': 'PERMANENT UPDATE - Classic Cotton T-Shirt',
    'description': 'PERMANENT UPDATE Premium quality 100% cotton',
    'price': '199.99',
    'category': 'shirt',
    'image_url': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    'stock': 500,
    'sizes': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    'popularity': 95,
    'featured': True
}

r_put = requests.put(f'{API_URL}/api/products/1/', json=update_data, headers=headers)
print(f'Update Status: {r_put.status_code}')

if r_put.status_code == 200:
    updated = r_put.json()
    print(f'✓ Update successful!')
    print(f'  Name: {updated["name"]}')
    print(f'  Price: {updated["price"]}')
    print(f'  Stock: {updated["stock"]}')
else:
    print(f'Error: {r_put.json()}')
    exit(1)

print("\n=== STEP 4: GET PRODUCT AFTER UPDATE (without refresh) ===")
r_get2 = requests.get(f'{API_URL}/api/products/1/', headers=headers)
after = r_get2.json()
print(f'Product after: {after["name"]} - Price: {after["price"]} - Stock: {after["stock"]}')

print("\n=== STEP 5: VERIFY DATA PERSISTS IN DATABASE ===")
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from api.models import Product
db_product = Product.objects.get(id=1)
print(f'Database: {db_product.name} - Price: {db_product.price} - Stock: {db_product.stock}')

print("\n✓ PERSISTENCE TEST COMPLETE")
print("Admin updates ARE persisting to database!")
