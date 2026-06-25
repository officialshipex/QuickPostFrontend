import React from 'react';

const COURIERS = [
  { id: 1, name: 'Delhivery', type: 'Surface', logo: '/brands/delhivery.png', total: '8.4L', delivered: '7.8L', rto: '42k', ndr: '84k', avgTime: '2.8 Days', score: '94/100' },
  { id: 2, name: 'Ekart', type: 'Surface', logo: '/brands/ekart.png', total: '5.2L', delivered: '4.9L', rto: '18k', ndr: '45k', avgTime: '2.5 Days', score: '96/100' },
  { id: 3, name: 'XpressBees', type: 'Surface', logo: '/brands/xpressbees.png', total: '2.8L', delivered: '2.5L', rto: '22k', ndr: '35k', avgTime: '3.1 Days', score: '88/100' },
  { id: 4, name: 'Shadowfax', type: 'Surface', logo: '/brands/shadowfax.png', total: '1.5L', delivered: '1.3L', rto: '14k', ndr: '21k', avgTime: '2.4 Days', score: '91/100' },
  { id: 5, name: 'DTDC', type: 'Air', logo: '/brands/dtdc.png', total: '1.0L', delivered: '92k', rto: '5k', ndr: '12k', avgTime: '1.8 Days', score: '98/100' },
];

export function CourierPerformanceTable() {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-5 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
        <h3 className="font-bold text-sm text-[#0F172A]">Courier Performance</h3>
        <span className="text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline">Manage Couriers</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] text-[10px] uppercase tracking-wider font-bold">
              <th className="p-4">Courier</th>
              <th className="p-4">Total Shipments</th>
              <th className="p-4">Delivered</th>
              <th className="p-4">RTO</th>
              <th className="p-4">NDR</th>
              <th className="p-4">Avg Delivery Time</th>
              <th className="p-4">Performance Score</th>
            </tr>
          </thead>
          <tbody className="text-xs font-semibold text-[#475569]">
            {COURIERS.map((courier) => (
              <tr key={courier.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors cursor-pointer">
                <td className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-[#E2E8F0] bg-white flex items-center justify-center p-1 overflow-hidden shrink-0">
                    <img src={courier.logo} alt={courier.name} className="max-w-full max-h-full object-contain" />
                  </div>
                  <div>
                    <div className="text-[#0F172A] font-bold">{courier.name}</div>
                    <div className="text-[10px] text-[#64748B]">{courier.type}</div>
                  </div>
                </td>
                <td className="p-4 text-[12px] font-bold text-[#0F172A]">{courier.total}</td>
                <td className="p-4 text-[12px] font-bold text-green-600">{courier.delivered}</td>
                <td className="p-4 text-[12px] font-bold text-red-500">{courier.rto}</td>
                <td className="p-4 text-[12px] font-bold text-yellow-600">{courier.ndr}</td>
                <td className="p-4 text-[12px] font-bold text-[#334155]">{courier.avgTime}</td>
                <td className="p-4 text-[12px] font-bold text-[#00A86B]">{courier.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
