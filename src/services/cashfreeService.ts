/**
 * Cashfree Payment Service
 * Handles payment initiation and verification
 */

import { apiCall } from "../api/client";

interface CashfreeConfig {
  appId: string;
  mode: "TEST" | "PROD";
}

interface PaymentInitiation {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

interface PaymentVerification {
  orderId: string;
  paymentId: string;
  orderStatus: string;
  paymentMethod?: string;
}

export class CashfreeService {
  private config: CashfreeConfig | null = null;

  /**
   * Initialize Cashfree with config
   */
  initialize(config: CashfreeConfig): void {
    this.config = config;
    console.log(`✅ Cashfree initialized in ${config.mode} mode`);
  }

  /**
   * Initiate payment session with Cashfree backend
   */
  async initiatePayment(data: PaymentInitiation): Promise<any> {
    try {
      console.log(`📦 Initiating payment for order: ${data.orderId}`);

      const response = await apiCall(
        "/orders/initiate_payment/",
        "POST",
        {
          order_id: data.orderId,
          amount: data.amount,
          customer_name: data.customerName,
          customer_email: data.customerEmail,
          customer_phone: data.customerPhone,
        }
      );

      if (!response.ok) throw new Error("Failed to initiate payment");

      const result = await response.json();
      console.log(`✅ Payment initiated:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Payment initiation error:`, error);
      throw error;
    }
  }

  /**
   * Verify payment after callback from Cashfree
   */
  async verifyPayment(data: PaymentVerification): Promise<any> {
    try {
      console.log(`🔐 Verifying payment: ${data.paymentId}`);

      const response = await apiCall(
        "/orders/verify_payment/",
        "POST",
        {
          order_id: data.orderId,
          payment_id: data.paymentId,
          order_status: data.orderStatus,
          payment_method: data.paymentMethod || "upi",
        }
      );

      if (!response.ok) throw new Error("Payment verification failed");

      const result = await response.json();
      console.log(`✅ Payment verified:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Payment verification error:`, error);
      throw error;
    }
  }

  /**
   * Open Cashfree payment modal
   * Note: This requires Cashfree's JavaScript SDK
   */
  async openPaymentModal(sessionId: string, orderId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // This will use Cashfree's official SDK
      // For now, we'll return a mock response
      console.log(`🎯 Opening Cashfree payment modal for order: ${orderId}`);

      // In production, you would call Cashfree's SDK like:
      // const cashfree = new Cashfree();
      // cashfree.checkout({
      //   paymentSessionId: sessionId,
      //   redirectTarget: "_modal",
      // }).then((result) => {
      //   if (result.error) reject(result.error);
      //   resolve(result);
      // });

      // For demo, simulate successful payment after 2 seconds
      setTimeout(() => {
        resolve({
          orderId: orderId,
          txnId: `CF_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          orderStatus: "PAID",
          paymentMethod: "upi",
        });
      }, 2000);
    });
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(orderId: string): Promise<any> {
    try {
      console.log(`🔍 Checking payment status for order: ${orderId}`);
      // Implementation would call backend endpoint
      // GET /api/orders/{id}/payment-status/
      return { status: "pending", message: "Awaiting payment confirmation" };
    } catch (error) {
      console.error(`❌ Status check error:`, error);
      throw error;
    }
  }

  /**
   * Handle payment success callback
   */
  handlePaymentSuccess(orderId: string, paymentId: string): void {
    console.log(`✅ Payment successful for order ${orderId}`);
    const event = new CustomEvent("cashfree:payment-success", {
      detail: { orderId, paymentId },
    });
    window.dispatchEvent(event);
  }

  /**
   * Handle payment failure callback
   */
  handlePaymentFailure(orderId: string, error: string): void {
    console.error(`❌ Payment failed for order ${orderId}: ${error}`);
    const event = new CustomEvent("cashfree:payment-failure", {
      detail: { orderId, error },
    });
    window.dispatchEvent(event);
  }
}

export const cashfreeService = new CashfreeService();
