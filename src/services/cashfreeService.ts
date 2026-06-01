/**
 * Cashfree Payment Service
 * Handles payment initiation and verification
 */

import { apiCall } from "../api/client";

declare global {
  interface Window {
    Cashfree: any;
  }
}

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

      const result = await apiCall(
        "/api/orders/verify_payment/",
        "POST",
        {
          order_id: data.orderId,
          payment_id: data.paymentId,
          order_status: data.orderStatus,
          payment_method: data.paymentMethod || "upi",
        }
      );

      console.log(`✅ Payment verified:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Payment verification error:`, error);
      throw error;
    }
  }

  /**
   * Dynamically load the Cashfree SDK script on-demand
   */
  private loadScript(): Promise<void> {
    if (typeof window.Cashfree !== "undefined") return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      console.log("⏳ Dynamically loading Cashfree SDK...");
      const script = document.createElement("script");
      script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
      script.async = true;
      script.onload = () => {
        console.log("✅ Cashfree SDK loaded dynamically successfully!");
        resolve();
      };
      script.onerror = () => {
        console.error("❌ Failed to load Cashfree SDK dynamically.");
        reject(new Error("Failed to load Cashfree payment gateway SDK"));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Open Cashfree payment modal
   */
  async openPaymentModal(sessionId: string, orderId: string): Promise<any> {
    try {
      await this.loadScript();
    } catch (err: any) {
      return Promise.reject(err);
    }

    return new Promise((resolve, reject) => {
      console.log(`🎯 Opening Cashfree payment modal for order: ${orderId}`);

      if (typeof window.Cashfree === "undefined") {
        console.error("❌ Cashfree SDK not loaded in window.");
        reject(new Error("Cashfree SDK not loaded. Please try again."));
        return;
      }

      try {
        const cashfree = window.Cashfree({
          mode: this.config?.mode === "PROD" ? "production" : "sandbox",
        });

        cashfree.checkout({
          paymentSessionId: sessionId,
          redirectTarget: "_modal", // Opens checkout in an iframe popup overlay
        }).then((result: any) => {
          if (result.error) {
            console.error("❌ Cashfree Payment Checkout Error:", result.error);
            reject(result.error);
          } else {
            console.log("✅ Cashfree Checkout success callback:", result);
            resolve({
              orderId: orderId,
              txnId: result.paymentId || `CF_TXN_${orderId}`,
              orderStatus: "PAID",
              paymentMethod: result.paymentMethod || "upi",
            });
          }
        }).catch((err: any) => {
          console.error("❌ Cashfree checkout promise catch:", err);
          reject(err);
        });
      } catch (err) {
        console.error("❌ Error initializing Cashfree SDK checkout:", err);
        reject(err);
      }
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
