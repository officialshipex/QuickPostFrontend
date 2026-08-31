import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Search, Truck, Plane, Zap, IndianRupee, Settings2, CheckCircle2 } from 'lucide-react';
import { usePagination, DesktopPagination } from '../../hooks/usePagination';
import { MobilePaginationBar } from '../../hooks/useMobilePaginationBar';
import { TableLoader } from '../../components/ui/TableLoader';

type SetupTab = 'selection' | 'priority';
type PriorityMode = 'Fastest' | 'Cheapest' | 'Custom';

interface CourierServiceRow {
  _id: string;
  name: string;
  provider: string;
  mode: 'Surface' | 'Air';
  enabled: boolean;
}

const DUMMY_COURIER_SERVICES: CourierServiceRow[] = [
  { _id: 'cs-1', name: 'Dtdc Surface 0.5KG', provider: 'DTDC', mode: 'Surface', enabled: false },
  { _id: 'cs-2', name: 'Dtdc Surface 1KG', provider: 'DTDC', mode: 'Surface', enabled: false },
  { _id: 'cs-3', name: 'Shree Maruti Surface 0.25KG', provider: 'Shree Maruti', mode: 'Surface', enabled: true },
  { _id: 'cs-4', name: 'Shree Maruti Surface 0.5KG', provider: 'Shree Maruti', mode: 'Surface', enabled: true },
  { _id: 'cs-5', name: 'Shree Maruti Surface 1KG', provider: 'Shree Maruti', mode: 'Surface', enabled: true },
  { _id: 'cs-6', name: 'Amazon Surface 0.5KG', provider: 'Amazon', mode: 'Surface', enabled: true },
  { _id: 'cs-7', name: 'Amazon Surface 1KG', provider: 'Amazon', mode: 'Surface', enabled: true },
  { _id: 'cs-8', name: 'Dtdc Air 0.5KG', provider: 'DTDC', mode: 'Air', enabled: false },
  { _id: 'cs-9', name: 'Dtdc Air 1KG', provider: 'DTDC', mode: 'Air', enabled: false },
  { _id: 'cs-10', name: 'Delhivery Air 0.25KG', provider: 'Delhivery', mode: 'Air', enabled: true },
  { _id: 'cs-11', name: 'Delhivery Air 0.5KG', provider: 'Delhivery', mode: 'Air', enabled: true },
  { _id: 'cs-12', name: 'Delhivery Air 1KG', provider: 'Delhivery', mode: 'Air', enabled: true },
  { _id: 'cs-13', name: 'Delhivery Surface 0.25KG', provider: 'Delhivery', mode: 'Surface', enabled: true },
];

const getProviderLogo = (name: string) => {
  const n = (name || '').toLowerCase();
  if (n.includes('amazon')) return '/brands/amazon.png';
  if (n.includes('delhivery')) return '/brands/delhivery.png';
  if (n.includes('dtdc')) return '/brands/dtdc.png';
  if (n.includes('ekart')) return '/brands/ekart.png';
  if (n.includes('shadowfax')) return '/brands/shadowfax.png';
  if (n.includes('shiprocket')) return '/brands/shiprocket.jpg';
  if (n.includes('maruti')) return '/brands/shree_maruti.jpg';
  if (n.includes('xpress')) return '/brands/xpressbees.png';
  return '';
};

const PRIORITY_OPTIONS: { key: PriorityMode; label: string; icon: any }[] = [
  { key: 'Fastest', label: 'Fastest', icon: Truck },
  { key: 'Cheapest', label: 'Cheapest', icon: IndianRupee },
  { key: 'Custom', label: 'Custom', icon: Settings2 },
];

export function AdminCourierSetup() {
  const [activeTab, setActiveTab] = useState<SetupTab>('selection');
  const [services, setServices] = useState<CourierServiceRow[]>(DUMMY_COURIER_SERVICES);
  const [search, setSearch] = useState('');
  const [priorityMode, setPriorityMode] = useState<PriorityMode>('Cheapest');

  // Dummy data is local/instant, but a brief loader still mirrors the Orders tab's
  // fetch-then-render pattern so the table doesn't just pop in.
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const filteredServices = services.filter(s => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.provider.toLowerCase().includes(q);
  });

  const { paginatedData: paginatedServices, page, setPage, totalPages, rowsPerPage, setRowsPerPage, startIndex, endIndex, totalItems } =
    usePagination({ data: filteredServices, perPage: 20 });

  const toggleService = (id: string) => {
    setServices(prev => prev.map(s => s._id === id ? { ...s, enabled: !s.enabled } : s));
  };

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">
        {/* Tabs + search — sticky, never scroll */}
        <div className="shrink-0 flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 md:px-6 py-4 border-b border-[#E2E8F0] bg-white">
          <div className="flex items-center gap-1.5 bg-white border border-[#E2E8F0] rounded-full p-1 w-fit shadow-sm">
            <button
              onClick={() => setActiveTab('selection')}
              className={`px-4 h-9 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors ${activeTab === 'selection' ? 'bg-[#00A86B] text-white shadow-sm' : 'text-[#475569] hover:text-[#0F172A]'}`}
            >
              Courier Selection
            </button>
            <button
              onClick={() => setActiveTab('priority')}
              className={`px-4 h-9 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors ${activeTab === 'priority' ? 'bg-[#00A86B] text-white shadow-sm' : 'text-[#475569] hover:text-[#0F172A]'}`}
            >
              Courier Priority
            </button>
          </div>

          {activeTab === 'selection' && (
            <div className="relative w-full md:w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search by courier service..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-full border border-[#E2E8F0] bg-white text-[13px] outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10 text-[#0F172A] placeholder:text-[#94A3B8] transition-all shadow-sm"
              />
            </div>
          )}
        </div>

        {activeTab === 'selection' && (
          <>
            {/* Desktop table — same header background/margins as Orders tab; only the
                body scrolls, header stays pinned */}
            <div className="hidden md:flex bg-white flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
              <div className="flex-1 overflow-auto w-full relative">
                {loading && <TableLoader />}
                <table className="w-full text-left border-collapse min-w-full">
                  <thead className="sticky top-0 z-40 bg-[#E6F9F2] shadow-sm">
                    <tr className="text-xs leading-[18px] font-medium text-[#64748B] uppercase tracking-wider border border-[#B9EFDB]">
                      <th className="py-2 px-4 w-16 rounded-l-lg">Sr.</th>
                      <th className="py-2 px-4">Courier Service</th>
                      <th className="py-2 px-4">Mode</th>
                      <th className="py-2 px-4 rounded-r-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loading && filteredServices.length === 0 ? (
                      <tr><td colSpan={4} className="py-12 text-center text-sm font-semibold text-[#94A3B8]">No courier services found</td></tr>
                    ) : paginatedServices.map((svc, index) => {
                      const logo = getProviderLogo(svc.provider);
                      return (
                        <tr key={svc._id} className={`border-b border-[#E2E8F0] transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'}`}>
                          <td className="py-3.5 px-4 text-sm font-semibold text-[#0F172A]">{startIndex + index}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 overflow-hidden">
                                {logo ? (
                                  <img src={logo} alt={svc.provider} className="max-w-full max-h-full object-contain"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                ) : (
                                  <span className="text-[10px] font-bold text-[#94A3B8]">{svc.provider.charAt(0)}</span>
                                )}
                              </div>
                              <span className="text-[13px] font-semibold text-[#0F172A]">{svc.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-[#64748B]">
                            {svc.mode === 'Air' ? <Plane className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                          </td>
                          <td className="py-3.5 px-4">
                            <button type="button" onClick={() => toggleService(svc._id)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${svc.enabled ? 'bg-[#00A86B]' : 'bg-[#CBD5E1]'}`}>
                              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${svc.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalItems > 0 && (
                <DesktopPagination
                  page={page}
                  setPage={setPage}
                  totalPages={totalPages}
                  rowsPerPage={rowsPerPage}
                  setRowsPerPage={setRowsPerPage}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  totalItems={totalItems}
                />
              )}
            </div>

            {/* Mobile cards — only this scrolls */}
            <div className="md:hidden flex-1 min-h-0 flex flex-col bg-[#F8FAFC]">
              <div className="flex-1 overflow-y-auto relative">
                {loading && <TableLoader />}
                {!loading && filteredServices.length === 0 ? (
                  <div className="p-8 text-center text-sm font-semibold text-[#94A3B8]">No courier services found</div>
                ) : (
                  <div className="p-2 space-y-2">
                    {paginatedServices.map((svc) => {
                      const logo = getProviderLogo(svc.provider);
                      return (
                        <div key={svc._id} className="flex items-center gap-3 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-3">
                          <div className="w-9 h-9 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 overflow-hidden">
                            {logo ? (
                              <img src={logo} alt={svc.provider} className="max-w-full max-h-full object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <span className="text-[11px] font-bold text-[#94A3B8]">{svc.provider.charAt(0)}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-bold text-[#0F172A] truncate">{svc.name}</div>
                            <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8] font-semibold mt-0.5">
                              {svc.mode === 'Air' ? <Plane className="w-3 h-3" /> : <Truck className="w-3 h-3" />} {svc.mode}
                            </div>
                          </div>
                          <button type="button" onClick={() => toggleService(svc._id)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full shrink-0 transition-colors ${svc.enabled ? 'bg-[#00A86B]' : 'bg-[#CBD5E1]'}`}>
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${svc.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {totalItems > 0 && (
                <MobilePaginationBar
                  page={page}
                  setPage={setPage}
                  totalPages={totalPages}
                  rowsPerPage={rowsPerPage}
                  setRowsPerPage={setRowsPerPage}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  totalItems={totalItems}
                />
              )}
            </div>
          </>
        )}

        {activeTab === 'priority' && (
          <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 py-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 max-w-[900px]">
            <h2 className="text-[15px] font-bold text-[#0F172A]">Courier Priority</h2>
            <p className="text-[13px] text-[#64748B] mt-0.5 mb-5">Set your courier priority ranking for order assignment.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PRIORITY_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isSelected = priorityMode === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setPriorityMode(opt.key)}
                    className={`relative flex flex-col items-center gap-2.5 rounded-xl border p-5 transition-all ${isSelected ? 'border-[#00A86B] bg-[#F0FDF4]' : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'}`}
                  >
                    {isSelected && (
                      <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#00A86B] flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" fill="currentColor" />
                      </span>
                    )}
                    <span className="w-10 h-10 rounded-full bg-[#00A86B] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </span>
                    <span className="text-[14px] font-bold text-[#0F172A]">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end mt-6">
              <button className="h-10 px-6 rounded-lg bg-[#00A86B] text-white text-[13px] font-bold hover:bg-[#009B63] transition-colors shadow-sm flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Save
              </button>
            </div>
          </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
