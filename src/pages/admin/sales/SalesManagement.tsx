import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, Users } from 'lucide-react';
import { AdminLayout } from '../../../components/admin/layout/AdminLayout';
import { apiClient } from '../../../services/apiClient';
import { SalesDashboard } from './SalesDashboard';

/* System → Sales Management (owner only). Starts as just a search bar; picking a sales executive
   opens that person's Sales Dashboard, scoped to them via ?employeeId on the Sales API. */

interface SalesPerson { _id: string; fullName: string; email: string; employeeId: string; team?: string; accessRights?: Record<string, { view?: boolean }>; isAdmin?: boolean }

export function SalesManagement() {
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('emp') || '';
  const [people, setPeople] = useState<SalesPerson[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    apiClient.get('/staffRole').then(res => {
      if (!alive) return;
      const list: SalesPerson[] = Array.isArray(res.data) ? res.data : [];
      setPeople(list.filter(e => e.team === 'sales' || (!e.team && e.accessRights?.sales?.view === true)));
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const selected = people.find(p => p._id === selectedId);
  const ql = query.trim().toLowerCase();
  const matches = useMemo(() => people.filter(p => !ql || [p.fullName, p.email, p.employeeId].some(v => (v || '').toLowerCase().includes(ql))).slice(0, 8), [people, ql]);

  const pick = (p: SalesPerson) => { setParams({ emp: p._id }); setQuery(''); setOpen(false); };
  const clear = () => { setParams({}); setQuery(''); };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[18px] font-bold text-[#0F172A]">Sales Management</h1>
            <p className="text-[12.5px] text-[#64748B] truncate">
              {selected ? `Viewing ${selected.fullName}'s Sales Dashboard` : 'Search a sales person to open their dashboard.'}
            </p>
          </div>

          <div ref={boxRef} className="relative w-full sm:w-[300px] sm:shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
            <input
              type="text"
              placeholder="Search sales person..."
              value={selected && !open ? selected.fullName : query}
              onFocus={() => setOpen(true)}
              onChange={e => { setQuery(e.target.value); setOpen(true); }}
              className="w-full h-10 pl-10 pr-8 rounded-full border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10 transition-all"
            />
            {selected && (
              <button onClick={clear} aria-label="Clear" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {open && (
              <div className="absolute left-0 top-full mt-1.5 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl z-50 w-full max-h-72 overflow-y-auto py-1.5">
                {matches.length === 0 ? (
                  <div className="px-3.5 py-3 text-[12px] text-[#94A3B8]">{people.length ? 'No sales person matches' : 'No sales team members yet'}</div>
                ) : matches.map(p => (
                  <button key={p._id} type="button" onClick={() => pick(p)}
                    className={`w-full text-left px-3.5 py-2.5 hover:bg-[#F0FDF4] flex items-start gap-2 transition-colors ${p._id === selectedId ? 'bg-[#F0FDF4]' : ''}`}>
                    <div className="w-6 h-6 rounded-full bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {(p.fullName || p.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#0F172A] truncate">{p.fullName || '—'}</div>
                      <div className="text-[10px] text-[#94A3B8] truncate">{p.email}</div>
                    </div>
                    {p.employeeId && <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">{p.employeeId}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedId ? (
          <SalesDashboard key={selectedId} viewAs={{ id: selectedId, name: selected?.fullName || 'Sales person' }} />
        ) : (
          <div className="bg-white rounded-2xl border border-[#EEF2F6] py-16 px-6 flex flex-col items-center text-center">
            <span className="w-12 h-12 rounded-2xl bg-[#F0FDF4] flex items-center justify-center"><Users className="w-6 h-6 text-[#00A86B]" /></span>
            <p className="mt-3 text-[14px] font-semibold text-[#0F172A]">Select a sales person</p>
            <p className="mt-1 text-[12.5px] text-[#94A3B8] max-w-sm">Use the search above to open a sales executive's dashboard — their leads, sellers, funnel and performance.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
