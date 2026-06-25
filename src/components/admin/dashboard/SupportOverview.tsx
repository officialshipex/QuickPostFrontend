import React from 'react';
import { Ticket, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

const SUPPORT_METRICS = [
  { label: 'Open Tickets', value: '142', icon: Ticket, color: 'text-blue-500', bg: 'bg-blue-50' },
  { label: 'Pending Escalations', value: '28', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
  { label: 'Resolved (24h)', value: '356', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
  { label: 'Avg Resolution Time', value: '4.2 hrs', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
];

export function SupportOverview() {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-bold text-sm text-[#0F172A]">Support Overview</h3>
        <span className="text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline">Support Desk</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {SUPPORT_METRICS.map((metric, idx) => (
          <div key={idx} className="flex flex-col p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-3 ${metric.bg}`}>
              <metric.icon className={`w-4 h-4 ${metric.color}`} />
            </div>
            <div className="text-xl font-bold text-[#0F172A] mb-0.5">{metric.value}</div>
            <div className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wide">{metric.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-5 pt-5 border-t border-[#E2E8F0]">
        <button className="w-full h-10 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold rounded-lg transition-colors">
          View Active Escalations
        </button>
      </div>
    </div>
  );
}
