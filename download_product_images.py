#!/usr/bin/env python
"""Download product images and store them locally"""

import urllib.request
import os

# Create images folder if it doesn't exist
os.makedirs('menshum_productpics', exist_ok=True)

# Sample images to download - using direct download links
images_to_download = {
    'kaanchipuram-silk.jpg': 'https://images.unsplash.com/photo-1618689944806-142f964d5ec1?w=600&h=800',
    'saree.jpg': 'https://images.unsplash.com/photo-1604653894610-df63bc536371?w=600&h=800',
    'sarees-banner.jpg': 'https://images.unsplash.com/photo-1617039767506-adf3b5e37b5f?w=1200&h=400',
}

print("📥 Downloading images...")
for filename, url in images_to_download.items():
    filepath = f'menshum_productpics/{filename}'
    try:
        # Add User-Agent to avoid being blocked
        headers = {'User-Agent': 'Mozilla/5.0'}
        request = urllib.request.Request(url, headers=headers)
        urllib.request.urlretrieve(url, filepath)
        print(f"✅ Downloaded: {filename}")
    except Exception as e:
        print(f"❌ Failed to download {filename}: {e}")

# List files in folder
print("\n📁 Files in menshum_productpics:")
for f in os.listdir('menshum_productpics'):
    filepath = f'menshum_productpics/{f}'
    size = os.path.getsize(filepath) / 1024  # Size in KB
    print(f"  - {f} ({size:.1f} KB)")
