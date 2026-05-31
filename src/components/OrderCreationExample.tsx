/**
 * Example Order Creation Component
 * 
 * Demonstrates how to create an order that triggers real-time
 * WebSocket notifications to connected admins.
 * 
 * Usage:
 * - Import this component in your app
 * - Admin users connected to the WebSocket will immediately
 *   receive notifications when orders are created
 */

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
  size?: string;
}

interface CreateOrderResponse {
  success: boolean;
  order: {
    id: number;
    order_number: string;
    customer_name: string;
    customer_email: string;
    total_amount: string;
    items: OrderItem[];
    status: string;
    created_at: string;
  };
  notification: {
    id: number;
    order_number: string;
    message: string;
    created_at: string;
    websocket_status: string;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mens-hub-backend.onrender.com';

export const OrderCreationExample: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<CreateOrderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a sample order
   * This will trigger WebSocket notification to all connected admins
   */
  const handleCreateOrder = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const orderData = {
        customer_name: `Customer ${Math.floor(Math.random() * 10000)}`,
        customer_email: `customer${Math.floor(Math.random() * 10000)}@example.com`,
        total_amount: Math.floor(Math.random() * 10000) + 100,
        address: '123 Main Street, City, Country',
        pincode: '123456',
        items: [
          {
            product_name: 'Premium T-Shirt',
            quantity: 2,
            price: 500,
            size: 'M',
          },
          {
            product_name: 'Casual Jeans',
            quantity: 1,
            price: 1500,
            size: 'L',
          },
        ],
      };

      const apiUrl = `${API_BASE_URL}/api/orders/create-with-notification/`;

      console.log('Creating order:', orderData);
      console.log('API URL:', apiUrl);

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const data = (await res.json()) as CreateOrderResponse;
      console.log('Order created successfully:', data);
      setResponse(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create order';
      console.error('Error creating order:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Test Order Creation & Notifications</h2>

      <p className="text-gray-600 mb-4">
        Click the button below to create a test order. If you have the admin notification
        center open, you should see a real-time notification appear within seconds.
      </p>

      <button
        onClick={handleCreateOrder}
        disabled={isLoading}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${
          isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader className="w-5 h-5 animate-spin" />
            Creating Order...
          </span>
        ) : (
          'Create Test Order'
        )}
      </button>

      {/* Success Response */}
      {response && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-900">Order Created Successfully!</h3>
              <p className="text-sm text-green-700">
                Order #{response.order.order_number} created
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded border border-green-100 text-sm space-y-2">
            <div>
              <span className="font-semibold">Order ID:</span> {response.order.id}
            </div>
            <div>
              <span className="font-semibold">Order Number:</span> {response.order.order_number}
            </div>
            <div>
              <span className="font-semibold">Customer:</span> {response.order.customer_name}
            </div>
            <div>
              <span className="font-semibold">Email:</span> {response.order.customer_email}
            </div>
            <div>
              <span className="font-semibold">Total Amount:</span> ${response.order.total_amount}
            </div>
            <div>
              <span className="font-semibold">Items:</span> {response.order.items.length}
            </div>
            <div>
              <span className="font-semibold">WebSocket Status:</span>{' '}
              <span className="text-green-600 font-medium">{response.notification.websocket_status}</span>
            </div>
            <div>
              <span className="font-semibold">Created At:</span>{' '}
              {new Date(response.order.created_at).toLocaleString()}
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <p className="text-blue-900">
              ✓ If you have the admin notification center connected, check for a real-time popup
              notification appearing immediately!
            </p>
          </div>
        </div>
      )}

      {/* Error Response */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">Failed to Create Order</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <p className="text-xs text-red-600 mt-2">
                Make sure your Django backend is running and the API URL is correct.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-3">How to Use:</h3>
        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
          <li>Open this page in a browser window</li>
          <li>Open the admin dashboard with notification center in another window/tab</li>
          <li>Click "Create Test Order" button</li>
          <li>Check admin dashboard - notification should appear in real-time!</li>
          <li>Check your browser notifications if permissions are granted</li>
        </ol>
      </div>
    </div>
  );
};

export default OrderCreationExample;
