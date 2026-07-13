import React, { useState, useEffect, useRef, useMemo } from 'react';
import { apiClient } from '../../services/apiClient';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import {
  LayoutGrid, Truck, Clock, Plus, Edit2, Trash2,
  X, CheckCircle2, AlertCircle, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const formatTo12H = (time24: string) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};

export function AdminEPDMapping() {
  const [globalSearchQuery, setGlobalSearchQuery] = useState((window as any).__adminSearchQuery?.toLowerCase() || '');
  React.useEffect(() => {
    const h = (e: Event) => setGlobalSearchQuery(((e as CustomEvent).detail || '').toLowerCase());
    window.addEventListener('admin-search', h);
    setGlobalSearchQuery(((window as any).__adminSearchQuery || '').toLowerCase());
    return () => window.removeEventListener('admin-search', h);
  }, []);

  const [data, setData] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editMapping, setEditMapping] = useState<any | null>(null);
  const [deleteMapping, setDeleteMapping] = useState<any | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Add form
  const [addForm, setAddForm] = useState({ couriers: [] as string[], serviceNames: [] as string[], cutoffTime: '10:00' });
  const [isAddCourierOpen, setIsAddCourierOpen] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const addCourierRef = useRef<HTMLDivElement>(null);
  const addServiceRef = useRef<HTMLDivElement>(null);

  // Edit form
  const [editForm, setEditForm] = useState({ courier: '', serviceName: '', cutoffTime: '10:00' });
  const [isEditCourierOpen, setIsEditCourierOpen] = useState(false);
  const [isEditServiceOpen, setIsEditServiceOpen] = useState(false);
  const editCourierRef = useRef<HTMLDivElement>(null);
  const editServiceRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (addCourierRef.current && !addCourierRef.current.contains(e.target as Node)) setIsAddCourierOpen(false);
      if (addServiceRef.current && !addServiceRef.current.contains(e.target as Node)) setIsAddServiceOpen(false);
      if (editCourierRef.current && !editCourierRef.current.contains(e.target as Node)) setIsEditCourierOpen(false);
      if (editServiceRef.current && !editServiceRef.current.contains(e.target as Node)) setIsEditServiceOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/EPD/maps');
      setData(res.data || []);
    } catch {
      showToast('Failed to load EPD mappings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    apiClient.get('/EDD/getAllCourier').then(r => setCouriers(r.data || [])).catch(() => {});
    apiClient.get('/EDD/getAllCourierService').then(r => setAllServices(r.data || [])).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFilteredServices = useMemo(() => {
    if (addForm.couriers.length === 0) return [];
    return allServices.filter((s: any) => {
      const isSelected = addForm.couriers.includes(s.provider);
      const alreadyMapped = data.some(d => d.courier === s.provider && d.serviceName === s.name);
      return isSelected && !alreadyMapped;
    });
  }, [addForm.couriers, allServices, data]);

  const addUniqueServiceNames = useMemo(
    () => [...new Set(addFilteredServices.map((s: any) => s.name as string))],
    [addFilteredServices]
  );

  const editFilteredServices = useMemo(() => {
    if (!editForm.courier) return [];
    return allServices.filter((s: any) => s.provider === editForm.courier);
  }, [editForm.courier, allServices]);

  const filteredData = useMemo(() => data.filter(row => {
    const local = !searchQuery || row.courier?.toLowerCase().includes(searchQuery.toLowerCase()) || row.serviceName?.toLowerCase().includes(searchQuery.toLowerCase());
    const global = !globalSearchQuery || row.courier?.toLowerCase().includes(globalSearchQuery) || row.serviceName?.toLowerCase().includes(globalSearchQuery);
    return local && global;
  }), [data, searchQuery, globalSearchQuery]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addForm.couriers.length === 0 || addForm.serviceNames.length === 0) {
      showToast('Select at least one courier and one service.', 'error');
      return;
    }
    try {
      setLoading(true);
      const pairs: any[] = [];
      addForm.serviceNames.forEach(sName => {
        addFilteredServices.filter((fs: any) => fs.name === sName).forEach((ms: any) => {
          pairs.push({ courier: ms.provider, serviceName: ms.name, cutoffTime: addForm.cutoffTime });
        });
      });
      await Promise.all(pairs.map(p => apiClient.post('/EPD/add', p)));
      showToast(`Added ${pairs.length} EPD mapping(s)!`);
      setIsAddOpen(false);
      setAddForm({ couriers: [], serviceNames: [], cutoffTime: '10:00' });
      await fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to add.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.courier || !editForm.serviceName) { showToast('Courier and Service are required.', 'error'); return; }
    try {
      setLoading(true);
      await apiClient.put(`/EPD/update/${editMapping._id}`, {
        courier: editForm.courier,
        serviceName: editForm.serviceName,
        cutoffTime: editForm.cutoffTime,
      });
      showToast('EPD mapping updated!');
      setEditMapping(null);
      await fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteMapping) return;
    try {
      setLoading(true);
      await apiClient.delete(`/EPD/delete/${deleteMapping._id}`);
      showToast(`Deleted EPD mapping for ${deleteMapping.courier}`, 'error');
      setDeleteMapping(null);
      await fetchData();
    } catch {
      showToast('Failed to delete.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleAddCourier = (name: string) => setAddForm(prev => ({
    ...prev,
    couriers: prev.couriers.includes(name) ? prev.couriers.filter(c => c !== name) : [...prev.couriers, name],
    serviceNames: [],
  }));
  const toggleAllAddCouriers = () => setAddForm(prev => ({
    ...prev,
    couriers: prev.couriers.length === couriers.length ? [] : couriers.map((c: any) => c.courierProvider),
    serviceNames: [],
  }));
  const toggleAddService = (name: string) => setAddForm(prev => ({
    ...prev,
    serviceNames: prev.serviceNames.includes(name) ? prev.serviceNames.filter(s => s !== name) : [...prev.serviceNames, name],
  }));
  const toggleAllAddServices = () => setAddForm(prev => ({
    ...prev,
    serviceNames: prev.serviceNames.length === addUniqueServiceNames.length ? [] : [...addUniqueServiceNames],
  }));

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">
        <div className="bg-white shadow-xs relative z-50 shrink-0">
          <div className="px-6 py-4 border-b border-[#E2E8F0] flex justify-between items-center">
            <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">EPD Mapping</h1>
            <button
              onClick={() => { setAddForm({ couriers: [], serviceNames: [], cutoffTime: '10:00' }); setIsAddOpen(true); }}
              className="h-9 px-4 rounded-[14px] bg-[#00A86B] text-white text-[12px] font-bold hover:bg-[#009B63] transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Cutoff Time
            </button>
          </div>
          <div className="p-4 border-b border-[#E2E8F0] flex flex-wrap gap-3 justify-between items-center bg-white">
            <div className="flex items-center gap-4">
              <div className="text-xs font-bold text-[#475569]">{filteredData.length} Records Found</div>
              <input type="text" placeholder="Search couriers..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[180px]" />
            </div>
          </div>
        </div>

        <div className="bg-white flex flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
          <div className="flex-1 overflow-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="sticky top-0 z-40 bg-[#E6F5F1] shadow-sm">
                <tr className="text-[10px] font-extrabold text-[#00A86B] uppercase tracking-wider">
                  <th className="p-4 whitespace-nowrap"><LayoutGrid className="w-3.5 h-3.5 inline mr-1" /> Courier</th>
                  <th className="p-4 whitespace-nowrap"><Truck className="w-3.5 h-3.5 inline mr-1" /> Courier Services</th>
                  <th className="p-4 whitespace-nowrap"><Clock className="w-3.5 h-3.5 inline mr-1" /> Cutoff Time (IST)</th>
                  <th className="p-4 whitespace-nowrap text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[11px] text-[#475569] font-bold">
                {loading && (
                  <tr><td colSpan={4} className="p-10 text-center text-[#94A3B8]">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin text-[#00A86B]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Loading EPD mappings...
                    </div>
                  </td></tr>
                )}
                {!loading && filteredData.map(row => (
                  <tr key={row._id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 flex items-center justify-center shrink-0">
                          <img src={getCourierLogo(row.serviceName || row.courier)} alt={row.courier}
                            className="w-full h-full object-contain mix-blend-multiply"
                            onError={e => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(row.courier)}&background=f8fafc&color=0f172a&bold=true&font-size=0.4`;
                              (e.target as HTMLImageElement).className = 'w-full h-full object-cover rounded-full border border-[#E2E8F0]';
                            }} />
                        </div>
                        <div className="font-bold text-[#0F172A] text-[12px] uppercase">{row.courier}</div>
                      </div>
                    </td>
                    <td className="p-4 text-[#475569] font-bold text-[12px]">{row.serviceName}</td>
                    <td className="p-4">
                      <span className="text-[#00A86B] font-bold text-[12px]">{formatTo12H(row.cutoffTime)}</span>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditMapping(row); setEditForm({ courier: row.courier, serviceName: row.serviceName, cutoffTime: row.cutoffTime || '10:00' }); }}
                          className="w-8 h-8 rounded-full border border-[#E2E8F0] bg-white text-[#64748B] flex items-center justify-center hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteMapping(row)}
                          className="w-8 h-8 rounded-full border border-red-100 bg-white text-red-500 flex items-center justify-center hover:text-white hover:bg-red-600 hover:border-red-600 transition-all shadow-sm">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filteredData.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-[#94A3B8] font-semibold">No EPD mapping records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ADD MODAL */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsAddOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] w-full max-w-lg z-10 flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <Plus className="w-4.5 h-4.5 text-[#00A86B]" /> Add EPD Mapping
                </h3>
                <button onClick={() => setIsAddOpen(false)} className="w-7 h-7 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:bg-slate-50">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                <div className="flex gap-3">
                  {/* Courier multi-select */}
                  <div className="flex-1 relative" ref={addCourierRef}>
                    <label className="block text-[10px] font-bold text-[#475569] mb-1.5">Couriers *</label>
                    <button type="button" onClick={() => setIsAddCourierOpen(p => !p)}
                      className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs text-left flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-[#00A86B] bg-white">
                      <span className="truncate text-[#475569]">
                        {addForm.couriers.length === 0 ? 'Select Couriers' : addForm.couriers.length === couriers.length ? 'All Couriers' : addForm.couriers.length > 2 ? `${addForm.couriers.length} Selected` : addForm.couriers.join(', ')}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                    </button>
                    {isAddCourierOpen && (
                      <div className="absolute z-50 mt-1 w-full max-h-48 overflow-auto border border-[#E2E8F0] rounded-lg bg-white shadow-lg">
                        <div onClick={toggleAllAddCouriers} className="px-3 py-2 text-xs font-bold text-[#0F172A] border-b border-[#E2E8F0] cursor-pointer hover:bg-[#F8FAFC] flex items-center gap-2">
                          <input type="checkbox" readOnly checked={addForm.couriers.length === couriers.length && couriers.length > 0} className="accent-[#00A86B]" /> Select All
                        </div>
                        {couriers.map((c: any) => (
                          <div key={c._id} onClick={() => toggleAddCourier(c.courierProvider)} className="px-3 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F0FFF8] cursor-pointer flex items-center gap-2">
                            <input type="checkbox" readOnly checked={addForm.couriers.includes(c.courierProvider)} className="accent-[#00A86B]" /> {c.courierProvider}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Service multi-select */}
                  <div className="flex-1 relative" ref={addServiceRef}>
                    <label className="block text-[10px] font-bold text-[#475569] mb-1.5">Courier Services *</label>
                    <button type="button" onClick={() => setIsAddServiceOpen(p => !p)} disabled={addForm.couriers.length === 0}
                      className={`w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs text-left flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-[#00A86B] bg-white ${addForm.couriers.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <span className="truncate text-[#475569]">
                        {addForm.serviceNames.length === 0 ? 'Select Services' : addForm.serviceNames.length === addUniqueServiceNames.length ? 'All Services' : addForm.serviceNames.length > 2 ? `${addForm.serviceNames.length} Selected` : addForm.serviceNames.join(', ')}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                    </button>
                    {isAddServiceOpen && (
                      <div className="absolute z-50 mt-1 w-full max-h-48 overflow-auto border border-[#E2E8F0] rounded-lg bg-white shadow-lg">
                        <div onClick={toggleAllAddServices} className="px-3 py-2 text-xs font-bold text-[#0F172A] border-b border-[#E2E8F0] cursor-pointer hover:bg-[#F8FAFC] flex items-center gap-2">
                          <input type="checkbox" readOnly checked={addForm.serviceNames.length === addUniqueServiceNames.length && addUniqueServiceNames.length > 0} className="accent-[#00A86B]" /> Select All
                        </div>
                        {addUniqueServiceNames.length === 0 ? (
                          <div className="p-3 text-xs text-[#94A3B8] text-center">No unmapped services available</div>
                        ) : (
                          addUniqueServiceNames.map(name => (
                            <div key={name} onClick={() => toggleAddService(name)} className="px-3 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F0FFF8] cursor-pointer flex items-center gap-2">
                              <input type="checkbox" readOnly checked={addForm.serviceNames.includes(name)} className="accent-[#00A86B]" /> {name}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold text-[#475569]">Cutoff Time (HH:mm)</label>
                    <span className="text-[10px] font-bold text-[#00A86B] bg-green-50 px-2 py-0.5 rounded border border-green-100 italic">
                      {formatTo12H(addForm.cutoffTime)}
                    </span>
                  </div>
                  <input type="time" required
                    className="w-full h-10 px-3 py-2 text-xs border rounded-lg border-[#E2E8F0] focus:outline-none focus:ring-1 focus:ring-[#00A86B] bg-white"
                    value={addForm.cutoffTime}
                    onChange={e => setAddForm(prev => ({ ...prev, cutoffTime: e.target.value }))} />
                  <p className="text-[10px] text-[#94A3B8] italic">
                    * Shipments booked after this time will be scheduled for next day pickup.
                  </p>
                </div>

                <div className="flex gap-3 pt-4 border-t border-[#E2E8F0]">
                  <button type="button" onClick={() => setIsAddOpen(false)} className="flex-1 h-9 rounded-xl border border-[#E2E8F0] text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                  <button type="submit" disabled={loading} className="flex-1 h-9 rounded-xl bg-[#00A86B] hover:bg-[#009B63] text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50">
                    {loading ? 'Saving...' : 'Add Mapping'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {editMapping && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setEditMapping(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] w-full max-w-lg z-10 flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <Edit2 className="w-4.5 h-4.5 text-indigo-600" /> Edit EPD Mapping
                </h3>
                <button onClick={() => setEditMapping(null)} className="w-7 h-7 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:bg-slate-50">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                <div className="flex gap-3">
                  {/* Courier single-select */}
                  <div className="flex-1 relative" ref={editCourierRef}>
                    <label className="block text-[10px] font-bold text-[#475569] mb-1.5">Courier *</label>
                    <button type="button" onClick={() => setIsEditCourierOpen(p => !p)}
                      className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs text-left flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-[#00A86B] bg-white">
                      <span className="truncate text-[#475569]">{editForm.courier || 'Select Courier'}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                    </button>
                    {isEditCourierOpen && (
                      <ul className="absolute z-50 mt-1 w-full max-h-48 overflow-auto border border-[#E2E8F0] rounded-lg bg-white shadow-lg">
                        {couriers.map((c: any) => (
                          <li key={c._id} onClick={() => { setEditForm(prev => ({ ...prev, courier: c.courierProvider, serviceName: '' })); setIsEditCourierOpen(false); }}
                            className="px-3 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F0FFF8] cursor-pointer">
                            {c.courierProvider}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Service single-select */}
                  <div className="flex-1 relative" ref={editServiceRef}>
                    <label className="block text-[10px] font-bold text-[#475569] mb-1.5">Courier Service *</label>
                    <button type="button" onClick={() => setIsEditServiceOpen(p => !p)} disabled={!editForm.courier}
                      className={`w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs text-left flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-[#00A86B] bg-white ${!editForm.courier ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <span className="truncate text-[#475569]">{editForm.serviceName || 'Select Service'}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                    </button>
                    {isEditServiceOpen && (
                      <ul className="absolute z-50 mt-1 w-full max-h-48 overflow-auto border border-[#E2E8F0] rounded-lg bg-white shadow-lg">
                        {editFilteredServices.length === 0 ? (
                          <li className="p-3 text-xs text-[#94A3B8] text-center">No services available</li>
                        ) : (
                          editFilteredServices.map((s: any) => (
                            <li key={s._id} onClick={() => { setEditForm(prev => ({ ...prev, serviceName: s.name })); setIsEditServiceOpen(false); }}
                              className="px-3 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F0FFF8] cursor-pointer">
                              {s.name}
                            </li>
                          ))
                        )}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold text-[#475569]">Cutoff Time (HH:mm)</label>
                    <span className="text-[10px] font-bold text-[#00A86B] bg-green-50 px-2 py-0.5 rounded border border-green-100 italic">
                      {formatTo12H(editForm.cutoffTime)}
                    </span>
                  </div>
                  <input type="time" required
                    className="w-full h-10 px-3 py-2 text-xs border rounded-lg border-[#E2E8F0] focus:outline-none focus:ring-1 focus:ring-[#00A86B] bg-white"
                    value={editForm.cutoffTime}
                    onChange={e => setEditForm(prev => ({ ...prev, cutoffTime: e.target.value }))} />
                </div>

                <div className="flex gap-3 pt-4 border-t border-[#E2E8F0]">
                  <button type="button" onClick={() => setEditMapping(null)} className="flex-1 h-9 rounded-xl border border-[#E2E8F0] text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                  <button type="submit" disabled={loading} className="flex-1 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50">
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE MODAL */}
      <AnimatePresence>
        {deleteMapping && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setDeleteMapping(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] w-full max-w-sm z-10 p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0F172A]">Delete Mapping</h3>
                <p className="text-xs text-[#64748B] mt-2">
                  Delete EPD mapping for <strong className="text-[#0F172A]">{deleteMapping.courier} – {deleteMapping.serviceName}</strong>? This cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setDeleteMapping(null)} className="flex-1 h-10 rounded-xl border border-[#E2E8F0] text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                <button onClick={confirmDelete} disabled={loading} className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50">
                  {loading ? 'Deleting...' : 'Delete Mapping'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border min-w-[300px] max-w-md ${toast.type === 'success' ? 'bg-slate-900 border-white/10 text-white' : 'bg-rose-950 border-rose-800 text-rose-100'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-emerald-500/20 text-[#34D399]' : 'bg-rose-500/20 text-rose-300'}`}>
              {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            </div>
            <p className="text-[12px] font-bold leading-snug flex-1">{toast.message}</p>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
