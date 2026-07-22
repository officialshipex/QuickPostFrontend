import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Search, Truck, CheckCircle2, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

const STATUS_STYLES: Record<string, string> = {
  'Active': 'bg-green-50 text-green-600',
  'Inactive': 'bg-gray-100 text-gray-500',
  'Under Review': 'bg-amber-50 text-amber-700',
};

export function CRMCourierPartners() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [allPartners, setAllPartners] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalPartners: 0, avgDeliveryRate: '0.0', avgRtoRate: '0.0', totalActiveAWBs: 0 });
  const [loading, setLoading] = useState(false);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/crm/courier-partners');
      setAllPartners(res.data.partners || []);
      if (res.data.summary) setSummary(res.data.summary);
    } catch {
      setAllPartners([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPartners(); }, []);

  const filtered = allPartners.filter(c => {
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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
          { label: 'Active Partners', value: loading ? '—' : summary.totalPartners, sub: 'Total couriers on platform', icon: Truck, color: 'text-[#0F172A]' },
          { label: 'Avg Delivery Rate', value: loading ? '—' : `${summary.avgDeliveryRate}%`, sub: 'across all couriers', icon: CheckCircle2, color: 'text-green-500' },
          { label: 'Avg RTO Rate', value: loading ? '—' : `${summary.avgRtoRate}%`, sub: 'return to origin', icon: TrendingDown, color: 'text-red-500' },
          { label: 'Active AWBs', value: loading ? '—' : summary.totalActiveAWBs.toLocaleString('en-IN'), sub: 'in transit right now', icon: TrendingUp, color: 'text-blue-500' },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#E2E8F0] p-4 hover:shadow-md transition-all">
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
          <span className="text-xs text-[#64748B] ml-auto flex items-center gap-2">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00A86B]" />}
            {filtered.length} partners
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-green-50 border-b border-[#E2E8F0] text-xs uppercase tracking-wider font-medium text-[#475569]">
                <th className="py-2 px-3">Courier</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Coverage</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Delivery Rate</th>
                <th className="py-2 px-3">Avg Days</th>
                <th className="py-2 px-3">NDR Rate</th>
                <th className="py-2 px-3">RTO Rate</th>
                <th className="py-2 px-3">Active AWBs</th>
                <th className="py-2 px-3">SLA Breaches</th>
                <th className="py-2 px-3">Weight Cap</th>
                <th className="py-2 px-3">RM</th>
              </tr>
            </thead>
            <tbody className="text-xs text-[#475569]">
              {filtered.map((c, i) => (
                <tr key={i} className={`border-b border-[#E2E8F0] transition-colors cursor-pointer ${i % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]'}`}>
                  <td className="p-3 pl-4">
                    <div className="font-bold text-[#0F172A]">{c.name}</div>
                    <div className="text-[10px] text-[#94A3B8]">{c.id}</div>
                  </td>
                  <td className="p-3 text-[#64748B]">{c.type || '—'}</td>
                  <td className="p-3">{c.zones || 'Pan India'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLES[c.status] || 'bg-gray-100 text-gray-500'}`}>{c.status}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 bg-[#F1F5F9] rounded-full w-16">
                        <div className="h-full rounded-full bg-green-500" style={{ width: `${Math.min(c.deliveryRate, 100)}%` }} />
                      </div>
                      <span className={`font-bold text-[11px] ${c.deliveryRate >= 93 ? 'text-green-600' : c.deliveryRate >= 88 ? 'text-amber-600' : 'text-red-500'}`}>{c.deliveryRate}%</span>
                    </div>
                  </td>
                  <td className="p-3 font-medium text-[#0F172A]">{c.avgDays ? `${c.avgDays}d` : '—'}</td>
                  <td className="p-3">
                    <span className={`font-bold ${c.ndrRate > 6 ? 'text-red-500' : c.ndrRate > 4 ? 'text-amber-600' : 'text-green-600'}`}>{c.ndrRate}%</span>
                  </td>
                  <td className="p-3">
                    <span className={`font-bold ${c.rtoRate > 10 ? 'text-red-500' : c.rtoRate > 6 ? 'text-amber-600' : 'text-green-600'}`}>{c.rtoRate}%</span>
                  </td>
                  <td className="p-3 font-semibold text-[#0F172A]">{c.activeAWBs.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-[#64748B]">{c.total ? c.total.toLocaleString('en-IN') : '—'}</td>
                  <td className="p-3 text-[#64748B]">{c.weightCap || '—'}</td>
                  <td className="p-3 text-[#64748B]">{c.rm || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
