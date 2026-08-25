// ─── Rule-Based RTO Risk Prediction ────────────────────────────────────────────
// Pure calculation layer, deliberately kept separate from any UI component so
// the scoring rules — or eventually an ML-based predictor — can be swapped in
// without touching the pages that render the result.

import { apiClient } from './apiClient';

export type RtoRiskLevel = 'Low' | 'Medium' | 'High';

export interface RtoRiskResult {
  score: number;
  level: RtoRiskLevel;
  reasons: string[];
  action?: string[];
}

/** Minimal order shape the scorer needs — a subset of AdminOrders' mapped order. */
export interface RtoRiskOrderInput {
  paymentType?: string;      // 'COD' | 'Prepaid' | ...
  payment?: number;          // order value
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerPinCode?: string;
  courier?: string;
}

/** Aggregated history for the receiving customer — defaults (all zero/false) are
 *  safe: every rule that depends on this simply won't fire until real historical
 *  RTO/NDR data is wired in from the backend. */
export interface CustomerRtoHistory {
  isNewCustomer?: boolean;
  totalOrders?: number;
  totalRtoOrders?: number;
  rtoRate?: number;          // 0–100, percentage of this customer's orders that came back RTO
  hasPreviousNdr?: boolean;
}

/** Aggregated history for the delivery pincode. */
export interface PincodeRtoHistory {
  rtoRate?: number;          // 0–100
}

/** Aggregated history for a specific courier + pincode combination. */
export interface CourierPincodeRtoHistory {
  rtoRate?: number;          // 0–100
}

const COD_ORDER_VALUE_THRESHOLD = 5000;

/** A very light heuristic for "incomplete/invalid address" — a real address
 *  validation service can replace this check later without touching callers. */
function isAddressIncomplete(order: RtoRiskOrderInput): boolean {
  const addr = (order.customerAddress || '').trim();
  const pin = (order.customerPinCode || '').trim();
  if (!addr || addr.length < 8) return true;
  if (!pin || !/^\d{6}$/.test(pin)) return true;
  if (!order.customerCity || !order.customerState) return true;
  return false;
}

/**
 * Rule-based RTO risk scorer. Deterministic and side-effect free — safe to call
 * per-row in a table render. Missing history inputs default to "no signal",
 * so rows never falsely flag as risky just because history hasn't loaded yet.
 */
export function calculateRtoRisk(
  order: RtoRiskOrderInput,
  customerHistory: CustomerRtoHistory = {},
  pincodeHistory: PincodeRtoHistory = {},
  courierHistory: CourierPincodeRtoHistory = {}
): RtoRiskResult {
  let score = 0;
  const reasons: string[] = [];

  const isCod = (order.paymentType || '').toUpperCase() === 'COD';
  const customerRtoRate = customerHistory.rtoRate ?? 0;
  const pincodeRtoRate = pincodeHistory.rtoRate ?? 0;
  const courierPincodeRtoRate = courierHistory.rtoRate ?? 0;
  const hasPreviousRto = !!customerHistory.totalRtoOrders && customerHistory.totalRtoOrders > 0;

  if (isCod) {
    score += 15;
    reasons.push('COD order');
  }
  if (customerHistory.isNewCustomer) {
    score += 10;
    reasons.push('New customer');
  }
  if (hasPreviousRto) {
    score += 20;
    reasons.push('Previous RTO');
  }
  if (customerRtoRate > 30) {
    score += 20;
    reasons.push('Customer RTO rate > 30%');
  }
  if (pincodeRtoRate > 20) {
    score += 15;
    reasons.push('High-RTO pincode');
  }
  if (courierPincodeRtoRate > 20) {
    score += 10;
    reasons.push('High-RTO courier for this pincode');
  }
  if (isCod && (order.payment || 0) > COD_ORDER_VALUE_THRESHOLD) {
    score += 5;
    reasons.push('High-value COD order');
  }
  if (isAddressIncomplete(order)) {
    score += 10;
    reasons.push('Incomplete/invalid address');
  }
  if (customerHistory.hasPreviousNdr) {
    score += 10;
    reasons.push('Previous NDR');
  }

  score = Math.min(100, score);

  // Priority high-risk rules — override the score-based classification outright.
  const forcedHigh =
    customerRtoRate > 30 ||
    pincodeRtoRate > 25 ||
    (customerHistory.totalRtoOrders ?? 0) >= 2;

  let level: RtoRiskLevel;
  if (forcedHigh) {
    level = 'High';
  } else if (score <= 30) {
    level = 'Low';
  } else if (score <= 60) {
    level = 'Medium';
  } else {
    level = 'High';
  }

  return { score, level, reasons };
}

// ─── Backend-powered batch fetch ───────────────────────────────────────────────
/**
 * Calls POST /rtoRisk/batch with up to 100 order _ids.
 * Returns a map of { [orderId]: RtoRiskResult } using platform-wide RTO stats
 * computed in the backend (cross-seller pincode rates, real customer history).
 */
export async function fetchBatchRtoRisk(orderIds: string[]): Promise<Record<string, RtoRiskResult>> {
  if (orderIds.length === 0) return {};
  const res = await apiClient.post('/rtoRisk/batch', { orderIds });
  return (res.data?.risks || {}) as Record<string, RtoRiskResult>;
}

// The logic for rto based prediction is
// logic for rto risk Implement a **Rule-Based RTO Risk Prediction System** for QuickPost orders.

// For every order, calculate an **RTO Risk Score out of 100** using these conditions:

// * COD order → +15 points
// * New customer → +10 points
// * Customer has any previous RTO → +20 points
// * Customer RTO rate > 30% → +20 points
// * Pincode RTO rate > 20% → +15 points
// * Courier + Pincode RTO rate > 20% → +10 points
// * COD order value > ₹5,000 → +5 points
// * Incomplete/invalid address → +10 points
// * Customer has previous NDR → +10 points

// Cap the final score at **100**.

// Risk classification:

// * **0–30 → Low Risk**
// * **31–60 → Medium Risk**
// * **61–100 → High Risk**

// Also apply these priority rules before the normal score calculation:

// * If customer RTO rate > 30% → **High Risk**
// * If pincode RTO rate > 25% → **High Risk**
// * If customer has 2 or more previous RTOs → **High Risk**

// The system should return:

// 1. RTO Risk Score
// 2. Risk Level (Low / Medium / High)
// 3. Main reasons contributing to the risk
// 4. Recommended action

// Example output:

// **RTO Risk: 65/100 — HIGH**

// Reasons:

// * COD order
// * New customer
// * Previous RTO
// * High-RTO pincode

// Recommended actions:

// * Consider COD verification
// * Prefer a courier with lower RTO rate for this pincode
// * Enable proactive NDR/WhatsApp communication