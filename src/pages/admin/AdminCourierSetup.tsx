import { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Search, Truck, Plane, Zap, IndianRupee, Settings2, CheckCircle2, GripVertical } from 'lucide-react';
import { usePagination, DesktopPagination } from '../../hooks/usePagination';
import { MobilePaginationBar } from '../../hooks/useMobilePaginationBar';
import { TableLoader } from '../../components/ui/TableLoader';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { apiClient } from '../../services/apiClient';

type SetupTab = 'selection' | 'priority';
type PriorityMode = 'Fastest' | 'Cheapest' | 'Custom';

interface CourierServiceRow {
  _id: string;
  name: string;
  provider: string;
  mode: string;
  status: 'Active' | 'Inactive';
}

interface CourierItem {
  id: string;
  name: string;
  provider: string;
  mode: string;
}

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
  if (n.includes('bluedart')) return '/brands/bluedart.png';
  if (n.includes('ecom')) return '/brands/ecom_express.png';
  return '';
};

const PRIORITY_OPTIONS: { key: PriorityMode; label: string; icon: any }[] = [
  { key: 'Fastest', label: 'Fastest', icon: Truck },
  { key: 'Cheapest', label: 'Cheapest', icon: IndianRupee },
  { key: 'Custom', label: 'Custom', icon: Settings2 },
];

export function AdminCourierSetup() {
  const [activeTab, setActiveTab] = useState<SetupTab>('selection');
  const [couriers, setCouriers] = useState<CourierServiceRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Priority state
  const [priorityMode, setPriorityMode] = useState<PriorityMode>('Cheapest');
  const [allCourierItems, setAllCourierItems] = useState<CourierItem[]>([]);
  const [customPriority, setCustomPriority] = useState<CourierItem[]>([]);
  const [availableCouriers, setAvailableCouriers] = useState<CourierItem[]>([]);
  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [prioritySaving, setPrioritySaving] = useState(false);

  const { toast, showToast: _showToast, closeToast } = useToast();
  const showToast = (msg: string, ok = true) => _showToast(ok ? 'success' : 'error', msg);

  // Drag state for custom priority
  const dragSrc = useRef<{ list: 'custom' | 'available'; index: number } | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/courier/getCourierServices');
      const data = res.data?.data || {};
      const rateCard: any[] = data.rateCard || [];
      const courierPriority: any[] = data.courierPriority || [];
      const priorityType: PriorityMode = data.priorityType || 'Cheapest';

      const mapped: CourierServiceRow[] = rateCard.map((c: any, i: number) => ({
        _id: String(i),
        name: c.courierServiceName || '-',
        provider: c.courierProviderName || '-',
        mode: c.mode || 'Surface',
        status: c.status === 'Active' ? 'Active' : 'Inactive',
      }));
      setCouriers(mapped);

      const allItems: CourierItem[] = rateCard.map((c: any, i: number) => ({
        id: String(i),
        name: c.courierServiceName || '-',
        provider: c.courierProviderName || '-',
        mode: c.mode || 'Surface',
      }));
      setAllCourierItems(allItems);

      if (courierPriority && courierPriority.length > 0) {
        const custom: CourierItem[] = courierPriority.map((c: any, i: number) => {
          const match = allItems.find(a => a.name === c.name);
          return match ?? { id: String(i + 9000), name: c.name || '-', provider: c.provider || '-', mode: c.mode || '-' };
        });
        const available = allItems.filter(a => !custom.some(p => p.name === a.name));
        setCustomPriority(custom);
        setAvailableCouriers(available);
        setPriorityMode('Custom');
      } else {
        setCustomPriority([]);
        setAvailableCouriers(allItems);
        setPriorityMode(priorityType);
      }
    } catch {
      setCouriers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const filteredCouriers = couriers.filter(s => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.provider.toLowerCase().includes(q);
  });

  const { paginatedData: paginatedCouriers, page, setPage, totalPages, rowsPerPage, setRowsPerPage, startIndex, endIndex, totalItems } =
    usePagination({ data: filteredCouriers, perPage: 20 });

  const toggleStatus = async (id: string) => {
    const svc = couriers.find(s => s._id === id);
    if (!svc) return;
    const newStatus = svc.status === 'Active' ? 'Inactive' : 'Active';
    setCouriers(prev => prev.map(s => s._id === id ? { ...s, status: newStatus } : s));
    try {
      await apiClient.post('/courier/updateCourierServiceStatus', {
        courierProviderName: svc.provider,
        courierServiceName: svc.name,
        status: newStatus,
      });
      showToast(`${svc.name} ${newStatus === 'Active' ? 'enabled' : 'disabled'}`);
    } catch {
      setCouriers(prev => prev.map(s => s._id === id ? { ...s, status: svc.status } : s));
      showToast('Failed to update status', false);
    }
  };

  const handlePriorityModeSelect = (mode: PriorityMode) => {
    setPriorityMode(mode);
    if (mode !== 'Custom') setIsEditingCustom(false);
  };

  const handleEditCustom = () => {
    const alreadyInPriority = new Set(customPriority.map(c => c.name));
    setAvailableCouriers(allCourierItems.filter(c => !alreadyInPriority.has(c.name)));
    setIsEditingCustom(true);
  };

  const handleSavePriority = async () => {
    if (priorityMode === 'Custom' && customPriority.length === 0) {
      showToast('Drag couriers into the priority list before saving.', false);
      return;
    }
    setPrioritySaving(true);
    try {
      await apiClient.post('/courier/saveCourierPriority', {
        type: priorityMode,
        couriers: priorityMode === 'Custom' ? customPriority : availableCouriers,
      });
      showToast('Courier priority saved');
      setIsEditingCustom(false);
    } catch {
      showToast('Failed to save priority', false);
    } finally {
      setPrioritySaving(false);
    }
  };

  // Native HTML5 drag-and-drop helpers
  const onDragStart = (list: 'custom' | 'available', index: number) => {
    dragSrc.current = { list, index };
  };

  const onDrop = (destList: 'custom' | 'available', destIndex: number) => {
    if (!dragSrc.current) return;
    const { list: srcList, index: srcIndex } = dragSrc.current;
    dragSrc.current = null;

    if (srcList === destList) {
      const items = srcList === 'custom' ? [...customPriority] : [...availableCouriers];
      const [moved] = items.splice(srcIndex, 1);
      items.splice(destIndex, 0, moved);
      srcList === 'custom' ? setCustomPriority(items) : setAvailableCouriers(items);
    } else {
      const srcItems = srcList === 'custom' ? [...customPriority] : [...availableCouriers];
      const dstItems = destList === 'custom' ? [...customPriority] : [...availableCouriers];
      const [moved] = srcItems.splice(srcIndex, 1);
      dstItems.splice(destIndex, 0, moved);
      if (srcList === 'custom') {
        setCustomPriority(srcItems);
        setAvailableCouriers(dstItems);
      } else {
        setAvailableCouriers(srcItems);
        setCustomPriority(dstItems);
      }
    }
  };

  const onDropOnList = (destList: 'custom' | 'available') => {
    if (!dragSrc.current) return;
    const { list: srcList, index: srcIndex } = dragSrc.current;
    if (srcList === destList) return;
    dragSrc.current = null;
    const srcItems = srcList === 'custom' ? [...customPriority] : [...availableCouriers];
    const dstItems = destList === 'custom' ? [...customPriority] : [...availableCouriers];
    const [moved] = srcItems.splice(srcIndex, 1);
    dstItems.push(moved);
    if (srcList === 'custom') { setCustomPriority(srcItems); setAvailableCouriers(dstItems); }
    else { setAvailableCouriers(srcItems); setCustomPriority(dstItems); }
  };

  const CourierDragCard = ({ item, list, index }: { item: CourierItem; list: 'custom' | 'available'; index: number }) => {
    const logo = getProviderLogo(item.name);
    return (
      <div
        draggable
        onDragStart={() => onDragStart(list, index)}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.stopPropagation(); onDrop(list, index); }}
        className="flex items-center justify-between border border-[#E2E8F0] rounded-xl p-3 bg-white mb-2 cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 overflow-hidden">
            {logo ? (
              <img src={logo} alt={item.provider} className="max-w-full max-h-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <span className="text-[10px] font-bold text-[#94A3B8]">{item.provider.charAt(0)}</span>
            )}
          </div>
          <div>
            <div className="text-[12px] font-semibold text-[#0F172A]">{item.name}</div>
            <div className="text-[11px] text-[#94A3B8]">{item.mode}</div>
          </div>
        </div>
        <GripVertical className="w-4 h-4 text-[#CBD5E1]" />
      </div>
    );
  };

  return (
    <AdminLayout>
      <Toast toast={toast} onClose={closeToast} />
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">
        {/* Tabs + search */}
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
            {/* Desktop table */}
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
                    {!loading && filteredCouriers.length === 0 ? (
                      <tr><td colSpan={4} className="py-12 text-center text-sm font-semibold text-[#94A3B8]">No courier services found</td></tr>
                    ) : paginatedCouriers.map((svc, index) => {
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
                            {svc.mode?.toLowerCase().includes('air') ? <Plane className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                          </td>
                          <td className="py-3.5 px-4">
                            <button type="button" onClick={() => toggleStatus(svc._id)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${svc.status === 'Active' ? 'bg-[#00A86B]' : 'bg-[#CBD5E1]'}`}>
                              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${svc.status === 'Active' ? 'translate-x-5' : 'translate-x-0.5'}`} />
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

            {/* Mobile cards */}
            <div className="md:hidden flex-1 min-h-0 flex flex-col bg-[#F8FAFC]">
              <div className="flex-1 overflow-y-auto relative">
                {loading && <TableLoader />}
                {!loading && filteredCouriers.length === 0 ? (
                  <div className="p-8 text-center text-sm font-semibold text-[#94A3B8]">No courier services found</div>
                ) : (
                  <div className="p-2 space-y-2">
                    {paginatedCouriers.map((svc) => {
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
                              {svc.mode?.toLowerCase().includes('air') ? <Plane className="w-3 h-3" /> : <Truck className="w-3 h-3" />} {svc.mode}
                            </div>
                          </div>
                          <button type="button" onClick={() => toggleStatus(svc._id)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full shrink-0 transition-colors ${svc.status === 'Active' ? 'bg-[#00A86B]' : 'bg-[#CBD5E1]'}`}>
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${svc.status === 'Active' ? 'translate-x-5' : 'translate-x-0.5'}`} />
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

              {/* Mode selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {PRIORITY_OPTIONS.map(opt => {
                  const Icon = opt.icon;
                  const isSelected = priorityMode === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => handlePriorityModeSelect(opt.key)}
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

              {/* Custom priority drag-and-drop */}
              {priorityMode === 'Custom' && (
                <div className="mb-4">
                  {!isEditingCustom ? (
                    <>
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-[13px] font-semibold text-[#475569]">Edit to customize and reorder the courier ranking.</p>
                        <button
                          onClick={handleEditCustom}
                          className="px-4 py-1.5 text-[13px] font-semibold border border-[#00A86B] text-[#00A86B] rounded-lg hover:bg-[#00A86B] hover:text-white transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                      {customPriority.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto">
                          {customPriority.map((c, i) => {
                            const logo = getProviderLogo(c.name);
                            return (
                              <div key={c.id} className="relative flex items-center gap-3 border border-[#E2E8F0] rounded-xl px-4 py-3 bg-white">
                                <span className="absolute top-0 left-0 bg-[#00A86B] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-tl-xl rounded-br-lg">
                                  #{i + 1}
                                </span>
                                <div className="w-9 h-9 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 overflow-hidden">
                                  {logo ? (
                                    <img src={logo} alt={c.provider} className="max-w-full max-h-full object-contain"
                                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                  ) : (
                                    <span className="text-[10px] font-bold text-[#94A3B8]">{c.provider.charAt(0)}</span>
                                  )}
                                </div>
                                <div>
                                  <div className="text-[12px] font-semibold text-[#0F172A]">{c.name}</div>
                                  <div className="text-[11px] text-[#94A3B8]">{c.mode}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[13px] text-[#94A3B8]">No custom order set yet. Click Edit to configure.</p>
                      )}
                    </>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Custom priority list */}
                      <div
                        className="border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] h-[370px] flex flex-col"
                        onDragOver={e => e.preventDefault()}
                        onDrop={() => onDropOnList('custom')}
                      >
                        <h4 className="font-bold text-[13px] text-[#0F172A] p-4 pb-2 shrink-0">Custom Courier Priority</h4>
                        <div className="flex-1 overflow-y-auto px-4 pb-4">
                          {customPriority.length === 0 ? (
                            <div className="border-2 border-dashed border-[#E2E8F0] rounded-xl h-full flex items-center justify-center text-[12px] text-[#94A3B8] min-h-[80px]">
                              Drag couriers here to set priority
                            </div>
                          ) : (
                            customPriority.map((c, i) => (
                              <CourierDragCard key={c.id} item={c} list="custom" index={i} />
                            ))
                          )}
                        </div>
                      </div>

                      {/* Available couriers */}
                      <div
                        className="border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] h-[370px] flex flex-col"
                        onDragOver={e => e.preventDefault()}
                        onDrop={() => onDropOnList('available')}
                      >
                        <h4 className="font-bold text-[13px] text-[#0F172A] p-4 pb-2 shrink-0">Available Couriers</h4>
                        <div className="flex-1 overflow-y-auto px-4 pb-4">
                          {availableCouriers.map((c, i) => (
                            <CourierDragCard key={c.id} item={c} list="available" index={i} />
                          ))}
                        </div>
                      </div>

                      <div className="md:col-span-2 flex justify-end gap-2 mt-1">
                        <button
                          onClick={() => setIsEditingCustom(false)}
                          className="px-4 py-2 text-[13px] font-semibold border border-[#E2E8F0] text-[#64748B] rounded-lg hover:bg-[#F8FAFC] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSavePriority}
                          disabled={prioritySaving}
                          className="h-10 px-6 rounded-lg bg-[#00A86B] text-white text-[13px] font-bold hover:bg-[#009B63] disabled:opacity-50 transition-colors shadow-sm flex items-center gap-1.5"
                        >
                          <Zap className="w-3.5 h-3.5" /> {prioritySaving ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Save button for Fastest / Cheapest */}
              {priorityMode !== 'Custom' && (
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleSavePriority}
                    disabled={prioritySaving}
                    className="h-10 px-6 rounded-lg bg-[#00A86B] text-white text-[13px] font-bold hover:bg-[#009B63] disabled:opacity-50 transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" /> {prioritySaving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
