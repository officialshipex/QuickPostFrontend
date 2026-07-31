import { useState, useEffect, useCallback, useMemo } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';
import { useAdminTab } from '../../context/AdminUserContext';
import {
  Plus, Download, Pencil, Trash2, Star, Loader2, X, MapPin, Phone, Mail, AlertCircle, Search,
} from 'lucide-react';
import { useUserSearchFilter } from '../../hooks/filters/useUserSearchFilter';

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

  const {
    userQuery,
    userSuggestions,
    userMongoId,
    onQueryChange: onUserQueryChange,
    selectUser: selectUserSuggestion,
    clearUser: clearUserFilter,
  } = useUserSearchFilter(isAdminView);

  const [addresses, setAddresses] = useState<PickupDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);

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
      const userParam = isAdminView && userMongoId ? `&userId=${userMongoId}` : '';
      const res = await apiClient.get(`/order/pickupAddress?limit=${limit}${userParam}`);
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
    setShowModal(true);
  };

  const openEdit = (doc: PickupDoc) => {
    setEditId(doc._id);
    setForm({ ...doc.pickupAddress });
    setErrors({});
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

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto pb-10">

        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
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
                  <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Filter by user..."
                    value={userQuery}
                    onChange={e => onUserQueryChange(e.target.value)}
                    className="h-9 pl-9 pr-8 w-[180px] rounded-lg border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] transition-colors"
                  />
                  {(userQuery || userMongoId) && (
                    <button onClick={clearUserFilter} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569]">
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
            <div className="relative">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isAdminView ? 'Search by name, user, city…' : 'Search by name, city…'}
                className="h-9 pl-9 pr-3 w-[220px] rounded-lg border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] transition-colors"
              />
            </div>

            {/* Export — always visible */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 h-9 px-4 rounded-lg border border-[#E2E8F0] bg-white text-[13px] font-semibold text-[#475569] hover:border-[#00A86B] hover:text-[#00A86B] transition-colors"
            >
              <Download className="w-4 h-4" /> Export Excel
            </button>

            {/* Add — user only */}
            {!isAdminView && (
              <button
                onClick={openAdd}
                className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-semibold transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Address
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {fetchError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[13px] mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" /> {fetchError}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-[#00A86B]" />
          </div>
        ) : addresses.length === 0 ? (
          /* Empty state */
          <div className="bg-white border border-dashed border-[#CBD5E1] rounded-2xl flex flex-col items-center justify-center py-16 px-6 text-center">
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
          <div className="bg-white border border-[#E2E8F0] rounded-2xl flex flex-col items-center justify-center py-12 px-6 text-center">
            <Search className="w-8 h-8 text-[#CBD5E1] mb-3" />
            <p className="text-[14px] font-semibold text-[#0F172A] mb-1">No results for "{searchQuery}"</p>
            <p className="text-[13px] text-[#64748B]">Try a different name, phone number, or city</p>
          </div>
        ) : (
          <>
            {/* ── Desktop table ─────────────────────────────────────────── */}
            <div className="hidden md:block bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    {isAdminView && <th className="px-5 py-3.5 text-left font-semibold text-[#475569]">User</th>}
                    <th className="px-5 py-3.5 text-left font-semibold text-[#475569]">Contact</th>
                    <th className="px-5 py-3.5 text-left font-semibold text-[#475569]">Phone</th>
                    <th className="px-5 py-3.5 text-left font-semibold text-[#475569]">Address</th>
                    <th className="px-5 py-3.5 text-left font-semibold text-[#475569]">City / State</th>
                    <th className="px-5 py-3.5 text-left font-semibold text-[#475569]">Pincode</th>
                    <th className="px-5 py-3.5 text-center font-semibold text-[#475569]">Status</th>
                    {!isAdminView && <th className="px-5 py-3.5 text-center font-semibold text-[#475569]">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredAddresses.map((doc, i) => {
                    const a = doc.pickupAddress;
                    return (
                      <tr key={doc._id} className={`border-b border-[#F1F5F9] last:border-0 hover:bg-[#FAFFFE] transition-colors ${i % 2 === 1 ? 'bg-[#FAFFFE]' : ''}`}>
                        {isAdminView && (
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-[#0F172A]">{doc.userId?.fullname || '—'}</p>
                            {doc.userId?.company && <p className="text-[12px] text-[#94A3B8] mt-0.5">{doc.userId.company}</p>}
                          </td>
                        )}
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-[#0F172A]">{a.contactName}</p>
                          {a.email && <p className="text-[12px] text-[#94A3B8] mt-0.5">{a.email}</p>}
                        </td>
                        <td className="px-5 py-3.5 text-[#475569]">{a.phoneNumber}</td>
                        <td className="px-5 py-3.5 text-[#475569] max-w-[200px]">
                          <p className="truncate">{a.address}</p>
                        </td>
                        <td className="px-5 py-3.5 text-[#475569]">{a.city}, {a.state}</td>
                        <td className="px-5 py-3.5 text-[#475569]">{a.pinCode}</td>
                        <td className="px-5 py-3.5 text-center">
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
                          <td className="px-5 py-3.5">
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

            {/* ── Mobile cards ───────────────────────────────────────────── */}
            <div className="flex flex-col gap-3 md:hidden">
              {filteredAddresses.map(doc => {
                const a = doc.pickupAddress;
                return (
                  <div key={doc._id} className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm">
                    {/* Admin: show user info banner */}
                    {isAdminView && doc.userId && (
                      <div className="flex items-center gap-1.5 mb-3 pb-3 border-b border-[#F1F5F9]">
                        <div className="w-6 h-6 rounded-full bg-[#F0FDF4] flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-[#00A86B]">
                            {doc.userId.fullname?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold text-[#0F172A]">{doc.userId.fullname}</p>
                          {doc.userId.company && <p className="text-[11px] text-[#94A3B8]">{doc.userId.company}</p>}
                        </div>
                      </div>
                    )}

                    {/* Header row */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-bold text-[#0F172A]">{a.contactName}</p>
                          {doc.isPrimary && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#059669] text-[10px] font-bold">
                              <Star className="w-2.5 h-2.5 fill-[#059669]" /> Primary
                            </span>
                          )}
                        </div>
                        {a.email && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-[#94A3B8]" />
                            <p className="text-[12px] text-[#94A3B8]">{a.email}</p>
                          </div>
                        )}
                      </div>
                      {!isAdminView && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEdit(doc)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E2E8F0] text-[#475569] hover:border-[#00A86B] hover:text-[#00A86B] transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(doc._id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E2E8F0] text-[#475569] hover:border-red-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex items-start gap-2 mb-2">
                      <Phone className="w-3.5 h-3.5 text-[#94A3B8] mt-0.5 shrink-0" />
                      <p className="text-[13px] text-[#475569]">{a.phoneNumber}</p>
                    </div>
                    <div className="flex items-start gap-2 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-[#94A3B8] mt-0.5 shrink-0" />
                      <p className="text-[13px] text-[#475569]">{a.address}, {a.city}, {a.state} - {a.pinCode}</p>
                    </div>

                    {/* Set primary — user only */}
                    {!isAdminView && !doc.isPrimary && (
                      <button
                        onClick={() => handleSetPrimary(doc._id)}
                        disabled={!!primaryLoading}
                        className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg border border-[#E2E8F0] text-[13px] font-semibold text-[#64748B] hover:border-[#00A86B] hover:text-[#00A86B] transition-colors disabled:opacity-50"
                      >
                        {primaryLoading === doc._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" />}
                        Set as Primary
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Add / Edit Modal (user only) ──────────────────────────────────── */}
      {showModal && !isAdminView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] shrink-0">
              <h3 className="text-[15px] font-bold text-[#0F172A]">
                {editId ? 'Edit Pickup Address' : 'Add New Pickup Address'}
              </h3>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F1F5F9] text-[#64748B] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {errors.submit && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-[12px]">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {errors.submit}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Contact Name <span className="text-red-500">*</span></label>
                  {errors.contactName && <p className="text-[11px] text-red-500 mb-1">{errors.contactName}</p>}
                  <input type="text" value={form.contactName} onChange={setField('contactName')} placeholder="Full contact name" className={inputCls(errors.contactName)} />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Email <span className="text-[#94A3B8] font-normal">(optional)</span></label>
                  <input type="email" value={form.email} onChange={setField('email')} placeholder="email@example.com" className={inputCls()} />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                {errors.phoneNumber && <p className="text-[11px] text-red-500 mb-1">{errors.phoneNumber}</p>}
                <input type="text" inputMode="numeric" value={form.phoneNumber} onChange={setPhone} placeholder="10-digit number starting with 6-9" className={inputCls(errors.phoneNumber)} />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Address <span className="text-red-500">*</span></label>
                {errors.address && <p className="text-[11px] text-red-500 mb-1">{errors.address}</p>}
                <input type="text" value={form.address} onChange={setField('address')} placeholder="Street / Area / Landmark" className={inputCls(errors.address)} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Pincode <span className="text-red-500">*</span></label>
                  {errors.pinCode && <p className="text-[11px] text-red-500 mb-1">{errors.pinCode}</p>}
                  <div className="relative">
                    <input type="text" inputMode="numeric" value={form.pinCode} onChange={setPin} placeholder="6-digit pin" className={inputCls(errors.pinCode)} />
                    {pincodeLoading && <Loader2 className="w-4 h-4 text-[#00A86B] animate-spin absolute right-3 top-1/2 -translate-y-1/2" />}
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">City <span className="text-red-500">*</span></label>
                  {errors.city && <p className="text-[11px] text-red-500 mb-1">{errors.city}</p>}
                  <input type="text" value={form.city} onChange={setField('city')} placeholder="Auto-filled"
                    className={`${inputCls(errors.city)} ${!errors.city && form.pinCode.length === 6 ? 'bg-[#F8FAFC]' : ''}`}
                    readOnly={!errors.city && form.pinCode.length === 6 && !pincodeLoading} />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">State <span className="text-red-500">*</span></label>
                  {errors.state && <p className="text-[11px] text-red-500 mb-1">{errors.state}</p>}
                  <input type="text" value={form.state} onChange={setField('state')} placeholder="Auto-filled"
                    className={`${inputCls(errors.state)} ${!errors.state && form.pinCode.length === 6 ? 'bg-[#F8FAFC]' : ''}`}
                    readOnly={!errors.state && form.pinCode.length === 6 && !pincodeLoading} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-[#E2E8F0] shrink-0">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-6 h-10 bg-[#00A86B] hover:bg-[#009B63] disabled:opacity-60 text-white text-[13px] font-bold rounded-full transition-colors">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editId ? 'Save Changes' : 'Add Address'}
              </button>
              <button onClick={closeModal}
                className="px-6 h-10 rounded-full border border-[#E2E8F0] text-[13px] font-semibold text-[#475569] hover:bg-[#F8FAFC] transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
