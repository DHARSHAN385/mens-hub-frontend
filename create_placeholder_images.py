#!/usr/bin/env python
"""Create placeholder images for products"""

import os
from PIL import Image, ImageDraw, ImageFont

# Create images folder if it doesn't exist
os.makedirs('menshum_productpics', exist_ok=True)

# Define placeholder images
placeholders = {
    'kaanchipuram-silk.jpg': {
        'size': (600, 800),
        'color': (200, 50, 100),  # Deep pink/maroon
        'text': 'Kaanchipuram Silk\n₹998'
    },
    'saree.jpg': {
        'size': (600, 800),
        'color': (220, 180, 50),  # Gold
        'text': 'Saree\n₹69.99'
    },
    'sarees-banner.jpg': {
        'size': (1200, 400),
        'color': (150, 50, 100),  # Purple
        'text': 'Premium Sarees'
    },
}

print("🎨 Creating placeholder images...")

for filename, config in placeholders.items():
    filepath = f'menshum_productpics/{filename}'
    
    try:
        # Create image with gradient-like effect
        img = Image.new('RGB', config['size'], config['color'])
        draw = ImageDraw.Draw(img)
        
        # Add text to the middle
        text = config['text']
        # Try to use a default font, fall back to default if not available
        try:
            font = ImageFont.truetype("arial.ttf", 40)
        except:
            font = ImageFont.load_default()
        
        # Calculate text position to center it
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        x = (config['size'][0] - text_width) // 2
        y = (config['size'][1] - text_height) // 2
        
        # Draw text with white color
        draw.text((x, y), text, fill=(255, 255, 255), font=font)
        
        # Save image
        img.save(filepath, 'JPEG', quality=85)
        print(f"✅ Created: {filename} ({config['size'][0]}x{config['size'][1]})")
        
    except Exception as e:
        print(f"❌ Failed to create {filename}: {e}")

# List files in folder
print("\n📁 Files in menshum_productpics:")
for f in os.listdir('menshum_productpics'):
    filepath = f'menshum_productpics/{f}'
    size = os.path.getsize(filepath) / 1024  # Size in KB
    print(f"  - {f} ({size:.1f} KB)")
