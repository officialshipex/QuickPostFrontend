import React, { useState, useMemo, useEffect, useRef } from 'react';
import { apiClient } from '../../services/apiClient';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { usePagination, DesktopPagination } from '../../hooks/usePagination';
import { TableLoader } from '../../components/ui/TableLoader';
import {
  Upload, Download, Briefcase,
  Plus, Edit3, Trash2, X, CheckCircle2, AlertCircle,
  ChevronDown, SlidersHorizontal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StatusMapRule {
  id: string;
  partner: string;
  scanType: string;
  scan: string;
  instructions: string;
  syStatus: string;
  processType: 'FORWARD' | 'REVERSE';
}

const META_KEYS = new Set(['_id', '__v', 'id', 'partnerName', 'partner', '$__', '$isNew', 'errors', '_doc']);

const getCourierLogo = (partner: string) => {
  const p = partner.toUpperCase();
  if (p.includes('DELHIVERY')) return '/brands/delhivery.png';
  if (p.includes('BLUEDART')) return '/brands/bluedart.png';
  if (p.includes('EKART')) return '/brands/ekart.png';
  if (p.includes('XPRESSBEES')) return '/brands/xpressbees.png';
  if (p.includes('SHREE MARUTI')) return '/brands/shree_maruti.jpg';
  if (p.includes('DTDC')) return '/brands/dtdc.png';
  if (p.includes('SHADOWFAX')) return '/brands/shadowfax.png';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(partner)}&background=f8fafc&color=0f172a&bold=true&font-size=0.4`;
};

export function AdminStatusMap() {
  const [globalSearchQuery, setGlobalSearchQuery] = useState((window as any).__adminSearchQuery?.toLowerCase() || '');
  React.useEffect(() => {
    const handleSearch = (e: Event) => setGlobalSearchQuery(((e as CustomEvent).detail || '').toLowerCase());
    window.addEventListener('admin-search', handleSearch);
    setGlobalSearchQuery(((window as any).__adminSearchQuery || '').toLowerCase());
    return () => window.removeEventListener('admin-search', handleSearch);
  }, []);

  // — Core data state —
  const [couriers, setCouriers] = useState<string[]>([]);
  const [selectedCourier, setSelectedCourier] = useState('');
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // — UI state —
  const [searchQuery, setSearchQuery] = useState('');
  const [isCourierOpen, setIsCourierOpen] = useState(false);
  const courierRef = useRef<HTMLDivElement>(null);

  // — Modal state —
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editRule, setEditRule] = useState<StatusMapRule | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadText, setUploadText] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [deleteRule, setDeleteRule] = useState<{ partner: string; scanType: string } | null>(null);

  const [newFormData, setNewFormData] = useState<Record<string, string>>({});
  const [editForm, setEditForm] = useState<Partial<StatusMapRule>>({});

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Close courier dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (courierRef.current && !courierRef.current.contains(e.target as Node)) setIsCourierOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // — Data loading —
  const fetchRows = async (courier: string) => {
    if (!courier) return;
    try {
      setLoading(true);
      const res = await apiClient.get('/statusMap/status', {
        params: { courierProvider: courier, page: 1, limit: 500 },
      });
      setRawRows(res.data?.data || []);
    } catch {
      showToast('Failed to load data.', 'error');
      setRawRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/statusMap/partnerName');
        const names: string[] = (res.data?.data || []).map((d: any) => d.partnerName).filter(Boolean);
        setCouriers(names);
        if (names.length > 0) {
          setSelectedCourier(names[0]);
        }
      } catch {
        showToast('Failed to load couriers.', 'error');
      } finally {
        setLoading(false);
      }
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedCourier) fetchRows(selectedCourier);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourier]);

  // Dynamic columns — exactly what's in DB for this courier, no guessing
  const rawColumns = useMemo(() => {
    if (rawRows.length === 0) return [];
    return Object.keys(rawRows[0]).filter(k => !META_KEYS.has(k) && !k.startsWith('$'));
  }, [rawRows]);

  // Search across all column values
  const filteredRows = useMemo(() => {
    const query = (searchQuery || globalSearchQuery).trim().toLowerCase();
    if (!query) return rawRows;
    return rawRows.filter(row =>
      Object.values(row).some(v => String(v ?? '').toLowerCase().includes(query))
    );
  }, [rawRows, searchQuery, globalSearchQuery]);

  const {
    page: currentPage,
    setPage: setCurrentPage,
    totalPages,
    paginatedData,
    startIndex,
    endIndex,
    rowsPerPage,
    setRowsPerPage,
  } = usePagination({ data: filteredRows, perPage: 20 });

  const colSpan = 2 + rawColumns.length; // Partner + data cols + Actions

  // — Handlers —
  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await apiClient.post('/statusMap/addEntry', {
        partnerName: selectedCourier.toUpperCase().trim(),
        ...newFormData,
      });
      setIsAddOpen(false);
      setNewFormData({});
      showToast(`Added entry for ${selectedCourier}!`);
      await fetchRows(selectedCourier);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to add entry.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRule) return;
    try {
      setLoading(true);
      await apiClient.put('/statusMap/updateEntry', {
        partnerName: editRule.partner,
        originalScanType: editRule.scanType,
        scanType: (editForm.scanType ?? editRule.scanType).toUpperCase().trim(),
        scan: editForm.scan ?? editRule.scan,
        instructions: editForm.instructions ?? editRule.instructions,
        syStatus: editForm.syStatus ?? editRule.syStatus,
        processType: editForm.processType ?? editRule.processType,
      });
      setEditRule(null);
      setEditForm({});
      showToast('Status mapping updated!');
      await fetchRows(selectedCourier);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update entry.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditOpen = (item: any) => {
    // Detect actual field names in this raw item for scan type and scan
    const scanTypeVal = String(
      item.scanType || item.Scan_type || item.scan_type || item['Scan Type'] || item.ScanType || ''
    );
    const scanVal = String(item.scan || item.Scan || item.status || item.Status || '');
    const instrVal = String(item.instructions || item.Instructions || item.instruction || '');
    const syVal = String(item.syStatus || item.Sy_status || item.sy_status || item.systemStatus || item['Sy Status'] || '');
    const procVal = String(item.processType || item['Process Type'] || item.process_type || 'FORWARD').toUpperCase();

    const rule: StatusMapRule = {
      id: scanTypeVal || scanVal,
      partner: selectedCourier,
      scanType: scanTypeVal,
      scan: scanVal,
      instructions: instrVal,
      syStatus: syVal,
      processType: (procVal === 'REVERSE' ? 'REVERSE' : 'FORWARD') as 'FORWARD' | 'REVERSE',
    };
    setEditRule(rule);
    setEditForm({ ...rule });
  };

  const handleDeleteOpen = (item: any) => {
    const scanTypeVal = String(
      item.scanType || item.Scan_type || item.scan_type || item['Scan Type'] || item.ScanType || ''
    );
    setDeleteRule({ partner: selectedCourier, scanType: scanTypeVal });
  };

  const confirmDeleteRule = async () => {
    if (!deleteRule) return;
    try {
      setLoading(true);
      await apiClient.post('/statusMap/deleteEntry', { partnerName: deleteRule.partner, scanType: deleteRule.scanType });
      showToast(`Deleted entry for ${deleteRule.partner}`, 'error');
      setDeleteRule(null);
      await fetchRows(selectedCourier);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete entry.', 'error');
      setDeleteRule(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!selectedCourier) { showToast('Please select a courier first.', 'info'); return; }
    try {
      const response = await apiClient.get(`/statusMap/export?courierProvider=${encodeURIComponent(selectedCourier)}`, { responseType: 'blob' });
      const contentType = String(response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      const blob = new Blob([response.data], { type: contentType });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      const disposition = String(response.headers['content-disposition'] || '');
      let filename = `statusMap-${selectedCourier}.xlsx`;
      if (disposition.includes('filename=')) filename = disposition.split('filename=')[1].replace(/['"]/g, '');
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Exported status map for ${selectedCourier}!`);
    } catch {
      showToast('Export failed. Please try again.', 'error');
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Use the Upload button in the old admin panel to upload Excel files.', 'info');
    setIsUploadOpen(false);
  };

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">
        <div className="bg-white shadow-xs relative z-50 shrink-0">

          {/* Page Header */}
          <div className="px-6 py-4 border-b border-[#E2E8F0] bg-white flex justify-between items-center z-50 relative shrink-0">
            <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">Status Mapping</h1>
          </div>

          {/* Filter and Action Row */}
          <div className="p-4 border-b border-[#E2E8F0] flex flex-wrap gap-3 justify-between items-center bg-white">

            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <input
                type="text"
                placeholder="Search mapping rules..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="glass-search-input w-[180px] shrink-0"
              />

              {/* Courier single-select dropdown */}
              <div ref={courierRef} className="relative w-[180px] shrink-0">
                <button
                  onClick={() => setIsCourierOpen(o => !o)}
                  className="glass-dropdown-trigger"
                  type="button"
                >
                  <Briefcase className="w-3.5 h-3.5 text-[#00A86B] shrink-0" />
                  <span className="truncate">{selectedCourier || 'Select Courier'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 ml-auto shrink-0 transition-transform ${isCourierOpen ? 'rotate-180' : ''}`} />
                </button>
                {isCourierOpen && (
                  <ul className="absolute z-50 mt-1 w-full bg-white border border-[#E2E8F0] rounded-lg shadow-lg max-h-52 overflow-y-auto">
                    {couriers.map(c => (
                      <li
                        key={c}
                        onClick={() => { setSelectedCourier(c); setIsCourierOpen(false); setCurrentPage(1); setSearchQuery(''); }}
                        className={`px-3 py-2 text-xs cursor-pointer hover:bg-green-50 font-semibold ${c === selectedCourier ? 'bg-[#E6F5F1] text-[#00A86B]' : 'text-[#0F172A]'}`}
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsAddOpen(true)}
                className="h-8.5 px-4 rounded-full bg-[#00A86B] text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm hover:bg-[#009B63] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Mapping
              </button>
              <button
                onClick={() => setIsUploadOpen(true)}
                className="h-8.5 px-4 rounded-full border border-[#00A86B] text-[11px] font-bold text-[#00A86B] flex items-center gap-1.5 shadow-sm hover:bg-green-50 transition-colors cursor-pointer bg-white"
              >
                <Upload className="w-3.5 h-3.5" /> Upload CSV
              </button>
              <button
                onClick={handleExport}
                className="h-8.5 px-4 rounded-full border border-[#00A86B] text-[11px] font-bold text-[#00A86B] flex items-center gap-1.5 shadow-sm hover:bg-green-50 transition-colors cursor-pointer bg-white"
              >
                <Download className="w-3.5 h-3.5" /> Export
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white flex flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
          <div className="flex-1 overflow-auto w-full relative">
            {loading && <TableLoader />}
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="sticky top-0 z-40 bg-[#E6F5F1] shadow-sm">
                <tr className="text-[10px] font-extrabold text-[#00A86B] uppercase tracking-wider">
                  <th className="p-4 whitespace-nowrap">
                    <Briefcase className="w-3.5 h-3.5 inline mr-1" /> Partner Name
                  </th>
                  {rawColumns.map(col => (
                    <th key={col} className="p-4 whitespace-nowrap">{col}</th>
                  ))}
                  <th className="p-4 text-center whitespace-nowrap w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[11px] text-[#64748B] font-semibold">

                {paginatedData.map((item, idx) => (
                  <tr key={idx} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center shrink-0 bg-transparent">
                          <img
                            src={getCourierLogo(selectedCourier)}
                            alt={selectedCourier}
                            className="w-full h-full object-contain mix-blend-multiply"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCourier)}&background=f8fafc&color=0f172a&bold=true&font-size=0.4`;
                              (e.target as HTMLImageElement).className = 'w-full h-full object-cover rounded-full border border-[#E2E8F0]';
                            }}
                          />
                        </div>
                        <span className="font-semibold text-[#0F172A] text-[12px] uppercase">{selectedCourier}</span>
                      </div>
                    </td>
                    {rawColumns.map(col => (
                      <td key={col} className="p-4 text-[#475569] text-[12px] font-normal">
                        {String(item[col] ?? '')}
                      </td>
                    ))}
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditOpen(item)}
                          className="w-8 h-8 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm bg-white"
                          title="Edit Rule"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOpen(item)}
                          className="w-8 h-8 rounded-full border border-red-100 text-red-500 hover:text-white hover:bg-red-600 hover:border-red-600 flex items-center justify-center transition-all shadow-sm bg-white"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={colSpan} className="p-10 text-center text-[#94A3B8] font-semibold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <SlidersHorizontal className="w-8 h-8 text-slate-300" />
                        <span>{selectedCourier ? `No data found for ${selectedCourier}.` : 'Select a courier to view data.'}</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 0 && (
            <DesktopPagination
              page={currentPage}
              setPage={setCurrentPage}
              totalPages={totalPages}
              rowsPerPage={rowsPerPage}
              setRowsPerPage={setRowsPerPage}
              startIndex={startIndex}
              endIndex={endIndex}
              totalItems={filteredRows.length}
            />
          )}
        </div>
      </div>

      {/* ADD MAPPING MODAL */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsAddOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden w-full max-w-lg z-10 flex flex-col">
              <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <Plus className="w-4.5 h-4.5 text-[#00A86B]" /> Add Status Mapping Rule
                </h3>
                <button onClick={() => setIsAddOpen(false)} className="w-7 h-7 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:bg-slate-50 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleAddRule} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Courier - readonly, always shown */}
                <div>
                  <label className="block text-[10px] font-bold text-[#475569] mb-1.5">Courier Partner</label>
                  <div className="h-9 px-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs flex items-center font-bold text-[#0F172A] uppercase">
                    {selectedCourier}
                  </div>
                </div>

                {/* Dynamic fields — exactly the column names from DB */}
                {rawColumns.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {rawColumns.map(col => (
                      <div key={col}>
                        <label className="block text-[10px] font-bold text-[#475569] mb-1.5">{col}</label>
                        <input
                          type="text"
                          placeholder={col}
                          value={newFormData[col] || ''}
                          onChange={e => setNewFormData(prev => ({ ...prev, [col]: e.target.value }))}
                          className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-1 focus:ring-[#00A86B]"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#94A3B8] text-center py-6">
                    No columns found for {selectedCourier}. Load data first.
                  </p>
                )}

                <div className="flex gap-3 pt-4 border-t border-[#E2E8F0]">
                  <button type="button" onClick={() => { setIsAddOpen(false); setNewFormData({}); }}
                    className="flex-1 h-9 rounded-xl border border-[#E2E8F0] text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                  <button type="submit" disabled={rawColumns.length === 0}
                    className="flex-1 h-9 rounded-xl bg-[#00A86B] hover:bg-[#009B63] text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Create Mapping Rule
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT MAPPING MODAL */}
      <AnimatePresence>
        {editRule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => { setEditRule(null); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden w-full max-w-lg z-10 flex flex-col">
              <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <Edit3 className="w-4.5 h-4.5 text-indigo-600" /> Edit Status Mapping Rule
                </h3>
                <button onClick={() => { setEditRule(null); }}
                  className="w-7 h-7 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:bg-slate-50 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleEditRuleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#475569] mb-1.5">Courier Partner *</label>
                    <input type="text" value={editForm.partner ?? ''} onChange={e => setEditForm(prev => ({ ...prev, partner: e.target.value }))}
                      className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#475569] mb-1.5">Scan Type Code</label>
                    <input type="text" value={editForm.scanType ?? ''} onChange={e => setEditForm(prev => ({ ...prev, scanType: e.target.value }))}
                      className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#475569] mb-1.5">Scan Description *</label>
                  <input type="text" value={editForm.scan ?? ''} onChange={e => setEditForm(prev => ({ ...prev, scan: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#475569] mb-1.5">Instructions</label>
                  <input type="text" value={editForm.instructions ?? ''} onChange={e => setEditForm(prev => ({ ...prev, instructions: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#475569] mb-1.5">Internal System Status *</label>
                    <select value={editForm.syStatus ?? ''} onChange={e => setEditForm(prev => ({ ...prev, syStatus: e.target.value }))}
                      className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white">
                      {['Not Picked','Booked','Ready to Ship','In Transit','Out for Delivery','Delivered','NDR Raised','RTO Initiated','RTO Delivered','Lost','Damaged'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#475569] mb-1.5">Process Type *</label>
                    <select value={editForm.processType ?? 'FORWARD'} onChange={e => setEditForm(prev => ({ ...prev, processType: e.target.value as 'FORWARD' | 'REVERSE' }))}
                      className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white">
                      <option value="FORWARD">FORWARD</option>
                      <option value="REVERSE">REVERSE</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-[#E2E8F0] mt-2">
                  <button type="button" onClick={() => { setEditRule(null); }}
                    className="flex-1 h-9 rounded-xl border border-[#E2E8F0] text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors">
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UPLOAD CSV MODAL */}
      <AnimatePresence>
        {isUploadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsUploadOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden w-full max-w-lg z-10 flex flex-col">
              <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <Upload className="w-4.5 h-4.5 text-[#00A86B]" /> Import Status Mapping CSV
                </h3>
                <button onClick={() => setIsUploadOpen(false)} className="w-7 h-7 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:bg-slate-50 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-1.5 text-xs text-[#64748B]">
                  <p className="font-bold text-[#0F172A]">CSV Formatting Instructions:</p>
                  <p>Input one status map record per line. Include headers in the first line.</p>
                  <p className="font-mono text-[10px] bg-white p-2 rounded border border-[#E2E8F0] mt-2 block whitespace-nowrap overflow-x-auto select-all">
                    Partner,Scan Type,Scan,Instructions,System Status,Process Type<br />
                    DELHIVERY,DL,Delivered,Delivered to customer,Delivered,FORWARD
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#475569] uppercase tracking-wider mb-1.5">Paste CSV Data *</label>
                  <textarea rows={6} required placeholder="Partner,Scan Type,Scan,Instructions,System Status,Process Type..."
                    value={uploadText} onChange={e => setUploadText(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#E2E8F0] text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#00A86B] focus:border-[#00A86B]" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setIsUploadOpen(false); setUploadText(''); }}
                    className="flex-1 h-9 rounded-xl border border-[#E2E8F0] text-xs font-bold text-slate-700 hover:bg-slate-50">Cancel</button>
                  <button type="submit" className="flex-1 h-9 rounded-xl bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors">
                    Import Rules
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE MODAL */}
      <AnimatePresence>
        {deleteRule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setDeleteRule(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden w-full max-w-sm z-10 flex flex-col">
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">Delete Mapping Rule</h3>
                  <p className="text-xs text-[#64748B] mt-2">
                    Are you sure you want to delete this entry for <strong className="text-[#0F172A]">{deleteRule.partner}</strong>? This action cannot be undone.
                  </p>
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setDeleteRule(null)}
                    className="flex-1 h-10 rounded-xl border border-[#E2E8F0] text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                  <button onClick={confirmDeleteRule}
                    className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-colors">Delete Rule</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border min-w-[300px] max-w-md ${
              toast.type === 'success' ? 'bg-slate-900 border-white/10 text-white' : toast.type === 'error' ? 'bg-rose-950 border-rose-800 text-rose-100' : 'bg-indigo-950 border-indigo-800 text-indigo-100'
            }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              toast.type === 'success' ? 'bg-emerald-500/20 text-[#34D399]' : toast.type === 'error' ? 'bg-rose-500/20 text-rose-300' : 'bg-indigo-500/20 text-indigo-300'
            }`}>
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
              {toast.type !== 'success' && <AlertCircle className="w-4 h-4" />}
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
