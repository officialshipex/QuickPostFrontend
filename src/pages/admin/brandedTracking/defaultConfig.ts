import type {
  BorderRadius,
  ContentSectionType,
  FontFamily,
  SectionDataMap,
  TrackingPageConfig,
  TrackingSection,
} from './types';

export const FONT_OPTIONS: FontFamily[] = ['Roboto', 'Inter', 'Poppins', 'Montserrat', 'Lato', 'Open Sans', 'DM Sans', 'Nunito'];

/** QuickPost branding a new page starts with, until the seller uploads their own. */
export const DEFAULT_STORE_NAME = 'QuickPost';
export const DEFAULT_LOGO = '/branded-tracking/quickpost-logo.png';
export const DEFAULT_LOGO_ON_DARK = '/branded-tracking/quickpost-logo-white.png';
export const DEFAULT_FAVICON = '/icon-color.png';

export const RADIUS_PX: Record<BorderRadius, number> = {
  sharp: 0,
  soft: 6,
  rounded: 12,
  extra: 20,
};

/** Palettes applied when the seller flips the theme; individual colours stay editable afterwards. */
export const THEME_PRESETS = {
  light: { backgroundColor: '#F1F3F6', textColor: '#0F172A', headerBg: '#FFFFFF', footerBg: '#0F172A', footerText: '#CBD5E1' },
  dark: { backgroundColor: '#0B1120', textColor: '#E2E8F0', headerBg: '#111827', footerBg: '#020617', footerText: '#94A3B8' },
} as const;

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

export function newId(prefix = 'sec'): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/* ── Content block defaults ──────────────────────────────────────────── */

export function defaultSectionData<K extends ContentSectionType>(type: K): SectionDataMap[K] {
  const data: { [T in ContentSectionType]: SectionDataMap[T] } = {
    imageText: {
      heading: 'Made with care, packed with love',
      body: 'Every order is quality-checked and packed by our team before it leaves the warehouse. We hope it brings a smile when it reaches you.',
      imagePosition: 'left',
      buttonText: 'Our Story',
      buttonUrl: '',
    },
    promoBanner: {
      eyebrow: 'Exclusive for you',
      heading: 'Love your purchase?',
      body: 'Explore more products from our store and get 10% off on your next order.',
      buttonText: 'Shop Now',
      buttonUrl: '',
      couponCode: 'TRACK10',
    },
    customText: {
      heading: 'A note from our team',
      body: 'Thank you for shopping with us. If anything about your order is not right, reach out and we will make it right.',
      alignment: 'center',
    },
    cta: {
      heading: 'Need to make a change?',
      body: 'Update your delivery preferences or raise a request with our support team.',
      buttonText: 'Contact Support',
      buttonUrl: '',
    },
    video: {
      heading: 'How to care for your product',
      url: '',
    },
    faq: {
      heading: 'Frequently Asked Questions',
      items: [
        { id: newId('faq'), question: 'When will my order be delivered?', answer: 'The estimated delivery date is shown above. Most orders reach within 3–5 business days of dispatch, depending on your location.' },
        { id: newId('faq'), question: 'My tracking has not updated in a while. What should I do?', answer: 'Couriers update tracking at scan points, so there can be gaps of up to 24–48 hours while the package is between hubs. If there is no update for more than 3 days, please contact us.' },
        { id: newId('faq'), question: 'Can I change my delivery address?', answer: 'Address changes are possible only before the order is out for delivery. Contact our support team with your order ID as early as possible.' },
        { id: newId('faq'), question: 'What if I miss the delivery?', answer: 'The courier will make up to 3 delivery attempts. You will receive a call or SMS before each attempt.' },
      ],
    },
    storeInfo: {
      heading: 'About the store',
      body: 'We are a homegrown brand shipping across India.',
    },
    support: {
      heading: 'Need help with your order?',
      body: 'Our support team is available to help with delivery, returns and order changes.',
    },
    whatsapp: {
      heading: 'Chat with us on WhatsApp',
      body: 'Get instant help with your order from our team.',
      buttonText: 'Chat on WhatsApp',
      prefillMessage: 'Hi, I need help with my order.',
      showFloatingButton: false,
    },
    contactInfo: {
      heading: 'Contact Information',
      body: 'Reach us through any of the channels below.',
    },
  };
  // Clone so FAQ arrays etc. are never shared between sections.
  return structuredClone(data[type]) as SectionDataMap[K];
}

export function createContentSection(type: ContentSectionType): TrackingSection {
  return { id: newId(), type, enabled: true, data: defaultSectionData(type) } as TrackingSection;
}

/* ── Full default config ─────────────────────────────────────────────── */

export function createDefaultConfig(storeName = ''): TrackingPageConfig {
  const name = storeName.trim() || DEFAULT_STORE_NAME;
  return {
    version: 1,
    enabled: true,
    status: 'draft',
    store: {
      name,
      slug: slugify(name) || 'quickpost',
      websiteUrl: '',
      supportEmail: '',
      supportPhone: '',
      whatsappNumber: '',
      address: '',
      supportHours: 'Mon – Sat, 10:00 AM – 7:00 PM',
      social: { instagram: '', facebook: '', x: '', youtube: '', linkedin: '' },
    },
    branding: {
      logo: DEFAULT_LOGO,
      favicon: DEFAULT_FAVICON,
      primaryColor: '#00A86B',
      secondaryColor: '#0F172A',
      backgroundColor: THEME_PRESETS.light.backgroundColor,
      textColor: THEME_PRESETS.light.textColor,
      buttonColor: '#00A86B',
      fontFamily: 'Roboto',
      borderRadius: 'rounded',
      buttonStyle: 'solid',
      theme: 'light',
    },
    header: {
      enabled: true,
      showLogo: true,
      logoSize: 36,
      alignment: 'left',
      showAnnouncement: true,
      announcement: 'Free shipping on all prepaid orders above ₹499',
      announcementBgColor: '#0F172A',
      announcementTextColor: '#FFFFFF',
      showStoreButton: true,
      storeButtonText: 'Visit Store',
      showContactButton: true,
      showSocialIcons: false,
      sticky: true,
      backgroundColor: THEME_PRESETS.light.headerBg,
    },
    hero: {
      enabled: true,
      title: 'Track Your Order',
      description: 'Enter your AWB or order ID to see the latest delivery updates.',
      showSearch: true,
      overlayOpacity: 45,
      showCta: false,
      ctaText: 'Continue Shopping',
      ctaUrl: '',
      alignment: 'center',
      height: 'standard',
    },
    tracking: {
      timelineStyle: 'vertical',
      showTimestamps: true,
      showLocation: true,
      showEstimatedDelivery: true,
      showAwb: true,
      showCourier: true,
      showShipmentDetails: true,
      showPackageDetails: true,
      showProgressBar: true,
      showStatusIcons: true,
      showDeliveredAnimation: true,
      statusColors: {
        completed: '#00A86B',
        current: '#2563EB',
        pending: '#CBD5E1',
        exception: '#D97706',
      },
    },
    sections: [
      { id: 'core_hero', type: 'hero', enabled: true, data: null },
      { id: 'core_tracking', type: 'tracking', enabled: true, data: null },
      { id: 'core_shipment', type: 'shipmentDetails', enabled: true, data: null },
      createContentSection('promoBanner'),
      createContentSection('faq'),
      createContentSection('support'),
      { ...createContentSection('whatsapp'), enabled: false },
      { ...createContentSection('imageText'), enabled: false },
    ],
    footer: {
      enabled: true,
      showLogo: true,
      text: 'Thank you for shopping with us. We hope you love your order.',
      copyright: `© ${new Date().getFullYear()} ${name}. All rights reserved.`,
      showPolicyLinks: true,
      privacyUrl: '',
      termsUrl: '',
      refundUrl: '',
      showContactUs: true,
      contactUrl: '',
      showSocialLinks: true,
      showWhatsapp: true,
      showEmail: true,
      showPhone: true,
      showPoweredByQuickPost: true,
      backgroundColor: THEME_PRESETS.light.footerBg,
      textColor: THEME_PRESETS.light.footerText,
    },
  };
}
