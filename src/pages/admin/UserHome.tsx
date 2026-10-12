import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, IndianRupee, Download, MapPin, Users, Truck, Loader2, X, ChevronRight,
  ChevronLeft, Clock, AlertTriangle, RotateCcw, ShieldAlert, FileCheck2, Megaphone,
  Gift, Wallet, Zap, Store, ArrowRight, Bell, FileSignature, UploadCloud, BellRing,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';
import { getToken } from '../../utils/session';
import { useAdminTab } from '../../context/AdminUserContext';
import { useNotificationList } from '../../context/NotificationListContext';
import { getNotificationHistory, type AppNotification } from '../../services/notificationService';
import { JobDetailModal } from '../../components/admin/notifications/JobDetailModal';
import { NotificationHistoryModal } from '../../components/admin/notifications/NotificationHistoryModal';
import walletReferAdImg from '../../assets/wallet-refer-ad.png';
import noPendingActionsImg from '../../assets/no-pending-actions.png';
import noUpcomingPickupsImg from '../../assets/no-upcoming-pickups.png';

const BACKEND_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/v1';

/* ─── helpers ─────────────────────────────────────────────────────── */
// Local yyyy-mm-dd (toISOString would shift the day for IST users before 5:30 AM)
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
// Delay-alert links open the Orders list over the same 90-day window the backend counts
const delayRange = () => `?startDate=${ymd(addDays(new Date(), -90))}&endDate=${ymd(new Date())}`;
const fmtAmt = (v: number) => (v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

// Whole days from today until the courier's estimated delivery date
const eddDays = (date?: string | null): number | null => {
  if (!date) return null;
  const t = new Date(date); t.setHours(0, 0, 0, 0);
  const n = new Date(); n.setHours(0, 0, 0, 0);
  const d = Math.round((t.getTime() - n.getTime()) / 86400000);
  return d >= 0 ? d : null;
};

const timeAgo = (iso?: string) => {
  if (!iso) return '';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

// One-line summary for bulk ship / bulk upload notifications (same wording as the header bell)
const jobSummary = (n: AppNotification) => {
  const ref: any = n.refId;
  if (!ref) return '';
  if (n.refModel === 'BulkShipJob') {
    const done = (ref.successCount || 0) + (ref.failureCount || 0);
    return ref.status === 'running'
      ? `Processing… ${done}/${ref.totalOrders}`
      : `${ref.successCount || 0} succeeded, ${ref.failureCount || 0} failed`;
  }
  return `${ref.successfullyUploaded || 0}/${ref.noOfOrders || 0} rows uploaded${ref.errorOrders ? `, ${ref.errorOrders} failed` : ''}`;
};

interface FeedItem {
  id: string;
  kind: 'agreement' | 'announcement' | 'job';
  title: string;
  detail: string;
  date?: string;
  live?: boolean;
  onClick?: () => void;
}

const authHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const saveBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  window.URL.revokeObjectURL(url);
};

// Fetches one PDF per order and merges them into a single download
const mergePdfs = async (urls: string[], filename: string) => {
  const merged = await PDFDocument.create();
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) continue;
      const src = await PDFDocument.load(await (await res.blob()).arrayBuffer());
      const pages = await merged.copyPages(src, src.getPageIndices());
      pages.forEach(p => merged.addPage(p));
    } catch (e) { console.error(`PDF fetch failed for ${url}`, e); }
  }
  if (merged.getPageCount() === 0) throw new Error('No documents available');
  const bytes = await merged.save();
  saveBlob(new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }), filename);
};

/* ─── types ───────────────────────────────────────────────────────── */
interface RateQuote {
  _id: string;
  courierServiceName: string;
  estimatedDeliveryDate?: string | null;
  rating?: number | string;
  forward: { finalCharges: number | null };
}

interface OfferCard {
  id: string;
  tag: string;
  title: string;
  highlight?: string;
  subtitle: string;
  cta: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  image?: string;
}

// Curated offers — admin announcements targeted at this seller are appended after these
const STATIC_OFFERS: OfferCard[] = [
  {
    id: 'refer', tag: 'Referral Offer', title: 'Refer & Earn', highlight: 'up to 10%',
    subtitle: 'Invite sellers and earn cashback on their shipments.', cta: 'Refer Now',
    to: '/user/referral', icon: Gift, gradient: 'from-[#00A86B] to-[#006B45]', image: walletReferAdImg,
  },
  {
    id: 'wallet', tag: 'Wallet', title: 'Recharge &', highlight: 'Ship Faster',
    subtitle: 'Keep your wallet topped up to avoid pickup delays.', cta: 'Recharge Wallet',
    to: '/user/wallet', icon: Wallet, gradient: 'from-[#0F172A] to-[#1E3A5F]',
  },
  {
    id: 'channels', tag: 'Integrations', title: 'All Channels,', highlight: 'One Place',
    subtitle: 'Connect Shopify, WooCommerce & more to sync orders automatically.', cta: 'Connect Channel',
    to: '/user/channels', icon: Store, gradient: 'from-[#0E7490] to-[#00A86B]',
  },
  {
    id: 'secure', tag: 'Value Added Service', title: 'Protect Every', highlight: 'Shipment',
    subtitle: 'Secure your high-value orders against loss and damage.', cta: 'Explore Secure',
    to: '/user/vas/auto-secure', icon: Zap, gradient: 'from-[#4338CA] to-[#00A86B]',
  },
];

// Marketing figures for the community banner — edit here
const COMMUNITY_STATS = [
  { value: '10,000+',  label: 'Active Sellers',   icon: Users,   color: 'text-[#1D4ED8]', ring: 'border-[#BFDBFE]' },
  { value: '15,000+',  label: 'Pincodes',         icon: MapPin,  color: 'text-[#C026D3]', ring: 'border-[#F5D0FE]' },
  { value: '25+',      label: 'Courier Partners', icon: Truck,   color: 'text-[#4F46E5]', ring: 'border-[#C7D2FE]' },
  { value: '10 Lakh+', label: 'Orders Delivered', icon: Package, color: 'text-[#00A86B]', ring: 'border-[#BBF7D0]' },
];

/* ─── card shell ──────────────────────────────────────────────────── */
function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`bg-white rounded-2xl shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)] p-5 md:p-7 min-w-0 ${className}`}>
      {children}
    </div>
  );
}

function SummaryTile({ title, icon: Icon, today, yesterday, loading }: any) {
  const skeleton = (w: string, h: string) => <span className={`inline-block ${w} ${h} bg-slate-200/70 rounded animate-pulse`} />;
  return (
    <>
      {/* Mobile — wide, low tile: title row, then Today | Yesterday on one line */}
      <div className="md:hidden min-w-0 rounded-xl bg-[#F8FAFC] px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="w-6 h-6 rounded-full bg-[#E6F7F0] text-[#00A86B] flex items-center justify-center shrink-0">
            <Icon className="w-3 h-3" />
          </span>
          <span className="text-[12.5px] font-semibold text-[#0F172A] truncate">{title}</span>
        </div>
        <div className="mt-1.5 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10.5px] text-[#64748B] leading-none">Today</div>
            <div className="text-[18px] font-bold text-[#0F172A] leading-tight truncate mt-0.5">{loading ? skeleton('w-10', 'h-5') : today}</div>
          </div>
          <div className="min-w-0 text-right">
            <div className="text-[10.5px] text-[#64748B] leading-none">Yesterday</div>
            <div className="text-[12.5px] font-semibold text-[#475569] leading-tight truncate mt-1">{loading ? skeleton('w-6', 'h-3') : yesterday}</div>
          </div>
        </div>
      </div>

      {/* Desktop */}
    <div className="hidden md:flex flex-1 min-w-0 rounded-xl bg-[#F8FAFC] p-4 md:p-5 gap-4">
      <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-[#E6F7F0] text-[#00A86B] flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] md:text-[17px] font-semibold text-[#0F172A] mb-3">{title}</div>
        <div className="flex justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[12px] md:text-[13px] text-[#64748B]">Today</div>
            <div className="text-[20px] md:text-[22px] font-bold text-[#0F172A] mt-0.5 truncate">
              {loading ? <span className="inline-block w-8 h-6 bg-slate-100 rounded animate-pulse" /> : today}
            </div>
          </div>
          <div className="min-w-0 text-left">
            <div className="text-[12px] md:text-[13px] text-[#64748B]">Yesterday</div>
            <div className="text-[20px] md:text-[22px] font-bold text-[#0F172A] mt-0.5 truncate">
              {loading ? <span className="inline-block w-8 h-6 bg-slate-100 rounded animate-pulse" /> : yesterday}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

/* ─── main component ──────────────────────────────────────────────── */
export function UserHome() {
  const navigate = useNavigate();
  const { userName, currentUserId, loadingAdminTab, isEmployee, setShowOnboarding } = useAdminTab();
  const firstName = (userName || '').trim().split(' ')[0];

  // The header's navbar date filter only applies to the dashboard — hide it on Home
  // (showOnboarding is the context flag the header already reads for this).
  useEffect(() => {
    setShowOnboarding(true);
    return () => setShowOnboarding(false);
  }, [setShowOnboarding]);

  /* ── Summary ───────────────────────────────────────────────────── */
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summary, setSummary] = useState({ ordersToday: 0, ordersYesterday: 0, revenueToday: 0, revenueYesterday: 0 });
  const [hasAnyOrder, setHasAnyOrder] = useState(true);

  /* ── Actions ───────────────────────────────────────────────────── */
  const [actions, setActions] = useState<{ key: string; label: string; desc: string; count: number; to: string; icon: any; tone: string }[]>([]);
  const [actionsLoading, setActionsLoading] = useState(true);

  /* ── Pickups ───────────────────────────────────────────────────── */
  const [pickupTab, setPickupTab] = useState<'today' | 'tomorrow'>('today');
  const [pickups, setPickups] = useState<{ today: any[]; tomorrow: any[] }>({ today: [], tomorrow: [] });
  const [pickupsLoading, setPickupsLoading] = useState(true);
  const [downloading, setDownloading] = useState<'' | 'labels' | 'manifests' | 'invoices'>('');
  const [downloadError, setDownloadError] = useState('');

  /* ── Offers ────────────────────────────────────────────────────── */
  const offers = STATIC_OFFERS;

  /* ── Updates & notifications feed ──────────────────────────────── */
  const { notifications: activeNotifications } = useNotificationList();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [recentJobs, setRecentJobs] = useState<AppNotification[]>([]);
  const [pendingAgreement, setPendingAgreement] = useState<any>(null);
  const [openNotificationId, setOpenNotificationId] = useState<string | null>(null);
  const [showNotificationHistory, setShowNotificationHistory] = useState(false);
  const [expandedAnnouncement, setExpandedAnnouncement] = useState<string | null>(null);
  const [showAllOffers, setShowAllOffers] = useState(false);
  const offersScrollRef = useRef<HTMLDivElement>(null);
  const [activeOffer, setActiveOffer] = useState(0);
  // Mobile pager dots — index of the offer card currently snapped into view.
  const handleOffersScroll = () => {
    const el = offersScrollRef.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    const step = first.offsetWidth + parseFloat(getComputedStyle(el).columnGap || '0');
    setActiveOffer(Math.round(el.scrollLeft / step));
  };

  // One backend call feeds Summary, Actions and Upcoming Pickups (scoped to the logged-in seller)
  const fetchHome = useCallback(async () => {
    setSummaryLoading(true); setActionsLoading(true); setPickupsLoading(true);
    try {
      const res = await apiClient.get('/dashboard/getHomeSummary');
      const d = res.data?.data || {};
      const s = d.summary || {};
      const a = d.actions || {};
      setSummary({
        ordersToday: s.ordersToday || 0, ordersYesterday: s.ordersYesterday || 0,
        revenueToday: s.revenueToday || 0, revenueYesterday: s.revenueYesterday || 0,
      });
      setHasAnyOrder(s.hasAnyOrder !== false);
      setActions([
        { key: 'kyc', label: 'Complete your KYC', desc: 'Verify your business to unlock shipping and COD remittance', count: a.kycPending && !isEmployee ? 1 : 0, to: '/user/profile?tab=kyc', icon: FileCheck2, tone: 'bg-blue-50 text-blue-600' },
        { key: 'ndr', label: 'NDR Action Required', desc: 'Shipments awaiting your reattempt or RTO decision', count: a.ndrActionRequired || 0, to: '/user/ndr/action-required', icon: RotateCcw, tone: 'bg-indigo-50 text-indigo-600' },
        { key: 'pickup', label: 'Pickup Delays', desc: 'Orders not yet picked up by the courier', count: a.pickupDelays || 0, to: `/user/orders/ready-to-ship${delayRange()}`, icon: Clock, tone: 'bg-amber-50 text-amber-600' },
        { key: 'delivery', label: 'Delayed Deliveries', desc: 'In-transit shipments past their expected delivery date', count: a.delayedDeliveries || 0, to: `/user/orders/in-transit${delayRange()}`, icon: AlertTriangle, tone: 'bg-rose-50 text-rose-600' },
        { key: 'weight', label: 'Weight Discrepancies', desc: 'New weight disputes that need your review', count: a.weightNew || 0, to: '/user/weight-discrepancy/pending', icon: ShieldAlert, tone: 'bg-purple-50 text-purple-600' },
      ].filter(x => x.count > 0));
      setPickups({ today: d.pickups?.today || [], tomorrow: d.pickups?.tomorrow || [] });
    } catch (e) {
      console.error('Failed to load home summary', e);
      setSummary({ ordersToday: 0, ordersYesterday: 0, revenueToday: 0, revenueYesterday: 0 });
      setActions([]);
      setPickups({ today: [], tomorrow: [] });
    } finally {
      setSummaryLoading(false); setActionsLoading(false); setPickupsLoading(false);
    }
  }, [isEmployee]);

  // Admin announcements targeted at this seller. Raw fetch (not apiClient) so a
  // restricted endpoint fails silently instead of raising the access-denied modal.
  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_BASE}/announcement/all`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const list: any[] = data?.announcements || [];
      const mine = list.filter(a => a.enabled && (
        a.targetAudience === 'all' ||
        (a.selectedUsers || []).some((u: any) => (u?._id || u) === currentUserId)
      ));
      setAnnouncements(mine);
    } catch { /* announcements are optional */ }
  }, [currentUserId]);

  // Recent bulk-job notifications (including dismissed ones) + pending agreement
  const fetchFeed = useCallback(async () => {
    const [histRes, agRes] = await Promise.allSettled([
      getNotificationHistory({ page: 1, limit: 5 }),
      apiClient.get('/agreement/user/pending'),
    ]);
    if (histRes.status === 'fulfilled') setRecentJobs(histRes.value.data?.notifications || []);
    if (agRes.status === 'fulfilled') {
      const d = agRes.value.data;
      setPendingAgreement(d?.success && d?.hasPending ? d.agreement : null);
    }
  }, []);

  useEffect(() => {
    if (loadingAdminTab) return;
    fetchFeed();
    fetchHome();
    fetchAnnouncements();
  }, [loadingAdminTab, fetchHome, fetchAnnouncements, fetchFeed]);

  /* ── Pickup document downloads ─────────────────────────────────── */
  const activePickups = pickups[pickupTab];
  const activeOrderIds: string[] = activePickups.flatMap(m => (m.orderIds || []).map((o: any) => o?._id || o)).filter(Boolean);
  const docsDisabled = activeOrderIds.length === 0 || !!downloading;

  const handleDownload = async (kind: 'labels' | 'manifests' | 'invoices') => {
    if (!activeOrderIds.length) return;
    setDownloading(kind);
    setDownloadError('');
    const suffix = `${pickupTab}-${ymd(pickupTab === 'today' ? new Date() : addDays(new Date(), 1))}`;
    try {
      if (kind === 'manifests') {
        const res = await fetch(`${BACKEND_BASE}/manifest/generate-pdf?orderIds=${activeOrderIds.join(',')}`, { headers: authHeaders() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        saveBlob(await res.blob(), `manifest-${suffix}.pdf`);
      } else if (kind === 'labels') {
        await mergePdfs(activeOrderIds.map(id => `${BACKEND_BASE}/printlabel/generate-pdf/${id}`), `labels-${suffix}.pdf`);
      } else {
        await mergePdfs(activeOrderIds.map(id => `${BACKEND_BASE}/printinvoice/download-invoice/${id}`), `invoices-${suffix}.pdf`);
      }
    } catch (e) {
      console.error(`${kind} download failed`, e);
      setDownloadError(`Couldn't download ${kind}. Please try again.`);
    } finally {
      setDownloading('');
    }
  };

  /* ── Rate calculator ───────────────────────────────────────────── */
  const [rate, setRate] = useState({ pickup: '', delivery: '', weight: '0.5', value: '' });
  const [rateErrors, setRateErrors] = useState<Record<string, string>>({});
  const [rateLoading, setRateLoading] = useState(false);
  const [rateResults, setRateResults] = useState<RateQuote[] | null>(null);
  const [rateError, setRateError] = useState('');
  const [showAllRates, setShowAllRates] = useState(false);
  const pincodesReady = rate.pickup.length === 6 && rate.delivery.length === 6;

  const setRateField = (k: keyof typeof rate, v: string) => {
    setRate(r => ({ ...r, [k]: v }));
    setRateErrors(e => ({ ...e, [k]: '' }));
    setRateResults(null);
    setRateError('');
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!rate.pickup) errs.pickup = 'Pickup pincode is required';
    else if (rate.pickup.length !== 6) errs.pickup = 'Enter a valid 6-digit pincode';
    if (!rate.delivery) errs.delivery = 'Delivery pincode is required';
    else if (rate.delivery.length !== 6) errs.delivery = 'Enter a valid 6-digit pincode';
    if (pincodesReady) {
      const w = parseFloat(rate.weight);
      if (!rate.weight || !(w > 0)) errs.weight = 'Package weight is required';
      if (!rate.value || !(Number(rate.value) > 0)) errs.value = 'Shipment value is required';
    }
    setRateErrors(errs);
    if (Object.keys(errs).length) return;

    const weight = Math.max(parseFloat(rate.weight), 0.5);
    setRateLoading(true);
    setRateError('');
    setRateResults(null);
    setShowAllRates(false);
    try {
      const res = await apiClient.post('/ratecalculate/Rate', {
        shipmentType: 'Forward',
        pickUpPincode: rate.pickup,
        deliveryPincode: rate.delivery,
        weight: String(weight),
        declaredValue: rate.value,
        paymentType: 'Prepaid',
        // Quick estimate — nominal box whose volumetric weight (0.2 kg) never exceeds the 0.5 kg minimum
        dimensions: { length: '10', breadth: '10', height: '10' },
        applicableWeight: weight,
      });
      const data: RateQuote[] = (res.data || []).filter((c: RateQuote) => c.forward?.finalCharges != null);
      if (data.length === 0) setRateError('No courier is serviceable for this route.');
      setRateResults(data.sort((a, b) => (a.forward.finalCharges ?? 0) - (b.forward.finalCharges ?? 0)));
    } catch {
      setRateError('Failed to calculate rates. Please try again.');
    } finally {
      setRateLoading(false);
    }
  };

  const scrollOffers = (dir: 1 | -1) => {
    offersScrollRef.current?.scrollBy({ left: dir * 260, behavior: 'smooth' });
  };

  const feed: FeedItem[] = (() => {
    const jobs = new Map<string, AppNotification>();
    [...activeNotifications, ...recentJobs].forEach(n => { if (!jobs.has(n._id)) jobs.set(n._id, n); });
    const dated: FeedItem[] = [
      ...announcements.map((a): FeedItem => ({
        id: a._id, kind: 'announcement', title: 'Announcement', detail: a.message, date: a.createdAt,
        onClick: () => setExpandedAnnouncement(x => (x === a._id ? null : a._id)),
      })),
      ...[...jobs.values()].map((n): FeedItem => ({
        id: n._id, kind: 'job', title: n.title, detail: jobSummary(n), date: n.createdAt,
        live: n.refModel === 'BulkShipJob' && (n.refId as any)?.status === 'running',
        onClick: () => setOpenNotificationId(n._id),
      })),
    ].sort((x, y) => new Date(y.date || 0).getTime() - new Date(x.date || 0).getTime());
    // A pending agreement needs action, so it's always pinned first
    const pinned: FeedItem[] = pendingAgreement ? [{
      id: 'agreement', kind: 'agreement', title: 'Agreement pending acceptance',
      detail: `${pendingAgreement.versionName || 'New Terms & Conditions'} — review and accept to continue shipping.`,
      onClick: () => navigate('/user/settings/agreement'),
    }] : [];
    return [...pinned, ...dated];
  })();
  const unreadCount = activeNotifications.length + announcements.length + (pendingAgreement ? 1 : 0);

  const inputCls = (err?: string) =>
    `w-full h-[46px] px-4 rounded-lg border text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] bg-white focus:outline-none transition-colors ${
      err ? 'border-red-400 focus:border-red-500' : 'border-[#CBD5E1] focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10'
    }`;

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto text-[#0F172A] -mb-4 md:-mb-6 min-w-0 overflow-x-hidden">

        {/* Welcome */}
        <div className="mb-4 md:mb-5">
          <h1 className="text-[20px] font-bold tracking-tight">Welcome{firstName ? ` ${firstName}` : ''}!</h1>
          <p className="text-[14px] text-[#475569] mt-0.5">
            {hasAnyOrder ? "Here's a quick look at your shipping activity today." : "You're few steps away from shipping your first order."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-7">

          {/* ── Left column ──────────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-5 md:gap-7 min-w-0">

            {/* Summary */}
            <Card>
              <h2 className="text-[16px] md:text-[18px] font-bold mb-3 md:mb-4">Summary</h2>
              <div className="grid grid-cols-2 gap-2 md:flex md:flex-row md:gap-6">
                <SummaryTile title="Orders" icon={Package} loading={summaryLoading}
                  today={summary.ordersToday.toLocaleString('en-IN')} yesterday={summary.ordersYesterday.toLocaleString('en-IN')} />
                <SummaryTile title="Revenue" icon={IndianRupee} loading={summaryLoading}
                  today={fmtAmt(summary.revenueToday)} yesterday={fmtAmt(summary.revenueYesterday)} />
              </div>
            </Card>

            {/* Actions Needing Your Attention */}
            <Card>
              <h2 className="text-[16px] md:text-[18px] font-bold mb-3 md:mb-4">Actions Needing Your Attention</h2>
              {actionsLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#00A86B]" /></div>
              ) : actions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <img src={noPendingActionsImg} alt="" className="w-[220px] md:w-[260px] h-auto select-none pointer-events-none" draggable={false} />
                  <p className="text-[14px] md:text-[15px] text-[#475569] mt-2">No Pending Actions Today</p>
                </div>
              ) : (
                <div className="divide-y divide-[#EEF2F6] bg-[#F8FAFC] rounded-xl overflow-hidden">
                  {actions.map(a => (
                    <Link key={a.key} to={a.to} className="flex items-center gap-4 p-4 hover:bg-[#F1F5F9] transition-colors group">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${a.tone}`}>
                        <a.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-semibold text-[#0F172A]">{a.label}</div>
                        <div className="text-[12px] text-[#64748B] truncate">{a.desc}</div>
                      </div>
                      {a.key !== 'kyc' && (
                        <span className="text-[13px] font-bold text-[#0F172A] bg-[#F1F5F9] rounded-full px-2.5 py-0.5 shrink-0">{a.count}</span>
                      )}
                      <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#00A86B] shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </Card>

            {/* Upcoming Pickups */}
            <Card>
              <h2 className="text-[16px] md:text-[18px] font-bold mb-3 md:mb-4">Upcoming Pickups</h2>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 md:gap-3">
                <div className="flex w-full md:inline-flex md:w-auto md:self-start p-0.5 md:p-1 rounded-md border border-[#E2E8F0]">
                  {(['today', 'tomorrow'] as const).map(t => (
                    <button key={t} onClick={() => { setPickupTab(t); setDownloadError(''); }}
                      className={`flex-1 md:flex-none h-7 md:h-8 md:min-w-[112px] px-3 md:px-4 rounded text-[12px] md:text-[13px] transition-colors ${
                        pickupTab === t ? 'bg-[#E6F7F0] text-[#00A86B] font-semibold' : 'text-[#0F172A] hover:bg-[#F8FAFC]'
                      }`}>
                      {t === 'today' ? 'Today' : 'Tomorrow'}
                      {pickups[t].length > 0 && <span className="ml-1 md:ml-1.5 text-[10px] md:text-[11px]">({pickups[t].length})</span>}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 w-full md:flex md:w-auto md:self-auto rounded-md border border-[#E2E8F0] overflow-hidden">
                  {(['labels', 'manifests', 'invoices'] as const).map((k, i) => (
                    <button key={k} onClick={() => handleDownload(k)} disabled={docsDisabled}
                      className={`h-7 md:h-9 px-1.5 md:px-4 flex items-center justify-center md:justify-start gap-1 md:gap-1.5 text-[11px] md:text-[13px] capitalize transition-colors ${i > 0 ? 'border-l border-[#E2E8F0]' : ''} ${
                        docsDisabled ? 'bg-[#F8FAFC] text-[#94A3B8] cursor-not-allowed' : 'bg-white text-[#334155] hover:bg-[#F0FDF4] hover:text-[#00A86B]'
                      }`}>
                      {downloading === k ? <Loader2 className="w-3 h-3 md:w-3.5 md:h-3.5 animate-spin" /> : <Download className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                      {k}
                    </button>
                  ))}
                </div>
              </div>
              {downloadError && <p className="text-[12px] text-red-500 mt-2 sm:text-right">{downloadError}</p>}

              {pickupsLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#00A86B]" /></div>
              ) : activePickups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 md:py-24">
                  <img src={noUpcomingPickupsImg} alt="" className="w-[140px] md:w-[210px] h-auto select-none pointer-events-none" draggable={false} />
                  <p className="text-[13px] md:text-[15px] text-[#475569] mt-2">No upcoming pickups</p>
                </div>
              ) : (
                <div className="mt-4 md:mt-5 flex flex-col gap-2.5 md:gap-3">
                  {activePickups.map(m => {
                    const count = (m.orderIds || []).length;
                    return (
                      <button key={m._id} onClick={() => navigate(`/user/pickup-manifest/${m.pickupId}`)}
                        className="text-left flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl bg-[#F8FAFC] hover:bg-[#F0FDF4] transition-colors">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#E6F7F0] text-[#00A86B] flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] md:text-[14px] font-semibold text-[#0F172A] truncate">{m.pickupAddress?.contactName || 'Pickup location'}</div>
                          <div className="text-[12px] text-[#64748B] truncate">
                            {[m.pickupAddress?.city, m.pickupAddress?.pinCode || m.pickupAddress?.pincode].filter(Boolean).join(' – ') || '—'}
                            {' · '}<span className="text-[#00A86B] font-medium">{m.pickupId}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[15px] font-bold text-[#0F172A]">{count}</div>
                          <div className="text-[11px] text-[#94A3B8]">{count === 1 ? 'shipment' : 'shipments'}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#94A3B8] shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* ── Right column ─────────────────────────────────────── */}
          <div className="flex flex-col gap-5 md:gap-7 min-w-0">

            {/* Calculate Your Shipping Rates — desktop only */}
            <Card className="hidden md:block">
              <h2 className="text-[18px] font-bold mb-6">Calculate Your Shipping Rates</h2>
              <form onSubmit={handleCalculate} noValidate>
                <div className="grid grid-cols-2 gap-x-0 relative">
                  <div className="pr-6 min-w-0">
                    <label className="flex items-center gap-2 text-[14px] md:text-[15px] font-medium mb-2.5">
                      <span className="w-4 h-4 rounded-full bg-[#DBEAFE] flex items-center justify-center"><span className="w-2 h-2 rounded-full bg-[#2563EB]" /></span>
                      Pickup Pincode
                    </label>
                    <input inputMode="numeric" value={rate.pickup} placeholder="Enter Pincode"
                      onChange={e => setRateField('pickup', e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className={inputCls(rateErrors.pickup)} />
                    {rateErrors.pickup && <p className="text-[12px] text-red-500 mt-1.5">{rateErrors.pickup}</p>}
                  </div>
                  <div className="pl-6 min-w-0">
                    <label className="flex items-center gap-2 text-[14px] md:text-[15px] font-medium mb-2.5">
                      <span className="w-4 h-4 rounded-full bg-[#DCFCE7] flex items-center justify-center"><MapPin className="w-2.5 h-2.5 text-[#16A34A]" strokeWidth={3} /></span>
                      Delivery Pincode
                    </label>
                    <input inputMode="numeric" value={rate.delivery} placeholder="Enter Pincode"
                      onChange={e => setRateField('delivery', e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className={inputCls(rateErrors.delivery)} />
                    {rateErrors.delivery && <p className="text-[12px] text-red-500 mt-1.5">{rateErrors.delivery}</p>}
                  </div>
                  {/* dotted connector between the two pincode inputs */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-[55px] w-12 border-t border-dotted border-[#94A3B8] pointer-events-none" />
                </div>

                <AnimatePresence initial={false}>
                  {pincodesReady && (
                    <motion.div key="extra" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }} className="overflow-hidden">
                      <div className="grid grid-cols-2 gap-5 pt-4">
                        <div className="min-w-0">
                          <label className="block text-[14px] md:text-[15px] font-medium mb-2.5">Package Weight</label>
                          <div className={`flex h-[46px] rounded-lg border overflow-hidden ${rateErrors.weight ? 'border-red-400' : 'border-[#CBD5E1] focus-within:border-[#00A86B]'}`}>
                            <input inputMode="decimal" value={rate.weight} placeholder="0.5"
                              onChange={e => { if (/^\d*\.?\d*$/.test(e.target.value)) setRateField('weight', e.target.value); }}
                              className="flex-1 min-w-0 px-4 text-[14px] focus:outline-none" />
                            <span className="w-14 flex items-center justify-center bg-[#F1F5F9] border-l border-[#CBD5E1] text-[14px] text-[#334155] shrink-0">kg</span>
                          </div>
                          {rateErrors.weight
                            ? <p className="text-[12px] text-red-500 mt-1.5">{rateErrors.weight}</p>
                            : <p className="text-[12px] text-[#64748B] mt-1.5">Min. chargeable wt is 0.5kg</p>}
                        </div>
                        <div className="min-w-0">
                          <label className="block text-[14px] md:text-[15px] font-medium mb-2.5">Shipment Value (₹)</label>
                          <div className={`flex h-[46px] rounded-lg border overflow-hidden ${rateErrors.value ? 'border-red-400' : 'border-[#CBD5E1] focus-within:border-[#00A86B]'}`}>
                            <span className="w-12 flex items-center justify-center bg-[#F1F5F9] border-r border-[#CBD5E1] text-[14px] text-[#334155] shrink-0">₹</span>
                            <input inputMode="numeric" value={rate.value} placeholder="Enter value"
                              onChange={e => setRateField('value', e.target.value.replace(/\D/g, ''))}
                              className="flex-1 min-w-0 px-3 text-[14px] focus:outline-none" />
                          </div>
                          {rateErrors.value && <p className="text-[12px] text-red-500 mt-1.5">{rateErrors.value}</p>}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" disabled={rateLoading}
                  className="w-full h-11 mt-6 rounded-lg border border-[#00A86B] text-[#00A86B] text-[14px] md:text-[15px] font-medium hover:bg-[#00A86B] hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                  {rateLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Calculate Rates
                </button>
              </form>

              {(rateResults || rateError) && (
                <div className="mt-6 pt-5 -mx-5 md:-mx-7 px-5 md:px-7 border-t border-[#EEF2F6]">
                  <h3 className="text-[16px] md:text-[17px] font-medium text-[#0F172A] mb-4">Serviceable Courier Partners</h3>
                  {rateError ? (
                    <p className="text-[13px] text-red-500">{rateError}</p>
                  ) : rateResults && (
                    <>
                      <div className="flex flex-col gap-4">
                        {(showAllRates ? rateResults : rateResults.slice(0, 3)).map((c, i) => {
                          const rating = Number(c.rating);
                          const days = eddDays(c.estimatedDeliveryDate);
                          return (
                            <div key={c._id || i}
                              className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-lg bg-gradient-to-r from-[#ECFDF5] via-[#F7FEFB] to-[#F8FAFC]">
                              <div className="min-w-0">
                                <div className="text-[13px] md:text-[14px] text-[#0F172A] truncate">{c.courierServiceName}</div>
                                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#64748B]">
                                  {rating > 0 && (
                                    <>
                                      <span className="text-[#16A34A]">{rating.toFixed(1)} ★</span>
                                      <span className="w-px h-3 bg-[#CBD5E1]" />
                                    </>
                                  )}
                                  <span>EDD {days !== null ? <>within <span className="text-[#334155]">{days} {days === 1 ? 'day' : 'days'}</span></> : 'unavailable'}</span>
                                </div>
                              </div>
                              <div className="text-[15px] md:text-[16px] font-bold text-[#0F172A] shrink-0">₹{fmtAmt(c.forward.finalCharges ?? 0)}</div>
                            </div>
                          );
                        })}
                      </div>
                      {rateResults.length > 3 && (
                        <button type="button" onClick={() => setShowAllRates(v => !v)}
                          className="mx-auto mt-4 flex items-center gap-1 text-[13px] text-[#00A86B] hover:underline">
                          {showAllRates ? 'Show less' : `View ${rateResults.length - 3} more Courier Partners`}
                          <ChevronRight className={`w-4 h-4 transition-transform ${showAllRates ? '-rotate-90' : ''}`} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </Card>

            {/* Offers & Updates */}
            <Card>
              <div className="flex items-center justify-between mb-3 md:mb-4 gap-2">
                <h2 className="text-[16px] md:text-[18px] font-bold">Offers &amp; Updates</h2>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => scrollOffers(-1)} aria-label="Previous"
                    className="hidden md:flex w-7 h-7 rounded-full border border-[#E2E8F0] items-center justify-center text-[#64748B] hover:text-[#00A86B] hover:border-[#00A86B]">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => scrollOffers(1)} aria-label="Next"
                    className="hidden md:flex w-7 h-7 rounded-full border border-[#E2E8F0] items-center justify-center text-[#64748B] hover:text-[#00A86B] hover:border-[#00A86B]">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button onClick={() => setShowAllOffers(true)} className="text-[13px] md:text-[15px] font-semibold md:font-medium text-[#00A86B] hover:underline ml-1">View All</button>
                </div>
              </div>
              <div ref={offersScrollRef} onScroll={handleOffersScroll} className="flex gap-2.5 md:gap-4 overflow-x-auto snap-x snap-mandatory pb-1 -mr-5 md:-mr-7 pr-5 md:pr-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {offers.map(o => <OfferTile key={o.id} offer={o} />)}
              </div>
              {offers.length > 1 && (
                <div className="md:hidden flex justify-center gap-1.5 mt-2.5" aria-hidden>
                  {offers.map((o, i) => (
                    <span key={o.id} className={`h-1.5 rounded-full transition-all duration-300 ${i === activeOffer ? 'w-4 bg-[#00A86B]' : 'w-1.5 bg-[#CBD5E1]'}`} />
                  ))}
                </div>
              )}

              {/* Updates & Alerts */}
              <div className="mt-5 md:mt-8 rounded-xl bg-[#F8FAFC] overflow-hidden">
                <div className="px-3.5 md:px-5 py-3 md:py-3.5 border-b border-[#EEF2F6] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative w-9 h-9 rounded-full bg-[#E6F7F0] text-[#00A86B] flex items-center justify-center shrink-0">
                      <BellRing className="w-4 h-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#EF4444] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-[#FAFBFC]">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[14px] md:text-[16px] font-semibold leading-tight">Updates &amp; Alerts</h3>
                      <p className="text-[12px] text-[#64748B] truncate">Stay informed. Never miss a critical update.</p>
                    </div>
                  </div>
                  <button onClick={() => setShowNotificationHistory(true)}
                    className="text-[13px] font-medium text-[#00A86B] hover:underline shrink-0 flex items-center gap-0.5">
                    View all <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {feed.length === 0 ? (
                  <div className="px-5 py-6 flex items-center gap-3">
                    <Bell className="w-5 h-5 text-[#CBD5E1] shrink-0" />
                    <div>
                      <p className="text-[13px] font-medium text-[#334155]">You&apos;re all caught up</p>
                      <p className="text-[12px] text-[#94A3B8]">New announcements and job updates will appear here.</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-[#F1F5F9]">
                    {feed.slice(0, 2).map(item => {
                      const Icon = item.kind === 'agreement' ? FileSignature
                        : item.kind === 'announcement' ? Megaphone
                        : item.live ? Loader2
                        : /upload/i.test(item.title) ? UploadCloud : Package;
                      const tone = item.kind === 'agreement' ? 'bg-amber-50 text-amber-600'
                        : item.kind === 'announcement' ? 'bg-indigo-50 text-indigo-600'
                        : 'bg-[#E6F7F0] text-[#00A86B]';
                      const expanded = expandedAnnouncement === item.id;
                      return (
                        <button key={item.id} type="button" onClick={item.onClick}
                          className="w-full text-left px-4 md:px-5 py-3.5 flex items-start gap-3 hover:bg-[#F8FAFC] transition-colors group">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tone}`}>
                            <Icon className={`w-4 h-4 ${item.live ? 'animate-spin' : ''}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-semibold text-[#0F172A] truncate">{item.title}</span>
                              {item.kind === 'agreement' && (
                                <span className="px-1.5 py-px rounded text-[9px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 shrink-0">Action required</span>
                              )}
                              {item.date && <span className="ml-auto text-[11px] text-[#94A3B8] shrink-0">{timeAgo(item.date)}</span>}
                            </div>
                            {item.detail && (
                              <p className={`text-[12px] text-[#64748B] mt-0.5 leading-relaxed ${expanded ? 'whitespace-pre-line' : 'line-clamp-2'}`}>{item.detail}</p>
                            )}
                          </div>
                          <ChevronRight className={`w-4 h-4 text-[#CBD5E1] group-hover:text-[#00A86B] shrink-0 mt-2 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                        </button>
                      );
                    })}
                  </div>
                )}

                {feed.length > 2 && (
                  <button onClick={() => setShowNotificationHistory(true)}
                    className="w-full py-2.5 border-t border-[#EEF2F6] text-[12px] font-medium text-[#475569] hover:text-[#00A86B] hover:bg-[#F1F5F9] transition-colors">
                    +{feed.length - 2} more update{feed.length - 2 === 1 ? '' : 's'}
                  </button>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Community banner */}
        <div className="relative mt-6 md:mt-10 -mx-4 md:-mx-6 px-5 md:px-12 pt-6 pb-6 md:pt-10 md:pb-8 bg-gradient-to-b from-transparent via-[#F0FDF4]/70 to-[#FEFCE8]/80 overflow-hidden">
          <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 md:gap-8">
            <div>
              <h2 className="text-[19px] md:text-[28px] font-bold leading-snug">
                Now you're part of <span className="text-[#2563EB]">India's</span><br />
                <span className="text-[#16A34A]">Leading</span> seller community
              </h2>
              <p className="text-[13px] md:text-[18px] text-[#475569] mt-1.5 md:mt-3">A network built to help your business grow.</p>
            </div>
            <div className="grid grid-cols-4 gap-2 md:gap-12 rounded-2xl md:rounded-none bg-white/70 md:bg-transparent py-3.5 md:py-0 px-1 md:px-0">
              {COMMUNITY_STATS.map(s => (
                <div key={s.label} className="flex flex-col items-center text-center">
                  <div className={`w-9 h-9 md:w-12 md:h-12 rounded-full bg-white border ${s.ring} flex items-center justify-center mb-2 md:mb-3`}>
                    <s.icon className={`w-4 h-4 md:w-5 md:h-5 ${s.color}`} />
                  </div>
                  <div className="text-[14px] md:text-[20px] font-bold leading-tight">{s.value}</div>
                  <div className="text-[10.5px] md:text-[14px] text-[#334155] mt-0.5 leading-tight">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <JobDetailModal notificationId={openNotificationId} onClose={() => setOpenNotificationId(null)} />
      <NotificationHistoryModal open={showNotificationHistory} onClose={() => { setShowNotificationHistory(false); fetchFeed(); }} />

      {/* All offers modal */}
      <AnimatePresence>
        {showAllOffers && (
          <motion.div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center sm:p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAllOffers(false)} />
            <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
              className="relative bg-white w-full sm:max-w-3xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
              <div className="p-5 border-b border-[#F1F5F9] flex items-center justify-between">
                <h3 className="text-[16px] font-bold">Offers &amp; Updates</h3>
                <button onClick={() => setShowAllOffers(false)} className="w-8 h-8 rounded-lg hover:bg-[#F1F5F9] flex items-center justify-center text-[#64748B]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {offers.map(o => <OfferTile key={o.id} offer={o} fluid onNavigate={() => setShowAllOffers(false)} />)}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}

/* ─── offer tile ──────────────────────────────────────────────────── */
function OfferTile({ offer, fluid = false, onNavigate }: { offer: OfferCard; fluid?: boolean; onNavigate?: () => void }) {
  const Icon = offer.icon;
  const sizeCls = fluid ? 'w-full' : 'w-[82%] md:w-[240px] shrink-0 snap-start';
  if (offer.image) {
    return (
      <Link to={offer.to} onClick={onNavigate} title={offer.subtitle}
        className={`${sizeCls} aspect-[16/9] rounded-xl overflow-hidden border border-[#E2E8F0] relative group block`}>
        <img src={offer.image} alt={offer.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
      </Link>
    );
  }
  return (
    <Link to={offer.to} onClick={onNavigate}
      className={`${sizeCls} aspect-[16/9] rounded-xl overflow-hidden relative bg-gradient-to-br ${offer.gradient} text-white p-4 flex flex-col group`}>
      <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/10" />
      <div className="absolute right-4 top-4 w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{offer.tag}</span>
      <div className="mt-1.5 text-[17px] font-bold leading-tight pr-10">
        {offer.title}{offer.highlight && <><br /><span className="text-[#86EFAC]">{offer.highlight}</span></>}
      </div>
      <p className="text-[11px] opacity-85 mt-1.5 line-clamp-2 pr-4">{offer.subtitle}</p>
      <span className="mt-auto text-[12px] font-semibold inline-flex items-center gap-1 relative">
        {offer.cta} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </span>
    </Link>
  );
}
