import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';
import { Plus, Megaphone, Edit2, Trash2, X, Check, Search, ChevronDown } from 'lucide-react';
import { usePagination, DesktopPagination } from '../../hooks/usePagination';
import { TableLoader } from '../../components/ui/TableLoader';

interface AnnouncementUser {
  _id: string;
  fullname?: string;
  name?: string;
  email?: string;
}

interface Announcement {
  _id: string;
  message: string;
  enabled: boolean;
  targetAudience: 'all' | 'selected';
  selectedUsers: AnnouncementUser[];
  disableType: 'manual' | 'automated';
  automatedDuration: string | null;
  automatedDisableUntil: string | null;
  createdAt: string;
}

interface FormState {
  message: string;
  enabled: boolean;
  targetAudience: 'all' | 'selected';
  selectedUsers: { _id: string; fullname: string; email: string }[];
  disableType: 'manual' | 'automated';
  automatedDuration: string;
  customDate: string;
}

const DEFAULT_FORM: FormState = {
  message: '',
  enabled: true,
  targetAudience: 'all',
  selectedUsers: [],
  disableType: 'manual',
  automatedDuration: '1h',
  customDate: '',
};

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

export function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [userQuery, setUserQuery] = useState('');
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [searchTerm, setSearchTerm] = useState(
    (window as unknown as { __adminSearchQuery?: string }).__adminSearchQuery?.toLowerCase() || ''
  );

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const handleSearch = (e: Event) =>
      setSearchTerm(((e as CustomEvent).detail || '').toLowerCase());
    window.addEventListener('admin-search', handleSearch);
    return () => window.removeEventListener('admin-search', handleSearch);
  }, []);

  const fetchAnnouncements = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const res = await apiClient.get('/announcement/all');
      if (res.data.success) setAnnouncements(res.data.announcements);
    } catch {
      showToast('Failed to fetch announcements', 'error');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
    const interval = setInterval(() => fetchAnnouncements(false), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAnnouncements]);

  // User search for "selected" audience
  useEffect(() => {
    if (form.targetAudience !== 'selected' || userQuery.trim().length < 2) {
      setUserSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await apiClient.get(`/admin/searchUser?query=${encodeURIComponent(userQuery)}`);
        setUserSuggestions(res.data.users || []);
      } catch {
        setUserSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userQuery, form.targetAudience]);

  const openModal = () => {
    setForm(DEFAULT_FORM);
    setEditingId(null);
    setUserQuery('');
    setUserSuggestions([]);
    setIsModalOpen(true);
  };

  const openEditModal = (ann: Announcement) => {
    setEditingId(ann._id);
    setForm({
      message: ann.message,
      enabled: ann.enabled,
      targetAudience: ann.targetAudience,
      selectedUsers: (ann.selectedUsers || []).map((u: any) => ({
        _id: u._id,
        fullname: u.fullname || u.name || 'User',
        email: u.email || '',
      })),
      disableType: ann.disableType,
      automatedDuration: ann.automatedDuration || '1h',
      customDate: ann.automatedDisableUntil
        ? (() => {
            const d = new Date(ann.automatedDisableUntil);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          })()
        : '',
    });
    setUserQuery('');
    setUserSuggestions([]);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setUserQuery('');
    setUserSuggestions([]);
  };

  const addUser = (user: any) => {
    if (form.selectedUsers.some(u => u._id === user._id)) return;
    setForm(f => ({
      ...f,
      selectedUsers: [
        ...f.selectedUsers,
        { _id: user._id, fullname: user.fullname || 'User', email: user.email || '' },
      ],
    }));
    setUserQuery('');
    setUserSuggestions([]);
  };

  const removeUser = (id: string) =>
    setForm(f => ({ ...f, selectedUsers: f.selectedUsers.filter(u => u._id !== id) }));

  const handleSave = async () => {
    if (!form.message.trim()) { showToast('Announcement message is required', 'error'); return; }
    if (form.targetAudience === 'selected' && form.selectedUsers.length === 0) {
      showToast('Please select at least one user', 'error');
      return;
    }
    const payload = {
      message: form.message,
      enabled: form.enabled,
      targetAudience: form.targetAudience,
      selectedUsers: form.selectedUsers.map(u => u._id),
      disableType: form.disableType,
      automatedDuration: form.disableType === 'automated' ? form.automatedDuration : null,
      automatedDisableUntil:
        form.disableType === 'automated' && form.automatedDuration === 'custom'
          ? form.customDate
          : null,
    };
    try {
      const res = editingId
        ? await apiClient.put(`/announcement/update/${editingId}`, payload)
        : await apiClient.post('/announcement/create', payload);
      if (res.data.success) {
        showToast(editingId ? 'Announcement updated!' : 'Announcement created!');
        await fetchAnnouncements();
        closeModal();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const res = await apiClient.delete(`/announcement/delete/${id}`);
      if (res.data.success) { showToast('Announcement deleted!'); fetchAnnouncements(); }
    } catch { showToast('Delete failed', 'error'); }
  };

  const toggleEnable = async (ann: Announcement) => {
    try {
      const res = await apiClient.put(`/announcement/update/${ann._id}`, {
        message: ann.message,
        enabled: !ann.enabled,
        targetAudience: ann.targetAudience,
        selectedUsers: (ann.selectedUsers || []).map((u: any) => u._id),
        disableType: ann.disableType,
        automatedDuration: ann.automatedDuration,
        automatedDisableUntil: ann.automatedDisableUntil,
      });
      if (res.data.success) {
        showToast(`Announcement ${!ann.enabled ? 'enabled' : 'disabled'}!`);
        fetchAnnouncements(false);
      }
    } catch { showToast('Update failed', 'error'); }
  };

  const filtered = announcements.filter(a =>
    !searchTerm || a.message.toLowerCase().includes(searchTerm)
  );

  const {
    page: currentPage,
    setPage: setCurrentPage,
    totalPages,
    paginatedData,
    startIndex,
    endIndex,
    rowsPerPage,
    setRowsPerPage,
  } = usePagination({ data: filtered, perPage: 20 });

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">
        <div className="bg-white relative z-50 shrink-0">

          {/* Page Header */}
          <div className="px-6 py-4 border-b border-[#E2E8F0] bg-white flex justify-between items-center">
            <div>
              <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
                <Megaphone className="w-6 h-6 text-[#00A86B]" />
                Important Announcements
              </h1>
              <p className="text-xs text-[#64748B] mt-1">
                Create and manage alerts visible to users on their dashboard.
              </p>
            </div>
            <button
              onClick={openModal}
              className="h-9 px-4 rounded-full bg-[#00A86B] text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm hover:bg-[#009B63] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Create Announcement
            </button>
          </div>

          {/* Filter Row */}
          <div className="p-4 border-b border-[#E2E8F0] flex flex-wrap gap-3 items-center bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value.toLowerCase()); setCurrentPage(1); }}
                className="glass-search-input pl-8 w-[220px] shrink-0"
              />
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white flex flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
          <div className="hidden md:block flex-1 overflow-auto w-full relative">
            {loading && <TableLoader />}
            <table className="w-full text-left border-collapse min-w-full">
              <thead className="sticky top-0 z-40 bg-[#E6F5F1] shadow-sm">
                <tr className="text-[10px] font-extrabold text-[#00A86B] uppercase tracking-wider">
                  <th className="p-4 whitespace-nowrap">Created At</th>
                  <th className="p-4">Announcement Message</th>
                  <th className="p-4 whitespace-nowrap">Time Period</th>
                  <th className="p-4 whitespace-nowrap">User Scope</th>
                  <th className="p-4 whitespace-nowrap">Status</th>
                  <th className="p-4 whitespace-nowrap text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[12px] text-[#475569]">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-[#94A3B8] font-medium">
                      {loading ? '' : 'No announcements found.'}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map(ann => (
                    <tr key={ann._id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-4 align-top">
                        <div className="font-semibold text-[#0F172A] text-[12px]">{fmtDate(ann.createdAt)}</div>
                        <div className="text-[#94A3B8] text-[11px] mt-0.5">{fmtTime(ann.createdAt)}</div>
                      </td>
                      <td className="p-4 align-top relative group">
                        <p className="text-[#0F172A] font-normal text-[12px] leading-relaxed line-clamp-2 max-w-[420px]">
                          {ann.message}
                        </p>
                        <div className="absolute z-50 hidden group-hover:block bg-white text-[#0F172A] text-xs p-3 rounded-xl shadow-2xl border border-[#E2E8F0] w-[340px] left-4 top-full mt-1 break-words leading-relaxed">
                          {ann.message}
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          ann.disableType === 'manual'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-purple-50 text-purple-600'
                        }`}>
                          {ann.disableType === 'manual' ? 'Manual' : 'Automated'}
                        </span>
                        {ann.disableType === 'automated' && ann.automatedDisableUntil && (
                          <div className="text-[11px] text-[#94A3B8] mt-1.5">
                            Until: {fmtDate(ann.automatedDisableUntil)}, {fmtTime(ann.automatedDisableUntil)}
                          </div>
                        )}
                      </td>
                      <td className="p-4 align-top">
                        <span className="text-[12px] font-semibold text-[#0F172A]">
                          {ann.targetAudience === 'all'
                            ? 'All Users'
                            : `Selected (${ann.selectedUsers?.length || 0})`}
                        </span>
                      </td>
                      <td className="p-4 align-top">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={ann.enabled}
                            onChange={() => toggleEnable(ann)}
                          />
                          <div className="w-9 h-5 bg-[#E2E8F0] rounded-full peer peer-checked:bg-[#00A86B] transition-all" />
                          <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
                        </label>
                      </td>
                      <td className="p-4 align-top">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(ann)}
                            className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(ann._id)}
                            className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
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
              totalItems={filtered.length}
            />
          )}

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3 p-4 overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center text-[#94A3B8] font-medium">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-[#94A3B8] font-medium">No announcements found.</div>
          ) : (
            filtered.map(ann => (
              <div key={ann._id} className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="text-xs font-bold text-[#0F172A]">{fmtDate(ann.createdAt)}</div>
                    <div className="text-[10px] text-[#94A3B8] mt-0.5">{fmtTime(ann.createdAt)}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={ann.enabled} onChange={() => toggleEnable(ann)} />
                      <div className="w-8 h-4 bg-[#E2E8F0] rounded-full peer peer-checked:bg-[#00A86B] transition-all" />
                      <div className="absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
                    </label>
                    <button onClick={() => openEditModal(ann)} className="w-7 h-7 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-blue-50 hover:text-blue-600 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(ann._id)} className="w-7 h-7 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-red-50 hover:text-red-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-[#0F172A] font-medium leading-relaxed mb-3">{ann.message}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${ann.disableType === 'manual' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                    {ann.disableType === 'manual' ? 'Manual' : 'Automated'}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#F0FDF4] text-[#00A86B]">
                    {ann.targetAudience === 'all' ? 'All Users' : `${ann.selectedUsers?.length || 0} Users`}
                  </span>
                  {ann.disableType === 'automated' && ann.automatedDisableUntil && (
                    <span className="text-[10px] text-[#94A3B8]">
                      Until {fmtDate(ann.automatedDisableUntil)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={closeModal} />
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in max-h-[90vh] flex flex-col">

              {/* Modal Header */}
              <div className="flex justify-between items-center p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
                <h2 className="text-lg font-bold text-[#0F172A]">
                  {editingId ? 'Edit Announcement' : 'Create Announcement'}
                </h2>
                <button onClick={closeModal} className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#E2E8F0] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1">

                {/* Message */}
                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide">
                    Announcement Text Message
                  </label>
                  <textarea
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Enter announcement message..."
                    className="w-full h-28 p-4 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] resize-none"
                  />
                </div>

                {/* Active Status Toggle */}
                <div className="flex items-center justify-between p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                  <div>
                    <h4 className="text-sm font-bold text-[#0F172A]">Active Status</h4>
                    <p className="text-[11px] text-[#64748B] mt-0.5">Toggle display on user dashboard</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={form.enabled}
                      onChange={() => setForm(f => ({ ...f, enabled: !f.enabled }))}
                    />
                    <div className="w-11 h-6 bg-[#E2E8F0] rounded-full peer peer-checked:bg-[#00A86B] transition-all" />
                    <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5 shadow-sm" />
                  </label>
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-2 uppercase tracking-wide">
                    Selection for Users
                  </label>
                  <div className="flex items-center gap-6">
                    {(['all', 'selected'] as const).map(opt => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer select-none">
                        <div className="relative flex items-center justify-center w-4 h-4 shrink-0">
                          <div className={`w-4 h-4 rounded-full border-2 transition-all ${form.targetAudience === opt ? 'border-[#00A86B]' : 'border-[#CBD5E1]'}`}>
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#00A86B] transition-transform ${form.targetAudience === opt ? 'scale-100' : 'scale-0'}`} />
                          </div>
                          <input
                            type="radio"
                            className="sr-only"
                            checked={form.targetAudience === opt}
                            onChange={() => setForm(f => ({ ...f, targetAudience: opt, selectedUsers: [] }))}
                          />
                        </div>
                        <span className={`text-sm font-semibold ${form.targetAudience === opt ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>
                          {opt === 'all' ? 'All Users' : 'Selected Users'}
                        </span>
                      </label>
                    ))}
                  </div>

                  {form.targetAudience === 'selected' && (
                    <div className="mt-3 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-3">
                      <div className="relative">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search user by name or email..."
                            value={userQuery}
                            onChange={e => setUserQuery(e.target.value)}
                            className="w-full h-9 pl-8 pr-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none focus:border-[#00A86B]"
                          />
                          <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
                        </div>
                        {userSuggestions.length > 0 && (
                          <div className="absolute left-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 w-full max-h-48 overflow-y-auto py-1">
                            {userSuggestions.map((u: any) => (
                              <button
                                key={u._id}
                                onClick={() => addUser(u)}
                                className="w-full text-left px-4 py-2.5 text-xs text-[#0F172A] hover:bg-[#F8FAFC] flex flex-col"
                              >
                                <span className="font-semibold">{u.fullname}</span>
                                <span className="text-[#94A3B8]">{u.email}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 max-h-36 overflow-y-auto">
                        {form.selectedUsers.length === 0 ? (
                          <p className="text-center text-xs text-[#94A3B8] italic py-3">No users selected</p>
                        ) : (
                          form.selectedUsers.map(u => (
                            <div key={u._id} className="flex items-center justify-between p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs hover:border-[#00A86B] transition-colors">
                              <div className="min-w-0">
                                <div className="font-bold text-[#0F172A] truncate">{u.fullname}</div>
                                <div className="text-[#94A3B8] truncate">{u.email}</div>
                              </div>
                              <button
                                onClick={() => removeUser(u._id)}
                                className="ml-2 w-5 h-5 flex items-center justify-center text-[#94A3B8] hover:text-red-500 transition-colors shrink-0"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Disable Mode */}
                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-2 uppercase tracking-wide">
                    Disable Mode
                  </label>
                  <div className="flex items-center gap-6">
                    {(['manual', 'automated'] as const).map(opt => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer select-none">
                        <div className="relative flex items-center justify-center w-4 h-4 shrink-0">
                          <div className={`w-4 h-4 rounded-full border-2 transition-all ${form.disableType === opt ? 'border-[#00A86B]' : 'border-[#CBD5E1]'}`}>
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#00A86B] transition-transform ${form.disableType === opt ? 'scale-100' : 'scale-0'}`} />
                          </div>
                          <input
                            type="radio"
                            className="sr-only"
                            checked={form.disableType === opt}
                            onChange={() => setForm(f => ({ ...f, disableType: opt }))}
                          />
                        </div>
                        <span className={`text-sm font-semibold ${form.disableType === opt ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>
                          {opt === 'manual' ? 'Manual Disable' : 'Automated Disable'}
                        </span>
                      </label>
                    ))}
                  </div>

                  {form.disableType === 'automated' && (
                    <div className="mt-3 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1.5">Duration</label>
                        <div className="relative">
                          <select
                            value={form.automatedDuration}
                            onChange={e => setForm(f => ({ ...f, automatedDuration: e.target.value }))}
                            className="w-full h-9 px-3 pr-8 rounded-lg border border-[#E2E8F0] bg-white text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#00A86B] appearance-none"
                          >
                            <option value="1h">1 Hour</option>
                            <option value="1d">1 Day</option>
                            <option value="5d">5 Days</option>
                            <option value="custom">Custom Date</option>
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
                        </div>
                      </div>
                      {form.automatedDuration === 'custom' && (
                        <div>
                          <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1.5">Select Date & Time</label>
                          <input
                            type="datetime-local"
                            value={form.customDate}
                            onChange={e => setForm(f => ({ ...f, customDate: e.target.value }))}
                            className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#00A86B]"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="flex justify-end items-center p-5 border-t border-[#E2E8F0] bg-[#F8FAFC] gap-3 shrink-0">
                <button
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl font-bold text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.message.trim()}
                  className="px-6 py-2.5 rounded-xl bg-[#00A86B] text-white font-bold hover:bg-[#009B63] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {editingId ? 'Save Changes' : 'Publish Announcement'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-4 right-4 z-[120] px-4 py-2.5 rounded-xl border shadow-xl text-xs font-semibold flex items-center gap-2 animate-fade-in ${
            toast.type === 'error'
              ? 'bg-red-600 text-white border-red-700'
              : 'bg-[#0F172A] text-white border-[#1E293B]'
          }`}>
            <Check className="w-4 h-4 text-emerald-400" />
            {toast.message}
          </div>
        )}

    </AdminLayout>
  );
}
