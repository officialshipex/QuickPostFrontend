import {
  AlignCenter, AlignLeft, AlignRight, BadgePercent, CircleHelp, Contact, Headset, Image, LayoutTemplate, MousePointerClick, PackageSearch,
  Receipt, Store, Type, Video,
} from 'lucide-react';
import { WhatsappIcon } from '../components/BrandIcons';
import type { ContentSectionType, SectionType } from '../types';

export const SECTION_META: Record<SectionType, { label: string; description: string; icon: React.ElementType }> = {
  hero: { label: 'Hero', description: 'Heading, description and tracking search', icon: LayoutTemplate },
  tracking: { label: 'Tracking', description: 'Live status, timeline and updates', icon: PackageSearch },
  shipmentDetails: { label: 'Shipment Details', description: 'Order, route, payment and package', icon: Receipt },
  imageText: { label: 'Image + Text', description: 'Image beside a heading, text and button', icon: Image },
  promoBanner: { label: 'Promotional Banner', description: 'Offer with coupon code and button', icon: BadgePercent },
  customText: { label: 'Custom Text', description: 'A heading and paragraph', icon: Type },
  cta: { label: 'Call to Action', description: 'Short message with a button', icon: MousePointerClick },
  video: { label: 'Video', description: 'YouTube, Vimeo or MP4 video', icon: Video },
  faq: { label: 'FAQ', description: 'Expandable questions and answers', icon: CircleHelp },
  storeInfo: { label: 'Store Information', description: 'Logo, about text, address and hours', icon: Store },
  support: { label: 'Customer Support', description: 'Call, email and WhatsApp buttons', icon: Headset },
  whatsapp: { label: 'WhatsApp Contact', description: 'WhatsApp chat card and floating button', icon: WhatsappIcon },
  contactInfo: { label: 'Contact Information', description: 'Phone, email, WhatsApp and address', icon: Contact },
};

export const ADDABLE_SECTIONS: ContentSectionType[] = [
  'promoBanner', 'imageText', 'customText', 'cta', 'video', 'faq', 'storeInfo', 'support', 'whatsapp', 'contactInfo',
];

/** Only one instance of these makes sense on a page. */
export const SINGLETON_SECTIONS: SectionType[] = ['hero', 'tracking', 'shipmentDetails', 'whatsapp', 'faq', 'storeInfo', 'contactInfo'];

export const ALIGN_OPTIONS = [
  { value: 'left' as const, label: 'Left', icon: AlignLeft },
  { value: 'center' as const, label: 'Center', icon: AlignCenter },
  { value: 'right' as const, label: 'Right', icon: AlignRight },
];
