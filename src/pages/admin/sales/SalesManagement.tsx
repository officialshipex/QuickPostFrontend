import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, ArrowLeft, Users, ShieldCheck, Award, BadgePercent, Receipt, Settings2, type LucideIcon } from 'lucide-react';
import { AdminLayout } from '../../../components/admin/layout/AdminLayout';
import { Toast } from '../../../components/ui/Toast';
import { useToast } from '../../../hooks/useToast';
import { salesApiClient, type TeamMember } from '../../../services/salesApi';
import { SalesDashboard } from './SalesDashboard';
import { SalesPersonPanel } from './SalesPersonPanel';
import { TeamTab, KycTab, PlansTab, OffersTab, PayoutsTab, SettingsTab, type SalesCandidate } from './SalesManagementTabs';

/* System → Sales Management (owner only). The whole sales programme in one place: the team, KYC review,
   commission plans and badges, commitment rates, payouts with UTR, and letter / rate settings. Picking a sales
   person (search or the team table) opens their panel and their own Sales Dashboard, read-only. */

type Section = 'team' | 'kyc' | 'plans' | 'rates' | 'payouts' | 'settings';
const SECTIONS: { key: Section; label: string; icon: LucideIcon }[] = [
  { key: 'team', label: 'Team', icon: Users },
  { key: 'kyc', label: 'KYC review', icon: ShieldCheck },
  { key: 'plans', label: 'Commission plans', icon: Award },
  { key: 'rates', label: 'Rates', icon: BadgePercent },
  { key: 'payouts', label: 'Payouts', icon: Receipt },
  { key: 'settings', label: 'Settings', icon: Settings2 },
];

export function SalesManagement() {
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('emp') || '';
  const section = (SECTIONS.find(s => s.key === params.get('tab'))?.key || 'team') as Section;
  const payoutFor = params.get('pay') || '';
  const { toast, showToast, closeToast } = useToast();
  const notify = useCallback((ok: boolean, msg: string) => showToast(ok ? 'success' : 'error', msg), [showToast]);

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [candidates, setCandidates] = useState<SalesCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoAdjust, setAutoAdjust] = useState<boolean | undefined>(undefined);
  const [refresh, setRefresh] = useState(0);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const loadTeam = useCallback(() => {
    salesApiClient.get('/admin/team')
      .then(r => { setMembers(r.data?.members || []); setCandidates(r.data?.candidates || []); })
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { loadTeam(); }, [loadTeam]);
  useEffect(() => { salesApiClient.get('/admin/settings').then(r => setAutoAdjust(r.data?.rateAutoAdjust !== false)).catch(() => {}); }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const selected = members.find(p => p._id === selectedId);
  const ql = query.trim().toLowerCase();
  const matches = useMemo(() => members.filter(p => !ql || [p.name, p.email, p.employeeId, p.referralId].some(v => (v || '').toLowerCase().includes(ql))).slice(0, 8), [members, ql]);
  const pendingKyc = members.filter(m => m.kycStatus === 'pending').length;

  const pick = (id: string) => { setParams({ emp: id }); setQuery(''); setOpen(false); };
  const clear = () => { setParams({}); setQuery(''); };
  const goSection = (s: Section, extra: Record<string, string> = {}) => setParams({ tab: s, ...extra });
  const changed = () => { loadTeam(); setRefresh(r => r + 1); };

  return (
    <AdminLayout>
      <Toast toast={toast} onClose={closeToast} />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-2">
            {selectedId && <button onClick={clear} aria-label="Back to Sales Management" className="w-9 h-9 rounded-full border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:text-[#00A86B] shrink-0"><ArrowLeft className="w-4 h-4" /></button>}
            <div className="min-w-0">
              <h1 className="text-[18px] font-bold text-[#0F172A]">Sales Management</h1>
              <p className="text-[12.5px] text-[#64748B] truncate">{selected ? `Managing ${selected.name}` : 'Sales team, KYC, commissions, rates and payouts.'}</p>
            </div>
          </div>

          <div ref={boxRef} className="relative w-full sm:w-[300px] sm:shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
            <input type="text" placeholder="Search sales person..." value={selected && !open ? selected.name : query}
              onFocus={() => setOpen(true)} onChange={e => { setQuery(e.target.value); setOpen(true); }}
              className="w-full h-10 pl-10 pr-8 rounded-full border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10 transition-all" />
            {selected && <button onClick={clear} aria-label="Clear" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-red-500"><X className="w-3.5 h-3.5" /></button>}
            {open && (
              <div className="absolute left-0 top-full mt-1.5 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl z-50 w-full max-h-72 overflow-y-auto py-1.5">
                {matches.length === 0 ? (
                  <div className="px-3.5 py-3 text-[12px] text-[#94A3B8]">{members.length ? 'No sales person matches' : 'No sales team members yet'}</div>
                ) : matches.map(p => (
                  <button key={p._id} type="button" onClick={() => pick(p._id)}
                    className={`w-full text-left px-3.5 py-2.5 hover:bg-[#F0FDF4] flex items-start gap-2 transition-colors ${p._id === selectedId ? 'bg-[#F0FDF4]' : ''}`}>
                    <div className="w-6 h-6 rounded-full bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">{(p.name || '?').charAt(0).toUpperCase()}</div>
                    <div className="flex-1 min-w-0"><div className="text-xs font-bold text-[#0F172A] truncate">{p.name}</div><div className="text-[10px] text-[#94A3B8] truncate">{p.email}</div></div>
                    {p.referralId && <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0 font-mono">{p.referralId}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedId ? (
          <>
            <SalesPersonPanel key={`p-${selectedId}`} employeeId={selectedId} notify={notify} onChanged={changed}
              onPayout={() => goSection('payouts', { pay: selectedId })} />
            <SalesDashboard key={`d-${selectedId}-${refresh}`} viewAs={{ id: selectedId, name: selected?.name || 'Sales person' }} />
          </>
        ) : (
          <>
            <div className="flex items-center gap-1 overflow-x-auto border-b border-[#E2E8F0]">
              {SECTIONS.map(s => (
                <button key={s.key} onClick={() => goSection(s.key)}
                  className={`relative h-10 px-3.5 inline-flex items-center gap-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors ${section === s.key ? 'text-[#00A86B]' : 'text-[#64748B] hover:text-[#0F172A]'}`}>
                  <s.icon className="w-4 h-4" />{s.label}
                  {s.key === 'kyc' && pendingKyc > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">{pendingKyc}</span>}
                  {section === s.key && <span className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-[#00A86B]" />}
                </button>
              ))}
            </div>
            {section === 'team' && <TeamTab members={members} loading={loading} onOpen={m => pick(m._id)} candidates={candidates} notify={notify} onMoved={loadTeam} />}
            {section === 'kyc' && <KycTab notify={(ok, msg) => { notify(ok, msg); loadTeam(); }} />}
            {section === 'plans' && <PlansTab people={members} notify={(ok, msg) => { notify(ok, msg); loadTeam(); }} />}
            {section === 'rates' && <OffersTab people={members} notify={notify} autoAdjust={autoAdjust} />}
            {section === 'payouts' && <PayoutsTab key={payoutFor} people={members} initialPerson={payoutFor} notify={(ok, msg) => { notify(ok, msg); if (ok) loadTeam(); }} />}
            {section === 'settings' && <SettingsTab notify={notify} onAutoAdjust={setAutoAdjust} />}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
