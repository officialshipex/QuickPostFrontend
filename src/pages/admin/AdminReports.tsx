import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { useAdminTab } from '../../context/AdminUserContext';
import { apiClient } from '../../services/apiClient';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Download, Calendar, ChevronDown, ChevronLeft, Users, Truck, IndianRupee,
  Package, RotateCcw, AlertTriangle, CheckCircle2, Clock, Search, Wallet,
  FileText, ShieldAlert, UserCheck, CreditCard, X, RefreshCw, Send,
  TrendingUp, TrendingDown, Scale,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
      const body: any = { reportType, fromDate: new Date(fromDate).toISOString(), toDate: new Date(toDate + 'T23:59:59').toISOString() };
      if (reportType !== 'Passbook') body.dateFilterType = dateFilterType;
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
function MisReportTable({ userId, isAdminView }: {
  userId: string | null; isAdminView: boolean;
}) {
  const [reports, setReports] = useState<MisReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const LIMIT = 20;

  const fetchReports = useCallback(async () => {
    if (!isAdminView && !userId) return;
    setLoading(true);
    try {
      const params: any = { page, limit: LIMIT };
      if (isAdminView && userId) params.userSearch = userId;
      const res = await apiClient.get('/mis-report/list', { params });
      setReports(res.data?.results || []);
      setTotalPages(Math.ceil((res.data?.total || 0) / LIMIT));
    } catch { setReports([]); }
    finally { setLoading(false); }
  }, [page, userId, isAdminView]);

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
    <div>
      {isAdminView && (
        <div className="flex items-center justify-between mb-4">
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
      {!isAdminView && (
        <div className="flex justify-end mb-4">
          <button onClick={fetchReports} title="Refresh"
            className={`w-8 h-8 flex items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:text-[#00A86B] hover:border-[#00A86B] transition-colors ${loading ? 'animate-spin' : ''}`}>
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] uppercase tracking-wider font-bold text-[#64748B]">
                <th className="px-4 py-3 w-10">#</th>
                {isAdminView && !userId && <th className="px-4 py-3 w-36">User</th>}
                <th className="px-4 py-3 w-32">Report Type</th>
                <th className="px-4 py-3 w-28">Date Filter</th>
                <th className="px-4 py-3 w-24">From</th>
                <th className="px-4 py-3 w-24">To</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 w-32">Generated At</th>
                <th className="px-4 py-3 w-24 text-center">Status</th>
                <th className="px-4 py-3 w-24 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {loading ? (
                <tr><td colSpan={10} className="text-center py-12 text-xs text-[#94A3B8]">Loading reports…</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-sm font-medium text-[#94A3B8]">No reports generated yet. Click "Generate Report" to create one.</td></tr>
              ) : reports.map((r, i) => (
                <tr key={r._id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-4 py-3 text-xs font-semibold text-[#94A3B8]">{(page - 1) * LIMIT + i + 1}</td>
                  {isAdminView && !userId && (
                    <td className="px-4 py-3">
                      <div className="text-xs font-bold text-[#0F172A] truncate max-w-[130px]">{r.user?.fullname || '—'}</div>
                      <div className="text-[10px] text-[#94A3B8] truncate">{r.user?.email}</div>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${typeColor(r.reportType)}`}>{r.reportType}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#64748B]">{r.dateFilterType || '—'}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-[#0F172A]">{fmtDate(r.fromDate)}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-[#0F172A]">{fmtDate(r.toDate)}</td>
                  <td className="px-4 py-3 text-[11px] text-[#64748B] truncate max-w-[140px]">{r.email || '—'}</td>
                  <td className="px-4 py-3 text-[11px] text-[#64748B]">{fmtDateTime(r.createdAt)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${statusStyle(r.status)}`}>
                      {r.status === 'pending' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse mr-1 align-middle" />}
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status === 'completed' && r.downloadUrl
                      ? <a href={r.downloadUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00A86B] hover:underline">
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      : <span className="text-[11px] text-[#CBD5E1] font-semibold">{r.status === 'pending' ? 'Processing…' : '—'}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-[#F1F5F9]">
          {loading ? (
            <div className="text-center py-10 text-xs text-[#94A3B8]">Loading…</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-10 text-sm font-medium text-[#94A3B8]">No reports yet</div>
          ) : reports.map((r, i) => (
            <div key={r._id} className="p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${typeColor(r.reportType)}`}>{r.reportType}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${statusStyle(r.status)}`}>{r.status}</span>
              </div>
              <div className="text-[11px] text-[#64748B]">{fmtDate(r.fromDate)} → {fmtDate(r.toDate)} · {r.dateFilterType || '—'}</div>
              <div className="text-[10px] text-[#94A3B8]">Generated: {fmtDateTime(r.createdAt)}</div>
              {r.status === 'completed' && r.downloadUrl && (
                <a href={r.downloadUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#00A86B] hover:underline">
                  <Download className="w-3 h-3" /> Download
                </a>
              )}
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-3 border-t border-[#E2E8F0]">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-xs font-bold border border-[#E2E8F0] rounded-lg disabled:opacity-40 hover:bg-[#F8FAFC]">← Prev</button>
            <span className="text-xs text-[#64748B] font-medium">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-xs font-bold border border-[#E2E8F0] rounded-lg disabled:opacity-40 hover:bg-[#F8FAFC]">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared UI components ─────────────────────────────────────────────────────
function PieChartCard({ title, data, colors }: { title: string; data: { name: string; value: number }[]; colors?: string[] }) {
  const clrs = colors || PIE_COLORS;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm h-full flex flex-col">
      <h4 className="font-bold text-[13px] text-[#0F172A] mb-4">{title}</h4>
      <div className="flex-1 flex items-center justify-center text-xs text-[#94A3B8]">No data yet</div>
    </div>
  );
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm h-full flex flex-col">
      <h4 className="font-bold text-[13px] text-[#0F172A] mb-4">{title}</h4>
      <div className="flex-1 min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="45%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
              {data.map((_, i) => <Cell key={i} fill={clrs[i % clrs.length]} />)}
            </Pie>
            <Tooltip formatter={((v: any, n: any) => [`${Number(v).toLocaleString('en-IN')} (${((Number(v) / total) * 100).toFixed(1)}%)`, n]) as any}
              contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px', fontWeight: 600 }} />
            <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }} iconType="circle" iconSize={8}
              formatter={(v: string) => <span className="text-[11px] font-semibold text-[#475569] ml-1">{v}</span>} />
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
    <div onClick={onClick} className={`bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm transition-all ${onClick ? 'cursor-pointer hover:border-[#00A86B] hover:shadow-md hover:-translate-y-0.5' : 'hover:shadow-md'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`w-[18px] h-[18px] ${color}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[11px] font-bold ${trend.up ? 'text-green-600' : 'text-red-500'}`}>
            {trend.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{trend.value}
          </div>
        )}
      </div>
      <div className="text-xl font-extrabold text-[#0F172A] leading-tight">{value}</div>
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
  const [activeTab, setActiveTab]     = useState<'seller' | 'courier'>('seller');
  const [sellerPage, setSellerPage]   = useState(1);

  // Seller search (same dropdown pattern as AdminOrders)
  const [sellerQuery, setSellerQuery]           = useState('');
  const [sellerSuggestions, setSellerSuggestions] = useState<any[]>([]);
  const [sellerMongoId, setSellerMongoId]       = useState('');

  // Selected seller detail (uses _id string)
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);

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
    setLoadingSummary(true);
    try {
      const res = await apiClient.get('/admin-reports/summary', { params: getDateParams() });
      setSummary(res.data?.data || null);
    } catch { setSummary(null); }
    finally { setLoadingSummary(false); }
  }, [isAdminView, dateRange, getDateParams]);

  const fetchSellers = useCallback(async () => {
    if (!isAdminView) return;
    setLoadingSellers(true); setSellerError(null);
    try {
      const params: any = { page: sellerPage, limit: 10, ...getDateParams() };
      if (sellerMongoId) params.userId = sellerMongoId;
      const res = await apiClient.get('/admin-reports/sellers', { params });
      setSellers(res.data?.data || []);
      setSellerTotal(res.data?.total || 0);
      setSellerTotalPages(res.data?.totalPages || 0);
    } catch (e: any) {
      setSellers([]);
      setSellerError(e?.response?.data?.error || e?.message || 'Failed to load sellers');
    }
    finally { setLoadingSellers(false); }
  }, [isAdminView, sellerPage, sellerMongoId, dateRange, getDateParams]);

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
    setLoadingCouriers(true);
    try {
      const res = await apiClient.get('/admin-reports/couriers', { params: getDateParams() });
      setCouriers(res.data?.data || []);
      setCourierTotals(res.data?.totals || null);
    } catch { setCouriers([]); }
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
        <div className="max-w-[1400px] mx-auto pb-10">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#00A86B]" /> MIS Reports
              </h2>
              <p className="text-xs text-[#64748B] mt-1">Generate and download Excel reports for your shipments and transactions.</p>
            </div>
            <button onClick={() => openGenerate(null, '')}
              className="h-9 px-4 rounded-xl bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors flex items-center gap-1.5 shadow-sm shrink-0">
              <FileText className="w-3.5 h-3.5" /> Generate Report
            </button>
          </div>
          <MisReportTable
            key={misRefreshKey}
            userId={currentUserId}
            isAdminView={false}
          />
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

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto pb-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A]">Analytics & Intelligence</h2>
            <p className="text-xs text-[#64748B] mt-1">Detailed analytics for sellers and couriers across QuickPost.</p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="relative">
              <button onClick={() => setIsDateOpen(!isDateOpen)}
                className={`flex items-center gap-2 px-4 h-9 rounded-lg border text-xs font-semibold transition-all ${isDateOpen ? 'border-[#00A86B] text-[#00A86B] ring-1 ring-[#00A86B]/20' : 'border-[#E2E8F0] text-[#475569] hover:border-[#00A86B]'}`}>
                <Calendar className="w-4 h-4" /> {dateRange} <ChevronDown className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {isDateOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsDateOpen(false)} />
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                      className="absolute right-0 top-[calc(100%+6px)] bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-20 py-1 min-w-[180px]">
                      {DATE_RANGES.map(r => (
                        <button key={r} onClick={() => { setDateRange(r); setIsDateOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-[12px] font-semibold transition-colors ${dateRange === r ? 'bg-[#F0FDF4] text-[#00A86B]' : 'text-[#475569] hover:bg-[#F8FAFC]'}`}>{r}</button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="border-b border-[#E2E8F0] mb-6">
          <div className="flex gap-8">
            {(['seller', 'courier'] as const).map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab); setSelectedSellerId(null); }}
                className={`flex items-center gap-2 px-1 py-4 text-sm font-bold transition-colors ${activeTab === tab ? 'text-[#00A86B] border-b-2 border-[#00A86B]' : 'text-[#64748B] hover:text-[#0F172A]'}`}>
                {tab === 'seller' ? <Users className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                {tab === 'seller' ? 'Seller Performance' : 'Courier Performance'}
              </button>
            ))}
          </div>
        </div>

        {/* ══ SELLER TAB — OVERVIEW ══════════════════════════════════════════ */}
        {activeTab === 'seller' && !selectedSellerId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Summary KPIs */}
            {loadingSummary ? (
              <div className="h-24 flex items-center justify-center text-xs text-[#94A3B8]">Loading analytics…</div>
            ) : summary && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <StatCard label="Total Sellers" value={fn(summary.totalSellers)} icon={UserCheck} color="text-blue-500" bg="bg-blue-50" sub={`${summary.kycVerified} KYC verified`} />
                  <StatCard label="Total Billed" value={fc(summary.totalBilled)} icon={FileText} color="text-indigo-500" bg="bg-indigo-50" sub="Shipping + surcharges" />
                  <StatCard label="Total Orders" value={fn(summary.totalOrders)} icon={Package} color="text-purple-500" bg="bg-purple-50" />
                  <StatCard label="COD Amount" value={fc(summary.codAmount)} icon={CreditCard} color="text-amber-600" bg="bg-amber-50" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <StatCard label="Delivery Rate" value={`${summary.deliveryRate}%`} icon={CheckCircle2} color="text-emerald-500" bg="bg-emerald-50" />
                  <StatCard label="RTO Rate" value={`${summary.rtoRate}%`} icon={RotateCcw} color="text-red-500" bg="bg-red-50" />
                  <StatCard label="NDR Rate" value={`${summary.ndrRate}%`} icon={AlertTriangle} color="text-orange-500" bg="bg-orange-50" />
                  <StatCard label="Prepaid / COD Split" value={`${summary.prepaidOrders} / ${summary.codOrders}`} icon={IndianRupee} color="text-cyan-500" bg="bg-cyan-50" sub="Orders" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
                  <PieChartCard title="Order Status" data={orderStatusPie} colors={['#00A86B', '#EF4444', '#F59E0B', '#3B82F6', '#94A3B8']} />
                  <PieChartCard title="Payment Mode" data={paymentPie} colors={['#3B82F6', '#F59E0B']} />
                  <PieChartCard title="Revenue by Seller" data={sellerRevenuePie} />
                  <PieChartCard title="RTO by Seller" data={sellerRtoPie} colors={['#EF4444', '#F97316', '#F59E0B', '#FB923C', '#FBBF24', '#FDE68A']} />
                </div>
              </>
            )}

            {/* Seller table */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden mb-8">
              <div className="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
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
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1100px]">
                  <thead>
                    <tr className="bg-[#E6F9F2] border-b border-[#E2E8F0] text-[10px] uppercase tracking-wider font-bold text-[#64748B]">
                      <th className="p-4">Seller</th>
                      <th className="p-4">Orders</th>
                      <th className="p-4">Billed</th>
                      <th className="p-4">Wallet</th>
                      <th className="p-4">Delivered %</th>
                      <th className="p-4">RTO %</th>
                      <th className="p-4">NDR %</th>
                      <th className="p-4">COD / Prepaid</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-semibold text-[#475569]">
                    {loadingSellers ? (
                      <tr><td colSpan={9} className="text-center py-12 text-[#94A3B8]">Loading sellers…</td></tr>
                    ) : sellerError ? (
                      <tr><td colSpan={9} className="text-center py-12 text-red-500 text-xs font-semibold">{sellerError}</td></tr>
                    ) : sellers.length === 0 ? (
                      <tr><td colSpan={9} className="text-center py-12 text-[#94A3B8]">No sellers found</td></tr>
                    ) : sellers.map(s => (
                      <tr key={s._id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#10B981]/10 text-[#00A86B] flex items-center justify-center font-bold text-xs shrink-0">
                              {(s.fullname || s.email || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-[#0F172A] text-sm">{s.fullname || '—'}</div>
                              <div className="text-[10px] text-[#94A3B8]">{s.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-[#0F172A]">{fn(s.totalOrders)}</td>
                        <td className="p-4 text-sm text-[#0F172A]">{fc(s.totalBilled)}</td>
                        <td className="p-4 text-[#00A86B] text-sm">{fc(s.walletBalance)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-md text-sm ${s.deliveryRate >= 90 ? 'bg-green-50 text-green-600' : s.deliveryRate >= 80 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>{s.deliveryRate}%</span>
                        </td>
                        <td className="p-4"><span className={s.rtoRate > 6 ? 'text-red-500' : ''}>{s.rtoRate}%</span></td>
                        <td className="p-4"><span className={s.ndrRate > 5 ? 'text-orange-500' : ''}>{s.ndrRate}%</span></td>
                        <td className="p-4 text-sm">{fn(s.codOrders)} / {fn(s.prepaidOrders)}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => { setSelectedSellerId(s._id); setSellerDetail(null); setLoadingDetail(true); }}
                            className="text-[#00A86B] hover:text-[#009B63] font-bold text-[11px] hover:underline transition-colors">
                            View Report →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {sellerTotalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
                  <span className="text-xs text-[#64748B]">Showing {sellers.length} of {fn(sellerTotal)} sellers</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSellerPage(p => Math.max(1, p - 1))} disabled={sellerPage === 1}
                      className="px-3 py-1.5 text-xs font-bold border border-[#E2E8F0] rounded-lg disabled:opacity-40">← Prev</button>
                    <span className="text-xs font-medium text-[#64748B]">Page {sellerPage} of {sellerTotalPages}</span>
                    <button onClick={() => setSellerPage(p => Math.min(sellerTotalPages, p + 1))} disabled={sellerPage === sellerTotalPages}
                      className="px-3 py-1.5 text-xs font-bold border border-[#E2E8F0] rounded-lg disabled:opacity-40">Next →</button>
                  </div>
                </div>
              )}
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
              <div className="text-center py-20 text-sm text-[#94A3B8]">Loading seller data…</div>
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
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 mb-6 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-[#F0FDF4] flex items-center justify-center font-extrabold text-xl text-[#00A86B] shrink-0">
                      {(sd.fullname || sd.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-lg font-extrabold text-[#0F172A]">{sd.fullname || '—'}</h3>
                        {sd.kycDone && (
                          <span className="text-[10px] font-bold bg-green-50 text-[#00A86B] border border-green-200 px-2 py-0.5 rounded-full">KYC Verified</span>
                        )}
                        {sd.userId && <span className="text-[10px] font-bold bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] px-2 py-0.5 rounded-full">ID #{sd.userId}</span>}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-xs text-[#64748B]">
                        {[
                          ['Email', sd.email],
                          ['Phone', sd.phoneNumber || '—'],
                          ['Company', sd.company || '—'],
                          ['Joined', fmtDate(sd.joinedAt)],
                        ].map(([k, v]) => (
                          <div key={k}><span className="font-bold text-[#0F172A]">{k}: </span>{v}</div>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => openGenerate(sd._id, sd.fullname || sd.email)}
                      className="shrink-0 h-9 px-4 rounded-xl bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors flex items-center gap-1.5 shadow-sm">
                      <FileText className="w-3.5 h-3.5" /> Generate Report
                    </button>
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
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-6">
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
                    <div key={m.label} className="bg-white rounded-xl border border-[#E2E8F0] p-3 text-center shadow-sm">
                      <div className={`text-lg font-extrabold ${m.color}`}>{m.value}</div>
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
                    <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm mb-6">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[700px]">
                          <thead>
                            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] uppercase tracking-wider font-bold text-[#64748B]">
                              <th className="px-4 py-3">Courier</th>
                              <th className="px-4 py-3">Shipments</th>
                              <th className="px-4 py-3">Delivered</th>
                              <th className="px-4 py-3">RTO</th>
                              <th className="px-4 py-3">NDR</th>
                              <th className="px-4 py-3">Billed</th>
                              <th className="px-4 py-3">Delivery %</th>
                              <th className="px-4 py-3">RTO %</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F1F5F9] text-xs font-semibold text-[#475569]">
                            {sd.couriers.map(c => (
                              <tr key={c.name} className="hover:bg-[#F8FAFC]">
                                <td className="px-4 py-3 font-bold text-[#0F172A]">{c.name}</td>
                                <td className="px-4 py-3">{fn(c.shipments)}</td>
                                <td className="px-4 py-3 text-[#00A86B]">{fn(c.delivered)}</td>
                                <td className="px-4 py-3 text-red-500">{fn(c.rto)}</td>
                                <td className="px-4 py-3 text-amber-500">{fn(c.ndr)}</td>
                                <td className="px-4 py-3">{fc(c.billed)}</td>
                                <td className="px-4 py-3">
                                  <span className={`${c.deliveryRate >= 90 ? 'text-[#00A86B]' : c.deliveryRate >= 80 ? 'text-amber-500' : 'text-red-500'}`}>{c.deliveryRate}%</span>
                                </td>
                                <td className="px-4 py-3"><span className={c.rtoRate > 6 ? 'text-red-500' : ''}>{c.rtoRate}%</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}

                {/* Recent transactions */}
                {sd.recentTransactions.length > 0 && (
                  <>
                    <SectionTitle icon={CreditCard} title="Recent Wallet Transactions" />
                    <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm mb-6">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[600px]">
                          <thead>
                            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] uppercase tracking-wider font-bold text-[#64748B]">
                              <th className="px-4 py-3">Date</th>
                              <th className="px-4 py-3">AWB / Ref</th>
                              <th className="px-4 py-3">Description</th>
                              <th className="px-4 py-3">Type</th>
                              <th className="px-4 py-3">Amount</th>
                              <th className="px-4 py-3">Balance After</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F1F5F9] text-xs">
                            {sd.recentTransactions.map((t, i) => (
                              <tr key={i} className="hover:bg-[#F8FAFC]">
                                <td className="px-4 py-3 text-[#64748B]">{fmtDate(t.date)}</td>
                                <td className="px-4 py-3 font-mono text-[11px] text-[#64748B]">{t.awb_number || t.channelOrderId || '—'}</td>
                                <td className="px-4 py-3 text-[#475569] max-w-[180px] truncate" title={t.description}>{t.description || '—'}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${t.category === 'credit' ? 'bg-green-50 text-[#00A86B] border-green-200' : 'bg-red-50 text-red-500 border-red-200'}`}>{t.category}</span>
                                </td>
                                <td className={`px-4 py-3 font-bold text-sm ${t.category === 'credit' ? 'text-[#00A86B]' : 'text-red-500'}`}>
                                  {t.category === 'credit' ? '+' : '−'}{fc(t.amount)}
                                </td>
                                <td className="px-4 py-3 font-semibold text-[#0F172A]">{t.balanceAfterTransaction !== undefined ? fc(t.balanceAfterTransaction) : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
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
