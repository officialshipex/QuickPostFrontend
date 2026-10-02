import { apiClient } from '../../../services/apiClient';
import { getCourierLogo } from '../../../utils/courierLogo';
import { createDefaultConfig } from './defaultConfig';
import type { BrandedTrackingData, MilestoneKey, TrackingEvent, TrackingPageConfig } from './types';

/* ═════════════════════════════════════════════════════════════════════════
   1. CONFIG PERSISTENCE
   The builder only talks to `brandedTrackingService`. Two adapters implement
   the same contract:
     • apiRepository   — backend endpoints (enable with VITE_BRANDED_TRACKING_API=true)
     • localRepository — browser storage, used until the backend ships
   Draft and published configs are stored separately: "Save" writes the draft,
   "Publish" snapshots the draft so customers never see half-finished edits.
   ═════════════════════════════════════════════════════════════════════════ */

export interface BrandedTrackingState {
  draft: TrackingPageConfig;
  published: TrackingPageConfig | null;
}

export interface BrandedTrackingRepository {
  load(ownerId: string, storeName: string): Promise<BrandedTrackingState>;
  saveDraft(ownerId: string, config: TrackingPageConfig): Promise<TrackingPageConfig>;
  publish(ownerId: string, config: TrackingPageConfig): Promise<BrandedTrackingState>;
  unpublish(ownerId: string): Promise<BrandedTrackingState>;
  isSlugAvailable(ownerId: string, slug: string): Promise<boolean>;
  getPublishedBySlug(slug: string): Promise<TrackingPageConfig | null>;
  uploadAsset(file: File): Promise<string>;
}

/** Fill any keys missing from a stored config (older versions) from the defaults. */
function withDefaults(stored: Partial<TrackingPageConfig>, storeName: string): TrackingPageConfig {
  const base = createDefaultConfig(storeName);
  return {
    ...base,
    ...stored,
    store: { ...base.store, ...stored.store, social: { ...base.store.social, ...stored.store?.social } },
    branding: { ...base.branding, ...stored.branding },
    header: { ...base.header, ...stored.header },
    hero: { ...base.hero, ...stored.hero },
    tracking: {
      ...base.tracking,
      ...stored.tracking,
      statusColors: { ...base.tracking.statusColors, ...stored.tracking?.statusColors },
    },
    footer: { ...base.footer, ...stored.footer },
    sections: stored.sections?.length ? stored.sections : base.sections,
    version: 1,
  };
}

/* ── Backend adapter ─────────────────────────────────────────────────── */

const apiRepository: BrandedTrackingRepository = {
  async load(_ownerId, storeName) {
    const { data } = await apiClient.get('/branded-tracking');
    return {
      draft: data?.draft ? withDefaults(data.draft, storeName) : createDefaultConfig(storeName),
      published: data?.published ? withDefaults(data.published, storeName) : null,
    };
  },
  async saveDraft(_ownerId, config) {
    const { data } = await apiClient.put('/branded-tracking/draft', config);
    return data.draft;
  },
  async publish(_ownerId, config) {
    const { data } = await apiClient.post('/branded-tracking/publish', config);
    return { draft: data.draft, published: data.published };
  },
  async unpublish() {
    const { data } = await apiClient.post('/branded-tracking/unpublish');
    return { draft: data.draft, published: null };
  },
  async isSlugAvailable(_ownerId, slug) {
    const { data } = await apiClient.get(`/branded-tracking/slug-available/${encodeURIComponent(slug)}`);
    return data?.available === true;
  },
  async getPublishedBySlug(slug) {
    try {
      const { data } = await apiClient.get(`/branded-tracking/public/${encodeURIComponent(slug)}`);
      return data?.config ? withDefaults(data.config, data.config.store?.name || '') : null;
    } catch {
      return null;
    }
  },
  async uploadAsset(file) {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post('/branded-tracking/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.url;
  },
};

/* ── Browser-storage adapter ─────────────────────────────────────────── */

const LS_PREFIX = 'qp_branded_tracking';
const draftKey = (ownerId: string) => `${LS_PREFIX}:draft:${ownerId || 'self'}`;
const publishedKey = (ownerId: string) => `${LS_PREFIX}:published:${ownerId || 'self'}`;
const SLUG_INDEX_KEY = `${LS_PREFIX}:slugs`;

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      throw new Error('Uploaded images are too large to save. Please use smaller images (under 500 KB each).', { cause: err });
    }
    throw err;
  }
}

const readSlugIndex = () => readJson<Record<string, string>>(SLUG_INDEX_KEY) || {};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });
}

const localRepository: BrandedTrackingRepository = {
  async load(ownerId, storeName) {
    const draft = readJson<TrackingPageConfig>(draftKey(ownerId));
    const published = readJson<TrackingPageConfig>(publishedKey(ownerId));
    return {
      draft: draft ? withDefaults(draft, storeName) : createDefaultConfig(storeName),
      published: published ? withDefaults(published, storeName) : null,
    };
  },
  async saveDraft(ownerId, config) {
    const saved = { ...config, updatedAt: new Date().toISOString() };
    writeJson(draftKey(ownerId), saved);
    return saved;
  },
  async publish(ownerId, config) {
    const now = new Date().toISOString();
    const published: TrackingPageConfig = { ...config, status: 'published', publishedAt: now, updatedAt: now };
    writeJson(publishedKey(ownerId), published);
    writeJson(draftKey(ownerId), published);
    const index = readSlugIndex();
    Object.keys(index).forEach((s) => { if (index[s] === ownerId) delete index[s]; });
    index[published.store.slug] = ownerId;
    writeJson(SLUG_INDEX_KEY, index);
    return { draft: published, published };
  },
  async unpublish(ownerId) {
    localStorage.removeItem(publishedKey(ownerId));
    const index = readSlugIndex();
    Object.keys(index).forEach((s) => { if (index[s] === ownerId) delete index[s]; });
    writeJson(SLUG_INDEX_KEY, index);
    const draft = readJson<TrackingPageConfig>(draftKey(ownerId));
    const next = { ...(draft || createDefaultConfig()), status: 'draft' as const, publishedAt: undefined };
    writeJson(draftKey(ownerId), next);
    return { draft: next, published: null };
  },
  async isSlugAvailable(ownerId, slug) {
    const owner = readSlugIndex()[slug];
    return !owner || owner === ownerId;
  },
  async getPublishedBySlug(slug) {
    const owner = readSlugIndex()[slug];
    if (!owner) return null;
    const published = readJson<TrackingPageConfig>(publishedKey(owner));
    return published ? withDefaults(published, published.store?.name || '') : null;
  },
  async uploadAsset(file) {
    return readFileAsDataUrl(file);
  },
};

export const brandedTrackingService: BrandedTrackingRepository =
  import.meta.env.VITE_BRANDED_TRACKING_API === 'true' ? apiRepository : localRepository;

/** Public URL customers open. Matches the `/track/:storeSlug` route. */
export const getPublicTrackingUrl = (slug: string) => `${window.location.origin}/track/${slug}`;

/* ═════════════════════════════════════════════════════════════════════════
   2. LIVE TRACKING DATA
   Uses the existing QuickPost tracking endpoints (same ones as /track).
   This module only normalises the response for the branded renderer — it
   does not alter any tracking logic.
   ═════════════════════════════════════════════════════════════════════════ */

export const MILESTONES: { key: MilestoneKey; label: string }[] = [
  { key: 'booked', label: 'Order Confirmed' },
  { key: 'pickedUp', label: 'Picked Up' },
  { key: 'inTransit', label: 'In Transit' },
  { key: 'outForDelivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

const EXCEPTION_STATUSES = ['undelivered', 'rto', 'cancelled', 'lost', 'not picked', 'damaged'];

export function milestoneFromStatus(status: string): { index: number; isException: boolean } {
  const s = status.toLowerCase().trim();
  const isException = EXCEPTION_STATUSES.some((x) => s.includes(x));
  if (s.includes('rto')) return { index: 2, isException };
  if (s.includes('undelivered')) return { index: 3, isException };
  if (s === 'delivered') return { index: 4, isException };
  if (s.includes('out for delivery')) return { index: 3, isException };
  if (s.includes('transit') || s.includes('reached') || s.includes('hub') || s.includes('shipped')) return { index: 2, isException };
  if (s.includes('picked up') || s === 'picked') return { index: 1, isException };
  return { index: 0, isException };
}

function milestoneOfEvent(text: string): MilestoneKey | null {
  const s = text.toLowerCase();
  if (s.includes('out for delivery')) return 'outForDelivery';
  if (/\bdelivered\b/.test(s) && !s.includes('undelivered') && !s.includes('rto')) return 'delivered';
  if (s.includes('picked') || s.includes('pickup done') || s.includes('pickup completed')) return 'pickedUp';
  if (/(transit|hub|dispatch|arriv|reached|connect|bag|forward)/.test(s)) return 'inTransit';
  if (/(manifest|booked|created|ready|confirm)/.test(s)) return 'booked';
  return null;
}

export function buildMilestoneEvents(events: TrackingEvent[]) {
  const result: Partial<Record<MilestoneKey, TrackingEvent>> = {};
  events.forEach((e) => {
    const key = milestoneOfEvent(`${e.status} ${e.description}`);
    if (key && !result[key]) result[key] = e;
  });
  return result;
}

export const formatDateTime = (value?: string): { date: string; time: string } => {
  if (!value) return { date: '', time: '' };
  const d = new Date(value);
  if (isNaN(d.getTime())) return { date: String(value), time: '' };
  return {
    date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase(),
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTrackingResponse(d: any, query: string): BrandedTrackingData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw: any[] = Array.isArray(d?.tracking) ? d.tracking : [];
  const unique = [...new Map(raw.filter((t) => t?.StatusDateTime).map((t) => [t.StatusDateTime, t])).values()].reverse();
  const events: TrackingEvent[] = unique.map((t) => {
    const { date, time } = formatDateTime(t.StatusDateTime);
    return {
      status: t.status || t.Instructions || 'Update',
      description: t.Instructions || t.status || '',
      location: t.StatusLocation || '',
      date,
      time,
      timestamp: t.StatusDateTime,
    };
  });
  const status: string = d?.status || events[0]?.status || 'Booked';
  const { index, isException } = milestoneFromStatus(status);
  const isDelivered = index === 4 && !isException;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const products: any[] = Array.isArray(d?.productDetails) ? d.productDetails : [];
  const dims = d?.packageDetails?.volumetricWeight;
  const weightKg = d?.totalWeight || d?.packageDetails?.applicableWeight || d?.packageDetails?.deadWeight;
  const courierName: string = d?.courierServiceName || d?.courierName || '';

  return {
    awb: d?.awb_number || query,
    orderId: d?.orderId ? String(d.orderId) : '',
    status,
    milestoneIndex: index,
    isException,
    courierName,
    // Only bundled brand logos; unknown couriers get the in-page initial tile.
    courierLogo: courierName && getCourierLogo(courierName).startsWith('/brands/') ? getCourierLogo(courierName) : undefined,
    origin: [d?.pickupAddress?.city, d?.pickupAddress?.state].filter(Boolean).join(', '),
    destination: [d?.receiverAddress?.city, d?.receiverAddress?.state].filter(Boolean).join(', '),
    estimatedDelivery: d?.estimatedDeliveryDate ? formatDateTime(d.estimatedDeliveryDate).date : undefined,
    deliveredOn: isDelivered ? events[0]?.date : undefined,
    estimatedDeliveryISO: d?.estimatedDeliveryDate || undefined,
    deliveredOnISO: isDelivered ? events[0]?.timestamp : undefined,
    paymentMode: d?.paymentDetails?.method === 'COD' ? 'COD' : 'Prepaid',
    codAmount: d?.paymentDetails?.method === 'COD' ? Number(d?.paymentDetails?.amount) || undefined : undefined,
    weight: weightKg ? `${weightKg} kg` : undefined,
    dimensions: dims?.length ? `${dims.length} × ${dims.breadth ?? dims.width} × ${dims.height} cm` : undefined,
    items: products.map((p) => ({ name: p.name || p.productName || 'Item', quantity: Number(p.quantity) || 1 })),
    events,
    milestoneEvents: buildMilestoneEvents(events),
  };
}

export type TrackingSearchMode = 'awb' | 'order';

export class TrackingNotFoundError extends Error {}

export async function fetchShipmentTracking(query: string, mode: TrackingSearchMode): Promise<BrandedTrackingData> {
  const value = query.trim();
  const endpoint = mode === 'order'
    ? `/orders/GetTrackingByOrderId/${encodeURIComponent(value)}`
    : `/orders/GetTrackingByAwb/${encodeURIComponent(value)}`;
  try {
    const res = await apiClient.get(endpoint);
    return mapTrackingResponse(res.data, value);
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404) throw new TrackingNotFoundError('We could not find a shipment with that number. Please check and try again.', { cause: err });
    throw new Error('Unable to fetch tracking details right now. Please try again in a moment.', { cause: err });
  }
}
