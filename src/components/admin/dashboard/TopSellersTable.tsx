import React from 'react';

const SELLERS = [
  { id: 1, name: 'SuperMart Pvt Ltd', orders: '12,450', revenue: '₹42.5 L', shipments: '12,200', cod: '₹18.2 L', ndr: '4.2%', score: '98/100' },
  { id: 2, name: 'Fashion Hub', orders: '8,210', revenue: '₹24.1 L', shipments: '8,150', cod: '₹12.5 L', ndr: '5.1%', score: '95/100' },
  { id: 3, name: 'ElectroWorld', orders: '5,600', revenue: '₹55.8 L', shipments: '5,550', cod: '₹8.4 L', ndr: '2.8%', score: '99/100' },
  { id: 4, name: 'Beauty Basics', orders: '4,100', revenue: '₹12.4 L', shipments: '4,000', cod: '₹6.2 L', ndr: '6.5%', score: '92/100' },
  { id: 5, name: 'Home Essentials', orders: '3,800', revenue: '₹18.9 L', shipments: '3,750', cod: '₹9.1 L', ndr: '3.4%', score: '96/100' },
];

export function TopSellersTable() {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-5 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
        <h3 className="font-bold text-sm text-[#0F172A]">Top Performing Sellers</h3>
        <span className="text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline">View All Sellers</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] text-[10px] uppercase tracking-wider font-bold">
              <th className="p-4">Seller Name</th>
              <th className="p-4">Orders</th>
              <th className="p-4">Revenue</th>
              <th className="p-4">Shipments</th>
              <th className="p-4">COD</th>
              <th className="p-4">NDR %</th>
              <th className="p-4">Performance Score</th>
            </tr>
          </thead>
          <tbody className="text-xs font-semibold text-[#475569]">
            {SELLERS.map((seller) => (
              <tr key={seller.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors cursor-pointer">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#10B981]/10 text-[#00A86B] flex items-center justify-center font-bold">
                      {seller.name.charAt(0)}
                    </div>
                    <span className="text-[#0F172A]">{seller.name}</span>
                  </div>
                </td>
                <td className="p-4 text-[12px] font-bold text-[#0F172A]">{seller.orders}</td>
                <td className="p-4 text-[12px] font-bold text-[#0F172A]">{seller.revenue}</td>
                <td className="p-4 text-[12px] font-bold text-[#0F172A]">{seller.shipments}</td>
                <td className="p-4 text-[12px] font-bold text-[#0F172A]">{seller.cod}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-md text-[12px] font-bold ${parseFloat(seller.ndr) > 5 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {seller.ndr}
                  </span>
                </td>
                <td className="p-4 text-[12px] font-bold text-[#00A86B]">{seller.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
