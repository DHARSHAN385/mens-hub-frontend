// Example Product Management Component
// Shows how to use the Product Service to fetch/save data from/to the database

import React, { useState, useEffect } from 'react';
import productService, { Product } from '../services/productService';
import { toast } from 'sonner';

export const ProductManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products from database when component loads
  useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch all products from the database
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAllProducts();
      setProducts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };


  // Add a new product to the database
  const handleAddProduct = async (newProduct: Product) => {
    try {
      // Convert Product to FormData for API
      const formData = new FormData();
      formData.append('name', newProduct.name || '');
      formData.append('description', newProduct.description || '');
      formData.append('price', String(newProduct.price || 0));
      formData.append('category', String(newProduct.category || ''));
      formData.append('stock', String(newProduct.stock || 0));
      
      const created = await productService.createProduct(formData);
      if (!created) {
        throw new Error('No product returned from server');
      }
      setProducts([...products, created]);
      toast.success('Product created successfully');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create product';
      setError(msg);
      toast.error(msg);
      console.error('Create product error:', err);
    }
  };


  // Update an existing product in the database
  const handleUpdateProduct = async (id: number, updatedData: Partial<Product>) => {
    try {
      // Convert to FormData for API
      const formData = new FormData();
      Object.entries(updatedData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      
      const updated = await productService.updateProduct(id, formData);
      if (!updated) {
        throw new Error('No product returned from server');
      }
      setProducts(products.map(p => p.id === id ? updated : p));
      toast.success('Product updated successfully');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update product';
      setError(msg);
      toast.error(msg);
      console.error('Update product error:', err);
    }
  };

  // Delete a product from the database
  const handleDeleteProduct = async (id: number) => {
    try {
      await productService.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  if (loading) return <div>Loading products...</div>;

  return (
    <div className="product-manager">
      <h1>Product Manager</h1>
      
      {error && <div className="error">{error}</div>}

      <div className="product-list">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p className="price">${product.price}</p>
            <p className="category">{product.category}</p>
            <p className="stock">Stock: {product.stock}</p>
            
            <button 
              onClick={() => handleUpdateProduct(product.id!, {
                stock: (product.stock || 0) + 1
              })}
            >
              Increase Stock
            </button>
            
            <button 
              onClick={() => handleDeleteProduct(product.id!)}
              className="delete-btn"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductManager;

/* USAGE EXAMPLE:

In your component, use the service like this:

import { productService } from '@/services/productService';

// Get all products
const products = await productService.getAllProducts();

// Get products by category
const shirts = await productService.getProductsByCategory('shirt');

// Create a new product (saves to database immediately)
const newProduct = await productService.createProduct({
  name: 'Blue T-Shirt',
  description: 'Premium cotton',
  price: 29.99,
  category: 'shirt',
  stock: 100
});

// Update a product
await productService.updateProduct(1, {
  price: 25.99,
  stock: 50
});

// Delete a product
await productService.deleteProduct(1);

All data is automatically saved to the MySQL database!
*/
