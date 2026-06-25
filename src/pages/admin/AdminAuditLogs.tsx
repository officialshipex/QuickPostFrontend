import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Search, Download, Shield, User, FileText, Settings, Activity, ChevronLeft, ChevronRight, LogIn, LogOut } from 'lucide-react';

const LOGS = Array.from({ length: 25 }, (_, i) => ({
  id: `LOG${String(900000 + i).padStart(6, '0')}`,
  timestamp: `2026-06-12 ${String(14 - (i % 12)).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}`,
  user: ['Super Admin', 'Rahul Sharma', 'System', 'API Gateway', 'Anita Desai'][i % 5],
  role: ['Super Admin', 'Support Lead', 'System', 'Service', 'Operations'][i % 5],
  action: ['User Logged In', 'Settings Updated', 'COD Settled', 'Courier Added', 'Vendor Approved', 'User Logged Out', 'Order Cancelled', 'NDR Reattempt Scheduled'][i % 8],
  category: ['Authentication', 'Configuration', 'Financial', 'Integration', 'Vendor Management', 'Authentication', 'Order Management', 'NDR Management'][i % 8],
  ip: `192.168.1.${100 + i}`,
  status: i % 15 === 0 ? 'Failed' : 'Success',
}));

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Authentication': Shield,
  'Configuration': Settings,
  'Financial': FileText,
  'Integration': Activity,
  'Vendor Management': User,
  'Order Management': FileText,
  'NDR Management': Activity,
};

export function AdminAuditLogs() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filtered = LOGS.filter(l => 
    searchQuery === '' || 
    l.user.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.action.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A]">Audit Logs</h2>
          <p className="text-xs text-[#64748B] mt-1">Track platform activities and administrative actions.</p>
        </div>
        <button className="h-9 px-4 rounded-lg border border-[#E2E8F0] bg-white text-[#475569] text-xs font-semibold flex items-center gap-2 hover:bg-[#F8FAFC] shadow-sm">
          <Download className="w-4 h-4" /> Export Logs
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input type="text" placeholder="Search logs by user, action..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full h-10 pl-9 pr-4 rounded-lg border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] uppercase tracking-wider font-bold text-[#64748B]">
                <th className="p-4">Timestamp</th>
                <th className="p-4">User</th>
                <th className="p-4">Category</th>
                <th className="p-4">Action Details</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-xs font-medium text-[#475569]">
              {filtered.map(log => {
                const Icon = CATEGORY_ICONS[log.category] || Activity;
                return (
                  <tr key={log.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                    <td className="p-4 text-[#64748B] font-mono text-[11px]">{log.timestamp}</td>
                    <td className="p-4">
                      <div className="text-[#0F172A] font-bold">{log.user}</div>
                      <div className="text-[10px] text-[#94A3B8]">{log.role}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-[#94A3B8]" />
                        <span>{log.category}</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-[#0F172A]">{log.action}</td>
                    <td className="p-4 text-[10px] font-mono text-[#94A3B8]">{log.ip}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${log.status === 'Success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>{log.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center p-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
          <span className="text-xs text-[#64748B]">Showing {filtered.length} logs</span>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-white"><ChevronLeft className="w-4 h-4" /></button>
            <button className="w-8 h-8 rounded-lg bg-[#00A86B] text-white text-xs font-bold">1</button>
            <button className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-white"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
