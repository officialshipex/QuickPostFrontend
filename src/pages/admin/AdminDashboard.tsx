import React from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { RefreshCcw, Package, DollarSign, Users, CreditCard, ShoppingCart, Clock, AlertTriangle, HelpCircle, CheckCircle2, RotateCcw, ShieldAlert, Truck, FileText, ArrowRight, IndianRupee, PieChart as PieChartIcon, Percent } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

/* ── COMPONENTS ── */
function StatCardWithTrend({ title, value, trend, isUp, isPrimary = false, icon: Icon }: any) {
  if (isPrimary) {
    return (
      <div className="bg-gradient-to-br from-[#00A86B] to-[#007047] rounded-xl p-4 text-white shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
          <div className="text-[12px] font-semibold opacity-90">{title}</div>
          {Icon && <Icon className="w-4 h-4 opacity-80" />}
        </div>
        <div>
          <div className="text-2xl font-bold mb-1">{value}</div>
          <div className="flex items-center gap-1 text-[10px] font-medium opacity-90">
            {isUp ? '↑' : '↓'} {trend}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <div className="text-[12px] font-semibold text-[#64748B]">{title}</div>
        {Icon && <Icon className="w-4 h-4 text-[#94A3B8]" />}
      </div>
      <div>
        <div className="text-2xl font-bold text-[#0F172A] mb-1">{value}</div>
        <div className={`flex items-center gap-1 text-[10px] font-medium ${isUp ? 'text-green-600' : 'text-red-500'}`}>
          {isUp ? '↑' : '↓'} {trend}
        </div>
      </div>
    </div>
  );
}

function MiniStatCard({ title, value, icon: Icon, iconColor, iconBg }: any) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm flex items-center justify-between">
      <div>
        <div className="text-[11px] font-semibold text-[#64748B] mb-1">{title}</div>
        <div className="text-xl font-bold text-[#0F172A]">{value}</div>
      </div>
      {Icon && (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      )}
    </div>
  );
}

function SectionHeading({ title, rightText }: any) {
  return (
    <div className="flex justify-between items-center mt-6 mb-3">
      <h3 className="text-[13px] font-bold text-[#0F172A]">{title}</h3>
      {rightText && <span className="text-[11px] font-medium text-[#94A3B8]">{rightText}</span>}
    </div>
  );
}

/* ── CHART DATA ── */
const courierSplitData = [
  { name: 'Delivery', value: 54, color: '#00A86B' },
  { name: 'Ekart', value: 121, color: '#1D4ED8' },
  { name: 'Maruti', value: 43, color: '#38BDF8' },
  { name: 'Dtdc', value: 32, color: '#F59E0B' },
  { name: 'Bluedart', value: 87, color: '#8B5CF6' },
  { name: 'Shadowfax', value: 9, color: '#F43F5E' },
];

const paymentModeData = [
  { name: 'Prepaid', value: 72, color: '#1D4ED8' },
  { name: 'COD', value: 49, color: '#00A86B' },
];

const weightSplitData = [
  { name: '0kg to 0.5kg', value: 54, color: '#00A86B' },
  { name: '0.5kg to 1kg', value: 121, color: '#1D4ED8' },
  { name: '1kg to 2kg', value: 32, color: '#F59E0B' },
  { name: '2kg to 5kg', value: 87, color: '#8B5CF6' },
  { name: '5kg to 10kg', value: 9, color: '#F43F5E' },
  { name: '> 10kg', value: 43, color: '#38BDF8' },
];

const zoneData = [
  { name: 'Zone A', value: 3.63, color: '#F43F5E' },
  { name: 'Zone B', value: 9.84, color: '#8B5CF6' },
  { name: 'Zone C', value: 11.92, color: '#00A86B' },
  { name: 'Zone D', value: 69.43, color: '#1D4ED8' },
  { name: 'Zone E', value: 5.16, color: '#F59E0B' },
];

/* ── MAIN COMPONENT ── */
export function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto text-[#0F172A] pb-10">
        
        {/* Header Note */}
        <div className="flex items-center gap-2 mb-4 text-[11px] font-medium text-[#64748B]">
          Note : Showing data below from 17th Mar-16th Apr.
          <RefreshCcw className="w-3 h-3 cursor-pointer hover:text-[#0F172A]" />
        </div>

        {/* Row 1: Top Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <StatCardWithTrend title="Total Orders" value="302" trend="0.8% vs last week" isUp={false} isPrimary={true} icon={CheckCircle2} />
          <StatCardWithTrend title="Total Orders Value" value="₹23,000" trend="0.8% vs last week" isUp={false} icon={IndianRupee} />
          <StatCardWithTrend title="Total Revenue" value="₹1,240" trend="0.8% vs last week" isUp={true} icon={IndianRupee} />
          <StatCardWithTrend title="Avg. Ship Cost" value="₹202" trend="0.8% vs last week" isUp={true} icon={Truck} />
          <StatCardWithTrend title="Delivery %" value="94.5%" trend="1.2% vs last week" isUp={true} icon={Percent} />
          <StatCardWithTrend title="New users" value="23" trend="0.8% vs last week" isUp={false} icon={Users} />
        </div>

        {/* Row 2: Action Needed */}
        <SectionHeading title="Action Needed" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MiniStatCard title="Pickup Delays" value="14" icon={Clock} iconColor="text-amber-500" iconBg="bg-amber-50" />
          <MiniStatCard title="Delayed Deliveries" value="21" icon={AlertTriangle} iconColor="text-rose-500" iconBg="bg-rose-50" />
          <MiniStatCard title="Weight Disputes" value="34" icon={ShieldAlert} iconColor="text-purple-500" iconBg="bg-purple-50" />
          <MiniStatCard title="Pending KYC/Docs" value="8" icon={FileText} iconColor="text-blue-500" iconBg="bg-blue-50" />
          <MiniStatCard title="Low Balance Sellers" value="12" icon={CreditCard} iconColor="text-red-500" iconBg="bg-red-50" />
          <MiniStatCard title="Pending NDR" value="45" icon={RotateCcw} iconColor="text-indigo-500" iconBg="bg-indigo-50" />
        </div>

        {/* Row 3: Shipments Details */}
        <SectionHeading title="Shipments Details" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <MiniStatCard title="Total Shipments" value="302" icon={Package} iconColor="text-blue-500" iconBg="bg-blue-50" />
          <MiniStatCard title="Pending Pickups" value="34" icon={ShoppingCart} iconColor="text-purple-500" iconBg="bg-purple-50" />
          <MiniStatCard title="In-Transit" value="111" icon={RefreshCcw} iconColor="text-amber-500" iconBg="bg-amber-50" />
          <MiniStatCard title="Out For Delivery" value="14" icon={Users} iconColor="text-emerald-500" iconBg="bg-emerald-50" />
          <MiniStatCard title="Delivered" value="34" icon={Clock} iconColor="text-purple-400" iconBg="bg-purple-50" />
          <MiniStatCard title="Un-Delivered" value="34" icon={AlertTriangle} iconColor="text-rose-500" iconBg="bg-rose-50" />
          <MiniStatCard title="RTO In-Transit" value="14" icon={CheckCircle2} iconColor="text-emerald-500" iconBg="bg-emerald-50" />
        </div>

        {/* Row 4: NDR Details */}
        <SectionHeading title="NDR Details" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <MiniStatCard title="Total NDR" value="302" icon={AlertTriangle} iconColor="text-blue-400" iconBg="bg-blue-50" />
          <MiniStatCard title="Action Required" value="302" icon={FileText} iconColor="text-purple-500" iconBg="bg-purple-50" />
          <MiniStatCard title="Action Requested" value="302" icon={Package} iconColor="text-amber-500" iconBg="bg-amber-50" />
          <MiniStatCard title="Delivered" value="302" icon={CheckCircle2} iconColor="text-emerald-500" iconBg="bg-emerald-50" />
          <MiniStatCard title="RTO Delivered" value="23" icon={RotateCcw} iconColor="text-indigo-500" iconBg="bg-indigo-50" />
        </div>

        {/* Row 5: Weight Discrepancy Details */}
        <SectionHeading title="Weight Discrepancy Details" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStatCard title="Total Discrepancy" value="302" icon={AlertTriangle} iconColor="text-teal-500" iconBg="bg-teal-50" />
          <MiniStatCard title="New Discrepancy" value="302" icon={FileText} iconColor="text-amber-500" iconBg="bg-amber-50" />
          <MiniStatCard title="Accepted Discrepancy" value="302" icon={Package} iconColor="text-blue-500" iconBg="bg-blue-50" />
          <MiniStatCard title="Discrepancy Raised" value="302" icon={AlertTriangle} iconColor="text-rose-500" iconBg="bg-rose-50" />
        </div>

        {/* Row 6: COD Status */}
        <SectionHeading title="COD Status" rightText="Last 30 days" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStatCard title="Total COD" value="₹1,240" icon={FileText} iconColor="text-purple-500" iconBg="bg-purple-50" />
          <MiniStatCard title="Last COD Remitted" value="₹1,240" icon={RefreshCcw} iconColor="text-emerald-500" iconBg="bg-emerald-50" />
          <MiniStatCard title="COD Imitated" value="₹1,240" icon={FileText} iconColor="text-sky-500" iconBg="bg-sky-50" />
          <MiniStatCard title="COD To Be Remitted" value="₹1,240" icon={Clock} iconColor="text-rose-400" iconBg="bg-rose-50" />
        </div>

        {/* Row 7: Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-6">
          {/* Couriers Split */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm">
            <h4 className="text-[12px] font-bold mb-4">Couriers Split</h4>
            <div className="flex flex-col gap-3">
              {courierSplitData.map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: d.color }}></div>
                  <div className="w-20 text-[10px] font-semibold text-[#475569]">{d.name}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(d.value / 121) * 100}%`, backgroundColor: d.color }}></div>
                  </div>
                  <div className="w-6 text-right text-[10px] font-bold" style={{ color: d.color }}>{d.value.toString().padStart(2, '0')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Mode */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm flex flex-col">
            <h4 className="text-[12px] font-bold mb-4">Payment Mode</h4>
            <div className="flex-1 flex items-center justify-center gap-8">
              <div className="w-32 h-32 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentModeData} cx="50%" cy="50%" innerRadius={40} outerRadius={55} dataKey="value" stroke="none" style={{ outline: 'none' }}>
                      {paymentModeData.map((d, i) => <Cell key={i} fill={d.color} style={{ outline: 'none' }} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '10px', padding: '4px 8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-4">
                {paymentModeData.map((d, i) => (
                  <div key={i}>
                    <div className="text-[11px] font-bold" style={{ color: d.color }}>{d.name}</div>
                    <div className="text-[11px] font-bold text-[#64748B] mt-0.5 border-b border-gray-200 pb-1">{d.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pickup & Delivery Performance */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm flex flex-col">
            <h4 className="text-[12px] font-bold mb-4">Pickup & Delivery Performance</h4>
            <div className="flex-1 grid grid-cols-2 gap-px bg-[#E2E8F0] border border-[#E2E8F0] rounded-lg overflow-hidden">
              <div className="bg-white p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600"><CheckCircle2 className="w-4 h-4" /></div>
                <div>
                  <div className="text-sm font-bold text-[#0F172A]">1,234</div>
                  <div className="text-[10px] font-semibold text-[#64748B]">On Time Pickups</div>
                </div>
              </div>
              <div className="bg-white p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600"><CheckCircle2 className="w-4 h-4" /></div>
                <div>
                  <div className="text-sm font-bold text-[#0F172A]">1,234</div>
                  <div className="text-[10px] font-semibold text-[#64748B]">On Time Deliveries</div>
                </div>
              </div>
              <div className="bg-white p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500"><Clock className="w-4 h-4" /></div>
                <div>
                  <div className="text-sm font-bold text-[#0F172A]">1,234</div>
                  <div className="text-[10px] font-semibold text-[#64748B]">Late Pickups</div>
                </div>
              </div>
              <div className="bg-white p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500"><Clock className="w-4 h-4" /></div>
                <div>
                  <div className="text-sm font-bold text-[#0F172A]">1,234</div>
                  <div className="text-[10px] font-semibold text-[#64748B]">Late Deliveries</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 8: Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">
          {/* Shipments Zone Distribution */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm flex flex-col">
            <h4 className="text-[12px] font-bold mb-4">Shipments</h4>
            <div className="flex-1 flex items-center justify-between gap-2">
              <div className="w-24 h-24 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={zoneData} cx="50%" cy="50%" innerRadius={28} outerRadius={42} dataKey="value" stroke="none" style={{ outline: 'none' }}>
                      {zoneData.map((d, i) => <Cell key={i} fill={d.color} style={{ outline: 'none' }} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '10px', padding: '4px 8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-[8px] font-semibold text-[#64748B]">Zone</div>
                  <div className="text-[8px] font-semibold text-[#64748B]">Distribution</div>
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-1 pl-4">
                {zoneData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px]">
                    <div className="font-semibold" style={{ color: d.color }}>{d.name}</div>
                    <div className="font-bold text-[#0F172A]">{d.value}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Shipment Split by Weight */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm">
            <h4 className="text-[12px] font-bold mb-4">Shipment Split by Weight</h4>
            <div className="flex flex-col gap-2.5">
              {weightSplitData.map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: d.color }}></div>
                  <div className="w-[70px] text-[10px] font-semibold text-[#475569] truncate">{d.name}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(d.value / 121) * 100}%`, backgroundColor: d.color }}></div>
                  </div>
                  <div className="w-6 text-right text-[10px] font-bold" style={{ color: d.color }}>{d.value.toString().padStart(2, '0')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivered vs RTO vs Undelivered */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm flex flex-col justify-between">
            <h4 className="text-[12px] font-bold mb-4">Delivered vs RTO vs Undelivered</h4>
            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <div className="text-[10px] font-semibold text-[#64748B] mb-1">Delivered</div>
                <div className="text-xl font-bold text-[#0F172A]">12</div>
                <div className="text-[10px] font-semibold text-[#64748B] mt-1">0%</div>
              </div>
              <div className="text-[10px] text-[#94A3B8] font-medium">vs</div>
              <div className="text-center">
                <div className="text-[10px] font-semibold text-[#64748B] mb-1">RTO</div>
                <div className="text-xl font-bold text-[#0F172A]">12</div>
                <div className="text-[10px] font-semibold text-[#64748B] mt-1">0%</div>
              </div>
              <div className="text-[10px] text-[#94A3B8] font-medium">vs</div>
              <div className="text-center">
                <div className="text-[10px] font-semibold text-[#64748B] mb-1">Undelivered</div>
                <div className="text-xl font-bold text-[#0F172A]">12</div>
                <div className="text-[10px] font-semibold text-[#64748B] mt-1">0%</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-1 bg-[#1D4ED8] rounded-l-full w-[40%]"></div>
              <div className="h-1 bg-[#00A86B] w-[30%]"></div>
              <div className="h-1 bg-[#F1F5F9] rounded-r-full flex-1"></div>
              <span className="text-[10px] font-bold text-[#1D4ED8] ml-2">121</span>
            </div>
          </div>
        </div>

        {/* Top Performing Sellers */}
        <h3 className="text-[13px] font-bold text-[#0F172A] mt-6 mb-3">Top Performing Sellers</h3>
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden overflow-x-auto mb-6">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[9px] uppercase tracking-wider font-bold text-[#475569]">
                <th className="p-3 pl-4">Seller Details</th>
                <th className="p-3 text-center">Total Orders</th>
                <th className="p-3 text-center">Revenue / GMV</th>
                <th className="p-3 text-center">Shipping Cost</th>
                <th className="p-3 text-center">COD Remitted</th>
                <th className="p-3 text-center">RTO Rate</th>
                <th className="p-3 text-center">Wallet Balance</th>
                <th className="p-3 text-center">Tier Status</th>
              </tr>
            </thead>
            <tbody className="text-[10px] font-semibold text-[#475569]">
              {[
                { name: 'HL ARC Studio', email: 'studios.arc@gmail.com', avatar: 'HA', orders: '1,420', revenue: '₹12,45,600.00', shipCost: '₹1,54,320.00', cod: '₹8,92,400.00', rto: '1.2%', balance: '₹71,234.82', tier: 'Elite', color: 'text-purple-600 bg-purple-50 border-purple-200' },
                { name: 'Vogue Boutique', email: 'contact@vogueboutique.in', avatar: 'VB', orders: '982', revenue: '₹8,12,400.00', shipCost: '₹98,240.00', cod: '₹5,12,000.00', rto: '2.1%', balance: '₹12,890.50', tier: 'Gold', color: 'text-amber-600 bg-amber-50 border-amber-200' },
                { name: 'Gadget Galaxy', email: 'sales@gadgetgalaxy.com', avatar: 'GG', orders: '840', revenue: '₹24,50,000.00', shipCost: '₹1,12,000.00', cod: '₹14,20,000.00', rto: '0.8%', balance: '₹45,600.00', tier: 'Elite', color: 'text-purple-600 bg-purple-50 border-purple-200' },
                { name: 'The Shoe Club', email: 'shoes@shoeclub.co', avatar: 'SC', orders: '612', revenue: '₹4,90,200.00', shipCost: '₹62,120.00', cod: '₹3,45,000.00', rto: '4.5%', balance: '₹3,420.15', tier: 'Silver', color: 'text-slate-600 bg-slate-50 border-slate-200' },
                { name: 'Orchard Fresh', email: 'orders@orchardfresh.in', avatar: 'OF', orders: '530', revenue: '₹3,82,900.00', shipCost: '₹42,300.00', cod: '₹1,12,500.00', rto: '1.5%', balance: '₹18,245.90', tier: 'Gold', color: 'text-amber-600 bg-amber-50 border-amber-200' }
              ].map((s, i) => (
                <tr key={i} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                  <td className="p-3 pl-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#E6F5F1] text-[#00A86B] flex items-center justify-center shrink-0 font-bold text-xs border border-[#00A86B]/20">
                      {s.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-[#0F172A] text-[14px] leading-tight">{s.name}</div>
                      <div className="text-[10px] text-[#94A3B8] font-medium mt-0.5">{s.email}</div>
                    </div>
                  </td>
                  <td className="p-3 text-center text-[#0F172A] font-normal text-[14px]">{s.orders}</td>
                  <td className="p-3 text-center text-emerald-600 font-normal text-[14px]">{s.revenue}</td>
                  <td className="p-3 text-center text-[#0F172A] font-normal text-[14px]">{s.shipCost}</td>
                  <td className="p-3 text-center text-[#0F172A] font-normal text-[14px]">{s.cod}</td>
                  <td className="p-3 text-center text-red-500 font-normal text-[14px]">{s.rto}</td>
                  <td className="p-3 text-center font-normal text-[#00A86B] text-[14px]">{s.balance}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${s.color}`}>
                      {s.tier}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Row 9: Couriers Summary */}
        <h3 className="text-[13px] font-bold text-[#0F172A] mt-6 mb-3">Couriers Summary</h3>
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-[#F0FDF4] border-b border-[#E2E8F0] text-[9px] uppercase tracking-wider font-bold text-[#166534]">
                <th className="p-3 pl-4">Courier</th>
                <th className="p-3 text-center">Shipment Count</th>
                <th className="p-3 text-center">COD</th>
                <th className="p-3 text-center">Prepaid</th>
                <th className="p-3 text-center">Delivered</th>
                <th className="p-3 text-center">NDR Delivered</th>
                <th className="p-3 text-center">NDR Raised</th>
                <th className="p-3 text-center">RTO Initiated</th>
                <th className="p-3 text-center">Lost/Damaged</th>
                <th className="p-3 text-center">Zone A</th>
                <th className="p-3 text-center">Zone B</th>
                <th className="p-3 text-center">Zone C</th>
                <th className="p-3 text-center">Zone D</th>
                <th className="p-3 text-center">Zone E</th>
              </tr>
            </thead>
            <tbody className="text-[10px] font-semibold text-[#475569]">
              {[
                { name: 'Delhivery', sub: 'Delivery Surface 0.5KG', icon: 'delhivery' },
                { name: 'Shree Maruti', sub: 'Shree Maruti Surface 0.25KG', icon: 'maruti' },
                { name: 'Bluedart', sub: 'Bluedart Surface 0.5KG', icon: 'bluedart' },
                { name: 'Ekart', sub: 'Ekart Surface 2KG', icon: 'ekart' },
                { name: 'Shadowfax', sub: 'Shadowfax Surface 0.5KG', icon: 'shadowfax' },
                { name: 'Delhivery', sub: 'Delivery Surface 0.5KG', icon: 'delhivery' },
                { name: 'Shadowfax', sub: 'Shadowfax Surface 0.5KG', icon: 'shadowfax' },
                { name: 'Delhivery', sub: 'Delivery Surface 0.5KG', icon: 'delhivery' },
                { name: 'Delhivery', sub: 'Delivery Surface 0.5KG', icon: 'delhivery' },
                { name: 'Delhivery', sub: 'Delivery Surface 0.5KG', icon: 'delhivery' },
                { name: 'Delhivery', sub: 'Delivery Surface 0.5KG', icon: 'delhivery' },
              ].map((c, i) => (
                <tr key={i} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                  <td className="p-3 pl-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#E2E8F0] p-1">
                      {c.icon === 'delhivery' && <img src="/brands/delhivery.png" alt="Delhivery" className="w-full h-full object-contain" />}
                      {c.icon === 'maruti' && <img src="/brands/shree_maruti.jpg" alt="Shree Maruti" className="w-full h-full object-contain" />}
                      {c.icon === 'bluedart' && <img src="/brands/bluedart.png" alt="Bluedart" className="w-full h-full object-contain" />}
                      {c.icon === 'ekart' && <img src="/brands/ekart.png" alt="Ekart" className="w-full h-full object-contain" />}
                      {c.icon === 'shadowfax' && <img src="/brands/shadowfax.png" alt="Shadowfax" className="w-full h-full object-contain" />}
                    </div>
                    <div>
                      <div className="font-semibold text-[#0F172A] text-[14px] leading-tight">{c.name}</div>
                      <div className="text-[10px] text-[#94A3B8] font-medium mt-1">{c.sub}</div>
                    </div>
                  </td>
                  <td className="p-3 text-center text-[14px] font-normal text-[#0F172A]">32</td>
                  <td className="p-3 text-center text-[14px] font-normal text-[#0F172A]">31</td>
                  <td className="p-3 text-center text-[14px] font-normal text-[#0F172A]">32</td>
                  <td className="p-3 text-center text-[14px] font-normal text-[#0F172A]">13</td>
                  <td className="p-3 text-center text-[14px] font-normal text-[#0F172A]">14</td>
                  <td className="p-3 text-center text-[14px] font-normal text-[#94A3B8]">-</td>
                  <td className="p-3 text-center text-[14px] font-normal text-[#94A3B8]">-</td>
                  <td className="p-3 text-center text-[14px] font-normal text-[#94A3B8]">-</td>
                  <td className="p-3 text-center text-[14px] font-normal text-[#0F172A]">5</td>
                  <td className="p-3 text-center text-[14px] font-normal text-[#0F172A]">5</td>
                  <td className="p-3 text-center text-[14px] font-normal text-[#0F172A]">4</td>
                  <td className="p-3 text-center text-[14px] font-normal text-[#0F172A]">3</td>
                  <td className="p-3 text-center text-[14px] font-normal text-[#0F172A]">2</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </AdminLayout>
  );
}
