import React, { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import {
  Search, Download, RefreshCw, ChevronLeft, ChevronRight,
  Filter, Truck, RotateCcw, CheckCircle2, AlertTriangle, Clock, Package
} from 'lucide-react';

const COURIERS = ['All Couriers', 'Delhivery', 'Ekart', 'XpressBees', 'Shadowfax', 'DTDC', 'BlueDart', 'Ecom Express'];
const STATUSES = ['All Statuses', 'Booked', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'RTO Initiated', 'RTO Delivered', 'Lost'];
const CHANNELS = ['All Channels', 'Shopify', 'WooCommerce', 'Manual', 'API', 'Wix', 'Amazon'];
const ORDER_TYPES = ['All Types', 'Prepaid', 'COD'];
const VENDORS = ['All Vendors', 'Vendor A', 'Vendor B', 'Vendor C'];

const STATUS_STYLES: Record<string, string> = {
  'Booked': 'bg-gray-100 text-gray-600',
  'Picked Up': 'bg-blue-50 text-blue-600',
  'In Transit': 'bg-purple-50 text-purple-600',
  'Out for Delivery': 'bg-amber-50 text-amber-700',
  'Delivered': 'bg-green-50 text-green-600',
  'RTO Initiated': 'bg-red-50 text-red-600',
  'RTO Delivered': 'bg-rose-50 text-rose-600',
  'Lost': 'bg-gray-100 text-gray-500',
};

const MOCK_DATA = Array.from({ length: 15 }, (_, i) => ({
  awb: `QP${String(900000000 + i * 1337).padStart(10, '0')}`,
  orderId: `ORD${String(100000 + i).padStart(6, '0')}`,
  orderType: i % 3 === 0 ? 'COD' : 'Prepaid',
  courier: ['Delhivery', 'Ekart', 'XpressBees', 'Shadowfax', 'DTDC'][i % 5],
  channel: ['Shopify', 'WooCommerce', 'Manual', 'API', 'Wix'][i % 5],
  seller: `Seller ${String.fromCharCode(65 + (i % 8))}`,
  companyId: `COMP${1000 + (i % 8)}`,
  pickupAddr: ['Mumbai, MH', 'Delhi, DL', 'Bangalore, KA', 'Hyderabad, TS', 'Chennai, TN'][i % 5],
  shippingAddr: ['Pune, MH', 'Noida, UP', 'Mysore, KA', 'Vizag, AP', 'Coimbatore, TN'][i % 5],
  rtoAddr: ['Mumbai, MH', 'Delhi, DL', 'Bangalore, KA', 'Hyderabad, TS', 'Chennai, TN'][i % 5],
  assignedDate: `2026-06-${String(10 + (i % 8)).padStart(2, '0')}`,
  reassignDate: i % 4 === 0 ? `2026-06-${String(12 + (i % 5)).padStart(2, '0')}` : '—',
  paymentMode: i % 3 === 0 ? 'COD' : 'Prepaid',
  shipmentValue: `₹${((i + 1) * 349 + 200).toLocaleString('en-IN')}`,
  freightCharges: `₹${((i % 5) * 15 + 45)}`,
  status: STATUSES.filter(s => s !== 'All Statuses')[i % (STATUSES.length - 1)],
}));

export function CRMShipmentListing() {
  const [courier, setCourier] = useState('All Couriers');
  const [status, setStatus] = useState('All Statuses');
  const [channel, setChannel] = useState('All Channels');
  const [orderType, setOrderType] = useState('All Types');
  const [userDetails, setUserDetails] = useState('');
  const [orderId, setOrderId] = useState('');
  const [forwardAwb, setForwardAwb] = useState('');
  const [rtoAwb, setRtoAwb] = useState('');
  const [lastmileAwb, setLastmileAwb] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = MOCK_DATA.filter(r => {
    if (courier !== 'All Couriers' && r.courier !== courier) return false;
    if (status !== 'All Statuses' && r.status !== status) return false;
    if (channel !== 'All Channels' && r.channel !== channel) return false;
    if (orderType !== 'All Types' && r.orderType !== orderType) return false;
    if (userDetails && !r.companyId.toLowerCase().includes(userDetails.toLowerCase())) return false;
    if (orderId && !r.orderId.toLowerCase().includes(orderId.toLowerCase())) return false;
    if (forwardAwb && !r.awb.toLowerCase().includes(forwardAwb.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const stats = [
    { label: 'Total AWBs', value: MOCK_DATA.length, icon: Package, color: 'text-[#0F172A]' },
    { label: 'In Transit', value: MOCK_DATA.filter(d => d.status === 'In Transit').length, icon: Truck, color: 'text-purple-500' },
    { label: 'Delivered', value: MOCK_DATA.filter(d => d.status === 'Delivered').length, icon: CheckCircle2, color: 'text-green-500' },
    { label: 'RTO', value: MOCK_DATA.filter(d => d.status.startsWith('RTO')).length, icon: RotateCcw, color: 'text-red-500' },
    { label: 'NDR / OFD', value: MOCK_DATA.filter(d => d.status === 'Out for Delivery').length, icon: AlertTriangle, color: 'text-amber-500' },
    { label: 'Pending', value: MOCK_DATA.filter(d => d.status === 'Booked' || d.status === 'Picked Up').length, icon: Clock, color: 'text-blue-500' },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
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
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#00A86B] text-white text-xs font-semibold hover:bg-[#009960] transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-5">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#E2E8F0] p-3 hover:shadow-md transition-all">
            <s.icon className={`w-4 h-4 ${s.color} mb-1.5`} />
            <div className="text-lg font-bold text-[#0F172A]">{s.value}</div>
            <div className="text-[10px] font-semibold text-[#64748B]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters Panel */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-[#64748B]" />
          <span className="text-xs font-bold text-[#0F172A]">Advanced Filters</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-x-4 gap-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Date From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] transition-all bg-white" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Date To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] transition-all bg-white" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">User Details</label>
            <input type="text" placeholder="Search user..." value={userDetails} onChange={e => setUserDetails(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] transition-all bg-white" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Order ID</label>
            <input type="text" placeholder="Search order..." value={orderId} onChange={e => setOrderId(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] transition-all bg-white" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Forward AWB</label>
            <input type="text" placeholder="Search FWD AWB..." value={forwardAwb} onChange={e => setForwardAwb(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] transition-all bg-white" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">RTO AWB</label>
            <input type="text" placeholder="Search RTO AWB..." value={rtoAwb} onChange={e => setRtoAwb(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] transition-all bg-white" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Last Mile AWB</label>
            <input type="text" placeholder="Search LM AWB..." value={lastmileAwb} onChange={e => setLastmileAwb(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] transition-all bg-white" />
          </div>
          {[
            { label: 'Status', value: status, set: setStatus, opts: STATUSES },
            { label: 'Courier', value: courier, set: setCourier, opts: COURIERS },
            { label: 'Channel', value: channel, set: setChannel, opts: CHANNELS },
            { label: 'Order Type', value: orderType, set: setOrderType, opts: ORDER_TYPES },
          ].map(({ label, value, set, opts }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">{label}</label>
              <select value={value} onChange={e => set(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] transition-all">
                {opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div className="col-span-2 md:col-span-1 flex items-end justify-end h-full pb-0">
            <button className="h-9 px-6 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm focus:ring-2 focus:ring-[#00A86B]/20 focus:outline-none w-full">
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E2E8F0] flex justify-end">
          <span className="text-xs text-[#64748B] font-medium">{filtered.length} records found</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] uppercase tracking-wider font-bold text-[#64748B]">
                <th className="p-3 pl-4">AWB ID</th>
                <th className="p-3">Order ID</th>
                <th className="p-3">Order Type</th>
                <th className="p-3">Courier</th>
                <th className="p-3">Channel</th>
                <th className="p-3">Pickup Address</th>
                <th className="p-3">Shipping Address</th>
                <th className="p-3">RTO Address</th>
                <th className="p-3">Assigned Date</th>
                <th className="p-3">Courier Reassign</th>
                <th className="p-3">Payment Mode</th>
                <th className="p-3">Shipment Value</th>
                <th className="p-3">Freight</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="text-xs text-[#475569]">
              {paginated.map((row, i) => (
                <tr key={i} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors cursor-pointer">
                  <td className="p-3 pl-4 font-bold text-[#00A86B] font-mono text-[11px]">{row.awb}</td>
                  <td className="p-3 font-semibold text-[#0F172A]">{row.orderId}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.orderType === 'COD' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-600'}`}>{row.orderType}</span>
                  </td>
                  <td className="p-3 font-medium">{row.courier}</td>
                  <td className="p-3 text-[#64748B]">{row.channel}</td>
                  <td className="p-3 text-[11px]">{row.pickupAddr}</td>
                  <td className="p-3 text-[11px]">{row.shippingAddr}</td>
                  <td className="p-3 text-[11px]">{row.rtoAddr}</td>
                  <td className="p-3 table-date">{row.assignedDate}</td>
                  <td className="p-3 table-date">{row.reassignDate}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.paymentMode === 'COD' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-600'}`}>{row.paymentMode}</span>
                  </td>
                  <td className="p-3 font-semibold text-[#0F172A]">{row.shipmentValue}</td>
                  <td className="p-3 text-[#64748B]">{row.freightCharges}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${STATUS_STYLES[row.status] || 'bg-gray-100 text-gray-500'}`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center px-4 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
          <span className="text-xs text-[#64748B]">Page {page} of {totalPages || 1}</span>
          <div className="flex gap-1 items-center">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-white disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-bold ${page === p ? 'bg-[#00A86B] text-white' : 'border border-[#E2E8F0] text-[#64748B] hover:bg-white'}`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-white disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
