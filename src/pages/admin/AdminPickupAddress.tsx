import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';
import { useAdminTab } from '../../context/AdminUserContext';
import {
  Plus, Download, Pencil, Trash2, Star, Loader2, X, MapPin, Phone, Mail, AlertCircle, Search,
  User, Hash, CheckCircle2, Settings, Filter, AlertTriangle, ChevronDown, ChevronUp,
} from 'lucide-react';
import pickupAddressBannerImg from '../../assets/pickup-address-banner.png';
import { useUserSearchFilter } from '../../hooks/filters/useUserSearchFilter';
import { useTableLoader } from '../../hooks/useTableLoader';
import { TableLoader } from '../../components/ui/TableLoader';
import { TruncatedText } from '../../components/ui/TruncatedText';
import { StatusRibbon } from '../../components/ui/StatusRibbon';
import { usePagination, DesktopPagination } from '../../hooks/usePagination';
import { MobilePaginationBar } from '../../hooks/useMobilePaginationBar';
import { AnimatePresence, motion } from 'framer-motion';
import { AddressAccuracyGauge } from '../../components/ui/AddressAccuracy';
import { AddressTooltip, type AddressHoverPos } from '../../components/ui/AddressTooltip';

const BACKEND_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/v1';

interface PickupDoc {
  _id: string;
  isPrimary: boolean;
  userId?: { _id: string; fullname: string; company: string; email: string; userId: number };
  pickupAddress: {
    contactName: string;
    email: string;
    phoneNumber: string;
    address: string;
    city: string;
    state: string;
    pinCode: string;
  };
}

const EMPTY_FORM = { contactName: '', email: '', phoneNumber: '', address: '', pinCode: '', city: '', state: '' };

const inputCls = (err?: string) =>
  `w-full h-11 px-4 border rounded-lg text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] transition-colors ${err ? 'border-red-400' : 'border-[#E2E8F0]'}`;

export function AdminPickupAddress() {
  const { isAdmin, adminTab } = useAdminTab();
  const isAdminView = isAdmin && adminTab;
  // AdminLayout adds a 32px impersonation banner (pt-8) above the page when an
  // admin is impersonating a user — the page height calc must account for it too,
  // otherwise the extra 32px overflows the viewport and the whole page scrolls.
  const isImpersonating = !!localStorage.getItem('admin_token_backup');

  const {
    userQuery,
    userSuggestions,
    userMongoId,
    onQueryChange: onUserQueryChange,
    selectUser: selectUserSuggestion,
    clearUser: clearUserFilter,
  } = useUserSearchFilter(isAdminView);

  const [addresses, setAddresses] = useState<PickupDoc[]>([]);
  const { isLoading: loading, setIsLoading: setLoading } = useTableLoader(0);
  const [hoveredAddress, setHoveredAddress] = useState<AddressHoverPos | null>(null);
  const [fetchError, setFetchError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // Same-as-Add-Order drawer extras: tag, geolocation, manual search-autocomplete, collapsibles
  const [addressTag, setAddressTag] = useState<'Home' | 'Work' | 'Warehouse' | 'Other'>('Home');
  const [atLocationNow, setAtLocationNow] = useState<'current' | 'manual'>('manual');
  const [locationSearch, setLocationSearch] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [locationSearching, setLocationSearching] = useState(false);
  const [showContactDetails, setShowContactDetails] = useState(true);
  const [showOperationalTimings, setShowOperationalTimings] = useState(false);
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationDetectError, setLocationDetectError] = useState('');
  const [locationDetectWarning, setLocationDetectWarning] = useState('');

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Primary in-progress
  const [primaryLoading, setPrimaryLoading] = useState<string | null>(null);

  // ── fetch ────────────────────────────────────────────────────────────────
  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const limit = isAdminView ? 500 : 100;
      const adminParam = isAdminView ? '&adminMode=true' : '';
      const userParam = isAdminView ? `&userId=${userMongoId || 'all'}` : '';
      const res = await apiClient.get(`/order/pickupAddress?limit=${limit}${adminParam}${userParam}`);
      setAddresses(res.data?.data ?? []);
    } catch {
      setFetchError('Failed to load pickup addresses.');
    } finally {
      setLoading(false);
    }
  }, [isAdminView, userMongoId]);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  // ── client-side search filter ────────────────────────────────────────────
  const filteredAddresses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return addresses;
    return addresses.filter(doc => {
      const a = doc.pickupAddress;
      const user = doc.userId;
      return (
        a.contactName.toLowerCase().includes(q) ||
        a.phoneNumber.includes(q) ||
        a.address.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.state.toLowerCase().includes(q) ||
        a.pinCode.includes(q) ||
        user?.fullname?.toLowerCase().includes(q) ||
        user?.company?.toLowerCase().includes(q)
      );
    });
  }, [addresses, searchQuery]);

  // ── pagination ────────────────────────────────────────────────────────────
  const {
    page, setPage, totalPages, paginatedData: paginatedAddresses,
    startIndex, endIndex, totalItems, rowsPerPage, setRowsPerPage,
  } = usePagination({ data: filteredAddresses, perPage: 20 });

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // ── pincode auto-fill ────────────────────────────────────────────────────
  useEffect(() => {
    const pin = form.pinCode;
    if (pin.length !== 6) {
      setForm(f => ({ ...f, city: '', state: '' }));
      return;
    }
    let cancelled = false;
    setPincodeLoading(true);
    apiClient.get(`/order/pincode/${pin}`)
      .then(res => {
        if (cancelled) return;
        const d = res.data;
        setForm(f => ({ ...f, city: d.city || d.District || '', state: d.state || d.State || '' }));
      })
      .catch(() => {
        if (!cancelled) setForm(f => ({ ...f, city: '', state: '' }));
      })
      .finally(() => { if (!cancelled) setPincodeLoading(false); });
    return () => { cancelled = true; };
  }, [form.pinCode]);

  // ── open add / edit ──────────────────────────────────────────────────────
  const openAdd = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setErrors({});
    resetDrawerExtras();
    setShowModal(true);
  };

  const openEdit = (doc: PickupDoc) => {
    setEditId(doc._id);
    setForm({ ...doc.pickupAddress });
    setErrors({});
    resetDrawerExtras();
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setErrors({}); };

  // ── validate ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.contactName.trim()) e.contactName = 'Required';
    if (!form.phoneNumber.trim()) e.phoneNumber = 'Required';
    else if (!/^[6-9]\d{9}$/.test(form.phoneNumber)) e.phoneNumber = '10 digits starting with 6-9';
    if (!form.address.trim()) e.address = 'Required';
    if (!form.pinCode.trim() || form.pinCode.length < 6) e.pinCode = 'Valid 6-digit pincode required';
    if (!form.city.trim()) e.city = 'Pincode lookup failed — enter city manually';
    if (!form.state.trim()) e.state = 'Pincode lookup failed — enter state manually';
    return e;
  };

  // ── save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      if (editId) {
        await apiClient.put(`/order/updatePickupAddress/${editId}`, form);
      } else {
        await apiClient.post('/order/pickupAddress', form);
      }
      await fetchAddresses();
      closeModal();
    } catch (err: any) {
      setErrors({ submit: err?.response?.data?.message || 'Failed to save address.' });
    } finally {
      setSaving(false);
    }
  };

  // ── set primary ──────────────────────────────────────────────────────────
  const handleSetPrimary = async (id: string) => {
    setPrimaryLoading(id);
    try {
      await apiClient.patch(`/order/pickupAddress/setPrimary/${id}`);
      setAddresses(prev => prev.map(a => ({ ...a, isPrimary: a._id === id })));
    } catch {
      // silent fail
    } finally {
      setPrimaryLoading(null);
    }
  };

  // ── delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/order/pickupAddress/${deleteId}`);
      setAddresses(prev => prev.filter(a => a._id !== deleteId));
      setDeleteId(null);
    } catch {
      // silent fail
    } finally {
      setDeleting(false);
    }
  };

  // ── download excel ───────────────────────────────────────────────────────
  const handleDownload = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const url = `${BACKEND_BASE}/order/pickupAddress/download-excel`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = 'pickup-addresses.xlsx';
        a.click();
        URL.revokeObjectURL(blobUrl);
      });
  };

  // ── field helpers ────────────────────────────────────────────────────────
  const setField = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErrors(prev => { const n = { ...prev }; delete n[k]; return n; });
  };

  const setPhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 10);
    if (!v || /^[6-9]/.test(v)) setForm(f => ({ ...f, phoneNumber: v }));
    setErrors(prev => { const n = { ...prev }; delete n.phoneNumber; return n; });
  };

  const setPin = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 6);
    setForm(f => ({ ...f, pinCode: v }));
    setErrors(prev => { const n = { ...prev }; delete n.pinCode; return n; });
  };

  // ── Detect device location and auto-fill the form (same as Add Order) ──
  const handleUseCurrentLocation = () => {
    setLocationDetectError('');
    setLocationDetectWarning('');
    if (!navigator.geolocation) {
      setLocationDetectError('Location access is not supported on this device.');
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=16&accept-language=en`,
            { headers: { Accept: 'application/json' } }
          );
          if (!res.ok) throw new Error('Geocoding API error');
          const data = await res.json();
          const a = data?.address || {};

          const rawPin = (a.postcode || '').replace(/\D/g, '').slice(0, 6);
          const pin = rawPin || (data?.display_name || '').match(/\b(\d{6})\b/)?.[1] || '';
          const city = a.city || a.town || a.municipality || a.city_district || a.village || a.suburb || a.county || '';
          const state = a.state || '';
          const streetParts = [
            a.house_number,
            a.road || a.pedestrian || a.footway || a.path,
            a.neighbourhood || a.quarter,
            a.suburb,
          ].filter(Boolean);
          const streetAddress = streetParts.length ? streetParts.join(', ') : (data?.display_name || '');

          setForm(prev => ({
            ...prev,
            address: streetAddress || prev.address,
            pinCode: pin || prev.pinCode,
            city: city || prev.city,
            state: state || prev.state,
          }));
          setLocationSearch(streetAddress || data?.display_name || '');

          if (!pin || !city || !state) {
            setLocationDetectWarning(
              'Location detected but some fields (pincode/city/state) could not be auto-filled. Please complete them manually.'
            );
          }
        } catch {
          setLocationDetectError('Could not determine your address from the detected location. Please enter it manually.');
        } finally {
          setDetectingLocation(false);
        }
      },
      (err) => {
        setDetectingLocation(false);
        setLocationDetectError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Please allow location access in your browser settings.'
            : err.code === 3
            ? 'Location detection timed out. Please try again or enter the address manually.'
            : 'Could not detect your location. Please enter the address manually.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Debounced forward geocoding for the manual location search box
  useEffect(() => {
    setLocationSuggestions([]);
    if (atLocationNow !== 'manual') return;
    const q = locationSearch.trim();
    if (q.length < 5) return;
    const timer = setTimeout(async () => {
      setLocationSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&countrycodes=in&limit=5&addressdetails=1`,
          { headers: { Accept: 'application/json' } }
        );
        const results = await res.json();
        setLocationSuggestions(Array.isArray(results) ? results : []);
      } catch {
        setLocationSuggestions([]);
      } finally {
        setLocationSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationSearch, atLocationNow]);

  const handleLocationSelect = (item: any) => {
    const a = item.address || {};
    const pin = (a.postcode || '').replace(/\D/g, '').slice(0, 6);
    const city = a.city || a.town || a.village || a.suburb || a.county || '';
    const state = a.state || '';
    const streetParts = [a.house_number, a.road || a.neighbourhood, a.suburb].filter(Boolean);
    const streetAddress = streetParts.length ? streetParts.join(', ') : item.display_name;
    setForm(prev => ({
      ...prev,
      address: streetAddress || prev.address,
      pinCode: pin || prev.pinCode,
      city: city || prev.city,
      state: state || prev.state,
    }));
    setLocationSearch(item.display_name);
    setLocationSuggestions([]);
  };

  const resetDrawerExtras = () => {
    setAddressTag('Home');
    setAtLocationNow('manual');
    setLocationSearch('');
    setLocationSuggestions([]);
    setLocationDetectError('');
    setLocationDetectWarning('');
    setOpeningTime('');
    setClosingTime('');
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className={`flex flex-col ${isImpersonating ? 'h-[calc(100vh-104px)]' : 'h-[calc(100vh-72px)]'} -m-4 md:-m-6 bg-white ${!isAdminView ? 'overflow-hidden' : ''}`}>

        {/* Top bar — desktop */}
        <div className="hidden md:flex md:flex-row md:items-center justify-between gap-3 px-4 md:px-6 py-4 border-b border-[#E2E8F0] shrink-0">
          <div>
            <h1 className="text-[20px] font-bold text-[#0F172A]">Pickup Addresses</h1>
            <p className="text-[13px] text-[#64748B] mt-0.5">
              {isAdminView ? 'All pickup addresses across all users' : 'Manage your saved pickup addresses'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* User search autocomplete — admin only */}
            {isAdminView && (
              <div className="relative shrink-0">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search user..."
                    value={userQuery}
                    onChange={e => onUserQueryChange(e.target.value)}
                    className="glass-search-input w-[180px]"
                  />
                  {(userQuery || userMongoId) && (
                    <button onClick={clearUserFilter} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569]">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {userSuggestions.length > 0 && !userMongoId && (
                  <div className="absolute left-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 w-64 max-h-52 overflow-y-auto py-1">
                    {userSuggestions.map((u: any) => (
                      <button key={u._id} type="button"
                        onClick={() => selectUserSuggestion(u)}
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

            {/* Search — always visible */}
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isAdminView ? 'Search by name, user, city…' : 'Search by name, city…'}
              className="glass-search-input w-[220px]"
            />

            {/* Export — always visible */}
            <button
              onClick={handleDownload}
              aria-label="Export Excel"
              className="w-9 h-9 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] hover:border-[#00A86B] hover:text-[#00A86B] transition-colors shrink-0"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Add — user only */}
            {!isAdminView && (
              <button
                onClick={openAdd}
                title="Add Address"
                aria-label="Add Address"
                className="w-9 h-9 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white flex items-center justify-center transition-colors shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search + Filter + Add Row (matches Orders page) */}
        <div className="md:hidden relative z-[60] px-3 py-2.5 border-b border-[#E2E8F0] flex items-center gap-2 bg-white shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder={isAdminView ? 'Search by name, user, city…' : 'Search by name, city…'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10 transition-all"
            />
          </div>
          {isAdminView && (
            <button
              onClick={() => setIsMobileFiltersOpen(true)}
              className="relative w-9 h-9 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#475569] bg-white shrink-0"
            >
              <Filter className="w-4 h-4" />
              {userMongoId && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#00A86B] border-2 border-white" />}
            </button>
          )}
          <button
            onClick={handleDownload}
            aria-label="Export Excel"
            className="w-9 h-9 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#475569] bg-white shrink-0"
          >
            <Download className="w-4 h-4" />
          </button>
          {!isAdminView && (
            <button
              onClick={openAdd}
              aria-label="Add Address"
              className="w-9 h-9 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white flex items-center justify-center shrink-0 shadow-sm"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Error */}
        {fetchError && (
          <div className="flex items-center gap-2 p-3 mx-4 md:mx-6 mt-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[13px] shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" /> {fetchError}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex-1 relative">
            <TableLoader />
          </div>
        ) : addresses.length === 0 ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-14 h-14 rounded-full bg-[#F0FDF4] flex items-center justify-center mb-4">
              <MapPin className="w-7 h-7 text-[#00A86B]" />
            </div>
            <p className="text-[15px] font-semibold text-[#0F172A] mb-1">No pickup addresses yet</p>
            <p className="text-[13px] text-[#64748B] mb-5">
              {isAdminView ? 'No addresses have been added by any user.' : 'Add your first pickup address to get started'}
            </p>
            {!isAdminView && (
              <button
                onClick={openAdd}
                className="flex items-center gap-2 h-9 px-5 rounded-lg bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Address
              </button>
            )}
          </div>
        ) : filteredAddresses.length === 0 ? (
          /* No search results */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <Search className="w-8 h-8 text-[#CBD5E1] mb-3" />
            <p className="text-[14px] font-semibold text-[#0F172A] mb-1">No results for "{searchQuery}"</p>
            <p className="text-[13px] text-[#64748B]">Try a different name, phone number, or city</p>
          </div>
        ) : (
          <>
            {/* ── Desktop table ─────────────────────────────────────────── */}
            <div className="hidden md:flex bg-white flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
              <div className="flex-1 overflow-auto w-full relative">
              <table className="w-full text-left border-collapse min-w-full">
                <thead className="sticky top-0 z-40 bg-[#E6F9F2] shadow-sm">
                  <tr className="text-xs leading-[18px] font-medium text-[#64748B] uppercase tracking-wider border border-[#B9EFDB]">
                    {isAdminView && <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><User className="w-3.5 h-3.5 shrink-0" /><span>User</span></div></th>}
                    <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><User className="w-3.5 h-3.5 shrink-0" /><span>Contact</span></div></th>
                    <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 shrink-0" /><span>Phone</span></div></th>
                    <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 shrink-0" /><span>Address</span></div></th>
                    <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>Accuracy</span></div></th>
                    <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 shrink-0" /><span>City / State</span></div></th>
                    <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><Hash className="w-3.5 h-3.5 shrink-0" /><span>Pincode</span></div></th>
                    <th className="py-2 px-4 text-center whitespace-nowrap"><div className="flex items-center justify-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>Status</span></div></th>
                    {!isAdminView && <th className="py-2 px-4 text-center whitespace-nowrap"><div className="flex items-center justify-center gap-1"><Settings className="w-3.5 h-3.5 shrink-0" /><span>Actions</span></div></th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedAddresses.map((doc, i) => {
                    const a = doc.pickupAddress;
                    return (
                      <tr key={doc._id} className={`border-b border-[#E2E8F0] transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'}`}>
                        {isAdminView && (
                          <td className="p-3 max-w-[180px]">
                            <TruncatedText text={doc.userId?.fullname || '—'} maxLength={22} className="text-[14px] leading-[20px] font-semibold text-[#0F172A]" />
                            {doc.userId?.company && <TruncatedText text={doc.userId.company} maxLength={26} className="text-[12px] leading-[18px] font-normal text-[#94A3B8]" />}
                          </td>
                        )}
                        <td className="p-3 max-w-[180px]">
                          <TruncatedText text={a.contactName} maxLength={22} className="text-[14px] leading-[20px] font-semibold text-[#0F172A]" />
                          {a.email && <TruncatedText text={a.email} maxLength={26} className="text-[12px] leading-[18px] font-normal text-[#94A3B8]" />}
                        </td>
                        <td className="p-3 text-[12px] font-normal text-[#475569]">{a.phoneNumber}</td>
                        <td className="p-3 max-w-[200px]">
                          <div
                            className="inline-block max-w-full w-fit text-[12px] font-normal text-[#475569] underline decoration-dotted underline-offset-2 hover:text-[#0F172A] cursor-help truncate"
                            onMouseEnter={(e) => setHoveredAddress({ rect: e.currentTarget.getBoundingClientRect(), name: a.contactName, address: a.address, city: a.city, state: a.state, pinCode: a.pinCode, phone: a.phoneNumber })}
                            onMouseLeave={() => setHoveredAddress(null)}
                          >
                            {a.address}
                          </div>
                        </td>
                        <td className="p-3">
                          <AddressAccuracyGauge address={a.address} size="sm" showLabel={false} />
                        </td>
                        <td className="p-3 text-[12px] font-normal text-[#475569]">{a.city}, {a.state}</td>
                        <td className="p-3 text-[12px] font-normal text-[#475569]">{a.pinCode}</td>
                        <td className="p-3 text-center">
                          {doc.isPrimary ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#D1FAE5] text-[#059669] text-[11px] font-bold">
                              <Star className="w-3 h-3 fill-[#059669]" /> Primary
                            </span>
                          ) : !isAdminView ? (
                            <button
                              onClick={() => handleSetPrimary(doc._id)}
                              disabled={!!primaryLoading}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#E2E8F0] text-[11px] font-semibold text-[#64748B] hover:border-[#00A86B] hover:text-[#00A86B] transition-colors disabled:opacity-50"
                            >
                              {primaryLoading === doc._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Star className="w-3 h-3" />}
                              Set Primary
                            </button>
                          ) : (
                            <span className="text-[12px] text-[#94A3B8]">—</span>
                          )}
                        </td>
                        {!isAdminView && (
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEdit(doc)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E2E8F0] text-[#475569] hover:border-[#00A86B] hover:text-[#00A86B] transition-colors"
                                title="Edit"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteId(doc._id)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E2E8F0] text-[#475569] hover:border-red-400 hover:text-red-500 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
              <DesktopPagination
                page={page} setPage={setPage} totalPages={totalPages}
                rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage}
                startIndex={startIndex} endIndex={endIndex} totalItems={totalItems}
              />
            </div>

            {/* ── Mobile cards ───────────────────────────────────────────── */}
            <div className="md:hidden flex flex-col flex-1 min-h-0 bg-[#F8FAFC]">
              <div className="flex-1 overflow-y-auto relative">
                <div className="p-2 space-y-2">
                  {paginatedAddresses.map(doc => {
                    const a = doc.pickupAddress;
                    const accent = doc.isPrimary ? '#00A86B' : '#94A3B8';
                    return (
                      <div key={doc._id} className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
                        {/* Ribbon Tag */}
                        <StatusRibbon label={doc.isPrimary ? 'Primary' : 'Address'} color={accent} />

                        <div className="pt-7 px-2.5 pb-2.5">
                          {/* Admin: user info row */}
                          {isAdminView && doc.userId && (
                            <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-[#F1F5F9]">
                              <div className="w-6 h-6 rounded-full bg-[#F0FDF4] flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-[#00A86B]">
                                  {doc.userId.fullname?.[0]?.toUpperCase() || 'U'}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <TruncatedText text={doc.userId.fullname || '—'} maxLength={22} className="text-[12px] font-semibold text-[#0F172A]" />
                                {doc.userId.company && <TruncatedText text={doc.userId.company} maxLength={26} className="text-[12px] font-normal text-[#94A3B8]" />}
                              </div>
                            </div>
                          )}

                          {/* Header row */}
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="min-w-0">
                              <TruncatedText text={a.contactName} maxLength={22} className="text-[12px] font-semibold text-[#0F172A]" />
                              {a.email && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Mail className="w-3 h-3 text-[#94A3B8] shrink-0" />
                                  <TruncatedText text={a.email} maxLength={26} className="text-[12px] font-normal text-[#94A3B8]" />
                                </div>
                              )}
                            </div>
                            {!isAdminView && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => openEdit(doc)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E2E8F0] text-[#475569] hover:border-[#00A86B] hover:text-[#00A86B] transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteId(doc._id)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E2E8F0] text-[#475569] hover:border-red-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="bg-[#F8FAFC] rounded-xl px-2.5 py-1.5 mb-2 space-y-1">
                            <div className="flex items-start gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-[#94A3B8] mt-0.5 shrink-0" />
                              <p className="text-[12px] font-normal text-[#0F172A]">{a.phoneNumber}</p>
                            </div>
                            <div className="flex items-start gap-1.5 min-w-0">
                              <MapPin className="w-3.5 h-3.5 text-[#94A3B8] mt-0.5 shrink-0" />
                              <p
                                className="inline-block max-w-full text-[12px] font-normal text-[#0F172A] truncate underline decoration-dotted underline-offset-2 cursor-help w-fit"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const next: AddressHoverPos = { id: doc._id, rect, name: a.contactName, address: a.address, city: a.city, state: a.state, pinCode: a.pinCode, phone: a.phoneNumber };
                                  setHoveredAddress(prev => (prev?.id === doc._id ? null : next));
                                }}
                              >
                                {a.address}, {a.city}, {a.state} - {a.pinCode}
                              </p>
                            </div>
                            <div className="flex items-center justify-end pt-1">
                              <AddressAccuracyGauge address={a.address} size="sm" showLabel={false} />
                            </div>
                          </div>

                          {/* Set primary — user only */}
                          {!isAdminView && !doc.isPrimary && (
                            <button
                              onClick={() => handleSetPrimary(doc._id)}
                              disabled={!!primaryLoading}
                              className="w-full flex items-center justify-center gap-1.5 h-8 rounded-xl border border-[#E2E8F0] text-[12px] font-semibold text-[#64748B] hover:border-[#00A86B] hover:text-[#00A86B] transition-colors disabled:opacity-50"
                            >
                              {primaryLoading === doc._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" />}
                              Set as Primary
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Pagination — sibling of the scroll area, not inside it, so it stays pinned */}
              {<MobilePaginationBar {...({
                page, setPage, totalPages, rowsPerPage, setRowsPerPage,
                startIndex, endIndex, totalItems,
              })} />}
            </div>
          </>
        )}
      </div>

      {/* ── Backdrop — closes the address tooltip on outside tap (mobile only, where it's click-triggered) ── */}
      {hoveredAddress && createPortal(
        <div className="fixed inset-0 z-[997] md:hidden" onClick={() => setHoveredAddress(null)} />,
        document.body
      )}
      <AddressTooltip hover={hoveredAddress} />

      {/* ── Mobile Filters Bottom Sheet (admin only — user search) ── */}
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
              className="bg-white rounded-t-3xl border-t border-[#E2E8F0] shadow-2xl w-full max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="font-bold text-slate-800 text-base">Filters</h3>
                <button onClick={() => setIsMobileFiltersOpen(false)} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search user..."
                    value={userQuery}
                    onChange={e => onUserQueryChange(e.target.value)}
                    className="w-full h-11 px-4 rounded-full border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]"
                  />
                  {(userQuery || userMongoId) && (
                    <button onClick={clearUserFilter} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {userSuggestions.length > 0 && !userMongoId && (
                    <div className="mt-1.5 bg-white border border-[#E2E8F0] rounded-2xl shadow-lg max-h-52 overflow-y-auto py-1">
                      {userSuggestions.map((u: any) => (
                        <button key={u._id} type="button" onClick={() => selectUserSuggestion(u)}
                          className="w-full text-left px-4 py-2.5 hover:bg-[#F0FDF4] flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-bold text-slate-800 truncate">{u.fullname}</div>
                            <div className="text-[11px] text-slate-400 truncate">{u.email} · {u.phoneNumber}</div>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">{u.userId}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={() => { clearUserFilter(); setIsMobileFiltersOpen(false); }}
                  className="flex-1 h-11 rounded-full border border-[#E2E8F0] text-[#475569] text-sm font-bold hover:bg-[#F8FAFC] transition-colors"
                >
                  Reset All
                </button>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="flex-1 h-11 rounded-full bg-[#009D64] text-white text-sm font-bold hover:bg-[#009B63] transition-colors shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add / Edit Pickup Address Drawer (user only) — same right-to-left
          slide-in drawer as AdminAddOrder's pickup address modal ─────────── */}
      <AnimatePresence>
        {showModal && !isAdminView && (
          <div className="fixed inset-0 z-[250] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.32 }}
              className="relative bg-white w-full max-w-3xl h-full shadow-[-24px_0_60px_-20px_rgba(0,0,0,0.25)] flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] shrink-0">
                <h3 className="text-[17px] font-bold text-[#0F172A]">
                  {editId ? 'Edit Pickup Address' : 'Add New Pickup Address'}
                </h3>
                <button onClick={closeModal}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F1F5F9] text-[#64748B]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 md:p-6 space-y-6 overflow-y-auto flex-1">
                {errors.submit && (
                  <p className="text-[12px] text-red-500">{errors.submit}</p>
                )}

                {/* ── Info banner: 3-step guidance ── */}
                <img
                  src={pickupAddressBannerImg}
                  alt="Provide your full address and exact location for accurate pickups. Share the contact details of the person handling shipment handover for smooth coordination. Specify your operational hours to ensure pickups are scheduled on time."
                  className="w-full h-auto rounded-xl"
                />

                {/* ── Address Details ── */}
                <div className="space-y-4">
                  <h4 className="text-[14px] font-bold text-[#0F172A]">Address Details</h4>

                  <div>
                    <label className="block text-[12px] font-bold text-[#64748B] mb-2">Tag this address as</label>
                    <div className="flex flex-wrap gap-2">
                      {(['Home', 'Work', 'Warehouse', 'Other'] as const).map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setAddressTag(tag)}
                          className={`h-9 px-4 rounded-full text-[12px] font-semibold border transition-colors ${
                            addressTag === tag
                              ? 'border-[#00A86B] text-[#00A86B] bg-[#F0FDF4]'
                              : 'border-[#E2E8F0] text-[#475569] hover:border-[#94A3B8]'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-[#64748B] mb-2">Are you at this address right now?</label>
                    <div className="flex flex-wrap gap-6">
                      {[
                        { value: 'current' as const, label: 'Yes, use my present location for address' },
                        { value: 'manual' as const, label: 'No, I will add the location manually' },
                      ].map(opt => (
                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                          <span
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              atLocationNow === opt.value ? 'border-[#00A86B]' : 'border-[#CBD5E1]'
                            }`}
                          >
                            {atLocationNow === opt.value && <span className="w-2 h-2 rounded-full bg-[#00A86B]" />}
                          </span>
                          <input
                            type="radio"
                            className="hidden"
                            checked={atLocationNow === opt.value}
                            onChange={() => {
                              setAtLocationNow(opt.value);
                              setLocationDetectError('');
                              if (opt.value === 'current') handleUseCurrentLocation();
                            }}
                          />
                          <span className="text-[13px] text-[#0F172A]">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {atLocationNow === 'current' && (
                    <div className={`rounded-xl border p-4 flex items-start gap-3 ${
                      locationDetectError ? 'bg-red-50 border-red-200' :
                      locationDetectWarning ? 'bg-amber-50 border-amber-200' :
                      'bg-[#F8FAFC] border-[#E2E8F0]'
                    }`}>
                      {detectingLocation ? (
                        <>
                          <Loader2 className="w-4 h-4 text-[#00A86B] animate-spin mt-0.5 shrink-0" />
                          <p className="text-[13px] text-[#475569]">Detecting your current location&hellip;</p>
                        </>
                      ) : locationDetectError ? (
                        <>
                          <MapPin className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[13px] text-red-600 font-medium">{locationDetectError}</p>
                            <button
                              type="button"
                              onClick={handleUseCurrentLocation}
                              className="mt-1.5 text-[12px] font-bold text-[#00A86B] hover:text-[#009B63]"
                            >
                              Try again
                            </button>
                          </div>
                        </>
                      ) : locationDetectWarning ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                          <p className="text-[13px] text-amber-700 font-medium">{locationDetectWarning}</p>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-[#00A86B] mt-0.5 shrink-0" />
                          <p className="text-[13px] text-[#475569]">
                            Location detected. Address fields below have been auto-filled &mdash; please review before saving.
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {atLocationNow === 'manual' && (
                    <div className="bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-4">
                      <p className="text-[13px] font-bold text-[#0F172A]">Search for your pickup address location/building name/area/landmark</p>
                      <p className="text-[11px] text-[#94A3B8] mb-3">Please add minimum 5 characters</p>
                      <div className="relative">
                        <Search className="w-4 h-4 text-[#94A3B8] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={locationSearch}
                          onChange={e => setLocationSearch(e.target.value)}
                          placeholder="Search Location"
                          className="w-full h-11 pl-11 pr-10 border border-[#E2E8F0] rounded-full text-[13px] bg-white placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]"
                        />
                        {locationSearching && (
                          <Loader2 className="w-4 h-4 text-[#00A86B] animate-spin absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        )}
                        {locationSuggestions.length > 0 && (
                          <div className="absolute left-0 top-full mt-1.5 w-full bg-white border border-[#E2E8F0] rounded-2xl shadow-xl z-50 max-h-56 overflow-y-auto py-1.5 thin-scrollbar">
                            {locationSuggestions.map((item, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleLocationSelect(item)}
                                className="w-full text-left px-4 py-2.5 hover:bg-[#F0FDF4] transition-colors flex items-start gap-2"
                              >
                                <MapPin className="w-3.5 h-3.5 text-[#94A3B8] shrink-0 mt-0.5" />
                                <span className="text-[12px] text-[#0F172A] leading-relaxed">{item.display_name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Address <span className="text-red-500">*</span></label>
                    {errors.address && <p className="text-[12px] md:text-[11px] text-red-500 mb-1">{errors.address}</p>}
                    <div className="relative">
                      <input type="text" value={form.address}
                        onChange={setField('address')}
                        placeholder="Street Address"
                        className={`w-full h-11 px-4 !pr-28 border rounded-full text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] ${errors.address ? 'border-red-400' : 'border-[#E2E8F0]'}`} />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">Accuracy</span>
                        <AddressAccuracyGauge address={form.address} size="sm" showLabel={false} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Pincode <span className="text-red-500">*</span></label>
                      {errors.pinCode && <p className="text-[12px] md:text-[11px] text-red-500 mb-1">{errors.pinCode}</p>}
                      <div className="relative">
                        <input type="text" inputMode="numeric" value={form.pinCode}
                          onChange={setPin}
                          placeholder="Pincode"
                          className={`w-full h-11 px-4 border rounded-full text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] ${errors.pinCode ? 'border-red-400' : 'border-[#E2E8F0]'}`} />
                        {pincodeLoading && <Loader2 className="w-4 h-4 text-[#00A86B] animate-spin absolute right-3 top-1/2 -translate-y-1/2" />}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">City <span className="text-red-500">*</span></label>
                      {errors.city && <p className="text-[12px] md:text-[11px] text-red-500 mb-1">{errors.city}</p>}
                      <input type="text" value={form.city} readOnly placeholder="Auto-filled"
                        className={`w-full h-11 px-4 border rounded-full text-[13px] bg-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none ${errors.city ? 'border-red-400' : 'border-[#E2E8F0]'}`} />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">State <span className="text-red-500">*</span></label>
                      {errors.state && <p className="text-[12px] md:text-[11px] text-red-500 mb-1">{errors.state}</p>}
                      <input type="text" value={form.state} readOnly placeholder="Auto-filled"
                        className={`w-full h-11 px-4 border rounded-full text-[13px] bg-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none ${errors.state ? 'border-red-400' : 'border-[#E2E8F0]'}`} />
                    </div>
                  </div>
                </div>

                {/* ── Contact Details (collapsible) ── */}
                <div className="border-t border-[#E2E8F0] pt-4">
                  <button
                    type="button"
                    onClick={() => setShowContactDetails(v => !v)}
                    className="w-full flex items-center justify-between"
                  >
                    <span className="text-[14px] font-bold text-[#0F172A]">Contact Details</span>
                    {showContactDetails ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
                  </button>
                  <AnimatePresence initial={false}>
                    {showContactDetails && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                          <div>
                            <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Contact Name <span className="text-red-500">*</span></label>
                            {errors.contactName && <p className="text-[12px] md:text-[11px] text-red-500 mb-1">{errors.contactName}</p>}
                            <input type="text" value={form.contactName}
                              onChange={setField('contactName')}
                              placeholder="Contact Name"
                              className={`w-full h-11 px-4 border rounded-full text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] ${errors.contactName ? 'border-red-400' : 'border-[#E2E8F0]'}`} />
                          </div>
                          <div>
                            <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Email</label>
                            <input type="email" value={form.email}
                              onChange={setField('email')}
                              placeholder="Email"
                              className="w-full h-11 px-4 border border-[#E2E8F0] rounded-full text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                            {errors.phoneNumber && <p className="text-[12px] md:text-[11px] text-red-500 mb-1">{errors.phoneNumber}</p>}
                            <input type="text" value={form.phoneNumber}
                              onChange={setPhone}
                              placeholder="Phone Number (10 digits, starts with 6-9)"
                              className={`w-full h-11 px-4 border rounded-full text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] ${errors.phoneNumber ? 'border-red-400' : 'border-[#E2E8F0]'}`} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Operational timings (collapsible, local-only) ── */}
                <div className="border-t border-[#E2E8F0] pt-4">
                  <button
                    type="button"
                    onClick={() => setShowOperationalTimings(v => !v)}
                    className="w-full flex items-center justify-between"
                  >
                    <span className="text-[14px] font-bold text-[#0F172A]">Operational timings</span>
                    {showOperationalTimings ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
                  </button>
                  <AnimatePresence initial={false}>
                    {showOperationalTimings && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                          <div>
                            <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Opens at</label>
                            <input type="time" value={openingTime}
                              onChange={e => setOpeningTime(e.target.value)}
                              className="w-full h-11 px-4 border border-[#E2E8F0] rounded-full text-[13px] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" />
                          </div>
                          <div>
                            <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Closes at</label>
                            <input type="time" value={closingTime}
                              onChange={e => setClosingTime(e.target.value)}
                              className="w-full h-11 px-4 border border-[#E2E8F0] rounded-full text-[13px] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex gap-3 px-6 py-4 border-t border-[#E2E8F0] shrink-0">
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-6 h-10 bg-[#00A86B] hover:bg-[#009B63] disabled:opacity-60 text-white text-[13px] font-bold rounded-full transition-colors">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editId ? 'Update Address' : 'Save Address'}
                </button>
                <button onClick={closeModal}
                  className="px-6 h-10 border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] text-[13px] font-bold rounded-full transition-colors">
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm Modal (user only) ─────────────────────────────── */}
      {deleteId && !isAdminView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-[15px] font-bold text-[#0F172A]">Delete Address?</h3>
            </div>
            <p className="text-[13px] text-[#64748B] mb-5">
              This pickup address will be permanently deleted and cannot be recovered.
            </p>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-2 flex-1 justify-center h-10 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-[13px] font-bold rounded-full transition-colors">
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
              <button onClick={() => setDeleteId(null)}
                className="flex-1 h-10 rounded-full border border-[#E2E8F0] text-[13px] font-semibold text-[#475569] hover:bg-[#F8FAFC] transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
