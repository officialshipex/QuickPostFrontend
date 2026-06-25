import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import {
  Search, Filter, Download, Plus, ChevronDown, MoreHorizontal,
  Package, Truck, CheckCircle2, XCircle, RefreshCcw, Clock, Eye, Edit, Trash2,
  CreditCard, MapPin, Zap
} from 'lucide-react';
import { GlassDropdown } from '../components/ui/GlassDropdown';
import { GlassDateFilter } from '../components/ui/GlassDateFilter';

const MAIN_TABS = [
  { label: 'New', value: 'New' },
  { label: 'Booked', value: 'Booked' },
  { label: 'Pickup & Manifest', value: 'Picked Up' },
  { label: 'Ready to Ship', value: 'Processing' },
  { label: 'In Transit', value: 'In Transit' },
];

const MORE_TABS = [
  { label: 'Delivered', value: 'Delivered' },
  { label: 'Cancelled', value: 'Cancelled' },
  { label: 'RTO', value: 'RTO' },
];

const DUMMY_ORDERS = [
  { id: 'QP100245', customer: 'Rahul Sharma', mobile: '9876543210', product: 'Wireless Headphones', weight: '0.5 KG', courier: 'Delhivery', awb: 'DEL1234567890', status: 'Delivered', date: '12 Jun 2026', amount: '₹1,299', payMode: 'Prepaid', city: 'Mumbai' },
  { id: 'QP100246', customer: 'Priya Singh', mobile: '9765432109', product: 'Cotton Kurti Set', weight: '0.8 KG', courier: 'Bluedart', awb: 'BDT9876543210', status: 'In Transit', date: '12 Jun 2026', amount: '₹899', payMode: 'COD', city: 'Delhi' },
  { id: 'QP100247', customer: 'Amit Kumar', mobile: '9654321098', product: 'Stainless Steel Bottle', weight: '0.6 KG', courier: 'XpressBees', awb: 'XPB1122334455', status: 'Processing', date: '11 Jun 2026', amount: '₹599', payMode: 'Prepaid', city: 'Bangalore' },
  { id: 'QP100248', customer: 'Sneha Patel', mobile: '9543210987', product: 'Face Cream Bundle', weight: '0.3 KG', courier: 'Shadowfax', awb: 'SFX5566778899', status: 'New', date: '11 Jun 2026', amount: '₹1,499', payMode: 'COD', city: 'Ahmedabad' },
  { id: 'QP100249', customer: 'Vikram Nair', mobile: '9432109876', product: 'Laptop Stand', weight: '1.2 KG', courier: 'Delhivery', awb: 'DEL2233445566', status: 'Picked Up', date: '10 Jun 2026', amount: '₹2,199', payMode: 'Prepaid', city: 'Chennai' },
  { id: 'QP100250', customer: 'Anita Desai', mobile: '9321098765', product: 'Yoga Mat', weight: '1.5 KG', courier: 'Ekart', awb: 'EKT3344556677', status: 'RTO', date: '09 Jun 2026', amount: '₹799', payMode: 'COD', city: 'Pune' },
  { id: 'QP100251', customer: 'Ravi Mehta', mobile: '9210987654', product: 'Smart Watch', weight: '0.2 KG', courier: 'Bluedart', awb: 'BDT4455667788', status: 'Cancelled', date: '09 Jun 2026', amount: '₹3,499', payMode: 'Prepaid', city: 'Hyderabad' },
  { id: 'QP100252', customer: 'Meera Joshi', mobile: '9109876543', product: 'Ceramic Dinner Set', weight: '3.0 KG', courier: 'DTDC', awb: 'DTC5566778890', status: 'Delivered', date: '08 Jun 2026', amount: '₹1,899', payMode: 'COD', city: 'Kolkata' },
  { id: 'QP100253', customer: 'Arjun Reddy', mobile: '9098765432', product: 'Running Shoes', weight: '0.9 KG', courier: 'XpressBees', awb: 'XPB6677889901', status: 'In Transit', date: '08 Jun 2026', amount: '₹2,799', payMode: 'Prepaid', city: 'Surat' },
  { id: 'QP100254', customer: 'Divya Kapoor', mobile: '8987654321', product: 'Skincare Kit', weight: '0.4 KG', courier: 'Delhivery', awb: 'DEL7788990012', status: 'Delivered', date: '07 Jun 2026', amount: '₹1,099', payMode: 'COD', city: 'Jaipur' },
  { id: 'QP100255', customer: 'Suresh Rao', mobile: '8876543210', product: 'Electric Kettle', weight: '1.1 KG', courier: 'Shadowfax', awb: 'SFX8899001123', status: 'Processing', date: '07 Jun 2026', amount: '₹999', payMode: 'Prepaid', city: 'Lucknow' },
  { id: 'QP100256', customer: 'Kavitha Menon', mobile: '8765432109', product: 'Cotton Bedsheet', weight: '1.8 KG', courier: 'Ekart', awb: 'EKT9900112234', status: 'New', date: '06 Jun 2026', amount: '₹749', payMode: 'COD', city: 'Kochi' },
];

const STATUS_COLOR: Record<string, string> = {
  'New': 'bg-blue-100 text-blue-700',
  'Processing': 'bg-yellow-100 text-yellow-700',
  'Picked Up': 'bg-purple-100 text-purple-700',
  'In Transit': 'bg-orange-100 text-orange-700',
  'Delivered': 'bg-green-100 text-green-700',
  'Cancelled': 'bg-red-100 text-red-700',
  'RTO': 'bg-rose-100 text-rose-700',
};

// Dropdown options
const PAYMENT_TYPE_OPTIONS = [
  { label: 'Prepaid', value: 'Prepaid' },
  { label: 'COD', value: 'COD' },
  { label: 'Partial COD', value: 'Partial COD' },
];

const PICKUP_ADDRESS_OPTIONS = [
  { label: 'Warehouse – Mumbai', value: 'Mumbai' },
  { label: 'Warehouse – Delhi', value: 'Delhi' },
  { label: 'Warehouse – Bangalore', value: 'Bangalore' },
  { label: 'Warehouse – Chennai', value: 'Chennai' },
  { label: 'Warehouse – Hyderabad', value: 'Hyderabad' },
  { label: 'Warehouse – Kolkata', value: 'Kolkata' },
  { label: 'Warehouse – Pune', value: 'Pune' },
];

const COURIER_OPTIONS = [
  { label: 'Delhivery', value: 'Delhivery' },
  { label: 'Bluedart', value: 'Bluedart' },
  { label: 'XpressBees', value: 'XpressBees' },
  { label: 'Shadowfax', value: 'Shadowfax' },
  { label: 'Ekart', value: 'Ekart' },
  { label: 'DTDC', value: 'DTDC' },
];

const ACTION_OPTIONS = [
  { label: 'Download CSV', value: 'download_csv' },
  { label: 'Download Labels', value: 'download_labels' },
  { label: 'Download Invoices', value: 'download_invoices' },
  { label: 'Bulk Cancel', value: 'bulk_cancel' },
  { label: 'Assign Courier', value: 'assign_courier' },
  { label: 'Print Manifest', value: 'print_manifest' },
];

const PAGE_SIZE = 8;

export function Orders() {
  const [activeTab, setActiveTab] = useState('New');
  const [search, setSearch] = useState('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState((window as any).__globalSearchQuery?.toLowerCase() || '');
  const [page, setPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showMore, setShowMore] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Glass dropdown filter states
  const [selectedPaymentTypes, setSelectedPaymentTypes] = useState<string[]>([]);
  const [selectedPickupAddresses, setSelectedPickupAddresses] = useState<string[]>([]);
  const [selectedCouriers, setSelectedCouriers] = useState<string[]>([]);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);

  // Date filter state
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMore(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    
    const handleGlobalSearch = (e: Event) => {
      setGlobalSearchQuery(((e as CustomEvent).detail || '').toLowerCase());
    };
    window.addEventListener('global-search', handleGlobalSearch);
    setGlobalSearchQuery(((window as any).__globalSearchQuery || '').toLowerCase());

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('global-search', handleGlobalSearch);
    };
  }, []);

  const filtered = useMemo(() => {
    return DUMMY_ORDERS.filter(o => {
      const matchGlobal = globalSearchQuery ?
        o.id.toLowerCase().includes(globalSearchQuery) || 
        o.awb.toLowerCase().includes(globalSearchQuery) || 
        o.customer.toLowerCase().includes(globalSearchQuery) ||
        o.mobile.includes(globalSearchQuery) : true;

      const matchTab = globalSearchQuery ? true : (activeTab === 'All' || o.status === activeTab);
      const matchSearch = !search || o.id.toLowerCase().includes(search.toLowerCase()) || o.customer.toLowerCase().includes(search.toLowerCase()) || o.awb.toLowerCase().includes(search.toLowerCase()) || o.mobile.includes(search);
      const matchPayment = selectedPaymentTypes.length === 0 || selectedPaymentTypes.includes(o.payMode);
      const matchCourier = selectedCouriers.length === 0 || selectedCouriers.includes(o.courier);
      return matchGlobal && matchTab && matchSearch && matchPayment && matchCourier;
    });
  }, [activeTab, search, selectedPaymentTypes, selectedCouriers, globalSearchQuery]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleRow = (id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRows.size === paginated.length) setSelectedRows(new Set());
    else setSelectedRows(new Set(paginated.map(r => r.id)));
  };

  const handleApplyFilters = () => {
    // Reset to page 1 when filters are applied
    setPage(1);
  };

  const handleClearAllFilters = () => {
    setSelectedPaymentTypes([]);
    setSelectedPickupAddresses([]);
    setSelectedCouriers([]);
    setDateStart('');
    setDateEnd('');
    setPage(1);
  };

  const hasActiveFilters = selectedPaymentTypes.length > 0 || selectedPickupAddresses.length > 0 || selectedCouriers.length > 0 || (dateStart && dateEnd);

  const headerTabs = (
    <div className="flex items-center gap-6 overflow-x-auto no-scrollbar h-full">
      {MAIN_TABS.map(tab => {
        const isActive = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => { setActiveTab(tab.value); setPage(1); }}
            className={`h-full text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              isActive
                ? 'border-[#00A86B] text-[#00A86B]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {tab.label}
          </button>
        );
      })}

      {/* More Dropdown */}
      <div className="relative h-full flex items-center" ref={moreMenuRef}>
        <button
          onClick={() => setShowMore(!showMore)}
          className={`flex items-center gap-1 h-full text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
            MORE_TABS.some(t => t.value === activeTab)
              ? 'border-[#00A86B] text-[#00A86B]'
              : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          More <ChevronDown className="w-3.5 h-3.5" />
        </button>

        {showMore && (
          <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-[#E2E8F0] overflow-hidden z-50">
            {MORE_TABS.map(tab => {
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => { setActiveTab(tab.value); setPage(1); setShowMore(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-[#F8FAFC] transition-colors ${
                    isActive ? 'text-[#00A86B] bg-[#00A86B]/5' : 'text-[#475569]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout headerLeft={headerTabs}>
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm mt-2 relative z-50">
        {/* Toolbar */}
        <div className="p-4 flex flex-wrap items-center gap-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-full px-4 h-9 min-w-[200px] flex-1">
            <input
              type="text"
              placeholder="Search orders..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="bg-transparent text-xs text-[#0F172A] outline-none placeholder:text-[#94A3B8] w-full"
            />
          </div>


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
            placeholder="Search warehouse..."
            icon={<MapPin className="w-3.5 h-3.5" />}
          />

          {/* Glass Dropdown – Courier */}
          <GlassDropdown
            label="Courier"
            options={COURIER_OPTIONS}
            selected={selectedCouriers}
            onChange={setSelectedCouriers}
            placeholder="Search courier..."
            icon={<Truck className="w-3.5 h-3.5" />}
          />

          {/* Glass Date Filter */}
          <GlassDateFilter
            align="right"
            startDate={dateStart}
            endDate={dateEnd}
            onDateChange={(s, e) => { setDateStart(s); setDateEnd(e); }}
          />

          <button
            onClick={handleApplyFilters}
            className="flex items-center gap-1.5 px-4 h-9 rounded-full bg-[#00A86B] text-white text-xs font-semibold hover:bg-[#009B63] shadow-sm whitespace-nowrap"
          >
            Apply Filters
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleClearAllFilters}
              className="flex items-center gap-1.5 px-3 h-9 rounded-full border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 whitespace-nowrap transition-colors"
            >
              Clear All
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">
            {/* Glass Dropdown – Action */}
            <GlassDropdown
              label="Action"
              options={ACTION_OPTIONS}
              selected={selectedActions}
              onChange={setSelectedActions}
              placeholder="Search actions..."
              icon={<Zap className="w-3.5 h-3.5" />}
            />
            <button className="flex items-center justify-center w-9 h-9 rounded-full bg-[#00A86B] text-white hover:bg-[#009B63] shadow-sm">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-[#F8FAFC] text-xs font-semibold text-[#475569]">
                <th className="p-4 w-10">
                  <input type="checkbox" className="accent-[#00A86B]" checked={selectedRows.size === paginated.length && paginated.length > 0} onChange={toggleAll} />
                </th>
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Product</th>
                <th className="p-4">AWB</th>
                <th className="p-4">Courier</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Pay Mode</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-16 text-sm text-[#94A3B8]">No orders found.</td></tr>
              ) : paginated.map((order) => (
                <tr key={order.id} className="border-t border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors text-xs">
                  <td className="p-4">
                    <input type="checkbox" className="accent-[#00A86B]" checked={selectedRows.has(order.id)} onChange={() => toggleRow(order.id)} />
                  </td>
                  <td className="p-4 font-bold text-[#00A86B]">{order.id}</td>
                  <td className="p-4">
                    <div className="font-semibold text-[#0F172A]">{order.customer}</div>
                    <div className="text-[#64748B]">{order.mobile}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-[#0F172A]">{order.product}</div>
                    <div className="text-[#64748B]">{order.weight}</div>
                  </td>
                  <td className="p-4 font-mono text-[#475569]">{order.awb}</td>
                  <td className="p-4 font-medium text-[#0F172A]">{order.courier}</td>
                  <td className="p-4 font-bold text-[#0F172A]">{order.amount}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${order.payMode === 'COD' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                      {order.payMode}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-700'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 table-date">{order.date}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button className="w-7 h-7 rounded-full hover:bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#00A86B]" title="View"><Eye className="w-3.5 h-3.5" /></button>
                      <button className="w-7 h-7 rounded-full hover:bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-blue-500" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0]">
          <span className="text-xs text-[#64748B]">Showing {Math.min((page-1)*PAGE_SIZE+1, filtered.length)}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length} orders</span>
          <div className="flex items-center gap-1">
            <button disabled={page<=1} onClick={() => setPage(p => p-1)} className="px-3 h-7 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-40">Prev</button>
            {Array.from({length: totalPages}, (_, i) => i+1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded text-xs font-medium ${p===page ? 'bg-[#00A86B] text-white' : 'border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'}`}>{p}</button>
            ))}
            <button disabled={page>=totalPages} onClick={() => setPage(p => p+1)} className="px-3 h-7 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
