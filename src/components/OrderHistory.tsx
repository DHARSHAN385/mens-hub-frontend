import { useState, useEffect } from 'react';
import { ChevronLeft, Package, Clock, Truck, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  name: string;
  qty: number;
  size: string;
  price?: number;
}

interface Order {
  id: number;
  order_number: string;
  status: 'pending' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  total_amount: number;
  items: OrderItem[];
  tracking_number?: string;
  created_at: string;
  updated_at: string;
  customer_name: string;
  customer_email: string;
  phone?: string;
  address?: string;
}

import { CONFIG } from '../app/config';

interface OrderHistoryProps {
  onBack?: () => void;
  authToken?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://mens-hub-backend.onrender.com';

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Placed' },
  shipped: { icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Shipped' },
  out_for_delivery: { icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Out for Delivery' },
  delivered: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Delivered' },
  cancelled: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Cancelled' },
};

export const OrderHistory: React.FC<OrderHistoryProps> = ({ onBack, authToken }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const token = authToken || localStorage.getItem('authToken');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/orders/my_orders/`, {
        headers: { Authorization: `Token ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        toast.error('Failed to load orders');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600 dark:text-gray-400">Please login to view orders</p>
      </div>
    );
  }

  if (selectedOrder) {
    const statusConfig = STATUS_CONFIG[selectedOrder.status];
    const StatusIcon = statusConfig.icon;

    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => setSelectedOrder(null)}
          className="mb-6 flex items-center gap-1 text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft size={18} /> Back
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          {/* Order Header */}
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold dark:text-white">Order #{selectedOrder.order_number}</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  Placed on {new Date(selectedOrder.created_at).toLocaleDateString('en-IN')}
                </p>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.bg}`}>
                <StatusIcon size={20} className={statusConfig.color} />
                <span className={`font-semibold ${statusConfig.color}`}>{statusConfig.label}</span>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="mb-8">
            <h3 className="font-semibold text-lg mb-4 dark:text-white">Order Status</h3>
            <div className="space-y-4">
              {['pending', 'shipped', 'out_for_delivery', 'delivered'].map((s) => {
                const isCompleted = ['pending', 'shipped', 'out_for_delivery', 'delivered'].indexOf(s) <= 
                                   ['pending', 'shipped', 'out_for_delivery', 'delivered'].indexOf(selectedOrder.status);
                const config = STATUS_CONFIG[s as keyof typeof STATUS_CONFIG];
                const Icon = config.icon;

                return (
                  <div key={s} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        <Icon size={18} />
                      </div>
                      {s !== 'delivered' && (
                        <div className={`w-0.5 h-8 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className={`font-semibold ${isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                        {config.label}
                      </p>
                      {isCompleted && s !== 'pending' && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {new Date(selectedOrder.updated_at).toLocaleDateString('en-IN')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tracking Number */}
          {selectedOrder.tracking_number && selectedOrder.status === 'shipped' && (
            <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Tracking Number</p>
              <p className="font-mono font-semibold text-lg text-blue-600 dark:text-blue-300">
                {selectedOrder.tracking_number}
              </p>
            </div>
          )}

          {/* WhatsApp Contact */}
          {(selectedOrder.status === 'shipped' || selectedOrder.status === 'out_for_delivery' || selectedOrder.status === 'delivered') && (
            <div className="mb-8 p-4 bg-green-50 dark:bg-green-900 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-800 dark:text-green-100">Need help with this order?</p>
                <p className="text-sm text-green-700 dark:text-green-300">Contact admin directly via WhatsApp</p>
              </div>
              <button
                onClick={() => {
                  const adminPhone = CONFIG.WHATSAPP_ADMIN || '919876543210';
                  const text = `Hi, I have a query regarding my order.\n\nCustomer: ${selectedOrder.customer_name}\nOrder ID: ${selectedOrder.order_number}\nPhone: ${selectedOrder.phone || 'Not provided'}\nAddress: ${selectedOrder.address || 'Not provided'}\n\nQuery: `;
                  window.open(`https://wa.me/${adminPhone.replace('+', '')}?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                Contact via WhatsApp
              </button>
            </div>
          )}

          {/* Order Items */}
          <div className="mb-8">
            <h3 className="font-semibold text-lg mb-4 dark:text-white">Order Items</h3>
            <div className="space-y-3">
              {selectedOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="font-medium dark:text-white">{item.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Size: {item.size} | Qty: {item.qty}
                    </p>
                  </div>
                  {item.price && (
                    <p className="font-semibold dark:text-white">₹{(item.price * item.qty).toLocaleString('en-IN')}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg dark:text-white">Total Amount</span>
              <span className="font-bold text-2xl text-blue-600">₹{selectedOrder.total_amount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Download Invoice Button */}
          <button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition">
            Download Invoice
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {onBack && (
        <button onClick={onBack} className="mb-6 flex items-center gap-1 text-blue-600 hover:text-blue-700">
          <ChevronLeft size={18} /> Back
        </button>
      )}

      <h2 className="text-3xl font-bold mb-6 dark:text-white">My Orders</h2>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <Package size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">No orders yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Start shopping to create your first order</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusConfig = STATUS_CONFIG[order.status];
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition p-4 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg dark:text-white">Order #{order.order_number}</h3>
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${statusConfig.bg}`}>
                        <StatusIcon size={16} className={statusConfig.color} />
                        <span className={`text-xs font-semibold ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      Placed on {new Date(order.created_at).toLocaleDateString('en-IN')} at{' '}
                      {new Date(order.created_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>

                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      {order.items.length} item{order.items.length > 1 ? 's' : ''}
                    </p>

                    <p className="font-semibold text-blue-600">₹{order.total_amount.toLocaleString('en-IN')}</p>
                  </div>

                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="ml-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                  >
                    <Eye size={18} /> View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
