/** Promotional offers shown in the seller dashboard. Use only approved offer terms here. */
export interface SellerOffer {
  heading: string;
  offer: string;
  benefit: string;
  ctaLabel: string;
  /** In-app path (starts with "/") or an absolute URL. Used when `rechargeAmount` is not set. */
  ctaHref: string;
  /** When set, the CTA opens the wallet recharge popup prefilled with this amount (₹) instead of navigating. */
  rechargeAmount?: number;
}

export const WALLET_CASHBACK_OFFER: SellerOffer = {
  heading: 'Special Offer for Sellers',
  offer: 'Recharge ₹5,000',
  benefit: 'Get up to ₹10,000 cashback',
  ctaLabel: 'Recharge Now',
  ctaHref: '/user/wallet',
  rechargeAmount: 5000,
};
