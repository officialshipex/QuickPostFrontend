import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';
import { useAdminTab } from '../../context/AdminUserContext';
import { useDashboardFilters } from '../../context/DashboardFilterContext';
import { useTableLoader } from '../../hooks/useTableLoader';
import { TableLoader } from '../../components/ui/TableLoader';
import { TruncatedText } from '../../components/ui/TruncatedText';
import {
  RefreshCcw, Package, IndianRupee, Users, CreditCard,
  ShoppingCart, Clock, AlertTriangle, CheckCircle2, RotateCcw,
  ShieldAlert, Truck, FileText, ArrowRight, Percent,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

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
function StatCardWithTrend({ title, value, trend, isUp, isPrimary = false, icon: Icon }: any) {
  if (isPrimary) {
    return (
      <div className="min-w-0 bg-gradient-to-br from-[#00A86B] to-[#007047] rounded-xl p-3 md:p-4 text-white shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="text-[11px] md:text-[12px] font-semibold opacity-90 truncate">{title}</div>
          {Icon && <Icon className="w-4 h-4 opacity-80 shrink-0" />}
        </div>
        <div className="min-w-0">
          <div className="text-lg md:text-2xl font-bold mb-1 truncate">{value}</div>
          <div className="flex items-center gap-1 text-[10px] font-medium opacity-90 truncate">
            {isUp ? '↑' : '↓'} {trend}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-w-0 bg-white rounded-xl border border-[#E2E8F0] p-3 md:p-4 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start gap-2 mb-2">
        <div className="text-[11px] md:text-[12px] font-semibold text-[#64748B] truncate">{title}</div>
        {Icon && <Icon className="w-4 h-4 text-[#94A3B8] shrink-0" />}
      </div>
      <div className="min-w-0">
        <div className="text-lg md:text-2xl font-bold text-[#0F172A] mb-1 truncate">{value}</div>
        <div className={`flex items-center gap-1 text-[10px] font-medium truncate ${isUp ? 'text-green-600' : 'text-red-500'}`}>
          {isUp ? '↑' : '↓'} {trend}
        </div>
      </div>
    </div>
  );
}

function MiniStatCard({ title, value, icon: Icon, iconColor, iconBg }: any) {
  return (
    <div className="min-w-0 bg-white rounded-xl border border-[#E2E8F0] p-2.5 md:p-4 shadow-sm flex items-start justify-between gap-1.5">
      <div className="min-w-0 flex-1">
        <div className="text-[10px] md:text-[11px] font-semibold text-[#64748B] mb-1 leading-tight break-words">{title}</div>
        <div className="text-sm md:text-xl font-bold text-[#0F172A] truncate">{value}</div>
      </div>
      {Icon && (
        <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${iconColor}`} />
        </div>
      )}
    </div>
  );
}

function SectionHeading({ title, rightText }: any) {
  return (
    <div className="flex justify-between items-center mt-6 mb-3">
      <h3 className="text-[13px] font-bold text-[#0F172A]">{title}</h3>
      {rightText && <span className="text-[11px] font-medium text-[#94A3B8]">{rightText}</span>}
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
  const { isAdmin, adminTab, loadingAdminTab } = useAdminTab();
  const { filters } = useDashboardFilters();
  const isAdminView = isAdmin && adminTab;
  const location = useLocation();
  const isUserRoute = location.pathname === '/user/dashboard';

  const { isLoading: loading, setIsLoading: setLoading } = useTableLoader(0);
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

  // Stable ISO strings as primitive deps so useCallback only recreates when dates actually change
  const startISO = filters.dateRange.start.toISOString();
  const endISO   = filters.dateRange.end.toISOString();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const dateParams = `?startDate=${startISO}&endDate=${endISO}`;
    const [ovRes, insRes, grRes, cdRes, wdRes, crRes, acRes, tsRes, kycRes] =
      await Promise.allSettled([
        apiClient.get(`/dashboard/getDashboardOverview${dateParams}`),
        apiClient.get('/dashboard/getBusinessInsights'),
        apiClient.get(`/dashboard/getOverviewGraphsData${dateParams}`),
        apiClient.get(`/dashboard/getOverviewCardData${dateParams}`),
        apiClient.get('/dashboard/getWeightDisputeData'),
        apiClient.get(`/dashboard/getCourierComparison${dateParams}`),
        apiClient.get('/dashboard/getAdminActionCards'),
        apiClient.get('/dashboard/topSellersData'),
        apiClient.get('/user/getUserDetails'),
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
    if (kycRes.status === 'fulfilled') setKycComplete(kycRes.value.data?.user?.kycDone === true);

    setLoading(false);
  }, [startISO, endISO]);

  // Re-fetch when admin tab changes or date range changes
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
  const maxCourierVal = Math.max(...courierChartData.map((c: any) => c.value), 1);

  const paymentChartData = (graphs?.paymentMode || []).map((p: any, i: number) => ({
    name: p.name, value: p.value,
    color: (p.name || '').toLowerCase().includes('cod') ? '#00A86B' : '#1D4ED8',
  }));

  const zoneChartData = (cardData?.ordersByZone || []).map((z: any, i: number) => ({
    name: zoneLabel(z.zone), value: z.percentage, color: ZONE_COLORS[i % ZONE_COLORS.length],
  }));

  const weightChartData = (cardData?.weightSplit || []).map((w: any, i: number) => ({
    name: w.range, value: w.count, color: CHART_COLORS[i % CHART_COLORS.length],
  }));
  const maxWeightVal = Math.max(...weightChartData.map((w: any) => w.value), 1);

  /* delivered vs rto vs undelivered */
  const druDelivered   = ship.delivered || 0;
  const druRto         = ship.rto       || 0;
  const druUndelivered = ndr.totalNdr   || 0;
  const druTotal       = druDelivered + druRto + druUndelivered;
  const dPct = druTotal > 0 ? Math.round((druDelivered / druTotal) * 100) : 0;
  const rPct = druTotal > 0 ? Math.round((druRto       / druTotal) * 100) : 0;
  const uPct = druTotal > 0 ? 100 - dPct - rPct : 0; // ensure always sums to 100

  /* pickup & delivery performance (derived from existing shipment data) */
  const pickedUp   = totalShip > 0 ? totalShip - (ship.readyToShip || 0) : 0;
  const notPicked  = ship.readyToShip || 0;
  const pickupRate = totalShip > 0 ? ((pickedUp / totalShip) * 100).toFixed(1) : '0';
  const deliveryRate = totalShip > 0 ? ((delivered / totalShip) * 100).toFixed(1) : '0';

  /* date label */
  const fd = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  /* ── loading ────────────────────────────────────────────────────── */
  if (loading || loadingAdminTab) {
    return (
      <AdminLayout>
        <div className="max-w-[1400px] mx-auto pb-16">
          <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
            <div className="relative w-32 h-32">
              <TableLoader />
            </div>
            <p className="text-sm font-bold text-[#0F172A]">Loading your dashboard</p>
            <p className="text-xs text-slate-400">Just a moment while we fetch the latest data…</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto text-[#0F172A] pb-10 min-w-0 overflow-x-hidden">

        {/* Header */}
        <div className="flex items-center gap-2 mb-4 text-[11px] font-medium text-[#64748B]">
          {isUserRoute ? 'My Dashboard' : 'Platform Dashboard'}
          {' — '}{filters.dateRange.label} ({fd(filters.dateRange.start)} – {fd(filters.dateRange.end)})
          <RefreshCcw
            className="w-3 h-3 cursor-pointer hover:text-[#0F172A] transition-colors"
            onClick={fetchAll}
          />
        </div>

        {/* KYC Banner */}
        {!kycComplete && (
          <div className="mb-6 bg-amber-50 border border-amber-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
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
              to="/admin/kyc"
              className="shrink-0 h-9 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              Complete KYC Now <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* ── Row 1: Top Metrics ─────────────────────────────────────── */}
        <div className={`grid gap-3 mb-6 ${isAdminView ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'}`}>
          <StatCardWithTrend
            title="Total Orders" isPrimary icon={CheckCircle2}
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
            trend="Last 30 days" isUp={true}
          />
          <StatCardWithTrend
            title="Avg. Ship Cost" icon={Truck}
            value={fmt(overview?.avgShippingCost)}
            trend="Last 30 days" isUp={true}
          />
          <StatCardWithTrend
            title="Delivery %" icon={Percent}
            value={`${deliveryPct}%`}
            trend="Last 30 days" isUp={true}
          />
          {isAdminView && (
            <StatCardWithTrend
              title="New Users" icon={Users}
              value={fmtN(actionCards?.newUsers)}
              trend="This month" isUp={true}
            />
          )}
        </div>

        {/* ── Row 2: Action Needed ───────────────────────────────────── */}
        <SectionHeading title="Action Needed" />
        <div className={`grid gap-3 ${isAdminView ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6' : 'grid-cols-2 md:grid-cols-4'}`}>
          <MiniStatCard title="Pickup Delays"
            value={fmtN(overview?.delayStats?.pickupDelays || 0)}
            icon={Clock} iconColor="text-amber-500" iconBg="bg-amber-50"
          />
          <MiniStatCard title="Delayed Deliveries"
            value={fmtN(overview?.delayStats?.delayedDeliveries || 0)}
            icon={AlertTriangle} iconColor="text-rose-500" iconBg="bg-rose-50"
          />
          <MiniStatCard title="Weight Disputes"
            value={fmtN(weightData?.counts?.New || 0)}
            icon={ShieldAlert} iconColor="text-purple-500" iconBg="bg-purple-50"
          />
          {isAdminView && (
            <MiniStatCard title="Pending KYC/Docs"
              value={fmtN(actionCards?.pendingKYC)}
              icon={FileText} iconColor="text-blue-500" iconBg="bg-blue-50"
            />
          )}
          {isAdminView && (
            <MiniStatCard title="Low Balance Sellers"
              value={fmtN(actionCards?.lowBalanceSellers)}
              icon={CreditCard} iconColor="text-red-500" iconBg="bg-red-50"
            />
          )}
          <MiniStatCard title="Pending NDR"
            value={fmtN(ndr?.actionRequired || 0)}
            icon={RotateCcw} iconColor="text-indigo-500" iconBg="bg-indigo-50"
          />
        </div>

        {/* ── Row 3: Shipments Details ───────────────────────────────── */}
        <SectionHeading title="Shipments Details" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <MiniStatCard title="Total Shipments"   value={fmtN(ship.total)}           icon={Package}       iconColor="text-blue-500"    iconBg="bg-blue-50" />
          <MiniStatCard title="Pending Pickups"   value={fmtN(ship.readyToShip)}     icon={ShoppingCart}  iconColor="text-purple-500"  iconBg="bg-purple-50" />
          <MiniStatCard title="In-Transit"        value={fmtN(ship.inTransit)}       icon={RefreshCcw}    iconColor="text-amber-500"   iconBg="bg-amber-50" />
          <MiniStatCard title="Out For Delivery"  value={fmtN(ship.outForDelivery)}  icon={Truck}         iconColor="text-emerald-500" iconBg="bg-emerald-50" />
          <MiniStatCard title="Delivered"         value={fmtN(ship.delivered)}       icon={CheckCircle2}  iconColor="text-purple-400"  iconBg="bg-purple-50" />
          <MiniStatCard title="Un-Delivered"      value={fmtN(ndr.totalNdr)}         icon={AlertTriangle} iconColor="text-rose-500"    iconBg="bg-rose-50" />
          <MiniStatCard title="RTO In-Transit"    value={fmtN(ship.rtoInTransit)}    icon={RotateCcw}     iconColor="text-emerald-500" iconBg="bg-emerald-50" />
        </div>

        {/* ── Row 4: NDR Details ────────────────────────────────────── */}
        <SectionHeading title="NDR Details" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <MiniStatCard title="Total NDR"        value={fmtN(ndr.totalNdr)}        icon={AlertTriangle} iconColor="text-blue-400"    iconBg="bg-blue-50" />
          <MiniStatCard title="Action Required"  value={fmtN(ndr.actionRequired)}  icon={FileText}      iconColor="text-purple-500"  iconBg="bg-purple-50" />
          <MiniStatCard title="Action Requested" value={fmtN(ndr.actionRequested)} icon={Package}       iconColor="text-amber-500"   iconBg="bg-amber-50" />
          <MiniStatCard title="Delivered"        value={fmtN(ndr.ndrDelivered)}    icon={CheckCircle2}  iconColor="text-emerald-500" iconBg="bg-emerald-50" />
          <MiniStatCard title="RTO Delivered"    value={fmtN(ship.rto)}            icon={RotateCcw}     iconColor="text-indigo-500"  iconBg="bg-indigo-50" />
        </div>

        {/* ── Row 5: Weight Discrepancy ─────────────────────────────── */}
        <SectionHeading title="Weight Discrepancy Details" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStatCard title="Total Discrepancy"    value={fmtN(weightData.total)}                         icon={AlertTriangle} iconColor="text-teal-500"   iconBg="bg-teal-50" />
          <MiniStatCard title="New Discrepancy"      value={fmtN(weightData.counts?.New || 0)}              icon={FileText}      iconColor="text-amber-500"  iconBg="bg-amber-50" />
          <MiniStatCard title="Accepted Discrepancy" value={fmtN(weightData.counts?.Accepted || 0)}         icon={Package}       iconColor="text-blue-500"   iconBg="bg-blue-50" />
          <MiniStatCard title="Discrepancy Raised"   value={fmtN(weightData.counts?.DiscrepancyRaised || 0)} icon={AlertTriangle} iconColor="text-rose-500"   iconBg="bg-rose-50" />
        </div>

        {/* ── Row 6: COD Status ─────────────────────────────────────── */}
        <SectionHeading title="COD Status" rightText="Last 30 days" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStatCard title="Total COD"          value={fmt(overview?.codTotal)}          icon={FileText}  iconColor="text-purple-500"  iconBg="bg-purple-50" />
          <MiniStatCard title="Last COD Remitted"  value={fmt(overview?.lastCODRemitted)}   icon={RefreshCcw} iconColor="text-emerald-500" iconBg="bg-emerald-50" />
          <MiniStatCard title="COD Initiated"      value={fmt(overview?.codAvailable)}      icon={FileText}  iconColor="text-sky-500"     iconBg="bg-sky-50" />
          <MiniStatCard title="COD To Be Remitted" value={fmt(overview?.codPending)}        icon={Clock}     iconColor="text-rose-400"    iconBg="bg-rose-50" />
        </div>

        {/* ── Row 7: Charts Row 1 ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-6">

          {/* Couriers Split */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm">
            <h4 className="text-[12px] font-bold mb-4">Couriers Split</h4>
            {courierChartData.length > 0 ? (
              <div className="flex flex-col gap-3">
                {courierChartData.map((d: any, i: number) => (
                  <BarRow key={i} name={d.name} value={d.value} maxValue={maxCourierVal} color={d.color} />
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-[#94A3B8] text-center py-6">No shipment data yet</p>
            )}
          </div>

          {/* Payment Mode */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm flex flex-col">
            <h4 className="text-[12px] font-bold mb-4">Payment Mode</h4>
            {paymentChartData.length > 0 ? (
              <div className="flex-1 flex items-center justify-center gap-8 min-w-0">
                <div className="w-32 h-32 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={paymentChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={55} dataKey="value" stroke="none">
                        {paymentChartData.map((d: any, i: number) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '10px', padding: '4px 8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-4 min-w-0">
                  {paymentChartData.map((d: any, i: number) => (
                    <div key={i} className="min-w-0">
                      <div className="text-[11px] font-bold truncate" style={{ color: d.color }}>{d.name}</div>
                      <div className="text-[11px] font-bold text-[#64748B] mt-0.5 border-b border-gray-200 pb-1 truncate">{d.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-[#94A3B8] text-center py-6">No payment data yet</p>
            )}
          </div>

          {/* Pickup & Delivery Performance */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm flex flex-col">
            <h4 className="text-[12px] font-bold mb-4">Pickup & Delivery Performance</h4>
            <div className="flex-1 grid grid-cols-2 gap-px bg-[#E2E8F0] border border-[#E2E8F0] rounded-lg overflow-hidden">
              {[
                { label: 'Shipments Picked Up', value: fmtN(pickedUp),   green: true },
                { label: 'Delivery Rate',        value: `${deliveryRate}%`, green: true },
                { label: 'Not Yet Picked',       value: fmtN(notPicked),  green: false },
                { label: 'Pickup Rate',          value: `${pickupRate}%`, green: false },
              ].map((item, i) => (
                <div key={i} className="bg-white p-4 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.green ? 'bg-teal-50 text-teal-600' : 'bg-amber-50 text-amber-500'}`}>
                    {item.green ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#0F172A]">{item.value}</div>
                    <div className="text-[10px] font-semibold text-[#64748B]">{item.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 8: Charts Row 2 ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">

          {/* Zone Distribution */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm flex flex-col">
            <h4 className="text-[12px] font-bold mb-4">Shipments by Zone</h4>
            {zoneChartData.length > 0 ? (
              <div className="flex-1 flex items-center justify-between gap-2">
                <div className="w-24 h-24 relative flex items-center justify-center shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={zoneChartData} cx="50%" cy="50%" innerRadius={28} outerRadius={42} dataKey="value" stroke="none">
                        {zoneChartData.map((d: any, i: number) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '10px', padding: '4px 8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="text-[8px] font-semibold text-[#64748B]">Zone</div>
                    <div className="text-[8px] font-semibold text-[#64748B]">Split</div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-1 pl-2">
                  {zoneChartData.map((d: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-[10px]">
                      <div className="font-semibold" style={{ color: d.color }}>{d.name}</div>
                      <div className="font-bold text-[#0F172A]">{d.value}%</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-[#94A3B8] text-center py-6">No zone data yet</p>
            )}
          </div>

          {/* Weight Split */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm">
            <h4 className="text-[12px] font-bold mb-4">Shipment Split by Weight</h4>
            {weightChartData.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {weightChartData.map((d: any, i: number) => (
                  <BarRow key={i} name={d.name} value={d.value} maxValue={maxWeightVal} color={d.color} />
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-[#94A3B8] text-center py-6">No weight data yet</p>
            )}
          </div>

          {/* Delivered vs RTO vs Undelivered */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm flex flex-col justify-between">
            <h4 className="text-[12px] font-bold mb-4">Delivered vs RTO vs Undelivered</h4>
            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <div className="text-[10px] font-semibold text-[#64748B] mb-1">Delivered</div>
                <div className="text-xl font-bold text-[#0F172A]">{fmtN(druDelivered)}</div>
                <div className="text-[10px] font-semibold text-[#64748B] mt-1">{dPct}%</div>
              </div>
              <div className="text-[10px] text-[#94A3B8] font-medium">vs</div>
              <div className="text-center">
                <div className="text-[10px] font-semibold text-[#64748B] mb-1">RTO</div>
                <div className="text-xl font-bold text-[#0F172A]">{fmtN(druRto)}</div>
                <div className="text-[10px] font-semibold text-[#64748B] mt-1">{rPct}%</div>
              </div>
              <div className="text-[10px] text-[#94A3B8] font-medium">vs</div>
              <div className="text-center">
                <div className="text-[10px] font-semibold text-[#64748B] mb-1">Undelivered</div>
                <div className="text-xl font-bold text-[#0F172A]">{fmtN(druUndelivered)}</div>
                <div className="text-[10px] font-semibold text-[#64748B] mt-1">{uPct}%</div>
              </div>
            </div>
            <div className="flex items-center gap-0.5 rounded-full overflow-hidden h-2">
              <div className="h-full bg-[#1D4ED8] transition-all" style={{ width: `${dPct}%` }} />
              <div className="h-full bg-[#00A86B] transition-all" style={{ width: `${rPct}%` }} />
              <div className="h-full bg-[#F1F5F9] flex-1" />
            </div>
            <div className="flex items-center gap-4 mt-2 text-[9px] font-semibold text-[#64748B]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#1D4ED8] inline-block" />Delivered</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00A86B] inline-block" />RTO</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#F1F5F9] border inline-block" />Undelivered</span>
            </div>
          </div>
        </div>

        {/* ── Top Performing Sellers (admin view only) ──────────────── */}
        {isAdminView && (
          <>
            <h3 className="text-[13px] font-bold text-[#0F172A] mt-6 mb-3">Top Performing Sellers</h3>

            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden overflow-x-auto mb-6">
              <table className="w-full text-left border-collapse min-w-[960px]">
                <thead>
                  <tr className="bg-[#E6F9F2] border-b border-[#E2E8F0] text-[12px] uppercase tracking-wider font-medium text-[#64748B]">
                    <th className="p-3 pl-4 w-8">#</th>
                    <th className="p-3">Seller Details</th>
                    <th className="p-3 text-center">Total Orders</th>
                    <th className="p-3 text-center">Revenue</th>
                    <th className="p-3 text-center">Delivery Rate</th>
                    <th className="p-3 text-center">COD Amount</th>
                    <th className="p-3 text-center">RTO Rate</th>
                    <th className="p-3 text-center">Wallet Balance</th>
                  </tr>
                </thead>
                <tbody className="text-[10px] font-semibold text-[#475569]">
                  {topSellers.length > 0 ? topSellers.map((s, i) => {
                    const rto = parseFloat(s.rtoRate || '0');
                    const rtoColor = rto < 5 ? 'text-emerald-600 bg-emerald-50' : rto < 15 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';
                    const delivery = parseFloat(s.deliveryRate || '0');
                    const deliveryColor = delivery >= 80 ? 'text-emerald-600 bg-emerald-50' : delivery >= 50 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';
                    const rankColors = ['bg-yellow-400 text-white', 'bg-slate-400 text-white', 'bg-amber-600 text-white'];
                    return (
                      <tr key={i} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                        <td className="p-3 pl-4">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${rankColors[i] || 'bg-[#E2E8F0] text-[#475569]'}`}>
                            {i + 1}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {s.profileImage ? (
                              <img src={s.profileImage} alt={s.name} className="w-9 h-9 rounded-full object-cover shrink-0 border border-[#E2E8F0]" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-[#E6F5F1] text-[#00A86B] flex items-center justify-center shrink-0 font-bold text-xs border border-[#00A86B]/20">
                                {initials(s.name)}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-[#0F172A] text-[14px] leading-tight">{s.name}</div>
                              <div className="text-[12px] text-[#94A3B8] font-normal mt-0.5">{s.company !== '—' ? s.company : s.email}</div>
                              {s.company !== '—' && <div className="text-[12px] text-[#CBD5E1] font-normal mt-0.5">{s.email}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center text-[#0F172A] font-normal text-[13px]">{fmtN(s.totalOrders)}</td>
                        <td className="p-3 text-center text-emerald-600 font-normal text-[13px]">{fmt(s.totalRevenue)}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[13px] font-normal ${deliveryColor}`}>{s.deliveryRate}%</span>
                        </td>
                        <td className="p-3 text-center text-[#0F172A] font-normal text-[13px]">{fmt(s.codAmount)}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[13px] font-normal ${rtoColor}`}>{s.rtoRate}%</span>
                        </td>
                        <td className="p-3 text-center font-normal text-[#00A86B] text-[13px]">{fmt(s.walletBalance)}</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-[12px]">
                        {topSellersErr
                          ? <span className="text-red-500 font-medium">{topSellersErr}</span>
                          : <span className="text-[#94A3B8]">No seller data available</span>}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3 mb-6">
              {topSellers.length > 0 ? topSellers.map((s, i) => {
                const rto = parseFloat(s.rtoRate || '0');
                const rtoColor = rto < 5 ? 'text-emerald-600 bg-emerald-50' : rto < 15 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';
                const delivery = parseFloat(s.deliveryRate || '0');
                const deliveryColor = delivery >= 80 ? 'text-emerald-600 bg-emerald-50' : delivery >= 50 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';
                const rankColors = ['bg-yellow-400 text-white', 'bg-slate-400 text-white', 'bg-amber-600 text-white'];
                return (
                  <div key={i} className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${rankColors[i] || 'bg-[#E2E8F0] text-[#475569]'}`}>
                        {i + 1}
                      </div>
                      {s.profileImage ? (
                        <img src={s.profileImage} alt={s.name} className="w-9 h-9 rounded-full object-cover shrink-0 border border-[#E2E8F0]" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#E6F5F1] text-[#00A86B] flex items-center justify-center shrink-0 font-bold text-xs border border-[#00A86B]/20">
                          {initials(s.name)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[#0F172A] text-[14px] leading-tight truncate">{s.name}</div>
                        {s.company !== '—' && (
                          <TruncatedText text={s.company} maxLength={20} className="text-[12px] text-[#94A3B8] font-normal mt-0.5" />
                        )}
                        <TruncatedText text={s.email} maxLength={22} className="text-[12px] text-[#CBD5E1] font-normal mt-0.5" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#F1F5F9]">
                      <div className="min-w-0">
                        <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider truncate">Orders</div>
                        <div className="text-[13px] font-normal text-[#0F172A] truncate mt-0.5">{fmtN(s.totalOrders)}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider truncate">Revenue</div>
                        <div className="text-[13px] font-normal text-emerald-600 truncate mt-0.5">{fmt(s.totalRevenue)}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider truncate">COD</div>
                        <div className="text-[13px] font-normal text-[#0F172A] truncate mt-0.5">{fmt(s.codAmount)}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-normal ${deliveryColor}`}>Delivery {s.deliveryRate}%</span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-normal ${rtoColor}`}>RTO {s.rtoRate}%</span>
                      <span className="ml-auto text-[12px] font-normal text-[#00A86B] shrink-0">{fmt(s.walletBalance)}</span>
                    </div>
                  </div>
                );
              }) : (
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 text-center text-[12px]">
                  {topSellersErr
                    ? <span className="text-red-500 font-medium">{topSellersErr}</span>
                    : <span className="text-[#94A3B8]">No seller data available</span>}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Couriers Summary ──────────────────────────────────────── */}
        <h3 className="text-[13px] font-bold text-[#0F172A] mt-6 mb-3">Couriers Summary</h3>

        {/* Desktop table */}
        <div className="hidden md:block bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-[#E6F9F2] border-b border-[#E2E8F0] text-[12px] uppercase tracking-wider font-medium text-[#166534]">
                <th className="p-3 pl-4">Courier</th>
                <th className="p-3 text-center">Shipments</th>
                <th className="p-3 text-center">COD</th>
                <th className="p-3 text-center">Prepaid</th>
                <th className="p-3 text-center">Delivered</th>
                <th className="p-3 text-center">NDR Delivered</th>
                <th className="p-3 text-center">NDR Raised</th>
                <th className="p-3 text-center">RTO</th>
                <th className="p-3 text-center">Lost/Damaged</th>
                <th className="p-3 text-center">Zone A</th>
                <th className="p-3 text-center">Zone B</th>
                <th className="p-3 text-center">Zone C</th>
                <th className="p-3 text-center">Zone D</th>
                <th className="p-3 text-center">Zone E</th>
              </tr>
            </thead>
            <tbody className="text-[10px] font-semibold text-[#475569]">
              {couriers.length > 0 ? couriers.map((c, i) => {
                const icon = courierIcon(c.courier);
                return (
                  <tr key={i} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                    <td className="p-3 pl-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#E2E8F0] p-1 overflow-hidden">
                          {icon
                            ? <img src={icon} alt={c.courier} className="w-full h-full object-contain" />
                            : <span className="text-[10px] font-bold text-[#475569]">{initials(c.courier)}</span>
                          }
                        </div>
                        <div>
                          <div className="font-semibold text-[#0F172A] text-[14px] leading-tight">{c.courier}</div>
                          <div className="text-[12px] text-[#94A3B8] font-normal mt-0.5">{c.courierServiceName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center text-[13px] font-normal text-[#0F172A]">{c.shipmentCount ?? '—'}</td>
                    <td className="p-3 text-center text-[13px] font-normal text-[#0F172A]">{c.codOrders ?? '—'}</td>
                    <td className="p-3 text-center text-[13px] font-normal text-[#0F172A]">{c.prepaidOrders ?? '—'}</td>
                    <td className="p-3 text-center text-[13px] font-normal text-[#0F172A]">{c.delivered ?? '—'}</td>
                    <td className="p-3 text-center text-[13px] font-normal text-[#0F172A]">{c.ndrDelivered ?? '—'}</td>
                    <td className="p-3 text-center text-[13px] font-normal text-[#94A3B8]">{c.ndrRaised ?? '—'}</td>
                    <td className="p-3 text-center text-[13px] font-normal text-[#94A3B8]">{c.rto ?? '—'}</td>
                    <td className="p-3 text-center text-[13px] font-normal text-[#94A3B8]">{c['Lost/Damaged'] ?? '—'}</td>
                    <td className="p-3 text-center text-[13px] font-normal text-[#0F172A]">{c['Zone A'] ?? 0}</td>
                    <td className="p-3 text-center text-[13px] font-normal text-[#0F172A]">{c['Zone B'] ?? 0}</td>
                    <td className="p-3 text-center text-[13px] font-normal text-[#0F172A]">{c['Zone C'] ?? 0}</td>
                    <td className="p-3 text-center text-[13px] font-normal text-[#0F172A]">{c['Zone D'] ?? 0}</td>
                    <td className="p-3 text-center text-[13px] font-normal text-[#0F172A]">{c['Zone E'] ?? 0}</td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={14} className="p-8 text-center text-[#94A3B8] text-[12px]">
                    No courier data for the last 30 days
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {couriers.length > 0 ? couriers.map((c, i) => {
            const icon = courierIcon(c.courier);
            return (
              <div key={i} className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#E2E8F0] p-1 overflow-hidden">
                    {icon
                      ? <img src={icon} alt={c.courier} className="w-full h-full object-contain" />
                      : <span className="text-[10px] font-bold text-[#475569]">{initials(c.courier)}</span>
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[#0F172A] text-[14px] leading-tight truncate">{c.courier}</div>
                    <div className="text-[12px] text-[#94A3B8] font-normal mt-0.5 truncate">{c.courierServiceName}</div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-x-2 gap-y-3 mt-3 pt-3 border-t border-[#F1F5F9]">
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider truncate">Shipments</div>
                    <div className="text-[13px] font-normal text-[#0F172A] truncate mt-0.5">{c.shipmentCount ?? '—'}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider truncate">COD</div>
                    <div className="text-[13px] font-normal text-[#0F172A] truncate mt-0.5">{c.codOrders ?? '—'}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider truncate">Prepaid</div>
                    <div className="text-[13px] font-normal text-[#0F172A] truncate mt-0.5">{c.prepaidOrders ?? '—'}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider truncate">Delivered</div>
                    <div className="text-[13px] font-normal text-[#0F172A] truncate mt-0.5">{c.delivered ?? '—'}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider truncate">NDR Delvd</div>
                    <div className="text-[13px] font-normal text-[#0F172A] truncate mt-0.5">{c.ndrDelivered ?? '—'}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider truncate">NDR Raised</div>
                    <div className="text-[13px] font-normal text-[#94A3B8] truncate mt-0.5">{c.ndrRaised ?? '—'}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider truncate">RTO</div>
                    <div className="text-[13px] font-normal text-[#94A3B8] truncate mt-0.5">{c.rto ?? '—'}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider truncate">Lost/Dmgd</div>
                    <div className="text-[13px] font-normal text-[#94A3B8] truncate mt-0.5">{c['Lost/Damaged'] ?? '—'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-x-2 mt-3 pt-3 border-t border-[#F1F5F9]">
                  {(['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E'] as const).map((zone) => (
                    <div key={zone} className="min-w-0 text-center">
                      <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider truncate">{zone.replace('Zone ', 'Z')}</div>
                      <div className="text-[13px] font-normal text-[#0F172A] truncate mt-0.5">{c[zone] ?? 0}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }) : (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 text-center text-[#94A3B8] text-[12px]">
              No courier data for the last 30 days
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
