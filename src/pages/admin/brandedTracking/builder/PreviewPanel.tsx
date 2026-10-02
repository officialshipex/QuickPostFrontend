import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Lock, Maximize2, Monitor, RotateCw, Smartphone } from 'lucide-react';
import { BrandedTrackingView } from '../components/BrandedTrackingView';
import type { SearchState } from '../components/TrackingHero';
import { getPreviewShipment, PREVIEW_SCENARIOS, type PreviewScenario } from '../previewData';
import type { TrackingSearchMode } from '../trackingService';
import type { TrackingPageConfig } from '../types';

export type PreviewDevice = 'desktop' | 'mobile';

const DESKTOP_WIDTH = 1280;
const MOBILE_WIDTH = 390;
const MOBILE_HEIGHT = 780;

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Interactive search state for the preview. Never calls the API — preview always shows sample data. */
function usePreviewSearch(): SearchState {
  const [mode, setMode] = useState<TrackingSearchMode>('awb');
  const [query, setQuery] = useState('QP1047825963');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return {
    mode, query, loading, error,
    onModeChange: (m) => { setMode(m); setError(''); },
    onQueryChange: (v) => { setQuery(v); setError(''); },
    onSubmit: () => {
      if (!query.trim()) return setError(`Please enter a valid ${mode === 'awb' ? 'AWB number' : 'order ID'}.`);
      setLoading(true);
      timer.current = setTimeout(() => setLoading(false), 650);
    },
  };
}

/** Browser / phone chrome around the rendered page, scaled to fit the available width. */
export function PreviewFrame({ config, device, scenario, height }: { config: TrackingPageConfig; device: PreviewDevice; scenario: PreviewScenario; height: number | string }) {
  const [wrapRef, available] = useElementWidth<HTMLDivElement>();
  const search = usePreviewSearch();
  const data = getPreviewShipment(scenario);
  const host = `${window.location.host}/track/${config.store.slug || 'your-store'}`;

  const page = <BrandedTrackingView config={config} data={data} search={search} isPreview />;

  if (device === 'mobile') {
    const frameWidth = MOBILE_WIDTH + 24;
    const heightFit = typeof height === 'number' ? (height + 40) / (MOBILE_HEIGHT + 24) : 1;
    const zoom = available ? Math.min(1, available / frameWidth, heightFit) : 1;
    return (
      <div ref={wrapRef} className="w-full flex justify-center">
        <div style={{ zoom }} className="shrink-0">
          <div className="rounded-[44px] bg-[#0F172A] p-3 shadow-[0_20px_50px_rgba(15,23,42,0.25)]" style={{ width: frameWidth }}>
            <div className="relative rounded-[34px] overflow-hidden bg-white" style={{ height: MOBILE_HEIGHT }}>
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[110px] h-[30px] rounded-full bg-[#0F172A] z-40 pointer-events-none" />
              <div className="h-full overflow-y-auto overflow-x-hidden pt-[44px] [scrollbar-width:none]" style={{ background: config.header.enabled ? config.header.backgroundColor : config.branding.backgroundColor }}>
                <div className="min-h-full" style={{ width: MOBILE_WIDTH }}>{page}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const zoom = available ? Math.min(1, available / DESKTOP_WIDTH) : 0.5;
  return (
    <div ref={wrapRef} className="w-full rounded-xl overflow-hidden border border-[#E2E8F0] shadow-[0_10px_30px_rgba(15,23,42,0.08)] bg-white">
      {/* Browser chrome */}
      <div className="h-10 px-3 flex items-center gap-3 bg-[#F1F5F9] border-b border-[#E2E8F0]">
        <div className="flex gap-1.5 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F87171]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FBBF24]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#34D399]" />
        </div>
        <div className="hidden sm:flex items-center gap-1.5 h-7 px-2.5 rounded-t-md bg-white text-[11px] font-medium text-[#334155] max-w-[180px] -mb-3 self-end pb-2.5">
          {config.branding.favicon ? <img src={config.branding.favicon} alt="" className="w-3.5 h-3.5 object-contain shrink-0" /> : <span className="w-3.5 h-3.5 rounded-sm shrink-0" style={{ background: config.branding.primaryColor }} />}
          <span className="truncate">Track Order · {config.store.name || 'Store'}</span>
        </div>
        <div className="flex-1 min-w-0 h-7 px-3 rounded-md bg-white border border-[#E2E8F0] flex items-center gap-1.5 text-[11px] text-[#64748B]">
          <Lock className="w-3 h-3 shrink-0 text-[#16A34A]" />
          <span className="truncate">{host}</span>
        </div>
      </div>
      <div className="overflow-y-auto overflow-x-hidden" style={{ height, background: config.branding.backgroundColor }}>
        <div style={{ width: DESKTOP_WIDTH, zoom }}>{page}</div>
      </div>
    </div>
  );
}

export function PreviewToolbar({ device, onDevice, scenario, onScenario, onReplay, onExpand }: {
  device: PreviewDevice; onDevice: (d: PreviewDevice) => void;
  scenario: PreviewScenario; onScenario: (s: PreviewScenario) => void;
  onReplay?: () => void; onExpand?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex p-1 rounded-lg bg-[#F1F5F9] gap-1" role="tablist" aria-label="Preview device">
        {([['desktop', Monitor, 'Desktop'], ['mobile', Smartphone, 'Mobile']] as const).map(([d, Icon, label]) => (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={device === d}
            onClick={() => onDevice(d)}
            className={`h-8 px-3 rounded-md text-[12px] font-semibold flex items-center gap-1.5 transition-all ${device === d ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>
      <label className="relative">
        <span className="sr-only">Sample shipment status</span>
        <select
          value={scenario}
          onChange={(e) => onScenario(e.target.value as PreviewScenario)}
          className="h-10 pl-3 pr-8 rounded-lg border border-[#E2E8F0] bg-white text-[12px] font-semibold text-[#334155] outline-none focus:border-[#00A86B] appearance-none cursor-pointer"
        >
          {PREVIEW_SCENARIOS.map((s) => <option key={s.id} value={s.id}>Sample: {s.label}</option>)}
        </select>
        <svg className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
      </label>
      {onReplay && (
        <button type="button" onClick={onReplay} title="Reload preview" aria-label="Reload preview" className="w-10 h-10 rounded-lg border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] flex items-center justify-center transition-colors">
          <RotateCw className="w-4 h-4" />
        </button>
      )}
      {onExpand && (
        <button type="button" onClick={onExpand} title="Full-screen preview" aria-label="Full-screen preview" className="w-10 h-10 rounded-lg border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] flex items-center justify-center transition-colors">
          <Maximize2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
