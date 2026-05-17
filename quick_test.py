#!/usr/bin/env python
"""Quick API test"""
import requests
import json

# Login
login_data = {
    'email': 'mubarak.ali@menshub.com',
    'password': 'S@kMf$34'
}

print("Login...")
r = requests.post('http://localhost:8000/api/auth/login/', json=login_data)
print(f"Status: {r.status_code}")

if r.status_code != 200:
    print(f"Error: {r.json()}")
    exit(1)

token = r.json()['token']
headers = {'Authorization': f'Token {token}'}

print("Getting product 1...")
r2 = requests.get('http://localhost:8000/api/products/1/', headers=headers)
print(f"Status: {r2.status_code}")
print(f"Response: {json.dumps(r2.json(), indent=2)}")
