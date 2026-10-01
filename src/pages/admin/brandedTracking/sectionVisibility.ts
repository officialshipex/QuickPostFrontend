import type { TrackingPageConfig, TrackingSection } from './types';

/** Whether a section is shown. Core sections derive visibility from their own config. */
export function isSectionVisible(config: TrackingPageConfig, section: TrackingSection): boolean {
  switch (section.type) {
    case 'hero':
      return config.hero.enabled;
    case 'shipmentDetails':
      return config.tracking.showShipmentDetails || config.tracking.showPackageDetails;
    default:
      return section.enabled;
  }
}
