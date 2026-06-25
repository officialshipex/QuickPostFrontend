import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { 
  Search, RefreshCcw, User, 
  MoreVertical, Edit2, Trash2, LayoutGrid, Clock
} from 'lucide-react';

const getCourierLogo = (partner: string) => {
  const p = partner.toUpperCase();
  if (p.includes('DELHIVERY')) return '/brands/delhivery.png';
  if (p.includes('BLUEDART') || p.includes('BLUE DART')) return '/brands/bluedart.png';
  if (p.includes('EKART')) return '/brands/ekart.png';
  if (p.includes('XPRESSBEES')) return '/brands/xpressbees.png';
  if (p.includes('SHREE MARUTI')) return '/brands/shree_maruti.jpg';
  if (p.includes('DTDC')) return '/brands/dtdc.png';
  if (p.includes('SHADOWFAX')) return '/brands/shadowfax.png';
  if (p.includes('AMAZON')) return '/brands/amazon.png';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(partner)}&background=f8fafc&color=0f172a&bold=true&font-size=0.4`;
};

const MOCK_DATA = [
  { id: 'EPD01', courier: 'Delhivery', service: 'Delhivery Surface 0.5KG', cutoffTime: '09:00 AM' },
  { id: 'EPD02', courier: 'BlueDart', service: 'BlueDart Air 0.5KG', cutoffTime: '11:00 AM' },
  { id: 'EPD03', courier: 'Xpressbees', service: 'Xpressbees Surface 1KG', cutoffTime: '10:30 AM' },
  { id: 'EPD04', courier: 'Ecom Express', service: 'Ecom Express Surface 0.5KG', cutoffTime: '02:00 PM' },
  { id: 'EPD05', courier: 'Shadowfax', service: 'Shadowfax Surface 2KG', cutoffTime: '01:00 PM' },
  { id: 'EPD06', courier: 'DTDC', service: 'DTDC Express 0.5KG', cutoffTime: '08:30 AM' },
  { id: 'EPD07', courier: 'Amazon Shipping', service: 'Amazon Shipping 1KG', cutoffTime: '10:00 AM' },
  { id: 'EPD08', courier: 'Ekart Logistics', service: 'Ekart Surface 0.5KG', cutoffTime: '09:30 AM' },
];

export function AdminEPDMapping() {
  const location = useLocation();
  const [globalSearchQuery, setGlobalSearchQuery] = useState((window as any).__adminSearchQuery?.toLowerCase() || '');

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

  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = MOCK_DATA.filter(row => {
    if (globalSearchQuery) {
      if (!row.courier.toLowerCase().includes(globalSearchQuery) &&
          !row.service.toLowerCase().includes(globalSearchQuery)) return false;
    }
    if (searchTerm) {
      if (!row.courier.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !row.service.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">
        <div className="bg-white relative z-50 shrink-0">

        {/* Page Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] bg-white flex justify-between items-center z-50 relative shrink-0">
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">EPD Mapping</h1>
          <button className="h-9 px-4 rounded-[14px] bg-[#00A86B] text-white text-[12px] font-bold hover:bg-[#009B63] transition-colors shadow-sm flex items-center gap-1.5">
            Add Cutoff Time
          </button>
        </div>

        {/* Filter and Action Row */}
        <div className="p-4 border-b border-[#E2E8F0] flex items-center gap-3 bg-white">
          <input 
            type="text" 
            placeholder="Search Courier Services..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[180px] shrink-0" 
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white flex flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
        <div className="flex-1 overflow-auto no-scrollbar relative">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 z-40 bg-[#E6F5F1] shadow-sm">
              <tr className="text-[10px] font-bold text-[#00A86B] uppercase tracking-wider">
                <th className="p-4 whitespace-nowrap"><LayoutGrid className="w-3.5 h-3.5 inline mr-1"/> Courier</th>
                <th className="p-4 whitespace-nowrap"><User className="w-3.5 h-3.5 inline mr-1"/> Courier Services</th>
                <th className="p-4 whitespace-nowrap"><Clock className="w-3.5 h-3.5 inline mr-1"/> Cutoff Time (IST)</th>
                <th className="p-4 whitespace-nowrap text-right pr-6"><MoreVertical className="w-3.5 h-3.5 inline mr-1"/> Actions</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-[#475569] font-bold">
              {filteredData.length > 0 ? filteredData.map((row) => (
                <tr key={row.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 flex items-center justify-center shrink-0 bg-transparent">
                        <img 
                          src={getCourierLogo(row.courier)} 
                          alt={row.courier}
                          className="w-full h-full object-contain mix-blend-multiply"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(row.courier)}&background=f8fafc&color=0f172a&bold=true&font-size=0.4`;
                            (e.target as HTMLImageElement).className = "w-full h-full object-cover rounded-full border border-[#E2E8F0]";
                          }}
                        />
                      </div>
                      <div>
                        <div className="font-bold text-[#0F172A] text-[12px] uppercase">{row.courier}</div>
                        <div className="text-[10px] text-[#94A3B8] font-semibold mt-0.5">ID: {row.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-[#475569] font-bold text-[12px]">{row.service}</td>
                  <td className="p-4">
                    <span className="text-[#0F172A] font-bold text-[12px]">{row.cutoffTime}</span>
                  </td>
                  <td className="p-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <button className="w-8 h-8 rounded-full border border-[#E2E8F0] bg-white text-[#64748B] flex items-center justify-center hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="w-8 h-8 rounded-full border border-red-100 bg-white text-red-500 flex items-center justify-center hover:text-white hover:bg-red-600 hover:border-red-600 transition-all shadow-sm">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#94A3B8] font-medium">No EPD mappings found matching your search.</td>
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
