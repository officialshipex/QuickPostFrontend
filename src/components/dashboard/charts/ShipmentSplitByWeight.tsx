import React from 'react';

const data = [
  { name: '0kg to 0.5kg', value: 54, color: '#10B981', percent: '54%' },
  { name: '0.5kg to 1kg', value: 121, color: '#3B82F6', percent: '100%' },
  { name: '1kg to 2kg', value: 32, color: '#F59E0B', percent: '32%' },
  { name: '2kg to 5kg', value: 67, color: '#8B5CF6', percent: '67%' },
  { name: '5kg to 10kg', value: 99, color: '#F43F5E', percent: '99%' },
  { name: '> 10kg', value: 43, color: '#0EA5E9', percent: '43%' },
];

export function ShipmentSplitByWeight() {
  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm">
      <h3 className="text-[#0F172A] font-bold text-sm mb-4">Shipment Split by Weight</h3>
      <div className="flex flex-col justify-between h-40">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
            <span className="text-xs font-medium text-[#475569] w-20 truncate">{item.name}</span>
            <div className="flex-1 h-0.5 rounded-full overflow-hidden flex items-center">
              <div className="h-0.5 rounded-full" style={{ width: item.percent, backgroundColor: item.color }}></div>
            </div>
            <span className="text-xs font-bold w-6 text-right" style={{ color: item.color }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
