import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { useAdminTab } from '../../context/AdminUserContext';
import { apiClient } from '../../services/apiClient';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Download, Calendar, ChevronDown, ChevronLeft, Users, Truck, IndianRupee,
  Package, RotateCcw, AlertTriangle, CheckCircle2, Clock, Search, Wallet,
  FileText, ShieldAlert, UserCheck, CreditCard, X, RefreshCw, Send,
  TrendingUp, TrendingDown, Scale, Settings, Mail, Hash, MapPin, Phone, Crown, Copy,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TruncatedText } from '../../components/ui/TruncatedText';
import { EmptyState } from '../../components/ui/EmptyState';
import { TableLoader } from '../../components/ui/TableLoader';
import { DesktopPagination, usePagination } from '../../hooks/usePagination';
import { MobilePaginationBar } from '../../hooks/useMobilePaginationBar';
import { getTier, getTierBadgeClass } from '../../hooks/useTier';
import { getCourierLogo } from '../../utils/courierLogo';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SellerSummary {
  _id: string; userId?: number; fullname: string; email: string; phoneNumber?: string;
  company?: string; kycDone?: boolean; joinedAt?: string;
  totalOrders: number; delivered: number; rto: number; ndr: number; cancelled: number;
  totalBilled: number; codOrders: number; prepaidOrders: number; walletBalance: number;
  deliveryRate: number; rtoRate: number; ndrRate: number;
}
interface SellerDetail extends SellerSummary {
  inTransit: number; freightTotal: number; codCharges: number; gstTotal: number;
  codAmount: number; gstTotal2?: number;
  couriers: CourierItem[]; recentTransactions: TxnItem[];
  // Not guaranteed by the API yet — render with a fallback until the backend adds them.
  plan?: string; status?: string; enabled?: boolean;
  gstin?: string; city?: string; state?: string;
  avgOrderValue?: number; avgDeliveryDays?: number;
}
interface CourierItem {
  name: string; shipments: number; delivered: number; rto: number; ndr: number;
  billed: number; deliveryRate: number; rtoRate: number;
  totalShipments?: number; totalBilled?: number; inTransit?: number;
  statusBreakdown?: { name: string; value: number }[];
  codShipments?: number; prepaidShipments?: number;
}
interface TxnItem {
  _id?: string; channelOrderId?: string; category: 'credit' | 'debit';
  amount: number; balanceAfterTransaction?: number; description?: string; date: string; awb_number?: string;
}
interface PlatformSummary {
  totalSellers: number; kycVerified: number; totalOrders: number;
  delivered: number; rto: number; ndr: number; cancelled: number; inTransit: number;
  totalBilled: number; codOrders: number; prepaidOrders: number; codAmount: number;
  deliveryRate: number; rtoRate: number; ndrRate: number;
  topRevenueSellers: { name: string; value: number }[];
  topRtoSellers: { name: string; value: number }[];
}
interface MisReport {
  _id: string; reportType: string; dateFilterType?: string; fromDate: string; toDate: string;
  email?: string; status: 'pending' | 'completed' | 'failed'; downloadUrl?: string;
  createdAt: string; selectedDescriptions?: string[];
  user?: { _id: string; userId?: number; fullname?: string; email?: string };
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PIE_COLORS = ['#00A86B', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316'];
const STATUS_COLORS: Record<string, string> = { Delivered: '#00A86B', 'In Transit': '#3B82F6', RTO: '#EF4444', NDR: '#F59E0B' };
const DATE_RANGES = ['Last 7 Days', 'Last 30 Days', 'Last 3 Months', 'Last 6 Months', 'This Year'];
const REPORT_TYPES = ['All', 'Delivered', 'RTO', 'Canceled', 'Pending Order', 'Passbook'];
const DATE_FILTER_TYPES = ['Pickup Date', 'AWB Assigned Date'];
const PASSBOOK_DESCS = [
  'Freight Charges Applied', 'Freight Charges Received', 'Auto-accepted Weight Dispute charge',
  'Weight Dispute Charges Applied', 'COD Charges Received', 'RTO Freight Charges Applied',
  'Cancellation Refund', 'Recharge From Gateway(Razorpay)', 'Referral Commission Received',
];

const fc = (v: number) => `₹${(v || 0).toLocaleString('en-IN')}`;
const fn = (v: number) => (v || 0).toLocaleString('en-IN');
const fmtDate = (d?: string) => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const fmtDateTime = (d?: string) => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

// ─── GenerateReportModal ──────────────────────────────────────────────────────
function GenerateReportModal({ open, onClose, prefillUserId, prefillUserName, isAdminView }: {
  open: boolean; onClose: () => void;
  prefillUserId?: string | null; prefillUserName?: string;
  isAdminView: boolean;
}) {
  const [reportType, setReportType]         = useState('All');
  const [dateFilterType, setDateFilterType] = useState('Pickup Date');
  const [fromDate, setFromDate]             = useState('');
  const [toDate, setToDate]                 = useState('');
  const [email, setEmail]                   = useState('');
  const [descs, setDescs]                   = useState<string[]>([]);
  const [descOpen, setDescOpen]             = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const [result, setResult]                 = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (open) {
      setReportType('All'); setDateFilterType('Pickup Date'); setFromDate(''); setToDate('');
      setEmail(''); setDescs([]); setResult(null);
    }
  }, [open]);

  const toggleDesc = (d: string) =>
    setDescs(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const handleGenerate = async () => {
    if (!fromDate || !toDate) { setResult({ ok: false, text: 'From date and to date are required' }); return; }
    setSubmitting(true); setResult(null);
    try {
      const body: any = {
        reportType,
        dateFilterType: reportType === 'Passbook' ? 'Transaction Date' : dateFilterType,
        fromDate: new Date(fromDate).toISOString(),
        toDate: new Date(toDate + 'T23:59:59').toISOString(),
      };
      if (reportType === 'Passbook' && descs.length > 0) body.selectedDescriptions = descs;
      if (email) body.email = email;
      if (isAdminView && prefillUserId) body.userSearch = prefillUserId;
      await apiClient.post('/mis-report/generate', body);
      setResult({ ok: true, text: 'Report generation started! It will appear in the table below shortly.' });
      setTimeout(() => onClose(), 2500);
    } catch (e: any) { setResult({ ok: false, text: e?.response?.data?.error || 'Failed to start report' }); }
    finally { setSubmitting(false); }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">Generate Report</h3>
            {prefillUserName && <p className="text-xs text-[#64748B] mt-0.5">Seller: {prefillUserName}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#E2E8F0]"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide">Report Type</label>
              <select value={reportType} onChange={e => setReportType(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B] bg-white">
                {REPORT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            {reportType !== 'Passbook' && (
              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide">Date Filter By</label>
                <select value={dateFilterType} onChange={e => setDateFilterType(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B] bg-white">
                  {DATE_FILTER_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            )}
          </div>

          {reportType === 'Passbook' && (
            <div className="relative" onClick={() => setDescOpen(o => !o)}>
              <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide">Transaction Descriptions</label>
              <div className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs cursor-pointer flex flex-wrap gap-1.5 bg-white">
                {descs.length === 0
                  ? <span className="text-[#94A3B8] leading-6">All descriptions (leave empty)</span>
                  : descs.map(d => (
                    <span key={d} onClick={e => { e.stopPropagation(); toggleDesc(d); }}
                      className="flex items-center gap-1 bg-[#F0FDF4] text-[#00A86B] border border-[#DCFCE7] px-2 py-0.5 rounded-md font-semibold">
                      {d} <X className="w-3 h-3" />
                    </span>
                  ))}
              </div>
              {descOpen && (
                <div className="absolute top-full left-0 w-full bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 mt-1 max-h-44 overflow-y-auto">
                  {PASSBOOK_DESCS.map(d => (
                    <button key={d} type="button" onClick={e => { e.stopPropagation(); toggleDesc(d); }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors flex items-center gap-2 ${descs.includes(d) ? 'bg-[#F0FDF4] text-[#00A86B]' : 'text-[#475569] hover:bg-[#F8FAFC]'}`}>
                      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${descs.includes(d) ? 'bg-[#00A86B] border-[#00A86B]' : 'border-[#CBD5E1]'}`}>
                        {descs.includes(d) && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </span>
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide">From Date</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide">To Date</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide">Email Report To (optional)</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Leave blank to skip email"
              className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B]" />
          </div>

          <div className="bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-3 text-[10px] text-[#64748B] font-medium">
            Report generation may take 1–5 minutes depending on data size. Download link appears in the table once ready.
          </div>

          {result && (
            <div className={`flex items-center gap-2 text-xs font-semibold p-3 rounded-xl ${result.ok ? 'bg-green-50 text-[#00A86B]' : 'bg-red-50 text-red-600'}`}>
              {result.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />} {result.text}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-[#E2E8F0] bg-[#F8FAFC]">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-[#E2E8F0] transition-colors">Cancel</button>
          <button onClick={handleGenerate} disabled={submitting}
            className="px-4 py-2 rounded-xl bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors disabled:opacity-60 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />{submitting ? 'Starting…' : 'Generate Report'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── MisReportTable ───────────────────────────────────────────────────────────
function MisReportTable({ userId, isAdminView, fillHeight }: {
  userId: string | null; isAdminView: boolean; fillHeight?: boolean;
}) {
  const [reports, setReports] = useState<MisReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalReports, setTotalReports] = useState(0);
  const totalPages = Math.ceil(totalReports / rowsPerPage);

  const fetchReports = useCallback(async () => {
    if (!isAdminView && !userId) return;
    setLoading(true);
    try {
      const params: any = { page, limit: rowsPerPage };
      if (isAdminView && userId) params.userSearch = userId;
      const res = await apiClient.get('/mis-report/list', { params });
      setReports(res.data?.results || []);
      setTotalReports(res.data?.total || 0);
    } catch { setReports([]); }
    finally { setLoading(false); }
  }, [page, rowsPerPage, userId, isAdminView]);

  useEffect(() => { setPage(1); }, [rowsPerPage]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const statusStyle = (s: string) =>
    s === 'completed' ? 'bg-green-50 text-[#00A86B] border-green-200' :
    s === 'pending'   ? 'bg-amber-50 text-amber-600 border-amber-200' :
                        'bg-red-50 text-red-500 border-red-200';

  const typeColor = (t: string) =>
    t === 'Delivered' ? 'bg-green-50 text-[#00A86B]' :
    t === 'RTO'       ? 'bg-red-50 text-red-500' :
    t === 'Passbook'  ? 'bg-purple-50 text-purple-600' :
    t === 'Canceled'  ? 'bg-orange-50 text-orange-500' :
                        'bg-blue-50 text-blue-500';

  return (
    <div className={fillHeight ? 'flex flex-col flex-1 min-h-0' : ''}>
      <div className={fillHeight ? 'bg-white flex flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]' : 'bg-white border border-[#E2E8F0] rounded-2xl overflow-visible shadow-sm'}>
        {isAdminView && (
          <div className="sticky top-0 z-20 rounded-t-2xl flex items-center justify-between p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#00A86B]" />
                {!userId ? 'All MIS Reports' : 'MIS Reports'}
              </h3>
              <p className="text-[10px] text-[#94A3B8] mt-0.5">Excel reports generated across all report types</p>
            </div>
            <button onClick={fetchReports} title="Refresh"
              className={`w-8 h-8 flex items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:text-[#00A86B] hover:border-[#00A86B] transition-colors ${loading ? 'animate-spin' : ''}`}>
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className={`hidden md:block relative overflow-auto no-scrollbar ${fillHeight ? 'flex-1 min-h-0' : 'max-h-[560px]'}`}>
          {loading && <TableLoader />}
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 z-10 bg-[#E6F9F2] shadow-sm">
              <tr className="text-xs leading-[18px] font-medium text-[#64748B] uppercase tracking-wider border border-[#B9EFDB]">
                <th className="py-2 px-4 w-[5%]"><div className="flex items-center gap-1"><Hash className="w-3.5 h-3.5 shrink-0" /><span>#</span></div></th>
                {isAdminView && !userId && <th className="py-2 px-4 w-[14%]"><div className="flex items-center gap-1"><Users className="w-3.5 h-3.5 shrink-0" /><span>User</span></div></th>}
                <th className="py-2 px-4 w-[12%]"><div className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 shrink-0" /><span>Report Type</span></div></th>
                <th className="py-2 px-4 w-[12%]"><div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 shrink-0" /><span>Date Filter</span></div></th>
                <th className="py-2 px-4 w-[9%]"><div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 shrink-0" /><span>From</span></div></th>
                <th className="py-2 px-4 w-[9%]"><div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 shrink-0" /><span>To</span></div></th>
                <th className="py-2 px-4 w-[15%]"><div className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 shrink-0" /><span>Email</span></div></th>
                <th className="py-2 px-4 w-[13%]"><div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 shrink-0" /><span>Generated At</span></div></th>
                <th className="py-2 px-4 text-center w-[9%]"><div className="flex items-center justify-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>Status</span></div></th>
                <th className="py-2 px-4 text-right w-[12%]"><div className="flex items-center justify-end gap-1"><Download className="w-3.5 h-3.5 shrink-0" /><span>Download</span></div></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-12 text-xs text-[#94A3B8]">Loading reports…</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-sm font-medium text-[#94A3B8]">No reports generated yet. Click "Generate Report" to create one.</td></tr>
              ) : reports.map((r, i) => (
                <tr key={r._id} className={`border-b border-[#E2E8F0] transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'}`}>
                  <td className="p-3 text-[12px] font-normal text-[#94A3B8]">{(page - 1) * rowsPerPage + i + 1}</td>
                  {isAdminView && !userId && (
                    <td className="p-3">
                      <TruncatedText text={r.user?.fullname || '—'} maxLength={22} className="text-[12px] leading-[18px] font-semibold text-[#0F172A]" />
                      <TruncatedText text={r.user?.email || '—'} maxLength={26} className="text-[12px] leading-[18px] font-normal text-[#64748B]" />
                    </td>
                  )}
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-md text-[12px] font-semibold ${typeColor(r.reportType)}`}>{r.reportType}</span>
                  </td>
                  <td className="p-3 text-[12px] font-normal text-[#64748B] truncate">{r.dateFilterType || '—'}</td>
                  <td className="p-3 text-[12px] font-normal text-[#0F172A] whitespace-nowrap">{fmtDate(r.fromDate)}</td>
                  <td className="p-3 text-[12px] font-normal text-[#0F172A] whitespace-nowrap">{fmtDate(r.toDate)}</td>
                  <td className="p-3">
                    <TruncatedText text={r.email || '—'} maxLength={16} className="text-[12px] leading-[18px] font-normal text-[#64748B]" tooltipAlign="right" />
                  </td>
                  <td className="p-3 text-[12px] font-normal text-[#64748B] whitespace-nowrap">{fmtDateTime(r.createdAt)}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${statusStyle(r.status)}`}>
                      {r.status === 'pending' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse mr-1 align-middle" />}
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 text-right" style={{ paddingRight: 'calc(0.75rem + 10px)' }}>
                    {r.status === 'completed' && r.downloadUrl
                      ? <a href={r.downloadUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[12px] font-bold text-[#00A86B] hover:underline">
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      : <span className="text-[12px] text-[#CBD5E1] font-semibold">{r.status === 'pending' ? 'Processing…' : '—'}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className={`md:hidden relative bg-[#F8FAFC] ${fillHeight ? 'flex-1 min-h-0 overflow-y-auto' : ''}`}>
          {loading && <div className="relative h-32"><TableLoader /></div>}
          {!loading && reports.length === 0 ? (
            <EmptyState title="No reports yet" subtitle="Click &quot;Generate Report&quot; to create one" />
          ) : !loading && (
            <div className="p-2 space-y-2">
              {reports.map((r, i) => (
                <div key={r._id} className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                  <div className="absolute top-0 left-0 px-3.5 py-1 text-[10px] font-bold text-white uppercase tracking-wide"
                    style={{ background: '#00A86B', clipPath: 'polygon(0 0, 100% 0, 84% 100%, 0% 100%)' }}>
                    #{(page - 1) * rowsPerPage + i + 1}
                  </div>
                  <div className="pt-6 px-2.5 pb-2.5">
                    <div className="rounded-xl p-2 mb-1.5 bg-white border border-[#E2E8F0]">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-md text-[12px] font-semibold ${typeColor(r.reportType)}`}>{r.reportType}</span>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize flex items-center ${statusStyle(r.status)}`}>
                          {r.status === 'pending' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse mr-1" />}
                          {r.status}
                        </span>
                      </div>
                      {isAdminView && !userId && (
                        <>
                          <TruncatedText text={r.user?.fullname || '—'} maxLength={22} className="text-[12px] leading-[18px] font-semibold text-[#0F172A]" />
                          <TruncatedText text={r.user?.email || '—'} maxLength={26} className="text-[12px] leading-[18px] font-normal text-[#64748B]" />
                        </>
                      )}
                    </div>

                    <div className="bg-[#F8FAFC] rounded-xl px-2.5 py-2 mb-1.5 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider shrink-0">Date Range</span>
                        <span className="text-[12px] font-normal text-[#0F172A] text-right whitespace-nowrap">{fmtDate(r.fromDate)} → {fmtDate(r.toDate)}</span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider shrink-0">Filter</span>
                        <span className="text-[12px] font-normal text-[#0F172A] text-right truncate">{r.dateFilterType || '—'}</span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider shrink-0">Generated</span>
                        <span className="text-[12px] font-normal text-[#0F172A] text-right whitespace-nowrap">{fmtDateTime(r.createdAt)}</span>
                      </div>
                      {r.email && (
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider shrink-0">Email</span>
                          <TruncatedText text={r.email} maxLength={18} className="text-[12px] font-normal text-[#0F172A] ml-auto" tooltipAlign="right" />
                        </div>
                      )}
                    </div>

                    {r.status === 'completed' && r.downloadUrl ? (
                      <a href={r.downloadUrl} target="_blank" rel="noopener noreferrer"
                        className="w-full py-2 rounded-xl bg-[#1e40af] text-white text-[12px] font-bold flex items-center justify-center gap-1.5 hover:bg-[#1e3a8a] transition-colors">
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    ) : (
                      <div className="w-full py-2 rounded-xl bg-[#F1F5F9] text-[#94A3B8] text-[12px] font-bold flex items-center justify-center gap-1.5">
                        {r.status === 'pending' ? 'Processing…' : 'Not Available'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hidden md:block shrink-0">
        <DesktopPagination
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          startIndex={totalReports === 0 ? 0 : (page - 1) * rowsPerPage + 1}
          endIndex={Math.min(page * rowsPerPage, totalReports)}
          totalItems={totalReports}
        />
        </div>
        {<MobilePaginationBar {...({
          page,
          setPage,
          totalPages,
          rowsPerPage,
          setRowsPerPage,
          startIndex: totalReports === 0 ? 0 : (page - 1) * rowsPerPage + 1,
          endIndex: Math.min(page * rowsPerPage, totalReports),
          totalItems: totalReports,
        })} />}
      </div>
    </div>
  );
}

// ─── Shared UI components ─────────────────────────────────────────────────────
function PieChartCard({ title, data, colors }: { title: string; data: { name: string; value: number }[]; colors?: string[] }) {
  const clrs = colors || PIE_COLORS;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 md:p-5 shadow-sm flex flex-col">
      <h4 className="font-bold text-[13px] text-[#0F172A] mb-4">{title}</h4>
      <div className="min-h-[220px] md:min-h-[260px] flex items-center justify-center text-xs text-[#94A3B8]">No data yet</div>
    </div>
  );
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 md:p-5 shadow-sm flex flex-col overflow-hidden">
      <h4 className="font-bold text-[13px] text-[#0F172A] mb-4">{title}</h4>
      <div className="min-h-[220px] md:min-h-[260px]">
        <ResponsiveContainer width="100%" height={220} className="md:!h-[260px]">
          <PieChart>
            <Pie data={data} cx="50%" cy="45%" innerRadius={42} outerRadius={65} paddingAngle={3} dataKey="value" stroke="none">
              {data.map((_, i) => <Cell key={i} fill={clrs[i % clrs.length]} />)}
            </Pie>
            <Tooltip formatter={((v: any, n: any) => [`${Number(v).toLocaleString('en-IN')} (${((Number(v) / total) * 100).toFixed(1)}%)`, n]) as any}
              contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px', fontWeight: 600 }} />
            <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '16px' }} iconType="circle" iconSize={7}
              formatter={(v: string) => <span className="text-[10px] md:text-[11px] font-semibold text-[#475569] ml-1">{v}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, trend, sub, onClick }: {
  label: string; value: string; icon: any; color: string; bg: string;
  trend?: { value: string; up: boolean }; sub?: string; onClick?: () => void;
}) {
  return (
    <div onClick={onClick} className={`bg-white rounded-2xl border border-[#E2E8F0] p-4 md:p-5 shadow-sm transition-all ${onClick ? 'cursor-pointer hover:border-[#00A86B] hover:shadow-md hover:-translate-y-0.5' : 'hover:shadow-md'}`}>
      <div className="flex items-start justify-between mb-2.5 md:mb-3">
        <div className={`w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
          <Icon className={`w-4 h-4 md:w-[18px] md:h-[18px] ${color}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[11px] font-bold ${trend.up ? 'text-green-600' : 'text-red-500'}`}>
            {trend.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{trend.value}
          </div>
        )}
      </div>
      <div className="text-lg md:text-xl font-extrabold text-[#0F172A] leading-tight break-words">{value}</div>
      <div className="text-[11px] font-semibold text-[#64748B] mt-1">{label}</div>
      {sub && <div className="text-[10px] font-medium text-[#94A3B8] mt-0.5">{sub}</div>}
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4 mt-2">
      <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] flex items-center justify-center">
        <Icon className="w-4 h-4 text-[#00A86B]" />
      </div>
      <h3 className="text-sm font-bold text-[#0F172A]">{title}</h3>
    </div>
  );
}

// ─── AdminReports (main) ──────────────────────────────────────────────────────
export function AdminReports() {
  const { isAdmin, adminTab, currentUserId } = useAdminTab();
  const isAdminView = isAdmin && adminTab;

  // Date range for admin header
  const [dateRange, setDateRange]     = useState('Last 6 Months');
  const [isDateOpen, setIsDateOpen]   = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'seller' | 'courier') || 'seller';
  const [sellerPage, setSellerPage]   = useState(1);
  const [sellerRowsPerPage, setSellerRowsPerPage] = useState(10);

  // Seller search (same dropdown pattern as AdminOrders)
  const [sellerQuery, setSellerQuery]           = useState('');
  const [debouncedSellerQuery, setDebouncedSellerQuery] = useState('');
  const [sellerSuggestions, setSellerSuggestions] = useState<any[]>([]);
  const [sellerMongoId, setSellerMongoId]       = useState('');

  // Debounce free-text seller search so it filters the table without requiring a suggestion click
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSellerQuery(sellerQuery.trim()), 400);
    return () => clearTimeout(t);
  }, [sellerQuery]);

  // Selected seller detail (uses _id string) — persisted in URL so refresh works
  const selectedSellerId = searchParams.get('id') || null;
  const setSelectedSellerId = (id: string | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (id) next.set('id', id); else next.delete('id');
      return next;
    });
  };

  // Generate report modal
  const [genOpen, setGenOpen]           = useState(false);
  const [genUserId, setGenUserId]       = useState<string | null>(null);
  const [genUserName, setGenUserName]   = useState('');

  // API data
  const [summary, setSummary]       = useState<PlatformSummary | null>(null);
  const [sellers, setSellers]       = useState<SellerSummary[]>([]);
  const [sellerTotal, setSellerTotal] = useState(0);
  const [sellerTotalPages, setSellerTotalPages] = useState(0);
  const [sellerDetail, setSellerDetail] = useState<SellerDetail | null>(null);
  const [couriers, setCouriers]     = useState<CourierItem[]>([]);
  const [courierTotals, setCourierTotals] = useState<any>(null);

  const [loadingSummary, setLoadingSummary]   = useState(false);
  const [loadingSellers, setLoadingSellers]   = useState(false);
  const [loadingDetail, setLoadingDetail]     = useState(false);
  const [loadingCouriers, setLoadingCouriers] = useState(false);
  const [sellerError, setSellerError]         = useState<string | null>(null);
  const [detailError, setDetailError]         = useState<string | null>(null);
  const [summaryError, setSummaryError]       = useState<string | null>(null);
  const [courierError, setCourierError]       = useState<string | null>(null);

  // Refresh trigger for MIS table
  const [misRefreshKey, setMisRefreshKey] = useState(0);

  // Weight Discrepancy Claims modal
  const [showClaimsModal, setShowClaimsModal] = useState(false);

  const getDateParams = useCallback(() => {
    const now = new Date();
    const toDate = now.toISOString();
    let fromDate: string;
    if      (dateRange === 'Last 7 Days')   fromDate = new Date(now.getTime() - 7   * 86400000).toISOString();
    else if (dateRange === 'Last 30 Days')  fromDate = new Date(now.getTime() - 30  * 86400000).toISOString();
    else if (dateRange === 'Last 3 Months') fromDate = new Date(now.getTime() - 90  * 86400000).toISOString();
    else if (dateRange === 'Last 6 Months') fromDate = new Date(now.getTime() - 180 * 86400000).toISOString();
    else if (dateRange === 'This Year')     fromDate = new Date(now.getFullYear(), 0, 1).toISOString();
    else                                    fromDate = new Date(now.getTime() - 180 * 86400000).toISOString();
    return { fromDate, toDate };
  }, [dateRange]);

  const fetchSummary = useCallback(async () => {
    if (!isAdminView) return;
    setLoadingSummary(true); setSummaryError(null);
    try {
      const res = await apiClient.get('/admin-reports/summary', { params: getDateParams() });
      setSummary(res.data?.data || null);
    } catch (e: any) {
      setSummary(null);
      setSummaryError(e?.response?.data?.error || e?.message || 'Failed to load analytics summary');
    }
    finally { setLoadingSummary(false); }
  }, [isAdminView, dateRange, getDateParams]);

  const fetchSellers = useCallback(async () => {
    if (!isAdminView) return;
    setLoadingSellers(true); setSellerError(null);
    try {
      const params: any = { page: sellerPage, limit: sellerRowsPerPage, ...getDateParams() };
      if (sellerMongoId) params.userId = sellerMongoId;
      else if (debouncedSellerQuery) params.search = debouncedSellerQuery;
      const res = await apiClient.get('/admin-reports/sellers', { params });
      setSellers(res.data?.data || []);
      setSellerTotal(res.data?.total || 0);
      setSellerTotalPages(res.data?.totalPages || 0);
    } catch (e: any) {
      setSellers([]);
      setSellerError(e?.response?.data?.error || e?.message || 'Failed to load sellers');
    }
    finally { setLoadingSellers(false); }
  }, [isAdminView, sellerPage, sellerRowsPerPage, sellerMongoId, debouncedSellerQuery, dateRange, getDateParams]);

  useEffect(() => { setSellerPage(1); }, [sellerRowsPerPage]);

  useEffect(() => { setSellerPage(1); }, [debouncedSellerQuery, sellerMongoId]);

  const fetchSellerDetail = useCallback(async () => {
    if (!isAdminView || !selectedSellerId) return;
    setLoadingDetail(true); setDetailError(null);
    try {
      const res = await apiClient.get(`/admin-reports/sellers/${selectedSellerId}`);
      setSellerDetail(res.data?.data || null);
    } catch (e: any) {
      setSellerDetail(null);
      setDetailError(e?.response?.data?.error || e?.message || 'Failed to load seller data');
    }
    finally { setLoadingDetail(false); }
  }, [isAdminView, selectedSellerId]);

  const fetchCouriers = useCallback(async () => {
    if (!isAdminView) return;
    setLoadingCouriers(true); setCourierError(null);
    try {
      const res = await apiClient.get('/admin-reports/couriers', { params: getDateParams() });
      setCouriers(res.data?.data || []);
      setCourierTotals(res.data?.totals || null);
    } catch (e: any) {
      setCouriers([]);
      setCourierError(e?.response?.data?.error || e?.message || 'Failed to load courier analytics');
    }
    finally { setLoadingCouriers(false); }
  }, [isAdminView, dateRange, getDateParams]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchSellers(); }, [fetchSellers]);
  useEffect(() => { fetchSellerDetail(); }, [fetchSellerDetail]);
  useEffect(() => { if (activeTab === 'courier') fetchCouriers(); }, [activeTab, fetchCouriers]);

  // Seller search autocomplete (same pattern as AdminOrders)
  useEffect(() => {
    if (!isAdminView || sellerQuery.trim().length < 2) { setSellerSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await apiClient.get(`/admin/searchUser?query=${encodeURIComponent(sellerQuery)}`);
        setSellerSuggestions(res.data.users || []);
      } catch { setSellerSuggestions([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [sellerQuery, isAdminView]);

  const openGenerate = (userId?: string | null, userName?: string) => {
    setGenUserId(userId || null);
    setGenUserName(userName || '');
    setGenOpen(true);
  };

  // Pie chart data from summary
  const orderStatusPie = useMemo(() => summary ? [
    { name: 'Delivered', value: summary.delivered },
    { name: 'RTO', value: summary.rto },
    { name: 'NDR', value: summary.ndr },
    { name: 'In Transit', value: summary.inTransit },
    { name: 'Cancelled', value: summary.cancelled },
  ].filter(d => d.value > 0) : [], [summary]);

  const paymentPie = useMemo(() => summary ? [
    { name: 'Prepaid', value: summary.prepaidOrders },
    { name: 'COD', value: summary.codOrders },
  ].filter(d => d.value > 0) : [], [summary]);

  const sellerRevenuePie = useMemo(() => summary?.topRevenueSellers || [], [summary]);
  const sellerRtoPie     = useMemo(() => summary?.topRtoSellers     || [], [summary]);

  const courierShipmentPie = useMemo(() =>
    couriers.filter(c => c.totalShipments || c.shipments).slice(0, 6)
      .map(c => ({ name: c.name, value: c.totalShipments || c.shipments || 0 })),
  [couriers]);

  const courierStatusPie = useMemo(() => courierTotals ? [
    { name: 'Delivered', value: courierTotals.delivered || 0 },
    { name: 'RTO', value: courierTotals.rto || 0 },
    { name: 'NDR', value: courierTotals.ndr || 0 },
  ].filter(d => d.value > 0) : [], [courierTotals]);

  // ── User view (non-admin) ──────────────────────────────────────────────────
  if (!isAdminView) {
    return (
      <AdminLayout>
        <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white overflow-hidden">
          <div className="flex flex-row justify-between items-center md:items-start gap-4 px-4 md:px-6 py-4 border-b border-[#E2E8F0] shrink-0">
            <div className="hidden md:block">
              <h2 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#00A86B]" /> MIS Reports
              </h2>
              <p className="text-xs text-[#64748B] mt-1">Generate and download Excel reports for your shipments and transactions.</p>
            </div>
            <h2 className="md:hidden text-base font-bold text-[#0F172A] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#00A86B]" /> MIS Reports
            </h2>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => openGenerate(null, '')} title="Generate Report"
                className="h-9 px-4 rounded-xl bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors hidden md:flex items-center gap-1.5 shadow-sm shrink-0">
                <FileText className="w-3.5 h-3.5" /> Generate Report
              </button>
              <button onClick={() => openGenerate(null, '')} title="Generate Report"
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-[#00A86B] text-white hover:bg-[#009B63] transition-colors shadow-sm shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setMisRefreshKey(k => k + 1)} title="Refresh"
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#E2E8F0] text-[#64748B] hover:text-[#00A86B] hover:border-[#00A86B] transition-colors shrink-0">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 flex flex-col">
            <MisReportTable
              key={misRefreshKey}
              userId={currentUserId}
              isAdminView={false}
              fillHeight
            />
          </div>
        </div>
        <AnimatePresence>
          {genOpen && (
            <GenerateReportModal open
              onClose={() => { setGenOpen(false); setMisRefreshKey(k => k + 1); }}
              prefillUserId={null} prefillUserName={undefined} isAdminView={false} />
          )}
        </AnimatePresence>
      </AdminLayout>
    );
  }

  // ── Admin view ────────────────────────────────────────────────────────────
  const sd = sellerDetail;
  const sdCouriersPagination = usePagination({ data: sd?.couriers || [], perPage: 10 });
  const sdTxnsPagination = usePagination({ data: sd?.recentTransactions || [], perPage: 10 });

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-72px)] -m-4 md:-m-6 p-2.5 md:p-6 flex flex-col">

        {/* Header: title + tabs */}
        <div className="mb-5 shrink-0">
          <h2 className="text-xl font-bold text-[#0F172A] mb-3">Analytics & Intelligence</h2>
          <div className="flex justify-between items-center gap-3">
            <div className="flex gap-1 items-center min-w-0 bg-[#F7FEFC] rounded-full p-1.5">
              <div className="flex gap-1 items-center overflow-x-auto no-scrollbar min-w-0">
                {(['seller', 'courier'] as const).map(tab => (
                  <button key={tab} onClick={() => { setSearchParams(prev => { const n = new URLSearchParams(prev); n.set('tab', tab); n.delete('id'); return n; }); }}
                    ref={(el) => { if (el && activeTab === tab) el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }}
                    className={`relative px-4 py-2 text-[14px] md:text-[13px] font-semibold md:font-bold rounded-full flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${activeTab === tab ? 'text-[#00A86B] underline underline-offset-4 decoration-2' : 'text-[#64748B] hover:text-[#0F172A]'}`}>
                    {tab === 'seller' ? <Users className="w-3.5 h-3.5 shrink-0" /> : <Truck className="w-3.5 h-3.5 shrink-0" />}
                    {tab === 'seller' ? 'Seller Performance' : 'Courier Performance'}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => { fetchSummary(); fetchSellers(); if (activeTab === 'courier') fetchCouriers(); }}
              title="Refresh" className="hidden md:flex w-8 h-8 rounded-full border border-[#E2E8F0] items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] shrink-0">
              <RefreshCw className={`w-4 h-4 ${loadingSummary || loadingSellers || loadingCouriers ? 'animate-spin text-[#00A86B]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto pb-10">

        {/* ══ SELLER TAB — OVERVIEW ══════════════════════════════════════════ */}
        {activeTab === 'seller' && !selectedSellerId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Summary KPIs */}
            {loadingSummary ? (
              <div className="relative h-40"><TableLoader /></div>
            ) : summaryError ? (
              <div className="h-24 flex items-center justify-center text-xs text-red-500 font-semibold">{summaryError}</div>
            ) : summary && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <StatCard label="Total Sellers" value={fn(summary.totalSellers)} icon={UserCheck} color="text-blue-500" bg="bg-blue-50" sub={`${summary.kycVerified} KYC verified`} />
                  <StatCard label="Total Billed" value={fc(summary.totalBilled)} icon={FileText} color="text-indigo-500" bg="bg-indigo-50" sub="Shipping + surcharges" />
                  <StatCard label="Total Orders" value={fn(summary.totalOrders)} icon={Package} color="text-purple-500" bg="bg-purple-50" />
                  <StatCard label="COD Amount" value={fc(summary.codAmount)} icon={CreditCard} color="text-amber-600" bg="bg-amber-50" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <StatCard label="Delivery Rate" value={`${summary.deliveryRate}%`} icon={CheckCircle2} color="text-emerald-500" bg="bg-emerald-50" />
                  <StatCard label="RTO Rate" value={`${summary.rtoRate}%`} icon={RotateCcw} color="text-red-500" bg="bg-red-50" />
                  <StatCard label="NDR Rate" value={`${summary.ndrRate}%`} icon={AlertTriangle} color="text-orange-500" bg="bg-orange-50" />
                  <StatCard label="Prepaid / COD Split" value={`${summary.prepaidOrders} / ${summary.codOrders}`} icon={IndianRupee} color="text-cyan-500" bg="bg-cyan-50" sub="Orders" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
                  <PieChartCard title="Order Status" data={orderStatusPie} colors={['#00A86B', '#EF4444', '#F59E0B', '#3B82F6', '#94A3B8']} />
                  <PieChartCard title="Payment Mode" data={paymentPie} colors={['#3B82F6', '#F59E0B']} />
                  <PieChartCard title="Revenue by Seller" data={sellerRevenuePie} />
                  <PieChartCard title="RTO by Seller" data={sellerRtoPie} colors={['#EF4444', '#F97316', '#F59E0B', '#FB923C', '#FBBF24', '#FDE68A']} />
                </div>
              </>
            )}

            {/* Seller table */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-visible mb-8">
              <div className="sticky top-0 z-20 rounded-t-2xl p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <h3 className="font-bold text-sm text-[#0F172A]">Seller-wise Detailed Report</h3>
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    placeholder="Search seller by name or email…"
                    value={sellerQuery}
                    onChange={e => {
                      setSellerQuery(e.target.value);
                      if (!e.target.value.trim()) { setSellerMongoId(''); setSellerSuggestions([]); setSellerPage(1); }
                    }}
                    className="w-full h-9 pl-10 pr-8 border border-[#E2E8F0] rounded-lg text-xs outline-none focus:border-[#00A86B]"
                  />
                  {sellerQuery && (
                    <button onClick={() => { setSellerQuery(''); setSellerMongoId(''); setSellerSuggestions([]); setSellerPage(1); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569]">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {sellerSuggestions.length > 0 && !sellerMongoId && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 w-72 max-h-52 overflow-y-auto py-1">
                      {sellerSuggestions.map((u: any) => (
                        <button key={u._id} type="button"
                          onClick={() => {
                            setSellerMongoId(u._id);
                            setSellerQuery(`${u.fullname || ''} (${u.email})`);
                            setSellerSuggestions([]);
                            setSellerPage(1);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-[#F0FDF4] flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                            {(u.fullname || u.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-[#0F172A]">{u.fullname || '—'}</div>
                            <div className="text-[10px] text-[#94A3B8]">{u.email}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="hidden md:block relative overflow-auto no-scrollbar max-h-[560px]">
                {loadingSellers && <TableLoader />}
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-[#E6F9F2] shadow-sm">
                    <tr className="text-xs leading-[18px] font-medium text-[#64748B] uppercase tracking-wider border border-[#B9EFDB]">
                      <th className="py-2 px-4"><div className="flex items-center gap-1"><Hash className="w-3.5 h-3.5 shrink-0" /><span>#</span></div></th>
                      <th className="py-2 px-4"><div className="flex items-center gap-1"><Users className="w-3.5 h-3.5 shrink-0" /><span>Seller</span></div></th>
                      <th className="py-2 px-4"><div className="flex items-center gap-1"><Package className="w-3.5 h-3.5 shrink-0" /><span>Orders</span></div></th>
                      <th className="py-2 px-4"><div className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5 shrink-0" /><span>Billed</span></div></th>
                      <th className="py-2 px-4"><div className="flex items-center gap-1"><Wallet className="w-3.5 h-3.5 shrink-0" /><span>Wallet</span></div></th>
                      <th className="py-2 px-4"><div className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>Delivered %</span></div></th>
                      <th className="py-2 px-4"><div className="flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5 shrink-0" /><span>RTO %</span></div></th>
                      <th className="py-2 px-4"><div className="flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /><span>NDR %</span></div></th>
                      <th className="py-2 px-4"><div className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5 shrink-0" /><span>COD / Prepaid</span></div></th>
                      <th className="py-2 px-4 text-right"><div className="flex items-center justify-end gap-1"><Settings className="w-3.5 h-3.5 shrink-0" /><span>Action</span></div></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingSellers ? (
                      <tr><td colSpan={10} className="text-center py-12 text-xs text-[#94A3B8]">Loading sellers…</td></tr>
                    ) : sellerError ? (
                      <tr><td colSpan={10} className="text-center py-12 text-xs font-semibold text-red-500">{sellerError}</td></tr>
                    ) : sellers.length === 0 ? (
                      <tr><td colSpan={10} className="text-center py-12 text-xs text-[#94A3B8]">No sellers found</td></tr>
                    ) : sellers.map((s, i) => (
                      <tr key={s._id} onClick={() => { setSelectedSellerId(s._id); setSellerDetail(null); setLoadingDetail(true); }}
                        className={`border-b border-[#E2E8F0] transition-colors cursor-pointer hover:bg-[#F0FDF4] ${i % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'}`}>
                        <td className="p-3 text-xs font-semibold text-[#94A3B8]">{(sellerPage - 1) * sellerRowsPerPage + i + 1}</td>
                        <td className="p-3 max-w-[220px]">
                          <div className="min-w-0">
                            <TruncatedText text={s.fullname || '—'} maxLength={22} className="text-[14px] leading-[20px] font-semibold text-[#0F172A]" />
                            <TruncatedText text={s.email || '—'} maxLength={28} className="text-[12px] leading-[18px] font-normal text-[#64748B]" />
                          </div>
                        </td>
                        <td className="p-3 text-[12px] font-normal text-[#0F172A]">{fn(s.totalOrders)}</td>
                        <td className="p-3 text-[12px] font-normal text-[#0F172A]">{fc(s.totalBilled)}</td>
                        <td className="p-3 text-[12px] font-normal text-[#00A86B]">{fc(s.walletBalance)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[12px] font-normal ${s.deliveryRate >= 90 ? 'bg-green-50 text-green-600' : s.deliveryRate >= 80 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>{s.deliveryRate}%</span>
                        </td>
                        <td className="p-3 text-[12px] font-normal"><span className={s.rtoRate > 6 ? 'text-red-500' : 'text-[#0F172A]'}>{s.rtoRate}%</span></td>
                        <td className="p-3 text-[12px] font-normal"><span className={s.ndrRate > 5 ? 'text-orange-500' : 'text-[#0F172A]'}>{s.ndrRate}%</span></td>
                        <td className="p-3 text-[12px] font-normal text-[#0F172A]">{fn(s.codOrders)} / {fn(s.prepaidOrders)}</td>
                        <td className="p-3 text-right">
                          <button onClick={(e) => { e.stopPropagation(); setSelectedSellerId(s._id); setSellerDetail(null); setLoadingDetail(true); }}
                            className="text-[#00A86B] hover:text-[#009B63] font-bold text-[11px] hover:underline transition-colors cursor-pointer">
                            View Report →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden relative bg-[#F8FAFC]">
                {loadingSellers && <div className="relative h-32"><TableLoader /></div>}
                {!loadingSellers && sellerError ? (
                  <div className="text-center py-10 text-xs font-semibold text-red-500">{sellerError}</div>
                ) : !loadingSellers && sellers.length === 0 ? (
                  <EmptyState title="No sellers found" subtitle="Try changing filters" />
                ) : !loadingSellers && (
                  <div className="p-2 space-y-2">
                    {sellers.map((s, i) => {
                      const tier = getTier(s.totalOrders ?? 0);
                      const accent = '#00A86B';
                      return (
                        <div key={s._id}
                          className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 px-3.5 py-1 text-[10px] font-bold text-white uppercase tracking-wide"
                            style={{ background: accent, clipPath: 'polygon(0 0, 100% 0, 84% 100%, 0% 100%)' }}>
                            #{(sellerPage - 1) * sellerRowsPerPage + i + 1}
                          </div>
                          <div className="pt-8 px-4 pb-4">
                            <div className="rounded-xl p-3 mb-3 bg-white" style={{ border: `1px solid ${accent}` }}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <TruncatedText text={s.fullname || '—'} maxLength={22} className="text-[12px] leading-[18px] font-semibold text-[#0F172A]" />
                                  <TruncatedText text={s.email || '—'} maxLength={26} className="text-[12px] leading-[18px] font-normal text-[#64748B]" />
                                </div>
                                <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${getTierBadgeClass(tier)}`}>{tier}</span>
                              </div>
                            </div>

                            <div className="flex items-start justify-between mb-3 px-1 gap-2">
                              <span className="text-[12px] font-normal text-[#0F172A] flex-1">{fn(s.totalOrders)} orders</span>
                              <span className="text-[12px] font-normal text-[#00A86B] shrink-0">{fc(s.walletBalance)}</span>
                            </div>

                            <div className="flex items-start justify-between bg-[#F8FAFC] rounded-xl px-3 py-2.5 mb-3 gap-2">
                              <div className="min-w-0">
                                <div className="text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider">Billed</div>
                                <div className="text-[12px] font-normal text-[#0F172A] mt-0.5">{fc(s.totalBilled)}</div>
                                <div className="text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider mt-2">COD / Prepaid</div>
                                <div className="text-[12px] font-normal text-[#0F172A] mt-0.5">{fn(s.codOrders)} / {fn(s.prepaidOrders)}</div>
                              </div>
                              <div className="text-right min-w-0">
                                <div className="text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider">Delivered</div>
                                <span className={`text-[12px] font-normal px-2 py-0.5 rounded-full mt-0.5 inline-block ${s.deliveryRate >= 90 ? 'bg-green-50 text-green-600' : s.deliveryRate >= 80 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>{s.deliveryRate}%</span>
                                <div className="text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider mt-2">RTO / NDR</div>
                                <div className="text-[12px] font-normal mt-0.5">
                                  <span className={s.rtoRate > 6 ? 'text-red-500' : 'text-[#0F172A]'}>{s.rtoRate}%</span>
                                  <span className="text-[#94A3B8]"> / </span>
                                  <span className={s.ndrRate > 5 ? 'text-orange-500' : 'text-[#0F172A]'}>{s.ndrRate}%</span>
                                </div>
                              </div>
                            </div>

                            <button onClick={() => { setSelectedSellerId(s._id); setSellerDetail(null); setLoadingDetail(true); }}
                              className="w-full py-2.5 rounded-xl bg-[#1e40af] text-white text-[12px] font-bold flex items-center justify-center gap-1.5 hover:bg-[#1e3a8a] transition-colors">
                              View Report
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <DesktopPagination
                page={sellerPage}
                setPage={setSellerPage}
                totalPages={sellerTotalPages}
                rowsPerPage={sellerRowsPerPage}
                setRowsPerPage={setSellerRowsPerPage}
                startIndex={sellerTotal === 0 ? 0 : (sellerPage - 1) * sellerRowsPerPage + 1}
                endIndex={Math.min(sellerPage * sellerRowsPerPage, sellerTotal)}
                totalItems={sellerTotal}
              />
              {<MobilePaginationBar {...({
                page: sellerPage,
                setPage: setSellerPage,
                totalPages: sellerTotalPages,
                rowsPerPage: sellerRowsPerPage,
                setRowsPerPage: setSellerRowsPerPage,
                startIndex: sellerTotal === 0 ? 0 : (sellerPage - 1) * sellerRowsPerPage + 1,
                endIndex: Math.min(sellerPage * sellerRowsPerPage, sellerTotal),
                totalItems: sellerTotal,
              })} />}
            </div>

            {/* MIS Reports table at bottom of seller overview */}
            <MisReportTable
              key={`admin-mis-${misRefreshKey}`}
              userId={null}
              isAdminView={true}
            />
          </motion.div>
        )}

        {/* ══ INDIVIDUAL SELLER DETAIL ════════════════════════════════════════ */}
        {activeTab === 'seller' && selectedSellerId && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <button onClick={() => setSelectedSellerId(null)}
              className="flex items-center gap-2 text-sm font-semibold text-[#64748B] hover:text-[#00A86B] transition-colors mb-5">
              <ChevronLeft className="w-4 h-4" /> Back to All Sellers
            </button>

            {loadingDetail ? (
              <div className="relative h-60"><TableLoader /></div>
            ) : detailError ? (
              <div className="text-center py-20">
                <p className="text-sm text-red-500 font-semibold mb-3">{detailError}</p>
                <button onClick={() => fetchSellerDetail()} className="text-xs text-[#00A86B] font-bold hover:underline">Retry</button>
              </div>
            ) : !sd ? (
              <div className="text-center py-20 text-sm text-[#94A3B8]">No data available for this seller</div>
            ) : (
              <>
                {/* Profile header */}
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 md:p-6 mb-6 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                    <div className="flex items-center gap-3 lg:contents">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#F0FDF4] flex items-center justify-center font-extrabold text-lg md:text-xl text-[#00A86B] shrink-0">
                        {(sd.fullname || sd.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <h3 className="text-base md:text-lg font-extrabold text-[#0F172A] lg:hidden">{sd.fullname || '—'}</h3>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                        <h3 className="hidden lg:block text-lg font-extrabold text-[#0F172A]">{sd.fullname || '—'}</h3>
                        {sd.plan && (
                          <span className="text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1"><Crown className="w-3 h-3" />{sd.plan}</span>
                        )}
                        <span className={`text-[11px] md:text-[12px] font-semibold px-2 py-0.5 rounded-full border ${sd.status === 'Active' || sd.enabled !== false ? 'bg-green-50 text-[#00A86B] border-green-200' : 'bg-red-50 text-red-500 border-red-200'}`}>
                          {sd.status || (sd.enabled === false ? 'Inactive' : 'Active')}
                        </span>
                        {sd.kycDone && (
                          <span className="text-[11px] md:text-[12px] font-semibold bg-green-50 text-[#00A86B] border border-green-200 px-2 py-0.5 rounded-full">KYC Verified</span>
                        )}
                        {sd.userId && <span className="text-[11px] md:text-[12px] font-semibold bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] px-2 py-0.5 rounded-full">ID: #QP-S{String(sd.userId).padStart(4, '0')}</span>}
                        <span className={`text-[11px] md:text-[12px] font-semibold ${getTierBadgeClass(getTier(sd.totalOrders ?? 0))}`}>{getTier(sd.totalOrders ?? 0)} Tier</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2">
                        <div className="flex items-center gap-1"><Users className="w-3 h-3 shrink-0 text-[#94A3B8]" /><span className="text-[14px] font-normal text-[#94A3B8]">Contact: </span><span className="text-[12px] font-normal text-[#0F172A] truncate">{sd.fullname || '—'}</span></div>
                        <div className="flex items-center gap-1 min-w-0"><Mail className="w-3 h-3 shrink-0 text-[#94A3B8]" /><span className="text-[14px] font-normal text-[#94A3B8]">Email: </span><span className="text-[12px] font-normal text-[#0F172A] truncate">{sd.email || '—'}</span></div>
                        <div className="flex items-center gap-1"><Phone className="w-3 h-3 shrink-0 text-[#94A3B8]" /><span className="text-[14px] font-normal text-[#94A3B8]">Phone: </span><span className="text-[12px] font-normal text-[#0F172A]">{sd.phoneNumber || '—'}</span></div>
                        <div className="flex items-center gap-1"><Calendar className="w-3 h-3 shrink-0 text-[#94A3B8]" /><span className="text-[14px] font-normal text-[#94A3B8]">Joined: </span><span className="text-[12px] font-normal text-[#0F172A]">{fmtDate(sd.joinedAt)}</span></div>
                        <div className="flex items-center gap-1"><ShieldAlert className="w-3 h-3 shrink-0 text-[#94A3B8]" /><span className="text-[14px] font-normal text-[#94A3B8]">GSTIN: </span><span className="text-[12px] font-normal text-[#0F172A]">{sd.gstin || '—'}</span></div>
                        <div className="flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0 text-[#94A3B8]" /><span className="text-[14px] font-normal text-[#94A3B8]">Location: </span><span className="text-[12px] font-normal text-[#0F172A]">{[sd.city, sd.state].filter(Boolean).join(', ') || '—'}</span></div>
                        <div className="flex items-center gap-1"><IndianRupee className="w-3 h-3 shrink-0 text-[#94A3B8]" /><span className="text-[14px] font-normal text-[#94A3B8]">Avg Order Value: </span><span className="text-[12px] font-normal text-[#0F172A]">{sd.avgOrderValue != null ? fc(sd.avgOrderValue) : '—'}</span></div>
                        <div className="flex items-center gap-1"><Clock className="w-3 h-3 shrink-0 text-[#94A3B8]" /><span className="text-[14px] font-normal text-[#94A3B8]">Avg Delivery: </span><span className="text-[12px] font-normal text-[#0F172A]">{sd.avgDeliveryDays != null ? `${sd.avgDeliveryDays} days` : '—'}</span></div>
                      </div>
                    </div>
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#E2E8F0]">
                      <button onClick={() => openGenerate(sd._id, sd.fullname || sd.email)}
                        className="h-9 px-4 rounded-xl bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap">
                        <FileText className="w-3.5 h-3.5" /> Generate Report
                      </button>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <span className="text-[12px] font-semibold text-[#64748B]">{sd.enabled === false ? 'Disabled' : 'Enabled'}</span>
                        <span className="relative inline-flex items-center">
                          <input type="checkbox" className="sr-only peer" checked={sd.enabled !== false}
                            onChange={async () => {
                              const newBlocked = sd.enabled !== false; // flip: if currently enabled, we're blocking
                              setSellerDetail(prev => prev ? { ...prev, enabled: !newBlocked, isBlocked: newBlocked } : prev);
                              try {
                                await apiClient.post('/user/updateBlockStatus', { userId: sd._id, isBlocked: newBlocked });
                              } catch {
                                // revert on failure
                                setSellerDetail(prev => prev ? { ...prev, enabled: !newBlocked ? false : true, isBlocked: !newBlocked } : prev);
                              }
                            }} />
                          <span className="w-9 h-5 bg-[#E2E8F0] rounded-full peer peer-checked:bg-[#00A86B] transition-all block" />
                          <span className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Financial summary */}
                <SectionTitle icon={IndianRupee} title="Financial Summary" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <StatCard label="Total Billed" value={fc(sd.totalBilled)} icon={FileText} color="text-indigo-500" bg="bg-indigo-50" />
                  <StatCard label="Freight Charges" value={fc(sd.freightTotal)} icon={Truck} color="text-blue-500" bg="bg-blue-50" />
                  <StatCard label="COD Charges" value={fc(sd.codCharges)} icon={CreditCard} color="text-amber-600" bg="bg-amber-50" />
                  <StatCard label="Wallet Balance" value={fc(sd.walletBalance)} icon={Wallet} color="text-cyan-500" bg="bg-cyan-50" />
                </div>

                {/* Shipment operations */}
                <SectionTitle icon={Package} title="Shipment Operations" />
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2.5 md:gap-3 mb-6">
                  {[
                    { label: 'Total', value: fn(sd.totalOrders), color: 'text-[#0F172A]' },
                    { label: 'Delivered', value: fn(sd.delivered), color: 'text-[#00A86B]' },
                    { label: 'In Transit', value: fn(sd.inTransit), color: 'text-blue-500' },
                    { label: 'RTO', value: fn(sd.rto), color: 'text-red-500' },
                    { label: 'NDR', value: fn(sd.ndr), color: 'text-amber-500' },
                    { label: 'Cancelled', value: fn(sd.cancelled), color: 'text-[#94A3B8]' },
                    { label: 'Delivery Rate', value: `${sd.deliveryRate}%`, color: 'text-[#00A86B]' },
                    { label: 'RTO Rate', value: `${sd.rtoRate}%`, color: 'text-red-500' },
                    { label: 'NDR Rate', value: `${sd.ndrRate}%`, color: 'text-amber-500' },
                  ].map(m => (
                    <div key={m.label} className="bg-white rounded-xl border border-[#E2E8F0] p-2.5 md:p-3 text-center shadow-sm">
                      <div className={`text-base md:text-lg font-extrabold ${m.color}`}>{m.value}</div>
                      <div className="text-[10px] font-semibold text-[#64748B] mt-0.5">{m.label}</div>
                    </div>
                  ))}
                </div>

                {/* Pie charts */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                  <PieChartCard title="Order Status" data={[
                    { name: 'Delivered', value: sd.delivered }, { name: 'RTO', value: sd.rto },
                    { name: 'NDR', value: sd.ndr }, { name: 'In Transit', value: sd.inTransit },
                    { name: 'Cancelled', value: sd.cancelled },
                  ].filter(d => d.value > 0)} colors={['#00A86B', '#EF4444', '#F59E0B', '#3B82F6', '#94A3B8']} />
                  <PieChartCard title="Payment Mode" data={[
                    { name: 'Prepaid', value: sd.prepaidOrders }, { name: 'COD', value: sd.codOrders },
                  ].filter(d => d.value > 0)} colors={['#3B82F6', '#F59E0B']} />
                  <PieChartCard title="Courier Share" data={sd.couriers.slice(0, 5).map(c => ({ name: c.name, value: c.shipments }))} />
                </div>

                {/* Courier-wise performance */}
                {sd.couriers.length > 0 && (
                  <>
                    <SectionTitle icon={Truck} title="Courier-wise Performance" />
                    <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-visible shadow-sm mb-6">
                      <div className="md:hidden sticky top-0 z-20 rounded-t-2xl p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                        <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2"><Truck className="w-4 h-4 text-[#00A86B]" />Courier-wise Performance</h3>
                      </div>
                      <div className="hidden md:block relative overflow-auto no-scrollbar max-h-[560px]">
                        <table className="w-full text-left border-collapse">
                          <thead className="sticky top-0 z-10 bg-[#E6F9F2] shadow-sm">
                            <tr className="text-xs leading-[18px] font-medium text-[#64748B] uppercase tracking-wider border border-[#B9EFDB]">
                              <th className="py-2 px-4"><div className="flex items-center gap-1"><Hash className="w-3.5 h-3.5 shrink-0" /><span>#</span></div></th>
                              <th className="py-2 px-4"><div className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 shrink-0" /><span>Courier</span></div></th>
                              <th className="py-2 px-4"><div className="flex items-center gap-1"><Package className="w-3.5 h-3.5 shrink-0" /><span>Shipments</span></div></th>
                              <th className="py-2 px-4"><div className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>Delivered</span></div></th>
                              <th className="py-2 px-4"><div className="flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5 shrink-0" /><span>RTO</span></div></th>
                              <th className="py-2 px-4"><div className="flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /><span>NDR</span></div></th>
                              <th className="py-2 px-4"><div className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5 shrink-0" /><span>Billed</span></div></th>
                              <th className="py-2 px-4"><div className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>Delivery %</span></div></th>
                              <th className="py-2 px-4"><div className="flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5 shrink-0" /><span>RTO %</span></div></th>
                            </tr>
                          </thead>
                          <tbody>
                            {sdCouriersPagination.paginatedData.map((c, i) => (
                              <tr key={c.name} className={`border-b border-[#E2E8F0] transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'}`}>
                                <td className="p-3 text-xs font-semibold text-[#94A3B8]">{sdCouriersPagination.startIndex + i}</td>
                                <td className="p-3">
                                  <img src={getCourierLogo(c.name)} alt={c.name} className="w-20 h-8 rounded object-contain object-left shrink-0"
                                    onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=f8fafc&color=0f172a&bold=true&font-size=0.4`; }} />
                                </td>
                                <td className="p-3 text-[13px] font-normal text-[#0F172A]">{fn(c.shipments)}</td>
                                <td className="p-3 text-[13px] font-normal text-[#00A86B]">{fn(c.delivered)}</td>
                                <td className="p-3 text-[13px] font-normal text-red-500">{fn(c.rto)}</td>
                                <td className="p-3 text-[13px] font-normal text-amber-500">{fn(c.ndr)}</td>
                                <td className="p-3 text-[13px] font-normal text-[#0F172A]">{fc(c.billed)}</td>
                                <td className="p-3 text-[13px] font-normal">
                                  <span className={`${c.deliveryRate >= 90 ? 'text-[#00A86B]' : c.deliveryRate >= 80 ? 'text-amber-500' : 'text-red-500'}`}>{c.deliveryRate}%</span>
                                </td>
                                <td className="p-3 text-[13px] font-normal"><span className={c.rtoRate > 6 ? 'text-red-500' : 'text-[#0F172A]'}>{c.rtoRate}%</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile card list */}
                      <div className="md:hidden relative bg-[#F8FAFC] p-4 space-y-4">
                        {sdCouriersPagination.paginatedData.map((c, i) => (
                          <div key={c.name} className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                            <div className="absolute top-0 left-0 px-3.5 py-1 text-[10px] font-bold text-white uppercase tracking-wide"
                              style={{ background: '#00A86B', clipPath: 'polygon(0 0, 100% 0, 84% 100%, 0% 100%)' }}>
                              #{sdCouriersPagination.startIndex + i}
                            </div>
                            <div className="pt-8 px-4 pb-4">
                              <div className="rounded-xl p-3 mb-3 bg-white border border-[#E2E8F0] flex items-center gap-3">
                                <img src={getCourierLogo(c.name)} alt={c.name} className="w-16 h-7 rounded object-contain object-left shrink-0"
                                  onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=f8fafc&color=0f172a&bold=true&font-size=0.4`; }} />
                                <span className="text-[12px] font-semibold text-[#0F172A] truncate">{c.name}</span>
                              </div>

                              <div className="flex items-start justify-between mb-3 px-1 gap-2">
                                <span className="text-[12px] font-normal text-[#0F172A] flex-1">{fn(c.shipments)} shipments</span>
                                <span className="text-[12px] font-normal text-[#0F172A] shrink-0">{fc(c.billed)}</span>
                              </div>

                              <div className="bg-[#F8FAFC] rounded-xl px-3 py-2.5 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Delivered</span>
                                  <span className="text-[12px] font-normal text-[#00A86B]">{fn(c.delivered)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider">RTO</span>
                                  <span className="text-[12px] font-normal text-red-500">{fn(c.rto)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider">NDR</span>
                                  <span className="text-[12px] font-normal text-amber-500">{fn(c.ndr)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Delivery %</span>
                                  <span className={`text-[12px] font-normal ${c.deliveryRate >= 90 ? 'text-[#00A86B]' : c.deliveryRate >= 80 ? 'text-amber-500' : 'text-red-500'}`}>{c.deliveryRate}%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider">RTO %</span>
                                  <span className={`text-[12px] font-normal ${c.rtoRate > 6 ? 'text-red-500' : 'text-[#0F172A]'}`}>{c.rtoRate}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <DesktopPagination
                        page={sdCouriersPagination.page}
                        setPage={sdCouriersPagination.setPage}
                        totalPages={sdCouriersPagination.totalPages}
                        rowsPerPage={sdCouriersPagination.rowsPerPage}
                        setRowsPerPage={sdCouriersPagination.setRowsPerPage}
                        startIndex={sdCouriersPagination.startIndex}
                        endIndex={sdCouriersPagination.endIndex}
                        totalItems={sdCouriersPagination.totalItems}
                      />
                      {<MobilePaginationBar {...({
                        page: sdCouriersPagination.page,
                        setPage: sdCouriersPagination.setPage,
                        totalPages: sdCouriersPagination.totalPages,
                        rowsPerPage: sdCouriersPagination.rowsPerPage,
                        setRowsPerPage: sdCouriersPagination.setRowsPerPage,
                        startIndex: sdCouriersPagination.startIndex,
                        endIndex: sdCouriersPagination.endIndex,
                        totalItems: sdCouriersPagination.totalItems,
                      })} />}
                    </div>
                  </>
                )}

                {/* Recent transactions */}
                {sd.recentTransactions.length > 0 && (
                  <>
                    <SectionTitle icon={CreditCard} title="Recent Wallet Transactions" />
                    <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-visible shadow-sm mb-6">
                      <div className="md:hidden sticky top-0 z-20 rounded-t-2xl p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                        <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2"><CreditCard className="w-4 h-4 text-[#00A86B]" />Recent Wallet Transactions</h3>
                      </div>
                      <div className="hidden md:block relative overflow-auto no-scrollbar max-h-[560px]">
                        <table className="w-full text-left border-collapse">
                          <thead className="sticky top-0 z-10 bg-[#E6F9F2] shadow-sm">
                            <tr className="text-xs leading-[18px] font-medium text-[#64748B] uppercase tracking-wider border border-[#B9EFDB]">
                              <th className="py-2 px-4"><div className="flex items-center gap-1"><Hash className="w-3.5 h-3.5 shrink-0" /><span>#</span></div></th>
                              <th className="py-2 px-4"><div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 shrink-0" /><span>Date</span></div></th>
                              <th className="py-2 px-4"><div className="flex items-center gap-1"><Hash className="w-3.5 h-3.5 shrink-0" /><span>AWB / Ref</span></div></th>
                              <th className="py-2 px-4"><div className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 shrink-0" /><span>Description</span></div></th>
                              <th className="py-2 px-4"><div className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5 shrink-0" /><span>Type</span></div></th>
                              <th className="py-2 px-4"><div className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5 shrink-0" /><span>Amount</span></div></th>
                              <th className="py-2 px-4"><div className="flex items-center gap-1"><Wallet className="w-3.5 h-3.5 shrink-0" /><span>Balance After</span></div></th>
                            </tr>
                          </thead>
                          <tbody>
                            {sdTxnsPagination.paginatedData.map((t, i) => (
                              <tr key={i} className={`border-b border-[#E2E8F0] transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'}`}>
                                <td className="p-3 text-xs font-semibold text-[#94A3B8]">{sdTxnsPagination.startIndex + i}</td>
                                <td className="p-3 text-[13px] font-normal text-[#64748B]">{fmtDate(t.date)}</td>
                                <td className="p-3">
                                  {(t.awb_number || t.channelOrderId) ? (
                                    <div className="flex items-center gap-1 group/copy">
                                      <span className="text-[13px] font-normal text-[#64748B]">{t.awb_number || t.channelOrderId}</span>
                                      <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(t.awb_number || t.channelOrderId || '').catch(()=>{}); }} className="opacity-100 md:opacity-0 md:group-hover/copy:opacity-100 transition-opacity shrink-0 focus:outline-none" title="Copy"><Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" /></button>
                                    </div>
                                  ) : <span className="text-[13px] font-normal text-[#64748B]">—</span>}
                                </td>
                                <td className="p-3 text-[13px] font-normal text-[#475569] max-w-[180px] truncate" title={t.description}>{t.description || '—'}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[12px] font-normal border ${t.category === 'credit' ? 'bg-green-50 text-[#00A86B] border-green-200' : 'bg-red-50 text-red-500 border-red-200'}`}>{t.category}</span>
                                </td>
                                <td className={`p-3 text-[13px] font-normal ${t.category === 'credit' ? 'text-[#00A86B]' : 'text-red-500'}`}>
                                  {t.category === 'credit' ? '+' : '−'}{fc(t.amount)}
                                </td>
                                <td className="p-3 text-[13px] font-normal text-[#0F172A]">{t.balanceAfterTransaction !== undefined ? fc(t.balanceAfterTransaction) : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile card list */}
                      <div className="md:hidden relative bg-[#F8FAFC] p-4 space-y-4">
                        {sdTxnsPagination.paginatedData.map((t, i) => (
                          <div key={i} className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                            <div className="absolute top-0 left-0 px-3.5 py-1 text-[10px] font-bold text-white uppercase tracking-wide"
                              style={{ background: '#00A86B', clipPath: 'polygon(0 0, 100% 0, 84% 100%, 0% 100%)' }}>
                              #{sdTxnsPagination.startIndex + i}
                            </div>
                            <div className="pt-8 px-4 pb-4">
                              <div className="rounded-xl p-3 mb-3 bg-white border border-[#E2E8F0]">
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <span className="text-[11px] text-[#64748B]">{fmtDate(t.date)}</span>
                                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${t.category === 'credit' ? 'bg-green-50 text-[#00A86B] border-green-200' : 'bg-red-50 text-red-500 border-red-200'}`}>{t.category}</span>
                                </div>
                                <TruncatedText text={t.description || '—'} maxLength={34} className="text-[12px] font-semibold text-[#0F172A]" />
                                {(t.awb_number || t.channelOrderId) && (
                                  <div className="flex items-center gap-1 group/copy mt-1">
                                    <span className="text-[10px] text-[#94A3B8]">AWB/Ref: {t.awb_number || t.channelOrderId}</span>
                                    <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(t.awb_number || t.channelOrderId || '').catch(()=>{}); }} className="opacity-100 md:opacity-0 md:group-hover/copy:opacity-100 transition-opacity shrink-0 focus:outline-none" title="Copy"><Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" /></button>
                                  </div>
                                )}
                              </div>

                              <div className="bg-[#F8FAFC] rounded-xl px-3 py-2.5 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Amount</span>
                                  <span className={`text-[12px] font-normal ${t.category === 'credit' ? 'text-[#00A86B]' : 'text-red-500'}`}>{t.category === 'credit' ? '+' : '−'}{fc(t.amount)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Balance After</span>
                                  <span className="text-[12px] font-normal text-[#0F172A]">{t.balanceAfterTransaction !== undefined ? fc(t.balanceAfterTransaction) : '—'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <DesktopPagination
                        page={sdTxnsPagination.page}
                        setPage={sdTxnsPagination.setPage}
                        totalPages={sdTxnsPagination.totalPages}
                        rowsPerPage={sdTxnsPagination.rowsPerPage}
                        setRowsPerPage={sdTxnsPagination.setRowsPerPage}
                        startIndex={sdTxnsPagination.startIndex}
                        endIndex={sdTxnsPagination.endIndex}
                        totalItems={sdTxnsPagination.totalItems}
                      />
                      {<MobilePaginationBar {...({
                        page: sdTxnsPagination.page,
                        setPage: sdTxnsPagination.setPage,
                        totalPages: sdTxnsPagination.totalPages,
                        rowsPerPage: sdTxnsPagination.rowsPerPage,
                        setRowsPerPage: sdTxnsPagination.setRowsPerPage,
                        startIndex: sdTxnsPagination.startIndex,
                        endIndex: sdTxnsPagination.endIndex,
                        totalItems: sdTxnsPagination.totalItems,
                      })} />}
                    </div>
                  </>
                )}

                {/* MIS report table scoped to this seller */}
                <MisReportTable
                  key={`seller-mis-${selectedSellerId}-${misRefreshKey}`}
                  userId={selectedSellerId}
                  isAdminView={true}
                />
              </>
            )}
          </motion.div>
        )}

        {/* ══ COURIER TAB ═════════════════════════════════════════════════ */}
        {activeTab === 'courier' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {loadingCouriers ? (
              <div className="relative h-40"><TableLoader /></div>
            ) : courierError ? (
              <div className="h-24 flex items-center justify-center text-xs text-red-500 font-semibold">{courierError}</div>
            ) : couriers.length === 0 ? (
              <div className="h-24 flex items-center justify-center text-xs text-[#94A3B8]">No courier data yet</div>
            ) : (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <StatCard label="Total Shipments" value={fn(courierTotals?.totalShipments || courierTotals?.shipments)} icon={Package} color="text-[#0F172A]" bg="bg-slate-50" />
                  <StatCard label="Delivered" value={fn(courierTotals?.delivered)} icon={CheckCircle2} color="text-emerald-500" bg="bg-emerald-50" />
                  <StatCard label="RTO" value={fn(courierTotals?.rto)} icon={RotateCcw} color="text-red-500" bg="bg-red-50" />
                  <StatCard label="NDR" value={fn(courierTotals?.ndr)} icon={AlertTriangle} color="text-orange-500" bg="bg-orange-50" />
                </div>

                {/* Pie charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <PieChartCard title="Shipment Share by Courier" data={courierShipmentPie} />
                  <PieChartCard title="Status Breakdown" data={courierStatusPie} colors={['#00A86B', '#EF4444', '#F59E0B']} />
                </div>

                {/* Courier-wise performance table */}
                <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-visible shadow-sm mb-8">
                  <div className="sticky top-0 z-20 rounded-t-2xl p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2"><Truck className="w-4 h-4 text-[#00A86B]" />Courier-wise Performance</h3>
                  </div>
                  <div className="hidden md:block relative overflow-auto no-scrollbar max-h-[560px]">
                    {loadingCouriers && <TableLoader />}
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 z-10 bg-[#E6F9F2] shadow-sm">
                        <tr className="text-xs leading-[18px] font-medium text-[#64748B] uppercase tracking-wider border border-[#B9EFDB]">
                          <th className="py-2 px-4"><div className="flex items-center gap-1"><Hash className="w-3.5 h-3.5 shrink-0" /><span>#</span></div></th>
                          <th className="py-2 px-4"><div className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 shrink-0" /><span>Courier</span></div></th>
                          <th className="py-2 px-4"><div className="flex items-center gap-1"><Package className="w-3.5 h-3.5 shrink-0" /><span>Shipments</span></div></th>
                          <th className="py-2 px-4"><div className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>Delivered</span></div></th>
                          <th className="py-2 px-4"><div className="flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5 shrink-0" /><span>RTO</span></div></th>
                          <th className="py-2 px-4"><div className="flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /><span>NDR</span></div></th>
                          <th className="py-2 px-4"><div className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5 shrink-0" /><span>Billed</span></div></th>
                          <th className="py-2 px-4"><div className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>Delivery %</span></div></th>
                          <th className="py-2 px-4"><div className="flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5 shrink-0" /><span>RTO %</span></div></th>
                        </tr>
                      </thead>
                      <tbody>
                        {couriers.map((c, i) => (
                          <tr key={c.name} className={`border-b border-[#E2E8F0] transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'}`}>
                            <td className="p-3 text-xs font-semibold text-[#94A3B8]">{i + 1}</td>
                            <td className="p-3">
                              <img src={getCourierLogo(c.name)} alt={c.name} className="w-20 h-8 rounded object-contain object-left shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=f8fafc&color=0f172a&bold=true&font-size=0.4`; }} />
                            </td>
                            <td className="p-3 text-[13px] font-normal text-[#0F172A]">{fn(c.totalShipments || c.shipments)}</td>
                            <td className="p-3 text-[13px] font-normal text-[#00A86B]">{fn(c.delivered)}</td>
                            <td className="p-3 text-[13px] font-normal text-red-500">{fn(c.rto)}</td>
                            <td className="p-3 text-[13px] font-normal text-amber-500">{fn(c.ndr)}</td>
                            <td className="p-3 text-[13px] font-normal text-[#0F172A]">{fc(c.totalBilled || c.billed)}</td>
                            <td className="p-3 text-[13px] font-normal text-[#0F172A]">{c.deliveryRate}%</td>
                            <td className="p-3 text-[13px] font-normal text-[#0F172A]">{c.rtoRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile card list */}
                  <div className="md:hidden relative bg-[#F8FAFC] p-4 space-y-4">
                    {loadingCouriers && <div className="relative h-32"><TableLoader /></div>}
                    {!loadingCouriers && couriers.map((c, i) => (
                      <div key={c.name} className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                        <div className="absolute top-0 left-0 px-3.5 py-1 text-[10px] font-bold text-white uppercase tracking-wide"
                          style={{ background: '#00A86B', clipPath: 'polygon(0 0, 100% 0, 84% 100%, 0% 100%)' }}>
                          #{i + 1}
                        </div>
                        <div className="pt-8 px-4 pb-4">
                          <div className="rounded-xl p-3 mb-3 bg-white border border-[#E2E8F0] flex items-center gap-3">
                            <img src={getCourierLogo(c.name)} alt={c.name} className="w-16 h-7 rounded object-contain object-left shrink-0"
                              onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=f8fafc&color=0f172a&bold=true&font-size=0.4`; }} />
                            <span className="text-[12px] font-semibold text-[#0F172A] truncate">{c.name}</span>
                          </div>

                          <div className="flex items-start justify-between mb-3 px-1 gap-2">
                            <span className="text-[12px] font-normal text-[#0F172A] flex-1">{fn(c.totalShipments || c.shipments)} shipments</span>
                            <span className="text-[12px] font-normal text-[#0F172A] shrink-0">{fc(c.totalBilled || c.billed)}</span>
                          </div>

                          <div className="bg-[#F8FAFC] rounded-xl px-3 py-2.5 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Delivered</span>
                              <span className="text-[12px] font-normal text-[#00A86B]">{fn(c.delivered)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider">RTO</span>
                              <span className="text-[12px] font-normal text-red-500">{fn(c.rto)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider">NDR</span>
                              <span className="text-[12px] font-normal text-amber-500">{fn(c.ndr)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Delivery %</span>
                              <span className="text-[12px] font-normal text-[#0F172A]">{c.deliveryRate}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider">RTO %</span>
                              <span className="text-[12px] font-normal text-[#0F172A]">{c.rtoRate}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        </div>
      </div>

      {/* Generate Report Modal */}
      <AnimatePresence>
        {genOpen && (
          <GenerateReportModal open onClose={() => { setGenOpen(false); setMisRefreshKey(k => k + 1); }}
            prefillUserId={genUserId} prefillUserName={genUserName} isAdminView={isAdminView} />
        )}
      </AnimatePresence>

    </AdminLayout>
  );
}
