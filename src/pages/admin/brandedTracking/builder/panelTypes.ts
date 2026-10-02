import type { TrackingPageConfig, TrackingSection } from '../types';

export type ConfigGroupKey = 'store' | 'branding' | 'header' | 'hero' | 'tracking' | 'footer';

export interface PanelProps {
  config: TrackingPageConfig;
  update: <K extends ConfigGroupKey>(key: K, patch: Partial<TrackingPageConfig[K]>) => void;
  setSections: (updater: (sections: TrackingSection[]) => TrackingSection[]) => void;
  onError: (message: string) => void;
}
