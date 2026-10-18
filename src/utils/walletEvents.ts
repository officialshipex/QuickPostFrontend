/** Window event that opens the header's wallet recharge popup. `detail.amount` prefills the amount (₹). */
export const OPEN_RECHARGE_EVENT = 'qp:open-recharge';

export function openRechargePopup(amount?: number) {
  window.dispatchEvent(new CustomEvent(OPEN_RECHARGE_EVENT, { detail: { amount } }));
}
