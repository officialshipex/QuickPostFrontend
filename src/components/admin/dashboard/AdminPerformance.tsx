import React from 'react';
import { Target, Zap, Clock, ThumbsUp, TrendingUp } from 'lucide-react';

const PERFORMANCE_METRICS = [
  { label: 'Daily Orders', value: '8,452', change: '+12%', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
  { label: 'Delivery Success Rate', value: '94.2%', change: '+0.5%', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { label: 'Avg Delivery Time', value: '2.4 Days', change: '-4 hrs', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
  { label: 'Customer Satisfaction', value: '4.8/5.0', change: '+0.1', icon: ThumbsUp, color: 'text-indigo-500', bg: 'bg-indigo-50' },
];

export function AdminPerformance() {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm mb-6">
      <h3 className="font-bold text-sm text-[#0F172A] mb-5">Admin Performance Snapshot</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {PERFORMANCE_METRICS.map((metric, idx) => (
          <div key={idx} className="flex flex-col p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
            <div className="flex justify-between items-start mb-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${metric.bg}`}>
                <metric.icon className={`w-4 h-4 ${metric.color}`} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3" /> {metric.change}
              </div>
            </div>
            <div className="text-xl font-bold text-[#0F172A] mb-0.5">{metric.value}</div>
            <div className="text-xs font-semibold text-[#64748B]">{metric.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
