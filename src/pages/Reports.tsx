import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Download, BarChart2, TrendingUp, Package, Truck, RefreshCcw, Calendar, ChevronDown, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const SHIPMENT_DATA = [
  { month: 'Jan', delivered: 520, rto: 42, undelivered: 18 },
  { month: 'Feb', delivered: 610, rto: 38, undelivered: 22 },
  { month: 'Mar', delivered: 740, rto: 55, undelivered: 30 },
  { month: 'Apr', delivered: 680, rto: 48, undelivered: 25 },
  { month: 'May', delivered: 820, rto: 62, undelivered: 35 },
  { month: 'Jun', delivered: 768, rto: 48, undelivered: 28 },
];

const REVENUE_DATA = [
  { month: 'Jan', charges: 18000, cod: 42000 },
  { month: 'Feb', charges: 22000, cod: 58000 },
  { month: 'Mar', charges: 28000, cod: 71000 },
  { month: 'Apr', charges: 24500, cod: 65000 },
  { month: 'May', charges: 31000, cod: 82000 },
  { month: 'Jun', charges: 28000, cod: 74000 },
];

const ZONE_DATA = [
  { name: 'Zone A', value: 12 },
  { name: 'Zone B', value: 28 },
  { name: 'Zone C', value: 22 },
  { name: 'Zone D', value: 18 },
  { name: 'Zone E', value: 20 },
];
const ZONE_COLORS = ['#00A86B', '#007BFF', '#F59E0B', '#EF4444', '#8B5CF6'];

const REPORTS_LIST = [
  { name: 'Shipment Summary Report', desc: 'Complete overview of all shipments', date: '12 Jun 2026', type: 'CSV' },
  { name: 'COD Settlement Report', desc: 'All COD remittance details', date: '11 Jun 2026', type: 'Excel' },
  { name: 'NDR Analysis Report', desc: 'Non-delivery reasons breakdown', date: '10 Jun 2026', type: 'PDF' },
  { name: 'Weight Discrepancy Report', desc: 'All weight dispute records', date: '09 Jun 2026', type: 'CSV' },
  { name: 'Performance Report', desc: 'Courier-wise delivery performance', date: '08 Jun 2026', type: 'Excel' },
  { name: 'Zone-wise Shipment Report', desc: 'Shipments by delivery zone', date: '07 Jun 2026', type: 'CSV' },
];

export function Reports() {
  const [dateRange, setDateRange] = useState('Last 30 days');

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Reports & Analytics</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Comprehensive shipping performance insights</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-4 h-9 rounded-full border border-[#E2E8F0] bg-white text-xs font-semibold text-[#475569] cursor-pointer hover:bg-[#F8FAFC]">
            <Calendar className="w-3.5 h-3.5" /> Last 6 months <ChevronDown className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Shipments', value: '4,138', change: '+12%', positive: true, icon: Package },
          { label: 'Delivered', value: '3,138', change: '+8%', positive: true, icon: Truck },
          { label: 'Delivery Rate', value: '86.4%', change: '+2.1%', positive: true, icon: TrendingUp },
          { label: 'RTO Rate', value: '7.2%', change: '-0.8%', positive: true, icon: RefreshCcw },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
            <div className="flex justify-between items-start mb-3">
              <div className="text-xs text-[#64748B] font-medium">{kpi.label}</div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${kpi.positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{kpi.change}</span>
            </div>
            <div className="text-2xl font-bold text-[#0F172A]">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Shipment Trend */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
          <div className="font-bold text-sm text-[#0F172A] mb-4">Shipment Trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={SHIPMENT_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
              <Bar dataKey="delivered" fill="#00A86B" radius={[4, 4, 0, 0]} name="Delivered" />
              <Bar dataKey="rto" fill="#EF4444" radius={[4, 4, 0, 0]} name="RTO" />
              <Bar dataKey="undelivered" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Undelivered" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Trend */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
          <div className="font-bold text-sm text-[#0F172A] mb-4">Revenue Trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={REVENUE_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }} formatter={(v: any) => `₹${Number(v).toLocaleString()}`} />
              <Line type="monotone" dataKey="charges" stroke="#007BFF" strokeWidth={2} dot={false} name="Charges" />
              <Line type="monotone" dataKey="cod" stroke="#00A86B" strokeWidth={2} dot={false} name="COD" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Zone Distribution */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
          <div className="font-bold text-sm text-[#0F172A] mb-4">Zone-wise Shipments</div>
          <div className="flex items-center justify-between">
            <ResponsiveContainer width="55%" height={160}>
              <PieChart>
                <Pie data={ZONE_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {ZONE_DATA.map((_, i) => <Cell key={i} fill={ZONE_COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1 pl-4">
              {ZONE_DATA.map((z, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ZONE_COLORS[i] }}></div>
                    <span className="text-xs text-[#475569] font-medium">{z.name}</span>
                  </div>
                  <span className="text-xs font-bold text-[#0F172A]">{z.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Courier Performance */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
          <div className="font-bold text-sm text-[#0F172A] mb-4">Courier Performance</div>
          <div className="space-y-3">
            {[
              { courier: 'Delhivery', deliveryRate: 88, rto: 8, color: '#111827' },
              { courier: 'Bluedart', deliveryRate: 92, rto: 5, color: '#3B82F6' },
              { courier: 'XpressBees', deliveryRate: 84, rto: 10, color: '#10B981' },
              { courier: 'Shadowfax', deliveryRate: 86, rto: 9, color: '#F97316' },
              { courier: 'Ekart', deliveryRate: 82, rto: 12, color: '#F59E0B' },
            ].map((c, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold" style={{ backgroundColor: c.color }}>{c.courier[0]}</div>
                    <span className="text-xs font-semibold text-[#0F172A]">{c.courier}</span>
                  </div>
                  <span className="text-xs font-bold text-[#00A86B]">{c.deliveryRate}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full">
                  <div className="h-full bg-[#00A86B] rounded-full transition-all" style={{ width: `${c.deliveryRate}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Downloadable Reports */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E2E8F0]">
          <h3 className="font-bold text-sm text-[#0F172A]">Downloadable Reports</h3>
        </div>
        <div className="divide-y divide-[#E2E8F0]">
          {REPORTS_LIST.map((r, i) => (
            <div key={i} className="p-4 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#64748B]" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#0F172A]">{r.name}</div>
                  <div className="text-xs text-[#64748B]">{r.desc} · {r.date}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${r.type === 'PDF' ? 'bg-red-100 text-red-700' : r.type === 'Excel' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{r.type}</span>
                <button className="flex items-center gap-1.5 px-3 h-8 rounded-full border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:border-[#00A86B] hover:text-[#00A86B] transition-all">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
