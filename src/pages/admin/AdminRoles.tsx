import React from 'react';
import { useLocation } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { 
  Search, RefreshCcw, ChevronDown, Users, 
  FileText, Clock, MoreVertical
} from 'lucide-react';

const MOCK_ROLES = Array.from({ length: 8 }, (_, i) => ({
  serialNo: i + 1,
  name: 'Dinesh Tharwani',
  date: '13th Apr 2026 | 04:34 PM',
  email: 'dineshtharwani@gmail.com',
  role: 'Key Account Manager',
  status: 'Active',
  createdAtDate: '13th Apr 2026',
  createdAtTime: '04:34 PM'
}));

export function AdminRoles() {
  const location = useLocation();
  const [globalSearchQuery, setGlobalSearchQuery] = React.useState((window as any).__adminSearchQuery?.toLowerCase() || '');

  React.useEffect(() => {
    const handleSearch = (e: Event) => {
      setGlobalSearchQuery(((e as CustomEvent).detail || '').toLowerCase());
    };
    window.addEventListener('admin-search', handleSearch);
    setGlobalSearchQuery(((window as any).__adminSearchQuery || '').toLowerCase());
    return () => {
      window.removeEventListener('admin-search', handleSearch);
    };
  }, []);

  const filteredRoles = MOCK_ROLES.filter(role => {
    if (globalSearchQuery) {
      if (!role.name.toLowerCase().includes(globalSearchQuery) &&
          !role.email.toLowerCase().includes(globalSearchQuery) &&
          !role.role.toLowerCase().includes(globalSearchQuery)) return false;
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">
        <div className="bg-white relative z-50 shrink-0">

        {/* Page Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] bg-white flex justify-between items-center z-50 relative shrink-0">
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">Roles</h1>
          <button className="h-9 px-4 rounded-[14px] bg-[#00A86B] text-white text-[12px] font-bold hover:bg-[#009B63] transition-colors shadow-sm flex items-center gap-1.5">
            Add Role
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white flex flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
        <div className="flex-1 overflow-auto no-scrollbar relative">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 z-40 bg-[#E6F5F1] shadow-sm">
              <tr className="text-[10px] font-bold text-[#00A86B] uppercase tracking-wider">
                <th className="p-4 w-16 text-center">Serial No.</th>
                <th className="p-4 whitespace-nowrap"><Users className="w-3.5 h-3.5 inline mr-1"/> Employee Details</th>
                <th className="p-4 whitespace-nowrap"><FileText className="w-3.5 h-3.5 inline mr-1"/> Role</th>
                <th className="p-4 whitespace-nowrap"><FileText className="w-3.5 h-3.5 inline mr-1"/> Status</th>
                <th className="p-4 whitespace-nowrap"><Clock className="w-3.5 h-3.5 inline mr-1"/> Created At</th>
                <th className="p-4 whitespace-nowrap text-right pr-6"><MoreVertical className="w-3.5 h-3.5 inline mr-1"/> Actions</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-[#475569]">
              {filteredRoles.length > 0 ? filteredRoles.map((role, i) => (
                <tr key={i} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors group">
                  <td className="p-4 text-center text-[#94A3B8] font-medium align-top pt-5">
                    {role.serialNo}
                  </td>
                  <td className="p-4 align-top pt-4">
                    <div className="font-bold text-[#0F172A] text-[11px]">{role.name}</div>
                    <div className="text-[#64748B] mt-1">{role.date}</div>
                    <div className="font-sans text-xs font-normal text-[#94A3B8] mt-0.5">{role.email}</div>
                  </td>
                  <td className="p-4 align-top pt-5">
                    <div className="text-[#64748B]">{role.role}</div>
                  </td>
                  <td className="p-4 align-top pt-5">
                    <span className="px-3 py-1 rounded-full border border-green-200 text-[#00A86B] font-bold text-[10px] bg-green-50/50 whitespace-nowrap">
                      {role.status}
                    </span>
                  </td>
                  <td className="p-4 align-top pt-4">
                    <div className="text-[#64748B]">{role.createdAtDate}</div>
                    <div className="text-[#94A3B8] mt-0.5">{role.createdAtTime}</div>
                  </td>
                  <td className="p-4 align-top pt-5 text-right pr-6">
                    <button className="px-5 py-1.5 rounded-full bg-[#1e40af] text-white font-bold text-[10px] hover:bg-[#1e3a8a] transition-colors shadow-sm">
                      Edit
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#94A3B8] font-medium">No roles found matching your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </AdminLayout>
  );
}
