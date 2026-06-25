import React from 'react';
import { Package, Clock } from 'lucide-react';

const CircularProgress = ({ color, percent, icon: Icon }: { color: string, percent: number, icon: any }) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
      <svg className="absolute inset-0 w-full h-full transform -rotate-90">
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke="#F1F5F9"
          strokeWidth="4"
          fill="transparent"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ color }}
        />
      </svg>
      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-4 h-4" style={{ color }} strokeWidth={2.5} />
      </div>
    </div>
  );
};

export function PerformanceCards() {
  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col h-full">
      <h3 className="text-[#0F172A] font-bold text-sm mb-4">Pickup & Delivery Performance</h3>
      <div className="flex flex-col gap-3 flex-1 justify-between">
        
        {/* On Time Card */}
        <div className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex items-center gap-5">
          <CircularProgress color="#10B981" percent={85} icon={Package} />
          <div className="flex-1 flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-xl font-bold text-[#0F172A]">1,234</span>
              <span className="text-xs font-medium text-[#64748B]">On Time Pickups</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-[#0F172A]">1,234</span>
              <span className="text-xs font-medium text-[#64748B]">On Time Deliveries</span>
            </div>
          </div>
        </div>

        {/* Late Card */}
        <div className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex items-center gap-5">
          <CircularProgress color="#F59E0B" percent={40} icon={Clock} />
          <div className="flex-1 flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-xl font-bold text-[#0F172A]">1,234</span>
              <span className="text-xs font-medium text-[#64748B]">Late Pickups</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-[#0F172A]">1,234</span>
              <span className="text-xs font-medium text-[#64748B]">Late Deliveries</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
