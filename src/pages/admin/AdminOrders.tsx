import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { usePagination } from '../../hooks/usePagination';
import { Search, ChevronDown, RefreshCcw, Send, Calendar, Check, MoreHorizontal, IndianRupee, Package, User, Settings, MapPin, X, Truck, CreditCard, Zap, CheckCircle2, Clock, AlertTriangle, Flame, History, Layers, Loader2, RefreshCw } from 'lucide-react';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { GlassDateFilter } from '../../components/ui/GlassDateFilter';

const MAIN_TABS = [
  { name: 'New', count: 245 },
  { name: 'Ready to Ship', count: 156 },
  { name: 'Pickup & Manifest', count: 82 },
  { name: 'In Transit', count: 3452 },
  { name: 'Delivered', count: 12450 },
  { name: 'All', count: 16385 }
];

const MORE_TABS = [
  'Out for Delivery',
  'Cancelled',
  'Lost',
  'Damaged',
  'RTO Initiated',
  'RTO In Transit',
  'RTO Delivered',
  'RTO Lost',
  'RTO Damaged'
];

const STATUS_OPTIONS = ['New', 'Ready to Ship', 'Pickup & Manifest', 'In Transit', 'Delivered', 'Out for Delivery', 'Cancelled', 'RTO Initiated'];

const STATUS_BADGE_STYLES: Record<string, string> = {
  'New': 'bg-slate-50 text-slate-700 border-slate-200',
  'Ready to Ship': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Pickup & Manifest': 'bg-violet-50 text-violet-700 border-violet-200',
  'Pickup Scheduled': 'bg-violet-50 text-violet-700 border-violet-200',
  'In Transit': 'bg-sky-50 text-sky-700 border-sky-200',
  'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Out for Delivery': 'bg-amber-50 text-amber-700 border-amber-200',
  'Cancelled': 'bg-rose-50 text-rose-700 border-rose-200',
  'Lost': 'bg-slate-100 text-slate-500 border-slate-200',
  'Damaged': 'bg-rose-50 text-rose-700 border-rose-200',
  'RTO Initiated': 'bg-orange-50 text-orange-700 border-orange-200',
  'RTO In Transit': 'bg-orange-50 text-orange-700 border-orange-200',
  'RTO Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'RTO Lost': 'bg-slate-100 text-slate-500 border-slate-200',
  'RTO Damaged': 'bg-rose-50 text-rose-700 border-rose-200',
};

const getStatusBadgeClass = (status: string) => {
  const normalized = status || '';
  return `${STATUS_BADGE_STYLES[normalized] || 'bg-blue-50 text-blue-700 border-blue-200'} px-2.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap shadow-sm`;
};

const INITIAL_MOCK_ORDERS = Array.from({ length: 45 }, (_, i) => {
  const manifestDate = new Date();
  manifestDate.setDate(manifestDate.getDate() - (i % 10));

  return {
    id: `86543`,
    awb: `QPSP${String(45 + i).padStart(9, '0')}`,
    userName: 'Dinesh Tharwani',
    userEmail: 'dineshtharwani@gmail.com',
    date: i % 2 === 0 ? '13th Apr 2026' : '17th Apr 2026',
    manifestDate: manifestDate.toISOString(),
    productName: 'Money Attraction Pro...',
    sku: 'MT402JJA',
    qty: 12,
    weight: '250g',
    dimensions: '10×10×10',
    volWeight: '0.20 KG',
    payment: 200,
    paymentType: 'Prepaid',
    customerName: 'Abdul Latiff',
    customerPhone: '7854321890',
    pickupName: 'Shubham Kukreja',
    courier: 'Ekart Surface',
    bookedDate: '13 Apr 2026',
    status: STATUS_OPTIONS[i % STATUS_OPTIONS.length],
    lastUpdateEvent: i % 4 === 0 ? 'Picked up by Courier' : i % 3 === 0 ? 'Pickup Scheduled' : i % 3 === 1 ? 'Manifest Generated' : 'Order Verified',
    courierLastUpdate: i % 4 === 0 ? 'Reached Facility, Gurugram' : null,
    lastUpdateDate: i % 2 === 0 ? 'Today' : 'Yesterday',
    lastUpdateTime: `${10 + (i % 8)}:${String(15 + (i % 45)).padStart(2, '0')} ${i % 2 === 0 ? 'AM' : 'PM'}`,
    totalPackages: 5 + (i % 15),
    pickedPackages: (i % 4 === 0) ? (5 + (i % 15)) : (i % 3 === 0 ? 0 : Math.floor((5 + (i % 15)) * 0.6)),
    pickupId: `PID${String(1000 + i)}`
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

const renderAgeing = (manifestDateStr: string) => {
  const days = calculateAgeingDays(manifestDateStr);
  const formattedDate = new Date(manifestDateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const tooltipText = `Manifested on ${formattedDate} — ${days} working days pending pickup.`;
  
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

const getFullProductName = (name?: string) => {
  const n = name || 'Money Attraction Pro...';
  if (n.includes('Money Attraction')) return 'Money Attraction Bracelet Kit Pro (2 Pcs)';
  if (n.includes('Magnetic Wireless')) return 'Magnetic Wireless Fast Charger 15W Pad';
  if (n.includes('Ergonomic Office')) return 'Ergonomic Office Executive Mesh Chair';
  if (n.includes('Ultra-Slim Power')) return 'Ultra-Slim Fast Charging Power Bank 10000mAh';
  if (n.includes('Smart Fitness')) return 'Smart Fitness AMOLED Display Health Watch';
  return n;
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

export function AdminOrders() {
  const [globalSearchQuery, setGlobalSearchQuery] = useState((window as any).__adminSearchQuery?.toLowerCase() || '');

  useEffect(() => {
    const handleSearch = (e: Event) => {
      setGlobalSearchQuery(((e as CustomEvent).detail || '').toLowerCase());
      setCurrentPage(1);
    };
    window.addEventListener('admin-search', handleSearch);
    setGlobalSearchQuery(((window as any).__adminSearchQuery || '').toLowerCase());
    return () => {
      window.removeEventListener('admin-search', handleSearch);
    };
  }, []);

  const [activeTab, setActiveTab] = useState('New');
  const isExceptionTab = ['New', 'Ready to Ship', 'Pickup & Manifest'].includes(activeTab);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [drawerOrder, setDrawerOrder] = useState<typeof INITIAL_MOCK_ORDERS[0] | null>(null);
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [hoveredPickup, setHoveredPickup] = useState<{id: string, rect: DOMRect, name: string} | null>(null);
  const [hoveredTracking, setHoveredTracking] = useState<{id: string, rect: DOMRect, activity: string, location: string, date: string, time: string} | null>(null);
  const [showAgeingLegend, setShowAgeingLegend] = useState(false);
  const ageingLegendRef = useRef<HTMLTableHeaderCellElement>(null);

  // Filter States
  const [searchUser, setSearchUser] = useState('');
  const [searchOrderId, setSearchOrderId] = useState('');
  const [selectedPaymentTypes, setSelectedPaymentTypes] = useState<string[]>([]);
  const [selectedPickupAddresses, setSelectedPickupAddresses] = useState<string[]>([]);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selectedCouriers, setSelectedCouriers] = useState<string[]>([]);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);

  // Dropdown options
  const PAYMENT_TYPE_OPTIONS = [
    { label: 'Prepaid', value: 'Prepaid' },
    { label: 'COD', value: 'COD' },
    { label: 'Partial COD', value: 'Partial COD' },
  ];

  const PICKUP_ADDRESS_OPTIONS = [
    { label: 'Shubham Kukreja', value: 'Shubham Kukreja' },
    { label: 'Warehouse – Mumbai', value: 'Mumbai' },
    { label: 'Warehouse – Delhi', value: 'Delhi' },
    { label: 'Warehouse – Bangalore', value: 'Bangalore' },
    { label: 'Warehouse – Chennai', value: 'Chennai' },
    { label: 'Warehouse – Hyderabad', value: 'Hyderabad' },
  ];

  const COURIER_OPTIONS = [
    { label: 'Ekart Surface', value: 'Ekart Surface' },
    { label: 'Delhivery', value: 'Delhivery' },
    { label: 'Bluedart', value: 'Bluedart' },
    { label: 'XpressBees', value: 'XpressBees' },
    { label: 'Shadowfax', value: 'Shadowfax' },
    { label: 'DTDC', value: 'DTDC' },
  ];
  
  // Tracking timeline state
  const [trackingData, setTrackingData] = useState<Record<string, TrackingEvent[]>>({});
  const [trackingLoading, setTrackingLoading] = useState<Record<string, boolean>>({});
  const [autoFetchEnabled, setAutoFetchEnabled] = useState(true);

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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setShowMore(false);
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) setShowActionMenu(false);
      if (ageingLegendRef.current && !ageingLegendRef.current.contains(e.target as Node)) setShowAgeingLegend(false);
      setOpenActionId(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasActiveFilters = selectedPaymentTypes.length > 0 || selectedPickupAddresses.length > 0 || selectedCouriers.length > 0 || (dateStart && dateEnd);

  const handleClearAllFilters = () => {
    setSelectedPaymentTypes([]);
    setSelectedPickupAddresses([]);
    setSelectedCouriers([]);
    setDateStart('');
    setDateEnd('');
    setCurrentPage(1);
  };

  const filteredOrders = useMemo(() => {
    const result = INITIAL_MOCK_ORDERS.filter(order => {
      const matchSearchUser = searchUser ? 
        order.userName.toLowerCase().includes(searchUser.toLowerCase()) || 
        order.userEmail.toLowerCase().includes(searchUser.toLowerCase()) || 
        order.customerName.toLowerCase().includes(searchUser.toLowerCase()) ||
        order.customerPhone.includes(searchUser) : true;
        
      const matchSearchOrderId = searchOrderId ? (
        activeTab === 'Pickup & Manifest'
          ? (order.pickupId.toLowerCase().includes(searchOrderId.toLowerCase()))
          : activeTab === 'New'
            ? order.id.toLowerCase().includes(searchOrderId.toLowerCase())
            : (order.id.toLowerCase().includes(searchOrderId.toLowerCase()) || order.awb.toLowerCase().includes(searchOrderId.toLowerCase()))
      ) : true;
      const matchGlobal = globalSearchQuery ?
        order.userName.toLowerCase().includes(globalSearchQuery) || 
        order.userEmail.toLowerCase().includes(globalSearchQuery) || 
        order.customerName.toLowerCase().includes(globalSearchQuery) ||
        order.customerPhone.includes(globalSearchQuery) ||
        order.awb.toLowerCase().includes(globalSearchQuery) ||
        order.id.toLowerCase().includes(globalSearchQuery) : true;
      const matchPayment = selectedPaymentTypes.length === 0 || selectedPaymentTypes.includes(order.paymentType);
      const matchPickup = selectedPickupAddresses.length === 0 || selectedPickupAddresses.includes(order.pickupName);
      const matchCourier = selectedCouriers.length === 0 || selectedCouriers.includes(order.courier);
      
      return matchSearchUser && matchSearchOrderId && matchGlobal && matchPayment && matchPickup && matchCourier;
    });

    if (activeTab === 'Pickup & Manifest') {
      result.sort((a, b) => {
        const aAgeing = calculateAgeingDays(a.manifestDate);
        const bAgeing = calculateAgeingDays(b.manifestDate);
        return bAgeing - aAgeing;
      });
    }

    return result;
  }, [searchUser, searchOrderId, globalSearchQuery, selectedPaymentTypes, selectedPickupAddresses, selectedCouriers, activeTab]);

  const {
    page: currentPage,
    setPage: setCurrentPage,
    totalPages,
    paginatedData: paginatedOrders,
    startIndex,
    endIndex,
  } = usePagination({ data: filteredOrders, perPage: 10 });

  // Auto-fetch tracking for visible rows
  useEffect(() => {
    if (!autoFetchEnabled) return;
    
    // Only fetch if we are on a tab that displays the Last Update column
    const shouldFetch = activeTab !== 'New' && activeTab !== 'Pickup & Manifest' && activeTab !== 'Ready to Ship';
    if (!shouldFetch) return;

    const fetchAll = () => {
      paginatedOrders.forEach(order => {
        if (!trackingData[order.awb]) {
          fetchTracking(order.awb, order.status, order.manifestDate, order.courier);
        }
      });
    };

    fetchAll();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      paginatedOrders.forEach(order => {
        fetchTracking(order.awb, order.status, order.manifestDate, order.courier);
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [autoFetchEnabled, currentPage, activeTab, paginatedOrders]);

  // Pagination total pages computed by hook

  const toggleAll = () => setSelectedOrders(selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0 ? [] : paginatedOrders.map(o => o.awb));
  const toggleSelect = (id: string) => setSelectedOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleApplyFilters = () => {
    setCurrentPage(1);
  };

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">
        <div className="bg-white relative z-50 shrink-0">
          {/* Top Header Row */}
          <div className="flex justify-between items-center px-6 py-2 border-b border-[#E2E8F0] bg-white">
            <div className="flex gap-6 items-center">
              {MAIN_TABS.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`relative py-3 text-[13px] font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === tab.name ? 'text-[#00A86B]' : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {tab.name} <span className="text-[11px] font-medium opacity-80">({tab.count})</span>
                  {activeTab === tab.name && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00A86B] rounded-t-full" />
                  )}
                </button>
              ))}
              <div className="relative" ref={moreRef}>
                <button
                  onClick={() => setShowMore(!showMore)}
                  className={`py-3 text-[13px] font-bold flex items-center gap-1 transition-colors whitespace-nowrap ${
                    MORE_TABS.includes(activeTab) ? 'text-[#00A86B]' : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  More <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {showMore && (
                  <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-[#E2E8F0] overflow-hidden z-50">
                    {MORE_TABS.map(tab => (
                      <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); setShowMore(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-[#F8FAFC] transition-colors ${
                          activeTab === tab ? 'text-[#00A86B] bg-[#00A86B]/5' : 'text-[#475569]'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 ml-4">
              <button className="w-8 h-8 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC]">
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

        {/* Secondary Filter Row */}
        <div className="p-3 border-b border-[#E2E8F0] flex flex-wrap items-center gap-2.5 bg-[#F8FAFC]/50">
          <input 
            type="text" 
            placeholder="Search user..." 
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[180px] shrink-0" 
          />
          <input 
            type="text" 
            placeholder={
              activeTab === 'Pickup & Manifest' ? "Search by pickup id..." :
              activeTab === 'New' ? "Search by order id..." : 
              "Search AWB or Order ID..."
            }
            value={searchOrderId}
            onChange={(e) => setSearchOrderId(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[180px] shrink-0 flex-1 sm:flex-none" 
          />
          
          {/* Glass Dropdown – Payment Type */}
          <GlassDropdown
            label="Payment Type"
            options={PAYMENT_TYPE_OPTIONS}
            selected={selectedPaymentTypes}
            onChange={setSelectedPaymentTypes}
            placeholder="Search payment type..."
            icon={<CreditCard className="w-3.5 h-3.5" />}
          />

          {/* Glass Dropdown – Pickup Address */}
          <GlassDropdown
            label="Pickup Address"
            options={PICKUP_ADDRESS_OPTIONS}
            selected={selectedPickupAddresses}
            onChange={setSelectedPickupAddresses}
            placeholder="Search pickup address..."
            icon={<MapPin className="w-3.5 h-3.5" />}
          />

          {/* Glass Date Filter */}
          <GlassDateFilter
            align="right"
            startDate={dateStart}
            endDate={dateEnd}
            onDateChange={(s, e) => { setDateStart(s); setDateEnd(e); }}
          />
          
          {/* Glass Dropdown – Courier Service */}
          <GlassDropdown
            label="Courier Service"
            options={COURIER_OPTIONS}
            selected={selectedCouriers}
            onChange={setSelectedCouriers}
            placeholder="Search courier..."
            icon={<Truck className="w-3.5 h-3.5" />}
          />

          <button onClick={handleApplyFilters} className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm">
            Apply
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleClearAllFilters}
              className="h-9 px-3 shrink-0 rounded-lg border border-red-200 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors"
            >
              Clear All
            </button>
          )}

          <div className="ml-auto flex items-center gap-2 shrink-0">
            <div className="relative" ref={actionMenuRef}>
              <button
                onClick={() => setShowActionMenu(!showActionMenu)}
                className="h-9 pl-4 pr-8 rounded-full border border-[#E2E8F0] text-xs bg-white focus:outline-none flex items-center font-bold text-[#475569] shadow-sm hover:bg-[#F8FAFC] transition-colors"
              >
                Action
                <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              </button>
              
              {showActionMenu && (
                <div className="absolute right-0 top-full mt-2 w-[180px] bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-[#E2E8F0] py-2 z-50">
                  {activeTab === 'Pickup & Manifest' ? (
                    <>
                      <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Download Manifests</button>
                      <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Download Labels</button>
                      <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Download Invoices</button>
                    </>
                  ) : (
                    <>
                      <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Bulk Ship</button>
                      <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Update Package Details</button>
                      <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Update Pickup Address</button>
                      <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Verify Orders</button>
                      <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Export Excel</button>
                      <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Download Invoices</button>
                      <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#EF4444] hover:bg-red-50 transition-colors mt-1">Bulk Delete</button>
                    </>
                  )}
                </div>
              )}
            </div>
            <button className="w-9 h-9 rounded-full bg-[#00A86B] flex items-center justify-center text-white hover:bg-[#009B63] shadow-sm">
              <span className="text-lg leading-none mt-[-2px]">+</span>
            </button>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedOrders.length > 0 && (
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-3 animate-fade-in">
            <span className="text-xs font-bold text-blue-700">{selectedOrders.length} selected</span>
            <button className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm">Bulk Ship</button>
            <button className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm">Update Package Details</button>
            <button className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm">Update Pickup Address</button>
            <button className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm">Verify Orders</button>
            <button className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm">Export Excel</button>
            <button className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm">Download Invoices</button>
            <button className="h-8 px-3 rounded-md bg-white border border-red-200 text-xs font-bold text-red-600 shadow-sm ml-auto hover:bg-red-50">Bulk Delete</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white flex flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
        <div className="flex-1 overflow-y-auto overflow-x-hidden w-full relative">
          {isExceptionTab ? (
            <table className="w-full text-left border-collapse min-w-full">
              <thead className="sticky top-0 z-40 bg-[#E6F5F1] shadow-sm">
                <tr className="text-xs font-medium text-[#00A86B] uppercase tracking-wider">
                  <th className="p-3 w-10 text-left align-middle">
                    <input type="checkbox" checked={selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0} onChange={toggleAll} className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                  </th>
                  <th className="p-3 text-left align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      <span>User</span>
                    </div>
                  </th>
                  {activeTab === 'Pickup & Manifest' ? (
                    <>
                      <th className="p-3 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 shrink-0" />
                          <span>Pickup ID</span>
                        </div>
                      </th>
                      <th className="p-3 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>Pickup</span>
                        </div>
                      </th>
                      <th className="p-3 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>Pickup Date</span>
                        </div>
                      </th>
                      <th className="p-3 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 shrink-0" />
                          <span>Total / Picked</span>
                        </div>
                      </th>
                      <th 
                        ref={ageingLegendRef}
                        className="p-3 text-left align-middle whitespace-nowrap relative cursor-pointer hover:bg-[#D1F0E8] transition-colors"
                        onClick={() => setShowAgeingLegend(!showAgeingLegend)}
                      >
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
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
                    </>
                  ) : (
                    <>
                      <th className="p-3 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>Order</span>
                        </div>
                      </th>
                      <th className="p-3 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 shrink-0" />
                          <span>Product</span>
                        </div>
                      </th>
                      <th className="p-3 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 shrink-0" />
                          <span>Package</span>
                        </div>
                      </th>
                      <th className="p-3 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <IndianRupee className="w-3.5 h-3.5 shrink-0" />
                          <span>Payment</span>
                        </div>
                      </th>
                      <th className="p-3 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 shrink-0" />
                          <span>Customer</span>
                        </div>
                      </th>
                      <th className="p-3 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>Pickup</span>
                        </div>
                      </th>
                      {activeTab !== 'New' && (
                        <th className="p-3 text-left align-middle whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 shrink-0" />
                            <span>Shipment</span>
                          </div>
                        </th>
                      )}
                    </>
                  )}
                  <th className="p-3 text-left align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Status</span>
                    </div>
                  </th>
                  {activeTab !== 'New' && activeTab !== 'Pickup & Manifest' && activeTab !== 'Ready to Ship' && (
                    <th className="p-3 text-left align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 shrink-0" />
                        <span>Last Update</span>
                        {autoFetchEnabled && <span title="Auto-fetch enabled"><Zap className="w-3 h-3 text-amber-500 animate-pulse ml-1 shrink-0" /></span>}
                      </div>
                    </th>
                  )}
                  <th className="p-3 text-left align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 shrink-0" />
                      <span>Actions</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="text-[11px] text-[#475569]">
                {paginatedOrders.map((order, idx) => (
                  <tr key={order.awb} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors group">
                    <td className="p-3">
                      <input type="checkbox" checked={selectedOrders.includes(order.awb)} onChange={() => toggleSelect(order.awb)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                    </td>
                    <td className="p-3">
                      <div className="text-xs font-semibold text-[#00A86B] hover:underline cursor-pointer" onClick={() => setDrawerOrder(order)}>{order.id}</div>
                      <div className="text-sm font-semibold text-[#0F172A] mt-0.5">{order.userName}</div>
                      <div className="font-sans text-xs font-normal text-[#94A3B8]">{order.userEmail}</div>
                    </td>
                    {activeTab === 'Pickup & Manifest' ? (
                      <>
                        <td className="p-3">
                          <div className="text-xs font-semibold text-[#00A86B]">SHIP-{order.id.slice(-3)}</div>
                          <div className="table-date mt-0.5">Requested on: {order.date}</div>
                          <div className="mt-0.5 text-xs font-semibold text-[#0F172A]">{order.courier}</div>
                        </td>
                        <td className="p-3">
                          <div 
                            className="text-[#64748B] underline decoration-dotted underline-offset-2 hover:text-[#0F172A] transition-colors cursor-help inline-block"
                            onMouseEnter={(e) => {
                              setHoveredPickup({
                                id: order.awb,
                                rect: e.currentTarget.getBoundingClientRect(),
                                name: order.pickupName
                              });
                            }}
                            onMouseLeave={() => setHoveredPickup(null)}
                          >
                            {order.pickupName}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="table-date">14 Apr 2026</div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
                              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                                <path
                                  className="text-[#F1F5F9]"
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className={`${order.pickedPackages === order.totalPackages ? 'text-[#00A86B]' : order.pickedPackages > 0 ? 'text-[#F59E0B]' : 'text-[#CBD5E1]'} transition-all duration-500 ease-out`}
                                  strokeDasharray={`${(order.pickedPackages / order.totalPackages) * 100}, 100`}
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </div>
                            <div className="flex flex-col justify-center">
                              <div className="text-[11px] font-bold text-[#0F172A] leading-none mb-1">{order.pickedPackages} <span className="text-[10px] font-medium text-[#64748B]">/ {order.totalPackages}</span></div>
                              <div className="text-[9px] font-bold uppercase tracking-wider text-[#94A3B8] leading-none">{order.pickedPackages === order.totalPackages ? 'Completed' : 'Picked'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          {renderAgeing(order.manifestDate)}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3">
                          <div className="text-xs font-semibold text-[#00A86B] hover:underline cursor-pointer" onClick={() => setDrawerOrder(order)}>{order.id}</div>
                          <div className="table-date mt-0.5">{order.date}</div>
                          <div className="mt-1"><span className="px-2 py-0.5 rounded-full border border-blue-200 text-blue-600 font-bold text-[9px] bg-blue-50/50">Custom</span></div>
                        </td>
                        <td className="p-3 text-xs font-normal">
                          <div className="relative group/prod cursor-pointer inline-block max-w-[170px]">
                            <div className="text-[#0F172A] truncate font-medium" title={getFullProductName(order.productName)}>
                              {order.productName}
                            </div>
                            <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/prod:block z-50 bg-[#0F172A] text-white text-[11px] font-normal px-2.5 py-1.5 rounded shadow-xl whitespace-nowrap pointer-events-none border border-slate-700">
                              {getFullProductName(order.productName)}
                              <div className="absolute left-4 top-full -mt-1 border-4 border-transparent border-t-[#0F172A]" />
                            </div>
                          </div>
                          <div className="text-[#64748B] mt-0.5">SKU: {order.sku}</div>
                          <div className="text-[#64748B]">QTY: {order.qty}</div>
                        </td>
                        <td className="p-3 text-xs font-normal text-[#64748B]">
                          <div className="text-[#0F172A] font-medium">Weight: {order.weight}</div>
                          <div className="mt-0.5">L*W*H: {order.dimensions}</div>
                          <div className="mt-0.5">Vol. Weight: {order.volWeight}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-[#0F172A]">₹ {order.payment}</div>
                          <div className="mt-1"><span className="px-2 py-0.5 rounded-full border border-blue-200 text-blue-600 font-bold text-[9px] bg-blue-50/50">{order.paymentType}</span></div>
                        </td>
                        <td className="p-3">
                          <div className="font-normal text-[13px] text-[#0F172A]">{order.customerName}</div>
                          <div className="font-normal text-[13px] text-[#64748B] mt-0.5">{order.customerPhone}</div>
                        </td>
                        <td className="p-3">
                          <div 
                            className="text-[#64748B] underline decoration-dotted underline-offset-2 hover:text-[#0F172A] transition-colors cursor-help inline-block"
                            onMouseEnter={(e) => {
                              setHoveredPickup({
                                id: order.awb,
                                rect: e.currentTarget.getBoundingClientRect(),
                                name: order.pickupName
                              });
                            }}
                            onMouseLeave={() => setHoveredPickup(null)}
                          >
                            {order.pickupName}
                          </div>
                        </td>
                        {activeTab !== 'New' && (
                          <td className="p-3">
                            <div className="text-xs font-semibold text-[#00A86B]">{order.courier}</div>
                            <div className="table-date mt-0.5">Booked On | {order.bookedDate}</div>
                            <div className="text-xs font-semibold text-[#00A86B] underline mt-0.5 hover:text-[#009B63] cursor-pointer">{order.awb}</div>
                          </td>
                        )}
                      </>
                    )}
                    <td className="p-3">
                      <span className={getStatusBadgeClass(activeTab === 'Pickup & Manifest' ? 'Pickup Scheduled' : activeTab === 'All' ? order.status : activeTab)}>
                        {activeTab === 'Pickup & Manifest' ? 'Pickup Scheduled' : activeTab === 'All' ? order.status : activeTab}
                      </span>
                    </td>
                    {activeTab !== 'New' && activeTab !== 'Pickup & Manifest' && activeTab !== 'Ready to Ship' && (
                      <td className="p-3 w-[150px] max-w-[150px]">
                        {trackingLoading[order.awb] && !trackingData[order.awb] ? (
                          <div className="flex items-center gap-2 text-[#94A3B8]">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span className="text-[10px] font-medium">Fetching…</span>
                          </div>
                        ) : trackingData[order.awb] && trackingData[order.awb].length > 0 ? (
                          <div 
                            className="text-left px-1.5 py-1 -mx-1.5 -my-1 cursor-help group/tracking"
                            onMouseEnter={(e) => {
                              const latest = trackingData[order.awb][0];
                              setHoveredTracking({
                                id: order.awb,
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
                              <div className="w-2 h-2 rounded-full bg-[#00A86B] shrink-0" />
                              <span className="font-semibold text-[#0F172A] text-[11px] truncate max-w-[120px]">{trackingData[order.awb][0].activity}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => fetchTracking(order.awb, order.status, order.manifestDate, order.courier)}
                              className="text-[10px] font-bold text-[#00A86B] hover:underline flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" /> Fetch
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                    <td className="p-3">
                      <div className="flex items-center gap-2 relative">
                        {activeTab === 'Pickup & Manifest' ? (
                          <>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setOpenActionId(openActionId === String(idx) ? null : String(idx)); }}
                              className="w-7 h-7 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] relative z-10"
                              title="More Actions"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                            
                            {openActionId === String(idx) && (
                              <div 
                                className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] border border-[#E2E8F0] py-2 z-[60]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button 
                                  onClick={() => {
                                    console.log('Downloading manifest for:', order.id);
                                    setOpenActionId(null);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                                >
                                  Download Manifest
                                </button>
                                <button 
                                  onClick={() => {
                                    console.log('Raising ticket for:', order.id);
                                    setOpenActionId(null);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                                >
                                  Raise a Ticket
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            {activeTab === 'New' && (
                              <button className="h-7 px-3 rounded-full bg-[#1e40af] text-white font-bold text-[10px] flex items-center gap-1.5 hover:bg-[#1e3a8a] shadow-sm z-0">
                                Ship <Send className="w-3 h-3" />
                              </button>
                            )}
                            <button 
                              onClick={(e) => { e.stopPropagation(); setOpenActionId(openActionId === String(idx) ? null : String(idx)); }}
                              className="w-7 h-7 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] relative z-10"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                            
                            {openActionId === String(idx) && (
                              <div 
                                className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-[#E2E8F0] py-2 z-[60]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {activeTab === 'Booked' ? (
                                  <>
                                    <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Download Label</button>
                                    <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Download Invoice</button>
                                    <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Download Manifest</button>
                                    <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Clone Order</button>
                                    <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#EF4444] hover:bg-red-50 transition-colors mt-1">Delete Order</button>
                                  </>
                                ) : (
                                  <>
                                    <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Download Invoice</button>
                                    <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Clone Order</button>
                                    <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Update Order</button>
                                    <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#EF4444] hover:bg-red-50 transition-colors mt-1">Delete Order</button>
                                  </>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedOrders.length === 0 && (
                  <tr>
                    <td colSpan={activeTab === 'Booked' ? 11 : 10} className="p-8 text-center text-[#64748B] font-medium">
                      No orders found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse min-w-full">
              <thead className="sticky top-0 z-40 bg-[#E6F5F1] shadow-sm">
                <tr className="text-xs font-medium text-[#00A86B] uppercase tracking-wider whitespace-nowrap">
                  <th className="px-2 py-3 w-10">
                    <input type="checkbox" checked={selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0} onChange={toggleAll} className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                  </th>
                  <th className="px-2 py-3">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 shrink-0"/>
                      <span>User</span>
                    </div>
                  </th>
                  <th className="px-2 py-3">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 shrink-0"/>
                      <span>Order</span>
                    </div>
                  </th>
                  <th className="px-2 py-3">
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 shrink-0"/>
                      <span>Product</span>
                    </div>
                  </th>
                  <th className="px-2 py-3">
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 shrink-0"/>
                      <span>Package</span>
                    </div>
                  </th>
                  <th className="px-2 py-3">
                    <div className="flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 shrink-0"/>
                      <span>Payment</span>
                    </div>
                  </th>
                  <th className="px-2 py-3">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 shrink-0"/>
                      <span>Customer</span>
                    </div>
                  </th>
                  <th className="px-2 py-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0"/>
                      <span>Pickup</span>
                    </div>
                  </th>
                  <th className="px-2 py-3">
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 shrink-0"/>
                      <span>Shipment</span>
                    </div>
                  </th>
                  <th className="px-2 py-3">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 shrink-0"/>
                      <span>Status</span>
                    </div>
                  </th>
                  <th className="px-2 py-3">
                    <div className="flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 shrink-0"/>
                      <span>Last Update</span>
                      {autoFetchEnabled && <span title="Auto-fetch enabled"><Zap className="w-3 h-3 text-amber-500 animate-pulse" /></span>}
                    </div>
                  </th>
                  <th className="px-2 py-3">
                    <div className="flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 shrink-0"/>
                      <span>Actions</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="text-[11px] text-[#475569]">
                {paginatedOrders.map((order, idx) => (
                  <tr key={order.awb} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors group">
                    <td className="px-2 py-3 align-top">
                      <input type="checkbox" checked={selectedOrders.includes(order.awb)} onChange={() => toggleSelect(order.awb)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                    </td>
                    <td className="px-2 py-3 align-top">
                      <div className="text-xs font-semibold text-[#00A86B] hover:underline cursor-pointer" onClick={() => setDrawerOrder(order)}>{order.id}</div>
                      <div className="text-sm font-semibold text-[#0F172A] mt-0.5">{order.userName}</div>
                      <div className="font-sans text-xs font-normal text-[#94A3B8]">{order.userEmail}</div>
                    </td>
                    <td className="px-2 py-3 align-top">
                      <div className="text-xs font-semibold text-[#00A86B] hover:underline cursor-pointer" onClick={() => setDrawerOrder(order)}>{order.id}</div>
                      <div className="text-[#64748B] mt-0.5 text-[11px]">{order.date}</div>
                      <div className="mt-1"><span className="px-2 py-0.5 rounded-full border border-blue-200 text-blue-600 font-bold text-[9px] bg-blue-50/50">Custom</span></div>
                    </td>
                    <td className="px-2 py-3 align-top text-xs font-normal">
                      <div className="relative group/prod cursor-pointer inline-block max-w-[170px]">
                        <div className="text-[#0F172A] truncate font-medium" title={getFullProductName(order.productName)}>
                          {order.productName}
                        </div>
                        <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/prod:block z-50 bg-[#0F172A] text-white text-[11px] font-normal px-2.5 py-1.5 rounded shadow-xl whitespace-nowrap pointer-events-none border border-slate-700">
                          {getFullProductName(order.productName)}
                          <div className="absolute left-4 top-full -mt-1 border-4 border-transparent border-t-[#0F172A]" />
                        </div>
                      </div>
                      <div className="text-[#64748B] mt-0.5">SKU: {order.sku}</div>
                      <div className="text-[#64748B]">QTY: {order.qty}</div>
                    </td>
                    <td className="px-2 py-3 align-top text-xs font-normal text-[#64748B]">
                      <div className="text-[#0F172A] font-medium">Weight: {order.weight}</div>
                      <div className="mt-0.5">L*W*H: {order.dimensions}</div>
                      <div className="mt-0.5">Vol. Weight: {order.volWeight}</div>
                    </td>
                    <td className="px-2 py-3 align-top">
                      <div className="font-semibold text-[#0F172A]">₹ {order.payment}</div>
                      <div className="mt-1"><span className="px-2 py-0.5 rounded-full border border-blue-200 text-blue-600 font-bold text-[9px] bg-blue-50/50">{order.paymentType}</span></div>
                    </td>
                    <td className="px-2 py-3 align-top">
                      <div className="font-normal text-[13px] text-[#0F172A]">{order.customerName}</div>
                      <div className="font-normal text-[13px] text-[#64748B] mt-0.5">{order.customerPhone}</div>
                    </td>
                    <td className="px-2 py-3 align-top">
                      <div 
                        className="text-[#64748B] underline decoration-dotted underline-offset-2 hover:text-[#0F172A] transition-colors cursor-help inline-block"
                        onMouseEnter={(e) => {
                          setHoveredPickup({
                            id: order.awb,
                            rect: e.currentTarget.getBoundingClientRect(),
                            name: order.pickupName
                          });
                        }}
                        onMouseLeave={() => setHoveredPickup(null)}
                      >
                        {order.pickupName}
                      </div>
                    </td>
                    <td className="px-2 py-3 align-top">
                      <div className="text-xs font-semibold text-[#00A86B]">{order.courier}</div>
                      <div className="text-[#64748B] mt-0.5 text-[11px]">Booked On | {order.bookedDate}</div>
                      <div className="text-xs font-semibold text-[#00A86B] underline mt-0.5 hover:text-[#009B63] cursor-pointer">{order.awb}</div>
                    </td>
                    <td className="px-2 py-3 align-top">
                      <span className={getStatusBadgeClass(order.status)}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-2 py-3 align-top w-[150px] max-w-[150px]">
                      {trackingLoading[order.awb] && !trackingData[order.awb] ? (
                        <div className="flex items-center gap-2 text-[#94A3B8]">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span className="text-[10px] font-medium">Fetching…</span>
                        </div>
                      ) : trackingData[order.awb] && trackingData[order.awb].length > 0 ? (
                        <div 
                          className="text-left px-1.5 py-1 -mx-1.5 -my-1 cursor-help group/tracking"
                          onMouseEnter={(e) => {
                            const latest = trackingData[order.awb][0];
                            setHoveredTracking({
                              id: order.awb,
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
                            <div className="w-2 h-2 rounded-full bg-[#00A86B] shrink-0" />
                            <span className="font-semibold text-[#0F172A] text-[11px] truncate max-w-[120px]">{trackingData[order.awb][0].activity}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => fetchTracking(order.awb, order.status, order.manifestDate, order.courier)}
                            className="text-[10px] font-bold text-[#00A86B] hover:underline flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" /> Fetch
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-3 align-top">
                      <div className="flex items-center gap-2 relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setOpenActionId(openActionId === String(idx) ? null : String(idx)); }}
                          className="w-7 h-7 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] relative z-10"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                        
                        {openActionId === String(idx) && (
                          <div 
                            className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-[#E2E8F0] py-2 z-[60]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Download Invoice</button>
                            <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Clone Order</button>
                            <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Update Order</button>
                            <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#EF4444] hover:bg-red-50 transition-colors mt-1">Delete Order</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedOrders.length === 0 && (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-[#64748B] font-medium">
                      No orders found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>      </div>
        
        {/* Pagination */}
        {totalPages > 0 && (
          <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between">
            <div className="text-xs text-[#64748B]">
              Showing <span className="font-bold text-[#0F172A]">{startIndex}</span> to <span className="font-bold text-[#0F172A]">{endIndex}</span> of <span className="font-bold text-[#0F172A]">{filteredOrders.length}</span> entries
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded text-xs font-medium flex items-center justify-center transition-colors ${
                    currentPage === i + 1 ? 'bg-[#00A86B] text-white border border-[#00A86B]' : 'border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Side Drawer */}
      {drawerOrder && (
        <div className="fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDrawerOrder(null)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white z-10 p-6 border-b border-[#E2E8F0] flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-[#0F172A]">Order #{drawerOrder.id}</h3>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold mt-1 inline-block bg-blue-50 text-blue-600`}>{drawerOrder.status}</span>
              </div>
              <button onClick={() => setDrawerOrder(null)} className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Detailed Mock Data Sections */}
              <div>
                <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wide mb-3">Customer Details</h4>
                <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-2">
                  <div className="flex justify-between"><span className="text-xs text-[#64748B]">Name</span><span className="text-xs font-bold text-[#0F172A]">{drawerOrder.customerName}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-[#64748B]">Phone</span><span className="text-xs font-bold text-[#0F172A]">{drawerOrder.customerPhone}</span></div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wide mb-3">Shipping Details</h4>
                <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-2">
                  <div className="flex justify-between"><span className="text-xs text-[#64748B]">Pickup Location</span><span className="text-xs font-bold text-[#0F172A]">{drawerOrder.pickupName}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-[#64748B]">AWB</span><span className="text-xs font-bold text-[#0F172A]">{drawerOrder.awb}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-[#64748B]">Courier Partner</span><span className="text-xs font-bold text-[#00A86B]">{drawerOrder.courier}</span></div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wide mb-3">Products</h4>
                <div className="border border-[#E2E8F0] rounded-xl p-3 flex gap-3 items-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-[#0F172A]">{drawerOrder.productName}</div>
                    <div className="text-[10px] text-[#64748B]">SKU: {drawerOrder.sku} | Qty: {drawerOrder.qty}</div>
                  </div>
                  <div className="text-xs font-bold text-[#0F172A]">₹{drawerOrder.payment}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Tooltip for Pickup Address */}
      {hoveredPickup && (
        <div 
          className="fixed z-[9999] pointer-events-none bg-[#0F172A] text-white text-[10px] p-3 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] transition-opacity animate-in fade-in zoom-in-95 duration-150 w-64"
          style={{
            top: hoveredPickup.rect.top - 10,
            left: hoveredPickup.rect.left + (hoveredPickup.rect.width / 2),
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="font-bold text-white mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#00A86B]" /> 
            {hoveredPickup.name}
          </div>
          <div className="text-slate-300 font-medium leading-relaxed border-t border-white/10 pt-1.5 mt-1.5">
            Shop No 14, Ground Floor, Main Market Road, Near City Center, {hoveredPickup.name.includes('Warehouse') ? hoveredPickup.name.split('–')[1]?.trim() || 'City' : 'New Delhi'}, 110001
          </div>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#0F172A]"></div>
        </div>
      )}

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
