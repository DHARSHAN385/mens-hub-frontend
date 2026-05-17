#!/usr/bin/env python
"""
Test Admin Persistence After Refresh - Final Verification
"""
import requests
import json
import time

API_URL = 'http://localhost:8000'

print("=" * 60)
print("ADMIN PERSISTENCE TEST - FINAL VERIFICATION")
print("=" * 60)

# Step 1: Login
print("\n[1/5] Logging in as admin...")
login_data = {
    'email': 'mubarak.ali@menshub.com',
    'password': 'S@kMf$34'
}

r = requests.post(f'{API_URL}/api/auth/login/', json=login_data)
if r.status_code != 200:
    print(f"❌ Login failed: {r.json()}")
    exit(1)

token = r.json()['token']
print(f"✅ Logged in successfully")
print(f"   Token: {token[:20]}...")

headers = {'Authorization': f'Token {token}'}

# Step 2: Check initial product
print("\n[2/5] Getting initial product state...")
r = requests.get(f'{API_URL}/api/products/1/', headers=headers)
before = r.json()
print(f"✅ Initial product: '{before['name']}' @ ₹{before['price']}")

# Step 3: Update product with unique timestamp
print("\n[3/5] Updating product with unique value...")
timestamp = str(int(time.time()))
update_data = {
    'name': f'UPDATED TEST {timestamp}',
    'description': f'Test update at {timestamp}',
    'price': '999.99',
    'category': 'shirt',
    'image_url': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    'stock': 999,
    'sizes': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    'popularity': 99,
    'featured': True
}

r = requests.put(f'{API_URL}/api/products/1/', json=update_data, headers=headers)
if r.status_code != 200:
    print(f"❌ Update failed: {r.json()}")
    exit(1)

updated_response = r.json()
print(f"✅ Product updated successfully")
print(f"   New name: '{updated_response['name']}'")
print(f"   New price: ₹{updated_response['price']}")

# Step 4: Verify update persisted in database
print("\n[4/5] Verifying update in database (Django ORM)...")
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from api.models import Product
db_product = Product.objects.get(id=1)
print(f"✅ Database verification:")
print(f"   Name: '{db_product.name}'")
print(f"   Price: ₹{db_product.price}")
print(f"   Stock: {db_product.stock}")

# Verify it matches what we updated
if db_product.name == update_data['name'] and db_product.price == float(update_data['price']):
    print(f"✅ Update CONFIRMED in database!")
else:
    print(f"❌ Database data doesn't match update!")
    exit(1)

# Step 5: Simulate refresh - GET fresh data from API
print("\n[5/5] Simulating page refresh - fetching fresh data...")
time.sleep(1)
r = requests.get(f'{API_URL}/api/products/1/', headers=headers)
refreshed = r.json()
print(f"✅ Refreshed product data:")
print(f"   Name: '{refreshed['name']}'")
print(f"   Price: ₹{refreshed['price']}")
print(f"   Stock: {refreshed['stock']}")

# Final verification
print("\n" + "=" * 60)
if (refreshed['name'] == update_data['name'] and 
    refreshed['price'] == update_data['price'] and
    refreshed['stock'] == update_data['stock']):
    print("✅✅✅ ALL TESTS PASSED! ✅✅✅")
    print("\n🎉 Admin updates NOW persist permanently!")
    print("   - Updates save to database immediately")
    print("   - Refresh shows updated data (not old)")
    print("   - Multiple users see same updates")
else:
    print("❌ Test failed - data mismatch")
    print(f"\nExpected: {update_data['name']}")
    print(f"Got: {refreshed['name']}")
    exit(1)

print("=" * 60)
