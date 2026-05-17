-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  image_url VARCHAR(500),
  category_image VARCHAR(500),
  banner_image VARCHAR(500),
  sizes TEXT[], -- JSON array: ["S", "M", "L", "XL"]
  popularity INT DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  stock INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT products_price_positive CHECK (price > 0)
);

-- Create index for faster queries
CREATE INDEX products_category_idx ON products(category);
CREATE INDEX products_featured_idx ON products(featured);

-- ============================================================================
-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(100) NOT NULL UNIQUE,
  image VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  items JSONB NOT NULL, -- [{productId, size, qty, price}, ...]
  total DECIMAL(12, 2) NOT NULL,
  shipping_address TEXT NOT NULL,
  billing_address TEXT,
  status VARCHAR(50) DEFAULT 'Pending', -- Pending, Shipped, Delivered, Cancelled
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT orders_status_check CHECK (status IN ('Pending', 'Shipped', 'Delivered', 'Cancelled')),
  CONSTRAINT orders_total_positive CHECK (total > 0)
);

-- Create indexes for orders
CREATE INDEX orders_customer_email_idx ON orders(customer_email);
CREATE INDEX orders_status_idx ON orders(status);
CREATE INDEX orders_created_at_idx ON orders(created_at DESC);

-- ============================================================================
-- 4. CART TABLE
CREATE TABLE IF NOT EXISTS cart (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  session_id VARCHAR(255) NOT NULL, -- Browser session ID or user ID
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size VARCHAR(10) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT cart_quantity_positive CHECK (quantity > 0),
  UNIQUE(session_id, product_id, size)
);

-- Create indexes for cart
CREATE INDEX cart_session_idx ON cart(session_id);
CREATE INDEX cart_product_idx ON cart(product_id);

-- ============================================================================
-- 5. WISHLIST TABLE
CREATE TABLE IF NOT EXISTS wishlist (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  session_id VARCHAR(255) NOT NULL, -- Browser session ID or user ID
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, product_id)
);

-- Create indexes for wishlist
CREATE INDEX wishlist_session_idx ON wishlist(session_id);
CREATE INDEX wishlist_product_idx ON wishlist(product_id);

-- ============================================================================
-- 6. BANNER TABLE
CREATE TABLE IF NOT EXISTS banner (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title VARCHAR(255),
  image_url VARCHAR(500) NOT NULL,
  link VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  position INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Enable RLS (Row Level Security) - IMPORTANT FOR SECURITY
-- ============================================================================

-- For now, disable RLS to allow anon key access (since no auth)
-- When you implement auth later, enable RLS and add policies

ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE cart DISABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist DISABLE ROW LEVEL SECURITY;
ALTER TABLE banner DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SEED DATA - Insert sample data
-- ============================================================================

-- 1. Insert sample categories
INSERT INTO categories (name, image) VALUES
('Shirts', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'),
('Pants', 'https://images.unsplash.com/photo-1542272604-787c62d465d1?w=500'),
('Jackets', 'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=500'),
('Shoes', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'),
('Accessories', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert sample products
INSERT INTO products (name, description, price, category, image_url, category_image, banner_image, sizes, stock, featured) VALUES
('Premium Cotton T-Shirt', 'High quality 100% cotton t-shirt', 29.99, 'Shirts', 
 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300',
 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1000',
 '["XS", "S", "M", "L", "XL", "XXL"]', 100, TRUE),

('Casual Button-Up Shirt', 'Comfortable everyday shirt', 39.99, 'Shirts',
 'https://images.unsplash.com/photo-1577257645324-e41e1d0e1f09?w=500',
 'https://images.unsplash.com/photo-1577257645324-e41e1d0e1f09?w=300',
 'https://images.unsplash.com/photo-1577257645324-e41e1d0e1f09?w=1000',
 '["S", "M", "L", "XL"]', 75, FALSE),

('Slim Fit Black Jeans', 'Modern slim fit denim jeans', 59.99, 'Pants',
 'https://images.unsplash.com/photo-1542272604-787c62d465d1?w=500',
 'https://images.unsplash.com/photo-1542272604-787c62d465d1?w=300',
 'https://images.unsplash.com/photo-1542272604-787c62d465d1?w=1000',
 '["28", "30", "32", "34", "36"]', 80, TRUE),

('Chino Pants', 'Versatile chino pants for any occasion', 49.99, 'Pants',
 'https://images.unsplash.com/photo-1473966143637-3a37435e4dee?w=500',
 'https://images.unsplash.com/photo-1473966143637-3a37435e4dee?w=300',
 'https://images.unsplash.com/photo-1473966143637-3a37435e4dee?w=1000',
 '["28", "30", "32", "34"]', 60, FALSE),

('Leather Bomber Jacket', 'Classic leather bomber jacket', 129.99, 'Jackets',
 'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=500',
 'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=300',
 'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=1000',
 '["S", "M", "L", "XL"]', 40, TRUE),

('Denim Jacket', 'Timeless denim jacket', 89.99, 'Jackets',
 'https://images.unsplash.com/photo-1576584970117-34e195fb1b8e?w=500',
 'https://images.unsplash.com/photo-1576584970117-34e195fb1b8e?w=300',
 'https://images.unsplash.com/photo-1576584970117-34e195fb1b8e?w=1000',
 '["XS", "S", "M", "L", "XL"]', 50, FALSE),

('Running Sneakers', 'Lightweight and comfortable running shoes', 89.99, 'Shoes',
 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300',
 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000',
 '["6", "7", "8", "9", "10", "11", "12", "13"]', 90, TRUE),

('Classic Oxford Shoes', 'Formal oxford shoes for dress occasions', 119.99, 'Shoes',
 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=500',
 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=300',
 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=1000',
 '["6", "7", "8", "9", "10", "11", "12"]', 30, FALSE),

('Canvas Backpack', 'Durable canvas backpack for daily use', 49.99, 'Accessories',
 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300',
 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1000',
 '["One Size"]', 100, TRUE),

('Leather Belt', 'Premium leather belt with buckle', 34.99, 'Accessories',
 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300',
 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1000',
 '["S", "M", "L"]', 150, FALSE)
ON CONFLICT DO NOTHING;

-- 3. Insert sample banner
INSERT INTO banner (title, image_url, is_active, position) VALUES
('Welcome to Mens Hub', 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=1200', TRUE, 1)
ON CONFLICT DO NOTHING;
-- ============================================================================
-- VERIFICATION - Check if data was inserted
-- ============================================================================
SELECT COUNT(*) as products_count FROM products;
SELECT COUNT(*) as categories_count FROM categories;
SELECT COUNT(*) as banner_count FROM banner;