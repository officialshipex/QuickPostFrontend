import { ArrowRight, Loader2, Search } from 'lucide-react';
import type { HeroHeight, TrackingPageConfig } from '../types';
import type { TrackingSearchMode } from '../trackingService';
import { buttonStyle, justifyFor, safeUrl, type ThemeTokens } from '../theme';

export interface SearchState {
  mode: TrackingSearchMode;
  query: string;
  loading: boolean;
  error: string;
  onModeChange: (mode: TrackingSearchMode) => void;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
}

export function TrackingSearch({ search, t, onImage = false }: { search: SearchState; t: ThemeTokens; onImage?: boolean }) {
  const labelColor = onImage ? 'rgba(255,255,255,0.85)' : t.muted;
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); search.onSubmit(); }}
      className="w-full max-w-[580px]"
    >
      <div className="flex items-center gap-4 mb-2.5 text-[12.5px] font-semibold" role="radiogroup" aria-label="Search by">
        {(['awb', 'order'] as const).map((m) => {
          const active = search.mode === m;
          return (
            <label key={m} className="inline-flex items-center gap-1.5 cursor-pointer select-none" style={{ color: active ? (onImage ? '#FFFFFF' : t.text) : labelColor }}>
              <input type="radio" className="sr-only" checked={active} onChange={() => search.onModeChange(m)} />
              <span className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: active ? t.primary : labelColor }}>
                {active && <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.primary }} />}
              </span>
              {m === 'awb' ? 'AWB / Tracking No.' : 'Order ID'}
            </label>
          );
        })}
      </div>
      <div
        className="flex items-center gap-2 p-1.5"
        style={{ background: t.surface, boxShadow: t.shadowRaised, borderRadius: t.radius + 4 }}
      >
        <Search className="w-[18px] h-[18px] ml-2.5 shrink-0" style={{ color: t.muted }} />
        <input
          value={search.query}
          onChange={(e) => search.onQueryChange(e.target.value)}
          placeholder={search.mode === 'awb' ? 'Enter AWB number' : 'Enter order ID'}
          className="flex-1 min-w-0 h-11 bg-transparent outline-none text-[15px] font-medium placeholder:font-normal"
          style={{ color: t.text }}
          aria-label={search.mode === 'awb' ? 'AWB number' : 'Order ID'}
        />
        <button
          type="submit"
          disabled={search.loading}
          className="h-11 px-5 @md:px-7 text-[14px] font-bold inline-flex items-center justify-center gap-2 shrink-0 transition-opacity hover:opacity-90 disabled:opacity-70"
          style={{ ...buttonStyle(t), borderRadius: t.buttonStyle === 'pill' ? 999 : t.radius }}
        >
          {search.loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Track
        </button>
      </div>
      {search.error && (
        <p className="mt-2 text-[12.5px] font-medium" style={{ color: onImage ? '#FECACA' : '#DC2626' }} role="alert">{search.error}</p>
      )}
    </form>
  );
}

const HEIGHT_PADDING: Record<HeroHeight, string> = {
  compact: 'py-8 @2xl:py-10',
  standard: 'py-12 @2xl:py-16',
  large: 'py-16 @2xl:py-28',
};

export function TrackingHero({ config, t, search }: { config: TrackingPageConfig; t: ThemeTokens; search: SearchState }) {
  const hero = config.hero;
  const hasImage = !!hero.bannerImage;
  const align = hero.alignment;
  const headingColor = hasImage ? '#FFFFFF' : t.text;

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: hasImage
          ? `url(${hero.bannerImage}) center / cover no-repeat`
          : `radial-gradient(1200px 400px at 50% -10%, color-mix(in srgb, ${t.primary} 16%, transparent), transparent 70%), ${t.bg}`,
      }}
    >
      {hasImage && <div className="absolute inset-0" style={{ background: `rgba(2, 6, 23, ${hero.overlayOpacity / 100})` }} />}
      <div className={`relative max-w-[1180px] mx-auto px-4 @2xl:px-8 ${HEIGHT_PADDING[hero.height]}`}>
        <div className="flex flex-col gap-4" style={{ alignItems: justifyFor(align), textAlign: align }}>
          <h1 className="text-[26px] @2xl:text-[40px] font-extrabold leading-[1.15] tracking-tight max-w-[760px]" style={{ color: headingColor }}>
            {hero.title || 'Track Your Order'}
          </h1>
          {hero.description && (
            <p className="text-[14px] @2xl:text-[16px] leading-relaxed max-w-[600px]" style={{ color: hasImage ? 'rgba(255,255,255,0.85)' : t.muted }}>
              {hero.description}
            </p>
          )}
          {hero.showSearch && (
            <div className="w-full flex mt-2" style={{ justifyContent: justifyFor(align) }}>
              <TrackingSearch search={search} t={t} onImage={hasImage} />
            </div>
          )}
          {hero.showCta && hero.ctaText && (
            <a
              href={safeUrl(hero.ctaUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold hover:underline underline-offset-4"
              style={{ color: hasImage ? '#FFFFFF' : t.primary }}
            >
              {hero.ctaText} <ArrowRight className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
