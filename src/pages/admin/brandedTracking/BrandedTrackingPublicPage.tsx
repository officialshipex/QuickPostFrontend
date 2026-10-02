import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { TableLoader } from '../../../components/ui/TableLoader';
import { BrandedTrackingView } from './components/BrandedTrackingView';
import type { SearchState } from './components/TrackingHero';
import { brandedTrackingService, fetchShipmentTracking, type TrackingSearchMode } from './trackingService';
import type { BrandedTrackingData, TrackingPageConfig } from './types';

/**
 * Customer-facing branded tracking page: /track/:storeSlug
 * Falls back to the standard QuickPost /track page when the seller has no
 * published branded page. Supports deep links: ?awb=XXXX or ?order=XXXX.
 */
export function BrandedTrackingPublicPage() {
  const { storeSlug = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const [config, setConfig] = useState<TrackingPageConfig | null>(null);
  const [notFound, setNotFound] = useState(false);

  const initialMode: TrackingSearchMode = params.get('order') ? 'order' : 'awb';
  const [mode, setMode] = useState<TrackingSearchMode>(initialMode);
  const [query, setQuery] = useState(params.get('order') || params.get('awb') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<BrandedTrackingData | null>(null);
  const autoSearched = useRef(false);

  useEffect(() => {
    let cancelled = false;
    brandedTrackingService.getPublishedBySlug(storeSlug.toLowerCase()).then((c) => {
      if (cancelled) return;
      if (c && c.enabled) setConfig(c);
      else setNotFound(true);
    });
    return () => { cancelled = true; };
  }, [storeSlug]);

  // Page title + favicon, restored on leave.
  useEffect(() => {
    if (!config) return;
    const prevTitle = document.title;
    document.title = `Track Your Order | ${config.store.name}`;
    let link: HTMLLinkElement | null = null;
    let prevHref: string | null = null;
    if (config.branding.favicon) {
      link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      prevHref = link.getAttribute('href');
      link.href = config.branding.favicon;
    }
    return () => {
      document.title = prevTitle;
      if (link && prevHref) link.href = prevHref;
    };
  }, [config]);

  const runSearch = useCallback(async (value: string, searchMode: TrackingSearchMode) => {
    if (!value.trim()) {
      setError(`Please enter a valid ${searchMode === 'awb' ? 'AWB number' : 'order ID'}.`);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await fetchShipmentTracking(value, searchMode);
      setData(result);
      setParams({ [searchMode]: value.trim() }, { replace: true });
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : 'Unable to fetch tracking details.');
    } finally {
      setLoading(false);
    }
  }, [setParams]);

  useEffect(() => {
    if (!config || autoSearched.current || !query) return;
    autoSearched.current = true;
    runSearch(query, mode);
  }, [config, query, mode, runSearch]);

  if (notFound) return <Navigate to={`/track${params.toString() ? `?${params}` : ''}`} replace />;

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="relative w-20 h-20"><TableLoader /></div>
      </div>
    );
  }

  const search: SearchState = {
    mode, query, loading, error,
    onModeChange: (m) => { setMode(m); setError(''); },
    onQueryChange: (v) => { setQuery(v); setError(''); },
    onSubmit: () => runSearch(query, mode),
  };

  return (
    <div className="min-h-screen flex flex-col [&>div]:flex-1">
      <BrandedTrackingView config={config} data={data} search={search} />
    </div>
  );
}
