import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { PDFDocument } from 'pdf-lib';
import * as XLSX from 'xlsx';
import {
  ArrowLeft, Download, Copy, MapPin, Calendar, Package, Clock,
  CheckCircle2, Truck, ChevronDown, X, User, FileText, IndianRupee,
  History, MoreHorizontal, Mail, Settings, RefreshCw,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';
import { getToken } from '../../utils/session';
import { TableLoader } from '../../components/ui/TableLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { TruncatedText } from '../../components/ui/TruncatedText';
import { StatusRibbon } from '../../components/ui/StatusRibbon';
import { useAdminTab } from '../../context/AdminUserContext';
import { useProductTooltip, ProductTooltipCard } from '../../hooks/useProductTooltip';
import { CourierLogo } from '../../components/ui/CourierLogo';

const BACKEND_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/v1';

const STATUS_RIBBON_COLORS: Record<string, string> = {
  'Booked':            '#2563EB',
  'Not Picked':        '#F59E0B',
  'Ready To Ship':     '#4F46E5',
  'Pickup Scheduled':  '#7C3AED',
  'Picked Up':         '#4F46E5',
  'In Transit':        '#0284C7',
  'Out for Delivery':  '#F59E0B',
  'Delivered':         '#00A86B',
  'Cancelled':         '#E11D48',
  'RTO Initiated':     '#EA580C',
  'RTO In Transit':    '#EA580C',
  'RTO Delivered':     '#00A86B',
};
const getRibbonColor = (s: string) => STATUS_RIBBON_COLORS[s] || '#00A86B';


const fmt = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const fmtUtc = (d: string) => {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  const day = String(dt.getUTCDate()).padStart(2, '0');
  const month = dt.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  let h = dt.getUTCHours();
  const min = String(dt.getUTCMinutes()).padStart(2, '0');
  const amPm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${day} ${month} ${dt.getUTCFullYear()}, ${h}:${min} ${amPm}`;
};

const calcAgeingDays = (dateStr: string) => {
  const start = new Date(dateStr); start.setHours(0, 0, 0, 0);
  const end   = new Date();        end.setHours(0, 0, 0, 0);
  let count = 0; const cur = new Date(start);
  while (cur < end) { if (cur.getDay() !== 0) count++; cur.setDate(cur.getDate() + 1); }
  return count;
};

const asEmail = (v: any): string =>
  (typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) ? v.trim() : '';

const STATUS_STYLES: Record<string, string> = {
  'Booked':           'bg-slate-50 text-slate-700 border-slate-200',
  'Ready To Ship':    'bg-teal-50 text-teal-700 border-teal-200',
  'Not Picked':       'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Pickup Scheduled': 'bg-slate-50 text-slate-600 border-slate-200',
  'Picked Up':        'bg-indigo-50 text-indigo-700 border-indigo-200',
  'In Transit':       'bg-sky-50 text-sky-700 border-sky-200',
  'Out for Delivery': 'bg-amber-50 text-amber-700 border-amber-200',
  'Delivered':        'bg-emerald-50 text-emerald-700 border-emerald-200',
  'RTO Initiated':    'bg-orange-50 text-orange-700 border-orange-200',
  'RTO In Transit':   'bg-orange-50 text-orange-600 border-orange-200',
  'RTO Delivered':    'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Cancelled':        'bg-rose-50 text-rose-700 border-rose-200',
};

const mapOrder = (o: any) => {
  const l = o.packageDetails?.volumetricWeight?.length || 0;
  const w = o.packageDetails?.volumetricWeight?.width  || 0;
  const h = o.packageDetails?.volumetricWeight?.height || 0;
  const lastTracking = Array.isArray(o.tracking) && o.tracking.length > 0
    ? o.tracking[o.tracking.length - 1]
    : null;
  return {
    _id:               o._id,
    orderId:           o.orderId || o._id,
    awb:               o.awb_number || o.awbNumber || '',
    date:              o.createdAt ? fmt(o.createdAt) : '—',
    bookedDate:        o.shipmentCreatedAt ? fmt(o.shipmentCreatedAt) : '—',
    channel:           o.channel || 'CUSTOM',
    productName:       (o.productDetails || []).map((p: any) => p.name).filter(Boolean).join(', ') || '—',
    sku:               (o.productDetails || []).map((p: any) => p.sku).filter(Boolean).join(', ') || '—',
    qty:               (o.productDetails || []).reduce((s: number, p: any) => s + (p.quantity || 0), 0) || 1,
    products:          (o.productDetails || []).map((p: any) => {
      const qty   = p.quantity || 1;
      const price = Number(p.price ?? p.unitPrice ?? p.sellingPrice ?? p.amount ?? p.rate ?? 0);
      return { name: p.name || '—', sku: p.sku || '—', qty, price, total: Number(p.total ?? (price * qty)) };
    }),
    weight:            `${o.packageDetails?.applicableWeight || 0} KG`,
    dimensions:        `${l}×${w}×${h}`,
    volWeight:         `${((l * w * h) / 5000).toFixed(2)} KG`,
    payment:           o.paymentDetails?.amount ?? 0,
    paymentType:       o.paymentDetails?.method || 'Prepaid',
    customerName:      o.receiverAddress?.contactName || '—',
    customerPhone:     o.receiverAddress?.phoneNumber || '—',
    customerAddress:   o.receiverAddress?.address || '',
    customerCity:      o.receiverAddress?.city || '',
    customerState:     o.receiverAddress?.state || '',
    customerPinCode:   o.receiverAddress?.pinCode || o.receiverAddress?.pincode || '',
    customerEmail:     asEmail(o.receiverAddress?.email) || asEmail(o.customerEmail) || '',
    pickupName:        o.pickupAddress?.contactName || '—',
    pickupAddressLine: o.pickupAddress?.address || '',
    pickupCity:        o.pickupAddress?.city || '',
    pickupState:       o.pickupAddress?.state || '',
    pickupPinCode:     o.pickupAddress?.pinCode || o.pickupAddress?.pincode || '',
    pickupPhone:       o.pickupAddress?.phoneNumber || '',
    courier:           o.courierServiceName || '—',
    status:            o.status || 'New',
    lastUpdateEvent:   o.lastUpdateEvent || lastTracking?.status || '',
    lastUpdateLocation:lastTracking?.StatusLocation || '',
    lastUpdateDate:    lastTracking?.StatusDateTime || null,
  };
};

export function AdminPickupManifestDetails() {
  const { pickupId } = useParams<{ pickupId: string }>();
  const navigate     = useNavigate();
  const location     = useLocation();
  const { isAdmin, adminTab } = useAdminTab();
  const isAdminView = isAdmin && adminTab;
  const basePath    = location.pathname.startsWith('/user/') ? '/user' : '/admin';

  const [manifest,    setManifest]    = useState<any>(null);
  const [orders,      setOrders]      = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [selected,    setSelected]    = useState<string[]>([]);
  const [actionOpen,  setActionOpen]  = useState(false);
  const [copiedText,  setCopiedText]  = useState<string | null>(null);

  // Row three-dots dropdown
  const [dropdownPos, setDropdownPos] = useState<{ id: string; top: number; left: number } | null>(null);

  // Address hover popups
  const [hoveredCustomer, setHoveredCustomer] = useState<{ rect: DOMRect; name: string; address: string; city: string; state: string; pinCode: string; email: string } | null>(null);
  const [hoveredPickup,   setHoveredPickup]   = useState<{ id: string; rect: DOMRect; name: string; address: string; city: string; state: string; pinCode: string; phone: string } | null>(null);

  // Product tooltip
  const { productHoverPos, hoverOpenProductTooltip, closeProductTooltip } = useProductTooltip();

  const fetchDetails = useCallback(async () => {
    if (!pickupId) return;
    setLoading(true);
    setError(null);
    try {
      const endpoint = basePath === '/user'
        ? `/order/pickupManifest/${pickupId}`
        : `/admin/pickupManifest/${pickupId}`;
      const res = await apiClient.get(endpoint);
      const data = res.data;
      setManifest(data.manifest || null);
      const rawOrders = data.orders || data.manifest?.orders || [];
      setOrders(rawOrders.map(mapOrder));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load manifest details.');
    } finally {
      setLoading(false);
    }
  }, [pickupId, basePath]);

  useEffect(() => { fetchDetails(); }, [fetchDetails]);

  // ── Download helpers ──
  const fetchBlob = async (url: string) => {
    const token = getToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.blob();
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    window.URL.revokeObjectURL(url);
  };

  const downloadManifest = async (orderIds: string[]) => {
    if (!orderIds.length) return;
    try {
      const blob = await fetchBlob(`${BACKEND_BASE}/manifest/generate-pdf?orderIds=${orderIds.join(',')}`);
      triggerDownload(blob, 'manifest.pdf');
    } catch (e) { console.error(e); }
  };

  const downloadLabel = async (id: string) => {
    try {
      const blob = await fetchBlob(`${BACKEND_BASE}/label/get-label?orderId=${id}`);
      triggerDownload(blob, `label-${id}.pdf`);
    } catch (e) { console.error(e); }
  };

  const downloadInvoice = async (id: string) => {
    try {
      const blob = await fetchBlob(`${BACKEND_BASE}/label/invoice?orderId=${id}`);
      triggerDownload(blob, `invoice-${id}.pdf`);
    } catch (e) { console.error(e); }
  };

  const bulkDownloadLabels = async (ids: string[]) => {
    if (!ids.length) return;
    try {
      const merged = await PDFDocument.create();
      for (const id of ids) {
        try {
          const blob = await fetchBlob(`${BACKEND_BASE}/label/get-label?orderId=${id}`);
          const src  = await PDFDocument.load(await blob.arrayBuffer());
          const copied = await merged.copyPages(src, src.getPageIndices());
          copied.forEach(p => merged.addPage(p));
        } catch { /* skip */ }
      }
      const labelsBytes = await merged.save();
      triggerDownload(new Blob([labelsBytes.buffer.slice(labelsBytes.byteOffset, labelsBytes.byteOffset + labelsBytes.byteLength) as ArrayBuffer], { type: 'application/pdf' }), 'bulk-labels.pdf');
    } catch (e) { console.error(e); }
  };

  const bulkDownloadInvoices = async (ids: string[]) => {
    if (!ids.length) return;
    try {
      const merged = await PDFDocument.create();
      for (const id of ids) {
        try {
          const blob = await fetchBlob(`${BACKEND_BASE}/label/invoice?orderId=${id}`);
          const src  = await PDFDocument.load(await blob.arrayBuffer());
          const copied = await merged.copyPages(src, src.getPageIndices());
          copied.forEach(p => merged.addPage(p));
        } catch { /* skip */ }
      }
      const invoiceBytes = await merged.save();
      triggerDownload(new Blob([invoiceBytes.buffer.slice(invoiceBytes.byteOffset, invoiceBytes.byteOffset + invoiceBytes.byteLength) as ArrayBuffer], { type: 'application/pdf' }), 'bulk-invoices.pdf');
    } catch (e) { console.error(e); }
  };

  const exportExcel = (rows: any[]) => {
    const data = rows.map(o => ({
      'Order ID':     o.orderId,
      'AWB':          o.awb,
      'Booked Date':  o.bookedDate,
      'Customer':     o.customerName,
      'Phone':        o.customerPhone,
      'City':         o.customerCity,
      'State':        o.customerState,
      'Product':      o.productName,
      'SKU':          o.sku,
      'Qty':          o.qty,
      'Weight':       o.weight,
      'Dimensions':   o.dimensions,
      'Payment Type': o.paymentType,
      'Amount':       o.payment,
      'Courier':      o.courier,
      'Status':       o.status,
    }));
    const sheet = XLSX.utils.json_to_sheet(data);
    const wb    = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'Orders');
    XLSX.writeFile(wb, `pickup-${pickupId}.xlsx`);
  };

  const copyToClipboard = (text: string) => {
    const done = () => { setCopiedText(text); setTimeout(() => setCopiedText(null), 1500); };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done).catch(done);
    else done();
  };

  const toggleAll = () =>
    setSelected(selected.length === orders.length && orders.length > 0 ? [] : orders.map(o => o._id));
  const toggleOne = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const selectedOrderIds = selected.map(sid => orders.find(o => o._id === sid)?._id).filter(Boolean) as string[];

  const NOT_PICKED  = ['new', 'Booked', 'Ready To Ship', 'Not Picked', 'Cancelled'];
  const pickedCount = orders.filter(o => !NOT_PICKED.includes(o.status)).length;
  const ageingDays  = manifest?.createdAt ? calcAgeingDays(manifest.createdAt) : 0;

  // suppress unused-var warning for isAdminView (used for future admin-only columns)
  void isAdminView;

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white overflow-hidden">

        {/* ── Header — single line: back | pickup ID + copy + status | [selected] | download icon ── */}
        <div className="shrink-0 bg-white border-b border-[#E2E8F0] px-4 md:px-6 py-3">
          <div className="flex items-center gap-2">

            {/* Back */}
            <button
              onClick={() => navigate(`${basePath}/orders/pickup-manifest`)}
              className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:bg-[#F8FAFC] transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Pickup ID + copy + status — flex-1 so it fills remaining space, truncates gracefully */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-sm md:text-base font-bold text-[#0F172A] shrink-0">Pickup ID:</span>
              <span className="text-sm md:text-base font-bold text-[#00A86B] truncate">{manifest?.pickupId || pickupId}</span>
              <button
                onClick={() => copyToClipboard(manifest?.pickupId || pickupId || '')}
                className="text-[#94A3B8] hover:text-[#00A86B] transition-colors focus:outline-none shrink-0"
              >
                {copiedText === (manifest?.pickupId || pickupId)
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-[#00A86B]" />
                  : <Copy className="w-3.5 h-3.5" />}
              </button>
              {manifest?.status && (
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full border border-violet-200 bg-violet-50 text-violet-700 text-[10px] font-semibold uppercase tracking-wider shrink-0">
                  {(manifest.status || '').replace(/_/g, ' ')}
                </span>
              )}
            </div>

            {/* Bulk selected dropdown — shrinks, icon-only on very small screens */}
            {selected.length > 0 && (
              <div className="relative shrink-0">
                <button
                  onClick={() => setActionOpen(v => !v)}
                  className="h-8 px-2.5 rounded-lg bg-white border border-[#03C27D] text-[#475569] text-xs font-semibold flex items-center gap-1 hover:bg-[#F0FDF9] transition-colors"
                >
                  <span className="hidden xs:inline">{selected.length}</span>
                  <span className="hidden sm:inline"> selected</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#94A3B8] transition-transform ${actionOpen ? 'rotate-180' : ''}`} />
                </button>
                {actionOpen && (
                  <>
                    <div className="fixed inset-0 z-[49]" onClick={() => setActionOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-[200px] bg-white rounded-xl shadow-xl border border-[#E2E8F0] py-1.5 z-50">
                      <button onClick={() => { exportExcel(orders.filter(o => selected.includes(o._id))); setActionOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]">Export Excel</button>
                      <button onClick={() => { bulkDownloadLabels(selectedOrderIds); setActionOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]">Download Labels</button>
                      <button onClick={() => { bulkDownloadInvoices(selectedOrderIds); setActionOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]">Download Invoices</button>
                      <button onClick={() => { downloadManifest(selectedOrderIds); setActionOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]">Download Manifests</button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Download Manifest — icon-only on mobile, icon+text on sm+ */}
            <button
              onClick={() => downloadManifest(orders.map(o => o._id))}
              disabled={!orders.length}
              className="h-8 w-8 sm:w-auto sm:px-3 rounded-lg bg-[#00A86B] text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#009B63] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Download Manifest</span>
            </button>
          </div>

          {/* Info cards */}
          {manifest && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
              <div className="bg-[#F8FAFC] rounded-xl p-3 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#00A86B] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-0.5">Pickup Address</div>
                  <div className="text-[12px] font-semibold text-[#0F172A] truncate">{manifest.pickupAddress?.contactName || '—'}</div>
                  <div className="text-[11px] text-[#64748B] truncate">{manifest.pickupAddress?.city}{manifest.pickupAddress?.state ? `, ${manifest.pickupAddress.state}` : ''}</div>
                </div>
              </div>
              <div className="bg-[#F8FAFC] rounded-xl p-3 flex items-start gap-2">
                <Calendar className="w-4 h-4 text-[#00A86B] shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-0.5">Pickup Date</div>
                  <div className="text-[12px] font-semibold text-[#0F172A]">{fmt(manifest.pickupDate)}</div>
                  <div className="text-[11px] text-[#64748B]">Requested {fmt(manifest.createdAt)}</div>
                </div>
              </div>
              <div className="bg-[#F8FAFC] rounded-xl p-3 flex items-start gap-2">
                <Package className="w-4 h-4 text-[#00A86B] shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-0.5">Total / Picked</div>
                  <div className="text-[12px] font-bold text-[#0F172A]">{orders.length} / {pickedCount}</div>
                  <div className="text-[11px] text-[#64748B]">shipments</div>
                </div>
              </div>
              <div className="bg-[#F8FAFC] rounded-xl p-3 flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#00A86B] shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-0.5">Ageing</div>
                  {ageingDays <= 1
                    ? <div className="text-[12px] font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />On schedule</div>
                    : ageingDays <= 3
                      ? <div className="text-[12px] font-semibold text-amber-600">{ageingDays}d pending</div>
                      : <div className="text-[12px] font-bold text-rose-600">{ageingDays}d overdue</div>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Desktop table ── */}
        <div className="hidden md:flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-auto relative">
            {loading && <TableLoader />}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <p className="text-sm text-red-500 font-medium">{error}</p>
                <button onClick={fetchDetails} className="h-8 px-4 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63]">Retry</button>
              </div>
            )}
            {!loading && !error && (
              <table className="w-full text-left border-collapse min-w-full">
                <thead className="sticky top-0 z-40 bg-[#E6F9F2] shadow-sm">
                  <tr className="text-xs font-medium text-[#64748B] uppercase tracking-wider border border-[#B9EFDB]">
                    <th className="py-2 px-4 w-10 rounded-l-lg">
                      <input type="checkbox"
                        checked={selected.length === orders.length && orders.length > 0}
                        onChange={toggleAll}
                        className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                    </th>
                    <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 shrink-0" /><span>Order</span></div></th>
                    <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><Package className="w-3.5 h-3.5 shrink-0" /><span>Product</span></div></th>
                    <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><Package className="w-3.5 h-3.5 shrink-0" /><span>Package</span></div></th>
                    <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5 shrink-0" /><span>Payment</span></div></th>
                    <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><User className="w-3.5 h-3.5 shrink-0" /><span>Customer</span></div></th>
                    <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 shrink-0" /><span>Pickup</span></div></th>
                    <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 shrink-0" /><span>Shipment</span></div></th>
                    <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>Status</span></div></th>
                    <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><History className="w-3.5 h-3.5 shrink-0" /><span>Last Update</span></div></th>
                    <th className="py-2 px-4 whitespace-nowrap rounded-r-lg"><div className="flex items-center gap-1"><Settings className="w-3.5 h-3.5 shrink-0" /><span>Actions</span></div></th>
                  </tr>
                </thead>
                <tbody className="text-[11px] text-[#475569]">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={11}>
                        <EmptyState title="No shipments found" subtitle="This manifest has no orders yet" />
                      </td>
                    </tr>
                  ) : orders.map((o, idx) => (
                    <tr key={o._id}
                      className={`border-b border-[#E2E8F0] transition-colors group ${idx % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'}`}>

                      {/* Checkbox */}
                      <td className="p-3">
                        <input type="checkbox" checked={selected.includes(o._id)} onChange={() => toggleOne(o._id)}
                          className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                      </td>

                      {/* Order */}
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 group/copy w-max">
                            <div
                              className="text-[12px] leading-[18px] font-semibold text-[#009D64] hover:underline cursor-pointer"
                              onClick={() => navigate(`${basePath}/order-tracking?id=${o.orderId}`)}
                            >{o.orderId}</div>
                            <button onClick={(e) => { e.stopPropagation(); copyToClipboard(o.orderId); }}
                              className="opacity-100 md:opacity-0 md:group-hover/copy:opacity-100 transition-opacity shrink-0 focus:outline-none">
                              <Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" />
                            </button>
                          </div>
                          <div className="text-[12px] leading-[18px] font-normal text-[#64748B]">{o.date}</div>
                          <span className="px-2 py-0.5 rounded-full border border-blue-200 text-[#004AAD] font-semibold text-[10px] leading-4 bg-blue-50/50 inline-block uppercase w-fit">
                            {o.channel === 'WooCommerce' ? 'Woo' : (o.channel || 'CUSTOM')}
                          </span>
                        </div>
                      </td>

                      {/* Product */}
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <div
                            className="text-[12px] leading-[18px] font-normal text-[#1E293B] underline decoration-dotted underline-offset-2 hover:text-[#00A86B] truncate max-w-[120px] cursor-help"
                            onMouseEnter={(e) => { if (!o.products.length) return; hoverOpenProductTooltip(o._id, e); }}
                            onMouseLeave={() => closeProductTooltip(o._id)}
                          >{o.productName || '—'}</div>
                          <div className="text-[12px] leading-[18px] font-normal text-[#1E293B] truncate max-w-[120px]">SKU: {o.sku || '—'}</div>
                          <div className="text-[12px] leading-[18px] font-normal text-[#1E293B]">QTY: {o.qty}</div>
                        </div>
                      </td>

                      {/* Package */}
                      <td className="p-3">
                        <div className="flex flex-col gap-1 text-[12px] leading-[18px] font-normal text-[#1E293B]">
                          <div>Weight: {o.weight}</div>
                          <div>L×W×H: {o.dimensions}</div>
                          <div>Vol: {o.volWeight}</div>
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <div className="text-[12px] leading-[18px] font-normal text-[#64748B] ml-[3px]">&#8377;{o.payment}</div>
                          <span className="px-2 py-0.5 rounded-full border border-blue-200 text-[#004AAD] font-semibold text-[10px] leading-4 bg-blue-50/50 inline-block w-fit">{o.paymentType}</span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <div
                            className="text-[12px] leading-[18px] font-normal text-[#1E293B] underline decoration-dotted underline-offset-2 hover:text-[#00A86B] cursor-help inline-block truncate max-w-[110px]"
                            onMouseEnter={(e) => setHoveredCustomer({ rect: e.currentTarget.getBoundingClientRect(), name: o.customerName, address: o.customerAddress, city: o.customerCity, state: o.customerState, pinCode: o.customerPinCode, email: o.customerEmail })}
                            onMouseLeave={() => setHoveredCustomer(null)}
                          >{o.customerName}</div>
                          <div className="text-[12px] leading-[18px] font-normal text-[#64748B]">{o.customerPhone}</div>
                        </div>
                      </td>

                      {/* Pickup */}
                      <td className="p-3">
                        <div
                          className="text-[12px] leading-[18px] font-normal text-[#1E293B] underline decoration-dotted underline-offset-2 hover:text-[#00A86B] cursor-help inline-block truncate max-w-[100px]"
                          onMouseEnter={(e) => setHoveredPickup({ id: o._id, rect: e.currentTarget.getBoundingClientRect(), name: o.pickupName, address: o.pickupAddressLine, city: o.pickupCity, state: o.pickupState, pinCode: o.pickupPinCode, phone: o.pickupPhone })}
                          onMouseLeave={() => setHoveredPickup(null)}
                        >{o.pickupName}</div>
                      </td>

                      {/* Shipment */}
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <div className="text-[12px] leading-[18px] font-semibold text-[#009D64]">{o.courier}</div>
                          <div className="text-[12px] leading-[18px] font-normal text-[#1E293B]">Booked | {o.bookedDate}</div>
                          <div className="flex items-center gap-1 group/awb">
                            <div
                              onClick={() => o.awb && navigate(`${basePath}/tracking?awb=${o.awb}`)}
                              className="text-[12px] leading-[18px] font-semibold text-[#009D64] underline hover:text-[#009B63] cursor-pointer truncate max-w-[120px]"
                            >{o.awb || '—'}</div>
                            {o.awb && (
                              <button onClick={(e) => { e.stopPropagation(); copyToClipboard(o.awb); }}
                                className="opacity-100 md:opacity-0 md:group-hover/awb:opacity-100 transition-opacity shrink-0 focus:outline-none">
                                <Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap ${STATUS_STYLES[o.status] || 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                          {o.status}
                        </span>
                      </td>

                      {/* Last Update */}
                      <td className="p-3">
                        {o.lastUpdateDate ? (
                          <div className="flex flex-col gap-0.5">
                            {o.lastUpdateLocation && (
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-[#00A86B] shrink-0" />
                                <span className="font-semibold text-[#0F172A] text-[11px] truncate max-w-[120px]">{o.lastUpdateLocation}</span>
                              </div>
                            )}
                            <span className="text-[10px] text-[#64748B] pl-3.5">{fmtUtc(o.lastUpdateDate)}</span>
                          </div>
                        ) : (
                          <button onClick={fetchDetails}
                            className="text-[10px] font-bold text-[#00A86B] hover:underline flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" /> Fetch
                          </button>
                        )}
                      </td>

                      {/* Actions — three-dots */}
                      <td className="p-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (dropdownPos?.id === o._id) { setDropdownPos(null); return; }
                            const rect = e.currentTarget.getBoundingClientRect();
                            setDropdownPos({ id: o._id, top: rect.bottom + 4, left: rect.right - 176 });
                          }}
                          className={`w-7 h-7 rounded-full border flex items-center justify-center z-10 transition-colors cursor-pointer ${dropdownPos?.id === o._id ? 'bg-green-100 border-[#00A86B] text-[#00A86B]' : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'}`}
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Mobile Card Layout ── */}
        <div className="md:hidden flex-1 min-h-0 flex flex-col bg-[#F8FAFC]">
          <div className="flex-1 overflow-y-auto relative">
            {loading && <TableLoader />}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center h-64 gap-3 px-4">
                <p className="text-sm text-red-500 font-medium text-center">{error}</p>
                <button onClick={fetchDetails} className="h-8 px-4 rounded-lg bg-[#00A86B] text-white text-xs font-bold">Retry</button>
              </div>
            )}
            {!loading && !error && orders.length === 0 && (
              <div className="flex items-center justify-center min-h-[60vh]">
                <EmptyState title="No shipments found" subtitle="This manifest has no orders yet" />
              </div>
            )}
            {!loading && !error && orders.length > 0 && (
              <div className="p-2 space-y-2">
                {/* Bulk selection banner */}
                {selected.length > 0 && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-700 flex-1">{selected.length} selected</span>
                    <button onClick={() => bulkDownloadLabels(selectedOrderIds)}
                      className="h-7 px-2.5 rounded-lg bg-white border border-blue-200 text-[11px] font-bold text-blue-700">Labels</button>
                    <button onClick={() => downloadManifest(selectedOrderIds)}
                      className="h-7 px-2.5 rounded-lg bg-white border border-blue-200 text-[11px] font-bold text-blue-700">Manifests</button>
                    <button onClick={() => exportExcel(orders.filter(o => selected.includes(o._id)))}
                      className="h-7 px-2.5 rounded-lg bg-white border border-blue-200 text-[11px] font-bold text-blue-700">Excel</button>
                    <button onClick={() => setSelected([])} className="p-1.5 text-blue-400 hover:text-blue-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {orders.map(o => {
                  const accent = getRibbonColor(o.status);
                  return (
                    <div key={o._id} className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
                      {/* Status ribbon — absolute top-left, same as AdminOrders */}
                      <StatusRibbon label={o.status} color={accent} />

                      {/* Checkbox — absolute top-right */}
                      <input
                        type="checkbox"
                        checked={selected.includes(o._id)}
                        onChange={() => toggleOne(o._id)}
                        className="absolute top-2 right-2.5 rounded border-gray-300 accent-[#00A86B] w-4 h-4 shrink-0 z-10"
                      />

                      <div className="pt-7 px-2 pb-2">
                        {/* Order ID row */}
                        <div className="flex items-center justify-between mb-1 gap-2 pr-6">
                          <span
                            className="text-[12px] font-semibold text-[#0F172A] bg-[#F1F5F9] px-2 py-0.5 rounded-full shrink-0 cursor-pointer hover:bg-[#E2E8F0]"
                            onClick={() => navigate(`${basePath}/order-tracking?id=${o.orderId}`)}
                          >{o.orderId}</span>
                          <span className="text-[11px] text-[#94A3B8] shrink-0">{o.date}</span>
                        </div>

                        {/* Courier & payment card — accent-bordered */}
                        <div className="rounded-xl p-1.5 mb-1.5 bg-white" style={{ border: `1px solid ${accent}` }}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              {o.courier ? (
                                <CourierLogo name={o.courier} size="sm" className="shadow-sm" />
                              ) : (
                                <div className="w-9 h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-center shrink-0">
                                  <Truck className="w-4 h-4 text-[#94A3B8]" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="text-[12px] font-normal text-[#0F172A] truncate">
                                  {o.courier !== '—' ? o.courier : 'Courier not assigned'} {o.weight ? `· ${o.weight}` : ''}
                                </div>
                                <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
                                  {o.awb ? (
                                    <>
                                      <span
                                        onClick={() => navigate(`${basePath}/tracking?awb=${o.awb}`)}
                                        className="text-[12px] font-semibold text-[#00A86B] underline truncate active:opacity-60 cursor-pointer"
                                      >{o.awb}</span>
                                      <button onClick={(e) => { e.stopPropagation(); copyToClipboard(o.awb); }} className="shrink-0 focus:outline-none">
                                        <Copy className="w-3 h-3 text-[#94A3B8]" />
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-[12px] font-semibold text-[#94A3B8] truncate">AWB not generated</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-[12px] font-normal text-[#0F172A]">{o.paymentType}</div>
                              <div className="text-[12px] font-semibold text-[#00A86B]">&#8377;{o.payment}</div>
                            </div>
                          </div>
                        </div>

                        {/* Product & Weight row */}
                        <div
                          className="flex items-start justify-between mb-1.5 px-1 gap-2 cursor-help"
                          onClick={(e) => {
                            if (!o.products?.length) return;
                            // reuse hoverOpenProductTooltip — opens on tap for mobile
                            hoverOpenProductTooltip(o._id, e);
                          }}
                        >
                          <TruncatedText
                            text={o.productName || '—'}
                            maxLength={30}
                            className="text-[12px] font-normal text-[#0F172A] underline decoration-dotted underline-offset-2 flex-1"
                          />
                          <span className="text-[11px] font-medium text-[#64748B] shrink-0">Weight: {o.weight}</span>
                        </div>

                        {/* Pickup (left) / Customer (right) tap-to-show card */}
                        <div className="flex items-start justify-between bg-[#F8FAFC] rounded-xl px-2.5 py-1.5 mb-1.5 gap-2">
                          <div
                            className="min-w-0 cursor-help"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              const next = { id: o._id, rect, name: o.pickupName, address: o.pickupAddressLine, city: o.pickupCity, state: o.pickupState, pinCode: o.pickupPinCode, phone: o.pickupPhone };
                              setHoveredPickup(prev => (prev?.id === o._id ? null : next));
                            }}
                          >
                            <div className="truncate text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider underline decoration-dotted underline-offset-2">{o.pickupName}</div>
                            <div className="text-[12px] font-medium text-[#0F172A] mt-0.5">{o.pickupPhone}</div>
                          </div>
                          <div
                            className="text-right min-w-0 cursor-help"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              const next = { rect, name: o.customerName, address: o.customerAddress, city: o.customerCity, state: o.customerState, pinCode: o.customerPinCode, email: o.customerEmail };
                              setHoveredCustomer(prev => (prev ? null : next));
                            }}
                          >
                            <div className="truncate text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider underline decoration-dotted underline-offset-2">{o.customerName}</div>
                            <div className="text-[12px] font-medium text-[#0F172A] mt-0.5">{o.customerPhone}</div>
                          </div>
                        </div>

                        {/* Last update strip */}
                        {o.lastUpdateDate && (
                          <div className="flex items-center gap-1.5 px-1 mb-1.5">
                            <div className="w-2 h-2 rounded-full bg-[#00A86B] shrink-0" />
                            <span className="text-[11px] text-[#0F172A] font-medium truncate">{o.lastUpdateLocation || o.lastUpdateEvent}</span>
                            <span className="text-[10px] text-[#94A3B8] ml-auto shrink-0">{fmtUtc(o.lastUpdateDate)}</span>
                          </div>
                        )}

                        {/* Actions row — "View Details" + three-dots (same as AdminOrders) */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`${basePath}/order-tracking?id=${o.orderId}`)}
                            className="flex-1 py-2 rounded-xl bg-[#1e40af] text-white text-[12px] font-bold flex items-center justify-center gap-1.5 hover:bg-[#1e3a8a] transition-colors"
                          >View Details</button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (dropdownPos?.id === o._id) { setDropdownPos(null); return; }
                              const rect = e.currentTarget.getBoundingClientRect();
                              setDropdownPos({ id: o._id, top: rect.bottom + 4, left: rect.right - 176 });
                            }}
                            className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 transition-colors ${dropdownPos?.id === o._id ? 'bg-green-100 border-[#00A86B] text-[#00A86B]' : 'border-[#E2E8F0] text-[#64748B] bg-white'}`}
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row-action dropdown portal ── */}
      {dropdownPos && createPortal(
        <>
          <div className="fixed inset-0 z-[998]" onClick={() => setDropdownPos(null)} />
          <div
            className="fixed z-[999] w-44 bg-white rounded-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.15)] border border-[#E2E8F0] py-2"
            style={{ top: dropdownPos.top, left: Math.max(4, Math.min(dropdownPos.left, window.innerWidth - 180)) }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {(() => {
              const o = orders.find(x => x._id === dropdownPos.id);
              if (!o) return null;
              const close = () => setDropdownPos(null);
              return (
                <>
                  <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
                    onClick={() => { downloadLabel(o._id); close(); }}>Download Label</button>
                  <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
                    onClick={() => { downloadInvoice(o._id); close(); }}>Download Invoice</button>
                  <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
                    onClick={() => { downloadManifest([o._id]); close(); }}>Download Manifest</button>
                  <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
                    onClick={() => { navigate(`${basePath}/order-tracking?id=${o.orderId}`); close(); }}>View Tracking</button>
                  <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
                    onClick={() => { navigate(`${basePath}/add-order?cloneId=${o._id}`); close(); }}>Clone Order</button>
                </>
              );
            })()}
          </div>
        </>,
        document.body
      )}

      {/* ── Shared backdrop for address tooltips on mobile ── */}
      {(hoveredPickup || hoveredCustomer) && createPortal(
        <div className="fixed inset-0 z-[997] md:hidden"
          onClick={() => { setHoveredPickup(null); setHoveredCustomer(null); }} />,
        document.body
      )}

      {/* ── Pickup address tooltip ── */}
      {hoveredPickup && (() => {
        const showBelow = hoveredPickup.rect.top < 260;
        return createPortal(
          <div className="fixed z-[9999] pointer-events-none bg-[#0F172A] text-white text-xs p-3 rounded-xl shadow-xl w-64"
            style={{
              top: showBelow ? hoveredPickup.rect.bottom + 10 : hoveredPickup.rect.top - 10,
              left: Math.min(Math.max(hoveredPickup.rect.left + hoveredPickup.rect.width / 2, 140), window.innerWidth - 140),
              transform: showBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            }}>
            <div className="font-bold flex items-center gap-1.5 mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#00A86B] shrink-0" />{hoveredPickup.name}
            </div>
            <div className="text-slate-300 font-normal leading-relaxed border-t border-white/10 pt-1.5 break-words whitespace-normal">
              {hoveredPickup.address || 'No address on file'}
              {(hoveredPickup.city || hoveredPickup.state || hoveredPickup.pinCode) && (
                <div>{[hoveredPickup.city, hoveredPickup.state].filter(Boolean).join(', ')}{hoveredPickup.pinCode ? ` – ${hoveredPickup.pinCode}` : ''}</div>
              )}
              {hoveredPickup.phone && <div className="text-slate-400 mt-1">{hoveredPickup.phone}</div>}
            </div>
            {showBelow
              ? <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 border-[6px] border-transparent border-b-[#0F172A]" />
              : <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#0F172A]" />}
          </div>,
          document.body
        );
      })()}

      {/* ── Customer address tooltip ── */}
      {hoveredCustomer && (() => {
        const showBelow = hoveredCustomer.rect.top < 260;
        return createPortal(
          <div className="fixed z-[9999] pointer-events-none bg-[#0F172A] text-white text-xs font-normal p-3 rounded-xl shadow-xl w-72"
            style={{
              top: showBelow ? hoveredCustomer.rect.bottom + 10 : hoveredCustomer.rect.top - 10,
              left: Math.min(Math.max(hoveredCustomer.rect.left + hoveredCustomer.rect.width / 2, 150), window.innerWidth - 150),
              transform: showBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            }}>
            <div className="font-normal flex items-center gap-1.5 mb-1.5">
              <User className="w-3.5 h-3.5 text-[#00A86B] shrink-0" />{hoveredCustomer.name}
            </div>
            {(hoveredCustomer.address || hoveredCustomer.city || hoveredCustomer.state || hoveredCustomer.pinCode) && (
              <div className="text-slate-300 font-normal leading-relaxed border-t border-white/10 pt-1.5 break-words whitespace-normal">
                {hoveredCustomer.address}
                {(hoveredCustomer.city || hoveredCustomer.state || hoveredCustomer.pinCode) && (
                  <div className="mt-0.5">
                    {[hoveredCustomer.city, hoveredCustomer.state].filter(Boolean).join(', ')}
                    {hoveredCustomer.pinCode && ` - ${hoveredCustomer.pinCode}`}
                  </div>
                )}
              </div>
            )}
            {hoveredCustomer.email && (
              <div className="flex items-center gap-1.5 text-slate-300 font-normal mt-1.5 pt-1.5 border-t border-white/10 break-all">
                <Mail className="w-3.5 h-3.5 text-[#00A86B] shrink-0" />{hoveredCustomer.email}
              </div>
            )}
            {showBelow
              ? <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 border-[6px] border-transparent border-b-[#0F172A]" />
              : <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#0F172A]" />}
          </div>,
          document.body
        );
      })()}

      {/* ── Product line-item hover card ── */}
      <ProductTooltipCard
        productHoverPos={productHoverPos}
        order={orders.find(o => o._id === productHoverPos?.id)}
      />
    </AdminLayout>
  );
}
