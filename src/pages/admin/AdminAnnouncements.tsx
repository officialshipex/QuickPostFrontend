import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Plus, Megaphone, AlertCircle, Info, Edit2, Trash2, X, Check } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'Info' | 'Warning' | 'Critical';
  status: 'Active' | 'Inactive';
  date: string;
}

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ANN-001',
    title: 'System Maintenance Scheduled',
    message: 'Our systems will undergo maintenance this Sunday from 2 AM to 4 AM. Expect brief downtime.',
    type: 'Warning',
    status: 'Active',
    date: '14 Apr 2026, 10:30 AM'
  },
  {
    id: 'ANN-002',
    title: 'New Feature: Wallet Recharge',
    message: 'You can now instantly recharge your wallet using UPI! Try it out from the Finance section.',
    type: 'Info',
    status: 'Active',
    date: '12 Apr 2026, 02:15 PM'
  },
  {
    id: 'ANN-003',
    title: 'Delays in Delhivery Pickups',
    message: 'Due to severe weather conditions, Delhivery surface pickups might be delayed by 24-48 hours in the North region.',
    type: 'Critical',
    status: 'Inactive',
    date: '10 Apr 2026, 09:00 AM'
  }
];

export function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [searchTerm, setSearchTerm] = useState(() => 
    (window as unknown as { __adminSearchQuery?: string }).__adminSearchQuery?.toLowerCase() || ''
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Sync search from global navbar header
  useEffect(() => {
    const handleSearch = (e: Event) => {
      setSearchTerm(((e as CustomEvent).detail || '').toLowerCase());
    };
    window.addEventListener('admin-search', handleSearch);
    return () => {
      window.removeEventListener('admin-search', handleSearch);
    };
  }, []);

  // Form State
  const [formData, setFormData] = useState<Partial<Announcement>>({
    title: '',
    message: '',
    type: 'Info',
    status: 'Active'
  });

  const filteredAnnouncements = announcements.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = () => {
    setFormData({ title: '', message: '', type: 'Info', status: 'Active' });
    setEditingAnnouncement(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Announcement) => {
    setFormData({
      title: item.title,
      message: item.message,
      type: item.type,
      status: item.status
    });
    setEditingAnnouncement(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAnnouncement(null);
  };

  const handleSave = () => {
    if (!formData.title || !formData.message) return;

    if (editingAnnouncement) {
      setAnnouncements(announcements.map(a => 
        a.id === editingAnnouncement.id 
          ? { 
              ...a, 
              title: formData.title!, 
              message: formData.message!, 
              type: formData.type as Announcement['type'], 
              status: formData.status as Announcement['status'] 
            } 
          : a
      ));
      showToast('Announcement updated successfully!');
    } else {
      const newAnnouncement: Announcement = {
        id: `ANN-${String(announcements.length + 1).padStart(3, '0')}`,
        title: formData.title,
        message: formData.message,
        type: formData.type as Announcement['type'],
        status: formData.status as Announcement['status'],
        date: new Date().toLocaleString('en-GB', { 
          day: 'numeric', month: 'short', year: 'numeric', 
          hour: '2-digit', minute: '2-digit' 
        }).replace(',', '')
      };

      setAnnouncements([newAnnouncement, ...announcements]);
      showToast('Announcement created successfully!');
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    setAnnouncements(announcements.filter(a => a.id !== id));
    showToast('Announcement deleted successfully!');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Info': return <Info className="w-4 h-4 text-blue-500" />;
      case 'Warning': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'Critical': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Megaphone className="w-4 h-4 text-[#00A86B]" />;
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto pb-10">
        
        {/* Header Title block */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-[#00A86B]" />
              Important Announcements
            </h2>
            <p className="text-xs text-[#64748B] mt-1">Create and manage alerts visible to users on their dashboard.</p>
          </div>
          
          <button 
            onClick={handleOpenModal}
            className="h-9 px-4 rounded-lg bg-[#00A86B] text-white text-xs font-semibold flex items-center gap-2 hover:bg-[#009B63] shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Announcement
          </button>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] uppercase tracking-wider font-bold text-[#64748B]">
                  <th className="p-4">Announcement Details</th>
                  <th className="p-4 w-32">Type</th>
                  <th className="p-4 w-32">Status</th>
                  <th className="p-4 w-40">Created At</th>
                  <th className="p-4 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-[#475569]">
                {filteredAnnouncements.map((item) => (
                  <tr key={item.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                    <td className="p-4 align-top">
                      <div className="font-bold text-[#0F172A] text-sm">{item.title}</div>
                      <div className="text-[#64748B] mt-1 pr-8 leading-relaxed line-clamp-2">{item.message}</div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {getTypeIcon(item.type)}
                        <span className={`font-semibold ${
                          item.type === 'Critical' ? 'text-red-600' :
                          item.type === 'Warning' ? 'text-orange-600' : 'text-blue-600'
                        }`}>{item.type}</span>
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <span className={`px-3 py-1 rounded-full border text-[11px] font-bold mt-0.5 inline-block ${
                        item.status === 'Active' 
                          ? 'bg-green-50 text-[#00A86B] border-green-200' 
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 align-top">
                      <div className="text-[#0F172A] font-medium mt-0.5">{item.date.split(',')[0]}</div>
                      <div className="text-[#64748B] text-[11px] mt-0.5">{item.date.split(',')[1]}</div>
                    </td>
                    <td className="p-4 align-top text-right">
                      <div className="flex items-center justify-end gap-2 mt-0.5">
                        <button 
                          onClick={() => handleOpenEditModal(item)}
                          className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAnnouncements.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
                      No announcements found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={handleCloseModal} />
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
              <div className="flex justify-between items-center p-5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <h2 className="text-lg font-bold text-[#0F172A]">
                  {editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
                </h2>
                <button onClick={handleCloseModal} className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#E2E8F0] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide">Announcement Title</label>
                  <input 
                    type="text" 
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. System Maintenance Scheduled"
                    className="w-full h-11 px-4 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide">Message Content</label>
                  <textarea 
                    value={formData.message || ''}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Write your announcement details here..."
                    className="w-full h-32 p-4 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide">Type / Urgency</label>
                    <select 
                      value={formData.type || 'Info'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as Announcement['type'] })}
                      className="w-full h-11 px-4 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] appearance-none"
                    >
                      <option value="Info">Info (Blue)</option>
                      <option value="Warning">Warning (Orange)</option>
                      <option value="Critical">Critical (Red)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide">Status</label>
                    <select 
                      value={formData.status || 'Active'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Announcement['status'] })}
                      className="w-full h-11 px-4 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] appearance-none"
                    >
                      <option value="Active">Active (Visible)</option>
                      <option value="Inactive">Inactive (Hidden)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end items-center p-5 border-t border-[#E2E8F0] bg-[#F8FAFC] gap-3">
                <button onClick={handleCloseModal} className="px-5 py-2.5 rounded-xl font-bold text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={!formData.title || !formData.message}
                  className="px-6 py-2.5 rounded-xl bg-[#00A86B] text-white font-bold hover:bg-[#009B63] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {editingAnnouncement ? 'Save Changes' : 'Publish Announcement'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success / Info Toast */}
        {toast && (
          <div className="fixed bottom-4 right-4 z-[120] bg-[#0F172A] text-white px-4 py-2.5 rounded-xl border border-[#1E293B] shadow-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            {toast.message}
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
