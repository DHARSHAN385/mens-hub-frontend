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

export class RazorpayService {
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
