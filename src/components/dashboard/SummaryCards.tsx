import React from 'react';
import { Package, Users, Wallet, TrendingUp, TrendingDown, Info } from 'lucide-react';
import type { DashboardData } from '../../services/dashboardApi';

interface Props {
  data?: DashboardData['summary'];
  isLoading?: boolean;
}

export function SummaryCards({ data, isLoading }: Props) {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm animate-pulse h-32">
            <div className="flex justify-between items-start mb-4">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="w-8 h-8 rounded-full bg-gray-200"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-16 mb-4"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Total Orders Card - Gradient */}
      <div className="bg-gradient-to-r from-[#00A86B] to-[#007BFF] rounded-2xl p-5 text-white shadow-sm relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-1.5 cursor-help" title="Total number of forward and reverse orders processed">
            <span className="text-sm font-medium text-white/90">Total Orders</span>
            <Info className="w-3.5 h-3.5 text-white/60 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="text-3xl font-bold mb-3">{data.totalOrders.value}</div>
        <div className="flex items-center text-xs font-medium text-white/90">
          <TrendingUp className="w-3 h-3 mr-1" />
          <span>{data.totalOrders.trend}% vs last week</span>
        </div>
      </div>

      {/* Total Orders Value Card */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm group">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-1.5 cursor-help" title="Gross Merchandise Value (GMV) of all orders">
            <span className="text-sm font-medium text-[#475569]">Total Orders Value</span>
            <Info className="w-3.5 h-3.5 text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="w-8 h-8 rounded-full bg-[#F8FAFC] flex items-center justify-center">
            <Users className="w-4 h-4 text-[#64748B]" />
          </div>
        </div>
        <div className="text-3xl font-bold text-[#0F172A] mb-3">{data.totalOrdersValue.value}</div>
        <div className="flex items-center text-xs font-medium text-red-500">
          <TrendingDown className="w-3 h-3 mr-1" />
          <span>{data.totalOrdersValue.trend}% vs last week</span>
        </div>
      </div>

      {/* Avg Ship Cost Card */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm group">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-1.5 cursor-help" title="Average shipping cost incurred per order">
            <span className="text-sm font-medium text-[#475569]">Avg. Ship Cost</span>
            <Info className="w-3.5 h-3.5 text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="w-8 h-8 rounded-full bg-[#F8FAFC] flex items-center justify-center">
            <Wallet className="w-4 h-4 text-[#64748B]" />
          </div>
        </div>
        <div className="text-3xl font-bold text-[#0F172A] mb-3">₹{data.avgShipCost.value}</div>
        <div className="flex items-center text-xs font-medium text-[#10B981]">
          <TrendingUp className="w-3 h-3 mr-1" />
          <span>{data.avgShipCost.trend}% vs last week</span>
        </div>
      </div>
    </div>
  );
}
