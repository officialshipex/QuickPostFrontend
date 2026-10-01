import type { StoreConfig } from '../types';
import { mailUrl, telUrl } from '../theme';
import { FacebookIcon, InstagramIcon, LinkedinIcon, XIcon, YoutubeIcon } from './BrandIcons';

export function socialLinks(store: StoreConfig) {
  const s = store.social;
  return [
    { key: 'instagram', label: 'Instagram', url: s.instagram, Icon: InstagramIcon },
    { key: 'facebook', label: 'Facebook', url: s.facebook, Icon: FacebookIcon },
    { key: 'x', label: 'X', url: s.x, Icon: XIcon },
    { key: 'youtube', label: 'YouTube', url: s.youtube, Icon: YoutubeIcon },
    { key: 'linkedin', label: 'LinkedIn', url: s.linkedin, Icon: LinkedinIcon },
  ].filter((l) => l.url.trim());
}

export function contactHref(store: StoreConfig) {
  return mailUrl(store.supportEmail) || telUrl(store.supportPhone);
}
