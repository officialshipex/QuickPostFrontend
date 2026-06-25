import React from 'react';
import { Package, AlertCircle, Clock, ShoppingCart, Info, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DashboardData } from '../../services/dashboardApi';

interface Props {
  data?: DashboardData['actionNeeded'];
  isLoading?: boolean;
}

export function ActionNeeded({ data, isLoading }: Props) {
  if (isLoading || !data) {
    return (
      <div className="mb-6">
        <h3 className="text-[#0F172A] font-bold text-sm mb-3">Action Needed</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-sm animate-pulse h-24 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="h-3 bg-gray-200 rounded w-16"></div>
                <div className="w-6 h-6 rounded-full bg-gray-200"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-10"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    { title: 'New Orders', value: data.newOrders, icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-50', link: '/orders?status=new' },
    { title: 'Weight Disputes', value: data.weightDisputes, icon: AlertCircle, color: 'text-purple-500', bg: 'bg-purple-50', link: '/ndr?tab=weight' },
    { title: 'Shipment Delays', value: data.shipmentDelays, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50', link: '/shipments?status=delayed' },
    { title: 'Pending Pickups', value: data.pendingPickups, icon: Package, color: 'text-teal-500', bg: 'bg-teal-50', link: '/shipments?status=pending-pickup' },
    { title: 'Pending NDR', value: data.pendingNDR, icon: Info, color: 'text-indigo-500', bg: 'bg-indigo-50', link: '/ndr?status=pending' },
    { title: 'COD Initiated', value: data.codInitiated, icon: RotateCcw, color: 'text-green-500', bg: 'bg-green-50', link: '/cod' },
  ];

  return (
    <div className="mb-6">
      <h3 className="text-[#0F172A] font-bold text-sm mb-3">Action Needed</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card, idx) => (
          <Link to={card.link} key={idx} className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-sm flex flex-col justify-between h-24 cursor-pointer hover:border-[#10B981] hover:shadow-md transition-all group">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-[#475569] group-hover:text-[#10B981] transition-colors truncate mt-0.5">{card.title}</span>
              <div className={`w-6 h-6 rounded-full ${card.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                <card.icon className={`w-3 h-3 ${card.color}`} strokeWidth={2.5} />
              </div>
            </div>
            <span className="text-xl font-bold text-[#0F172A]">{card.value}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
