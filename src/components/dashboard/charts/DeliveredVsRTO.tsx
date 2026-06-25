import React from 'react';

export function DeliveredVsRTO() {
  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col">
      <h3 className="text-[#0F172A] font-bold text-sm mb-6">Delivered vs RTO vs Undelivered</h3>
      
      <div className="flex-1 flex flex-col justify-center gap-4">
        <div className="flex justify-between items-center px-4">
          <div className="flex flex-col items-center">
            <span className="text-xs font-medium text-[#64748B] mb-1">Delivered</span>
            <span className="text-xl font-bold text-[#0F172A]">12</span>
            <span className="text-xs font-medium text-[#64748B]">0%</span>
          </div>
          <span className="text-xs font-medium text-[#94A3B8]">VS</span>
          <div className="flex flex-col items-center">
            <span className="text-xs font-medium text-[#64748B] mb-1">RTO</span>
            <span className="text-xl font-bold text-[#0F172A]">12</span>
            <span className="text-xs font-medium text-[#64748B]">0%</span>
          </div>
          <span className="text-xs font-medium text-[#94A3B8]">VS</span>
          <div className="flex flex-col items-center">
            <span className="text-xs font-medium text-[#64748B] mb-1">Undelivered</span>
            <span className="text-xl font-bold text-[#0F172A]">12</span>
            <span className="text-xs font-medium text-[#64748B]">0%</span>
          </div>
        </div>

        {/* Progress Bar representation */}
        <div className="w-full mt-4 flex items-center justify-end relative px-4">
           <div className="w-full h-1 bg-[#E2E8F0] rounded-full"></div>
           <span className="absolute right-0 text-[10px] font-bold text-blue-600 bg-blue-50 px-1 py-0.5 rounded mr-4 -bottom-4">121</span>
        </div>
      </div>
    </div>
  );
}
