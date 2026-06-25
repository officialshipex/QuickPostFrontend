import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { name: 'Zone A', value: 3.63, color: '#3B82F6' },
  { name: 'Zone B', value: 9.84, color: '#0EA5E9' },
  { name: 'Zone C', value: 11.92, color: '#10B981' },
  { name: 'Zone D', value: 69.43, color: '#8B5CF6' },
  { name: 'Zone E', value: 5.18, color: '#F59E0B' },
];

export function ShipmentsDistribution() {
  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col">
      <h3 className="text-[#0F172A] font-bold text-sm mb-4">Shipments Distribution</h3>
      <div className="flex-1 flex items-center">
        <div className="w-1/2 h-32 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={35}
                outerRadius={50}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-1/2 flex flex-col justify-center gap-2 pl-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: item.color }}>{item.name}</span>
              <span className="text-xs font-medium text-[#0F172A]">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
