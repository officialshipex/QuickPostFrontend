import React, { useState } from 'react';
import { AlertTriangle, Trash2, Box, Truck, RefreshCcw, ChevronDown, Eye, CheckCheck, Download } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { DashboardData } from '../../services/dashboardApi';

interface Props {
  data?: DashboardData['ndrDetails'];
  isLoading?: boolean;
}

export function NDRDetails({ data, isLoading }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  if (isLoading || !data) {
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[#0F172A] font-bold text-sm">NDR Details</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
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
    { title: 'Total NDR', value: data.totalNDR, icon: AlertTriangle, color: 'text-blue-500', bg: 'bg-blue-50', link: '/ndr' },
    { title: 'Action Required', value: data.actionRequired, icon: Trash2, color: 'text-pink-500', bg: 'bg-pink-50', link: '/ndr?status=action-required' },
    { title: 'Action Requested', value: data.actionRequested, icon: Box, color: 'text-yellow-500', bg: 'bg-yellow-50', link: '/ndr?status=action-requested' },
    { title: 'NDR Delivered', value: data.ndrDelivered, icon: Truck, color: 'text-green-500', bg: 'bg-green-50', link: '/ndr?status=delivered' },
    { title: 'RTO Delivered', value: data.rtoDelivered, icon: RefreshCcw, color: 'text-blue-600', bg: 'bg-blue-100', link: '/ndr?status=rto-delivered' },
  ];

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-[#0F172A] font-bold text-sm">NDR Details</h3>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#475569] hover:text-[#00A86B] px-3 py-1.5 rounded-full border border-[#E2E8F0] bg-white hover:border-[#00A86B] transition-all"
          >
            Actions <ChevronDown className="w-3 h-3" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-20 overflow-hidden">
              <button onClick={() => navigate('/ndr')} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]">
                <Eye className="w-3.5 h-3.5" /> View Cases
              </button>
              <button onClick={() => navigate('/ndr?action=resolve')} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]">
                <CheckCheck className="w-3.5 h-3.5" /> Resolve Cases
              </button>
              <button onClick={() => alert('Export initiated')} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]">
                <Download className="w-3.5 h-3.5" /> Export Cases
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
