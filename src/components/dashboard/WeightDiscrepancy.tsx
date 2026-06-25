import React, { useState } from 'react';
import { Scale, FileText, CheckCircle2, FileWarning, ChevronDown, Eye, Download, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DashboardData } from '../../services/dashboardApi';

interface Props {
  data?: DashboardData['weightDiscrepancy'];
  isLoading?: boolean;
}

export function WeightDiscrepancy({ data, isLoading }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[#0F172A] font-bold text-sm">Weight Discrepancy Details</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-sm animate-pulse h-24 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="h-3 bg-gray-200 rounded w-20"></div>
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
    { title: 'Total Discrepancy', value: data.totalDiscrepancy, icon: Scale, color: 'text-teal-500', bg: 'bg-teal-50', link: '/ndr?tab=weight' },
    { title: 'New Discrepancy', value: data.newDiscrepancy, icon: FileText, color: 'text-yellow-500', bg: 'bg-yellow-50', link: '/ndr?tab=weight&status=new' },
    { title: 'Accepted Discrepancy', value: data.acceptedDiscrepancy, icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-50', link: '/ndr?tab=weight&status=accepted' },
    { title: 'Discrepancy Raised', value: data.discrepancyRaised, icon: FileWarning, color: 'text-red-500', bg: 'bg-red-50', link: '/ndr?tab=weight&status=raised' },
  ];

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-[#0F172A] font-bold text-sm">Weight Discrepancy Details</h3>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#475569] hover:text-[#00A86B] px-3 py-1.5 rounded-full border border-[#E2E8F0] bg-white hover:border-[#00A86B] transition-all"
          >
            Actions <ChevronDown className="w-3 h-3" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-20 overflow-hidden">
              <button onClick={() => {}} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]">
                <Eye className="w-3.5 h-3.5" /> View Details
              </button>
              <button onClick={() => alert('Report download started')} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]">
                <Download className="w-3.5 h-3.5" /> Download Report
              </button>
              <button onClick={() => {}} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50">
                <AlertCircle className="w-3.5 h-3.5" /> Raise Dispute
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card, idx) => (
          <Link
            to={card.link}
            key={idx}
            className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-sm flex flex-col justify-between h-24 cursor-pointer hover:border-[#10B981] hover:shadow-md transition-all group"
          >
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
