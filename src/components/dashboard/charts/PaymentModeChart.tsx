import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { name: 'Prepaid', value: 72, color: '#10B981' },
  { name: 'COD', value: 49, color: '#E2E8F0' },
];

export function PaymentModeChart() {
  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col">
      <h3 className="text-[#0F172A] font-bold text-sm mb-4">Payment Mode</h3>
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
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col justify-center gap-3 w-32 pl-4">
          {data.map((item, idx) => (
            <React.Fragment key={idx}>
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-semibold" style={{ color: item.color }}>{item.name}</span>
                <span className="text-xs font-bold text-[#0F172A]">{item.value}</span>
              </div>
              {idx === 0 && <div className="w-full h-px bg-[#F1F5F9]"></div>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
