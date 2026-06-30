import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { usePagination } from '../../hooks/usePagination';
import { 
  Search, RefreshCcw, Upload, Download, 
  Briefcase, User, Target, ArrowUpCircle, FileText, Box,
  Plus, Edit3, Trash2, X, Check, CheckCircle2, AlertCircle, 
  ChevronLeft, ChevronRight, ChevronDown, SlidersHorizontal, Settings, HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
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

const INITIAL_MAPPING_RULES: StatusMapRule[] = [
  { id: 'MAP001', partner: 'DELHIVERY', scanType: 'UD', scan: 'Manifested', instructions: 'Consignment Manifested', syStatus: 'Not Picked', processType: 'FORWARD' },
  { id: 'MAP002', partner: 'DELHIVERY', scanType: 'PU', scan: 'Pickup Scheduled', instructions: 'Consignment Pickup Scheduled', syStatus: 'Not Picked', processType: 'FORWARD' },
  { id: 'MAP003', partner: 'DELHIVERY', scanType: 'IT', scan: 'In Transit', instructions: 'Consignment In Transit', syStatus: 'In Transit', processType: 'FORWARD' },
  { id: 'MAP004', partner: 'DELHIVERY', scanType: 'OD', scan: 'Out for Delivery', instructions: 'Out for Delivery', syStatus: 'Out for Delivery', processType: 'FORWARD' },
  { id: 'MAP005', partner: 'DELHIVERY', scanType: 'DL', scan: 'Delivered', instructions: 'Consignment Delivered Successfully', syStatus: 'Delivered', processType: 'FORWARD' },
  { id: 'MAP006', partner: 'BLUEDART', scanType: 'DISP', scan: 'Dispatched', instructions: 'Shipment Dispatched from Location', syStatus: 'In Transit', processType: 'FORWARD' },
  { id: 'MAP007', partner: 'BLUEDART', scanType: 'OFD', scan: 'Out for Delivery', instructions: 'Out for Delivery', syStatus: 'Out for Delivery', processType: 'FORWARD' },
  { id: 'MAP008', partner: 'BLUEDART', scanType: 'DEL', scan: 'Delivered', instructions: 'Delivered to Consignee', syStatus: 'Delivered', processType: 'FORWARD' },
  { id: 'MAP009', partner: 'BLUEDART', scanType: 'NDR', scan: 'Undelivered', instructions: 'Consignee Not Available', syStatus: 'NDR Raised', processType: 'FORWARD' },
  { id: 'MAP010', partner: 'EKART', scanType: 'PKD', scan: 'Packed', instructions: 'Packed and Ready to Pick', syStatus: 'Not Picked', processType: 'FORWARD' },
  { id: 'MAP011', partner: 'EKART', scanType: 'PUP', scan: 'Picked Up', instructions: 'Shipment Picked Up', syStatus: 'In Transit', processType: 'FORWARD' },
  { id: 'MAP012', partner: 'EKART', scanType: 'OOD', scan: 'Out For Delivery', instructions: 'Shipment Out For Delivery', syStatus: 'Out for Delivery', processType: 'FORWARD' },
  { id: 'MAP013', partner: 'EKART', scanType: 'RTO', scan: 'RTO Initiated', instructions: 'Return to Origin Initiated', syStatus: 'RTO Initiated', processType: 'FORWARD' },
  { id: 'MAP014', partner: 'SHREE MARUTI', scanType: 'BK', scan: 'Booked', instructions: 'Shipment Booked at Branch', syStatus: 'Not Picked', processType: 'FORWARD' },
  { id: 'MAP015', partner: 'SHREE MARUTI', scanType: 'TR', scan: 'In Transit', instructions: 'Shipment in Transit between Hubs', syStatus: 'In Transit', processType: 'FORWARD' }
];

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

  const [rules, setRules] = useState<StatusMapRule[]>(INITIAL_MAPPING_RULES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  const [selectedSyStatuses, setSelectedSyStatuses] = useState<string[]>([]);
  // Modals & States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editRule, setEditRule] = useState<StatusMapRule | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadText, setUploadText] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [deleteRule, setDeleteRule] = useState<{id: string; partner: string; scanType: string} | null>(null);

  // New Rule Form State
  const [newRule, setNewRule] = useState<Omit<StatusMapRule, 'id'>>({
    partner: 'DELHIVERY',
    scanType: '',
    scan: '',
    instructions: '',
    syStatus: 'Not Picked',
    processType: 'FORWARD'
  });

  // Edit Rule Form State
  const [editForm, setEditForm] = useState<Partial<StatusMapRule>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Get unique partners & internal statuses
  const uniquePartners = useMemo(() => {
    return Array.from(new Set(rules.map(r => r.partner.toUpperCase()))).sort();
  }, [rules]);

  const uniqueSyStatuses = useMemo(() => {
    return Array.from(new Set(rules.map(r => r.syStatus))).sort();
  }, [rules]);

  const PARTNER_OPTIONS = useMemo(() => uniquePartners.map(p => ({ label: p, value: p })), [uniquePartners]);
  const SY_STATUS_OPTIONS = useMemo(() => uniqueSyStatuses.map(s => ({ label: s, value: s })), [uniqueSyStatuses]);
  const PROCESS_OPTIONS = [
    { label: 'FORWARD', value: 'FORWARD' },
    { label: 'REVERSE', value: 'REVERSE' }
  ];

  // Filter rules
  const filteredRules = useMemo(() => {
    return rules.filter(rule => {
      const matchesPartner = selectedPartners.length === 0 || selectedPartners.includes(rule.partner.toUpperCase());
      const matchesProcess = selectedProcesses.length === 0 || selectedProcesses.includes(rule.processType);
      const matchesSyStatus = selectedSyStatuses.length === 0 || selectedSyStatuses.includes(rule.syStatus);
      
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = query === '' ||
        rule.partner.toLowerCase().includes(query) ||
        rule.scanType.toLowerCase().includes(query) ||
        rule.scan.toLowerCase().includes(query) ||
        rule.instructions.toLowerCase().includes(query) ||
        rule.syStatus.toLowerCase().includes(query);

      const matchesGlobalSearch = globalSearchQuery === '' ||
        rule.partner.toLowerCase().includes(globalSearchQuery) ||
        rule.scanType.toLowerCase().includes(globalSearchQuery) ||
        rule.scan.toLowerCase().includes(globalSearchQuery) ||
        rule.instructions.toLowerCase().includes(globalSearchQuery) ||
        rule.syStatus.toLowerCase().includes(globalSearchQuery);

      return matchesPartner && matchesProcess && matchesSyStatus && matchesSearch && matchesGlobalSearch;
    });
  }, [rules, selectedPartners, selectedProcesses, selectedSyStatuses, searchQuery, globalSearchQuery]);

  const {
    page: currentPage,
    setPage: setCurrentPage,
    totalPages,
    paginatedData: paginatedRules,
    startIndex,
    endIndex,
  } = usePagination({ data: filteredRules, perPage: 8 });

  // Form Validation
  const validateForm = (data: typeof newRule) => {
    const errors: Record<string, string> = {};
    if (!data.partner.trim()) errors.partner = 'Partner name is required';
    if (!data.scanType.trim()) errors.scanType = 'Scan type code is required';
    if (!data.scan.trim()) errors.scan = 'Scan description is required';
    if (!data.instructions.trim()) errors.instructions = 'Instructions description is required';
    return errors;
  };

  // Add Rule Handler
  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(newRule);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('Please correct form errors.', 'error');
      return;
    }

    const nextIdNum = Math.max(...rules.map(r => parseInt(r.id.replace('MAP', '')))) + 1;
    const generatedId = `MAP${String(nextIdNum).padStart(3, '0')}`;

    const ruleToAdd: StatusMapRule = {
      ...newRule,
      id: generatedId,
      partner: newRule.partner.toUpperCase().trim(),
      scanType: newRule.scanType.toUpperCase().trim()
    };

    setRules(prev => [ruleToAdd, ...prev]);
    setIsAddOpen(false);
    setNewRule({
      partner: 'DELHIVERY',
      scanType: '',
      scan: '',
      instructions: '',
      syStatus: 'Not Picked',
      processType: 'FORWARD'
    });
    setFormErrors({});
    showToast(`Successfully added status map for ${ruleToAdd.partner}!`);
  };

  // Edit Rule Submit
  const handleEditRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRule) return;

    const merged = { ...editRule, ...editForm } as any;
    const errors = validateForm(merged);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('Please correct form errors.', 'error');
      return;
    }

    setRules(prev => prev.map(r => r.id === editRule.id ? { 
      ...r, 
      ...editForm, 
      partner: (editForm.partner ?? r.partner).toUpperCase().trim(),
      scanType: (editForm.scanType ?? r.scanType).toUpperCase().trim()
    } as StatusMapRule : r));

    setEditRule(null);
    setEditForm({});
    setFormErrors({});
    showToast(`Status mapping rule for ${merged.partner} updated!`);
  };

  // Delete Rule Handler
  const handleDeleteRule = (id: string, partner: string, scanType: string) => {
    setDeleteRule({ id, partner, scanType });
  };

  const confirmDeleteRule = () => {
    if (deleteRule) {
      setRules(prev => prev.filter(r => r.id !== deleteRule.id));
      showToast(`Deleted mapping rule for ${deleteRule.partner} (${deleteRule.scanType})`, 'error');
      setDeleteRule(null);
    }
  };

  // Export CSV Handler
  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Partner,Scan Type,Scan,Instructions,System Status,Process Type"].join("\n") + "\n"
      + rules.map(r => `"${r.partner}","${r.scanType}","${r.scan}","${r.instructions}","${r.syStatus}","${r.processType}"`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `quickpost_status_mappings.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Exported all status mapping rules to CSV!");
  };

  // Upload CSV Simulator Handler
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadText.trim()) {
      showToast("Please enter CSV text to import.", "error");
      return;
    }

    try {
      const rows = uploadText.split('\n');
      let count = 0;
      const parsedRules: StatusMapRule[] = [];
      let nextIdNum = Math.max(...rules.map(r => parseInt(r.id.replace('MAP', '')))) + 1;

      rows.forEach((rowStr, idx) => {
        if (idx === 0 && rowStr.toLowerCase().includes('partner')) return; // skip header
        if (!rowStr.trim()) return;

        const cols = rowStr.split(',').map(s => s.replace(/^"|"$/g, '').trim());
        if (cols.length >= 6) {
          const partner = cols[0].toUpperCase();
          const scanType = cols[1].toUpperCase();
          const scan = cols[2];
          const instructions = cols[3];
          const syStatus = cols[4];
          const processType = (cols[5].toUpperCase() === 'REVERSE' ? 'REVERSE' : 'FORWARD') as 'FORWARD' | 'REVERSE';

          parsedRules.push({
            id: `MAP${String(nextIdNum++).padStart(3, '0')}`,
            partner,
            scanType,
            scan,
            instructions,
            syStatus,
            processType
          });
          count++;
        }
      });

      if (parsedRules.length > 0) {
        setRules(prev => [...parsedRules, ...prev]);
        setIsUploadOpen(false);
        setUploadText('');
        showToast(`Imported ${count} status mapping rules successfully!`);
      } else {
        showToast("No valid status mapping rows found. Make sure headers are: Partner,Scan Type,Scan,Instructions,System Status,Process Type", "error");
      }
    } catch (err) {
      showToast("Failed to parse CSV. Check formatting.", "error");
    }
  };

  // Refresh handler
  const handleRefresh = () => {
    setSearchQuery('');
    setSelectedPartners([]);
    setSelectedProcesses([]);
    setSelectedSyStatuses([]);
    setCurrentPage(1);
    showToast("Mappings refreshed and filters cleared!", "success");
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
            <input 
              type="text" 
              placeholder="Search mapping rules..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[180px] shrink-0" 
            />
            <GlassDropdown
              label="Courier Partner"
              options={PARTNER_OPTIONS}
              selected={selectedPartners}
              onChange={(val) => { setSelectedPartners(val); setCurrentPage(1); }}
              placeholder="Search partner..."
              icon={<Briefcase className="w-3.5 h-3.5" />}
            />

            <GlassDropdown
              label="Process Type"
              options={PROCESS_OPTIONS}
              selected={selectedProcesses}
              onChange={(val) => { setSelectedProcesses(val); setCurrentPage(1); }}
              placeholder="Search process..."
              icon={<Box className="w-3.5 h-3.5" />}
            />

            <GlassDropdown
              label="Internal System Status"
              options={SY_STATUS_OPTIONS}
              selected={selectedSyStatuses}
              onChange={(val) => { setSelectedSyStatuses(val); setCurrentPage(1); }}
              placeholder="Search status..."
              icon={<FileText className="w-3.5 h-3.5" />}
            />
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
        <div className="flex-1 overflow-auto no-scrollbar relative">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 z-40 bg-[#E6F5F1] shadow-sm">
              <tr className="text-[10px] font-extrabold text-[#00A86B] uppercase tracking-wider">
                <th className="p-4 whitespace-nowrap"><Briefcase className="w-3.5 h-3.5 inline mr-1"/> Partner Name</th>
                <th className="p-4 whitespace-nowrap"><User className="w-3.5 h-3.5 inline mr-1"/> Scan_type</th>
                <th className="p-4 whitespace-nowrap"><Target className="w-3.5 h-3.5 inline mr-1"/> Scan</th>
                <th className="p-4 whitespace-nowrap"><ArrowUpCircle className="w-3.5 h-3.5 inline mr-1"/> Instructions</th>
                <th className="p-4 whitespace-nowrap"><FileText className="w-3.5 h-3.5 inline mr-1"/> Sy_status</th>
                <th className="p-4 whitespace-nowrap"><Box className="w-3.5 h-3.5 inline mr-1"/> Process Type</th>
                <th className="p-4 text-center whitespace-nowrap w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-[#64748B] font-semibold">
              {paginatedRules.map((row, i) => (
                <tr key={row.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 flex items-center justify-center shrink-0 bg-transparent">
                        <img 
                          src={getCourierLogo(row.partner)} 
                          alt={row.partner}
                          className="w-full h-full object-contain mix-blend-multiply"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(row.partner)}&background=f8fafc&color=0f172a&bold=true&font-size=0.4`;
                            (e.target as HTMLImageElement).className = "w-full h-full object-cover rounded-full border border-[#E2E8F0]";
                          }}
                        />
                      </div>
                      <div>
                        <div className="font-bold text-[#0F172A] text-[12px] uppercase">{row.partner}</div>
                        <div className="text-[10px] text-[#94A3B8] font-semibold mt-0.5">ID: {row.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1.5 bg-slate-50 text-slate-700 rounded-md text-[11px] font-bold border border-slate-200">
                      {row.scanType}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-[#0F172A] text-[12px]">{row.scan}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-[#475569] text-[12px] line-clamp-2" title={row.instructions}>
                      {row.instructions}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded text-[10px] font-semibold border whitespace-nowrap inline-block ${
                      row.syStatus === 'Delivered' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : row.syStatus === 'In Transit' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : row.syStatus === 'Out for Delivery' 
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                            : row.syStatus === 'RTO Initiated' || row.syStatus === 'RTO Delivered' || row.syStatus === 'Lost' || row.syStatus === 'Damaged'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {row.syStatus}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-[#475569] text-[12px] font-bold uppercase tracking-wider">
                      {row.processType}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => {
                          setEditRule(row);
                          setEditForm({ ...row });
                        }}
                        className="w-8 h-8 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm bg-white"
                        title="Edit Rule"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteRule(row.id, row.partner, row.scanType)}
                        className="w-8 h-8 rounded-full border border-red-100 text-red-500 hover:text-white hover:bg-red-600 hover:border-red-600 flex items-center justify-center transition-all shadow-sm bg-white"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredRules.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-[#94A3B8] font-semibold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <SlidersHorizontal className="w-8 h-8 text-slate-300" />
                      <span>No status mapping rules match your criteria.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 0 && (
          <div className="flex justify-between items-center p-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
            <span className="text-xs text-[#64748B] font-medium">
              Showing <span className="font-bold text-[#0F172A]">{startIndex}</span> to <span className="font-bold text-[#0F172A]">{endIndex}</span> of <span className="font-bold text-[#0F172A]">{filteredRules.length}</span> mapping rules
            </span>
            
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-white disabled:opacity-40 transition-colors cursor-pointer bg-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button 
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentPage === i + 1 
                      ? 'bg-[#00A86B] text-white shadow-xs' 
                      : 'border border-[#E2E8F0] text-[#64748B] hover:bg-white bg-white'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-white disabled:opacity-40 transition-colors cursor-pointer bg-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* ADD MAPPING MODAL */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs" 
              onClick={() => setIsAddOpen(false)} 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden w-full max-w-lg z-10 flex flex-col"
            >
              <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <Plus className="w-4.5 h-4.5 text-[#00A86B]" /> Add Status Mapping Rule
                </h3>
                <button 
                  onClick={() => setIsAddOpen(false)} 
                  className="w-7 h-7 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:bg-slate-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddRule} className="p-6 space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#475569] mb-1.5">Courier Partner *</label>
                    <input 
                      type="text"
                      placeholder="e.g. DELHIVERY"
                      value={newRule.partner}
                      onChange={e => setNewRule(prev => ({ ...prev, partner: e.target.value }))}
                      className={`w-full h-9 px-3 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-[#00A86B] uppercase ${
                        formErrors.partner ? 'border-red-500' : 'border-[#E2E8F0]'
                      }`}
                    />
                    {formErrors.partner && <span className="text-[10px] text-red-500 mt-1 font-bold block">{formErrors.partner}</span>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#475569] mb-1.5">Scan Type Code (UD, IT, etc.) *</label>
                    <input 
                      type="text"
                      placeholder="e.g. UD"
                      value={newRule.scanType}
                      onChange={e => setNewRule(prev => ({ ...prev, scanType: e.target.value }))}
                      className={`w-full h-9 px-3 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-[#00A86B] uppercase ${
                        formErrors.scanType ? 'border-red-500' : 'border-[#E2E8F0]'
                      }`}
                    />
                    {formErrors.scanType && <span className="text-[10px] text-red-500 mt-1 font-bold block">{formErrors.scanType}</span>}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#475569] mb-1.5">Scan Description (Partner Status) *</label>
                  <input 
                    type="text"
                    placeholder="e.g. Manifested"
                    value={newRule.scan}
                    onChange={e => setNewRule(prev => ({ ...prev, scan: e.target.value }))}
                    className={`w-full h-9 px-3 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-[#00A86B] ${
                      formErrors.scan ? 'border-red-500' : 'border-[#E2E8F0]'
                    }`}
                  />
                  {formErrors.scan && <span className="text-[10px] text-red-500 mt-1 font-bold block">{formErrors.scan}</span>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#475569] mb-1.5">Instructions / Status Detail Message *</label>
                  <input 
                    type="text"
                    placeholder="e.g. Consignment Manifested"
                    value={newRule.instructions}
                    onChange={e => setNewRule(prev => ({ ...prev, instructions: e.target.value }))}
                    className={`w-full h-9 px-3 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-[#00A86B] ${
                      formErrors.instructions ? 'border-red-500' : 'border-[#E2E8F0]'
                    }`}
                  />
                  {formErrors.instructions && <span className="text-[10px] text-red-500 mt-1 font-bold block">{formErrors.instructions}</span>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#475569] mb-1.5">Internal System Status *</label>
                    <select
                      value={newRule.syStatus}
                      onChange={e => setNewRule(prev => ({ ...prev, syStatus: e.target.value }))}
                      className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-1 focus:ring-[#00A86B] bg-white"
                    >
                      <option value="Not Picked">Not Picked</option>
                      <option value="Booked">Booked</option>
                      <option value="Ready to Ship">Ready to Ship</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="NDR Raised">NDR Raised</option>
                      <option value="RTO Initiated">RTO Initiated</option>
                      <option value="RTO Delivered">RTO Delivered</option>
                      <option value="Lost">Lost</option>
                      <option value="Damaged">Damaged</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#475569] mb-1.5">Process Type *</label>
                    <select
                      value={newRule.processType}
                      onChange={e => setNewRule(prev => ({ ...prev, processType: e.target.value as 'FORWARD' | 'REVERSE' }))}
                      className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-1 focus:ring-[#00A86B] bg-white"
                    >
                      <option value="FORWARD">FORWARD</option>
                      <option value="REVERSE">REVERSE</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-[#E2E8F0] mt-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsAddOpen(false);
                      setFormErrors({});
                    }}
                    className="flex-1 h-9 rounded-xl border border-[#E2E8F0] text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 h-9 rounded-xl bg-[#00A86B] hover:bg-[#009B63] text-white text-xs font-bold shadow-sm transition-colors"
                  >
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
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs" 
              onClick={() => {
                setEditRule(null);
                setFormErrors({});
              }} 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden w-full max-w-lg z-10 flex flex-col"
            >
              <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <Edit3 className="w-4.5 h-4.5 text-indigo-600" /> Edit Status Mapping Rule
                </h3>
                <button 
                  onClick={() => {
                    setEditRule(null);
                    setFormErrors({});
                  }} 
                  className="w-7 h-7 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:bg-slate-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditRuleSubmit} className="p-6 space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#475569] mb-1.5">Courier Partner *</label>
                    <input 
                      type="text"
                      value={editForm.partner ?? ''}
                      onChange={e => setEditForm(prev => ({ ...prev, partner: e.target.value }))}
                      className={`w-full h-9 px-3 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase ${
                        formErrors.partner ? 'border-red-500' : 'border-[#E2E8F0]'
                      }`}
                    />
                    {formErrors.partner && <span className="text-[10px] text-red-500 mt-1 font-bold block">{formErrors.partner}</span>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#475569] mb-1.5">Scan Type Code *</label>
                    <input 
                      type="text"
                      value={editForm.scanType ?? ''}
                      onChange={e => setEditForm(prev => ({ ...prev, scanType: e.target.value }))}
                      className={`w-full h-9 px-3 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase ${
                        formErrors.scanType ? 'border-red-500' : 'border-[#E2E8F0]'
                      }`}
                    />
                    {formErrors.scanType && <span className="text-[10px] text-red-500 mt-1 font-bold block">{formErrors.scanType}</span>}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#475569] mb-1.5">Scan Description *</label>
                  <input 
                    type="text"
                    value={editForm.scan ?? ''}
                    onChange={e => setEditForm(prev => ({ ...prev, scan: e.target.value }))}
                    className={`w-full h-9 px-3 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      formErrors.scan ? 'border-red-500' : 'border-[#E2E8F0]'
                    }`}
                  />
                  {formErrors.scan && <span className="text-[10px] text-red-500 mt-1 font-bold block">{formErrors.scan}</span>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#475569] mb-1.5">Instructions *</label>
                  <input 
                    type="text"
                    value={editForm.instructions ?? ''}
                    onChange={e => setEditForm(prev => ({ ...prev, instructions: e.target.value }))}
                    className={`w-full h-9 px-3 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      formErrors.instructions ? 'border-red-500' : 'border-[#E2E8F0]'
                    }`}
                  />
                  {formErrors.instructions && <span className="text-[10px] text-red-500 mt-1 font-bold block">{formErrors.instructions}</span>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#475569] mb-1.5">Internal System Status *</label>
                    <select
                      value={editForm.syStatus ?? ''}
                      onChange={e => setEditForm(prev => ({ ...prev, syStatus: e.target.value }))}
                      className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    >
                      <option value="Not Picked">Not Picked</option>
                      <option value="Booked">Booked</option>
                      <option value="Ready to Ship">Ready to Ship</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="NDR Raised">NDR Raised</option>
                      <option value="RTO Initiated">RTO Initiated</option>
                      <option value="RTO Delivered">RTO Delivered</option>
                      <option value="Lost">Lost</option>
                      <option value="Damaged">Damaged</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#475569] mb-1.5">Process Type *</label>
                    <select
                      value={editForm.processType ?? 'FORWARD'}
                      onChange={e => setEditForm(prev => ({ ...prev, processType: e.target.value as 'FORWARD' | 'REVERSE' }))}
                      className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    >
                      <option value="FORWARD">FORWARD</option>
                      <option value="REVERSE">REVERSE</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-[#E2E8F0] mt-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      setEditRule(null);
                      setFormErrors({});
                    }}
                    className="flex-1 h-9 rounded-xl border border-[#E2E8F0] text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors"
                  >
                    Save Changes
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UPLOAD MAPPING CSV MODAL */}
      <AnimatePresence>
        {isUploadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs" 
              onClick={() => setIsUploadOpen(false)} 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden w-full max-w-lg z-10 flex flex-col"
            >
              <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <Upload className="w-4.5 h-4.5 text-[#00A86B]" /> Import Status Mapping CSV
                </h3>
                <button 
                  onClick={() => setIsUploadOpen(false)} 
                  className="w-7 h-7 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:bg-slate-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-1.5 text-xs text-[#64748B]">
                  <p className="font-bold text-[#0F172A]">CSV Formatting Instructions:</p>
                  <p>Input one status map record per line. Include headers in the first line.</p>
                  <p className="font-mono text-[10px] bg-white p-2 rounded border border-[#E2E8F0] mt-2 block whitespace-nowrap overflow-x-auto select-all">
                    Partner,Scan Type,Scan,Instructions,System Status,Process Type<br />
                    DELHIVERY,DL,Delivered,Delivered to customer,Delivered,FORWARD<br />
                    BLUEDART,IT,In Transit,Out for delivery,Out for Delivery,FORWARD
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#475569] uppercase tracking-wider mb-1.5">Paste CSV Data *</label>
                  <textarea 
                    rows={6}
                    required
                    placeholder="Partner,Scan Type,Scan,Instructions,System Status,Process Type..."
                    value={uploadText}
                    onChange={e => setUploadText(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#E2E8F0] text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#00A86B] focus:border-[#00A86B]"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsUploadOpen(false);
                      setUploadText('');
                    }}
                    className="flex-1 h-9 rounded-xl border border-[#E2E8F0] text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 h-9 rounded-xl bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors"
                  >
                    Import Rules
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE MAPPING MODAL */}
      <AnimatePresence>
        {deleteRule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs" 
              onClick={() => setDeleteRule(null)} 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden w-full max-w-sm z-10 flex flex-col"
            >
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">Delete Mapping Rule</h3>
                  <p className="text-xs text-[#64748B] mt-2">
                    Are you sure you want to delete the status mapping for <strong className="text-[#0F172A]">{deleteRule.partner}</strong> <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-xs">[{deleteRule.scanType}]</span>? This action cannot be undone.
                  </p>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setDeleteRule(null)}
                    className="flex-1 h-10 rounded-xl border border-[#E2E8F0] text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmDeleteRule}
                    className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-colors"
                  >
                    Delete Rule
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST SYSTEM */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border min-w-[300px] max-w-md ${
              toast.type === 'success' 
                ? 'bg-slate-900 border-white/10 text-white' 
                : toast.type === 'error' 
                  ? 'bg-rose-950 border-rose-800 text-rose-100' 
                  : 'bg-indigo-950 border-indigo-800 text-indigo-100'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              toast.type === 'success' 
                ? 'bg-emerald-500/20 text-[#34D399]' 
                : toast.type === 'error' 
                  ? 'bg-rose-500/20 text-rose-300' 
                  : 'bg-indigo-500/20 text-indigo-300'
            }`}>
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4" />}
              {toast.type === 'info' && <AlertCircle className="w-4 h-4" />}
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
