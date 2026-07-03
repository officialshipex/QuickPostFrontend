import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '../../services/apiClient';
import { getToken } from '../../utils/session';
import {
  Search, ChevronDown, MapPin, Truck, X, Loader2, Download,
} from 'lucide-react';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { GlassDateFilter } from '../../components/ui/GlassDateFilter';

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

  // Refresh trigger (clear uses this)
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const ITEMS_PER_PAGE = 20;

  // ── Fetch manifests ──
  const fetchManifests = useCallback(async (pg = page) => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page:  pg,
        limit: ITEMS_PER_PAGE,
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
      if (res.data?.courierServices) setCourierOptions(res.data.courierServices.map((s: any) => ({ label: s, value: s })));
      if (res.data?.pickupLocations) setPickupOptions(res.data.pickupLocations.map((p: any) => ({ label: p, value: p })));
    } catch (err) {
      console.error('Failed to fetch manifests', err);
    } finally {
      setLoading(false);
    }
  }, [page, searchId, awbNumber, selectedCouriers, selectedPickupAddresses, dateStart, dateEnd, userMongoId, isAdminView]);

  useEffect(() => {
    setSelectedManifests([]);
    fetchManifests(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, refreshTrigger, isAdminView]);

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
    setSelectedManifests(selectedManifests.length === manifests.length && manifests.length > 0 ? [] : manifests.map(m => m._id));
  const toggleOne = (id: string) =>
    setSelectedManifests(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // Pagination window
  const pageWindow = () => {
    const half = 2;
    let start = Math.max(1, page - half), end = Math.min(totalPages, page + half);
    if (end - start < 4) { if (start === 1) end = Math.min(totalPages, 5); else start = Math.max(1, end - 4); }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const colSpan = isAdminView ? 8 : 7;

  return (
    <div className="flex flex-col h-full">

      {/* ── Filter Row ── */}
      <div className="p-3 border-b border-[#E2E8F0] flex flex-wrap items-center gap-2.5 bg-[#F8FAFC]/50 shrink-0">

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
                className="h-9 pl-8 pr-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[160px]"
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
          className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[170px] shrink-0"
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

        <button onClick={handleApply} className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm">
          Apply
        </button>
        {hasActiveFilters && (
          <button onClick={handleClear} className="h-9 px-3 shrink-0 rounded-lg border border-red-200 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors">
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

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto min-h-0 relative">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-[#94A3B8]">
            <Loader2 className="w-8 h-8 animate-spin text-[#00A86B]" />
            <span className="text-sm font-medium">Loading manifests…</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-full">
            <thead className="sticky top-0 z-40 bg-[#E6F5F1] shadow-sm">
              <tr className="text-xs font-medium text-[#00A86B] uppercase tracking-wider">
                <th className="p-3 w-10">
                  <input type="checkbox" checked={selectedManifests.length === manifests.length && manifests.length > 0} onChange={toggleAll} className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                </th>
                {isAdminView && <th className="p-3 whitespace-nowrap">User</th>}
                <th className="p-3 whitespace-nowrap">Pickup ID</th>
                <th className="p-3 whitespace-nowrap">Pickup Address</th>
                <th className="p-3 whitespace-nowrap">Pickup Date</th>
                <th className="p-3 whitespace-nowrap">Shipments</th>
                <th className="p-3 whitespace-nowrap">Status</th>
                <th className="p-3 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-[#475569]">
              {manifests.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="p-10 text-center text-[#64748B] font-medium">
                    No manifests found
                  </td>
                </tr>
              ) : manifests.map((m) => (
                <tr key={m._id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                  <td className="p-3">
                    <input type="checkbox" checked={selectedManifests.includes(m._id)} onChange={() => toggleOne(m._id)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                  </td>

                  {/* User column — admin view only */}
                  {isAdminView && (
                    <td className="p-3">
                      <div className="text-xs font-semibold text-[#00A86B]">{m.userId?.userId || '—'}</div>
                      <div className="text-sm font-semibold text-[#0F172A] mt-0.5 truncate max-w-[140px]">{m.userId?.fullname}</div>
                      <div className="text-xs font-normal text-[#94A3B8] truncate max-w-[140px]">{m.userId?.email}</div>
                    </td>
                  )}

                  <td className="p-3">
                    <div className="text-xs font-semibold text-[#00A86B]">{m.pickupId}</div>
                    <div className="text-[10px] text-[#94A3B8] mt-0.5">{fmtTime(m.createdAt)}</div>
                  </td>

                  <td className="p-3 relative">
                    <div
                      className="text-[#64748B] underline decoration-dotted underline-offset-2 hover:text-[#0F172A] cursor-help inline-block truncate max-w-[130px]"
                      onMouseEnter={() => setHoveredAddressId(m._id)}
                      onMouseLeave={() => setHoveredAddressId(null)}
                    >
                      {m.pickupAddress?.contactName || '—'}
                    </div>
                    {hoveredAddressId === m._id && (
                      <div className="absolute z-[200] left-0 mt-1 p-3 bg-[#0F172A] text-white rounded-xl shadow-xl text-[10px] min-w-[200px] pointer-events-none">
                        <div className="font-bold mb-1 flex items-center gap-1.5"><MapPin className="w-3 h-3 text-[#00A86B]" />{m.pickupAddress?.contactName}</div>
                        <div className="text-slate-300">{m.pickupAddress?.address}</div>
                        <div className="text-slate-400">{m.pickupAddress?.city}, {m.pickupAddress?.state} – {m.pickupAddress?.pinCode || m.pickupAddress?.pincode}</div>
                        {m.pickupAddress?.phoneNumber && <div className="text-slate-400 mt-1">{m.pickupAddress?.phoneNumber}</div>}
                      </div>
                    )}
                  </td>

                  <td className="p-3 text-[#64748B]">{fmt(m.pickupDate)}</td>

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
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between shrink-0">
          <div className="text-xs text-[#64748B]">
            Showing <span className="font-bold text-[#0F172A]">{(page - 1) * ITEMS_PER_PAGE + 1}</span>
            {' '}–<span className="font-bold text-[#0F172A]">{Math.min(page * ITEMS_PER_PAGE, totalRecords)}</span>
            {' '}of <span className="font-bold text-[#0F172A]">{totalRecords}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50">
              Previous
            </button>
            {pageWindow().map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded text-xs font-medium flex items-center justify-center transition-colors ${p === page ? 'bg-[#00A86B] text-white border border-[#00A86B]' : 'border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
