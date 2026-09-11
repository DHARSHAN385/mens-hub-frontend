/**
 * Razorpay Payment Service
 * Handles payment initiation and verification api calls
 */

import { apiCall } from "../api/client";

interface PaymentInitiation {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

interface PaymentVerification {
  orderId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void | Promise<void>;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

export class RazorpayService {
  private checkoutScriptPromise: Promise<void> | null = null;

  private loadCheckoutScript(): Promise<void> {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Razorpay can only be loaded in browser'));
    }

    if ((window as any).Razorpay) {
      return Promise.resolve();
    }

    if (!this.checkoutScriptPromise) {
      const preconnect = document.createElement('link');
      preconnect.rel = 'preconnect';
      preconnect.href = 'https://checkout.razorpay.com';
      preconnect.crossOrigin = 'anonymous';
      document.head.appendChild(preconnect);

      this.checkoutScriptPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'));
        document.head.appendChild(script);
      });
    }

    return this.checkoutScriptPromise;
  }

  async openCheckout(options: RazorpayCheckoutOptions): Promise<any> {
    await this.loadCheckoutScript();

    if (!(window as any).Razorpay) {
      throw new Error('Razorpay SDK is unavailable');
    }

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
    return rzp;
  }

  /**
   * Initiate payment order with backend
   */
  async initiatePayment(data: PaymentInitiation): Promise<any> {
    try {
      console.log(`📦 Initiating Razorpay payment order for: ${data.orderId}`);

      const result = await apiCall(
        "/api/orders/initiate_payment/",
        "POST",
        {
          order_id: data.orderId,
          amount: data.amount,
          customer_name: data.customerName,
          customer_email: data.customerEmail,
          customer_phone: data.customerPhone,
        }
      );

      console.log(`✅ Razorpay Payment order created:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Razorpay Payment initiation error:`, error);
      throw error;
    }
  }

  /**
   * Verify Razorpay signature on backend
   */
  async verifyPayment(data: PaymentVerification): Promise<any> {
    try {
      console.log(`🔐 Verifying Razorpay signature: Payment ID: ${data.razorpayPaymentId}, Order ID: ${data.razorpayOrderId}`);

      const result = await apiCall(
        "/api/orders/verify_payment/",
        "POST",
        {
          order_id: data.orderId,
          razorpay_payment_id: data.razorpayPaymentId,
          razorpay_order_id: data.razorpayOrderId,
          razorpay_signature: data.razorpaySignature,
        }
      );

      console.log(`✅ Razorpay signature verified:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Razorpay Payment verification error:`, error);
      throw error;
    }
  }
}

export const razorpayService = new RazorpayService();
