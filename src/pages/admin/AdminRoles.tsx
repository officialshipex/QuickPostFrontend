import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { useAdminTab } from '../../context/AdminUserContext';
import { apiClient } from '../../services/apiClient';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { TableLoader } from '../../components/ui/TableLoader';
import {
  PERM_TYPES, modulesFor, emptyAccessRights, toFormRights, toStoredRights, hasPermission,
  type AccessRights, type PanelType, type PermKey,
} from '../../utils/permissions';
import {
  Users, Plus, X, Edit2, Trash2,
  AlertCircle, RefreshCcw, Shield, Lock, Copy, Check,
  Search, User, Mail, Phone, Briefcase, KeyRound, EyeOff, Eye, Activity, CalendarDays, Settings2, Hash,
  UserCheck, UserX, Link2, type LucideIcon,
} from 'lucide-react';

// Permission modules (one per sidebar item) live in utils/permissions.ts, shared with the sidebar
// and the route guard.
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  panel: PanelType;
}

function PermissionMatrix({ accessRights, onChange, panel }: PermissionMatrixProps) {
  const modules = modulesFor(panel);

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
    <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="px-4 py-2.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Module</div>
        {PERM_TYPES.map(p => (
          <div key={p.key} className="w-[72px] text-center px-2 py-2.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">{p.label}</div>
        ))}
      </div>

      {/* Rows */}
      {modules.map((mod, i) => {
        const rights = accessRights[mod.key] || { view: false, edit: false, delete: false };
        const startsSection = i === 0 || modules[i - 1].section !== mod.section;
        return (
          <React.Fragment key={mod.key}>
          {startsSection && (
            <div className="px-4 py-2 bg-[#F0FDF4] text-[11px] font-bold text-[#00A86B] uppercase tracking-wider border-b border-[#E2E8F0]/70">
              {mod.section}
            </div>
          )}
          <div className="grid grid-cols-[1fr_auto_auto_auto] items-center border-b border-[#F1F5F9] last:border-0 bg-white hover:bg-[#FAFCFB] transition-colors">
            <div className="px-4 py-3 min-w-0">
              <div className="text-[13px] font-semibold text-[#0F172A]">{mod.label}</div>
              <div className="text-[11.5px] text-[#94A3B8] mt-0.5">{mod.desc}</div>
            </div>
            {PERM_TYPES.map(p => {
              const checked = rights[p.key] === true;
              const disabled = (p.key === 'edit' || p.key === 'delete') && !rights.view;
              return (
                <div key={p.key} className="w-[72px] flex justify-center items-center py-3">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    aria-label={`${mod.label} — ${p.label}`}
                    onClick={() => !disabled && toggle(mod.key, p.key)}
                    disabled={disabled}
                    className={`w-[22px] h-[22px] rounded-md border-2 flex items-center justify-center transition-all ${
                      checked
                        ? 'bg-[#00A86B] border-[#00A86B] shadow-[0_1px_4px_rgba(0,168,107,0.35)]'
                        : disabled
                        ? 'bg-[#F1F5F9] border-[#E2E8F0] cursor-not-allowed opacity-50'
                        : 'bg-white border-[#CBD5E1] hover:border-[#00A86B]'
                    }`}
                  >
                    {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </button>
                </div>
              );
            })}
          </div>
          </React.Fragment>
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
  panel: PanelType;
}

function EmployeeModal({ employee, onClose, onSaved, panel }: EmployeeModalProps) {
  const isAdminView = panel === 'admin';
  const isEdit = !!employee;

  const [fullName, setFullName]     = useState(employee?.fullName || '');
  const [email, setEmail]           = useState(employee?.email || '');
  const [contactNumber, setContact] = useState(employee?.contactNumber || '');
  const [role, setRole]             = useState(employee?.role || '');
  const [password, setPassword]     = useState('');
  // Stored rights -> catalog shape (an employee saved before the per-item keys keeps what they had)
  const [accessRights, setAccessRights] = useState<AccessRights>(() =>
    employee?.accessRights ? toFormRights(employee.accessRights, panel) : emptyAccessRights(panel)
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !contactNumber.trim() || !role.trim()) {
      setError('Name, email, phone and role are required.');
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (!isEdit && !password) {
      setError('Password is required for new employees.');
      return;
    }
    if (password && password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    setSubmitting(true);
    setError('');
    // Item rights + the coarse group rights the server's write guard reads
    const storedRights = toStoredRights(accessRights, panel);
    try {
      if (isEdit) {
        const body: any = { fullName: fullName.trim(), contactNumber: contactNumber.trim(), role: role.trim(), accessRights: storedRights, mode: panel };
        if (password) body.password = password;
        const res = await apiClient.put(`/staffRole/updateRole/${employee!._id}`, body);
        onSaved(res.data.updatedRole);
      } else {
        // `mode` tells the server which panel's employee this is (an admin works in both panels)
        const res = await apiClient.post('/staffRole/createRole', {
          fullName: fullName.trim(), email: email.trim(), contactNumber: contactNumber.trim(),
          password, role: role.trim(), accessRights: storedRights, mode: panel,
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

  const granted = modulesFor(panel).filter(m => accessRights[m.key]?.view).length;
  const total = modulesFor(panel).length;
  const fieldCls = 'w-full h-10 pl-10 pr-4 bg-white border border-[#E2E8F0] rounded-full text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] placeholder:font-normal focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] transition-colors disabled:bg-[#F8FAFC] disabled:text-[#94A3B8]';
  const iconCls = 'absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none';
  const labelCls = 'block text-[12px] font-semibold text-[#475569] mb-1.5';
  const field = (label: string, icon: LucideIcon, input: React.ReactNode, hint?: string, full?: boolean) => {
    const Icon = icon;
    return (
      <div className={full ? 'sm:col-span-2' : ''}>
        <label className={labelCls}>{label}</label>
        <div className="relative">
          <Icon className={iconCls} />
          {input}
        </div>
        {hint && <p className="text-[11.5px] text-[#94A3B8] mt-1.5 pl-1">{hint}</p>}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto">
      <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-full items-start justify-center p-4 pt-10">
      <div className="relative bg-white rounded-2xl shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] w-full max-w-3xl z-10 mb-8 flex flex-col max-h-[calc(100vh-5rem)]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center shrink-0">
              {isEdit ? <Edit2 className="w-[18px] h-[18px]" /> : <Users className="w-[18px] h-[18px]" />}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-bold text-[#0F172A]">{isEdit ? 'Edit Employee' : 'Add Employee'}</h2>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isAdminView ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-700'}`}>
                  {isAdminView ? 'Admin Panel' : 'User Panel'}
                </span>
              </div>
              <p className="text-[12px] text-[#64748B] truncate">{isEdit ? `Update ${employee?.fullName || 'this employee'}'s details and access.` : 'Invite a team member and choose exactly what they can access.'}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {error && (
              <div className="flex items-start gap-2 px-3.5 py-2.5 bg-red-50 border border-red-100 text-red-600 rounded-xl text-[12.5px] font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
              </div>
            )}

            {/* Basic info */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-[#00A86B]" />
                <h3 className="text-[13px] font-bold text-[#0F172A]">Employee details</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field('Full Name *', User,
                  <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe" className={fieldCls} />)}
                {field('Email *', Mail,
                  <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="john@company.com" disabled={isEdit} className={fieldCls} />,
                  isEdit ? "Email can't be changed." : 'Used to sign in to the employee portal.')}
                {field('Phone *', Phone,
                  <input value={contactNumber} onChange={e => setContact(e.target.value)} placeholder="9876543210" inputMode="tel" className={fieldCls} />)}
                {field('Role / Designation *', Briefcase,
                  <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Support Executive" className={fieldCls} />)}
                {field(isEdit ? 'Password' : 'Password *', KeyRound,
                  <>
                    <input value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters"
                      autoComplete="new-password" className={`${fieldCls} pr-11`} />
                    <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9]">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </>,
                  isEdit ? 'Leave blank to keep the current password.' : `At least ${MIN_PASSWORD_LENGTH} characters.`, true)}
              </div>
            </section>

            {/* Permission Matrix */}
            <section>
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#00A86B]" />
                  <h3 className="text-[13px] font-bold text-[#0F172A]">Module permissions</h3>
                </div>
                <span className="text-[11.5px] font-semibold text-[#00A86B] bg-[#F0FDF4] border border-[#DCFCE7] px-2.5 py-0.5 rounded-full tabular-nums">{granted}/{total} modules</span>
              </div>
              <p className="text-[12px] text-[#64748B] mb-3">
                The employee sees every menu item; items without View access are locked and show a "no access" message when clicked.
              </p>
              <PermissionMatrix accessRights={accessRights} onChange={setAccessRights} panel={panel} />
            </section>
          </div>

          {/* Footer */}
          <div className="shrink-0 px-6 py-3.5 border-t border-[#F1F5F9] flex items-center justify-end gap-3 bg-white rounded-b-2xl">
            <button type="button" onClick={onClose}
              className="h-10 px-5 rounded-full border border-[#E2E8F0] text-[#475569] text-[13px] font-semibold hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="h-10 px-6 rounded-full bg-[#00A86B] text-white text-[13px] font-semibold shadow-sm hover:bg-[#009B63] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
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
  const { isEmployee } = useAdminTab();
  const location = useLocation();
  // URL path is the authoritative signal — the admin/adminTab flags come from async state and can lag
  const isUserPanel = location.pathname.startsWith('/user/');
  const panel: PanelType = isUserPanel ? 'user' : 'admin';

  const [employees, setEmployees]         = useState<Employee[]>([]);
  const [loading, setLoading]             = useState(true);
  const [showModal, setShowModal]         = useState(false);
  const [editEmployee, setEditEmployee]   = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<Employee | null>(null);
  const [togglingId, setTogglingId]       = useState<string | null>(null);
  const [deletingId, setDeletingId]       = useState<string | null>(null);
  const { toast, showToast, closeToast } = useToast();
  const [searchTerm, setSearchTerm]       = useState('');
  const [copied, setCopied]               = useState(false);

  const employeeLoginUrl = `${window.location.origin}/employee-login`;

  const copyLoginUrl = () => {
    navigator.clipboard.writeText(employeeLoginUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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

  const moduleCount = modulesFor(panel).length;
  const permittedCount = (emp: Employee) =>
    modulesFor(panel).filter(m => hasPermission(emp.accessRights, m.key, 'view')).length;
  const activeCount = employees.filter(e => e.isEmpActive).length;
  const stats: { label: string; value: number; icon: LucideIcon; tone: string }[] = [
    { label: 'Total Employees', value: employees.length, icon: Users, tone: 'bg-[#F1F5F9] text-[#475569]' },
    { label: 'Active', value: activeCount, icon: UserCheck, tone: 'bg-emerald-50 text-emerald-600' },
    { label: 'Inactive', value: employees.length - activeCount, icon: UserX, tone: 'bg-red-50 text-red-500' },
    { label: 'Roles', value: new Set(employees.map(e => e.role.trim().toLowerCase()).filter(Boolean)).size, icon: Briefcase, tone: 'bg-sky-50 text-sky-600' },
  ];
  const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  const softCard = 'bg-white rounded-2xl border border-[#EEF2F6] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)]';

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
      <Toast toast={toast} onClose={closeToast} />

      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-[#F8FAFC] overflow-y-auto">
        <div className="px-4 md:px-6 pt-5 pb-6 flex flex-col gap-5">
          {/* Title */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center shrink-0"><Users className="w-5 h-5" /></span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-[18px] font-bold text-[#0F172A]">Employees</h1>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isUserPanel ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-600'}`}>
                    {isUserPanel ? 'Your Panel Employees' : 'Admin Panel Employees'}
                  </span>
                </div>
                <p className="text-[12.5px] text-[#64748B]">Give your team access with role-based permissions.</p>
              </div>
            </div>
            <button
              onClick={() => { setEditEmployee(null); setShowModal(true); }}
              className="h-10 px-5 rounded-full bg-[#00A86B] text-white text-[13px] font-semibold shadow-sm hover:bg-[#009B63] flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Employee
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {stats.map(st => (
              <div key={st.label} className={`${softCard} px-4 py-3.5 flex items-center justify-between gap-3`}>
                <div className="min-w-0">
                  <div className="text-[12px] font-medium text-[#64748B] truncate">{st.label}</div>
                  <div className="text-[22px] font-bold text-[#0F172A] tabular-nums leading-tight mt-0.5">{loading ? '—' : st.value}</div>
                </div>
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${st.tone}`}><st.icon className="w-5 h-5" /></span>
              </div>
            ))}
          </div>

          {/* Employee login link */}
          <div className={`${softCard} px-4 py-3.5 flex flex-col md:flex-row md:items-center gap-3`}>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="w-9 h-9 rounded-xl bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center shrink-0"><Link2 className="w-[18px] h-[18px]" /></span>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-[#0F172A]">Employee login link</div>
                <div className="text-[12px] text-[#64748B]">Share this link with your employees to sign in.</div>
              </div>
            </div>
            <div className="flex items-center gap-2 md:w-[440px] max-w-full">
              <span className="flex-1 min-w-0 h-10 px-4 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center text-[12.5px] text-[#0F172A] font-mono truncate">{employeeLoginUrl}</span>
              <button
                onClick={copyLoginUrl}
                className={`shrink-0 h-10 px-4 rounded-full text-[12.5px] font-semibold inline-flex items-center gap-1.5 transition-colors ${copied ? 'bg-[#F0FDF4] text-[#00A86B] border border-[#BBF7D0]' : 'border border-[#00A86B] text-[#00A86B] hover:bg-[#F0FDF4]'}`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy link'}
              </button>
            </div>
          </div>

          {/* Table card */}
          <div className={`${softCard} overflow-hidden`}>
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[#F1F5F9]">
              <div className="text-[13px] font-semibold text-[#0F172A]">
                All employees <span className="text-[#94A3B8] font-medium tabular-nums">({filtered.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-[240px] max-w-[60vw]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search name, email, role or ID"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full h-9 pl-10 pr-4 rounded-full border border-[#E2E8F0] bg-white text-[12.5px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] transition-colors"
                  />
                </div>
                <button
                  onClick={fetchEmployees}
                  aria-label="Refresh"
                  title="Refresh"
                  className="w-9 h-9 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#00A86B] transition-colors"
                >
                  <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="relative overflow-x-auto min-h-[220px]">
              {loading && <TableLoader />}
              {!loading && filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 gap-2 text-center px-4">
                  <span className="w-12 h-12 rounded-2xl bg-[#F1F5F9] flex items-center justify-center"><Users className="w-6 h-6 text-[#94A3B8]" /></span>
                  <p className="text-[13px] font-semibold text-[#0F172A]">{searchTerm ? 'No employees match your search' : 'No employees yet'}</p>
                  <p className="text-[12px] text-[#94A3B8]">{searchTerm ? 'Try a different name, email or role.' : 'Add your first employee to share the workload.'}</p>
                  {!searchTerm && (
                    <button onClick={() => { setEditEmployee(null); setShowModal(true); }}
                      className="mt-2 h-9 px-4 rounded-full border border-[#00A86B] text-[#00A86B] text-[12.5px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#F0FDF4]">
                      <Plus className="w-4 h-4" /> Add Employee
                    </button>
                  )}
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-[#E6F9F2] text-xs font-medium text-[#64748B] uppercase tracking-wider">
                      {([
                        ['No.', Hash], ['Employee', User], ['Role', Briefcase], ['Permissions', Shield], ['Status', Activity], ['Created', CalendarDays],
                      ] as [string, LucideIcon][]).map(([label, Icon]) => (
                        <th key={label} className="py-2.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5"><Icon className="w-3.5 h-3.5 shrink-0" /><span>{label}</span></div>
                        </th>
                      ))}
                      <th className="py-2.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5"><Settings2 className="w-3.5 h-3.5 shrink-0" /><span>Actions</span></div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-[12.5px] text-[#475569]">
                    {filtered.map((emp, i) => {
                      const granted = permittedCount(emp);
                      const pct = moduleCount ? Math.round((granted / moduleCount) * 100) : 0;
                      return (
                        <tr key={emp._id} className="border-b border-[#F1F5F9] last:border-b-0 hover:bg-[#F8FFFB] transition-colors">
                          <td className="py-3 px-4 text-[#94A3B8] font-medium tabular-nums">{i + 1}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <span className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${emp.isEmpActive ? 'bg-gradient-to-br from-[#00A86B] to-[#00875A] text-white' : 'bg-[#E2E8F0] text-[#64748B]'}`}>
                                {initials(emp.fullName)}
                              </span>
                              <div className="min-w-0">
                                <div className="font-semibold text-[13px] text-[#0F172A] truncate">{emp.fullName}</div>
                                <div className="text-[11.5px] text-[#94A3B8] truncate">{emp.email}</div>
                                <span className="inline-block mt-1 px-1.5 py-px rounded-md bg-[#F1F5F9] text-[#64748B] text-[10.5px] font-mono">ID {emp.employeeId}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 h-7 bg-[#F8FAFC] border border-[#EEF2F6] rounded-full text-[12px] font-medium text-[#334155]">
                              <Briefcase className="w-3 h-3 text-[#94A3B8]" />{emp.role}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="w-[140px]">
                              <div className="flex items-center justify-between text-[11.5px]">
                                <span className="font-semibold text-[#0F172A] tabular-nums">{granted}/{moduleCount}</span>
                                <span className="text-[#94A3B8]">modules</span>
                              </div>
                              <div className="mt-1 h-1.5 rounded-full bg-[#F1F5F9] overflow-hidden">
                                <div className="h-full rounded-full bg-[#00A86B]" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleToggleStatus(emp)}
                              disabled={togglingId === emp._id}
                              role="switch"
                              aria-checked={emp.isEmpActive}
                              className="inline-flex items-center gap-2 disabled:opacity-60"
                              title={emp.isEmpActive ? 'Click to deactivate' : 'Click to activate'}
                            >
                              <span className={`relative w-9 h-5 rounded-full transition-colors ${emp.isEmpActive ? 'bg-[#00A86B]' : 'bg-[#CBD5E1]'}`}>
                                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${emp.isEmpActive ? 'left-[18px]' : 'left-0.5'}`} />
                              </span>
                              <span className={`text-[12px] font-semibold ${emp.isEmpActive ? 'text-[#00A86B]' : 'text-[#94A3B8]'}`}>
                                {togglingId === emp._id ? 'Updating…' : emp.isEmpActive ? 'Active' : 'Inactive'}
                              </span>
                            </button>
                          </td>
                          <td className="py-3 px-4 text-[#64748B] whitespace-nowrap">{formatDate(emp.createdAt)}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => { setEditEmployee(emp); setShowModal(true); }}
                                className="h-8 px-3 rounded-full border border-[#E2E8F0] inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#475569] hover:bg-[#F0FDF4] hover:text-[#00A86B] hover:border-[#00A86B]/40 transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => setDeleteTarget(emp)}
                                aria-label={`Delete ${emp.fullName}`}
                                className="w-8 h-8 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#94A3B8] hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <EmployeeModal
          employee={editEmployee}
          onClose={() => { setShowModal(false); setEditEmployee(null); }}
          onSaved={handleSaved}
          panel={panel}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
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
                className="flex-1 h-10 rounded-full border border-[#E2E8F0] text-[#475569] text-[13px] font-semibold hover:bg-[#F8FAFC]">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!!deletingId}
                className="flex-1 h-10 rounded-full bg-red-500 text-white text-[13px] font-semibold hover:bg-red-600 disabled:opacity-50"
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
