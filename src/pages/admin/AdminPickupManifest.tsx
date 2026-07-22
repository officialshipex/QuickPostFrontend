import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../../services/apiClient';
import { getToken } from '../../utils/session';
import {
  Search, ChevronDown, MapPin, Truck, X, Download, Filter,
} from 'lucide-react';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { GlassDateFilter } from '../../components/ui/GlassDateFilter';
import { usePagination, DesktopPagination } from '../../hooks/usePagination';
import { useMobilePaginationBar } from '../../hooks/useMobilePaginationBar';
import { TableLoader } from '../../components/ui/TableLoader';
import { TruncatedText } from '../../components/ui/TruncatedText';

const BACKEND_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/v1';

const fmt = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const fmtTime = (d: string) =>
  d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

interface Props {
  isAdminView: boolean;
}

export function AdminPickupManifest({ isAdminView }: Props) {

  const [manifests, setManifests]       = useState<any[]>([]);
  const [loading, setLoading]           = useState(false);
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rowsPerPage, setRowsPerPage]   = useState(20);

  // Filters
  const [searchId,               setSearchId]               = useState('');
  const [awbNumber,              setAwbNumber]              = useState('');
  const [selectedCouriers,       setSelectedCouriers]       = useState<string[]>([]);
  const [selectedPickupAddresses,setSelectedPickupAddresses] = useState<string[]>([]);
  const [dateStart,              setDateStart]              = useState('');
  const [dateEnd,                setDateEnd]                = useState('');

  const [courierOptions, setCourierOptions] = useState<{ label: string; value: string }[]>([]);
  const [pickupOptions,  setPickupOptions]  = useState<{ label: string; value: string }[]>([]);

  // Admin user search (only active when isAdminView)
  const [userQuery,       setUserQuery]       = useState('');
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [userMongoId,     setUserMongoId]     = useState('');

  // Selection
  const [selectedManifests, setSelectedManifests] = useState<string[]>([]);
  const [showActionMenu,    setShowActionMenu]     = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Tooltip
  const [hoveredAddressId, setHoveredAddressId] = useState<string | null>(null);
  // Mobile pickup-address tooltip — fixed + rect-positioned so it stays within the viewport
  // regardless of where the narrow middle column of the card strip sits.
  const [mobileHoveredAddress, setMobileHoveredAddress] = useState<{ id: string; rect: DOMRect } | null>(null);

  // Mobile view state
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Refresh trigger (clear uses this)
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ── Fetch manifests ──
  const fetchManifests = useCallback(async (pg = page) => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page:  pg,
        limit: rowsPerPage,
      };
      if (searchId)                          params.orderId              = searchId;
      if (awbNumber)                         params.awbNumber            = awbNumber;
      if (selectedCouriers.length > 0)       params.courierServiceName   = selectedCouriers.join(',');
      if (selectedPickupAddresses.length > 0) params.pickupContactName   = selectedPickupAddresses.join(',');
      if (dateStart)                         params.startDate            = dateStart;
      if (dateEnd)                           params.endDate              = dateEnd;
      if (isAdminView && userMongoId)        params.userId               = userMongoId;

      const res = await apiClient.get('/admin/filterPickupManifests', { params });
      setManifests(res.data?.manifests || []);
      setTotalPages(res.data?.totalPages || 1);
      setTotalRecords(res.data?.total || res.data?.manifests?.length || 0);
      if (res.data?.courierServices) setCourierOptions(res.data.courierServices.map((s: any) => {
        const v = typeof s === 'string' ? s : String(s?.name || s?.courierServiceName || '');
        return { label: v, value: v };
      }));
      if (res.data?.pickupLocations) setPickupOptions(res.data.pickupLocations.map((p: any) => {
        const v = typeof p === 'string' ? p : String(p?.name || p?.contactName || '');
        return { label: v, value: v };
      }));
    } catch (err) {
      console.error('Failed to fetch manifests', err);
    } finally {
      setLoading(false);
    }
  }, [page, searchId, awbNumber, selectedCouriers, selectedPickupAddresses, dateStart, dateEnd, userMongoId, isAdminView, rowsPerPage]);

  useEffect(() => {
    setSelectedManifests([]);
    fetchManifests(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, refreshTrigger, isAdminView]);

  useEffect(() => {
    setPage(1);
    setRefreshTrigger(t => t + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowsPerPage]);

  // ── Global search (header bar) — filters the already-fetched page client-side ──
  const [globalSearchQuery, setGlobalSearchQuery] = useState((window as any).__adminSearchQuery?.toLowerCase() || '');
  useEffect(() => {
    const handler = (e: Event) => setGlobalSearchQuery(((e as CustomEvent).detail || '').toLowerCase());
    window.addEventListener('admin-search', handler);
    return () => window.removeEventListener('admin-search', handler);
  }, []);
  const filteredManifests = !globalSearchQuery ? manifests : manifests.filter((m) => {
    const q = globalSearchQuery;
    return (m.pickupId || '').toLowerCase().includes(q) ||
      (m.userId?.fullname || '').toLowerCase().includes(q) ||
      (m.userId?.email || '').toLowerCase().includes(q) ||
      (m.pickupAddress?.contactName || '').toLowerCase().includes(q);
  });

  // Client-side re-slice of the already server-fetched page — same usePagination + TableLoader
  // wiring as AdminWallet.tsx / AdminOrders.tsx.
  const { paginatedData: paginatedManifests } = usePagination({ data: filteredManifests, perPage: rowsPerPage });

  // User search debounce — only when in admin view
  useEffect(() => {
    if (!isAdminView || userQuery.trim().length < 2) { setUserSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await apiClient.get(`/admin/searchUser?query=${encodeURIComponent(userQuery)}`);
        setUserSuggestions(res.data.users || []);
      } catch { setUserSuggestions([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [userQuery, isAdminView]);

  // Close action menu on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) setShowActionMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Clear user filter state when switching out of admin view
  useEffect(() => {
    if (!isAdminView) {
      setUserQuery(''); setUserSuggestions([]); setUserMongoId('');
    }
  }, [isAdminView]);

  const handleApply = () => { setPage(1); setRefreshTrigger(t => t + 1); };
  const handleClear = () => {
    setSearchId(''); setAwbNumber(''); setSelectedCouriers([]); setSelectedPickupAddresses([]);
    setDateStart(''); setDateEnd('');
    if (isAdminView) { setUserQuery(''); setUserSuggestions([]); setUserMongoId(''); }
    setPage(1); setRefreshTrigger(t => t + 1);
  };

  const hasActiveFilters = searchId || awbNumber || selectedCouriers.length > 0 || selectedPickupAddresses.length > 0 || (dateStart && dateEnd) || (isAdminView && userMongoId);

  // ── Download helpers (native fetch, no auth interceptor redirect) ──
  const downloadManifestForIds = async (orderIds: string[]) => {
    if (!orderIds.length) return;
    try {
      const token = getToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${BACKEND_BASE}/manifest/generate-pdf?orderIds=${orderIds.join(',')}`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'manifest.pdf';
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) { console.error('Manifest download failed', e); }
  };

  const handleDownloadManifest = (m: any) => {
    const ids = (m.orderIds || []).map((o: any) => o._id || o);
    downloadManifestForIds(ids);
  };

  const handleBulkManifest = () => {
    const ids = manifests
      .filter(m => selectedManifests.includes(m._id))
      .flatMap(m => (m.orderIds || []).map((o: any) => o._id || o));
    downloadManifestForIds(ids);
    setShowActionMenu(false);
  };

  // Selection
  const toggleAll = () =>
    setSelectedManifests(selectedManifests.length === filteredManifests.length && filteredManifests.length > 0 ? [] : filteredManifests.map(m => m._id));
  const toggleOne = (id: string) =>
    setSelectedManifests(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const colSpan = isAdminView ? 10 : 9;

  return (
    <div className="flex flex-col h-full">

      {/* ── Mobile Filters + Action Row ── */}
      <div className="md:hidden px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between bg-white gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#00A86B] text-white text-[12px] font-bold shadow-sm"
          >
            <Filter className="w-3.5 h-3.5" /> Filters
          </button>
          {selectedManifests.length > 0 && (
            <span className="text-[11px] font-bold text-[#00A86B] bg-[#F0FDF4] border border-[#00A86B]/20 px-2.5 py-1 rounded-full">
              {selectedManifests.length} selected
            </span>
          )}
        </div>
        <div className="relative" ref={actionMenuRef}>
          <button
            onClick={() => selectedManifests.length > 0 && setShowActionMenu(v => !v)}
            disabled={selectedManifests.length === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-[12px] font-semibold transition-colors ${selectedManifests.length === 0 ? 'border-[#E2E8F0] bg-[#F8FAFC] text-[#CBD5E1]' : 'border-[#E2E8F0] text-[#475569] bg-white active:bg-[#F8FAFC]'}`}
          >
            Action
            <ChevronDown className={`w-3.5 h-3.5 text-[#94A3B8] transition-transform duration-200 ${showActionMenu ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showActionMenu && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="absolute right-0 top-full mt-2 w-[190px] bg-white rounded-xl shadow-[0_8px_28px_-6px_rgba(0,0,0,0.15)] border border-[#E2E8F0] py-1.5 z-50 origin-top-right"
              >
                <button onClick={handleBulkManifest} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]">Download Manifests</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Filter Row — desktop only ── */}
      <div className="hidden md:flex p-3 border-b border-[#E2E8F0] flex-wrap items-center gap-2.5 bg-[#F8FAFC]/50 shrink-0">

        {/* User search — admin view only */}
        {isAdminView && (
          <div className="relative shrink-0">
            <div className="relative">
              <input
                type="text"
                placeholder="Search user..."
                value={userQuery}
                onChange={(e) => {
                  setUserQuery(e.target.value);
                  if (!e.target.value.trim()) { setUserMongoId(''); setUserSuggestions([]); }
                }}
                className="glass-search-input w-[160px]"
                style={{ paddingLeft: '2rem', paddingRight: '2rem' }}
              />
              <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
              {userMongoId && (
                <button onClick={() => { setUserQuery(''); setUserMongoId(''); setUserSuggestions([]); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {userSuggestions.length > 0 && !userMongoId && (
              <div className="absolute left-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 w-64 max-h-52 overflow-y-auto py-1">
                {userSuggestions.map((u: any) => (
                  <button key={u._id} type="button"
                    onClick={() => { setUserMongoId(u._id); setUserQuery(`${u.fullname} (${u.email})`); setUserSuggestions([]); }}
                    className="w-full text-left px-3 py-2 hover:bg-[#F0FDF4] flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-slate-800 truncate">{u.fullname}</div>
                      <div className="text-[10px] text-slate-400 truncate">{u.email} · {u.phoneNumber}</div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">{u.userId}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <input
          type="text"
          placeholder="Search by pickup ID..."
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="glass-search-input w-[170px] shrink-0"
        />

        <GlassDropdown
          label="Pickup Address"
          options={pickupOptions}
          selected={selectedPickupAddresses}
          onChange={setSelectedPickupAddresses}
          placeholder="Search pickup address..."
          icon={<MapPin className="w-3.5 h-3.5" />}
        />

        <GlassDropdown
          label="Courier Service"
          options={courierOptions}
          selected={selectedCouriers}
          onChange={setSelectedCouriers}
          placeholder="Search courier..."
          icon={<Truck className="w-3.5 h-3.5" />}
        />

        <GlassDateFilter
          align="right"
          startDate={dateStart}
          endDate={dateEnd}
          onDateChange={(s, e) => { setDateStart(s); setDateEnd(e); }}
        />

        <button onClick={handleApply} className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm cursor-pointer">
          Apply
        </button>
        {hasActiveFilters && (
          <button onClick={handleClear} className="h-9 px-3 shrink-0 rounded-lg border border-red-200 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors cursor-pointer">
            Clear All
          </button>
        )}

        <div className="ml-auto relative shrink-0" ref={actionMenuRef}>
          <button
            onClick={() => selectedManifests.length > 0 && setShowActionMenu(v => !v)}
            disabled={selectedManifests.length === 0}
            className={`h-9 pl-4 pr-8 rounded-full border text-xs flex items-center font-bold relative transition-colors ${selectedManifests.length === 0 ? 'border-[#E2E8F0] bg-[#F8FAFC] text-[#CBD5E1] cursor-not-allowed' : 'border-[#E2E8F0] bg-white text-[#475569] shadow-sm hover:bg-[#F8FAFC]'}`}
          >
            Action
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          </button>
          {showActionMenu && (
            <div className="absolute right-0 top-full mt-2 w-[180px] bg-white rounded-xl shadow-lg border border-[#E2E8F0] py-2 z-50">
              <button onClick={handleBulkManifest} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]">Download Manifests</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Table — desktop only ── */}
      <div className="hidden md:block flex-1 overflow-y-auto overflow-x-hidden min-h-0 relative">
        {loading && <TableLoader />}
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-40 bg-green-50 shadow-sm">
              <tr className="text-xs font-medium text-[#475569] uppercase tracking-wider">
                <th className="py-2 px-3 w-10">
                  <input type="checkbox" checked={selectedManifests.length === filteredManifests.length && filteredManifests.length > 0} onChange={toggleAll} className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                </th>
                {isAdminView && <th className="py-2 px-3 whitespace-nowrap">User</th>}
                <th className="py-2 px-3 whitespace-nowrap">Pickup ID</th>
                <th className="py-2 px-3 whitespace-nowrap">Pickup Address</th>
                <th className="py-2 px-3 whitespace-nowrap">Pickup Date</th>
                <th className="py-2 px-3 whitespace-nowrap">Total/Picked</th>
                <th className="py-2 px-3 whitespace-nowrap">Ageing</th>
                <th className="py-2 px-3 whitespace-nowrap">Shipments</th>
                <th className="py-2 px-3 whitespace-nowrap">Status</th>
                <th className="py-2 px-3 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-[#475569]">
              {paginatedManifests.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="p-10 text-center text-[#64748B] font-medium">
                    No manifests found
                  </td>
                </tr>
              ) : paginatedManifests.map((m, idx) => (
                <tr key={m._id} className={`border-b border-[#E2E8F0] transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]'}`}>
                  <td className="p-3">
                    <input type="checkbox" checked={selectedManifests.includes(m._id)} onChange={() => toggleOne(m._id)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                  </td>

                  {/* User column — admin view only */}
                  {isAdminView && (
                    <td className="p-3">
                      <div className="text-xs font-semibold text-[#00A86B]">{m.userId?.userId || '—'}</div>
                      <TruncatedText text={m.userId?.fullname || ''} maxLength={20} className="text-sm font-semibold text-[#0F172A] mt-0.5 max-w-[140px]" />
                      <TruncatedText text={m.userId?.email || ''} maxLength={25} className="text-xs font-normal text-[#94A3B8] max-w-[140px]" />
                    </td>
                  )}

                  <td className="p-3">
                    <div className="text-xs font-semibold text-[#00A86B]">{m.pickupId}</div>
                    <div className="text-xs font-normal text-[#94A3B8] mt-0.5">{fmtTime(m.createdAt)}</div>
                  </td>

                  <td className="p-3 relative">
                    <div
                      className="text-xs font-normal text-[#64748B] underline decoration-dotted underline-offset-2 hover:text-[#0F172A] cursor-help inline-block truncate max-w-[130px]"
                      onMouseEnter={() => setHoveredAddressId(m._id)}
                      onMouseLeave={() => setHoveredAddressId(null)}
                    >
                      {m.pickupAddress?.contactName || '—'}
                    </div>
                    {hoveredAddressId === m._id && (
                      <div className="absolute z-[200] left-0 mt-1 p-3 bg-[#0F172A] text-white rounded-xl shadow-xl text-xs font-normal min-w-[200px] pointer-events-none">
                        <div className="font-bold mb-1 flex items-center gap-1.5"><MapPin className="w-3 h-3 text-[#00A86B]" />{m.pickupAddress?.contactName}</div>
                        <div className="text-slate-300">{m.pickupAddress?.address}</div>
                        <div className="text-slate-400">{m.pickupAddress?.city}, {m.pickupAddress?.state} – {m.pickupAddress?.pinCode || m.pickupAddress?.pincode}</div>
                        {m.pickupAddress?.phoneNumber && <div className="text-slate-400 mt-1">{m.pickupAddress?.phoneNumber}</div>}
                      </div>
                    )}
                  </td>

                  <td className="p-3 text-xs font-normal text-[#64748B]">{fmt(m.pickupDate)}</td>

                  <td className="p-3 text-xs text-[#CBD5E1]">—</td>

                  <td className="p-3 text-xs text-[#CBD5E1]">—</td>

                  <td className="p-3">
                    <div className="text-xs font-bold text-[#0F172A]">{(m.orderIds || []).length}</div>
                    <div className="text-[9px] text-[#94A3B8] uppercase font-semibold">shipments</div>
                  </td>

                  <td className="p-3">
                    <span className="px-2.5 py-0.5 rounded-full border border-violet-200 bg-violet-50 text-violet-700 text-[10px] font-semibold uppercase tracking-wider">
                      {(m.status || '').replace(/_/g, ' ')}
                    </span>
                  </td>

                  <td className="p-3">
                    <button
                      onClick={() => handleDownloadManifest(m)}
                      className="h-7 px-3 rounded-lg bg-[#00A86B] text-white text-[10px] font-bold hover:bg-[#009B63] shadow-sm flex items-center gap-1.5"
                    >
                      <Download className="w-3 h-3" /> Manifest
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>

      {/* ── Pagination — desktop only ── */}
      {totalRecords > 0 && (
        <DesktopPagination
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          startIndex={Math.min((page - 1) * rowsPerPage + 1, totalRecords)}
          endIndex={Math.min(page * rowsPerPage, totalRecords)}
          totalItems={totalRecords}
        />
      )}

      {/* ── Mobile Card Layout ── */}
      <div className="md:hidden flex-1 overflow-y-auto bg-[#F8FAFC] relative">
        {loading && <TableLoader />}
        {paginatedManifests.length === 0 ? (
          <div className="p-8 text-center text-[#64748B] font-medium text-sm">
            No manifests found
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {paginatedManifests.map((m) => (
              <div key={m._id} className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                {/* Ribbon Tag */}
                <div
                  className="absolute top-0 left-0 px-3.5 py-1 text-[10px] font-bold text-white uppercase tracking-wide bg-[#F59E0B]"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 84% 100%, 0% 100%)' }}
                >
                  {(m.status || 'Pickup Scheduled').replace(/_/g, ' ')}
                </div>

                <div className="pt-8 px-4 pb-4">
                  {/* User Details Row */}
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <input type="checkbox" checked={selectedManifests.includes(m._id)} onChange={() => toggleOne(m._id)} className="rounded border-gray-300 accent-[#00A86B] w-4 h-4 shrink-0" />
                      <span className="text-[#64748B] font-medium text-[12px]">User Details</span>
                    </div>
                    <span className="text-[12px] inline-flex items-baseline gap-1 max-w-[190px] justify-end text-right">
                      <TruncatedText text={m.userId?.fullname || m.pickupAddress?.contactName || '—'} maxLength={16} className="font-semibold text-[#0F172A] text-[12px]" />
                      <span className="text-[#00A86B] font-semibold shrink-0">({m.userId?.userId || m.pickupId})</span>
                    </span>
                  </div>

                  {/* Pickup ID & Item Count Row */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-[13px] font-bold text-[#00A86B]">{m.pickupId}</span>
                    <span className="text-[12px] font-medium text-[#94A3B8]">{(m.orderIds || []).length} items</span>
                  </div>

                  {/* Pickup Req. Date / Pickup Address / Pickup Date strip */}
                  <div className="flex items-start justify-between bg-white border border-[#E2E8F0] rounded-xl px-3 py-2.5 mb-3 gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] font-normal text-[#94A3B8]">Pickup Req. Date</div>
                      <div className="text-[12px] font-medium text-[#0F172A] mt-0.5 whitespace-nowrap">{fmt(m.createdAt)}</div>
                    </div>
                    <div
                      className="min-w-0 text-center cursor-help"
                      onMouseEnter={(e) => setMobileHoveredAddress({ id: m._id, rect: e.currentTarget.getBoundingClientRect() })}
                      onMouseLeave={() => setMobileHoveredAddress(null)}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setMobileHoveredAddress(prev => (prev?.id === m._id ? null : { id: m._id, rect }));
                      }}
                    >
                      <div className="text-[10px] font-normal text-[#94A3B8]">Pickup Address</div>
                      <TruncatedText text={m.pickupAddress?.contactName || '—'} maxLength={16} className="text-[12px] font-medium text-[#0F172A] mt-0.5 underline decoration-dotted underline-offset-2" />
                    </div>
                    <div className="min-w-0 text-right">
                      <div className="text-[10px] font-normal text-[#94A3B8]">Pickup Date</div>
                      <div className="text-[12px] font-medium text-[#0F172A] mt-0.5 whitespace-nowrap">{fmt(m.pickupDate)}</div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <button
                    onClick={() => handleDownloadManifest(m)}
                    className="w-full py-2.5 rounded-full bg-[#1e40af] text-white text-[13px] font-bold flex items-center justify-center gap-1.5 hover:bg-[#1e3a8a] transition-colors"
                  >
                    Download Manifest
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mobile Pagination */}
        {useMobilePaginationBar({
          page,
          setPage,
          totalPages,
          rowsPerPage,
          setRowsPerPage,
          startIndex: Math.min((page - 1) * rowsPerPage + 1, totalRecords),
          endIndex: Math.min(page * rowsPerPage, totalRecords),
          totalItems: totalRecords,
        })}
      </div>

      {/* ── Mobile Pickup Address Tooltip — fixed + viewport-clamped ── */}
      {mobileHoveredAddress && (() => {
        const m = paginatedManifests.find(x => x._id === mobileHoveredAddress.id);
        if (!m) return null;
        const rect = mobileHoveredAddress.rect;
        const showBelow = rect.top < 220;
        return (
          <div
            className="md:hidden fixed z-[200] p-3 bg-[#0F172A] text-white rounded-xl shadow-xl text-xs font-normal w-60 pointer-events-none text-left"
            style={{
              top: showBelow ? rect.bottom + 8 : rect.top - 8,
              left: Math.min(Math.max(rect.left + rect.width / 2, 128), window.innerWidth - 128),
              transform: showBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            }}
          >
            <div className="font-bold mb-1 flex items-center gap-1.5"><MapPin className="w-3 h-3 text-[#00A86B] shrink-0" />{m.pickupAddress?.contactName}</div>
            <div className="text-slate-300 break-words whitespace-normal">{m.pickupAddress?.address}</div>
            <div className="text-slate-400 mt-0.5">{m.pickupAddress?.city}, {m.pickupAddress?.state} – {m.pickupAddress?.pinCode || m.pickupAddress?.pincode}</div>
            {m.pickupAddress?.phoneNumber && <div className="text-slate-400 mt-1">{m.pickupAddress?.phoneNumber}</div>}
          </div>
        );
      })()}

      {/* ── Mobile Filters Bottom Sheet ── */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[140] md:hidden flex items-end justify-center"
            onClick={() => setIsMobileFiltersOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white rounded-t-3xl border-t border-[#E2E8F0] shadow-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Filter className="w-5 h-5 text-[#00A86B]" /> Filters
                </h3>
                <button onClick={() => setIsMobileFiltersOpen(false)} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {isAdminView && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Search User</label>
                    <input
                      type="text"
                      placeholder="Search user..."
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pickup ID</label>
                  <input
                    type="text"
                    placeholder="Search by pickup ID..."
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">AWB Number</label>
                  <input
                    type="text"
                    placeholder="Search by AWB..."
                    value={awbNumber}
                    onChange={(e) => setAwbNumber(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pickup Address</label>
                  <select
                    value={selectedPickupAddresses[0] || ''}
                    onChange={(e) => setSelectedPickupAddresses(e.target.value ? [e.target.value] : [])}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                  >
                    <option value="">All Pickup Addresses</option>
                    {pickupOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Courier Service</label>
                  <select
                    value={selectedCouriers[0] || ''}
                    onChange={(e) => setSelectedCouriers(e.target.value ? [e.target.value] : [])}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                  >
                    <option value="">All Couriers</option>
                    {courierOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date Range</label>
                  <GlassDateFilter
                    className="w-full [&_.glass-dropdown-trigger]:w-full [&_.glass-dropdown-trigger]:h-11"
                    startDate={dateStart}
                    endDate={dateEnd}
                    onDateChange={(s, e) => { setDateStart(s); setDateEnd(e); }}
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={() => { handleClear(); setIsMobileFiltersOpen(false); }}
                  className="flex-1 h-11 rounded-full border border-[#E2E8F0] text-[#475569] text-sm font-bold hover:bg-[#F8FAFC] transition-colors"
                >
                  Reset All
                </button>
                <button
                  onClick={() => { handleApply(); setIsMobileFiltersOpen(false); }}
                  className="flex-1 h-11 rounded-full bg-[#00A86B] text-white text-sm font-bold hover:bg-[#009B63] transition-colors shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
