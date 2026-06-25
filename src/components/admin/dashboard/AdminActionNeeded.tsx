import React from 'react';
import { UserPlus, AlertTriangle, FileWarning, PackageX, IndianRupee, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ACTIONS = [
  { label: 'Pending Seller Approvals', value: '124', icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-50', link: '/admin/vendors' },
  { label: 'Courier Integration Issues', value: '18', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50', link: '/admin/couriers' },
  { label: 'Pending NDR Cases', value: '324', icon: FileWarning, color: 'text-red-500', bg: 'bg-red-50', link: '/admin/ndr' },
  { label: 'Failed Shipments', value: '56', icon: PackageX, color: 'text-rose-500', bg: 'bg-rose-50', link: '/admin/shipments' },
  { label: 'Pending COD Settlements', value: '212', icon: IndianRupee, color: 'text-yellow-600', bg: 'bg-yellow-50', link: '/admin/cod' },
  { label: 'Support Tickets', value: '47', icon: Ticket, color: 'text-purple-500', bg: 'bg-purple-50', link: '/admin/support' },
];

export function AdminActionNeeded() {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-bold text-sm text-[#0F172A]">Platform Action Needed</h3>
        <span className="text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline">View All Tasks</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {ACTIONS.map((action, idx) => (
          <div 
            key={idx} 
            onClick={() => navigate(action.link)}
            className="flex flex-col p-4 rounded-xl border border-[#E2E8F0] hover:border-[#00A86B] hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="text-xl font-bold text-[#0F172A] mb-1">{action.value}</div>
            <div className="text-[10px] font-semibold text-[#64748B] flex-1 leading-tight">{action.label}</div>
            <div className="mt-3 flex justify-between items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${action.bg}`}>
                <action.icon className={`w-3 h-3 ${action.color}`} />
              </div>
              <span className="text-[10px] text-[#00A86B] font-bold opacity-0 group-hover:opacity-100 transition-opacity">Resolve →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
