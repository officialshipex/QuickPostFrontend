import { useEffect, useMemo } from 'react';
import { Loader2, PackageSearch } from 'lucide-react';
import type { BrandedTrackingData, TrackingPageConfig, TrackingSection } from '../types';
import { isSectionVisible } from '../sectionVisibility';
import { buildTheme, cardStyle, ensureFontLoaded, whatsappUrl } from '../theme';
import { contactHref } from './links';
import { TrackingHeader } from './TrackingHeader';
import { TrackingHero, TrackingSearch, type SearchState } from './TrackingHero';
import { TrackingTimeline } from './TrackingTimeline';
import { ShipmentDetails } from './ShipmentDetails';
import { ContentBlock } from './TrackingContent';
import { TrackingFooter } from './TrackingFooter';
import { WhatsappIcon } from './BrandIcons';


interface BrandedTrackingViewProps {
  config: TrackingPageConfig;
  data: BrandedTrackingData | null;
  search: SearchState;
  /** Builder preview: shows setup hints for empty fields. */
  isPreview?: boolean;
}

/**
 * The customer-facing branded tracking page. Pure renderer — used by both the
 * builder's live preview (sample data) and the public route (live API data).
 * Uses container queries so the same markup adapts inside the preview frame.
 */
export function BrandedTrackingView({ config, data, search, isPreview = false }: BrandedTrackingViewProps) {
  const t = useMemo(() => buildTheme(config), [config]);

  useEffect(() => {
    ensureFontLoaded(config.branding.fontFamily);
  }, [config.branding.fontFamily]);

  const floatingWa = config.sections.find((s) => s.type === 'whatsapp' && s.enabled && s.data.showFloatingButton);
  const floatingWaHref = floatingWa?.type === 'whatsapp' ? whatsappUrl(config.store.whatsappNumber, floatingWa.data.prefillMessage) : undefined;

  const renderSection = (section: TrackingSection) => {
    if (section.type === 'hero') return <TrackingHero key={section.id} config={config} t={t} search={search} />;

    let body: React.ReactNode;
    if (section.type === 'tracking') {
      body = (
        <div className="space-y-5">
          {!config.hero.enabled && config.hero.showSearch && (
            <div className="p-5 @2xl:p-7" style={cardStyle(t)}>
              <h1 className="text-[20px] @2xl:text-[24px] font-extrabold tracking-tight mb-4" style={{ color: t.text }}>{config.hero.title || 'Track Your Order'}</h1>
              <TrackingSearch search={search} t={t} />
            </div>
          )}
          {data ? (
            <TrackingTimeline
              data={data}
              cfg={config.tracking}
              t={t}
              helpHref={whatsappUrl(config.store.whatsappNumber, `Hi, I need help with my shipment ${data.awb}.`) || contactHref(config.store)}
            />
          ) : config.hero.showSearch ? (
            config.hero.enabled && (
              <div className="p-10 flex flex-col items-center text-center gap-2" style={cardStyle(t)}>
                <PackageSearch className="w-9 h-9" style={{ color: t.primary }} strokeWidth={1.6} />
                <p className="text-[15px] font-bold" style={{ color: t.text }}>Your shipment updates will appear here</p>
                <p className="text-[13px]" style={{ color: t.muted }}>Enter your AWB number or order ID above to see the latest status.</p>
              </div>
            )
          ) : (
            // No search box: customers arrive through the tracking link in their order SMS / email.
            <div className="p-10 flex flex-col items-center text-center gap-2" style={cardStyle(t)}>
              {search.loading ? (
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: t.primary }} />
              ) : (
                <PackageSearch className="w-9 h-9" style={{ color: search.error ? '#DC2626' : t.primary }} strokeWidth={1.6} />
              )}
              <p className="text-[15px] font-bold" style={{ color: t.text }}>
                {search.loading ? 'Fetching your shipment…' : search.error ? 'We couldn’t load this shipment' : 'Track your order from your tracking link'}
              </p>
              <p className="text-[13px] max-w-[440px]" style={{ color: t.muted }}>
                {search.loading ? 'This will only take a moment.' : search.error || 'Open the tracking link shared in your order SMS or email to see live delivery updates.'}
              </p>
            </div>
          )}
        </div>
      );
    } else if (section.type === 'shipmentDetails') {
      body = data ? <ShipmentDetails data={data} cfg={config.tracking} t={t} /> : null;
    } else {
      body = <ContentBlock section={section} config={config} t={t} isPreview={isPreview} />;
    }

    if (!body) return null;
    return (
      <div key={section.id} className="max-w-[1180px] w-full mx-auto px-4 @2xl:px-8 mt-6 @2xl:mt-8">
        {body}
      </div>
    );
  };

  return (
    <div
      className="@container relative min-h-full flex flex-col"
      style={{ background: t.bg, color: t.text, fontFamily: t.font, colorScheme: t.isDark ? 'dark' : 'light' }}
    >
      {config.header.enabled && <TrackingHeader config={config} t={t} />}
      <main className="flex-1 pb-12 @2xl:pb-16">
        {config.sections.filter((s) => isSectionVisible(config, s)).map(renderSection)}
      </main>
      {config.footer.enabled && <TrackingFooter config={config} t={t} />}

      {floatingWaHref && (
        <div className="sticky bottom-0 h-0 z-30 pointer-events-none">
          <a
            href={floatingWaHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp"
            className="pointer-events-auto absolute right-4 bottom-4 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_8px_24px_rgba(37,211,102,0.45)] transition-transform hover:scale-105"
            style={{ background: '#25D366' }}
          >
            <WhatsappIcon className="w-7 h-7" />
          </a>
        </div>
      )}
    </div>
  );
}
