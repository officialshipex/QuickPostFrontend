import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { useAdminTab } from '../../context/AdminUserContext';
import { apiClient } from '../../services/apiClient';
import { TableLoader } from '../../components/ui/TableLoader';
import {
  Users, Plus, X, Eye, Edit2, Trash2, CheckCircle2,
  AlertCircle, RefreshCcw, ToggleLeft, ToggleRight, Shield, Lock, Copy, Check,
} from 'lucide-react';

// ─── Permission module definitions ───────────────────────────────────────────

const ADMIN_MODULES = [
  { key: 'orders',        label: 'Orders',         desc: 'View and manage all shipment orders' },
  { key: 'ndr',           label: 'NDR',             desc: 'Non-delivery reports and follow-ups' },
  { key: 'finance',       label: 'Finance',         desc: 'Wallet management and COD remittance' },
  { key: 'reports',       label: 'Reports',         desc: 'View and download reports' },
  { key: 'support',       label: 'Support',         desc: 'Manage support tickets' },
  { key: 'tools',         label: 'Tools',           desc: 'Weight discrepancy and notifications' },
  { key: 'setupAndManage',label: 'Setup & Manage',  desc: 'User management and configuration' },
  { key: 'courier',       label: 'Courier',         desc: 'Courier partners and rate cards' },
];

const USER_MODULES = [
  { key: 'orders',        label: 'Orders',          desc: 'View and manage orders' },
  { key: 'ndr',           label: 'NDR',             desc: 'Non-delivery reports' },
  { key: 'finance',       label: 'Finance',         desc: 'Wallet & COD' },
  { key: 'reports',       label: 'Reports',         desc: 'View reports' },
  { key: 'support',       label: 'Support',         desc: 'Support tickets' },
  { key: 'tools',         label: 'Tools',           desc: 'Weight discrepancy' },
  { key: 'setupAndManage',label: 'Settings',        desc: 'Account settings and pickup address' },
];

type PermKey = 'view' | 'edit' | 'delete';
const PERM_TYPES: { key: PermKey; label: string }[] = [
  { key: 'view',   label: 'View'   },
  { key: 'edit',   label: 'Edit'   },
  { key: 'delete', label: 'Delete' },
];

type AccessRights = Record<string, Record<PermKey, boolean>>;

function emptyAccessRights(isAdminView: boolean): AccessRights {
  const modules = isAdminView ? ADMIN_MODULES : USER_MODULES;
  const rights: AccessRights = {};
  modules.forEach(m => { rights[m.key] = { view: false, edit: false, delete: false }; });
  return rights;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Employee {
  _id: string;
  fullName: string;
  email: string;
  contactNumber: string;
  role: string;
  employeeId: string;
  isEmpActive: boolean;
  isAdmin: boolean;
  adminTab: boolean;
  parentType: 'admin' | 'user';
  accessRights: Record<string, any>;
  createdAt: string;
}

// ─── Permission Matrix ────────────────────────────────────────────────────────

interface PermissionMatrixProps {
  accessRights: AccessRights;
  onChange: (rights: AccessRights) => void;
  isAdminView: boolean;
}

function PermissionMatrix({ accessRights, onChange, isAdminView }: PermissionMatrixProps) {
  const modules = isAdminView ? ADMIN_MODULES : USER_MODULES;

  const toggle = (moduleKey: string, perm: PermKey) => {
    const current = accessRights[moduleKey] || { view: false, edit: false, delete: false };
    const next = { ...current, [perm]: !current[perm] };

    // If disabling view, also disable edit and delete
    if (perm === 'view' && !next.view) {
      next.edit = false;
      next.delete = false;
    }
    // If enabling edit or delete, also enable view
    if ((perm === 'edit' || perm === 'delete') && next[perm]) {
      next.view = true;
    }

    onChange({ ...accessRights, [moduleKey]: next });
  };

  return (
    <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="px-4 py-2.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Module</div>
        {PERM_TYPES.map(p => (
          <div key={p.key} className="w-16 text-center px-2 py-2.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">{p.label}</div>
        ))}
      </div>

      {/* Rows */}
      {modules.map((mod, i) => {
        const rights = accessRights[mod.key] || { view: false, edit: false, delete: false };
        return (
          <div
            key={mod.key}
            className={`grid grid-cols-[1fr_auto_auto_auto] items-center border-b border-[#F1F5F9] last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]/50'}`}
          >
            <div className="px-4 py-3">
              <div className="text-xs font-semibold text-[#0F172A]">{mod.label}</div>
              <div className="text-[10px] text-[#94A3B8] mt-0.5">{mod.desc}</div>
            </div>
            {PERM_TYPES.map(p => {
              const checked = rights[p.key] === true;
              const disabled = (p.key === 'edit' || p.key === 'delete') && !rights.view;
              return (
                <div key={p.key} className="w-16 flex justify-center items-center py-3">
                  <button
                    type="button"
                    onClick={() => !disabled && toggle(mod.key, p.key)}
                    disabled={disabled}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      checked
                        ? 'bg-[#00A86B] border-[#00A86B]'
                        : disabled
                        ? 'bg-[#F1F5F9] border-[#E2E8F0] cursor-not-allowed opacity-40'
                        : 'bg-white border-[#CBD5E1] hover:border-[#00A86B]'
                    }`}
                  >
                    {checked && <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />}
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

interface EmployeeModalProps {
  employee?: Employee | null;
  onClose: () => void;
  onSaved: (emp: Employee) => void;
  isAdminView: boolean;
}

function EmployeeModal({ employee, onClose, onSaved, isAdminView }: EmployeeModalProps) {
  const isEdit = !!employee;

  const [fullName, setFullName]     = useState(employee?.fullName || '');
  const [email, setEmail]           = useState(employee?.email || '');
  const [contactNumber, setContact] = useState(employee?.contactNumber || '');
  const [role, setRole]             = useState(employee?.role || '');
  const [password, setPassword]     = useState('');
  const [accessRights, setAccessRights] = useState<AccessRights>(() => {
    if (employee?.accessRights) {
      // Normalize to our AccessRights shape
      const modules = isAdminView ? ADMIN_MODULES : USER_MODULES;
      const rights: AccessRights = {};
      modules.forEach(m => {
        const existing = employee.accessRights[m.key] || {};
        rights[m.key] = {
          view:   existing.view   === true,
          edit:   existing.edit   === true,
          delete: existing.delete === true,
        };
      });
      return rights;
    }
    return emptyAccessRights(isAdminView);
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !contactNumber || !role) {
      setError('Name, email, phone and role are required.');
      return;
    }
    if (!isEdit && !password) {
      setError('Password is required for new employees.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      if (isEdit) {
        const body: any = { fullName, contactNumber, role, accessRights };
        if (password) body.password = password;
        const res = await apiClient.put(`/staffRole/updateRole/${employee!._id}`, body);
        onSaved(res.data.updatedRole);
      } else {
        const res = await apiClient.post('/staffRole/createRole', {
          fullName, email, contactNumber, password, role, accessRights,
        });
        onSaved(res.data.data.user as any);
        // Refetch to get full employee doc
      }
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save employee.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-full items-start justify-center p-4 pt-12">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10 mb-8">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#00A86B]" />
            <h2 className="text-sm font-bold text-[#0F172A]">
              {isEdit ? 'Edit Employee' : 'Add Employee'}
            </h2>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isAdminView ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
              {isAdminView ? 'Admin Panel' : 'User Panel'}
            </span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-[11px] font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[#475569] mb-1">Full Name *</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe"
                className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B]" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#475569] mb-1">Email *</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="john@company.com"
                disabled={isEdit}
                className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B] disabled:bg-slate-50 disabled:text-slate-400" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#475569] mb-1">Phone *</label>
              <input value={contactNumber} onChange={e => setContact(e.target.value)} placeholder="9876543210"
                className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B]" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#475569] mb-1">Role / Designation *</label>
              <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Support Executive"
                className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B]" />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-[#475569] mb-1">
                Password {isEdit ? <span className="font-normal text-slate-400">(leave blank to keep current)</span> : '*'}
              </label>
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Min. 8 characters"
                className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B]" />
            </div>
          </div>

          {/* Permission Matrix */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-3.5 h-3.5 text-[#64748B]" />
              <span className="text-[11px] font-bold text-[#475569] uppercase tracking-wide">Module Permissions</span>
            </div>
            <PermissionMatrix accessRights={accessRights} onChange={setAccessRights} isAdminView={isAdminView} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 h-9 rounded-full border border-[#E2E8F0] text-[#475569] text-xs font-semibold hover:bg-[#F8FAFC]">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 h-9 rounded-full bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting && (
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function AdminRoles() {
  const { isAdmin, adminTab, isEmployee } = useAdminTab();
  const isAdminView = isAdmin && adminTab;
  const location = useLocation();
  // URL path is the authoritative signal — isAdminView comes from async state and can lag
  const isUserPanel = location.pathname.startsWith('/user/');

  const [employees, setEmployees]         = useState<Employee[]>([]);
  const [loading, setLoading]             = useState(true);
  const [showModal, setShowModal]         = useState(false);
  const [editEmployee, setEditEmployee]   = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<Employee | null>(null);
  const [togglingId, setTogglingId]       = useState<string | null>(null);
  const [deletingId, setDeletingId]       = useState<string | null>(null);
  const [toast, setToast]                 = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm]       = useState('');
  const [copied, setCopied]               = useState(false);

  const employeeLoginUrl = `${window.location.origin}/employee-login`;

  const copyLoginUrl = () => {
    navigator.clipboard.writeText(employeeLoginUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  // Lock body scroll whenever any modal is open
  useEffect(() => {
    const anyOpen = showModal || !!deleteTarget;
    document.body.style.overflow = anyOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showModal, deleteTarget]);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      // Use URL path as source of truth — never stale unlike isAdminView (which is async)
      const url = isUserPanel ? '/staffRole?mode=user' : '/staffRole';
      const res = await apiClient.get(url);
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [isUserPanel]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const handleToggleStatus = async (emp: Employee) => {
    setTogglingId(emp._id);
    try {
      await apiClient.patch(`/staffRole/toggleStatus/${emp._id}`);
      setEmployees(prev => prev.map(e => e._id === emp._id ? { ...e, isEmpActive: !e.isEmpActive } : e));
      showToast('success', `Employee ${emp.isEmpActive ? 'deactivated' : 'activated'} successfully`);
    } catch {
      showToast('error', 'Failed to update status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget._id);
    try {
      await apiClient.delete(`/staffRole/deleteRole/${deleteTarget._id}`);
      setEmployees(prev => prev.filter(e => e._id !== deleteTarget._id));
      showToast('success', 'Employee deleted successfully');
      setDeleteTarget(null);
    } catch {
      showToast('error', 'Failed to delete employee');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = () => {
    showToast('success', editEmployee ? 'Employee updated' : 'Employee created successfully');
    setEditEmployee(null);
    setShowModal(false);
    fetchEmployees();
  };

  const filtered = employees.filter(e => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return e.fullName.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || e.role.toLowerCase().includes(q) || e.employeeId.toLowerCase().includes(q);
  });

  const permissionSummary = (emp: Employee) => {
    const modules = isAdminView ? ADMIN_MODULES : USER_MODULES;
    const count = modules.filter(m => emp.accessRights?.[m.key]?.view === true).length;
    return `${count}/${modules.length} modules`;
  };

  // Employees themselves cannot manage employees
  if (isEmployee) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Lock className="w-12 h-12 text-[#E2E8F0]" />
          <h2 className="text-lg font-bold text-[#0F172A]">Access Restricted</h2>
          <p className="text-sm text-[#64748B]">You don't have permission to manage employees.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[300] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${toast.type === 'success' ? 'bg-[#00A86B]' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.text}
        </div>
      )}

      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">
        <div className="bg-white relative z-50 shrink-0">

          {/* Employee Login URL banner */}
          <div className="px-6 pt-4 pb-3 border-b border-[#E2E8F0] bg-[#F0FDF4]">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-[11px] text-[#475569] font-medium">
                <Shield className="w-3.5 h-3.5 text-[#00A86B]" />
                Employee login URL — share this with your employees:
              </div>
              <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-lg px-3 py-1.5 flex-1 min-w-[200px] max-w-sm">
                <span className="text-[11px] text-[#0F172A] font-mono truncate flex-1">{employeeLoginUrl}</span>
                <button
                  onClick={copyLoginUrl}
                  className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-[#00A86B] hover:text-[#009B63]"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="px-6 py-4 border-b border-[#E2E8F0] flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-[22px] font-bold text-[#0F172A]">Employees</h1>
              <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${isUserPanel ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                {isUserPanel ? 'Your Panel Employees' : 'Admin Panel Employees'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="glass-search-input w-[200px]"
                  style={{ paddingLeft: '2rem' }}
                />
                <Users className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <button
                onClick={fetchEmployees}
                className="w-8 h-8 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC]"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setEditEmployee(null); setShowModal(true); }}
                className="h-9 px-5 rounded-full bg-[#00A86B] text-white text-[11px] font-bold hover:bg-[#009B63] flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Employee
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-white relative">
          {loading && <TableLoader />}
          {!loading && filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 gap-3 text-[#64748B]">
              <Users className="w-10 h-10 text-[#E2E8F0]" />
              <p className="text-sm font-medium">{searchTerm ? 'No employees match your search' : 'No employees yet. Add your first employee.'}</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-full">
              <thead>
                <tr className="bg-[#E6F9F2] text-xs font-medium text-[#64748B] uppercase tracking-wider">
                  <th className="py-2 px-4 rounded-l-lg">#</th>
                  <th className="py-2 px-4"><Users className="w-3.5 h-3.5 inline mr-1" />Employee</th>
                  <th className="py-2 px-4">Role</th>
                  <th className="py-2 px-4"><Shield className="w-3.5 h-3.5 inline mr-1" />Permissions</th>
                  <th className="py-2 px-4">Status</th>
                  <th className="py-2 px-4">Created</th>
                  <th className="py-2 px-4 text-right rounded-r-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[11px] text-[#475569]">
                {filtered.map((emp, i) => (
                  <tr key={emp._id} className={`border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'}`}>
                    <td className="p-4 text-[#94A3B8] font-medium">{i + 1}</td>
                    <td className="p-4">
                      <div className="font-bold text-[#0F172A] text-xs">{emp.fullName}</div>
                      <div className="text-[10px] text-[#94A3B8]">{emp.email}</div>
                      <div className="text-[10px] text-[#64748B] mt-0.5">ID: {emp.employeeId}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-full text-[10px] font-semibold text-[#475569]">
                        {emp.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-3 h-3 text-[#00A86B]" />
                        <span className="text-[10px] font-semibold text-[#00A86B]">{permissionSummary(emp)}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(emp)}
                        disabled={togglingId === emp._id}
                        className="flex items-center gap-1.5 group"
                        title={emp.isEmpActive ? 'Click to deactivate' : 'Click to activate'}
                      >
                        {emp.isEmpActive
                          ? <ToggleRight className="w-5 h-5 text-[#00A86B]" />
                          : <ToggleLeft className="w-5 h-5 text-[#94A3B8]" />}
                        <span className={`text-[10px] font-bold ${emp.isEmpActive ? 'text-[#00A86B]' : 'text-[#94A3B8]'}`}>
                          {togglingId === emp._id ? '…' : emp.isEmpActive ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </td>
                    <td className="p-4 text-[10px] text-[#94A3B8]">{formatDate(emp.createdAt)}</td>
                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditEmployee(emp); setShowModal(true); }}
                          className="w-7 h-7 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#00A86B]"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(emp)}
                          className="w-7 h-7 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <EmployeeModal
          employee={editEmployee}
          onClose={() => { setShowModal(false); setEditEmployee(null); }}
          onSaved={handleSaved}
          isAdminView={isAdminView}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Delete Employee</h3>
                <p className="text-xs text-[#64748B]">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-xs text-[#475569] mb-5">
              Are you sure you want to delete <span className="font-bold">{deleteTarget.fullName}</span>? They will immediately lose access.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 h-9 rounded-full border border-[#E2E8F0] text-[#475569] text-xs font-semibold hover:bg-[#F8FAFC]">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!!deletingId}
                className="flex-1 h-9 rounded-full bg-red-500 text-white text-xs font-bold hover:bg-red-600 disabled:opacity-50"
              >
                {deletingId ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
