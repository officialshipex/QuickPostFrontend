import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell, PieChart, Pie, LineChart, Line } from 'recharts';

const growthData = [
  { name: 'Jan', orders: 120000, sellers: 400 },
  { name: 'Feb', orders: 150000, sellers: 600 },
  { name: 'Mar', orders: 180000, sellers: 850 },
  { name: 'Apr', orders: 220000, sellers: 1100 },
  { name: 'May', orders: 280000, sellers: 1400 },
  { name: 'Jun', orders: 340000, sellers: 1800 },
];

const courierDistData = [
  { name: 'Delhivery', value: 45 },
  { name: 'Ekart', value: 25 },
  { name: 'Xpressbees', value: 15 },
  { name: 'Bluedart', value: 10 },
  { name: 'DTDC', value: 5 },
];

const COLORS = ['#00A86B', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];

export function AdminCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Monthly Growth Area Chart */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
        <h3 className="font-bold text-sm text-[#0F172A] mb-5">Order Trends</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00A86B" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00A86B" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(value) => `${value / 1000}k`} />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#0F172A', marginBottom: '4px' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="orders" stroke="#00A86B" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Seller Growth Bar Chart */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
        <h3 className="font-bold text-sm text-[#0F172A] mb-5">Seller Growth</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
              <RechartsTooltip 
                cursor={{ fill: '#F1F5F9' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#0F172A', marginBottom: '4px' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Bar dataKey="sellers" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Courier Distribution */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
        <h3 className="font-bold text-sm text-[#0F172A] mb-5">Courier Distribution</h3>
        <div className="h-[250px] w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={courierDistData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {courierDistData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontSize: '12px' }}
                formatter={(value: any) => [`${value}%`, 'Share']}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle" 
                wrapperStyle={{ fontSize: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payment Modes vs Zones (Line Chart Example) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
        <h3 className="font-bold text-sm text-[#0F172A] mb-5">Delivery Performance (SLA)</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} domain={[80, 100]} />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Line type="monotone" dataKey="sellers" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="On-Time %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
