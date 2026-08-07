import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';
import { getToken } from '../../utils/session';
import { ShipOrderModal } from '../../components/admin/orders/ShipOrderModal';
import {
  ArrowLeft, AlertTriangle, Copy, Check, Truck, ClipboardList, MapPin, Navigation,
  Package, Receipt, Map, History, X, Phone, Clock, Home, Info, FileText,
} from 'lucide-react';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';

// Milestone timeline icons are looked up dynamically by name (see getMilestonesFromStatus).
const MILESTONE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'check': Check, 'x': X, 'truck': Truck, 'package': Package, 'map-pin': MapPin,
  'alert-triangle': AlertTriangle, 'file-text': FileText, 'home': Home,
};

// ── API Types ──────────────────────────────────────────────────────────────────

interface TrackingEntry {
  status?: string;
  StatusLocation?: string;
  StatusDateTime?: string;
  Instructions?: string;
}

interface OrderData {
  _id: string;
  orderId?: number | string;
  userId?: string;
  channel?: string;
  channelId?: number;
  createdAt?: string;
  shipmentCreatedAt?: string;
  pickupDate?: string;
  estimatedDeliveryDate?: string;
  pickupAddress?: {
    contactName?: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
    pinCode?: string;
    city?: string;
    state?: string;
  };
  receiverAddress?: {
    contactName?: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
    pinCode?: string;
    city?: string;
    state?: string;
  };
  productDetails?: Array<{
    quantity?: number;
    name?: string;
    unitPrice?: number;
  }>;
  packageDetails?: {
    deadWeight?: number;
    applicableWeight?: number;
    volumetricWeight?: {
      length?: number;
      width?: number;
      height?: number;
      calculatedWeight?: number;
    };
  };
  paymentDetails?: {
    method?: string;
    amount?: number;
  };
  codProcessed?: boolean;
  priceBreakup?: {
    freight?: number;
    cod?: number;
    gst?: number;
    total?: number;
  };
  status?: string;
  ndrStatus?: string;
  reattempt?: boolean;
  ndrReason?: string | { date?: string; reason?: string };
  ndrHistory?: Array<{
    date?: string;
    reason?: string;
    action?: string;
    status?: string;
  }>;
  awb_number?: string;
  courierServiceName?: string;
  courierName?: string;
  pickupId?: string;
  tracking?: TrackingEntry[];
}

interface DiscrepancyData {
  _id?: string;
  enteredWeight?: number;
  chargedWeight?: number;
  chargeDimension?: string;
  excessWeightCharges?: number;
  clientStatus?: string;
  adminStatus?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatDate = (dateStr?: string, includeTime = false): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const opts: Intl.DateTimeFormatOptions = {
    day: '2-digit', month: 'short', year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit', hour12: true } : {}),
  };
  return d.toLocaleString('en-IN', opts);
};

const formatTrackingDate = (dateStr?: string): { date: string; time: string } => {
  if (!dateStr) return { date: '—', time: '' };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { date: dateStr, time: '' };
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const year = d.getUTCFullYear();
  let hours = d.getUTCHours();
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  const amPm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return { date: `${day} ${month} ${year}`, time: `${hours}:${minutes} ${amPm}` };
};

const mapApiStatus = (status?: string): 'placed' | 'ready' | 'transit' | 'delivered' | 'cancelled' => {
  if (!status) return 'placed';
  const s = status.toLowerCase().trim();
  if (s === 'delivered' || s === 'rto delivered') return 'delivered';
  if (s === 'cancelled' || s === 'lost' || s === 'damaged' || s.startsWith('rto')) return 'cancelled';
  if (s === 'in-transit' || s === 'in transit' || s === 'out for delivery' || s === 'pickup & manifest' || s === 'pickup scheduled') return 'transit';
  if (s === 'booked' || s === 'not picked' || s === 'ready to ship') return 'ready';
  return 'placed'; // covers 'new' and unknowns
};

// ── Status badge styles (mirrors AdminOrders STATUS_BADGE_STYLES) ──────────────
const STATUS_BADGE_STYLES: Record<string, string> = {
  'New':               'bg-slate-50 text-slate-700 border-slate-200',
  'Booked':            'bg-blue-50 text-blue-700 border-blue-200',
  'Not Picked':        'bg-amber-50 text-amber-700 border-amber-200',
  'Ready To Ship':     'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Pickup & Manifest': 'bg-violet-50 text-violet-700 border-violet-200',
  'Pickup Scheduled':  'bg-violet-50 text-violet-700 border-violet-200',
  'In-transit':        'bg-sky-50 text-sky-700 border-sky-200',
  'In-Transit':        'bg-sky-50 text-sky-700 border-sky-200',
  'In Transit':        'bg-sky-50 text-sky-700 border-sky-200',
  'Delivered':         'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Out for Delivery':  'bg-amber-50 text-amber-700 border-amber-200',
  'Cancelled':         'bg-rose-50 text-rose-700 border-rose-200',
  'Lost':              'bg-slate-100 text-slate-500 border-slate-200',
  'Damaged':           'bg-rose-50 text-rose-700 border-rose-200',
  'RTO Initiated':     'bg-orange-50 text-orange-700 border-orange-200',
  'RTO In Transit':    'bg-orange-50 text-orange-700 border-orange-200',
  'RTO Delivered':     'bg-emerald-50 text-emerald-700 border-emerald-200',
  'RTO Lost':          'bg-slate-100 text-slate-500 border-slate-200',
  'RTO Damaged':       'bg-rose-50 text-rose-700 border-rose-200',
};

const getMilestonesFromStatus = (rawStatus: string, order?: OrderData) => {
  const created = order?.createdAt ? formatDate(order.createdAt) : '';
  const shipmentCreated = order?.shipmentCreatedAt ? formatDate(order.shipmentCreatedAt) : '';
  const pickedUp = order?.pickupDate ? formatDate(order.pickupDate) : '';
  const estimated = order?.estimatedDeliveryDate ? formatDate(order.estimatedDeliveryDate) : '';
  const s = (rawStatus || 'new').toLowerCase().trim();

  // RTO flow – 4-step timeline
  if (s.startsWith('rto')) {
    const isRTOTransit   = s === 'rto in transit';
    const isRTODelivered = s === 'rto delivered';
    const isRTOLost      = s === 'rto lost';
    const isRTODamaged   = s === 'rto damaged';
    const afterInitiated = isRTOTransit || isRTODelivered || isRTOLost || isRTODamaged;
    const afterTransit   = isRTODelivered || isRTOLost || isRTODamaged;
    return [
      { name: 'Delivery Attempt', date: created, status: 'completed',                                              icon: 'package' },
      { name: 'RTO Initiated',    date: '',       status: afterInitiated ? 'completed' : 'active',                  icon: 'alert-triangle' },
      { name: 'RTO In Transit',   date: '',       status: afterTransit ? 'completed' : isRTOTransit ? 'active' : 'pending', icon: 'truck' },
      { name: isRTOLost ? 'RTO Lost' : isRTODamaged ? 'RTO Damaged' : 'RTO Delivered',
        date: afterTransit ? estimated : '(pending)',
        status: afterTransit ? 'active' : 'pending',
        icon: isRTOLost || isRTODamaged ? 'alert-triangle' : 'home' },
    ];
  }

  // Cancelled
  if (s === 'cancelled') {
    return [
      { name: 'Order Placed',    date: created, status: 'completed', icon: 'check' },
      { name: 'Order Cancelled', date: '',       status: 'active',    icon: 'x' },
    ];
  }

  // Lost / Damaged
  if (s === 'lost' || s === 'damaged') {
    return [
      { name: 'Order Placed', date: created,  status: 'completed', icon: 'check' },
      { name: 'Picked Up',    date: pickedUp, status: 'completed', icon: 'check' },
      { name: 'In Transit',   date: '',       status: 'completed', icon: 'truck' },
      { name: s === 'lost' ? 'Lost' : 'Damaged', date: '', status: 'active', icon: 'alert-triangle' },
    ];
  }

  // Standard 6-step delivery flow
  // 0 = Order Placed      → new
  // 1 = Label Created     → Booked / Not Picked / Ready To Ship
  // 2 = Pickup Confirmed  → Pickup Scheduled
  // 3 = In Transit        → Pickup & Manifest / In-transit / In Transit
  // 4 = Out for Delivery  → Out for Delivery
  // 5 = Delivered         → Delivered
  let activeIdx = 0;
  if (s === 'booked' || s === 'not picked' || s === 'ready to ship') activeIdx = 1;
  else if (s === 'pickup scheduled')                                   activeIdx = 2;
  else if (s === 'pickup & manifest' || s === 'in-transit' || s === 'in transit') activeIdx = 3;
  else if (s === 'out for delivery')                                   activeIdx = 4;
  else if (s === 'delivered')                                          activeIdx = 5;

  const milestoneNames = ['Order Placed', 'Label Created', 'Pickup Confirmed', 'In Transit', 'Out for Delivery', 'Delivered'];
  const milestoneIcons = ['check', 'file-text', 'truck', 'truck', 'map-pin', 'package'];
  const milestoneDates = [created, shipmentCreated || created, pickedUp, '', '', estimated];

  return milestoneNames.map((name, i) => ({
    name,
    date:   i <= activeIdx ? (milestoneDates[i] || '') : '(pending)',
    status: i < activeIdx ? 'completed' : i === activeIdx ? 'active' : 'pending',
    icon:   milestoneIcons[i],
  }));
};


// ── Courier Logo ───────────────────────────────────────────────────────────────

const getCourierLogo = (courierName: string): string => {
  const name = (courierName || '').toLowerCase().trim();
  if (!name || name === '—') return '';
  if (name.includes('delhivery'))               return '/brands/delhivery.png';
  if (name.includes('amazon'))                  return '/brands/amazon.png';
  if (name.includes('dtdc'))                    return '/brands/dtdc.png';
  if (name.includes('ekart'))                   return '/brands/ekart.png';
  if (name.includes('losung') || name.includes('lousung')) return '/brands/losung.jpg';
  if (name.includes('shadowfax'))               return '/brands/shadowfax.png';
  if (name.includes('shiprocket'))              return '/brands/shiprocket.jpg';
  if (name.includes('shree') || name.includes('maruti'))   return '/brands/shree_maruti.jpg';
  if (name.includes('xpressbees'))              return '/brands/xpressbees.png';
  if (name.includes('bluedart') || name.includes('blue dart')) return '/brands/bluedart.png';
  return '';
};

interface CourierLogoProps {
  name: string;
  size?: 'sm' | 'md';
}

const CourierLogo: React.FC<CourierLogoProps> = ({ name, size = 'sm' }) => {
  const logoUrl = getCourierLogo(name);
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-[14px]' : 'w-12 h-10 text-[18px]';
  const imgSizeClass = size === 'sm' ? 'w-8 h-8' : 'w-12 h-10';
  const [imgError, setImgError] = useState(false);

  if (!logoUrl || imgError) {
    return (
      <div className={`${sizeClass} flex items-center justify-center rounded bg-slate-100 border border-slate-200 text-[#94A3B8] font-bold shrink-0 uppercase shadow-sm`}>
        {(name || '?').charAt(0)}
      </div>
    );
  }

  return (
    <img
      key={logoUrl}
      src={logoUrl}
      alt={name}
      className={`${imgSizeClass} object-contain rounded shrink-0 bg-transparent`}
      onError={() => setImgError(true)}
    />
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

const BACKEND_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/v1';

export function AdminOrderTracking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('id') || '';

  // API state
  const [order, setOrder] = useState<OrderData | null>(null);
  const [discrepancy, setDiscrepancy] = useState<DiscrepancyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [copiedId, setCopiedId] = useState(false);
  const [copiedAwb, setCopiedAwb] = useState(false);
  const [isHeaderDropdownOpen, setIsHeaderDropdownOpen] = useState(false);
  const [chargesTab, setChargesTab] = useState<'billed' | 'dispute'>('billed');
  const [showNdrHistory, setShowNdrHistory] = useState(false);
  const { toast: toastState, showToast: showToastMsg, closeToast } = useToast();
  const setToastMessage = (msg: string | null) => msg ? showToastMsg('success', msg) : closeToast();
  const [showUpdateInfoModal, setShowUpdateInfoModal] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [shipOrder, setShipOrder] = useState<any | null>(null);

  // Raise dispute state
  const [showRaiseDisputeModal, setShowRaiseDisputeModal] = useState(false);
  const [disputeText, setDisputeText] = useState('');
  const [disputeFile, setDisputeFile] = useState<File | null>(null);
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const [disputeError, setDisputeError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch order data
  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    apiClient.get(`/order/getOrderById/${orderId}`)
      .then(res => {
        const data = res.data?.order || res.data?.data || res.data;
        setOrder(data);
      })
      .catch(() => setError('Failed to load order details. Please try again.'))
      .finally(() => setLoading(false));
  }, [orderId]);

  // Fetch discrepancy after order loads
  useEffect(() => {
    if (!order?.awb_number) return;
    apiClient.get('/dispreancy/allDispreancyById', {
      params: { id: order.userId, awbNumber: order.awb_number, page: 1, limit: 1 },
    })
      .then(res => {
        const list = res.data?.data || res.data?.discrepancies || (Array.isArray(res.data) ? res.data : []);
        if (list.length > 0) setDiscrepancy(list[0]);
      })
      .catch(() => {});
  }, [order?.awb_number, order?.userId]);

  // Close dropdown on outside click
  useEffect(() => {
    const h = () => setIsHeaderDropdownOpen(false);
    window.addEventListener('click', h);
    return () => window.removeEventListener('click', h);
  }, []);

  // GSAP animations after load
  useEffect(() => {
    if (loading) return;
    const gsap = (window as any).gsap;
    if (!gsap) return;
    gsap.fromTo('.milestone-circle-container', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, stagger: 0.12, ease: 'back.out(1.4)', delay: 0.05 });
    gsap.fromTo('.timeline-line-segment', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, stagger: 0.15, ease: 'power2.out', delay: 0.3 });
    gsap.fromTo('.left-col-card', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out', delay: 0.1 });
    gsap.fromTo('.right-col-widget', { opacity: 0, x: 16 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out', delay: 0.2 });
    gsap.fromTo('.tracking-timeline-entry', { opacity: 0, x: 10 }, { opacity: 1, x: 0, duration: 0.35, stagger: 0.12, ease: 'power2.out', delay: 0.4 });
  }, [loading]);

  // Handlers
  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(String(order?.orderId || orderId));
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  };

  const handleCopyAwb = () => {
    navigator.clipboard.writeText(order?.awb_number || '');
    setCopiedAwb(true);
    setTimeout(() => setCopiedAwb(false), 1500);
  };

  const handleRaiseDispute = async () => {
    if (!disputeText.trim()) { setDisputeError('Please describe the dispute reason.'); return; }
    if (!order?.awb_number) { setDisputeError('AWB number not available.'); return; }
    setIsSubmittingDispute(true);
    setDisputeError(null);
    try {
      const fd = new FormData();
      fd.append('awb_number', order.awb_number);
      fd.append('text', disputeText);
      if (disputeFile) fd.append('file', disputeFile);
      await apiClient.post('/dispreancy/raiseDiscrepancies', fd);
      setShowRaiseDisputeModal(false);
      setDisputeText('');
      setDisputeFile(null);
      setDiscrepancy(prev => ({ ...prev, clientStatus: 'Discrepancy Raised' }));
      setToastMessage('Dispute raised successfully! Resolution takes 5–7 working days.');
    } catch {
      setDisputeError('Failed to raise dispute. Please try again.');
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  // ── Download / action helpers ────────────────────────────────────────────────
  const downloadFile = async (path: string, filename: string) => {
    const token = getToken();
    const res = await fetch(`${BACKEND_BASE_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleLabel = async () => {
    if (!order?._id) return;
    try { await downloadFile(`/printlabel/generate-pdf/${order._id}`, `Label-${displayOrderId}.pdf`); }
    catch { setToastMessage('Failed to download label. Please try again.'); }
  };

  const handleInvoice = async () => {
    if (!order?._id) return;
    try { await downloadFile(`/printinvoice/download-invoice/${order._id}`, `Invoice-${displayOrderId}.pdf`); }
    catch { setToastMessage('Failed to download invoice. Please try again.'); }
  };

  const handleManifest = async () => {
    if (!order?._id) return;
    try { await downloadFile(`/manifest/generate-pdf?orderIds=${order._id}`, `Manifest-${displayOrderId}.pdf`); }
    catch { setToastMessage('Failed to download manifest. Please try again.'); }
  };

  const handleClone = () => {
    if (!order?._id) return;
    const base = window.location.pathname.startsWith('/user/') ? '/user' : '/admin';
    navigate(`${base}/add-order?cloneId=${order._id}`);
  };

  const handleUpdate = () => {
    if (!order?._id) return;
    const base = window.location.pathname.startsWith('/user/') ? '/user' : '/admin';
    navigate(`${base}/add-order?updateId=${order._id}`);
  };

  const handleCancelOrder = async () => {
    if (!order?._id) return;
    const isBooked = ['Booked', 'Not Picked', 'Ready To Ship'].includes(order.status || '');
    const endpoint = isBooked ? '/order/cancelOrdersAtBooked' : '/order/cancelOrdersAtNotShipped';
    try {
      await apiClient.post(endpoint, { orderId: order._id });
      setToastMessage('Order cancelled successfully.');
      apiClient.get(`/order/getOrderById/${orderId}`).then(res => setOrder(res.data?.order || res.data?.data || res.data));
    } catch { setToastMessage('Failed to cancel order. Please try again.'); }
  };

  // ── Derived values ───────────────────────────────────────────────────────────
  const orderStatus = mapApiStatus(order?.status);
  const milestones = getMilestonesFromStatus(order?.status || 'new', order || undefined);
  const courierName = order?.courierName || order?.courierServiceName || '—';
  const awbNumber = order?.awb_number || '—';
  const displayOrderId = String(order?.orderId || orderId);
  const isDisputeRaised = discrepancy?.clientStatus === 'Discrepancy Raised';

  // ── Header actions — match AdminOrders renderRowActions per status ────────────
  const rawStatus = order?.status || 'New';
  const statusBadgeClass = STATUS_BADGE_STYLES[rawStatus] || 'bg-slate-50 text-slate-700 border-slate-200';
  const isNewOrder = rawStatus.toLowerCase() === 'new';
  const isBookedOrder = ['Booked', 'Not Picked', 'Ready To Ship'].includes(rawStatus);
  const isPickupManifestOrder = ['Pickup Scheduled', 'Pickup & Manifest'].includes(rawStatus);
  const isDeliveredOrder = rawStatus === 'Delivered';
  const isCancelledOrder = ['Cancelled', 'Lost', 'Damaged', 'RTO Initiated', 'RTO In Transit', 'RTO Delivered', 'RTO Lost', 'RTO Damaged'].includes(rawStatus);

  type DropdownOpt = { label: string; action: () => void; isDanger?: boolean };
  let primaryText: string;
  let primaryAction: () => void;
  let dropdownOptions: DropdownOpt[];

  if (isNewOrder) {
    primaryText = 'Ship Now';
    primaryAction = () => order && setShipOrder(order);
    dropdownOptions = [
      { label: 'Download Invoice', action: handleInvoice },
      { label: 'Clone Order', action: handleClone },
      { label: 'Update Order', action: handleUpdate },
      { label: 'Delete Order', action: handleCancelOrder, isDanger: true },
    ];
  } else if (isBookedOrder) {
    primaryText = 'Download Label';
    primaryAction = handleLabel;
    dropdownOptions = [
      { label: 'Download Invoice', action: handleInvoice },
      { label: 'Download Manifest', action: handleManifest },
      { label: 'Clone Order', action: handleClone },
      { label: 'Cancel Order', action: handleCancelOrder, isDanger: true },
    ];
  } else if (isPickupManifestOrder) {
    primaryText = 'Download Manifest';
    primaryAction = handleManifest;
    dropdownOptions = [
      { label: 'Download Label', action: handleLabel },
      { label: 'Raise a Ticket', action: () => setToastMessage('Support ticket functionality coming soon.') },
    ];
  } else if (isDeliveredOrder) {
    primaryText = 'Download Invoice';
    primaryAction = handleInvoice;
    dropdownOptions = [
      { label: 'Download Label', action: handleLabel },
      { label: 'Download Manifest', action: handleManifest },
      { label: 'Clone Order', action: handleClone },
      { label: 'Raise Weight Dispute', action: () => setChargesTab('dispute') },
    ];
  } else if (isCancelledOrder) {
    primaryText = 'Clone Order';
    primaryAction = handleClone;
    dropdownOptions = [
      { label: 'Download Invoice', action: handleInvoice },
      { label: 'Download Label', action: handleLabel },
      { label: 'Contact Support', action: () => setToastMessage('Support ticket functionality coming soon.') },
    ];
  } else {
    // In Transit, Out for Delivery, NDR, etc.
    primaryText = 'Download Label';
    primaryAction = handleLabel;
    dropdownOptions = [
      { label: 'Download Invoice', action: handleInvoice },
      { label: 'Download Manifest', action: handleManifest },
      { label: 'Clone Order', action: handleClone },
      { label: 'Raise Weight Dispute', action: () => setChargesTab('dispute') },
    ];
  }

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AdminLayout>
        <div className="bg-[#F8FAFC] min-h-screen pb-10 -m-4 md:-m-6" style={{ fontFamily: 'Roboto, sans-serif' }}>
          <div className="w-full bg-white border-b border-[#E2E8F0] px-3 md:px-6 py-3 md:py-4 flex items-center gap-3">
            <button onClick={() => window.history.back()} className="p-1 rounded-md text-[#64748B] hover:text-[#00A86B]">
              <ArrowLeft className="w-[18px] h-[18px]" />
            </button>
            <div className="h-5 w-48 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="max-w-[1400px] mx-auto px-6 pt-6 grid grid-cols-1 lg:grid-cols-[65%_35%] gap-5">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white rounded-xl border border-[#E2E8F0] p-3 md:p-5 shadow-sm h-40 animate-pulse" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <AdminLayout>
        <div className="bg-[#F8FAFC] min-h-screen flex flex-col -m-4 md:-m-6" style={{ fontFamily: 'Roboto, sans-serif' }}>
          <div className="w-full bg-white border-b border-[#E2E8F0] px-3 md:px-6 py-3 md:py-4 flex items-center gap-3">
            <button onClick={() => window.history.back()} className="p-1 rounded-md text-[#64748B] hover:text-[#00A86B]">
              <ArrowLeft className="w-[18px] h-[18px]" />
            </button>
            <span className="text-[14px] leading-[20px] font-semibold text-[#0F172A]">Order Details</span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="flex justify-center mb-3 text-red-500"><AlertTriangle className="w-9 h-9 text-red-500" /></div>
              <div className="text-[14px] leading-[20px] font-semibold text-[#0F172A] mb-1">{error}</div>
              <button onClick={() => window.location.reload()} className="mt-4 bg-[#00A86B] text-white text-[13px] font-bold py-2 px-5 rounded-lg hover:bg-[#009B63] transition-colors">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <style>{`
        @keyframes pulseRing {
          0% { box-shadow: 0 0 0 4px rgba(0, 168, 107, 0.25); }
          50% { box-shadow: 0 0 0 10px rgba(0, 168, 107, 0); }
          100% { box-shadow: 0 0 0 4px rgba(0, 168, 107, 0.25); }
        }
        .pulse-active { animation: pulseRing 2s ease-in-out infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .thin-scrollbar::-webkit-scrollbar { width: 5px; }
        .thin-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .thin-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 9999px; }
        .thin-scrollbar::-webkit-scrollbar-thumb:hover { background: #00A86B; }
        .thin-scrollbar { scrollbar-width: thin; scrollbar-color: #E2E8F0 transparent; }
      `}</style>

      <div ref={containerRef} className="bg-[#F8FAFC] text-[#0F172A] min-h-screen pb-10 -m-4 md:-m-6" style={{ fontFamily: 'Roboto, sans-serif' }}>

        {/* ── PAGE HEADER ─────────────────────────────────────────────────────── */}
        <div className="w-full bg-white border-b border-[#E2E8F0] px-3 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <button onClick={() => window.history.back()} className="flex items-center justify-center p-1 rounded-md text-[#64748B] hover:text-[#00A86B] hover:bg-slate-50 transition-colors" title="Back">
              <ArrowLeft className="w-[18px] h-[18px]" />
            </button>
            <div className="flex items-baseline">
              <span className="text-[12px] leading-[18px] font-medium text-[#64748B]">Order ID</span>
              <span className="text-[14px] leading-[20px] font-semibold text-[#0F172A] ml-1.5">{displayOrderId}</span>
            </div>
            <div className={`text-[12px] leading-[18px] font-medium px-3 py-1 rounded-full border ${statusBadgeClass}`}>
              {rawStatus}
            </div>
            <button onClick={handleCopyOrderId} className={`p-1.5 rounded-md transition-colors ${copiedId ? 'text-[#00A86B] bg-emerald-50' : 'text-[#94A3B8] hover:text-[#00A86B] hover:bg-slate-50'}`} title="Copy Order ID">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto relative">
            <button onClick={() => primaryAction()} className="flex-1 sm:flex-none bg-[#00A86B] hover:bg-[#009B63] text-white text-[12px] md:text-[14px] font-bold py-1.5 md:py-2.5 px-3 md:px-6 rounded-lg shadow-sm transition-all">
              {primaryText}
            </button>
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setIsHeaderDropdownOpen(!isHeaderDropdownOpen); }}
                className="border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-lg w-9 h-9 flex items-center justify-center text-slate-600 transition-all focus:outline-none"
                title="More Actions"
              >
                <span className="font-bold text-[14px] leading-[8px] -mt-1.5">...</span>
              </button>
              {isHeaderDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E2E8F0] rounded-xl shadow-lg overflow-hidden z-[105] py-1">
                  {dropdownOptions.map((opt, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && opt.isDanger && (
                        <div className="border-t border-[#E2E8F0] my-1" />
                      )}
                      <button
                        onClick={() => { opt.action(); setIsHeaderDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-[#F8FAFC] transition-colors ${opt.isDanger ? 'font-medium text-red-500 hover:bg-red-50/50' : 'font-normal text-[#0F172A]'}`}
                      >
                        {opt.label}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── MILESTONE TIMELINE STRIP ─────────────────────────────────────────── */}
        <div className="w-full bg-white border-b border-[#E2E8F0] px-3 md:px-8 py-3 md:py-6 mb-3 md:mb-6">

          {/* Desktop */}
          <div className="hidden md:block relative w-full px-6">
            <div className="absolute top-[16px] left-[4%] right-[4%] h-[2px] flex items-center z-0">
              {milestones.slice(0, -1).map((m, i) => (
                <div key={i} className="flex-1 relative h-full">
                  <svg className="w-full h-[2px] overflow-visible" preserveAspectRatio="none">
                    <line x1="0" y1="1" x2="100%" y2="1" stroke={m.status === 'completed' ? '#00A86B' : '#E2E8F0'} strokeWidth="2" strokeDasharray={m.status === 'completed' ? '1' : '4 4'} pathLength="1" className="timeline-line-segment" />
                  </svg>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-start relative z-10 w-full">
              {milestones.map((m, i) => {
                const isCompleted = m.status === 'completed';
                const isActive = m.status === 'active';
                const isPending = m.status === 'pending';
                const MilestoneIcon = MILESTONE_ICONS[m.icon] || Package;
                return (
                  <div key={i} className="flex flex-col items-center text-center w-[12%] milestone-circle-container">
                    <div className="h-8 flex items-center justify-center">
                      {isCompleted && <div className="w-7 h-7 rounded-full bg-[#00A86B] flex items-center justify-center text-white shadow-sm"><Check className="w-3.5 h-3.5" /></div>}
                      {isActive && <div className="w-8 h-8 rounded-full bg-[#00A86B] flex items-center justify-center text-white pulse-active relative z-10"><MilestoneIcon className="w-3.5 h-3.5" /></div>}
                      {isPending && <div className="w-7 h-7 rounded-full bg-white border-2 border-[#E2E8F0] flex items-center justify-center"><MilestoneIcon className="w-3.5 h-3.5 text-[#CBD5E1]" /></div>}
                    </div>
                    <div className="mt-3">
                      <div className={`text-[12px] leading-[18px] ${isCompleted ? 'font-medium text-[#0F172A]' : isActive ? 'font-bold text-[#00A86B]' : 'font-normal text-[#94A3B8]'}`}>{m.name}</div>
                      <div className="text-[12px] leading-[18px] font-normal text-[#64748B] mt-0.5">{m.date}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile — compact horizontal tracker, scrolls if it overflows */}
          <div className="block md:hidden overflow-x-auto no-scrollbar -mx-3 px-3">
            <div className="flex items-start" style={{ minWidth: `${milestones.length * 64}px` }}>
              {milestones.map((m, i) => {
                const isCompleted = m.status === 'completed';
                const isActive = m.status === 'active';
                const isPending = m.status === 'pending';
                const MilestoneIcon = MILESTONE_ICONS[m.icon] || Package;
                const isLast = i === milestones.length - 1;
                return (
                  <div key={i} className="flex flex-col items-center text-center shrink-0" style={{ width: '64px' }}>
                    <div className="flex items-center w-full">
                      <div className="flex-1 h-[2px]" style={{ background: i === 0 ? 'transparent' : (milestones[i - 1].status === 'completed' ? '#00A86B' : '#E2E8F0') }} />
                      <div className="shrink-0">
                        {isCompleted && <div className="w-[18px] h-[18px] rounded-full bg-[#00A86B] flex items-center justify-center text-white"><Check className="w-2.5 h-2.5" /></div>}
                        {isActive && <div className="w-[18px] h-[18px] rounded-full bg-[#00A86B] flex items-center justify-center text-white pulse-active"><MilestoneIcon className="w-2.5 h-2.5" /></div>}
                        {isPending && <div className="w-[18px] h-[18px] rounded-full bg-white border-2 border-[#E2E8F0] flex items-center justify-center"><MilestoneIcon className="w-2.5 h-2.5 text-[#CBD5E1]" /></div>}
                      </div>
                      <div className="flex-1 h-[2px]" style={{ background: isLast ? 'transparent' : (m.status === 'completed' ? '#00A86B' : '#E2E8F0') }} />
                    </div>
                    <div className={`text-[10px] leading-[13px] mt-1 px-0.5 ${isCompleted ? 'font-medium text-[#0F172A]' : isActive ? 'font-bold text-[#00A86B]' : 'font-normal text-[#94A3B8]'}`}>{m.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
        <div className="w-full max-w-[1400px] mx-auto px-3 md:px-6 grid grid-cols-1 lg:grid-cols-[65%_35%] gap-3 md:gap-5 items-start">

          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-3 md:gap-5 min-w-0">

            {/* SECTION 1: ORDER DETAILS */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 md:p-5 shadow-sm left-col-card">
              <div className="flex items-center gap-2.5 border-b border-[#E2E8F0] pb-2.5 md:pb-3 mb-3 md:mb-4">
                <div className="w-8 h-8 rounded-full bg-[#F0FDF4] flex items-center justify-center shrink-0">
                  <ClipboardList className="w-4 h-4 text-[#00A86B]" />
                </div>
                <h3 className="text-[14px] leading-[20px] font-semibold text-[#0F172A]">Order Details</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                <div>
                  <label className="block text-[12px] leading-[18px] font-medium text-[#94A3B8] uppercase tracking-wider">Creation Date</label>
                  <div className="text-[12px] leading-[18px] font-normal text-[#0F172A] mt-0.5">
                    <div>{formatDate(order?.createdAt)}</div>
                    {order?.createdAt && (
                      <div className="text-[12px] leading-[18px] text-[#64748B] font-normal mt-0.5">
                        {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] leading-[18px] font-medium text-[#94A3B8] uppercase tracking-wider">Channel</label>
                  <div className="mt-1">
                    <span className="bg-[#F0FDF4] text-[#009B63] text-[12px] leading-[18px] font-normal px-2.5 py-0.5 rounded">
                      {(order?.channel || 'CUSTOM').toUpperCase()}{order?.channelId ? ` (${order.channelId})` : ''}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] leading-[18px] font-medium text-[#94A3B8] uppercase tracking-wider">Payment Amount</label>
                  <div className="text-[12px] leading-[18px] font-normal text-[#0F172A] mt-0.5">
                    {order?.paymentDetails?.amount != null ? `₹${order.paymentDetails.amount.toLocaleString('en-IN')}` : '—'}
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] leading-[18px] font-medium text-[#94A3B8] uppercase tracking-wider">Payment Method</label>
                  <div className="text-[12px] leading-[18px] font-normal text-[#0F172A] mt-0.5">{order?.paymentDetails?.method || '—'}</div>
                </div>
              </div>
            </div>

            {/* Sub-grid: Pickup + Receiver */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">

              {/* SECTION 2: PICKUP DETAILS */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 md:p-5 shadow-sm left-col-card">
                <div className="flex items-center gap-2.5 border-b border-[#E2E8F0] pb-2.5 md:pb-3 mb-3 md:mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#F0FDF4] flex items-center justify-center shrink-0">
                    <Navigation className="w-4 h-4 text-[#00A86B]" />
                  </div>
                  <h3 className="text-[14px] leading-[20px] font-semibold text-[#0F172A]">Pickup Details</h3>
                </div>
                <div className="space-y-3 md:space-y-4">
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="block text-[12px] leading-[18px] font-medium text-[#94A3B8] uppercase tracking-wider">Name</label>
                      <div className="text-[12px] leading-[18px] font-normal text-[#0F172A] mt-0.5">{order?.pickupAddress?.contactName || '—'}</div>
                    </div>
                    <div>
                      <label className="block text-[12px] leading-[18px] font-medium text-[#94A3B8] uppercase tracking-wider">Mobile No</label>
                      <div className="text-[12px] leading-[18px] font-normal text-[#0F172A] mt-0.5">{order?.pickupAddress?.phoneNumber || '—'}</div>
                    </div>
                    <div>
                      <label className="block text-[12px] leading-[18px] font-medium text-[#94A3B8] uppercase tracking-wider">Email</label>
                      <div className="text-[12px] leading-[18px] font-normal text-[#0F172A] mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap" title={order?.pickupAddress?.email}>
                        {order?.pickupAddress?.email || <span className="text-[#CBD5E1]">—</span>}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[12px] leading-[18px] font-medium text-[#94A3B8] uppercase tracking-wider">Pincode</label>
                      <div className="text-[12px] leading-[18px] font-normal text-[#0F172A] mt-0.5">{order?.pickupAddress?.pinCode || '—'}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:gap-4 border-t border-[#F5F5F5] pt-2.5 md:pt-3">
                    <div>
                      <label className="block text-[12px] leading-[18px] font-medium text-[#94A3B8] uppercase tracking-wider">State</label>
                      <div className="text-[12px] leading-[18px] font-normal text-[#0F172A] mt-0.5">{order?.pickupAddress?.state || '—'}</div>
                    </div>
                    <div>
                      <label className="block text-[12px] leading-[18px] font-medium text-[#94A3B8] uppercase tracking-wider">City</label>
                      <div className="text-[12px] leading-[18px] font-normal text-[#0F172A] mt-0.5">{order?.pickupAddress?.city || '—'}</div>
                    </div>
                  </div>
                  <div className="border-t border-[#F5F5F5] pt-3">
                    <label className="block text-[12px] leading-[18px] font-medium text-[#94A3B8] uppercase tracking-wider">Address</label>
                    <div className="text-[12px] leading-[18px] font-normal text-[#0F172A] mt-0.5 leading-relaxed">{order?.pickupAddress?.address || '—'}</div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: RECEIVER DETAILS */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 md:p-5 shadow-sm left-col-card">
                <div className="flex items-center gap-2.5 border-b border-[#E2E8F0] pb-2.5 md:pb-3 mb-3 md:mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#F0FDF4] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-[#00A86B]" />
                  </div>
                  <h3 className="text-[14px] leading-[20px] font-semibold text-[#0F172A]">Receiver Details</h3>
                </div>
                <div className="space-y-3 md:space-y-4">
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="block text-[12px] leading-[18px] font-medium text-[#94A3B8] uppercase tracking-wider">Name</label>
                      <div className="text-[12px] leading-[18px] font-normal text-[#0F172A] mt-0.5">{order?.receiverAddress?.contactName || '—'}</div>
                    </div>
                    <div>
                      <label className="block text-[12px] leading-[18px] font-medium text-[#94A3B8] uppercase tracking-wider">Mobile No</label>
                      <div className="text-[12px] leading-[18px] font-normal text-[#0F172A] mt-0.5">{order?.receiverAddress?.phoneNumber || '—'}</div>
                    </div>
                    <div>
                      <label className="block text-[12px] leading-[18px] font-medium text-[#94A3B8] uppercase tracking-wider">Email</label>
                      <div className="text-[12px] leading-[18px] font-normal text-[#0F172A] mt-0.5">
                        {order?.receiverAddress?.email || <span className="text-[#CBD5E1]">—</span>}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[12px] leading-[18px] font-medium text-[#94A3B8] uppercase tracking-wider">Pincode</label>
                      <div className="text-[12px] leading-[18px] font-normal text-[#0F172A] mt-0.5">{order?.receiverAddress?.pinCode || '—'}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:gap-4 border-t border-[#F5F5F5] pt-2.5 md:pt-3">
                    <div>
                      <label className="block text-[12px] leading-[18px] font-medium text-[#94A3B8] uppercase tracking-wider">State</label>
                      <div className="text-[12px] leading-[18px] font-normal text-[#0F172A] mt-0.5">{order?.receiverAddress?.state || '—'}</div>
                    </div>
                    <div>
                      <label className="block text-[12px] leading-[18px] font-medium text-[#94A3B8] uppercase tracking-wider">City</label>
                      <div className="text-[12px] leading-[18px] font-normal text-[#0F172A] mt-0.5">{order?.receiverAddress?.city || '—'}</div>
                    </div>
                  </div>
                  <div className="border-t border-[#F5F5F5] pt-3">
                    <label className="block text-[12px] leading-[18px] font-medium text-[#94A3B8] uppercase tracking-wider">Address</label>
                    <div className="text-[12px] leading-[18px] font-normal text-[#0F172A] mt-0.5 leading-relaxed">{order?.receiverAddress?.address || '—'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-grid: Package + Product */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">

              {/* SECTION 4: PACKAGE DETAILS */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 md:p-5 shadow-sm left-col-card">
                <div className="flex items-center gap-2.5 border-b border-[#E2E8F0] pb-2.5 md:pb-3 mb-3 md:mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#F0FDF4] flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-[#00A86B]" />
                  </div>
                  <h3 className="text-[14px] leading-[20px] font-semibold text-[#0F172A]">Package Details</h3>
                </div>
                <div className="space-y-3 md:space-y-4">
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="block text-[12px] leading-[18px] font-medium text-[#94A3B8] uppercase tracking-wider">Order Type</label>
                      <div className="text-[12px] leading-[18px] font-normal text-[#0F172A] mt-0.5">B2C</div>
                    </div>
                    <div>
                      <label className="block text-[12px] leading-[18px] font-medium text-[#94A3B8] uppercase tracking-wider">Dead Weight</label>
                      <div className="text-[12px] leading-[18px] font-normal text-[#0F172A] mt-0.5">
                        {order?.packageDetails?.deadWeight != null ? `${order.packageDetails.deadWeight} KG` : '—'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[12px] leading-[18px] font-medium text-[#94A3B8] uppercase tracking-wider">Dimensions (L×W×H)</label>
                      <div className="text-[12px] leading-[18px] font-normal text-[#0F172A] mt-0.5">
                        {order?.packageDetails?.volumetricWeight
                          ? `${order.packageDetails.volumetricWeight.length ?? '—'} × ${order.packageDetails.volumetricWeight.width ?? '—'} × ${order.packageDetails.volumetricWeight.height ?? '—'} cm`
                          : '—'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[12px] leading-[18px] font-medium text-[#94A3B8] uppercase tracking-wider">Volumetric Weight</label>
                      <div className="text-[12px] leading-[18px] font-normal text-[#0F172A] mt-0.5">
                        {(() => {
                          const vw = order?.packageDetails?.volumetricWeight;
                          if (vw?.length && vw?.width && vw?.height)
                            return `${((vw.length * vw.width * vw.height) / 5000).toFixed(2)} KG`;
                          if (vw?.calculatedWeight != null) return `${vw.calculatedWeight} KG`;
                          return '—';
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:gap-4 border-t border-[#F5F5F5] pt-2.5 md:pt-3">
                    <div>
                      <label className="text-[12px] leading-[18px] font-medium text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
                        Applicable Weight
                        <div className="relative group cursor-pointer inline-flex items-center">
                          <span className="text-[#94A3B8] hover:text-[#0F172A]"><Info className="w-3 h-3" /></span>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-[#0F172A] text-white text-[12px] font-normal rounded-lg py-1.5 px-3 whitespace-nowrap shadow-md z-30 pointer-events-none">
                            Higher of dead weight and volumetric weight
                          </div>
                        </div>
                      </label>
                      <div className="text-[12px] leading-[18px] font-normal text-[#0F172A] mt-0.5">
                        {order?.packageDetails?.applicableWeight != null ? `${order.packageDetails.applicableWeight} KG` : '—'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[12px] leading-[18px] font-medium text-[#94A3B8] uppercase tracking-wider">Charged Weight</label>
                      <div className="text-[12px] leading-[18px] font-normal text-[#0F172A] mt-0.5">
                        {discrepancy?.chargedWeight != null
                          ? `${discrepancy.chargedWeight} KG`
                          : order?.packageDetails?.applicableWeight != null
                            ? `${order.packageDetails.applicableWeight} KG`
                            : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 5: PRODUCT DETAILS */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 md:p-5 shadow-sm left-col-card flex flex-col">
                <div className="flex items-center gap-2.5 border-b border-[#E2E8F0] pb-2.5 md:pb-3 mb-3 md:mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#F0FDF4] flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-[#00A86B]" />
                  </div>
                  <h3 className="text-[14px] leading-[20px] font-semibold text-[#0F172A]">Product Details</h3>
                </div>
                <div className="overflow-x-auto no-scrollbar flex-1">
                  <table className="w-full text-left border-collapse min-w-[300px]">
                    <thead>
                      <tr className="bg-[#E6F9F2] border-b border-[#E2E8F0] text-[10px] leading-4 uppercase tracking-wider font-semibold text-[#94A3B8]">
                        <th className="pb-3">Product Name</th>
                        <th className="pb-3 text-center">Qty</th>
                        <th className="pb-3 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody className="text-[12px] leading-[18px] font-normal text-[#0F172A]">
                      {(order?.productDetails || []).map((p, i) => (
                        <tr key={i} className="border-b last:border-0 border-[#F5F5F5]">
                          <td className="py-3 font-medium">{p.name || '—'}</td>
                          <td className="py-3 text-center">{p.quantity ?? 1}</td>
                          <td className="py-3 text-right">₹{(p.unitPrice || 0).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                      {(!order?.productDetails || order.productDetails.length === 0) && (
                        <tr><td colSpan={3} className="py-3 text-center text-[#94A3B8]">No products found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end items-center gap-2.5 border-t border-[#E2E8F0] pt-4 mt-2">
                  <span className="text-[12px] leading-[18px] font-medium text-[#0F172A]">Total Amount:</span>
                  <span className="text-[12px] leading-[18px] font-bold text-[#00A86B]">
                    ₹{(order?.productDetails || [])
                      .reduce((s, p) => s + (p.unitPrice || 0) * (p.quantity || 1), 0)
                      .toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 6: CHARGES BREAKDOWN */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 md:p-5 shadow-sm left-col-card">
              <div className="flex items-center gap-2.5 border-b border-[#E2E8F0] pb-2.5 md:pb-3 mb-3 md:mb-4">
                <div className="w-8 h-8 rounded-full bg-[#F0FDF4] flex items-center justify-center shrink-0">
                  <Receipt className="w-4 h-4 text-[#00A86B]" />
                </div>
                <h3 className="text-[14px] leading-[20px] font-semibold text-[#0F172A]">Charges Breakdown</h3>
              </div>

              {/* Tab selector */}
              <div className="bg-[#F8FAFC] p-1 rounded-xl flex gap-1 mb-5">
                <button onClick={() => setChargesTab('billed')} className={`flex-1 py-2 text-center text-[13px] font-medium transition-all ${chargesTab === 'billed' ? 'bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] text-[#0F172A]' : 'text-[#94A3B8] hover:text-[#0F172A]'}`}>
                  Billed Charges
                </button>
                <button onClick={() => setChargesTab('dispute')} className={`flex-1 py-2 text-center text-[13px] font-medium transition-all flex items-center justify-center gap-1.5 ${chargesTab === 'dispute' ? 'bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] text-[#0F172A]' : 'text-[#94A3B8] hover:text-[#0F172A]'}`}>
                  Weight Dispute
                  {isDisputeRaised && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />}
                </button>
              </div>

              {/* Billed Charges tab */}
              {chargesTab === 'billed' && (
                <div className="space-y-0.5">
                  <div className="flex justify-between items-center py-2.5 border-b border-[#F8FAFC]">
                    <span className="text-[12px] leading-[18px] font-medium text-[#64748B]">Base Freight Charge</span>
                    <span className="text-[12px] leading-[18px] font-normal text-[#0F172A]">
                      {order?.priceBreakup?.freight != null ? `₹${order.priceBreakup.freight.toFixed(2)}` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-[#F8FAFC]">
                    <span className="text-[12px] leading-[18px] font-medium text-[#64748B]">COD Handling Charge</span>
                    <span className="text-[12px] leading-[18px] font-normal text-[#0F172A]">
                      {order?.priceBreakup?.cod != null ? `₹${order.priceBreakup.cod.toFixed(2)}` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-[#F8FAFC]">
                    <span className="text-[12px] leading-[18px] font-medium text-[#64748B]">Reverse Pickup Charge</span>
                    <span className="text-[12px] leading-[18px] font-normal text-[#CBD5E1]">—</span>
                  </div>
                  {discrepancy && (
                    <div className="flex justify-between items-center py-2.5 border-b border-[#F8FAFC]">
                      <div className="flex items-center">
                        <span className="text-[12px] leading-[18px] font-medium text-[#64748B]">Weight Discrepancy Charge</span>
                        {isDisputeRaised && <span className="bg-[#FFF3E0] text-[#E65100] text-[10px] leading-4 font-medium px-2 py-0.5 rounded ml-2">Disputed</span>}
                      </div>
                      <span className="text-[12px] leading-[18px] font-normal text-[#0F172A]">
                        {discrepancy.excessWeightCharges != null ? `₹${discrepancy.excessWeightCharges.toFixed(2)}` : '—'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2.5 border-b border-[#F8FAFC]">
                    <span className="text-[12px] leading-[18px] font-medium text-[#64748B]">GST (18%)</span>
                    <span className="text-[12px] leading-[18px] font-normal text-[#0F172A]">
                      {order?.priceBreakup?.gst != null ? `₹${order.priceBreakup.gst.toFixed(2)}` : '—'}
                    </span>
                  </div>
                  <div className="border-t border-dashed border-[#E2E8F0] pt-3 mt-3 flex justify-between items-center">
                    <span className="text-[14px] leading-[20px] font-bold text-[#0F172A]">Total Billed</span>
                    <span className="text-[14px] leading-[20px] font-bold text-[#00A86B]">
                      {order?.priceBreakup?.total != null ? `₹${order.priceBreakup.total.toFixed(2)}` : '—'}
                    </span>
                  </div>
                </div>
              )}

              {/* Weight Dispute tab */}
              {chargesTab === 'dispute' && (
                <div className="space-y-5">
                  {discrepancy ? (
                    <>
                      <div className="bg-[#FFF8E8] border border-[#FAC775] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="text-amber-700 shrink-0"><AlertTriangle className="w-[18px] h-[18px] text-amber-700" /></div>
                          <span className="text-[12px] leading-[18px] font-normal text-amber-800">
                            {isDisputeRaised
                              ? `Dispute raised. Status: ${discrepancy.clientStatus}.`
                              : 'Weight discrepancy detected on this shipment.'}
                          </span>
                        </div>
                        {!isDisputeRaised ? (
                          <button
                            onClick={() => setShowRaiseDisputeModal(true)}
                            className="border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[12px] font-medium py-1.5 px-3.5 rounded-lg transition-colors shrink-0"
                          >
                            Raise Dispute
                          </button>
                        ) : (
                          <span className="bg-[#F0FDF4] text-[#009B63] text-[10px] leading-4 font-semibold px-3 py-1 rounded-full border border-[#BCE8D8] shrink-0">
                            Dispute Raised
                          </span>
                        )}
                      </div>

                      <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[450px]">
                          <thead>
                            <tr className="bg-[#E6F9F2] border-b border-[#F8FAFC] text-[10px] leading-4 uppercase tracking-wider font-semibold text-[#94A3B8]">
                              <th className="pb-3">Metric</th>
                              <th className="pb-3">Seller Declared</th>
                              <th className="pb-3">Courier Claimed</th>
                            </tr>
                          </thead>
                          <tbody className="text-[12px] leading-[18px] font-normal text-[#0F172A]">
                            <tr className="border-b border-[#F8FAFC]">
                              <td className="py-3">Dead Weight</td>
                              <td className="py-3">{order?.packageDetails?.deadWeight != null ? `${order.packageDetails.deadWeight} KG` : '—'}</td>
                              <td className="py-3 text-red-500">{discrepancy.enteredWeight != null ? `${discrepancy.enteredWeight} KG` : '—'}</td>
                            </tr>
                            <tr className="border-b border-[#F8FAFC]">
                              <td className="py-3">Dimensions</td>
                              <td className="py-3">
                                {order?.packageDetails?.volumetricWeight
                                  ? `${order.packageDetails.volumetricWeight.length ?? '—'}×${order.packageDetails.volumetricWeight.width ?? '—'}×${order.packageDetails.volumetricWeight.height ?? '—'}cm`
                                  : '—'}
                              </td>
                              <td className="py-3 text-red-500">{discrepancy.chargeDimension || '—'}</td>
                            </tr>
                            <tr className="border-b border-[#F8FAFC]">
                              <td className="py-3">Vol. Weight</td>
                              <td className="py-3">{(() => { const vw = order?.packageDetails?.volumetricWeight; if (vw?.length && vw?.width && vw?.height) return `${((vw.length * vw.width * vw.height) / 5000).toFixed(2)} KG`; if (vw?.calculatedWeight != null) return `${vw.calculatedWeight} KG`; return '—'; })()}</td>
                              <td className="py-3 text-red-500">—</td>
                            </tr>
                            <tr className="border-b border-[#F8FAFC]">
                              <td className="py-3">Charged Weight</td>
                              <td className="py-3">{order?.packageDetails?.applicableWeight != null ? `${order.packageDetails.applicableWeight} KG` : '—'}</td>
                              <td className="py-3 text-red-500">{discrepancy.chargedWeight != null ? `${discrepancy.chargedWeight} KG` : '—'}</td>
                            </tr>
                            <tr className="border-b last:border-0 border-[#F8FAFC]">
                              <td className="py-3 font-semibold">Charges</td>
                              <td className="py-3 font-semibold">{order?.priceBreakup?.freight != null ? `₹${order.priceBreakup.freight.toFixed(2)}` : '—'}</td>
                              <td className="py-3 font-semibold text-red-500">{discrepancy.excessWeightCharges != null ? `₹${discrepancy.excessWeightCharges.toFixed(2)}` : '—'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className="py-10 text-center">
                      <div className="flex justify-center mb-3 text-[#94A3B8]"><Check className="w-8 h-8 text-[#94A3B8]" /></div>
                      <div className="text-[14px] leading-[20px] font-semibold text-[#0F172A] mb-1">No Weight Discrepancy</div>
                      <div className="text-[12px] leading-[18px] font-normal text-[#64748B]">No discrepancy detected for this shipment.</div>
                    </div>
                  )}
                  <div className="text-[12px] leading-[18px] font-normal text-[#94A3B8]">
                    Dispute resolution typically takes 5–7 working days.
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col lg:sticky lg:top-5 gap-3 md:gap-4 min-w-0">

            {/* WIDGET 1: SHIPPING DETAILS */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 md:p-5 shadow-sm right-col-widget">
              <div className="flex items-center gap-2.5 border-b border-[#E2E8F0] pb-2.5 md:pb-3 mb-3 md:mb-4">
                <div className="w-8 h-8 rounded-full bg-[#F0FDF4] flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4 text-[#00A86B]" />
                </div>
                <h3 className="text-[14px] leading-[20px] font-semibold text-[#0F172A]">Shipping Details</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[12px] leading-[18px]">
                  <span className="font-medium text-[#64748B]">Pickup ID</span>
                  <span className="font-semibold text-[#0F172A] font-mono">{order?.pickupId || '—'}</span>
                </div>
                <div className="flex justify-between items-center text-[12px] leading-[18px] border-t border-[#F5F5F5] pt-3">
                  <span className="font-medium text-[#64748B]">Courier Partner</span>
                  <div className="flex items-center gap-2">
                    {courierName !== '—' && <CourierLogo name={courierName} size="md" />}
                    <span className="font-semibold text-[#0F172A]">{courierName}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[12px] leading-[18px] border-t border-[#F5F5F5] pt-3">
                  <span className="font-medium text-[#64748B]">Scheduled On</span>
                  <span className="font-normal text-[#0F172A]">{order?.shipmentCreatedAt ? formatDate(order.shipmentCreatedAt, true) : '—'}</span>
                </div>
                <div className="flex justify-between items-center text-[12px] leading-[18px] border-t border-[#F5F5F5] pt-3">
                  <span className="font-medium text-[#64748B]">Picked On</span>
                  <span className="font-normal text-[#0F172A]">{order?.pickupDate ? formatDate(order.pickupDate, true) : '—'}</span>
                </div>
                <div className="flex justify-between items-center text-[12px] leading-[18px] border-t border-[#F5F5F5] pt-3">
                  <span className="font-medium text-[#64748B]">Estimated Delivery Date</span>
                  <span className="font-normal text-[#0F172A]">{order?.estimatedDeliveryDate ? formatDate(order.estimatedDeliveryDate) : '—'}</span>
                </div>
                <div className="flex justify-between items-center text-[12px] leading-[18px] border-t border-[#F5F5F5] pt-3">
                  <span className="font-medium text-[#64748B]">Delivered On</span>
                  <span className="font-normal text-[#0F172A]">
                    {orderStatus === 'delivered' ? (() => {
                      const last = [...(order?.tracking || [])].filter(t => t.StatusDateTime).slice(-1)[0];
                      if (!last?.StatusDateTime) return '—';
                      const { date, time } = formatTrackingDate(last.StatusDateTime);
                      return `${date}, ${time}`;
                    })() : '—'}
                  </span>
                </div>
                {order?.paymentDetails?.method === 'COD' && (
                  <div className="flex justify-between items-center text-[12px] leading-[18px] border-t border-[#F5F5F5] pt-3">
                    <span className="font-medium text-[#64748B]">COD Status</span>
                    {order.codProcessed
                      ? <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] leading-4 font-semibold px-2.5 py-0.5 rounded-full"><Check className="w-2.5 h-2.5 text-emerald-600" /> COD Paid</span>
                      : <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] leading-4 font-semibold px-2.5 py-0.5 rounded-full"><Clock className="w-2.5 h-2.5 text-amber-600" /> COD Pending</span>
                    }
                  </div>
                )}
              </div>
            </div>

            {/* WIDGET 2: TRACKING DETAILS */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 md:p-5 shadow-sm right-col-widget">
              <div className="flex items-center gap-2.5 border-b border-[#E2E8F0] pb-2.5 md:pb-3 mb-3 md:mb-4">
                <div className="w-8 h-8 rounded-full bg-[#F0FDF4] flex items-center justify-center shrink-0">
                  <Map className="w-4 h-4 text-[#00A86B]" />
                </div>
                <h3 className="text-[14px] leading-[20px] font-semibold text-[#0F172A]">Tracking Details</h3>
              </div>

              {/* AWB block */}
              <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 mb-5">
                <div>
                  <div className="text-[10px] leading-4 font-semibold text-[#94A3B8] uppercase tracking-wider">AWB Number</div>
                  <div className="text-[12px] leading-[18px] font-bold text-[#0F172A] mt-0.5 tracking-wide font-mono">{awbNumber}</div>
                </div>
                <div className="flex items-center gap-2">
                  {courierName !== '—' && (
                    <span className="text-[#0F172A] text-[12px] leading-[18px] font-medium px-2.5 py-1 rounded-md shrink-0 flex items-center gap-1.5 bg-transparent">
                      <CourierLogo name={courierName} size="sm" />
                      {courierName}
                    </span>
                  )}
                  <button onClick={handleCopyAwb} className={`p-1.5 rounded-md transition-colors ${copiedAwb ? 'text-[#00A86B] bg-emerald-50' : 'text-[#94A3B8] hover:text-[#00A86B] hover:bg-slate-100'}`} title="Copy AWB Number">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Tracking timeline */}
              <div className="relative pl-8 py-1 overflow-y-auto pr-2 thin-scrollbar" style={{ maxHeight: '190px' }}>
                <div className="absolute left-[15px] top-3 bottom-3 w-[2px] bg-[#F0FDF4] z-0" />
                <div className="space-y-6 relative z-10">
                  {(() => {
                    const trackingEntries = [...(order?.tracking || [])]
                      .filter(t => t.Instructions && t.StatusDateTime)
                      .reverse();
                    return trackingEntries.length > 0 ? (
                      trackingEntries.map((t, i) => {
                        const { date, time } = formatTrackingDate(t.StatusDateTime);
                        return (
                          <div key={i} className="relative flex items-start gap-4 tracking-timeline-entry">
                            <div className="absolute -left-[22px] top-1">
                              {i === 0
                                ? <div className="w-3 h-3 rounded-full bg-[#00A86B] pulse-active border-2 border-white relative z-10" />
                                : <div className="w-2.5 h-2.5 rounded-full bg-[#00A86B] border-2 border-white relative z-10" />}
                            </div>
                            <div>
                              <div className={`text-[12px] leading-[18px] ${i === 0 ? 'font-bold' : 'font-semibold'} text-[#0F172A]`}>{t.Instructions}</div>
                              <div className="text-[12px] leading-[18px] font-normal text-[#64748B] mt-0.5">{date}</div>
                              <div className="text-[12px] leading-[18px] font-normal text-[#64748B]">{time}</div>
                              {t.StatusLocation && <div className="text-[12px] leading-[18px] font-normal text-[#94A3B8] mt-0.5">{t.StatusLocation}</div>}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4 text-[12px] leading-[18px] font-normal text-[#94A3B8]">No tracking updates yet</div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* WIDGET 3: NDR ACTIONS — visible for any undelivered/NDR state */}
            {(order?.status === 'Undelivered' || order?.ndrStatus === 'Undelivered' || order?.ndrStatus === 'Action_Requested') && (() => {
              const ndrButtonsEnabled = order?.ndrStatus === 'Undelivered' && order?.reattempt === true;
              return (
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 md:p-5 shadow-sm right-col-widget">
                <div className="flex items-center gap-2.5 border-b border-[#E2E8F0] pb-2.5 md:pb-3 mb-3 md:mb-4">
                  <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                  <h3 className="text-[14px] leading-[20px] font-semibold text-[#0F172A]">NDR Actions & History</h3>
                </div>
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center text-[12px] leading-[18px]">
                    <span className="font-medium text-[#64748B]">NDR Status</span>
                    <span className="text-[10px] leading-4 font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                      {order.ndrStatus}
                    </span>
                  </div>
                  {order.ndrReason && (
                    <div className="text-[12px] leading-[18px] border-t border-[#F5F5F5] pt-3">
                      <div className="font-medium text-[#64748B]">Reason for Non-Delivery</div>
                      <div className="font-normal text-[#0F172A] mt-1 bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-[12px] leading-[18px]">
                        {typeof order.ndrReason === 'string' ? order.ndrReason : (order.ndrReason?.reason || '—')}
                      </div>
                    </div>
                  )}
                  {order.ndrHistory && order.ndrHistory.length > 0 && (
                    <div className="flex items-center gap-2 text-[12px] leading-[18px] border-t border-[#F5F5F5] pt-3 flex-wrap">
                      <span className="font-medium text-[#64748B] shrink-0">Attempt Count:</span>
                      <span className="font-normal text-[#0F172A]">{order.ndrHistory.length} / 3 attempts</span>
                      <button onClick={() => setShowNdrHistory(true)} className="text-[11px] font-bold text-[#00A86B] hover:text-[#009B63] flex items-center gap-1 shrink-0 ml-1.5 bg-[#F0FDF4] px-2 py-0.5 rounded transition-colors">
                        <History className="w-[11px] h-[11px] text-[#00A86B]" />
                        <span>History</span>
                      </button>
                    </div>
                  )}
                  <div className="border-t border-[#F5F5F5] pt-3.5 mt-2 space-y-2">
                    {!ndrButtonsEnabled && (
                      <div className="text-[11px] text-[#94A3B8] bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 mb-1">
                        Actions available when NDR status is Undelivered and re-attempt is pending.
                      </div>
                    )}
                    <button
                      disabled={!ndrButtonsEnabled}
                      onClick={() => setToastMessage(`Re-attempt instruction submitted to ${courierName}!`)}
                      className={`w-full text-[12px] font-bold py-2 rounded-lg transition-colors focus:outline-none ${ndrButtonsEnabled ? 'bg-[#00A86B] hover:bg-[#009B63] text-white cursor-pointer' : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'}`}
                    >
                      Request Re-attempt
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        disabled={!ndrButtonsEnabled}
                        onClick={() => setToastMessage(`RTO instruction submitted to ${courierName}!`)}
                        className={`text-[12px] font-semibold py-2 rounded-lg transition-colors focus:outline-none ${ndrButtonsEnabled ? 'border border-red-200 bg-red-50/50 hover:bg-red-50 text-red-700 cursor-pointer' : 'border border-[#E2E8F0] bg-[#F8FAFC] text-[#94A3B8] cursor-not-allowed'}`}
                      >
                        Initiate RTO
                      </button>
                      <button
                        disabled={!ndrButtonsEnabled}
                        onClick={() => { setNewPhoneNumber(order.receiverAddress?.phoneNumber || ''); setShowUpdateInfoModal(true); }}
                        className={`text-[12px] font-semibold py-2 rounded-lg transition-colors focus:outline-none ${ndrButtonsEnabled ? 'border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] cursor-pointer' : 'border border-[#E2E8F0] bg-[#F8FAFC] text-[#94A3B8] cursor-not-allowed'}`}
                      >
                        Update Info
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              );
            })()}

          </div>
        </div>
      </div>

      {/* ── NDR HISTORY MODAL ───────────────────────────────────────────────────── */}
      {showNdrHistory && (
        <div className="fixed inset-0 bg-[#000000]/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-md shadow-2xl overflow-hidden animate-fade-in">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#00A86B]" />
                <h3 className="text-[14px] leading-[20px] font-semibold text-[#0F172A]">NDR Lifecycle History</h3>
              </div>
              <button onClick={() => setShowNdrHistory(false)} className="text-[#94A3B8] hover:text-[#0F172A] p-1.5 rounded-md hover:bg-slate-200 transition-colors focus:outline-none">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-5 max-h-[300px] overflow-y-auto pr-1">
              <div className="relative pl-6 space-y-5 border-l-2 border-[#F0FDF4]">
                {(order?.ndrHistory || []).map((h, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[31px] top-1.5 w-2 h-2 rounded-full bg-[#00A86B] border border-white" />
                    <div className="text-[12px] leading-[18px] font-semibold text-[#0F172A]">{h.action || h.status || 'NDR Update'}</div>
                    {h.date && <div className="text-[12px] leading-[18px] font-normal text-[#64748B] mt-0.5">{formatDate(h.date, true)}</div>}
                    {h.reason && <div className="text-[12px] leading-[18px] font-normal text-[#94A3B8] mt-0.5">Reason: {h.reason}</div>}
                  </div>
                ))}
                {(!order?.ndrHistory || order.ndrHistory.length === 0) && (
                  <div className="text-[12px] leading-[18px] font-normal text-[#94A3B8] text-center py-4">No history available</div>
                )}
              </div>
            </div>
            <div className="px-5 py-3.5 bg-slate-50 border-t border-[#E2E8F0] flex justify-end">
              <button onClick={() => setShowNdrHistory(false)} className="bg-[#00A86B] hover:bg-[#009B63] text-white text-[12px] font-bold py-1.5 px-4 rounded-lg transition-colors shadow-sm focus:outline-none">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── UPDATE INFO MODAL ───────────────────────────────────────────────────── */}
      {showUpdateInfoModal && (
        <div className="fixed inset-0 bg-[#000000]/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-sm shadow-2xl overflow-hidden animate-fade-in">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#00A86B]" />
                <h3 className="text-[14px] leading-[20px] font-semibold text-[#0F172A]">Update Alternate Contact</h3>
              </div>
              <button onClick={() => setShowUpdateInfoModal(false)} className="text-[#94A3B8] hover:text-[#0F172A] p-1.5 rounded-md hover:bg-slate-200 transition-colors focus:outline-none">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] leading-4 font-semibold text-[#64748B] uppercase tracking-wider">Alternate Phone Number</label>
                <input
                  type="tel"
                  value={newPhoneNumber}
                  onChange={(e) => setNewPhoneNumber(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E2E8F0] text-[13px] bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] transition-all font-mono"
                  placeholder="Enter 10-digit mobile number"
                />
              </div>
            </div>
            <div className="px-5 py-3.5 bg-slate-50 border-t border-[#E2E8F0] flex justify-end gap-2">
              <button onClick={() => setShowUpdateInfoModal(false)} className="border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#64748B] text-[12px] font-bold py-1.5 px-4 rounded-lg transition-colors focus:outline-none">
                Cancel
              </button>
              <button
                onClick={() => { setShowUpdateInfoModal(false); setToastMessage(`Alternate number updated. Instructions sent to ${courierName}!`); }}
                className="bg-[#00A86B] hover:bg-[#009B63] text-white text-[12px] font-bold py-1.5 px-4 rounded-lg transition-colors shadow-sm focus:outline-none"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RAISE DISPUTE MODAL ─────────────────────────────────────────────────── */}
      {showRaiseDisputeModal && (
        <div className="fixed inset-0 bg-[#000000]/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-md shadow-2xl overflow-hidden animate-fade-in">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-[14px] leading-[20px] font-semibold text-[#0F172A]">Raise Weight Dispute</h3>
              </div>
              <button onClick={() => { setShowRaiseDisputeModal(false); setDisputeError(null); }} className="text-[#94A3B8] hover:text-[#0F172A] p-1.5 rounded-md hover:bg-slate-200 transition-colors focus:outline-none">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 flex justify-between items-center text-[12px] leading-[18px]">
                <span className="font-medium text-[#64748B]">AWB Number</span>
                <span className="font-mono font-semibold text-[#0F172A]">{awbNumber}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] leading-4 font-semibold text-[#64748B] uppercase tracking-wider">
                  Dispute Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={disputeText}
                  onChange={(e) => setDisputeText(e.target.value)}
                  rows={4}
                  placeholder="Describe the weight discrepancy (e.g. actual weight, courier claimed weight, supporting details...)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-[13px] bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] transition-all resize-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] leading-4 font-semibold text-[#64748B] uppercase tracking-wider">
                  Supporting Document <span className="text-[#94A3B8] font-normal normal-case">(optional)</span>
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setDisputeFile(e.target.files?.[0] || null)}
                  className="w-full text-[13px] text-[#64748B] file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[12px] file:font-semibold file:bg-[#F0FDF4] file:text-[#009B63] hover:file:bg-[#BCE8D8] cursor-pointer"
                />
              </div>
              {disputeError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-[12px] px-3 py-2 rounded-lg">
                  {disputeError}
                </div>
              )}
            </div>
            <div className="px-5 py-3.5 bg-slate-50 border-t border-[#E2E8F0] flex justify-end gap-2">
              <button onClick={() => { setShowRaiseDisputeModal(false); setDisputeError(null); }} className="border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#64748B] text-[12px] font-bold py-1.5 px-4 rounded-lg transition-colors focus:outline-none">
                Cancel
              </button>
              <button onClick={handleRaiseDispute} disabled={isSubmittingDispute} className="bg-[#00A86B] hover:bg-[#009B63] disabled:opacity-60 text-white text-[12px] font-bold py-1.5 px-5 rounded-lg transition-colors shadow-sm focus:outline-none">
                {isSubmittingDispute ? 'Submitting...' : 'Submit Dispute'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SHIP ORDER MODAL ────────────────────────────────────────────────────── */}
      {shipOrder && (
        <ShipOrderModal
          order={shipOrder}
          onClose={() => setShipOrder(null)}
          onShipped={() => {
            setShipOrder(null);
            if (orderId) apiClient.get(`/order/getOrderById/${orderId}`).then(r => setOrder(r.data?.order || r.data?.data || r.data)).catch(() => {});
          }}
        />
      )}

      <Toast toast={toastState} onClose={closeToast} />
    </AdminLayout>
  );
}
