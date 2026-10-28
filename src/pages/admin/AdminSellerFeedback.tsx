import { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Users, ArrowRightLeft, MessageSquare, Clock } from 'lucide-react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';

/* Admin → Seller Feedback. Every seller account that has opened QuickPost (recorded by the feedback prompt's
   status check, backend feedback/), whether it existed on ShipexIndia before, and the answers to the prompt. */

type Row = {
  _id: string;
  user: { userId?: number; name?: string; email?: string; phone?: string; brandName?: string; createdAt?: string };
  existingShipexAccount: boolean;
  firstSeenAt: string;
  lastSeenAt?: string;
  laterCount: number;
  submittedAt: string | null;
  sentiment: string | null;
  switchedFrom: string | null;
  note: string;
};

type Summary = {
  quickpostUsers: number;
  existingShipexAccounts: number;
  newAccounts: number;
  submitted: number;
  pending: number;
  sentiment: Record<string, number>;
  switchedFrom: Record<string, number>;
};

const SWITCHED_LABEL: Record<string, string> = {
  shipexindia: 'ShipexIndia',
  other_platform: 'Another platform',
  new: 'New to shipping',
};

const SENTIMENT_STYLE: Record<string, string> = {
  'Going well': 'bg-[#F0FDF4] text-[#0F6B38]',
  'Could be better': 'bg-[#FFFBEB] text-[#B45309]',
  'Facing issues': 'bg-[#FEF2F2] text-[#B91C1C]',
};

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const LIMIT = 20;

export function AdminSellerFeedback() {
  const [status, setStatus] = useState<'all' | 'submitted' | 'pending'>('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // search as you type, without a request per keystroke
  useEffect(() => {
    const id = window.setTimeout(() => { setQuery(search.trim()); setPage(1); }, 350);
    return () => window.clearTimeout(id);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    apiClient.get('/feedback/admin', { params: { status, search: query, page, limit: LIMIT } })
      .then(({ data }) => {
        if (cancelled) return;
        setRows(data.rows || []);
        setTotal(data.total || 0);
        setSummary(data.summary || null);
      })
      .catch((err) => { if (!cancelled) setError(err?.response?.data?.message || 'Could not load feedback'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [status, query, page]);

  const pages = Math.max(1, Math.ceil(total / LIMIT));
  const cards = [
    { label: 'Sellers on QuickPost', value: summary?.quickpostUsers, hint: `${summary?.existingShipexAccounts ?? 0} existing ShipexIndia accounts · ${summary?.newAccounts ?? 0} new`, icon: Users },
    { label: 'Say they moved from ShipexIndia', value: summary?.switchedFrom?.shipexindia, hint: `${summary?.switchedFrom?.other_platform ?? 0} from another platform · ${summary?.switchedFrom?.new ?? 0} new to shipping`, icon: ArrowRightLeft },
    { label: 'Feedback received', value: summary?.submitted, hint: `${summary?.sentiment?.['Going well'] ?? 0} going well · ${summary?.sentiment?.['Could be better'] ?? 0} could be better · ${summary?.sentiment?.['Facing issues'] ?? 0} facing issues`, icon: MessageSquare },
    { label: 'Not answered yet', value: summary?.pending, hint: 'Asked again 30 min after each "Maybe later"', icon: Clock },
  ];

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#0F172A]">Seller Feedback</h2>
        <p className="text-xs text-[#64748B] mt-1">Sellers who have opened QuickPost, where they moved from, and how their experience has been.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#64748B]">{c.label}</span>
              <span className="w-8 h-8 rounded-lg bg-[#E6F9F2] flex items-center justify-center"><c.icon className="w-4 h-4 text-[#00A86B]" /></span>
            </div>
            <div className="mt-2 text-[24px] font-bold text-[#0F172A]">{summary ? c.value ?? 0 : '—'}</div>
            <div className="mt-1 text-[11px] text-[#94A3B8] leading-snug">{summary ? c.hint : ''}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <div className="inline-flex rounded-lg border border-[#E2E8F0] bg-white p-0.5 w-fit">
          {(['all', 'submitted', 'pending'] as const).map(s => (
            <button key={s} type="button" onClick={() => { setStatus(s); setPage(1); }}
              className={`h-8 px-3 rounded-md text-[12px] font-semibold transition-colors ${status === s ? 'bg-[#00A86B] text-white' : 'text-[#475569] hover:bg-[#F8FAFC]'}`}>
              {s === 'all' ? 'All' : s === 'submitted' ? 'Answered' : 'Not answered'}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search seller, email, phone, user ID or comment"
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[980px]">
            <thead>
              <tr className="bg-[#E6F9F2] border-b border-[#E2E8F0] text-[10px] uppercase tracking-wider font-bold text-[#64748B]">
                <th className="p-4">Seller</th>
                <th className="p-4">Account</th>
                <th className="p-4">First opened QuickPost</th>
                <th className="p-4">Shipped from before</th>
                <th className="p-4">Experience</th>
                <th className="p-4">Comment</th>
                <th className="p-4">Answered</th>
              </tr>
            </thead>
            <tbody className="text-xs font-medium text-[#475569]">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-[#94A3B8]">Loading…</td></tr>
              ) : error ? (
                <tr><td colSpan={7} className="p-8 text-center text-[#DC2626]">{error}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-[#94A3B8]">No sellers here yet.</td></tr>
              ) : rows.map(r => (
                <tr key={r._id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors align-top">
                  <td className="p-4">
                    <div className="text-[#0F172A] font-bold">{r.user.brandName || r.user.name || '—'}</div>
                    <div className="text-[11px] text-[#94A3B8]">{[r.user.userId, r.user.email].filter(Boolean).join(' · ')}</div>
                    {r.user.phone && <div className="text-[11px] text-[#94A3B8]">{r.user.phone}</div>}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${r.existingShipexAccount ? 'bg-[#EFF6FF] text-[#1D4ED8]' : 'bg-[#F1F5F9] text-[#475569]'}`}>
                      {r.existingShipexAccount ? 'Existing ShipexIndia' : 'New'}
                    </span>
                    <div className="mt-1 text-[10px] text-[#94A3B8]">Joined {fmt(r.user.createdAt)}</div>
                  </td>
                  <td className="p-4 text-[11px]">{fmt(r.firstSeenAt)}</td>
                  <td className="p-4">{r.switchedFrom ? SWITCHED_LABEL[r.switchedFrom] || r.switchedFrom : <span className="text-[#94A3B8]">—</span>}</td>
                  <td className="p-4">
                    {r.sentiment
                      ? <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${SENTIMENT_STYLE[r.sentiment] || 'bg-[#F1F5F9] text-[#475569]'}`}>{r.sentiment}</span>
                      : <span className="text-[#94A3B8]">—</span>}
                  </td>
                  <td className="p-4 max-w-[280px] whitespace-pre-wrap break-words">{r.note || <span className="text-[#94A3B8]">—</span>}</td>
                  <td className="p-4 text-[11px]">
                    {r.submittedAt ? fmt(r.submittedAt) : <span className="text-[#94A3B8]">Not yet{r.laterCount ? ` · "Maybe later" ×${r.laterCount}` : ''}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center p-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
          <span className="text-xs text-[#64748B]">{total} seller{total === 1 ? '' : 's'}</span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)} aria-label="Previous page"
              className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-white disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-xs font-semibold text-[#475569]">{page} / {pages}</span>
            <button type="button" disabled={page >= pages} onClick={() => setPage(p => p + 1)} aria-label="Next page"
              className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-white disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
