/* "What's New" announcements shown to sellers after login (see components/ui/WhatsNewCard).
   To announce something: add an entry with a NEW unique `id`. Ids a seller has already
   dismissed never show again; a new id brings the card back with only the new items.
   The card shows up to 3 unseen entries for the current page. */

export interface Announcement {
  id: string;
  tag: 'NEW' | 'IMPROVED' | 'COMING SOON';
  title: string;
  body: string;
  cta: string;
  /** Route to open from the main button. Omit for an acknowledge-only item ("Got it"). */
  href?: string;
  /** Show only on these pages. Omit → shown on ANNOUNCEMENT_PAGES. */
  pages?: string[];
  /** Card heading. Defaults to "What's new in QuickPost". */
  heading?: string;
}

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: '2026-10-rto-risk',
    tag: 'NEW',
    title: 'RTO Risk on every order',
    body: 'See the return risk on each order before you ship. Catch risky COD orders early and cut return losses.',
    cta: 'View Orders',
    href: '/user/orders',
  },
  {
    id: '2026-10-branded-tracking',
    tag: 'NEW',
    title: 'Your own tracking page',
    body: "Give buyers a tracking page with your logo, colours and offers, not a courier's page.",
    cta: 'Set it up',
    href: '/user/vas/branded-tracking',
  },
  {
    id: '2026-10-order-get-help',
    tag: 'IMPROVED',
    title: 'Get help from any order',
    body: "Tap Get Help on an order and we'll open a ticket with the AWB already filled in.",
    cta: 'Got it',
  },

  // ── Channels page ──
  {
    id: '2026-10-channels-shopify-sync',
    tag: 'NEW',
    heading: 'Channels',
    title: 'Shopify orders, synced automatically',
    body: 'Connect your Shopify store once. New orders flow into QuickPost and tracking updates go back to Shopify.',
    cta: 'Connect Shopify',
    href: '/user/channels?view=shopify',
    pages: ['/user/channels'],
  },
  {
    id: '2026-10-channels-woocommerce',
    tag: 'NEW',
    heading: 'Channels',
    title: 'WooCommerce in two minutes',
    body: 'Add your store URL and API keys, and orders start syncing right away. No plugin needed.',
    cta: 'Connect WooCommerce',
    href: '/user/channels?view=woocommerce',
    pages: ['/user/channels'],
  },
  {
    id: '2026-10-channels-more-coming',
    tag: 'COMING SOON',
    heading: 'Channels',
    title: 'Amazon, Magento and more',
    body: "More marketplaces and store platforms are on the way. We'll let you know here as soon as they're live.",
    cta: 'Got it',
    pages: ['/user/channels'],
  },
];

/** Pages where the card may appear — never over forms, KYC, shipping or payments. */
export const ANNOUNCEMENT_PAGES = ['/user/home', '/user/dashboard', '/user/orders'];

export const ANNOUNCEMENT_DELAY_MS = 2500;

/** true → the card returns on every login (✕ only hides it for the current session).
    Set to false to remember dismissals per seller, so each item is shown only once. */
export const ANNOUNCEMENT_EVERY_LOGIN = true;
