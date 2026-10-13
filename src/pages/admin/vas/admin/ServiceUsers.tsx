import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { apiMessage, fmtDate, fmtMoney } from '../vasApi';
import { getPublicTrackingUrl } from '../../brandedTracking/trackingService';
import { adminVasApi, type AdminService, type SubscriptionRow } from './adminVasApi';
import { FollowBadge, StatusBadge, inputCls } from './adminShared';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Deactivated' },
  { id: 'expired', label: 'Expired' },
  { id: 'followup', label: 'Needs follow-up' },
] as const;

const LIMIT = 20;

interface Props {
  service: AdminService;
  refreshKey: number;
  onOpen: (userId: string) => void;
  notify: (type: 'success' | 'error' | 'info', text: string) => void;
}

/** Every seller who has ever activated / published the service — including those who later stopped. */
export function ServiceUsers({ service, refreshKey, onOpen, notify }: Props) {
  const [status, setStatus] = useState<(typeof FILTERS)[number]['id']>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => { setPage(1); }, [status, service.key]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminVasApi.users(service.key, { status, search, page, limit: LIMIT });
      setRows(res.rows);
      setTotal(res.total);
    } catch (err) {
      notify('error', apiMessage(err));
    } finally {
      setLoading(false);
    }
  }, [service.key, status, search, page, notify]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const pages = Math.max(1, Math.ceil(total / LIMIT));
  const isBranded = service.activation === 'publish';

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
      <div className="p-4 flex flex-col md:flex-row md:items-center gap-3 border-b border-[#E2E8F0]">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id} type="button" onClick={() => setStatus(f.id)}
              className={`h-8 px-3 rounded-full text-[12px] font-bold border transition-colors ${status === f.id ? 'bg-[#00A86B] border-[#00A86B] text-white' : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'}`}
            >
              {f.label}
              {f.id === 'followup' && service.stats.followUpOpen > 0 && <span className={`ml-1.5 ${status === f.id ? 'text-white' : 'text-red-500'}`}>{service.stats.followUpOpen}</span>}
            </button>
          ))}
        </div>
        <div className="relative md:ml-auto md:w-72">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search name, email, phone, company" className={`${inputCls} w-full pl-9`} aria-label="Search sellers" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-[#E6F9F2] border-b border-[#E2E8F0] text-[11px] uppercase tracking-wider font-bold text-[#64748B]">
              <th className="p-3 pl-4">Seller</th>
              <th className="p-3">Status</th>
              {isBranded && <th className="p-3">Page</th>}
              <th className="p-3">Plan until</th>
              <th className="p-3 text-right">Paid</th>
              <th className="p-3">First activated</th>
              <th className="p-3">Last stopped</th>
              <th className="p-3">Follow-up</th>
            </tr>
          </thead>
          <tbody className="text-[12.5px] text-[#475569]">
            {loading ? (
              <tr><td colSpan={isBranded ? 8 : 7} className="p-10 text-center text-[#94A3B8]">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={isBranded ? 8 : 7} className="p-10 text-center text-[#94A3B8]">
                {search || status !== 'all' ? 'No sellers match this filter.' : `No seller has ${isBranded ? 'published' : 'activated'} this service yet.`}
              </td></tr>
            ) : rows.map((r) => (
              <tr key={r._id} onClick={() => onOpen(r.userId)} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] cursor-pointer">
                <td className="p-3 pl-4 min-w-[200px]">
                  <p className="font-semibold text-[#0F172A] text-[13px] truncate max-w-[240px]">{r.user?.fullname || 'Deleted user'}</p>
                  <p className="text-[11.5px] text-[#94A3B8] truncate max-w-[240px]">{r.user?.email}</p>
                </td>
                <td className="p-3"><StatusBadge status={r.status} blocked={!r.enabledForUser} /></td>
                {isBranded && (
                  <td className="p-3">
                    {r.page?.slug ? (
                      <div>
                        {r.page.live ? (
                          <a href={getPublicTrackingUrl(r.page.slug)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="font-semibold text-[#00A86B] hover:underline inline-flex items-center gap-1">
                            /track/{r.page.slug} <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : <span className="text-[#94A3B8]">/track/{r.page.slug}</span>}
                        <p className="text-[11px] text-[#94A3B8]">{r.page.views.toLocaleString('en-IN')} visits</p>
                      </div>
                    ) : '—'}
                  </td>
                )}
                <td className="p-3 whitespace-nowrap">{r.entitledUntil ? fmtDate(r.entitledUntil) : 'No end date'}</td>
                <td className="p-3 text-right whitespace-nowrap">{r.totalPaid ? fmtMoney(r.totalPaid) : '—'}</td>
                <td className="p-3 whitespace-nowrap">{fmtDate(r.firstActivatedAt)}</td>
                <td className="p-3 whitespace-nowrap">{r.status === 'active' ? '—' : fmtDate(r.lastDeactivatedAt)}</td>
                <td className="p-3"><FollowBadge status={r.followUp?.status || 'none'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 text-[12px] text-[#64748B]">
        <span>{total.toLocaleString('en-IN')} seller{total === 1 ? '' : 's'}</span>
        <div className="flex items-center gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-8 px-3 rounded-lg border border-[#E2E8F0] font-semibold disabled:opacity-40">Previous</button>
          <span>Page {page} of {pages}</span>
          <button type="button" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="h-8 px-3 rounded-lg border border-[#E2E8F0] font-semibold disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}
