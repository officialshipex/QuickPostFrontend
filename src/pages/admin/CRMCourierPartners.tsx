import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Search, Truck, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  'Active': 'bg-green-50 text-green-600',
  'Inactive': 'bg-gray-100 text-gray-500',
  'Under Review': 'bg-amber-50 text-amber-700',
};

const MOCK_COURIERS = [
  { id: 'COU001', name: 'Delhivery', type: 'Surface + Air', zones: 'Pan India', status: 'Active', deliveryRate: 94.2, avgDays: 2.3, ndrRate: 4.1, rtoRate: 5.8, activeAWBs: 12400, totalAWBs: 284000, slaBreaches: 12, weightCap: '10 kg', contact: 'ops@delhivery.com', rm: 'Rahul M.' },
  { id: 'COU002', name: 'Ekart', type: 'Surface', zones: 'Pan India', status: 'Active', deliveryRate: 91.8, avgDays: 3.1, ndrRate: 5.2, rtoRate: 8.2, activeAWBs: 8900, totalAWBs: 196000, slaBreaches: 28, weightCap: '5 kg', contact: 'ops@ekart.com', rm: 'Priya S.' },
  { id: 'COU003', name: 'XpressBees', type: 'Surface + Air', zones: 'Pan India', status: 'Active', deliveryRate: 93.1, avgDays: 2.7, ndrRate: 4.8, rtoRate: 6.9, activeAWBs: 6200, totalAWBs: 142000, slaBreaches: 9, weightCap: '30 kg', contact: 'ops@xpressbees.com', rm: 'Amit K.' },
  { id: 'COU004', name: 'Shadowfax', type: 'Surface', zones: 'Tier 1 & 2', status: 'Active', deliveryRate: 96.4, avgDays: 1.9, ndrRate: 2.9, rtoRate: 3.6, activeAWBs: 4100, totalAWBs: 89000, slaBreaches: 3, weightCap: '3 kg', contact: 'ops@shadowfax.in', rm: 'Neha V.' },
  { id: 'COU005', name: 'DTDC', type: 'Surface + Air', zones: 'Pan India', status: 'Active', deliveryRate: 88.6, avgDays: 3.8, ndrRate: 6.7, rtoRate: 11.4, activeAWBs: 3400, totalAWBs: 78000, slaBreaches: 41, weightCap: '50 kg', contact: 'ops@dtdc.com', rm: 'Rahul M.' },
  { id: 'COU006', name: 'BlueDart', type: 'Air + Express', zones: 'Pan India', status: 'Active', deliveryRate: 98.1, avgDays: 1.2, ndrRate: 1.4, rtoRate: 1.9, activeAWBs: 2100, totalAWBs: 54000, slaBreaches: 1, weightCap: '100 kg', contact: 'ops@bluedart.com', rm: 'Priya S.' },
  { id: 'COU007', name: 'Ecom Express', type: 'Surface', zones: 'Pan India', status: 'Under Review', deliveryRate: 85.2, avgDays: 4.2, ndrRate: 8.1, rtoRate: 14.8, activeAWBs: 1800, totalAWBs: 41000, slaBreaches: 67, weightCap: '10 kg', contact: 'ops@ecomexpress.in', rm: 'Amit K.' },
  { id: 'COU008', name: 'Smartr', type: 'Surface', zones: 'Select States', status: 'Inactive', deliveryRate: 82.0, avgDays: 4.9, ndrRate: 9.3, rtoRate: 18.0, activeAWBs: 0, totalAWBs: 12000, slaBreaches: 0, weightCap: '5 kg', contact: 'ops@smartr.in', rm: 'Neha V.' },
];

export function CRMCourierPartners() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = MOCK_COURIERS.filter(c => {
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const avgDelivery = (MOCK_COURIERS.reduce((a, c) => a + c.deliveryRate, 0) / MOCK_COURIERS.length).toFixed(1);
  const avgRTO = (MOCK_COURIERS.reduce((a, c) => a + c.rtoRate, 0) / MOCK_COURIERS.length).toFixed(1);
  const totalActive = MOCK_COURIERS.reduce((a, c) => a + c.activeAWBs, 0);

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#0F172A]">Courier Partners</h2>
            <span className="text-[10px] font-bold bg-[#00A86B]/10 text-[#00A86B] px-2 py-0.5 rounded-full">INTERNAL CRM</span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">Monitor courier partner performance, SLAs, delivery rates and account health.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Active Partners', value: MOCK_COURIERS.filter(c => c.status === 'Active').length, sub: 'of ' + MOCK_COURIERS.length + ' total', icon: Truck, color: 'text-[#0F172A]', bg: 'bg-white' },
          { label: 'Avg Delivery Rate', value: `${avgDelivery}%`, sub: 'across all couriers', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-white' },
          { label: 'Avg RTO Rate', value: `${avgRTO}%`, sub: 'return to origin', icon: TrendingDown, color: 'text-red-500', bg: 'bg-white' },
          { label: 'Active AWBs', value: totalActive.toLocaleString('en-IN'), sub: 'in transit right now', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-white' },
        ].map((card, i) => (
          <div key={i} className={`${card.bg} rounded-xl border border-[#E2E8F0] p-4 hover:shadow-md transition-all`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#64748B]">{card.label}</span>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div className="text-2xl font-bold text-[#0F172A]">{card.value}</div>
            <div className="text-[10px] text-[#94A3B8] mt-0.5">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E2E8F0] flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input type="text" placeholder="Search courier..." value={search} onChange={e => setSearch(e.target.value)} className="w-full h-9 pl-9 pr-4 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]" />
          </div>
          {['All', 'Active', 'Inactive', 'Under Review'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === s ? 'bg-[#00A86B] text-white' : 'border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'}`}>{s}</button>
          ))}
          <span className="text-xs text-[#64748B] ml-auto">{filtered.length} partners</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs uppercase tracking-wider font-medium text-[#64748B]">
                <th className="p-3 pl-4">Courier</th>
                <th className="p-3">Type</th>
                <th className="p-3">Coverage</th>
                <th className="p-3">Status</th>
                <th className="p-3">Delivery Rate</th>
                <th className="p-3">Avg Days</th>
                <th className="p-3">NDR Rate</th>
                <th className="p-3">RTO Rate</th>
                <th className="p-3">Active AWBs</th>
                <th className="p-3">SLA Breaches</th>
                <th className="p-3">Weight Cap</th>
                <th className="p-3">RM</th>
              </tr>
            </thead>
            <tbody className="text-xs text-[#475569]">
              {filtered.map((c, i) => (
                <tr key={i} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors cursor-pointer">
                  <td className="p-3 pl-4">
                    <div className="font-bold text-[#0F172A]">{c.name}</div>
                    <div className="text-[10px] text-[#94A3B8]">{c.id}</div>
                  </td>
                  <td className="p-3 text-[#64748B]">{c.type}</td>
                  <td className="p-3">{c.zones}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLES[c.status]}`}>{c.status}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 bg-[#F1F5F9] rounded-full w-16">
                        <div className="h-full rounded-full bg-green-500" style={{ width: `${c.deliveryRate}%` }} />
                      </div>
                      <span className={`font-bold text-[11px] ${c.deliveryRate >= 93 ? 'text-green-600' : c.deliveryRate >= 88 ? 'text-amber-600' : 'text-red-500'}`}>{c.deliveryRate}%</span>
                    </div>
                  </td>
                  <td className="p-3 font-medium text-[#0F172A]">{c.avgDays}d</td>
                  <td className="p-3">
                    <span className={`font-bold ${c.ndrRate > 6 ? 'text-red-500' : c.ndrRate > 4 ? 'text-amber-600' : 'text-green-600'}`}>{c.ndrRate}%</span>
                  </td>
                  <td className="p-3">
                    <span className={`font-bold ${c.rtoRate > 10 ? 'text-red-500' : c.rtoRate > 6 ? 'text-amber-600' : 'text-green-600'}`}>{c.rtoRate}%</span>
                  </td>
                  <td className="p-3 font-semibold text-[#0F172A]">{c.activeAWBs.toLocaleString('en-IN')}</td>
                  <td className="p-3">
                    <span className={`font-bold ${c.slaBreaches > 30 ? 'text-red-500' : c.slaBreaches > 10 ? 'text-amber-600' : 'text-green-600'}`}>{c.slaBreaches}</span>
                  </td>
                  <td className="p-3 text-[#64748B]">{c.weightCap}</td>
                  <td className="p-3 text-[#64748B]">{c.rm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
