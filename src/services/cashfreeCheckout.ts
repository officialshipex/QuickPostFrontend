// Cashfree Payment Gateway checkout (cashfree.js v3) for wallet recharges, used when the company has switched its
// recharges to Cashfree (QuickPost > Companies > Payment gateway). The backend picks the gateway: see
// /recharge/create-payment. Whatever the popup reports, the backend confirms the payment with Cashfree itself
// (/recharge/cashfree/verify) before anything is credited.
import { apiClient } from './apiClient';

const SDK_URL = 'https://sdk.cashfree.com/js/v3/cashfree.js';

type CashfreeFactory = (opts: { mode: 'sandbox' | 'production' }) => {
  checkout: (opts: { paymentSessionId: string; redirectTarget: '_modal' | '_self' | '_blank' | '_top' }) => Promise<{
    error?: { message?: string };
    redirect?: boolean;
    paymentDetails?: { paymentMessage?: string };
  }>;
};

let sdkPromise: Promise<CashfreeFactory> | null = null;

function loadCashfreeSdk(): Promise<CashfreeFactory> {
  const existing = (window as unknown as { Cashfree?: CashfreeFactory }).Cashfree;
  if (existing) return Promise.resolve(existing);
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SDK_URL;
      script.async = true;
      script.onload = () => {
        const factory = (window as unknown as { Cashfree?: CashfreeFactory }).Cashfree;
        if (factory) resolve(factory);
        else reject(new Error('Cashfree SDK did not load'));
      };
      script.onerror = () => { sdkPromise = null; reject(new Error('Failed to load Cashfree SDK')); };
      document.body.appendChild(script);
    });
  }
  return sdkPromise;
}

/** Opens Cashfree's payment popup; resolves once it closes (paid, failed or dismissed). */
export async function openCashfreeCheckout(paymentSessionId: string, mode: 'sandbox' | 'production') {
  const Cashfree = await loadCashfreeSdk();
  const cashfree = Cashfree({ mode });
  return cashfree.checkout({ paymentSessionId, redirectTarget: '_modal' });
}

export type CashfreeVerifyResult = {
  success: boolean;
  status: 'credited' | 'already_credited' | 'pending' | 'failed';
  amount?: number;
  balance?: number;
  message?: string;
};

/** Asks the backend to confirm the order with Cashfree and credit the wallet (at most once). */
export async function verifyCashfreeOrder(orderId: string): Promise<CashfreeVerifyResult> {
  const { data } = await apiClient.post('/recharge/cashfree/verify', { orderId });
  return data;
}

/**
 * verifyCashfreeOrder, asked again a few times while the payment is still "pending": the popup closes the moment
 * the bank answers, sometimes a little before Cashfree shows the order as paid. Never throws for "pending"; throws
 * only when the backend cannot be reached at all.
 */
export async function confirmCashfreeOrder(orderId: string, attempts = 4, delayMs = 2000): Promise<CashfreeVerifyResult> {
  let last: CashfreeVerifyResult | null = null;
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    last = await verifyCashfreeOrder(orderId);
    if (last.status !== 'pending') return last;
  }
  return last as CashfreeVerifyResult;
}

/** The query parameter Cashfree's return_url carries when the popup could not open (in-app browsers). */
export const CASHFREE_RETURN_PARAM = 'cf_order_id';
