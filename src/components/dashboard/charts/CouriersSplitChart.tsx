import React from 'react';

const data = [
  { name: 'Delivery', value: 54, color: '#10B981', percent: '54%' },
  { name: 'Ekart', value: 121, color: '#3B82F6', percent: '100%' },
  { name: 'Maruti', value: 43, color: '#0EA5E9', percent: '43%' },
  { name: 'Dtdc', value: 32, color: '#F59E0B', percent: '32%' },
  { name: 'Bluedart', value: 87, color: '#8B5CF6', percent: '87%' },
  { name: 'Shadowfax', value: 9, color: '#F43F5E', percent: '9%' },
];

export function CouriersSplitChart() {
  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm">
      <h3 className="text-[#0F172A] font-bold text-sm mb-4">Couriers Split</h3>
      <div className="flex flex-col justify-between h-40">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
            <span className="text-xs font-medium text-[#475569] w-14 truncate">{item.name}</span>
            <div className="flex-1 h-0.5 rounded-full overflow-hidden flex items-center">
              <div className="h-0.5 rounded-full" style={{ width: item.percent, backgroundColor: item.color }}></div>
            </div>
            <span className="text-xs font-bold text-[#0EA5E9] w-6 text-right" style={{ color: item.color }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
