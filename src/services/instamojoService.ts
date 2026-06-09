/**
 * Instamojo Payment Service
 * Handles payment initiation and verification
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
  paymentRequestId: string;
  paymentId?: string;
}

export class InstamojoService {
  /**
   * Initiate payment request with Instamojo backend
   */
  async initiatePayment(data: PaymentInitiation): Promise<any> {
    try {
      console.log(`📦 Initiating Instamojo payment for order: ${data.orderId}`);

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

      console.log(`✅ Instamojo Payment initiated:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Instamojo Payment initiation error:`, error);
      throw error;
    }
  }

  /**
   * Verify Instamojo payment status on backend
   */
  async verifyPayment(data: PaymentVerification): Promise<any> {
    try {
      console.log(`🔐 Verifying Instamojo payment: Request ID: ${data.paymentRequestId}, Payment ID: ${data.paymentId}`);

      const result = await apiCall(
        "/api/orders/verify_payment/",
        "POST",
        {
          order_id: data.orderId,
          payment_request_id: data.paymentRequestId,
          payment_id: data.paymentId || "",
        }
      );

      console.log(`✅ Instamojo Payment verified:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Instamojo Payment verification error:`, error);
      throw error;
    }
  }
}

export const instamojoService = new InstamojoService();
