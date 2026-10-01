/* ─────────────────────────────────────────────────────────────────────────
   Branded Tracking Page — configuration model.
   One config document per seller. The builder edits it, the customer-facing
   renderer (BrandedTrackingView) reads it. Shipment data is never part of
   the config — it always comes from the QuickPost tracking API at runtime.
   ───────────────────────────────────────────────────────────────────────── */

export type Alignment = 'left' | 'center' | 'right';
export type PublishStatus = 'draft' | 'published';

export type FontFamily =
  | 'Roboto'
  | 'Inter'
  | 'Poppins'
  | 'Montserrat'
  | 'Lato'
  | 'Open Sans'
  | 'DM Sans'
  | 'Nunito';

export type BorderRadius = 'sharp' | 'soft' | 'rounded' | 'extra';
export type ButtonStyle = 'solid' | 'outline' | 'pill';

export interface BrandingConfig {
  logo?: string;
  favicon?: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  fontFamily: FontFamily;
  borderRadius: BorderRadius;
  buttonStyle: ButtonStyle;
  theme: 'light' | 'dark';
}

/** Store identity + contact channels, shared by header, content blocks and footer. */
export interface StoreConfig {
  name: string;
  slug: string;
  websiteUrl: string;
  supportEmail: string;
  supportPhone: string;
  whatsappNumber: string;
  address: string;
  supportHours: string;
  social: {
    instagram: string;
    facebook: string;
    x: string;
    youtube: string;
    linkedin: string;
  };
}

export interface HeaderConfig {
  enabled: boolean;
  showLogo: boolean;
  logoSize: number;
  alignment: Alignment;
  showAnnouncement: boolean;
  announcement: string;
  announcementBgColor: string;
  announcementTextColor: string;
  showStoreButton: boolean;
  storeButtonText: string;
  showContactButton: boolean;
  showSocialIcons: boolean;
  sticky: boolean;
  backgroundColor: string;
}

export type HeroHeight = 'compact' | 'standard' | 'large';

export interface HeroConfig {
  enabled: boolean;
  title: string;
  description: string;
  /** AWB / Order ID search box. When off, customers reach their shipment only via a tracking link (?awb= / ?order=). */
  showSearch: boolean;
  bannerImage?: string;
  overlayOpacity: number;
  showCta: boolean;
  ctaText: string;
  ctaUrl: string;
  alignment: Alignment;
  height: HeroHeight;
}

export interface StatusColors {
  completed: string;
  current: string;
  pending: string;
  exception: string;
}

export interface TrackingAppearanceConfig {
  timelineStyle: 'vertical' | 'horizontal';
  showTimestamps: boolean;
  showLocation: boolean;
  showEstimatedDelivery: boolean;
  showAwb: boolean;
  showCourier: boolean;
  showShipmentDetails: boolean;
  showPackageDetails: boolean;
  showProgressBar: boolean;
  showStatusIcons: boolean;
  showDeliveredAnimation: boolean;
  statusColors: StatusColors;
}

/* ── Orderable page sections ─────────────────────────────────────────── */

/** Core sections are always available; the rest are optional content blocks. */
export type CoreSectionType = 'hero' | 'tracking' | 'shipmentDetails';

export type ContentSectionType =
  | 'imageText'
  | 'promoBanner'
  | 'customText'
  | 'cta'
  | 'video'
  | 'faq'
  | 'storeInfo'
  | 'support'
  | 'whatsapp'
  | 'contactInfo';

export type SectionType = CoreSectionType | ContentSectionType;

export interface ImageTextData {
  image?: string;
  heading: string;
  body: string;
  imagePosition: 'left' | 'right';
  buttonText: string;
  buttonUrl: string;
}

export interface PromoBannerData {
  image?: string;
  eyebrow: string;
  heading: string;
  body: string;
  buttonText: string;
  buttonUrl: string;
  couponCode: string;
}

export interface CustomTextData {
  heading: string;
  body: string;
  alignment: Alignment;
}

export interface CtaData {
  heading: string;
  body: string;
  buttonText: string;
  buttonUrl: string;
}

export interface VideoData {
  heading: string;
  url: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FaqData {
  heading: string;
  items: FaqItem[];
}

export interface HeadingData {
  heading: string;
  body: string;
}

export interface WhatsappData {
  heading: string;
  body: string;
  buttonText: string;
  prefillMessage: string;
  showFloatingButton: boolean;
}

export interface SectionDataMap {
  hero: null;
  tracking: null;
  shipmentDetails: null;
  imageText: ImageTextData;
  promoBanner: PromoBannerData;
  customText: CustomTextData;
  cta: CtaData;
  video: VideoData;
  faq: FaqData;
  storeInfo: HeadingData;
  support: HeadingData;
  whatsapp: WhatsappData;
  contactInfo: HeadingData;
}

export type TrackingSection = {
  [K in SectionType]: {
    id: string;
    type: K;
    /** Ignored for hero / shipmentDetails (driven by their own config) and tracking (always on). */
    enabled: boolean;
    data: SectionDataMap[K];
  };
}[SectionType];

export interface FooterConfig {
  enabled: boolean;
  showLogo: boolean;
  text: string;
  copyright: string;
  showPolicyLinks: boolean;
  privacyUrl: string;
  termsUrl: string;
  refundUrl: string;
  showContactUs: boolean;
  contactUrl: string;
  showSocialLinks: boolean;
  showWhatsapp: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showPoweredByQuickPost: boolean;
  backgroundColor: string;
  textColor: string;
}

export interface TrackingPageConfig {
  version: 1;
  enabled: boolean;
  status: PublishStatus;
  publishedAt?: string;
  updatedAt?: string;
  store: StoreConfig;
  branding: BrandingConfig;
  header: HeaderConfig;
  hero: HeroConfig;
  tracking: TrackingAppearanceConfig;
  sections: TrackingSection[];
  footer: FooterConfig;
}

/* ── Normalised tracking data the renderer consumes ──────────────────── */

export type MilestoneKey = 'booked' | 'pickedUp' | 'inTransit' | 'outForDelivery' | 'delivered';

export interface TrackingEvent {
  status: string;
  description: string;
  location: string;
  date: string;
  time: string;
  /** Raw ISO timestamp from the courier scan, when available. */
  timestamp?: string;
}

export interface TrackingPackageItem {
  name: string;
  quantity: number;
}

export interface BrandedTrackingData {
  awb: string;
  orderId: string;
  status: string;
  /** Index into MILESTONES of the furthest milestone reached. */
  milestoneIndex: number;
  /** RTO / cancelled / undelivered etc. — shown as an exception banner. */
  isException: boolean;
  courierName: string;
  courierLogo?: string;
  origin: string;
  destination: string;
  estimatedDelivery?: string;
  deliveredOn?: string;
  /** Raw ISO dates behind the two labels above — used for the large date display. */
  estimatedDeliveryISO?: string;
  deliveredOnISO?: string;
  paymentMode: 'Prepaid' | 'COD';
  codAmount?: number;
  weight?: string;
  dimensions?: string;
  items: TrackingPackageItem[];
  /** Newest first. */
  events: TrackingEvent[];
  /** Latest event per milestone, used by the milestone timeline. */
  milestoneEvents: Partial<Record<MilestoneKey, TrackingEvent>>;
}
