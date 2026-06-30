import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { TrendingUp, TrendingDown, Package, IndianRupee, Truck, Users, Target, BarChart2, AlertTriangle, CheckCircle2 } from 'lucide-react';

const PERIODS = ['Today', 'This Week', 'This Month', 'Last Month', 'Last 3 Months'];

const MOCK_TOP_SELLERS = Array.from({ length: 8 }, (_, i) => ({
  rank: i + 1,
  name: ['Fashion Hub India', 'TechGadgets Store', 'HomeDecor Plus', 'Beauty Bazaar', 'Sports Arena', 'KidsWorld', 'BookShelf India', 'FoodieDelights'][i],
  orders: [4820, 3910, 3240, 2980, 2540, 2210, 1980, 1740][i],
  revenue: ['₹18.4L', '₹14.2L', '₹11.8L', '₹10.9L', '₹9.2L', '₹8.0L', '₹7.2L', '₹6.3L'][i],
  deliveryRate: [96.2, 94.8, 93.1, 91.4, 95.7, 92.3, 90.8, 94.1][i],
  score: [94, 91, 88, 85, 90, 87, 83, 89][i],
}));

const MOCK_COURIER_PERF = [
  { name: 'BlueDart', deliveryRate: 98.1, rtoRate: 1.9, ndrRate: 1.4, avgDays: 1.2, score: 97 },
  { name: 'Shadowfax', deliveryRate: 96.4, rtoRate: 3.6, ndrRate: 2.9, avgDays: 1.9, score: 93 },
  { name: 'Delhivery', deliveryRate: 94.2, rtoRate: 5.8, ndrRate: 4.1, avgDays: 2.3, score: 89 },
  { name: 'XpressBees', deliveryRate: 93.1, rtoRate: 6.9, ndrRate: 4.8, avgDays: 2.7, score: 86 },
  { name: 'Ekart', deliveryRate: 91.8, rtoRate: 8.2, ndrRate: 5.2, avgDays: 3.1, score: 82 },
  { name: 'DTDC', deliveryRate: 88.6, rtoRate: 11.4, ndrRate: 6.7, avgDays: 3.8, score: 74 },
];

export function CRMBusinessMetrics() {
  const [period, setPeriod] = useState('This Month');

  const kpis = [
    { label: 'Total Shipments', value: '2,84,192', change: '+12.4%', up: true, icon: Package, color: 'text-[#0F172A]' },
    { label: 'Platform Revenue', value: '₹4.2Cr', change: '+18.7%', up: true, icon: IndianRupee, color: 'text-green-500' },
    { label: 'Avg Delivery Rate', value: '93.7%', change: '+1.2%', up: true, icon: CheckCircle2, color: 'text-blue-500' },
    { label: 'Overall RTO Rate', value: '6.3%', change: '-0.8%', up: false, icon: TrendingDown, color: 'text-red-500' },
    { label: 'Active Sellers', value: '1,842', change: '+84', up: true, icon: Users, color: 'text-purple-500' },
    { label: 'NDR Resolved', value: '89.2%', change: '+3.1%', up: true, icon: Target, color: 'text-amber-500' },
    { label: 'COD Collected', value: '₹1.8Cr', change: '+9.4%', up: true, icon: IndianRupee, color: 'text-teal-500' },
    { label: 'Avg Freight/Order', value: '₹68.4', change: '-2.1%', up: false, icon: Truck, color: 'text-orange-500' },
  ];

  const zoneData = [
    { zone: 'Zone A (Local)', shipments: 68400, share: 24, deliveryRate: 97.2 },
    { zone: 'Zone B (Intra-State)', shipments: 84200, share: 30, deliveryRate: 95.4 },
    { zone: 'Zone C (Metro-Metro)', shipments: 56100, share: 20, deliveryRate: 93.8 },
    { zone: 'Zone D (Rest of India)', shipments: 47800, share: 17, deliveryRate: 90.1 },
    { zone: 'Zone E (Special)', shipments: 27692, share: 9, deliveryRate: 86.4 },
  ];

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#0F172A]">Business Metrics</h2>
            <span className="text-[10px] font-bold bg-[#00A86B]/10 text-[#00A86B] px-2 py-0.5 rounded-full">INTERNAL CRM</span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">Platform-wide business intelligence — revenue, delivery performance, seller health.</p>
        </div>
        <div className="flex gap-1 bg-white border border-[#E2E8F0] rounded-xl p-1 self-start">
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${period === p ? 'bg-[#00A86B] text-white' : 'text-[#64748B] hover:bg-[#F8FAFC]'}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#E2E8F0] p-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-[#64748B]">{kpi.label}</span>
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
            </div>
            <div className="text-xl font-bold text-[#0F172A]">{kpi.value}</div>
            <div className={`flex items-center gap-1 mt-1 text-[11px] font-semibold ${kpi.up ? 'text-green-500' : 'text-red-500'}`}>
              {kpi.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {kpi.change} vs last period
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Top Sellers */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#00A86B]" />
              <span className="text-sm font-bold text-[#0F172A]">Top Sellers by Volume</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs uppercase tracking-wider font-medium text-[#64748B]">
                  <th className="p-3 pl-4">#</th>
                  <th className="p-3">Seller</th>
                  <th className="p-3">Orders</th>
                  <th className="p-3">Revenue</th>
                  <th className="p-3">Del. Rate</th>
                  <th className="p-3">Score</th>
                </tr>
              </thead>
              <tbody className="text-xs text-[#475569]">
                {MOCK_TOP_SELLERS.map((s, i) => (
                  <tr key={i} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                    <td className="p-3 pl-4">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i < 3 ? 'bg-[#00A86B] text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`}>{s.rank}</span>
                    </td>
                    <td className="p-3 font-semibold text-[#0F172A] text-[11px]">{s.name}</td>
                    <td className="p-3 font-medium">{s.orders.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-[#00A86B] font-semibold">{s.revenue}</td>
                    <td className="p-3">
                      <span className={`font-bold text-[11px] ${s.deliveryRate >= 95 ? 'text-green-600' : s.deliveryRate >= 92 ? 'text-amber-600' : 'text-red-500'}`}>{s.deliveryRate}%</span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-[#F1F5F9] rounded-full">
                          <div className="h-full rounded-full bg-[#00A86B]" style={{ width: `${s.score}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-[#0F172A]">{s.score}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Courier Performance */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#00A86B]" />
              <span className="text-sm font-bold text-[#0F172A]">Courier Performance Scorecard</span>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {MOCK_COURIER_PERF.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-24 text-xs font-semibold text-[#0F172A] shrink-0">{c.name}</div>
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] text-[#64748B] mb-1">
                    <span>Score: <span className="font-bold text-[#0F172A]">{c.score}/100</span></span>
                    <span>Del: <span className={`font-bold ${c.deliveryRate >= 95 ? 'text-green-600' : c.deliveryRate >= 92 ? 'text-amber-600' : 'text-red-500'}`}>{c.deliveryRate}%</span></span>
                    <span>RTO: <span className={`font-bold ${c.rtoRate > 8 ? 'text-red-500' : c.rtoRate > 5 ? 'text-amber-600' : 'text-green-600'}`}>{c.rtoRate}%</span></span>
                  </div>
                  <div className="h-2 bg-[#F1F5F9] rounded-full">
                    <div className={`h-full rounded-full transition-all ${c.score >= 90 ? 'bg-green-500' : c.score >= 80 ? 'bg-amber-500' : 'bg-red-400'}`} style={{ width: `${c.score}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Zone Distribution */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#00A86B]" />
            <span className="text-sm font-bold text-[#0F172A]">Shipment Distribution by Zone</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs uppercase tracking-wider font-medium text-[#64748B]">
                <th className="p-3 pl-4">Zone</th>
                <th className="p-3">Shipments</th>
                <th className="p-3">Share</th>
                <th className="p-3">Delivery Rate</th>
                <th className="p-3">Distribution</th>
              </tr>
            </thead>
            <tbody className="text-xs text-[#475569]">
              {zoneData.map((z, i) => (
                <tr key={i} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                  <td className="p-3 pl-4 font-semibold text-[#0F172A]">{z.zone}</td>
                  <td className="p-3 font-medium">{z.shipments.toLocaleString('en-IN')}</td>
                  <td className="p-3 font-bold text-[#00A86B]">{z.share}%</td>
                  <td className="p-3">
                    <span className={`font-bold ${z.deliveryRate >= 95 ? 'text-green-600' : z.deliveryRate >= 91 ? 'text-amber-600' : 'text-red-500'}`}>{z.deliveryRate}%</span>
                  </td>
                  <td className="p-3 w-48">
                    <div className="h-2 bg-[#F1F5F9] rounded-full">
                      <div className="h-full rounded-full bg-[#00A86B]" style={{ width: `${z.share * 3}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
