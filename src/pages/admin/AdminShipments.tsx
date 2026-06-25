import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Search, Filter, ChevronDown, ChevronLeft, ChevronRight, MapPin, Truck, Clock, CheckCircle2, RotateCcw, AlertTriangle, Package, Eye } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  'Picked Up': 'bg-blue-50 text-blue-600',
  'In Transit': 'bg-purple-50 text-purple-600',
  'Out for Delivery': 'bg-amber-50 text-amber-600',
  'Delivered': 'bg-green-50 text-green-600',
  'RTO Initiated': 'bg-red-50 text-red-600',
  'RTO Delivered': 'bg-rose-50 text-rose-600',
  'NDR': 'bg-orange-50 text-orange-600',
  'Lost': 'bg-gray-100 text-gray-600',
};

const MOCK_SHIPMENTS = Array.from({ length: 20 }, (_, i) => ({
  id: `SHP${String(500000 + i).padStart(7, '0')}`,
  orderId: `QP${String(100000 + i).padStart(6, '0')}`,
  awb: `AWB${String(9000000 + i * 37).padStart(10, '0')}`,
  courier: ['Delhivery', 'Ekart', 'XpressBees', 'Shadowfax', 'DTDC'][i % 5],
  courierLogo: ['/brands/delhivery.png', '/brands/ekart.png', '/brands/xpressbees.png', '/brands/shadowfax.png', '/brands/dtdc.png'][i % 5],
  seller: ['SuperMart Pvt Ltd', 'Fashion Hub', 'ElectroWorld', 'Beauty Basics', 'Home Essentials'][i % 5],
  customer: ['Rajesh Kumar', 'Priya Sharma', 'Ankit Verma', 'Sneha Patel', 'Vikram Singh'][i % 5],
  origin: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai'][i % 5],
  destination: ['Pune', 'Noida', 'Mysore', 'Vizag', 'Coimbatore'][i % 5],
  weight: `${((i % 5) + 0.5).toFixed(1)} kg`,
  status: ['Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'RTO Initiated', 'RTO Delivered', 'NDR', 'Lost'][i % 8],
  eta: `Jun ${15 + (i % 5)}, 2026`,
  date: `2026-06-${String(10 + (i % 5)).padStart(2, '0')}`,
  zone: ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E'][i % 5],
}));

export function AdminShipments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const statuses = ['All', 'In Transit', 'Delivered', 'RTO Initiated', 'NDR', 'Out for Delivery'];
  const filtered = MOCK_SHIPMENTS.filter(s =>
    (activeFilter === 'All' || s.status === activeFilter) &&
    (searchQuery === '' || s.awb.toLowerCase().includes(searchQuery.toLowerCase()) || s.customer.toLowerCase().includes(searchQuery.toLowerCase()) || s.orderId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A]">Platform Shipments</h2>
          <p className="text-xs text-[#64748B] mt-1">Track and manage all shipments across couriers.</p>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        {[
          { label: 'Total', value: '18.9L', icon: Package, color: 'text-[#0F172A]' },
          { label: 'Picked Up', value: '2.1L', icon: MapPin, color: 'text-blue-500' },
          { label: 'In Transit', value: '3.2L', icon: Truck, color: 'text-purple-500' },
          { label: 'Out for Delivery', value: '84k', icon: Clock, color: 'text-amber-500' },
          { label: 'Delivered', value: '14.1L', icon: CheckCircle2, color: 'text-green-500' },
          { label: 'RTO', value: '1.2L', icon: RotateCcw, color: 'text-red-500' },
          { label: 'NDR', value: '2.5L', icon: AlertTriangle, color: 'text-orange-500' },
          { label: 'Lost', value: '840', icon: AlertTriangle, color: 'text-gray-400' },
        ].map((card, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-[#E2E8F0] p-3 hover:shadow-md transition-all cursor-pointer">
            <card.icon className={`w-4 h-4 ${card.color} mb-2`} />
            <div className="text-lg font-bold text-[#0F172A]">{card.value}</div>
            <div className="text-[10px] font-semibold text-[#64748B]">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Filters Row */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="flex gap-1 overflow-x-auto pb-1 flex-1">
          {statuses.map(s => (
            <button key={s} onClick={() => setActiveFilter(s)} className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeFilter === s ? 'bg-[#00A86B] text-white' : 'text-[#64748B] hover:bg-[#F1F5F9]'}`}>{s}</button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input type="text" placeholder="Search AWB, Order ID, Customer..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full h-10 pl-9 pr-4 rounded-lg border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] uppercase tracking-wider font-bold text-[#64748B]">
                <th className="p-4">AWB</th>
                <th className="p-4">Order ID</th>
                <th className="p-4">Courier</th>
                <th className="p-4">Seller</th>
                <th className="p-4">Route</th>
                <th className="p-4">Weight</th>
                <th className="p-4">Status</th>
                <th className="p-4">ETA</th>
                <th className="p-4">Zone</th>
              </tr>
            </thead>
            <tbody className="text-xs font-medium text-[#475569]">
              {filtered.map(shipment => (
                <tr key={shipment.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors cursor-pointer">
                  <td className="p-4 font-bold text-[#00A86B]">{shipment.awb}</td>
                  <td className="p-4 text-[#0F172A]">{shipment.orderId}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full border border-[#E2E8F0] bg-white flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                        <img src={shipment.courierLogo} alt={shipment.courier} className="max-w-full max-h-full object-contain" />
                      </div>
                      <span>{shipment.courier}</span>
                    </div>
                  </td>
                  <td className="p-4">{shipment.seller}</td>
                  <td className="p-4">
                    <div className="text-[10px]">{shipment.origin} → {shipment.destination}</div>
                  </td>
                  <td className="p-4">{shipment.weight}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${STATUS_COLORS[shipment.status] || 'bg-gray-100 text-gray-500'}`}>{shipment.status}</span>
                  </td>
                  <td className="p-4 text-[#64748B]">{shipment.eta}</td>
                  <td className="p-4">{shipment.zone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center p-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
          <span className="text-xs text-[#64748B]">Showing {filtered.length} shipments</span>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-white"><ChevronLeft className="w-4 h-4" /></button>
            <button className="w-8 h-8 rounded-lg bg-[#00A86B] text-white text-xs font-bold">1</button>
            <button className="w-8 h-8 rounded-lg border border-[#E2E8F0] text-[#64748B] text-xs font-bold hover:bg-white">2</button>
            <button className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-white"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
