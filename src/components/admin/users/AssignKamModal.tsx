import { useEffect, useMemo, useState } from 'react';
import { Search, Loader2, X, Check, Mail, Phone } from 'lucide-react';
import { apiClient } from '../../../services/apiClient';

/* Users → Action → Assign KAM. Lists the company's active employees (with their position); the one chosen becomes
   the Key Account Manager of every selected user and shows in their profile's KAM Details
   (backend Users/kamAssign.controller.js). */

type Employee = { _id: string; name: string; email: string; phone: string; position: string; team: string; employeeId: string };

export function AssignKamModal({ userIds, onClose, onDone }: {
  userIds: string[];
  onClose: () => void;
  /** after a successful save: the message to show */
  onDone: (message: string) => void;
}) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [chosen, setChosen] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiClient.get('/user/kam/employees')
      .then(({ data }) => { if (!cancelled) setEmployees(data.employees || []); })
      .catch((err) => { if (!cancelled) setLoadError(err?.response?.data?.message || 'Could not load employees.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // close on Escape (not while saving)
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape' && !saving) onClose(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose, saving]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(e => [e.name, e.position, e.email, e.phone, e.employeeId].some(v => String(v || '').toLowerCase().includes(q)));
  }, [employees, search]);

  const save = async () => {
    if (!chosen || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      const { data } = await apiClient.post('/user/kam/assign', { userIds, employeeId: chosen });
      onDone(data?.message || 'KAM assigned.');
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || 'Could not assign the KAM. Please try again.');
      setSaving(false);
    }
  };

  const count = userIds.length;
  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4" onClick={() => !saving && onClose()}>
      <div className="bg-white rounded-xl w-full max-w-[440px] max-h-[85vh] shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-labelledby="assign-kam-title">
        <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
          <div>
            <h3 id="assign-kam-title" className="text-sm font-bold text-[#0F172A]">Assign KAM</h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Key Account Manager for <span className="font-semibold text-[#0F172A]">{count} selected user{count === 1 ? '' : 's'}</span>
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="text-[#94A3B8] hover:text-[#0F172A] disabled:opacity-50">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, position, email, phone"
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]" />
          </div>
        </div>

        <div className="px-3 pb-2 overflow-y-auto flex-1 min-h-[160px]">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-xs text-[#64748B]"><Loader2 className="w-4 h-4 animate-spin" /> Loading employees…</div>
          ) : loadError ? (
            <div className="py-10 text-center text-xs text-[#DC2626]">{loadError}</div>
          ) : !employees.length ? (
            <div className="py-10 text-center text-xs text-[#64748B]">No active employees. Add one in Setup &amp; Manage → Employees.</div>
          ) : !shown.length ? (
            <div className="py-10 text-center text-xs text-[#64748B]">No employee matches “{search.trim()}”.</div>
          ) : (
            <ul className="space-y-1" role="radiogroup" aria-label="Employees">
              {shown.map(e => {
                const on = chosen === e._id;
                return (
                  <li key={e._id}>
                    <button type="button" role="radio" aria-checked={on} onClick={() => setChosen(e._id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border flex items-start gap-3 transition-colors ${on ? 'border-[#00A86B] bg-[#F0FDF4]' : 'border-transparent hover:bg-[#F8FAFC]'}`}>
                      <span className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${on ? 'border-[#00A86B] bg-[#00A86B]' : 'border-[#CBD5E1]'}`}>
                        {on && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] font-semibold text-[#0F172A]">{e.name || '—'}</span>
                          {e.position && <span className="px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] text-[10px] font-bold">{e.position}</span>}
                          {e.team === 'sales' && <span className="px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#B45309] text-[10px] font-bold">Sales</span>}
                        </span>
                        <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[#64748B]">
                          {e.email && <span className="inline-flex items-center gap-1 min-w-0 break-all"><Mail className="w-3 h-3 shrink-0" />{e.email}</span>}
                          {e.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3 shrink-0" />{e.phone}</span>}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="px-5 py-4 border-t border-[#F1F5F9]">
          {saveError && <div className="mb-2 text-[11px] text-[#DC2626]">{saveError}</div>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={saving}
              className="px-4 py-2 text-xs text-[#475569] hover:bg-[#F1F5F9] transition-colors rounded-lg font-semibold bg-[#F8FAFC] border border-[#E2E8F0] disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={!chosen || saving}
              className="bg-[#00A86B] hover:bg-[#009B63] disabled:opacity-50 font-semibold text-white px-4 py-2 text-xs rounded-lg transition-colors inline-flex items-center gap-1.5">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
