import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { usePagination } from '../../hooks/usePagination';
import {
  Search, Download, RefreshCw, ChevronLeft, ChevronRight, ChevronDown,
  Filter, Truck, RotateCcw, CheckCircle2, AlertTriangle, Clock, Package, MoreHorizontal, MapPin, Check, History, User, Settings, Flame, X, Loader2, Zap, IndianRupee, Calendar
} from 'lucide-react';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { GlassDateFilter } from '../../components/ui/GlassDateFilter';

const COURIER_OPTS = ['Delhivery', 'Ekart', 'XpressBees', 'Shadowfax', 'DTDC', 'BlueDart', 'Ecom Express'];
const STATUS_OPTS = ['Booked', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'RTO Initiated', 'RTO Delivered', 'Lost'];
const CHANNEL_OPTS = ['Shopify', 'WooCommerce', 'Manual', 'API', 'Wix', 'Amazon'];
const ORDER_TYPE_OPTS = ['Prepaid', 'COD'];
const VENDOR_OPTS = ['Vendor A', 'Vendor B', 'Vendor C'];
const PICKUP_ADDR_OPTS = ['Mumbai, MH', 'Delhi, DL', 'Bangalore, KA', 'Hyderabad, TS', 'Chennai, TN'];

const STATUS_STYLES: Record<string, string> = {
  'Booked': 'bg-slate-50 text-slate-700 border-slate-200',
  'Picked Up': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'In Transit': 'bg-sky-50 text-sky-700 border-sky-200',
  'Out for Delivery': 'bg-amber-50 text-amber-700 border-amber-200',
  'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'RTO Initiated': 'bg-orange-50 text-orange-700 border-orange-200',
  'RTO Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Lost': 'bg-slate-100 text-slate-500 border-slate-200',
};

/* ── Tracking Timeline Mock Data ── */
interface TrackingEvent {
  date: string;
  time: string;
  activity: string;
  location: string;
  isLatest?: boolean;
}

const LOCATIONS = [
  'Mumbai_Andheri_D (Maharashtra)', 'Delhi_Janakpuri_D (Delhi)', 'Bangalore_Whitefield_D (Karnataka)',
  'Hyderabad_Kukatpally_D (Telangana)', 'Chennai_Adyar_D (Tamil Nadu)', 'Pune_Hadapsar_D (Maharashtra)',
  'Jaipur_ShriKishanpura_D (Rajasthan)', 'Kolkata_SaltLake_D (West Bengal)', 'Ahmedabad_Navrangpura_D (Gujarat)',
  'Lucknow_Gomtinagar_D (Uttar Pradesh)', 'Noida_Sector62_H (Uttar Pradesh)', 'Gurgaon_Sector18_H (Haryana)',
];

const ACTIVITIES_BY_STATUS: Record<string, string[]> = {
  'Delivered': ['Delivered to consignee', 'Out for delivery', 'Shipment Received at Facility', 'Bag Received at Facility', 'Trip Arrived', 'In Transit to Destination', 'Shipment Picked Up', 'Manifest Generated'],
  'Out for Delivery': ['Out for delivery', 'Shipment Received at Facility', 'Bag Received at Facility', 'Trip Arrived', 'In Transit to Destination', 'Shipment Picked Up', 'Manifest Generated'],
  'In Transit': ['In Transit to Destination', 'Shipment Received at Facility', 'Bag Received at Facility', 'Shipment Picked Up', 'Manifest Generated'],
  'Picked Up': ['Shipment Picked Up', 'Pickup Scheduled', 'Manifest Generated'],
  'Booked': ['Manifest Generated', 'Order Placed'],
  'RTO Initiated': ['RTO Initiated - Customer Refused', 'Out for delivery', 'Shipment Received at Facility', 'In Transit to Destination', 'Shipment Picked Up', 'Manifest Generated'],
  'RTO Delivered': ['RTO Delivered to Seller', 'RTO In Transit', 'RTO Initiated - Customer Refused', 'Out for delivery', 'Shipment Picked Up', 'Manifest Generated'],
};

function generateTrackingTimeline(status: string, manifestDate: string, courierName: string): TrackingEvent[] {
  const activities = ACTIVITIES_BY_STATUS[status] || ACTIVITIES_BY_STATUS['In Transit'];
  const baseDate = new Date(manifestDate);
  const timeline: TrackingEvent[] = [];

  activities.forEach((activity, i) => {
    const eventDate = new Date(baseDate);
    eventDate.setDate(eventDate.getDate() + (activities.length - 1 - i));
    const hours = Math.floor(Math.random() * 12) + 1;
    const minutes = Math.floor(Math.random() * 60);
    const ampm = i < activities.length / 2 ? 'PM' : 'AM';

    timeline.push({
      date: eventDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }),
      time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`,
      activity,
      location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
      isLatest: i === 0,
    });
  });

  return timeline;
}

const MOCK_DATA = Array.from({ length: 45 }, (_, i) => {
  const manifestDate = new Date();
  manifestDate.setDate(manifestDate.getDate() - (i % 10));

  return {
    awb: `QP${String(900000000 + i * 1337).padStart(10, '0')}`,
    orderId: `ORD${String(100000 + i).padStart(6, '0')}`,
    orderType: i % 3 === 0 ? 'COD' : 'Prepaid',
    courier: COURIER_OPTS[i % 5],
    channel: CHANNEL_OPTS[i % 5],
    seller: `Seller ${String.fromCharCode(65 + (i % 8))}`,
    companyId: `COMP${1000 + (i % 8)}`,
    pickupAddr: ['Mumbai, MH', 'Delhi, DL', 'Bangalore, KA', 'Hyderabad, TS', 'Chennai, TN'][i % 5],
    shippingAddr: ['Pune, MH', 'Noida, UP', 'Mysore, KA', 'Vizag, AP', 'Coimbatore, TN'][i % 5],
    paymentMode: i % 3 === 0 ? 'COD' : 'Prepaid',
    shipmentValue: `₹${((i + 1) * 349 + 200).toLocaleString('en-IN')}`,
    status: STATUS_OPTS[i % (STATUS_OPTS.length - 1)],
    manifestDate: manifestDate.toISOString(),
    customerName: ['Rahul Sharma', 'Priya Singh', 'Amit Kumar', 'Neha Gupta', 'Vikram Patel'][i % 5],
    customerPhone: ['9876543210', '8765432109', '7654321098', '6543210987', '5432109876'][i % 5],
    lastUpdateEvent: i % 4 === 0 ? 'Reached Facility' : i % 3 === 0 ? 'Out for Delivery' : 'In Transit',
    lastUpdateDate: i % 2 === 0 ? 'Today' : 'Yesterday',
    lastUpdateTime: `${10 + (i % 8)}:${String(15 + (i % 45)).padStart(2, '0')} ${i % 2 === 0 ? 'AM' : 'PM'}`,
    productName: ['Money Attraction Pro...', 'Magnetic Wireless Charger', 'Ergonomic Office Chair', 'Ultra-Slim Power Bank', 'Smart Fitness Watch'][i % 5],
    sku: ['QP-ALL-PRO', 'QP-MAG-CHG', 'QP-ERG-CHR', 'QP-PWR-BNK', 'QP-FIT-WCH'][i % 5],
    qty: 1 + (i % 3),
    weight: ['500g', '250g', '12.5kg', '350g', '150g'][i % 5],
    dimensions: ['12×10×8', '10×10×5', '60×60×110', '15×8×3', '8×8×6'][i % 5],
    volWeight: ['0.24 KG', '0.12 KG', '98.5 KG', '0.09 KG', '0.09 KG'][i % 5],
  };
});

const calculateAgeingDays = (manifestDateStr: string) => {
  const start = new Date(manifestDateStr);
  const end = new Date();
  
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  let count = 0;
  const cur = new Date(start);
  while (cur < end) {
    if (cur.getDay() !== 0) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

const getFullProductName = (name?: string) => {
  const n = name || 'Money Attraction Pro...';
  if (n.includes('Money Attraction')) return 'Money Attraction Bracelet Kit Pro (2 Pcs)';
  if (n.includes('Magnetic Wireless')) return 'Magnetic Wireless Fast Charger 15W Pad';
  if (n.includes('Ergonomic Office')) return 'Ergonomic Office Executive Mesh Chair';
  if (n.includes('Ultra-Slim Power')) return 'Ultra-Slim Fast Charging Power Bank 10000mAh';
  if (n.includes('Smart Fitness')) return 'Smart Fitness AMOLED Display Health Watch';
  return n;
};

const renderAgeing = (manifestDateStr: string) => {
  const days = calculateAgeingDays(manifestDateStr);
  const formattedDate = new Date(manifestDateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const tooltipText = `Manifested on ${formattedDate} — ${days} working days pending.`;
  
  if (days <= 1) {
    return (
      <div className="flex items-center gap-1.5 text-[#64748B]" title={tooltipText}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>On schedule</span>
      </div>
    );
  } else if (days <= 3) {
    return (
      <div className="flex items-center gap-1.5 text-[#64748B]" title={tooltipText}>
        <Clock className="w-3.5 h-3.5" />
        <span>{days} days</span>
      </div>
    );
  } else if (days <= 6) {
    return (
      <div className="flex items-center gap-1.5 text-[#0F172A] font-bold" title={tooltipText}>
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>{days} days</span>
      </div>
    );
  } else {
    return (
      <div className="flex items-center gap-1.5 text-[#0F172A] font-bold" title={tooltipText}>
        <Flame className="w-3.5 h-3.5" />
        <span>{days} days</span>
      </div>
    );
  }
};

export function CRMShipmentListing() {
  const [selectedCouriers, setSelectedCouriers] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedOrderTypes, setSelectedOrderTypes] = useState<string[]>([]);
  const [selectedPickupAddrs, setSelectedPickupAddrs] = useState<string[]>([]);
  
  const [userDetails, setUserDetails] = useState('');
  const [orderId, setOrderId] = useState('');
  const [productSpecs, setProductSpecs] = useState('');
  const [packageSpecs, setPackageSpecs] = useState('');
  const [forwardAwb, setForwardAwb] = useState('');
  const [rtoAwb, setRtoAwb] = useState('');

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [showLastUpdate, setShowLastUpdate] = useState(false);
  
  const [showAgeingLegend, setShowAgeingLegend] = useState(false);
  const ageingLegendRef = useRef<HTMLTableHeaderCellElement>(null);
  const [hoveredTracking, setHoveredTracking] = useState<{id: string, rect: DOMRect, activity: string, location: string, date: string, time: string} | null>(null);

  // Moved tracking state to below paginated

  const hasActiveFilters = selectedCouriers.length > 0 || selectedStatuses.length > 0 || selectedChannels.length > 0 || selectedOrderTypes.length > 0 || selectedPickupAddrs.length > 0 || userDetails || orderId || productSpecs || packageSpecs || forwardAwb || rtoAwb || (dateFrom && dateTo);

  const handleClearAllFilters = () => {
    setSelectedCouriers([]);
    setSelectedStatuses([]);
    setSelectedChannels([]);
    setSelectedOrderTypes([]);
    setSelectedPickupAddrs([]);
    setUserDetails('');
    setOrderId('');
    setProductSpecs('');
    setPackageSpecs('');
    setForwardAwb('');
    setRtoAwb('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const handleApplyFilters = () => {
    setPage(1);
  };

  const filtered = useMemo(() => {
    return MOCK_DATA.filter(r => {
      if (selectedCouriers.length > 0 && !selectedCouriers.includes(r.courier)) return false;
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(r.status)) return false;
      if (selectedChannels.length > 0 && !selectedChannels.includes(r.channel)) return false;
      if (selectedOrderTypes.length > 0 && !selectedOrderTypes.includes(r.orderType)) return false;
      if (selectedPickupAddrs.length > 0 && !selectedPickupAddrs.some(addr => r.pickupAddr.toLowerCase().includes(addr.toLowerCase()))) return false;
      if (userDetails && !r.companyId.toLowerCase().includes(userDetails.toLowerCase())) return false;
      if (orderId && !r.orderId.toLowerCase().includes(orderId.toLowerCase())) return false;
      if (productSpecs && !(
        (r.productName && r.productName.toLowerCase().includes(productSpecs.toLowerCase())) ||
        (r.sku && r.sku.toLowerCase().includes(productSpecs.toLowerCase()))
      )) return false;
      if (packageSpecs && !(
        (r.weight && r.weight.toLowerCase().includes(packageSpecs.toLowerCase())) ||
        (r.dimensions && r.dimensions.toLowerCase().includes(packageSpecs.toLowerCase())) ||
        (r.volWeight && r.volWeight.toLowerCase().includes(packageSpecs.toLowerCase()))
      )) return false;
      if (forwardAwb && !r.awb.toLowerCase().includes(forwardAwb.toLowerCase())) return false;
      if (rtoAwb && !r.awb.toLowerCase().includes(rtoAwb.toLowerCase())) return false;
      return true;
    });
  }, [selectedCouriers, selectedStatuses, selectedChannels, selectedOrderTypes, selectedPickupAddrs, userDetails, orderId, productSpecs, packageSpecs, forwardAwb, rtoAwb]);

  const {
    page,
    setPage,
    totalPages,
    paginatedData: paginated,
    startIndex,
    endIndex,
  } = usePagination({ data: filtered, perPage: 10 });

  const toggleAll = () => setSelectedOrders(selectedOrders.length === paginated.length && paginated.length > 0 ? [] : paginated.map(o => o.awb));
  const toggleSelect = (id: string) => setSelectedOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // Tracking timeline state
  const [trackingData, setTrackingData] = useState<Record<string, TrackingEvent[]>>({});
  const [trackingLoading, setTrackingLoading] = useState<Record<string, boolean>>({});
  const [openTrackingAwb, setOpenTrackingAwb] = useState<string | null>(null);
  const [autoFetchEnabled, setAutoFetchEnabled] = useState(true);
  const [lastAutoFetch, setLastAutoFetch] = useState<Date | null>(null);
  const trackingPopoverRef = useRef<HTMLDivElement>(null);

  // Simulate fetching tracking from courier API
  const fetchTracking = useCallback((awb: string, status: string, manifestDate: string, courier: string) => {
    setTrackingLoading(prev => ({ ...prev, [awb]: true }));
    // Simulate API call delay
    setTimeout(() => {
      const timeline = generateTrackingTimeline(status, manifestDate, courier);
      setTrackingData(prev => ({ ...prev, [awb]: timeline }));
      setTrackingLoading(prev => ({ ...prev, [awb]: false }));
    }, 600 + Math.random() * 800);
  }, []);

  // Auto-fetch tracking for visible rows
  useEffect(() => {
    if (!autoFetchEnabled) return;
    
    const fetchAll = () => {
      paginated.forEach(row => {
        if (!trackingData[row.awb]) {
          fetchTracking(row.awb, row.status, row.manifestDate, row.courier);
        }
      });
      setLastAutoFetch(new Date());
    };

    fetchAll();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      paginated.forEach(row => {
        fetchTracking(row.awb, row.status, row.manifestDate, row.courier);
      });
      setLastAutoFetch(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, [autoFetchEnabled, page]); // re-fetch when page changes

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ageingLegendRef.current && !ageingLegendRef.current.contains(e.target as Node)) setShowAgeingLegend(false);
      if (trackingPopoverRef.current && !trackingPopoverRef.current.contains(e.target as Node)) setOpenTrackingAwb(null);
      setOpenActionId(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalColumns = showLastUpdate ? 12 : 11;


  return (
    <AdminLayout>
      <div className="flex flex-col h-[100vh] -m-4 md:-m-6 bg-white overflow-hidden">
        {/* Header Section */}
        <div className="bg-white shrink-0 px-6 pt-4 pb-3 border-b border-[#E2E8F0]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#0F172A]">Shipment Listing</h2>
                <span className="text-[10px] font-bold bg-[#00A86B]/10 text-[#00A86B] px-2 py-0.5 rounded-full">INTERNAL CRM</span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">AWB-level details — view, filter and manage all shipments across couriers.</p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#00A86B] text-white text-xs font-semibold hover:bg-[#009960] transition-colors shadow-sm">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
            </div>
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5 items-end mt-3">

            {/* User */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">User</label>
              <div className="relative">
                <input type="text" placeholder="Search user..." value={userDetails} onChange={e => setUserDetails(e.target.value)} className="w-full h-9 px-3 pr-8 rounded-[10px] border border-[#E2E8F0]/80 text-xs bg-gradient-to-br from-white/90 to-[#F8FAFC]/70 backdrop-blur-[8px] text-[#0F172A] placeholder:text-[#94A3B8] hover:border-[#00A86B]/30 focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] transition-all" />
                <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              </div>
            </div>

            {/* Order */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Order</label>
              <div className="relative">
                <input type="text" placeholder="Search order..." value={orderId} onChange={e => setOrderId(e.target.value)} className="w-full h-9 px-3 pr-8 rounded-[10px] border border-[#E2E8F0]/80 text-xs bg-gradient-to-br from-white/90 to-[#F8FAFC]/70 backdrop-blur-[8px] text-[#0F172A] placeholder:text-[#94A3B8] hover:border-[#00A86B]/30 focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] transition-all" />
                <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              </div>
            </div>

            {/* Product */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Product</label>
              <div className="relative">
                <input type="text" placeholder="Search SKU / item..." value={productSpecs} onChange={e => setProductSpecs(e.target.value)} className="w-full h-9 px-3 pr-8 rounded-[10px] border border-[#E2E8F0]/80 text-xs bg-gradient-to-br from-white/90 to-[#F8FAFC]/70 backdrop-blur-[8px] text-[#0F172A] placeholder:text-[#94A3B8] hover:border-[#00A86B]/30 focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] transition-all" />
                <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              </div>
            </div>

            {/* Package */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Package</label>
              <div className="relative">
                <input type="text" placeholder="Search weight / dims..." value={packageSpecs} onChange={e => setPackageSpecs(e.target.value)} className="w-full h-9 px-3 pr-8 rounded-[10px] border border-[#E2E8F0]/80 text-xs bg-gradient-to-br from-white/90 to-[#F8FAFC]/70 backdrop-blur-[8px] text-[#0F172A] placeholder:text-[#94A3B8] hover:border-[#00A86B]/30 focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] transition-all" />
                <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              </div>
            </div>

            {/* Forward AWB */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Forward AWB</label>
              <div className="relative">
                <input type="text" placeholder="Search FWD AWB..." value={forwardAwb} onChange={e => setForwardAwb(e.target.value)} className="w-full h-9 px-3 pr-8 rounded-[10px] border border-[#E2E8F0]/80 text-xs bg-gradient-to-br from-white/90 to-[#F8FAFC]/70 backdrop-blur-[8px] text-[#0F172A] placeholder:text-[#94A3B8] hover:border-[#00A86B]/30 focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] transition-all" />
                <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              </div>
            </div>

            {/* RTO AWB */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">RTO AWB</label>
              <div className="relative">
                <input type="text" placeholder="Search RTO AWB..." value={rtoAwb} onChange={e => setRtoAwb(e.target.value)} className="w-full h-9 px-3 pr-8 rounded-[10px] border border-[#E2E8F0]/80 text-xs bg-gradient-to-br from-white/90 to-[#F8FAFC]/70 backdrop-blur-[8px] text-[#0F172A] placeholder:text-[#94A3B8] hover:border-[#00A86B]/30 focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] transition-all" />
                <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              </div>
            </div>

            {/* Date Range */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Date Range</label>
              <GlassDateFilter
                align="left"
                startDate={dateFrom}
                endDate={dateTo}
                onDateChange={(s, e) => { setDateFrom(s); setDateTo(e); }}
              />
            </div>

            {/* Pickup */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Pickup</label>
              <GlassDropdown
                label="Pickup Address"
                options={PICKUP_ADDR_OPTS.map(o => ({ label: o, value: o }))}
                selected={selectedPickupAddrs}
                onChange={setSelectedPickupAddrs}
                placeholder="Search pickup..."
                icon={<MapPin className="w-3.5 h-3.5" />}
              />
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Status</label>
              <GlassDropdown
                label="All Statuses"
                options={STATUS_OPTS.map(o => ({ label: o, value: o }))}
                selected={selectedStatuses}
                onChange={setSelectedStatuses}
                placeholder="Search status…"
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              />
            </div>

            {/* Courier */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Courier</label>
              <GlassDropdown
                label="All Couriers"
                options={COURIER_OPTS.map(o => ({ label: o, value: o }))}
                selected={selectedCouriers}
                onChange={setSelectedCouriers}
                placeholder="Search courier…"
                icon={<Truck className="w-3.5 h-3.5" />}
              />
            </div>

            {/* Channel */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Channel</label>
              <GlassDropdown
                label="All Channels"
                options={CHANNEL_OPTS.map(o => ({ label: o, value: o }))}
                selected={selectedChannels}
                onChange={setSelectedChannels}
                placeholder="Search channel…"
                icon={<Package className="w-3.5 h-3.5" />}
              />
            </div>

            {/* Order Type */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Order Type</label>
              <GlassDropdown
                label="All Types"
                options={ORDER_TYPE_OPTS.map(o => ({ label: o, value: o }))}
                selected={selectedOrderTypes}
                onChange={setSelectedOrderTypes}
                placeholder="COD / Prepaid…"
                icon={<Search className="w-3.5 h-3.5" />}
              />
            </div>
          </div>

          {/* ── Actions Bar ── */}
          <div className="flex items-center justify-end gap-2.5 mt-3.5 pt-3 border-t border-[#E2E8F0]/70">
            {hasActiveFilters && (
              <button onClick={handleClearAllFilters} className="h-9 px-3.5 rounded-lg border border-red-200 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors focus:ring-2 focus:ring-red-500/20 focus:outline-none flex items-center gap-1.5">
                <X className="w-3.5 h-3.5" /> Clear All
              </button>
            )}
            <button onClick={handleApplyFilters} className="h-9 px-5 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm focus:ring-2 focus:ring-[#00A86B]/20 focus:outline-none flex items-center justify-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Apply
            </button>
          </div>
        </div>

        {/* Toolbar */}
        {selectedOrders.length > 0 && (
          <div className="bg-white shrink-0 px-6 py-2.5 border-b border-[#E2E8F0] flex items-center justify-end gap-4">
            <div className="flex items-center gap-3 animate-fade-in shrink-0">
              <span className="text-xs font-bold text-blue-700">{selectedOrders.length} selected</span>
              <button className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-50 transition-colors">Export Selection</button>
            </div>
          </div>
        )}

        {/* Table Area */}
        <div className="bg-white flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className={`flex-1 overflow-y-auto w-full relative ${showLastUpdate ? 'overflow-x-auto' : 'overflow-x-hidden'}`}>
            <table className={`text-left border-collapse w-full ${showLastUpdate ? 'min-w-[1400px]' : 'table-fixed'}`}>
              <colgroup>
                <col style={{ width: '36px' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '12%' }} />
                {showLastUpdate && <col style={{ width: '180px' }} />}
                <col style={{ width: '50px' }} />
              </colgroup>
              <thead className="sticky top-0 z-40 shadow-sm">
                <tr className="bg-[#E6F5F1] text-[11px] font-medium text-[#00A86B] uppercase tracking-wider whitespace-nowrap">
                  <th className="px-2 py-3 text-center align-middle">
                    <input type="checkbox" checked={selectedOrders.length === paginated.length && paginated.length > 0} onChange={toggleAll} className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                  </th>
                  <th className="px-2 py-3 text-left align-middle">
                    <div className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 shrink-0"/>
                      <span>User</span>
                    </div>
                  </th>
                  <th className="px-2 py-3 text-left align-middle">
                    <div className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 shrink-0"/>
                      <span>Order</span>
                    </div>
                  </th>
                  <th className="px-2 py-3 text-left align-middle">
                    <div className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 shrink-0"/>
                      <span>Product</span>
                    </div>
                  </th>
                  <th className="px-2 py-3 text-center align-middle">
                    <div className="flex items-center justify-center gap-1">
                      <IndianRupee className="w-3.5 h-3.5 shrink-0"/>
                      <span>Payment</span>
                    </div>
                  </th>
                  <th className="px-2 py-3 text-left align-middle">
                    <div className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 shrink-0"/>
                      <span>Customer</span>
                    </div>
                  </th>
                  <th className="px-2 py-3 text-left align-middle">
                    <div className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 shrink-0"/>
                      <span>Shipment</span>
                    </div>
                  </th>
                  <th 
                    ref={ageingLegendRef}
                    className="px-2 py-3 text-left align-middle relative cursor-pointer hover:bg-[#D1F0E8] transition-colors"
                    onClick={() => setShowAgeingLegend(!showAgeingLegend)}
                  >
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 shrink-0"/>
                      <span>Ageing</span>
                    </div>
                    
                    {showAgeingLegend && (
                      <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] border border-[#E2E8F0] p-3 z-[100] normal-case tracking-normal">
                        <div className="text-[11px] font-bold text-[#0F172A] mb-2 pb-2 border-b border-[#E2E8F0]">Ageing Indicators</div>
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2 text-[11px] font-medium text-[#64748B]">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> On schedule (0-1 days)
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-medium text-[#64748B]">
                            <Clock className="w-3.5 h-3.5 shrink-0" /> Normal (2-3 days)
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-bold text-[#0F172A]">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Delay (4-6 days)
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-bold text-[#0F172A]">
                            <Flame className="w-3.5 h-3.5 shrink-0" /> Critical (7+ days)
                          </div>
                        </div>
                      </div>
                    )}
                  </th>
                  <th className="px-2 py-3 text-center align-middle">
                    <div className="flex items-center justify-center gap-1">
                      <Check className="w-3.5 h-3.5 shrink-0"/>
                      <span>Status</span>
                      <button
                        onClick={() => setShowLastUpdate(!showLastUpdate)}
                        className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-[#D1F0E8] transition-all duration-200 shrink-0 ml-0.5"
                        title={showLastUpdate ? 'Hide last update' : 'Show last update'}
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ease-in-out ${showLastUpdate ? 'rotate-90 text-[#009B63]' : '-rotate-90'}`} />
                      </button>
                    </div>
                  </th>
                  {showLastUpdate && (
                    <th className="px-3 py-3 text-left align-middle">
                      <div className="flex items-center gap-1">
                        <History className="w-3.5 h-3.5 shrink-0"/>
                        <span>Last Update</span>
                        {autoFetchEnabled && <Zap className="w-3 h-3 text-amber-500 animate-pulse" />}
                      </div>
                    </th>
                  )}
                  <th className="px-2 py-3 text-center align-middle">
                    <div className="flex items-center justify-center gap-1">
                      <Settings className="w-3.5 h-3.5 shrink-0"/>
                      <span>Actions</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="text-[11px] text-[#475569]">
                {paginated.map((row, idx) => (
                  <tr key={row.awb} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors group">
                    <td className="px-2 py-3 text-center align-middle">
                      <input type="checkbox" checked={selectedOrders.includes(row.awb)} onChange={() => toggleSelect(row.awb)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                    </td>
                    <td className="px-2 py-3 text-left align-middle">
                      <div className="text-xs font-semibold text-[#00A86B] truncate">{row.companyId}</div>
                      <div className="text-sm font-semibold text-[#0F172A] mt-0.5 truncate">{row.seller}</div>
                      <div className="font-sans text-xs font-normal text-[#94A3B8] truncate">crm@quickpost.in</div>
                    </td>
                    <td className="px-2 py-3 text-left align-middle">
                      <div className="text-xs font-semibold text-[#00A86B] hover:underline cursor-pointer truncate">{row.orderId}</div>
                      <div className="table-date mt-0.5">{new Date(row.manifestDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      <div className="mt-1"><span className="px-2 py-0.5 rounded-full border border-blue-200 text-blue-600 font-bold text-[9px] bg-blue-50/50">{row.channel || 'API'}</span></div>
                    </td>
                    <td className="px-2 py-3 text-left align-middle text-xs font-normal">
                      <div className="relative group/prod cursor-pointer max-w-full">
                        <div className="text-[#0F172A] truncate font-medium" title={getFullProductName(row.productName)}>
                          {row.productName || 'Money Attraction Pro...'}
                        </div>
                        <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/prod:block z-50 bg-[#0F172A] text-white text-[11px] font-normal px-2.5 py-1.5 rounded shadow-xl whitespace-nowrap pointer-events-none border border-slate-700">
                          {getFullProductName(row.productName)}
                          <div className="absolute left-4 top-full -mt-1 border-4 border-transparent border-t-[#0F172A]" />
                        </div>
                      </div>
                      <div className="text-[#64748B] mt-0.5 truncate">SKU: {row.sku || 'QP-ALL-PRO'}</div>
                      <div className="text-[#64748B] truncate">QTY: {row.qty || 1}</div>
                    </td>
                    <td className="px-2 py-3 text-center align-middle">
                      <div className="font-semibold text-[#0F172A]">{row.shipmentValue}</div>
                      <div className="mt-1"><span className="px-2 py-0.5 rounded-full border border-blue-200 text-blue-600 font-bold text-[9px] bg-blue-50/50">{row.paymentMode}</span></div>
                    </td>
                    <td className="px-2 py-3 text-left align-middle">
                      <div className="font-normal text-[13px] text-[#0F172A] truncate">{row.customerName}</div>
                      <div className="font-normal text-[13px] text-[#64748B] mt-0.5">{row.customerPhone}</div>
                    </td>
                    <td className="px-2 py-3 text-left align-middle">
                      <div className="text-xs font-semibold text-[#00A86B] truncate">{row.courier}</div>
                      <div className="table-date mt-0.5 truncate">Assigned On | {new Date(row.manifestDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                      <div className="text-xs font-semibold text-[#00A86B] underline mt-0.5 hover:text-[#009B63] cursor-pointer truncate">{row.awb}</div>
                    </td>
                    <td className="px-2 py-3 text-left align-middle">
                      {renderAgeing(row.manifestDate)}
                    </td>
                    <td className="px-2 py-3 text-center align-middle">
                      <span className={`px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[row.status] || 'bg-blue-50 text-blue-700 border-blue-200'} text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap shadow-sm`}>
                        {row.status}
                      </span>
                    </td>
                    {showLastUpdate && (
                      <td className="px-3 py-3 text-left align-middle min-w-[180px]">
                        {trackingLoading[row.awb] && !trackingData[row.awb] ? (
                          <div className="flex items-center gap-2 text-[#94A3B8]">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span className="text-[10px] font-medium">Fetching…</span>
                          </div>
                        ) : trackingData[row.awb] && trackingData[row.awb].length > 0 ? (
                          <div 
                            className="text-left px-1.5 py-1 -mx-1.5 -my-1 cursor-help group/tracking"
                            onMouseEnter={(e) => {
                              const latest = trackingData[row.awb][0];
                              setHoveredTracking({
                                id: row.awb,
                                rect: e.currentTarget.getBoundingClientRect(),
                                activity: latest.activity,
                                location: latest.location,
                                date: latest.date,
                                time: latest.time
                              });
                            }}
                            onMouseLeave={() => setHoveredTracking(null)}
                          >
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-[#00A86B] shrink-0 animate-pulse" />
                              <span className="font-semibold text-[#0F172A] text-[11px] truncate max-w-[140px]">{trackingData[row.awb][0].activity}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-[#64748B] mt-0.5">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[140px]">{trackingData[row.awb][0].location}</span>
                            </div>
                            <div className="text-[10px] text-[#64748B] mt-0.5">
                              {trackingData[row.awb][0].date} • {trackingData[row.awb][0].time}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => fetchTracking(row.awb, row.status, row.manifestDate, row.courier)}
                            className="text-[10px] font-bold text-[#00A86B] hover:underline flex items-center gap-1"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Fetch
                          </button>
                        )}
                      </td>
                    )}
                    <td className="px-2 py-3 text-center align-middle">
                      <div className="relative inline-flex justify-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setOpenActionId(openActionId === String(idx) ? null : String(idx)); }}
                          className="w-7 h-7 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] relative z-10"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                        
                        {openActionId === String(idx) && (
                          <div 
                            className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-[#E2E8F0] py-2 z-[60]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button className="w-full text-left px-4 py-2 text-[12px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors" onClick={() => alert('Redirecting to order details...')}>View Details</button>
                            <button className="w-full text-left px-4 py-2 text-[12px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors" onClick={() => alert('Opening live tracking modal...')}>Track Shipment</button>
                            <button className="w-full text-left px-4 py-2 text-[12px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors" onClick={() => alert('Downloading Proof of Delivery (POD)...')}>Download POD</button>
                            <button className="w-full text-left px-4 py-2 text-[12px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors" onClick={() => alert('Opening Support Ticket Escalation dialog...')}>Raise Ticket</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={totalColumns} className="p-8 text-center text-[#64748B] font-medium">
                      No records found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between shrink-0">
              <div className="text-xs text-[#64748B]">
                Showing <span className="font-bold text-[#0F172A]">{startIndex}</span> to <span className="font-bold text-[#0F172A]">{endIndex}</span> of <span className="font-bold text-[#0F172A]">{filtered.length}</span> entries
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  // simple pagination window
                  let start = Math.max(1, page - 2);
                  let end = Math.min(totalPages, start + 4);
                  if (end - start < 4) {
                    start = Math.max(1, end - 4);
                  }
                  return start + i;
                }).filter(p => p <= totalPages).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded text-xs font-medium flex items-center justify-center transition-colors ${
                      page === p ? 'bg-[#00A86B] text-white border border-[#00A86B]' : 'border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Tooltip for Tracking Last Update */}
      {hoveredTracking && (
        <div 
          className="fixed z-[9999] pointer-events-none bg-[#0F172A] text-white text-[10px] p-3 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] transition-opacity animate-in fade-in zoom-in-95 duration-150 w-64"
          style={{
            top: hoveredTracking.rect.top - 10,
            left: hoveredTracking.rect.left + (hoveredTracking.rect.width / 2),
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="font-bold text-white mb-1.5 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-[#00A86B]" /> 
            Last Update Details
          </div>
          <div className="space-y-1.5 border-t border-white/10 pt-1.5 mt-1.5">
            <div className="flex justify-between gap-2"><span className="text-slate-400">Activity:</span><span className="font-semibold text-white text-right">{hoveredTracking.activity}</span></div>
            <div className="flex justify-between gap-2"><span className="text-slate-400">Location:</span><span className="font-semibold text-white text-right">{hoveredTracking.location}</span></div>
            <div className="flex justify-between gap-2"><span className="text-slate-400">Time:</span><span className="font-semibold text-white text-right">{hoveredTracking.date} • {hoveredTracking.time}</span></div>
          </div>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#0F172A]"></div>
        </div>
      )}
    </AdminLayout>
  );
}
