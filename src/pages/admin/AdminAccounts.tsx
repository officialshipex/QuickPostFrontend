import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Shield, Plus, Edit, Trash2, X, Check } from 'lucide-react';

const INITIAL_ADMINS = [
  { id: 1, name: 'Super Admin', email: 'admin@quickpost.in', role: 'Super Admin', lastLogin: 'Just now', status: 'Active' },
  { id: 2, name: 'Rahul Sharma', email: 'rahul.s@quickpost.in', role: 'Support Lead', lastLogin: '2 hrs ago', status: 'Active' },
  { id: 3, name: 'Anita Desai', email: 'anita.d@quickpost.in', role: 'Operations Manager', lastLogin: '1 day ago', status: 'Active' },
  { id: 4, name: 'Vikram Singh', email: 'vikram.s@quickpost.in', role: 'Finance Admin', lastLogin: '3 days ago', status: 'Active' },
  { id: 5, name: 'Pooja Reddy', email: 'pooja.r@quickpost.in', role: 'Support Agent', lastLogin: '1 week ago', status: 'Inactive' },
];

export function AdminAccounts() {
  const [admins, setAdmins] = useState(INITIAL_ADMINS);
  const [searchQuery, setSearchQuery] = useState((window as any).__adminSearchQuery?.toLowerCase() || '');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<any | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Support Agent');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Sync search from global navbar header
  useEffect(() => {
    const handleSearch = (e: Event) => {
      setSearchQuery(((e as CustomEvent).detail || '').toLowerCase());
    };
    window.addEventListener('admin-search', handleSearch);
    setSearchQuery(((window as any).__adminSearchQuery || '').toLowerCase());
    return () => {
      window.removeEventListener('admin-search', handleSearch);
    };
  }, []);

  // Filter admins list based on search query
  const filteredAdmins = admins.filter(admin => {
    const q = searchQuery.toLowerCase();
    return (
      admin.name.toLowerCase().includes(q) ||
      admin.email.toLowerCase().includes(q) ||
      admin.role.toLowerCase().includes(q)
    );
  });

  const handleOpenAddModal = () => {
    setName('');
    setEmail('');
    setRole('Support Agent');
    setStatus('Active');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (admin: any) => {
    setEditingAdmin(admin);
    setName(admin.name);
    setEmail(admin.email);
    setRole(admin.role);
    setStatus(admin.status);
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteConfirm = (admin: any) => {
    setDeletingAdmin(admin);
    setIsDeleteConfirmOpen(true);
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast('Please fill out all required fields', 'error');
      return;
    }
    const newAdmin = {
      id: Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      status,
      lastLogin: 'Never',
    };
    setAdmins([...admins, newAdmin]);
    setIsAddModalOpen(false);
    showToast(`Admin account for ${newAdmin.name} created!`);
  };

  const handleEditAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin || !name.trim() || !email.trim()) {
      showToast('Please fill out all required fields', 'error');
      return;
    }
    setAdmins(
      admins.map(a =>
        a.id === editingAdmin.id
          ? { ...a, name: name.trim(), email: email.trim().toLowerCase(), role, status }
          : a
      )
    );
    setIsEditModalOpen(false);
    setEditingAdmin(null);
    showToast('Admin account details updated!');
  };

  const handleConfirmDelete = () => {
    if (!deletingAdmin) return;
    setAdmins(admins.filter(a => a.id !== deletingAdmin.id));
    setIsDeleteConfirmOpen(false);
    showToast(`Access revoked for ${deletingAdmin.name}`);
    setDeletingAdmin(null);
  };

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto pb-10">
        
        {/* Header Title block */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A]">Admin Accounts</h2>
            <p className="text-xs text-[#64748B] mt-1">Manage staff access and role permissions.</p>
          </div>
          <button 
            onClick={handleOpenAddModal}
            className="h-9 px-4 rounded-lg bg-[#00A86B] text-white text-xs font-semibold flex items-center gap-2 hover:bg-[#009B63] shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Admin
          </button>
        </div>

        {/* Table of Admins */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] uppercase tracking-wider font-bold text-[#64748B]">
                  <th className="p-4">Staff Member</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Last Login</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[14px] font-normal text-[#475569]">
                {filteredAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                      No admin accounts found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredAdmins.map(admin => (
                    <tr key={admin.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#10B981]/10 text-[#00A86B] flex items-center justify-center font-bold text-xs shrink-0">
                            {admin.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-[#0F172A] font-semibold text-[14px] leading-tight">{admin.name}</div>
                            <div className="font-sans text-xs font-normal text-[#94A3B8] mt-0.5">{admin.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <Shield className={`w-3.5 h-3.5 ${admin.role === 'Super Admin' ? 'text-purple-500' : 'text-[#64748B]'}`} />
                          <span className={`font-semibold ${admin.role === 'Super Admin' ? 'text-purple-600' : 'text-[#475569]'}`}>{admin.role}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${admin.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>{admin.status}</span>
                      </td>
                      <td className="p-4 text-[#64748B]">{admin.lastLogin}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenEditModal(admin)}
                            className="w-7 h-7 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#00A86B] transition-colors" 
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleOpenDeleteConfirm(admin)}
                            className="w-7 h-7 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-red-50 hover:text-red-500 transition-colors" 
                            title="Revoke Access"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add / Edit Admin Modal */}
        {(isAddModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
            <div 
              className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm transition-opacity"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                setEditingAdmin(null);
              }}
            />
            <div className="relative w-full max-w-md bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl overflow-hidden flex flex-col p-6 z-10">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-base font-bold text-[#0F172A]">
                  {isEditModalOpen ? 'Edit Admin Account' : 'Add Admin Account'}
                </h3>
                <button 
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    setEditingAdmin(null);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <form onSubmit={isEditModalOpen ? handleEditAdmin : handleAddAdmin} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] mb-1.5 uppercase tracking-wider">Full Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] font-medium"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] mb-1.5 uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    required
                    placeholder="e.g. rahul.s@quickpost.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] mb-1.5 uppercase tracking-wider">Role</label>
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] font-medium"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Support Lead">Support Lead</option>
                    <option value="Operations Manager">Operations Manager</option>
                    <option value="Finance Admin">Finance Admin</option>
                    <option value="Support Agent">Support Agent</option>
                    <option value="Operations Agent">Operations Agent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] mb-1.5 uppercase tracking-wider">Account Status</label>
                  <div className="flex items-center gap-4 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#475569]">
                      <input 
                        type="radio" 
                        name="status"
                        checked={status === 'Active'}
                        onChange={() => setStatus('Active')}
                        className="text-[#00A86B] focus:ring-[#00A86B]/20"
                      />
                      Active
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#475569]">
                      <input 
                        type="radio" 
                        name="status"
                        checked={status === 'Inactive'}
                        onChange={() => setStatus('Inactive')}
                        className="text-[#00A86B] focus:ring-[#00A86B]/20"
                      />
                      Inactive
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-[#E2E8F0] mt-6">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setIsEditModalOpen(false);
                      setEditingAdmin(null);
                    }}
                    className="h-9 px-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="h-9 px-4 rounded-lg bg-[#00A86B] text-white text-xs font-semibold hover:bg-[#009B63] transition-colors shadow-sm"
                  >
                    {isEditModalOpen ? 'Save Changes' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete / Revoke Access Confirmation Modal */}
        {isDeleteConfirmOpen && deletingAdmin && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
            <div 
              className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm transition-opacity"
              onClick={() => {
                setIsDeleteConfirmOpen(false);
                setDeletingAdmin(null);
              }}
            />
            <div className="relative w-full max-w-sm bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl overflow-hidden flex flex-col p-6 z-10">
              <div className="flex flex-col items-center text-center p-2">
                <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center border border-red-100 mb-4">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#0F172A] mb-1">Revoke Staff Access?</h3>
                <p className="text-xs text-[#64748B] mb-6">
                  Are you sure you want to revoke access for <span className="font-bold text-[#0F172A]">{deletingAdmin.name}</span> ({deletingAdmin.email})? This action cannot be undone.
                </p>
              </div>

              <div className="flex justify-center gap-2 border-t border-[#E2E8F0] pt-4">
                <button 
                  type="button"
                  onClick={() => {
                    setIsDeleteConfirmOpen(false);
                    setDeletingAdmin(null);
                  }}
                  className="h-9 px-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
                >
                  No, Keep
                </button>
                <button 
                  type="button"
                  onClick={handleConfirmDelete}
                  className="h-9 px-4 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors shadow-sm"
                >
                  Yes, Revoke
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success / Info Toast */}
        {toast && (
          <div className="fixed bottom-4 right-4 z-[120] bg-[#0F172A] text-white px-4 py-2.5 rounded-xl border border-[#1E293B] shadow-xl text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            {toast.message}
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
