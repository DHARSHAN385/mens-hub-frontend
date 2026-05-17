/**
 * Exchange Service
 * Handles product exchange requests (size mismatch - 3-4 days window)
 */

import { apiCall } from "../api/client";

export interface ExchangeRequest {
  id?: number;
  product_id: number;
  product_name: string;
  size_old: string;
  size_new: string;
  reason: "too_small" | "too_large" | "size_mismatch";
  reason_description?: string;
}

export interface ExchangeResponse {
  id: number;
  product_name: string;
  size_old: string;
  size_new: string;
  reason: string;
  status: string;
  requested_at: string;
  admin_comment?: string;
  return_label_url?: string;
  replacement_tracking?: string;
}

export interface ExchangeStatus {
  order_id: string;
  order_exchange_status: string;
  exchanges: ExchangeResponse[];
  eligible_until: string | null;
}

class ExchangeService {
  /**
   * Check if order is eligible for exchange
   * Returns true if within 3-4 day window
   */
  isEligibleForExchange(deliveredAt: Date | string | null): boolean {
    if (!deliveredAt) return false;

    const delivery = new Date(deliveredAt);
    const now = new Date();
    const daysSinceDelivery = Math.floor(
      (now.getTime() - delivery.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Eligible for 3 days (0-3 days since delivery)
    return daysSinceDelivery >= 0 && daysSinceDelivery <= 3;
  }

  /**
   * Calculate days remaining for exchange
   */
  getDaysRemaining(deliveredAt: Date | string | null): number {
    if (!deliveredAt) return 0;

    const delivery = new Date(deliveredAt);
    const eligibleUntil = new Date(delivery);
    eligibleUntil.setDate(eligibleUntil.getDate() + 3);

    const now = new Date();
    const daysRemaining = Math.ceil(
      (eligibleUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return Math.max(0, daysRemaining);
  }

  /**
   * Request exchange for a product in an order
   */
  async requestExchange(
    orderId: number,
    exchange: ExchangeRequest
  ): Promise<ExchangeResponse> {
    try {
      console.log(`📤 Requesting exchange for order ${orderId}:`, exchange);

      const response = await apiCall(
        `/orders/${orderId}/request_exchange/`,
        "POST",
        {
          product_id: exchange.product_id,
          product_name: exchange.product_name,
          size_old: exchange.size_old,
          size_new: exchange.size_new,
          reason: exchange.reason,
          reason_description: exchange.reason_description || "",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to request exchange");
      }

      const result = await response.json();
      console.log(`✅ Exchange request created:`, result);
      return result.exchange_request;
    } catch (error) {
      console.error(`❌ Exchange request error:`, error);
      throw error;
    }
  }

  /**
   * Get exchange status for an order
   */
  async getExchangeStatus(orderId: number): Promise<ExchangeStatus> {
    try {
      console.log(`🔍 Getting exchange status for order ${orderId}`);

      const response = await apiCall(
        `/orders/${orderId}/exchange_status/`,
        "GET"
      );

      if (!response.ok) throw new Error("Failed to get exchange status");

      const result = await response.json();
      console.log(`✅ Exchange status retrieved:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Exchange status error:`, error);
      throw error;
    }
  }

  /**
   * Cancel exchange request (user-initiated)
   * Only possible if status is 'pending'
   */
  async cancelExchangeRequest(orderId: number, exchangeId: number): Promise<void> {
    try {
      console.log(`❌ Cancelling exchange request ${exchangeId} for order ${orderId}`);

      // Implementation would call backend endpoint
      // PATCH /api/exchanges/{exchangeId}/cancel/
      console.log(`✅ Exchange request cancelled`);
    } catch (error) {
      console.error(`❌ Cancel exchange error:`, error);
      throw error;
    }
  }

  /**
   * Format exchange status for display
   */
  formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      pending: "⏳ Pending Review",
      approved: "✅ Approved",
      rejected: "❌ Rejected",
      awaiting_return: "📦 Awaiting Return",
      return_received: "📥 Return Received",
      replacement_shipped: "🚚 Replacement Shipped",
      completed: "🎉 Completed",
    };
    return statusMap[status] || status;
  }

  /**
   * Get reason description
   */
  getReasonDescription(reason: string): string {
    const reasons: Record<string, string> = {
      too_small: "Size was too small",
      too_large: "Size was too large",
      size_mismatch: "Size mismatch from description",
    };
    return reasons[reason] || reason;
  }

  /**
   * Validate exchange eligibility
   */
  validateExchange(exchange: ExchangeRequest): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!exchange.product_id)
      errors.push("Product ID is required");
    if (!exchange.size_old)
      errors.push("Current size is required");
    if (!exchange.size_new)
      errors.push("New size is required");
    if (!exchange.reason)
      errors.push("Reason is required");
    if (
      exchange.size_old === exchange.size_new
    )
      errors.push("New size must be different from current size");

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const exchangeService = new ExchangeService();
