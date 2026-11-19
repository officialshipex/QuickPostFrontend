import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';
import { getToken } from '../../utils/session';
import { useAdminTab } from '../../context/AdminUserContext';
import { useDashboardFilters } from '../../context/DashboardFilterContext';
import { useTableLoader } from '../../hooks/useTableLoader';
import { TableLoader } from '../../components/ui/TableLoader';
import { TruncatedText } from '../../components/ui/TruncatedText';
import { ProtectedAdImage } from '../../components/ui/ProtectedAdImage';
import { useUserSearchFilter } from '../../hooks/filters/useUserSearchFilter';
import { UserOnboarding } from '../../components/admin/dashboard/UserOnboarding';
import { MobileDateFilter } from '../../components/admin/dashboard/MobileDateFilter';
import { OverviewInsights } from '../../components/admin/dashboard/OverviewInsights';
import { ShipmentsTab } from '../../components/admin/dashboard/ShipmentsTab';
import { SummaryTab } from '../../components/admin/dashboard/SummaryTab';
import { DashboardSkeleton, DashboardPageSkeleton } from '../../components/admin/dashboard/DashboardSkeleton';
import { useSkeletonReveal } from '../../hooks/useSkeletonReveal';
import { CardLinksContext, useCardLinks } from '../../components/admin/dashboard/cardLinks';
import {
  RefreshCcw, Package, IndianRupee, Users, CreditCard, Search, X,
  ShoppingCart, Clock, AlertTriangle, CheckCircle2, RotateCcw,
  ShieldAlert, Truck, FileText, ArrowRight, Percent,
  LayoutDashboard, ShoppingBag, PackageCheck, ClipboardList,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import walletRechargeAdImg from '../../assets/wallet-recharge-ad.png';

/* ─── helpers ─────────────────────────────────────────────────────── */
const fmt = (v: number) =>
  '₹' + (v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const fmtN = (v: number) => (v || 0).toLocaleString('en-IN');

const CHART_COLORS = ['#00A86B', '#1D4ED8', '#38BDF8', '#F59E0B', '#8B5CF6', '#F43F5E', '#EC4899', '#14B8A6'];
const ZONE_COLORS  = ['#F43F5E', '#8B5CF6', '#00A86B', '#1D4ED8', '#F59E0B'];

const zoneLabel = (z: string) => {
  const m: Record<string, string> = { zoneA: 'Zone A', zoneB: 'Zone B', zoneC: 'Zone C', zoneD: 'Zone D', zoneE: 'Zone E' };
  return m[z] || z;
};

const courierIcon = (name: string) => {
  const n = (name || '').toLowerCase();
  if (n.includes('delhivery')) return '/brands/delhivery.png';
  if (n.includes('maruti'))    return '/brands/shree_maruti.jpg';
  if (n.includes('bluedart'))  return '/brands/bluedart.png';
  if (n.includes('ekart'))     return '/brands/ekart.png';
  if (n.includes('shadowfax')) return '/brands/shadowfax.png';
  if (n.includes('ecom'))      return '/brands/ecom.png';
  return null;
};

const initials = (name: string) =>
  (name || '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

/* ─── sub-components ──────────────────────────────────────────────── */
function StatCardWithTrend({ title, value, trend, isUp, icon: Icon }: any) {
  // isUp true/false → coloured growth chip; undefined → neutral period label.
  const neutral = isUp === undefined;
  return (
    <div className="group min-w-0 bg-white rounded-xl border border-[#EEF2F6] p-3.5 md:p-4 shadow-[0_1px_2px_rgba(16,24,40,0.03),0_4px_16px_-6px_rgba(16,24,40,0.06)] hover:shadow-md hover:border-[#CBD5E1] transition-all flex flex-col">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[12px] md:text-[13px] font-medium text-[#64748B] truncate">{title}</div>
        {Icon && (
          <span className="w-7 h-7 rounded-lg bg-[#F0FDF4] flex items-center justify-center shrink-0">
            <Icon className="w-3.5 h-3.5 text-[#00A86B]" />
          </span>
        )}
      </div>
      <div className="mt-2 text-[18px] md:text-[22px] font-bold text-[#0F172A] tabular-nums leading-tight truncate">{value}</div>
      <div className="mt-1.5 min-w-0">
        {neutral ? (
          <span className="text-[11px] text-[#94A3B8] truncate">{trend}</span>
        ) : (
          <span className={`inline-flex items-center gap-0.5 h-5 px-1.5 rounded-md text-[11px] font-semibold tabular-nums ${isUp ? 'bg-[#F0FDF4] text-[#047857]' : 'bg-red-50 text-red-600'}`}>
            {isUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
    </div>
  );
}

const DASH_TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'orders', label: 'Orders', icon: ShoppingBag },
  { key: 'shipments', label: 'Shipments', icon: PackageCheck },
  { key: 'summary', label: 'Summary', icon: ClipboardList },
] as const;
type DashTab = typeof DASH_TABS[number]['key'];
/** Tabs hidden for now (kept in DASH_TABS so they can be switched back on). */
const HIDDEN_TABS: DashTab[] = ['orders'];

function DashboardTabs({ value, onChange }: { value: DashTab; onChange: (t: DashTab) => void }) {
  return (
    <div role="tablist" aria-label="Dashboard sections"
      className="relative mb-2 border-b border-[#E2E8F0] flex items-end gap-5 md:gap-8 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {DASH_TABS.filter(t => !HIDDEN_TABS.includes(t.key)).map(t => {
        const active = value === t.key;
        return (
          <button key={t.key} type="button" role="tab" aria-selected={active} onClick={() => onChange(t.key)}
            className={`group relative shrink-0 h-12 inline-flex items-center gap-2 text-[14px] md:text-[14.5px] tracking-[-0.005em] transition-colors focus-visible:outline-none ${active ? 'font-semibold text-[#0F172A]' : 'font-medium text-[#64748B] hover:text-[#0F172A]'}`}>
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${active ? 'bg-[#E8F7F0] text-[#00A86B]' : 'text-[#94A3B8] group-hover:bg-[#F1F5F9] group-hover:text-[#475569]'}`}>
              <t.icon className="w-4 h-4" strokeWidth={active ? 2.2 : 1.8} />
            </span>
            {t.label}
            {!active && <span aria-hidden className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-[#CBD5E1] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-200" />}
            {active && <motion.span layoutId="dash-tab-underline" className="absolute inset-x-0 -bottom-px h-[3px] rounded-t-full bg-[#00A86B]" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
          </button>
        );
      })}
    </div>
  );
}

function MiniStatCard({ title, value, icon: Icon, to: toProp, className = '', smallIcon = false }: any) {
  const to = useCardLinks() ? toProp : undefined;   // seller side: cards are not clickable
  // Duotone line icon (outline + soft tinted fill), one brand colour across all cards.
  const inner = (
    <div className={`min-w-0 h-full bg-white rounded-xl border border-[#E2E8F0] p-3 md:p-4 shadow-sm group ${to ? 'cursor-pointer hover:border-[#00A86B]/60 hover:shadow-md transition-all duration-150' : ''}`}>
      {Icon && (
        <Icon className={`${smallIcon ? 'w-6 h-6 md:w-7 md:h-7' : 'w-7 h-7 md:w-9 md:h-9'} mb-2 md:mb-2.5 text-[#00A86B]`} strokeWidth={1.4} fill="currentColor" fillOpacity={0.12} />
      )}
      <div className={`text-[11px] md:text-[13px] font-medium mb-0.5 leading-tight break-words transition-colors ${to ? 'text-[#475569] group-hover:text-[#00A86B]' : 'text-[#475569]'}`}>{title}</div>
      <div className="text-[15px] md:text-xl font-bold text-[#0F172A] truncate">{value}</div>
    </div>
  );
  if (to) return <Link to={to} className={`block ${className}`}>{inner}</Link>;
  return className ? <div className={className}>{inner}</div> : inner;
}

/** Mobile donut: total in the centre, legend with value + share beside it. */
function MobileDonut({ data, centerLabel }: { data: { name: string; value: number; color: string }[]; centerLabel: string }) {
  const total = data.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-[124px] h-[124px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={44} outerRadius={60} paddingAngle={data.length > 1 ? 2 : 0} dataKey="value" stroke="none" startAngle={90} endAngle={-270}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[17px] font-bold text-[#0F172A] leading-tight tabular-nums">{total.toLocaleString('en-IN')}</span>
          <span className="text-[10px] font-medium text-[#94A3B8]">{centerLabel}</span>
        </div>
      </div>
      <ul className="flex-1 min-w-0 divide-y divide-[#F1F5F9]">
        {data.map((d, i) => {
          const pct = total > 0 ? Math.round(((Number(d.value) || 0) / total) * 100) : 0;
          return (
            <li key={i} className="flex items-center gap-2 py-1.5 first:pt-0 last:pb-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              <span className="flex-1 min-w-0 text-[12px] font-medium text-[#334155] truncate">{d.name}</span>
              <span className="text-[12px] font-bold text-[#0F172A] tabular-nums">{Number(d.value || 0).toLocaleString('en-IN')}</span>
              <span className="w-9 text-right text-[11px] text-[#94A3B8] tabular-nums">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SectionHeading({ title, rightText }: any) {
  return (
    <div className="flex justify-between items-center mt-4 mb-2.5">
      <h3 className="text-[13px] font-bold text-[#0F172A]">{title}</h3>
      {rightText && <span className="hidden md:inline text-[11px] font-medium text-[#94A3B8]">{rightText}</span>}
    </div>
  );
}

function BarRow({ name, value, maxValue, color }: { name: string; value: number; maxValue: number; color: string }) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <div className="w-[70px] text-[10px] font-semibold text-[#475569] truncate">{name}</div>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="w-6 text-right text-[10px] font-bold" style={{ color }}>
        {String(value).padStart(2, '0')}
      </div>
    </div>
  );
}

/* ─── main component ──────────────────────────────────────────────── */
export function AdminDashboard() {
  const { isAdmin, adminTab, loadingAdminTab, isEmployee, setShowOnboarding } = useAdminTab();
  const { filters } = useDashboardFilters();
  const isAdminView = isAdmin && adminTab;
  const [dashTab, setDashTab] = useState<DashTab>('overview');
  const location = useLocation();
  const navigate = useNavigate();
  const isUserRoute = location.pathname === '/user/dashboard';
  const navBase = isUserRoute ? '/user' : '/admin';
  // Card counts are computed over the dashboard's date range, so the destination lists must open on the same range.
  // Counts that ignore the range (RTO In-Transit, weight discrepancies) open on a wide window instead.
  const ymdLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const rangeQ = `?startDate=${ymdLocal(filters.dateRange.start)}&endDate=${ymdLocal(filters.dateRange.end)}`;
  const allTimeQ = (() => { const s = new Date(); s.setFullYear(s.getFullYear() - 3); return `?startDate=${ymdLocal(s)}&endDate=${ymdLocal(new Date())}`; })();

  // ── Wallet recharge ad — user side only, first time per login session, appears 2s after page load ──
  const [showWalletAd, setShowWalletAd] = useState(false);
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    if (sessionStorage.getItem(`walletAdSeen_${token}`) === '1') return;
    const timer = setTimeout(() => setShowWalletAd(true), 2000);
    return () => clearTimeout(timer);
  }, []);
  const dismissWalletAd = () => {
    const token = getToken();
    if (token) sessionStorage.setItem(`walletAdSeen_${token}`, '1');
    setShowWalletAd(false);
  };

  const { isLoading: loading, setIsLoading: setLoading } = useTableLoader(0);
  // Shimmer templates on first load and on every tab switch (1–1.8 s) — see hooks/useSkeletonReveal.
  const { showSkeleton } = useSkeletonReveal(dashTab, loading || loadingAdminTab);
  const [overview,    setOverview]    = useState<any>(null);
  const [insights,    setInsights]    = useState<any>(null);
  const [graphs,      setGraphs]      = useState<any>(null);
  const [cardData,    setCardData]    = useState<any>(null);
  const [weightData,  setWeightData]  = useState<any>({ total: 0, counts: {} });
  const [couriers,    setCouriers]    = useState<any[]>([]);
  const [actionCards, setActionCards] = useState<any>({ pendingKYC: 0, lowBalanceSellers: 0, newUsers: 0 });
  const [topSellers,     setTopSellers]     = useState<any[]>([]);
  const [topSellersErr,  setTopSellersErr]  = useState<string>('');
  const [kycComplete, setKycComplete] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [contractAccepted, setContractAccepted] = useState(false);
  const [bankVerified, setBankVerified] = useState(false);

  // Seller search (admin-only) — selecting a seller loads their dashboard instead of the platform-wide one.
  const {
    userQuery, userSuggestions, userMongoId, setUserSuggestions,
    onQueryChange: onUserQueryChange, selectUser: selectUserSuggestion, clearUser: clearUserFilter,
  } = useUserSearchFilter(isAdminView);

  // Stable ISO strings as primitive deps so useCallback only recreates when dates actually change
  const startISO = filters.dateRange.start.toISOString();
  const endISO   = filters.dateRange.end.toISOString();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const userIdParam = isAdminView && userMongoId ? `&userId=${userMongoId}` : '';
    const dateParams = `?startDate=${startISO}&endDate=${endISO}${userIdParam}`;
    const plainParams = userIdParam ? `?${userIdParam.slice(1)}` : '';
    const [ovRes, insRes, grRes, cdRes, wdRes, crRes, acRes, tsRes, kycRes, agRes, bankRes] =
      await Promise.allSettled([
        apiClient.get(`/dashboard/getDashboardOverview${dateParams}`),
        apiClient.get(`/dashboard/getBusinessInsights${plainParams}`),
        apiClient.get(`/dashboard/getOverviewGraphsData${dateParams}`),
        apiClient.get(`/dashboard/getOverviewCardData${dateParams}`),
        apiClient.get(`/dashboard/getWeightDisputeData${plainParams}`),
        apiClient.get(`/dashboard/getCourierComparison${dateParams}`),
        apiClient.get(`/dashboard/getAdminActionCards${plainParams}`),
        apiClient.get(`/dashboard/topSellersData?startDate=${startISO}&endDate=${endISO}`),
        apiClient.get(`/user/getUserDetails${plainParams}`),
        apiClient.get('/agreement/user/list'),
        apiClient.get('/getKyc/getBankAccount'),
      ]);

    if (ovRes.status  === 'fulfilled') setOverview(ovRes.value.data?.data);
    if (insRes.status === 'fulfilled') setInsights(insRes.value.data?.data);
    if (grRes.status  === 'fulfilled') setGraphs(grRes.value.data?.data);
    if (cdRes.status  === 'fulfilled') setCardData(cdRes.value.data?.data);
    if (wdRes.status  === 'fulfilled') {
      const d = wdRes.value.data;
      setWeightData({ total: d.total || 0, counts: d.counts || {} });
    }
    if (crRes.status  === 'fulfilled') setCouriers(crRes.value.data?.data || []);
    if (acRes.status  === 'fulfilled') setActionCards(acRes.value.data?.data || {});
    if (tsRes.status === 'fulfilled') {
      const rows = tsRes.value.data?.data || [];
      setTopSellers(rows);
      setTopSellersErr(rows.length === 0 ? 'API returned empty array' : '');
    } else {
      const err = (tsRes as any).reason;
      const msg = err?.response?.data?.message || err?.response?.status || err?.message || 'unknown error';
      setTopSellersErr(`API failed: ${msg}`);
    }
    if (kycRes.status === 'fulfilled') {
      const u = kycRes.value.data?.user;
      setKycComplete(u?.kycDone === true);
      setUserDetails(u || null);
    }
    // Verified bank details live in the BankAccount collection (204 + empty body when none), not on the User doc
    if (bankRes.status === 'fulfilled') {
      const b = bankRes.value.data;
      setBankVerified(!!b?.accountNumber && b?.AccountStatus !== 'INVALID');
    }
    if (agRes.status === 'fulfilled') {
      const agreements = agRes.value.data?.agreements || [];
      setContractAccepted(agreements.every((a: any) => a?.isAccepted === true));
    }

    setLoading(false);
  }, [startISO, endISO, isAdminView, userMongoId]);

  // Re-fetch when admin tab changes, date range changes, or the selected seller changes
  useEffect(() => {
    if (!loadingAdminTab) fetchAll();
  }, [fetchAll, adminTab, loadingAdminTab]);

  /* ── derived values ─────────────────────────────────────────────── */
  const ship        = overview?.shipmentStats || {};
  const ndr         = overview?.ndrStats      || {};
  const totalShip   = ship.total    || 0;
  const delivered   = ship.delivered || 0;
  const deliveryPct = totalShip > 0 ? ((delivered / totalShip) * 100).toFixed(1) : '0';

  const monthOrders      = insights?.statsBreakdown?.monthCount    || 0;
  const monthGrowth      = insights?.statsBreakdown?.monthGrowth   || '0';
  const monthValue       = insights?.valueBreakdown?.month?.orderValue  || 0;
  const monthValueGrowth = insights?.valueBreakdown?.month?.valueGrowth || '0';

  /* chart data */
  const courierChartData = (graphs?.couriersSplit || []).map((c: any, i: number) => ({
    name: c.name, value: c.value, color: CHART_COLORS[i % CHART_COLORS.length],
  }));
  void courierChartData;

  const _paymentChartData = (graphs?.paymentMode || []).map((p: any, i: number) => ({
    name: p.name, value: p.value,
    color: (p.name || '').toLowerCase().includes('cod') ? '#00A86B' : '#1D4ED8',
  }));

  const _zoneChartData = (cardData?.ordersByZone || []).map((z: any, i: number) => ({
    name: zoneLabel(z.zone), value: z.percentage, color: ZONE_COLORS[i % ZONE_COLORS.length],
  }));

  const weightChartData = (cardData?.weightSplit || []).map((w: any, i: number) => ({
    name: w.range, value: w.count, color: CHART_COLORS[i % CHART_COLORS.length],
  }));
  void weightChartData; void _zoneChartData;

  /* delivered vs rto vs undelivered */
  const druDelivered   = ship.delivered || 0;
  const druRto         = ship.rto       || 0;
  const druUndelivered = ndr.totalNdr   || 0;
  const druTotal       = druDelivered + druRto + druUndelivered;
  const dPct = druTotal > 0 ? Math.round((druDelivered / druTotal) * 100) : 0;
  const rPct = druTotal > 0 ? Math.round((druRto       / druTotal) * 100) : 0;
  const uPct = druTotal > 0 ? 100 - dPct - rPct : 0; // ensure always sums to 100
  void uPct; void druUndelivered;

  /* pickup & delivery performance (derived from existing shipment data) */
  const pickedUp   = totalShip > 0 ? totalShip - (ship.readyToShip || 0) : 0;
  const notPicked  = ship.readyToShip || 0;
  const pickupRate = totalShip > 0 ? ((pickedUp / totalShip) * 100).toFixed(1) : '0';
  const deliveryRate = totalShip > 0 ? ((delivered / totalShip) * 100).toFixed(1) : '0';
  void pickedUp; void notPicked; void pickupRate; void deliveryRate;

  /* date label */
  const fd = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  /* Onboarding gate — see full logic below. Computed pre-loading so the header
     (which reacts to context, not local component state) knows to hide the
     date filter as soon as this page mounts, not after data finishes loading. */
  // hasAnyOrder = ever placed an order (lifetime). This month's count / the date range alone sent established
  // sellers with no order this month back to the setup screen.
  const hasPlacedOrder = insights?.hasAnyOrder === true || monthOrders > 0 || totalShip > 0;
  const showOnboardingNow = isUserRoute && !isEmployee && !loading && !loadingAdminTab && (!hasPlacedOrder || !kycComplete);
  useEffect(() => {
    setShowOnboarding(showOnboardingNow);
    return () => setShowOnboarding(false);
  }, [showOnboardingNow, setShowOnboarding]);

  /* ── loading ────────────────────────────────────────────────────── */
  if (loading || loadingAdminTab) {
    return (
      <AdminLayout>
        <div className="max-w-[1400px] mx-auto pb-16 min-w-0 overflow-x-hidden">
          <DashboardPageSkeleton isAdminView={!!isAdminView} />
        </div>
      </AdminLayout>
    );
  }

  /* ── Onboarding view ─────────────────────────────────────────────
     User side accounts see the account setup flow instead of the dashboard
     until they've both placed an order AND completed KYC. Employees are
     excluded — they're linked to a parent user whose setup they don't own.
     Order-activity check: lifetime month count (insights is fetched without
     a date filter) OR shipments in the selected range, so an established
     user narrowing to a quiet date range never drops back here. */
  if (showOnboardingNow) {
    return (
      <AdminLayout>
        <UserOnboarding
          status={{
            personalDone:  !!(userDetails?.fullname && userDetails?.phoneNumber),
            kycDone:       userDetails?.kycDone === true,
            bankDone:      bankVerified,
            contractDone:  contractAccepted,
            phoneVerified: userDetails?.isPhoneVerified === true,
            emailVerified: userDetails?.isEmailVerified === true,
          }}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <CardLinksContext.Provider value={!!isAdminView}>
      <div className="max-w-[1400px] mx-auto text-[#0F172A] pb-10 min-w-0 overflow-x-hidden">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 mb-3 lg:mb-4 lg:pt-1">
          <div className="flex items-center justify-between gap-3 lg:contents">
            {/* Mobile — short title with the active range */}
            <div className="lg:hidden min-w-0">
              <p className="text-[15px] font-bold text-[#0F172A] leading-5">My Dashboard</p>
              <p className="text-[11px] font-medium text-[#94A3B8] leading-4 truncate">{fd(filters.dateRange.start)} – {fd(filters.dateRange.end)}</p>
            </div>
            {/* Page title — desktop only (the date range lives in the navbar filter) */}
            <div className="hidden lg:block min-w-0">
              <h1 className="text-[25.0186px] leading-[1.2] font-semibold tracking-[-0.02em] text-[#0F172A] truncate">
                {isUserRoute ? 'Dashboard' : userMongoId ? `${userQuery.split(' (')[0]}'s Dashboard` : 'Platform Dashboard'}
              </h1>
              <p className="mt-1 text-[13px] text-[#64748B]">Orders, shipments and returns at a glance</p>
            </div>

            {/* Below lg the navbar has no date filter — show it here with refresh on the right */}
            {!isAdminView && (
              <div className="lg:hidden flex items-center h-9 rounded-full border border-[#E2E8F0] bg-white shrink-0">
                <MobileDateFilter bare />
                <span className="w-px h-4 bg-[#E2E8F0]" aria-hidden />
                <button
                  type="button"
                  onClick={fetchAll}
                  title="Refresh"
                  aria-label="Refresh dashboard"
                  className="h-9 w-9 rounded-r-full flex items-center justify-center text-[#64748B] active:bg-[#F8FAFC]"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {isAdminView && (
            <div className="flex items-center gap-2 w-full sm:w-auto sm:shrink-0">
              <div className="relative flex-1 min-w-0 sm:flex-none sm:w-[260px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search user..."
                  value={userQuery}
                  onChange={(e) => onUserQueryChange(e.target.value)}
                  className="w-full h-10 pl-10 pr-8 rounded-full border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10 transition-all"
                />
                {userMongoId && (
                  <button onClick={clearUserFilter} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-red-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                {userSuggestions.length > 0 && !userMongoId && (
                  <>
                    <div className="fixed inset-0 z-40 bg-slate-900/10" onClick={() => setUserSuggestions([])} />
                    <div className="absolute left-0 top-full mt-1.5 bg-white border border-[#EEF2F6] rounded-2xl shadow-xl z-50 w-full max-h-60 overflow-y-auto py-1.5">
                      {userSuggestions.map((u) => (
                        <button key={u._id} type="button"
                          onClick={() => selectUserSuggestion(u)}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-[#F0FDF4] flex items-start gap-2 transition-colors">
                          <div className="w-6 h-6 rounded-full bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                            {(u.fullname || u.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-[#0F172A] truncate">{u.fullname || '—'}</div>
                            <div className="text-[10px] text-[#94A3B8] truncate">{u.email}</div>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">{u.userId}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={fetchAll}
                title="Refresh"
                className="w-10 h-10 rounded-full bg-[#00A86B] hover:bg-[#009960] text-white flex items-center justify-center shrink-0 shadow-sm transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>
          )}

          {!isAdminView && (
            <button type="button" onClick={fetchAll} title="Refresh data"
              className="hidden lg:inline-flex items-center gap-2 h-9 px-4 rounded-full border border-[#E2E8F0] bg-white text-[13px] font-medium text-[#475569] hover:text-[#0F172A] hover:border-[#CBD5E1] hover:shadow-sm active:scale-[0.98] transition-all">
              <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
        </div>

        <DashboardTabs value={dashTab} onChange={setDashTab} />

        {/* Cross-fade: content stays mounted (no remount jank, no height jump) under a skeleton overlay that fades out. */}
        <div className="relative">
        <AnimatePresence>
          {showSkeleton && (
            <motion.div key={`sk-${dashTab}`} className="absolute inset-x-0 top-0 z-10 bg-[#F8FAFC]"
              initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
              <DashboardSkeleton tab={dashTab} isAdminView={!!isAdminView} />
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          initial={false}
          animate={showSkeleton ? { opacity: 0, y: 6 } : { opacity: 1, y: 0 }}
          transition={showSkeleton ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          className={showSkeleton ? 'pointer-events-none min-h-[70vh]' : ''}
          aria-busy={showSkeleton}>
        {dashTab === 'shipments' && (
          <>
            <ShipmentsTab ship={ship} fmt={fmt} weightSplit={cardData?.weightSplit || []} couriersSplit={graphs?.couriersSplit || []} courierIcon={courierIcon} />
        {/* ── Row 3: Shipments Details ───────────────────────────────── */}
        <SectionHeading title="Shipments Details" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <MiniStatCard title="Total Shipments"   value={fmtN(ship.total)}           icon={Package}       iconColor="text-blue-500"    iconBg="bg-blue-50"    to={`${navBase}/orders/all${rangeQ}`} className="hidden md:block" />
          <MiniStatCard title="Pending Pickups"   value={fmtN(ship.readyToShip)}     icon={ShoppingCart}  iconColor="text-purple-500"  iconBg="bg-purple-50"  to={`${navBase}/orders/ready-to-ship${rangeQ}`} />
          <MiniStatCard title="In-Transit"        value={fmtN(ship.inTransit)}       icon={RefreshCcw}    iconColor="text-amber-500"   iconBg="bg-amber-50"   to={`${navBase}/orders/in-transit${rangeQ}`} />
          <MiniStatCard title="Out For Delivery"  value={fmtN(ship.outForDelivery)}  icon={Truck}         iconColor="text-emerald-500" iconBg="bg-emerald-50" to={`${navBase}/orders/out-for-delivery${rangeQ}`} />
          <MiniStatCard title="Delivered"         value={fmtN(ship.delivered)}       icon={CheckCircle2}  iconColor="text-purple-400"  iconBg="bg-purple-50"  to={`${navBase}/orders/delivered${rangeQ}`} />
          <MiniStatCard title="Un-Delivered"      value={fmtN(ndr.undelivered)}         icon={AlertTriangle} iconColor="text-rose-500"    iconBg="bg-rose-50"    to={`${navBase}/ndr/undelivered${rangeQ}`} />
          <MiniStatCard title="RTO In-Transit"    value={fmtN(ship.rtoInTransit)}    icon={RotateCcw}     iconColor="text-emerald-500" iconBg="bg-emerald-50" to={`${navBase}/orders/rto-in-transit${allTimeQ}`} />
        </div>
          </>
        )}

        {dashTab === 'summary' && (
          <SummaryTab isAdminView={!!isAdminView} topSellers={topSellers} topSellersErr={topSellersErr} couriers={couriers}
            fmt={fmt} fmtN={fmtN} courierIcon={courierIcon} initials={initials} />
        )}

        {dashTab !== 'overview' && dashTab !== 'shipments' && dashTab !== 'summary' && (
          <div className="rounded-xl border border-dashed border-[#EEF2F6] bg-white py-16 text-center">
            <p className="text-[14px] font-semibold text-[#0F172A]">{DASH_TABS.find(t => t.key === dashTab)?.label} insights are coming soon</p>
            <p className="mt-1 text-[12.5px] text-[#64748B]">For now, everything is available under Overview.</p>
          </div>
        )}

        <div className={dashTab === 'overview' ? '' : 'hidden'}>
        {/* KYC Banner — never shown to employees (they're linked to parent user, not themselves) */}
        {!kycComplete && !isEmployee && (
          <div className="mb-3 bg-amber-50 border border-amber-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-600">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-900">KYC Verification Pending</h4>
                <p className="text-[10px] text-amber-700 font-medium mt-0.5">
                  Complete your KYC to unlock unlimited shipping, instant COD remittance, and secure wallet transfers.
                </p>
              </div>
            </div>
            <Link
              to={isUserRoute ? '/user/profile?tab=kyc' : '/admin/kyc'}
              className="shrink-0 h-9 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              Complete KYC Now <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* ── Row 1: Top Metrics ─────────────────────────────────────── */}
        {/* Parked (removed for now, same logic when re-added):
            Delivery %  → value={`${deliveryPct}%`} icon={Percent} trend="Last 30 days" isUp
                          deliveryPct = delivered / totalShip * 100 (from /dashboard shipment overview)
            Total Orders Value → value={fmt(monthValue)} icon={IndianRupee}
                          trend={`${monthValueGrowth}% vs last month`} isUp={parseFloat(monthValueGrowth) >= 0}
            Avg. Ship Cost → value={fmt(overview?.avgShippingCost)} icon={Truck} trend="Last 30 days" isUp
            Total Shipments (orig. "Total Orders") → value={fmtN(monthOrders)} icon={CheckCircle2}
                          trend={`${monthGrowth}% vs last month`} isUp={parseFloat(monthGrowth) >= 0}
            Total Revenue → value={fmt(overview?.todaysRevenue)} icon={IndianRupee} trend="Last 30 days" isUp */}
        {/* ── Row 1b: Key metrics (seller 5 · admin 6, one row on desktop) ── */}
        <div className={`grid gap-3 mb-3 grid-cols-2 md:grid-cols-3 ${isAdminView ? 'lg:grid-cols-6' : 'lg:grid-cols-5'}`}>
          <StatCardWithTrend
            title="Total Orders" icon={CheckCircle2}
            value={fmtN(monthOrders)}
            trend={`${monthGrowth}% vs last month`}
            isUp={parseFloat(monthGrowth) >= 0}
          />
          <StatCardWithTrend
            title="Total Orders Value" icon={IndianRupee}
            value={fmt(monthValue)}
            trend={`${monthValueGrowth}% vs last month`}
            isUp={parseFloat(monthValueGrowth) >= 0}
          />
          <StatCardWithTrend
            title="Total Revenue" icon={IndianRupee}
            value={fmt(overview?.todaysRevenue)}
            trend="Last 30 days"
          />
          <StatCardWithTrend
            title="Avg. Ship Cost" icon={Truck}
            value={fmt(overview?.avgShippingCost)}
            trend="Last 30 days"
          />
          <StatCardWithTrend
            title="Delivery %" icon={Percent}
            value={`${deliveryPct}%`}
            trend="Last 30 days"
          />
          {isAdminView && (
            <StatCardWithTrend
              title="New Users" icon={Users}
              value={fmtN(actionCards?.newUsers)}
              trend="This month"
            />
          )}
        </div>

        {/* ── Row 2: Action Needed ───────────────────────────────────── */}
        <SectionHeading title="Action Needed" />
        <div className={`grid gap-3 ${isAdminView ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6' : 'grid-cols-2 md:grid-cols-4'}`}>
          <MiniStatCard title="Pickup Delays"
            value={fmtN(overview?.delayStats?.pickupDelays || 0)}
            icon={Clock} iconColor="text-amber-500" iconBg="bg-amber-50"
            to={`${navBase}/orders/ready-to-ship${rangeQ}`}
          />
          <MiniStatCard title="Delayed Deliveries"
            value={fmtN(overview?.delayStats?.delayedDeliveries || 0)}
            icon={AlertTriangle} iconColor="text-rose-500" iconBg="bg-rose-50"
            to={`${navBase}/orders/in-transit${rangeQ}`}
          />
          <MiniStatCard title="Weight Disputes"
            value={fmtN(weightData?.counts?.New || 0)}
            icon={ShieldAlert} iconColor="text-purple-500" iconBg="bg-purple-50"
            to={`${navBase}/weight-discrepancy/pending${allTimeQ}`}
          />
          {isAdminView && (
            <MiniStatCard title="Pending KYC/Docs"
              value={fmtN(actionCards?.pendingKYC)}
              icon={FileText} iconColor="text-blue-500" iconBg="bg-blue-50"
              to="/admin/users?kycStatus=pending"
            />
          )}
          {isAdminView && (
            <MiniStatCard title="Low Balance Sellers"
              value={fmtN(actionCards?.lowBalanceSellers)}
              icon={CreditCard} iconColor="text-red-500" iconBg="bg-red-50"
              to="/admin/users?balanceType=negative"
            />
          )}
          <MiniStatCard title="Pending NDR"
            value={fmtN(ndr?.actionRequired || 0)}
            icon={RotateCcw} iconColor="text-indigo-500" iconBg="bg-indigo-50"
            to={`${navBase}/ndr/action-required${rangeQ}`}
          />
        </div>

        {/* ── Overview analytics ─────────────────────────────────────── */}
        <OverviewInsights
          ship={ship} ndr={ndr} overview={overview}
          zones={(cardData?.ordersByZone || []).map((z: any) => ({ zone: z.zone, label: zoneLabel(z.zone), count: z.count, percentage: z.percentage }))}
          navBase={navBase} rangeQ={rangeQ} fmt={fmt} isAdminView={!!isAdminView}
          paymentMode={graphs?.paymentMode || []}
          codSlot={(
          <div>
                <SectionHeading title="COD Status" rightText="Last 30 days" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStatCard smallIcon title="Total COD"          value={fmt(overview?.codTotal)}        icon={FileText}   iconColor="text-purple-500"  iconBg="bg-purple-50"  to={isAdminView ? `${navBase}/cod/all-cod-orders` : `${navBase}/cod`} />
          <MiniStatCard smallIcon title="Last COD Remitted"  value={fmt(overview?.lastCODRemitted)} icon={RefreshCcw} iconColor="text-emerald-500" iconBg="bg-emerald-50" to={isAdminView ? `${navBase}/cod/seller-cod-remittance` : `${navBase}/cod`} />
          <MiniStatCard smallIcon title="COD Initiated"      value={fmt(overview?.codAvailable)}    icon={FileText}   iconColor="text-sky-500"     iconBg="bg-sky-50"     to={isAdminView ? `${navBase}/cod/all-cod-orders` : `${navBase}/cod`} />
          <MiniStatCard smallIcon title="COD To Be Remitted" value={fmt(overview?.codPending)}      icon={Clock}      iconColor="text-rose-400"    iconBg="bg-rose-50"    to={isAdminView ? `${navBase}/cod/seller-cod-remittance` : `${navBase}/cod`} />
        </div>

          </div>
          )}
        />

        {/* ── Row 4: NDR Details ────────────────────────────────────── */}
        <SectionHeading title="NDR Details" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <MiniStatCard title="Total NDR"        value={fmtN(ndr.totalNdr)}        icon={AlertTriangle} iconColor="text-blue-400"    iconBg="bg-blue-50"    to={`${navBase}/ndr/undelivered${rangeQ}`} />
          <MiniStatCard title="Action Required"  value={fmtN(ndr.actionRequired)}  icon={FileText}      iconColor="text-purple-500"  iconBg="bg-purple-50"  to={`${navBase}/ndr/action-required${rangeQ}`} />
          <MiniStatCard title="Action Requested" value={fmtN(ndr.actionRequested)} icon={Package}       iconColor="text-amber-500"   iconBg="bg-amber-50"   to={`${navBase}/ndr/action-requested${rangeQ}`} />
          <MiniStatCard title="Delivered"        value={fmtN(ndr.ndrDelivered)}    icon={CheckCircle2}  iconColor="text-emerald-500" iconBg="bg-emerald-50" to={`${navBase}/ndr/delivered${rangeQ}`} />
          <MiniStatCard title="RTO Delivered"    value={fmtN(ship.rto)}            icon={RotateCcw}     iconColor="text-indigo-500"  iconBg="bg-indigo-50"  to={`${navBase}/orders/rto-delivered${rangeQ}`} />
        </div>

        {/* ── Row 5: Weight Discrepancy ─────────────────────────────── */}
        <SectionHeading title="Weight Discrepancy Details" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStatCard title="Total Discrepancy"    value={fmtN(weightData.total)}                          icon={AlertTriangle} iconColor="text-teal-500"  iconBg="bg-teal-50"   to={`${navBase}/weight-discrepancy/all${allTimeQ}`} />
          <MiniStatCard title="New Discrepancy"      value={fmtN(weightData.counts?.New || 0)}               icon={FileText}      iconColor="text-amber-500" iconBg="bg-amber-50"  to={`${navBase}/weight-discrepancy/pending${allTimeQ}`} />
          <MiniStatCard title="Accepted Discrepancy" value={fmtN(weightData.counts?.Accepted || 0)}          icon={Package}       iconColor="text-blue-500"  iconBg="bg-blue-50"   to={`${navBase}/weight-discrepancy/complete${allTimeQ}`} />
          <MiniStatCard title="Discrepancy Raised"   value={fmtN(weightData.counts?.DiscrepancyRaised || 0)} icon={AlertTriangle} iconColor="text-rose-500"  iconBg="bg-rose-50"   to={`${navBase}/weight-discrepancy/dispute${allTimeQ}`} />
        </div>

        {/* Row 7 (Couriers Split / Payment Mode / Pickup & Delivery Performance) → moved: courier split + pickup & delivery to Shipments tab, payment mode into OverviewInsights */}

        {/* Row 8 (Zone / Weight / Delivered vs RTO vs Undelivered) → all moved: zone + DRU live in OverviewInsights, weight in Shipments tab */}

        {/* Top Performing Sellers + Couriers Summary → Summary tab (SummaryTab.tsx) */}

        </div>
        </motion.div>
        </div>
      </div>
      </CardLinksContext.Provider>

      {/* ── Wallet Recharge ad — user side only, floating bottom-right, first time per login session ── */}
      {!isAdminView && (
        <AnimatePresence>
          {showWalletAd && (
            <motion.div
              key="wallet-ad"
              initial={{ opacity: 0, y: 56, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.85, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }}
              transition={{ type: 'spring', stiffness: 340, damping: 26, mass: 0.9 }}
              className="fixed bottom-4 right-4 z-[300] w-[320px] max-w-[calc(100vw-32px)]"
              style={{ transformOrigin: 'bottom right' }}
            >
              <motion.div
                whileHover={{ scale: 1.015, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="relative rounded-xl overflow-hidden border border-[#EEF2F6] shadow-[0_12px_40px_-8px_rgba(0,0,0,0.25)] bg-white"
              >
                <motion.button
                  type="button"
                  onClick={() => navigate('/user/wallet?tab=Wallet%20Recharge&recharge=1')}
                  className="block w-full text-left cursor-pointer"
                  aria-label="Recharge your wallet"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35, delay: 0.3 }}
                >
                  <ProtectedAdImage src={walletRechargeAdImg} />
                </motion.button>
                <motion.button
                  onClick={(e) => { e.stopPropagation(); dismissWalletAd(); }}
                  aria-label="Dismiss ad"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, delay: 0.45 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 hover:bg-white shadow-sm border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </AdminLayout>
  );
}
