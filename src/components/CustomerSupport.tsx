/**
 * Customer Support/Contact Component
 * Allows customers to contact admin support with their order details
 */

import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';
import { Phone, MessageSquare, Mail, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface SupportContact {
  admin_name: string;
  whatsapp_number: string;
  email: string;
  phone: string;
}

interface CustomerOrder {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  address: string;
  pincode: string;
  phone: string;
  status: string;
}

interface CustomerSupportProps {
  orderId?: number;
  orderNumber?: string;
  onSuccess?: () => void;
}

export const CustomerSupport: React.FC<CustomerSupportProps> = ({
  orderId,
  orderNumber,
  onSuccess,
}) => {
  const [supportContact, setSupportContact] = useState<SupportContact | null>(null);
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supportSent, setSupportSent] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'whatsapp' | 'email'>('whatsapp');

  useEffect(() => {
    loadSupportData();
  }, [orderId, orderNumber]);

  const loadSupportData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch support contact info
      const contactResponse = await apiCall('/api/support/contact/', 'GET');
      if (contactResponse.success) {
        setSupportContact(contactResponse);
      }

      // If order details provided, fetch or use them
      if (orderId || orderNumber) {
        const supportResponse = await apiCall('/api/support/order/', 'POST', {
          order_id: orderId,
          order_number: orderNumber,
        });

        if (supportResponse.success && supportResponse.order_details) {
          setOrder(supportResponse.order_details);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load support information');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppClick = async () => {
    try {
      const response = await apiCall('/api/support/order/', 'POST', {
        order_id: orderId,
        order_number: orderNumber,
      });

      if (response.success && response.whatsapp_link) {
        window.open(response.whatsapp_link, '_blank');
        setSupportSent(true);
        setTimeout(() => setSupportSent(false), 3000);
        onSuccess?.();
      }
    } catch (err) {
      setError('Failed to generate WhatsApp link');
    }
  };

  const handleEmailClick = () => {
    if (!supportContact) return;

    const subject = orderId || orderNumber
      ? `Support Request for Order #${orderNumber || orderId}`
      : 'Support Request';

    const body = order
      ? `Hello,\n\nI need support for my order.\n\nOrder Details:\n- Order ID: ${order.order_number}\n- Customer Name: ${order.customer_name}\n- Email: ${order.customer_email}\n- Address: ${order.address}\n- Pincode: ${order.pincode}\n- Phone: ${order.phone}\n- Status: ${order.status}\n\nPlease help me with this order.\n\nThank you,\n${order.customer_name}`
      : 'Hello,\n\nI need support. Please contact me.\n\nThank you';

    window.location.href = `mailto:${supportContact.email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    setSupportSent(true);
    setTimeout(() => setSupportSent(false), 3000);
    onSuccess?.();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading support information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!supportContact) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-yellow-900">Support Unavailable</h3>
            <p className="text-sm text-yellow-700 mt-1">Support contact information is not available.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <h2 className="text-2xl font-bold mb-2">Contact Support</h2>
        <p className="text-blue-100">
          Need help with your order? Reach out to our support team
        </p>
      </div>

      <div className="p-6">
        {/* Support Agent Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Support Team</h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium text-gray-700">Name:</span>{' '}
              <span className="text-gray-600">{supportContact.admin_name}</span>
            </p>
            <p>
              <span className="font-medium text-gray-700">WhatsApp:</span>{' '}
              <span className="text-gray-600 font-mono">{supportContact.whatsapp_number}</span>
            </p>
            {supportContact.email && (
              <p>
                <span className="font-medium text-gray-700">Email:</span>{' '}
                <span className="text-gray-600 font-mono">{supportContact.email}</span>
              </p>
            )}
            {supportContact.phone && (
              <p>
                <span className="font-medium text-gray-700">Phone:</span>{' '}
                <span className="text-gray-600 font-mono">{supportContact.phone}</span>
              </p>
            )}
          </div>
        </div>

        {/* Order Details (if applicable) */}
        {order && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">📦 Order Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Order #:</span>{' '}
                <span className="text-gray-600">{order.order_number}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Customer:</span>{' '}
                <span className="text-gray-600">{order.customer_name}</span>
              </div>
              <div className="md:col-span-2">
                <span className="font-medium text-gray-700">Address:</span>{' '}
                <span className="text-gray-600">{order.address}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Pincode:</span>{' '}
                <span className="text-gray-600">{order.pincode}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Phone:</span>{' '}
                <span className="text-gray-600">{order.phone}</span>
              </div>
              <div className="md:col-span-2">
                <span className="font-medium text-gray-700">Status:</span>{' '}
                <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {order.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Contact Methods */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Choose Contact Method</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* WhatsApp Button */}
            <button
              onClick={handleWhatsAppClick}
              className="flex items-center justify-center gap-3 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
            >
              <MessageSquare className="w-5 h-5" />
              <span>WhatsApp</span>
            </button>

            {/* Email Button */}
            <button
              onClick={handleEmailClick}
              className="flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              <Mail className="w-5 h-5" />
              <span>Email</span>
            </button>
          </div>
        </div>

        {/* Direct Contact Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Or Contact Directly</h3>
          <div className="space-y-2">
            {supportContact.whatsapp_number && (
              <a
                href={`https://wa.me/${supportContact.whatsapp_number.replace('+', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-green-600 hover:text-green-700 font-medium"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{supportContact.whatsapp_number}</span>
              </a>
            )}
            {supportContact.email && (
              <a
                href={`mailto:${supportContact.email}`}
                className="flex items-center gap-3 text-blue-600 hover:text-blue-700 font-medium"
              >
                <Mail className="w-4 h-4" />
                <span>{supportContact.email}</span>
              </a>
            )}
            {supportContact.phone && (
              <a
                href={`tel:${supportContact.phone}`}
                className="flex items-center gap-3 text-blue-600 hover:text-blue-700 font-medium"
              >
                <Phone className="w-4 h-4" />
                <span>{supportContact.phone}</span>
              </a>
            )}
          </div>
        </div>

        {/* Success Message */}
        {supportSent && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-900">Contact Initiated</p>
              <p className="text-sm text-green-700 mt-1">
                Our support team will respond shortly. Thank you for contacting us!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerSupport;
