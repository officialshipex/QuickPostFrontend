import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { 
  Search, RefreshCcw, User, 
  MoreVertical, Edit2, Trash2, LayoutGrid,
  MapPin, Truck, Plus, X, CheckCircle2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EDDMapping {
  id: string;
  courier: string;
  logoUrl: string;
  service: string;
  zoneA: string;
  zoneB: string;
  zoneC: string;
  zoneD: string;
  zoneE: string;
}

const INITIAL_DATA: EDDMapping[] = [
  { id: '1', courier: 'Delhivery', logoUrl: 'https://ui-avatars.com/api/?name=Delhivery&background=ef4444&color=fff&rounded=true&bold=true', service: 'Delhivery Surface 0.5KG', zoneA: '2', zoneB: '3', zoneC: '4', zoneD: '5', zoneE: '6' },
  { id: '2', courier: 'BlueDart', logoUrl: 'https://ui-avatars.com/api/?name=Blue+Dart&background=3b82f6&color=fff&rounded=true&bold=true', service: 'BlueDart Air 0.5KG', zoneA: '1', zoneB: '2', zoneC: '3', zoneD: '4', zoneE: '5' },
  { id: '3', courier: 'Xpressbees', logoUrl: 'https://ui-avatars.com/api/?name=Xpressbees&background=f59e0b&color=fff&rounded=true&bold=true', service: 'Xpressbees Surface 1KG', zoneA: '2', zoneB: '3', zoneC: '5', zoneD: '6', zoneE: '7' },
  { id: '4', courier: 'Ecom Express', logoUrl: 'https://ui-avatars.com/api/?name=Ecom+Express&background=10b981&color=fff&rounded=true&bold=true', service: 'Ecom Express Surface 0.5KG', zoneA: '2', zoneB: '3', zoneC: '4', zoneD: '5', zoneE: '6' },
  { id: '5', courier: 'Shadowfax', logoUrl: 'https://ui-avatars.com/api/?name=Shadowfax&background=8b5cf6&color=fff&rounded=true&bold=true', service: 'Shadowfax Surface 2KG', zoneA: '1', zoneB: '2', zoneC: '3', zoneD: '4', zoneE: '5' },
  { id: '6', courier: 'DTDC', logoUrl: 'https://ui-avatars.com/api/?name=DTDC&background=dc2626&color=fff&rounded=true&bold=true', service: 'DTDC Express 0.5KG', zoneA: '2', zoneB: '3', zoneC: '4', zoneD: '5', zoneE: '6' },
  { id: '7', courier: 'Amazon Shipping', logoUrl: 'https://ui-avatars.com/api/?name=Amazon&background=1f2937&color=fff&rounded=true&bold=true', service: 'Amazon Shipping 1KG', zoneA: '1', zoneB: '2', zoneC: '3', zoneD: '4', zoneE: '5' },
  { id: '8', courier: 'Ekart Logistics', logoUrl: 'https://ui-avatars.com/api/?name=Ekart&background=0ea5e9&color=fff&rounded=true&bold=true', service: 'Ekart Surface 0.5KG', zoneA: '2', zoneB: '4', zoneC: '5', zoneD: '6', zoneE: '7' }
];

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

export function AdminEDDMapping() {
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

  const [mappings, setMappings] = useState<EDDMapping[]>(INITIAL_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editMapping, setEditMapping] = useState<EDDMapping | null>(null);
  const [deleteMapping, setDeleteMapping] = useState<EDDMapping | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Forms
  const [formData, setFormData] = useState<Partial<EDDMapping>>({
    courier: '', service: '', zoneA: '', zoneB: '', zoneC: '', zoneD: '', zoneE: ''
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredMappings = mappings.filter(m => {
    const matchesSearch = m.courier.toLowerCase().includes(searchQuery.toLowerCase()) || m.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGlobalSearch = globalSearchQuery === '' || m.courier.toLowerCase().includes(globalSearchQuery) || m.service.toLowerCase().includes(globalSearchQuery);
    return matchesSearch && matchesGlobalSearch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courier || !formData.service) {
      showToast("Courier and Service are required", "error");
      return;
    }

    if (editMapping) {
      setMappings(prev => prev.map(m => m.id === editMapping.id ? { ...m, ...formData } as EDDMapping : m));
      showToast(`Successfully updated ${formData.courier}`);
      setEditMapping(null);
    } else {
      const newMapping: EDDMapping = {
        ...(formData as EDDMapping),
        id: Math.random().toString(36).substr(2, 9),
        logoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.courier!)}&background=00A86B&color=fff&rounded=true&bold=true`
      };
      setMappings([newMapping, ...mappings]);
      showToast(`Successfully added ${formData.courier}`);
      setIsAddOpen(false);
    }
    setFormData({ courier: '', service: '', zoneA: '', zoneB: '', zoneC: '', zoneD: '', zoneE: '' });
  };

  const confirmDelete = () => {
    if (deleteMapping) {
      setMappings(prev => prev.filter(m => m.id !== deleteMapping.id));
      showToast(`Deleted mapping for ${deleteMapping.courier}`, 'error');
      setDeleteMapping(null);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">
        <div className="bg-white shadow-xs relative z-50 shrink-0">

        {/* Page Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] bg-white flex justify-between items-center z-50 relative shrink-0">
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">EDD Mapping</h1>
          <button 
            onClick={() => { setEditMapping(null); setFormData({ courier: '', service: '', zoneA: '', zoneB: '', zoneC: '', zoneD: '', zoneE: '' }); setIsAddOpen(true); }}
            className="h-9 px-4 rounded-[14px] bg-[#00A86B] text-white text-[12px] font-bold hover:bg-[#009B63] transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Rule
          </button>
        </div>
        
        {/* Filter and Action Row */}
        <div className="p-4 border-b border-[#E2E8F0] flex flex-wrap gap-3 justify-between items-center bg-white">
          <div className="flex items-center gap-4">
            <div className="text-xs font-bold text-[#475569]">
              {filteredMappings.length} Courier Services Found
            </div>
            <input 
              type="text" 
              placeholder="Search couriers..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[180px] shrink-0" 
            />
          </div>
          
          <div className="flex items-center gap-2.5">
            <button className="h-8.5 px-3 rounded-lg border border-[#E2E8F0] text-xs font-bold text-[#475569] hover:bg-[#F8FAFC] transition-colors shadow-sm flex items-center gap-1.5">
              <RefreshCcw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white flex flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
        <div className="flex-1 overflow-auto no-scrollbar relative">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 z-40 bg-[#E6F5F1] shadow-sm">
              <tr className="text-[10px] font-extrabold text-[#00A86B] uppercase tracking-wider">
                <th className="p-4 whitespace-nowrap"><LayoutGrid className="w-3.5 h-3.5 inline mr-1"/> Courier</th>
                <th className="p-4 whitespace-nowrap"><Truck className="w-3.5 h-3.5 inline mr-1"/> Courier Services</th>
                <th className="p-4 whitespace-nowrap text-center"><MapPin className="w-3.5 h-3.5 inline mr-1"/> Zone A</th>
                <th className="p-4 whitespace-nowrap text-center"><MapPin className="w-3.5 h-3.5 inline mr-1"/> Zone B</th>
                <th className="p-4 whitespace-nowrap text-center"><MapPin className="w-3.5 h-3.5 inline mr-1"/> Zone C</th>
                <th className="p-4 whitespace-nowrap text-center"><MapPin className="w-3.5 h-3.5 inline mr-1"/> Zone D</th>
                <th className="p-4 whitespace-nowrap text-center"><MapPin className="w-3.5 h-3.5 inline mr-1"/> Zone E</th>
                <th className="p-4 whitespace-nowrap text-right pr-6"><MoreVertical className="w-3.5 h-3.5 inline mr-1"/> Actions</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-[#475569] font-bold">
              {filteredMappings.map((row) => (
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
                  <td className="p-4 text-center">
                    <span className="text-[#0F172A] font-bold text-[12px]">{row.zoneA} Days</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-[#0F172A] font-bold text-[12px]">{row.zoneB} Days</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-[#0F172A] font-bold text-[12px]">{row.zoneC} Days</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-[#0F172A] font-bold text-[12px]">{row.zoneD} Days</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-[#0F172A] font-bold text-[12px]">{row.zoneE} Days</span>
                  </td>
                  <td className="p-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => {
                          setFormData(row);
                          setEditMapping(row);
                        }}
                        className="w-8 h-8 rounded-full border border-[#E2E8F0] bg-white text-[#64748B] flex items-center justify-center hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setDeleteMapping(row)}
                        className="w-8 h-8 rounded-full border border-red-100 bg-white text-red-500 flex items-center justify-center hover:text-white hover:bg-red-600 hover:border-red-600 transition-all shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMappings.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#94A3B8] font-semibold">
                    No mapping records found for your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Form Modal (Add / Edit) */}
      <AnimatePresence>
        {(isAddOpen || editMapping) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs" 
              onClick={() => { setIsAddOpen(false); setEditMapping(null); }} 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden w-full max-w-lg z-10 flex flex-col"
            >
              <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  {editMapping ? <Edit2 className="w-4.5 h-4.5 text-indigo-600" /> : <Plus className="w-4.5 h-4.5 text-[#00A86B]" />} 
                  {editMapping ? 'Edit EDD Mapping' : 'Add New EDD Mapping'}
                </h3>
                <button 
                  onClick={() => { setIsAddOpen(false); setEditMapping(null); }} 
                  className="w-7 h-7 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:bg-slate-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#475569] mb-1.5">Courier Name *</label>
                    <input 
                      type="text" required
                      value={formData.courier} onChange={e => setFormData({...formData, courier: e.target.value})}
                      className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-1 focus:ring-[#00A86B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#475569] mb-1.5">Service Name *</label>
                    <input 
                      type="text" required
                      value={formData.service} onChange={e => setFormData({...formData, service: e.target.value})}
                      className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-1 focus:ring-[#00A86B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#475569] mb-2 uppercase tracking-wider">Estimated Days (Zone Wise)</label>
                  <div className="grid grid-cols-5 gap-3">
                    {['A', 'B', 'C', 'D', 'E'].map(zone => (
                      <div key={zone}>
                        <label className="block text-[9px] font-bold text-[#64748B] mb-1 text-center">Zone {zone}</label>
                        <input 
                          type="number" min="1" max="30" required
                          value={(formData as any)[`zone${zone}`] || ''} 
                          onChange={e => setFormData({...formData, [`zone${zone}`]: e.target.value})}
                          className="w-full h-9 text-center rounded-lg border border-[#E2E8F0] text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#00A86B]"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-[#E2E8F0] mt-4">
                  <button 
                    type="button" 
                    onClick={() => { setIsAddOpen(false); setEditMapping(null); }}
                    className="flex-1 h-9 rounded-xl border border-[#E2E8F0] text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className={`flex-1 h-9 rounded-xl text-white text-xs font-bold shadow-sm transition-colors ${editMapping ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-[#00A86B] hover:bg-[#009B63]'}`}
                  >
                    {editMapping ? 'Save Changes' : 'Add Mapping'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteMapping && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs" 
              onClick={() => setDeleteMapping(null)} 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden w-full max-w-sm z-10 flex flex-col p-6 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0F172A]">Delete Mapping</h3>
                <p className="text-xs text-[#64748B] mt-2">
                  Are you sure you want to delete the EDD mapping for <strong className="text-[#0F172A]">{deleteMapping.courier}</strong>? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setDeleteMapping(null)}
                  className="flex-1 h-10 rounded-xl border border-[#E2E8F0] text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  Delete Mapping
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border min-w-[300px] max-w-md ${
              toast.type === 'success' ? 'bg-slate-900 border-white/10 text-white' : 'bg-rose-950 border-rose-800 text-rose-100'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              toast.type === 'success' ? 'bg-emerald-500/20 text-[#34D399]' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            </div>
            <p className="text-[12px] font-bold leading-snug flex-1">{toast.message}</p>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </AdminLayout>
  );
}
