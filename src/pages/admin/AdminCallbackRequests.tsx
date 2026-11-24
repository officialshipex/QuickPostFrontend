import { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, PhoneCall, Inbox, CheckCircle2, Archive, Loader2, Copy, Check } from 'lucide-react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';
import { copyToClipboard } from '../../utils/clipboard';
import { useAdminTab } from '../../context/AdminUserContext';
import { hasPermission } from '../../utils/permissions';

/* Admin → Callback Requests. What visitors sent from the public Contact Us page ("Request a callback",
   backend contactRequest/). The team calls them back and marks each one Contacted or Closed, with a note. */

type Status = 'new' | 'contacted' | 'closed';
type Row = {
  _id: string;
  name: string;
  phone: string;
  note: string;
  status: Status;
  adminNote: string;
  handledBy?: { name?: string };
  handledAt?: string;
  createdAt: string;
};
type Summary = { all: number; new: number; contacted: number; closed: number };

const STATUS_LABEL: Record<Status, string> = { new: 'New', contacted: 'Contacted', closed: 'Closed' };
const STATUS_STYLE: Record<Status, string> = {
  new: 'bg-[#FFFBEB] text-[#B45309]',
  contacted: 'bg-[#EFF6FF] text-[#1D4ED8]',
  closed: 'bg-[#F0FDF4] text-[#0F6B38]',
};

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const LIMIT = 20;

function RowItem({ row, onSaved, canEdit }: { row: Row; onSaved: (r: Row) => void; canEdit: boolean }) {
  const [note, setNote] = useState(row.adminNote || '');
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => setNote(row.adminNote || ''), [row.adminNote]);

  const save = async (patch: { status?: Status; adminNote?: string }, key: string) => {
    setSaving(key);
    setError('');
    try {
      const { data } = await apiClient.patch(`/contact-requests/admin/${row._id}`, patch);
      onSaved(data.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not save');
    } finally {
      setSaving(null);
    }
  };

  const copy = async () => {
    if (await copyToClipboard(row.phone)) { setCopied(true); window.setTimeout(() => setCopied(false), 1500); }
  };

  const noteChanged = note.trim() !== (row.adminNote || '');

  return (
    <tr className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors align-top">
      <td className="p-4">
        <div className="text-[#0F172A] font-bold">{row.name}</div>
        <div className="mt-1 flex items-center gap-2">
          <a href={`tel:+91${row.phone}`} className="text-[12px] font-semibold text-[#00A86B] hover:underline">+91 {row.phone}</a>
          <button type="button" onClick={copy} aria-label="Copy number" className="text-[#94A3B8] hover:text-[#00A86B]">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </td>
      <td className="p-4 max-w-[280px] whitespace-pre-wrap break-words">{row.note || <span className="text-[#94A3B8]">—</span>}</td>
      <td className="p-4 text-[11px] whitespace-nowrap">{fmt(row.createdAt)}</td>
      <td className="p-4">
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${STATUS_STYLE[row.status]}`}>{STATUS_LABEL[row.status]}</span>
        {row.handledAt && (
          <div className="mt-1.5 text-[10px] text-[#94A3B8] leading-snug">
            {row.handledBy?.name ? `${row.handledBy.name} · ` : ''}{fmt(row.handledAt)}
          </div>
        )}
      </td>
      <td className="p-4 min-w-[240px]">
        {!canEdit ? (
          <div className="text-[12px] whitespace-pre-wrap break-words">{row.adminNote || <span className="text-[#94A3B8]">—</span>}</div>
        ) : (<>
        <textarea value={note} onChange={e => setNote(e.target.value.slice(0, 1000))} rows={2} placeholder="Add a note (what was discussed)"
          className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[12px] resize-none focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]" />
        {noteChanged && (
          <button type="button" disabled={!!saving} onClick={() => save({ adminNote: note.trim() }, 'note')}
            className="mt-1.5 h-7 px-3 rounded-md bg-[#0F172A] text-white text-[11px] font-semibold disabled:opacity-60 inline-flex items-center gap-1.5">
            {saving === 'note' && <Loader2 className="w-3 h-3 animate-spin" />}Save note
          </button>
        )}
        {error && <div className="mt-1 text-[11px] text-[#DC2626]">{error}</div>}
        </>)}
      </td>
      <td className="p-4">
        {!canEdit ? <span className="text-[11px] text-[#94A3B8]">View only</span> : (
        <div className="flex flex-col gap-1.5 w-[120px]">
          {(['new', 'contacted', 'closed'] as Status[]).filter(s => s !== row.status).map(s => (
            <button key={s} type="button" disabled={!!saving}
              onClick={() => save({ status: s, ...(noteChanged ? { adminNote: note.trim() } : {}) }, s)}
              className="h-8 px-3 rounded-lg border border-[#E2E8F0] bg-white text-[11px] font-semibold text-[#334155] hover:border-[#00A86B] hover:text-[#00A86B] disabled:opacity-60 inline-flex items-center justify-center gap-1.5 transition-colors">
              {saving === s && <Loader2 className="w-3 h-3 animate-spin" />}
              {s === 'new' ? 'Mark new' : s === 'contacted' ? 'Mark contacted' : 'Close'}
            </button>
          ))}
        </div>
        )}
      </td>
    </tr>
  );
}

export function AdminCallbackRequests() {
  // an employee with only View sees the list; marking / notes need Edit (the server checks the same)
  const { isEmployee, employeeAccessRights } = useAdminTab();
  const canEdit = !isEmployee || hasPermission(employeeAccessRights, 'callbackRequests', 'edit');
  const [status, setStatus] = useState<'all' | Status>('new');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  // search as you type, without a request per keystroke
  useEffect(() => {
    const id = window.setTimeout(() => { setQuery(search.trim()); setPage(1); }, 350);
    return () => window.clearTimeout(id);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    apiClient.get('/contact-requests/admin', { params: { status: status === 'all' ? undefined : status, search: query || undefined, page, limit: LIMIT } })
      .then(({ data }) => {
        if (cancelled) return;
        setRows(data.rows || []);
        setTotal(data.total || 0);
        setSummary(data.summary || null);
      })
      .catch((err) => { if (!cancelled) setError(err?.response?.data?.message || 'Could not load callback requests'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [status, query, page, reload]);

  // a status change moves the row out of the current tab: reload the list and the counts
  const onSaved = (updated: Row) => {
    const statusMoved = rows.find(r => r._id === updated._id)?.status !== updated.status;
    if (statusMoved) setReload(n => n + 1);
    else setRows(prev => prev.map(r => (r._id === updated._id ? updated : r)));
  };

  const pages = Math.max(1, Math.ceil(total / LIMIT));
  const cards = [
    { key: 'new' as const, label: 'New', value: summary?.new, hint: 'Waiting for a call back', icon: Inbox },
    { key: 'contacted' as const, label: 'Contacted', value: summary?.contacted, hint: 'Called, follow-up open', icon: PhoneCall },
    { key: 'closed' as const, label: 'Closed', value: summary?.closed, hint: 'Done', icon: Archive },
    { key: 'all' as const, label: 'All requests', value: summary?.all, hint: 'From the Contact Us page', icon: CheckCircle2 },
  ];

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#0F172A]">Callback Requests</h2>
        <p className="text-xs text-[#64748B] mt-1">People who asked for a call back from the Contact Us page. Call them, then mark each one contacted or closed.</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        {cards.map(c => (
          <button key={c.label} type="button" onClick={() => { setStatus(c.key); setPage(1); }}
            className={`text-left bg-white rounded-2xl border shadow-sm p-4 transition-colors ${status === c.key ? 'border-[#00A86B]' : 'border-[#E2E8F0] hover:border-[#CBD5E1]'}`}>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#64748B]">{c.label}</span>
              <span className="w-8 h-8 rounded-lg bg-[#E6F9F2] flex items-center justify-center"><c.icon className="w-4 h-4 text-[#00A86B]" /></span>
            </div>
            <div className="mt-2 text-[24px] font-bold text-[#0F172A]">{summary ? c.value ?? 0 : '—'}</div>
            <div className="mt-1 text-[11px] text-[#94A3B8] leading-snug">{c.hint}</div>
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <div className="inline-flex rounded-lg border border-[#E2E8F0] bg-white p-0.5 w-fit">
          {(['new', 'contacted', 'closed', 'all'] as const).map(s => (
            <button key={s} type="button" onClick={() => { setStatus(s); setPage(1); }}
              className={`h-8 px-3 rounded-md text-[12px] font-semibold transition-colors ${status === s ? 'bg-[#00A86B] text-white' : 'text-[#475569] hover:bg-[#F8FAFC]'}`}>
              {s === 'all' ? 'All' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, number or note"
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B]" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-[#E6F9F2] border-b border-[#E2E8F0] text-[10px] uppercase tracking-wider font-bold text-[#64748B]">
                <th className="p-4">Name &amp; number</th>
                <th className="p-4">Their note</th>
                <th className="p-4">Requested</th>
                <th className="p-4">Status</th>
                <th className="p-4">Team note</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="text-xs font-medium text-[#475569]">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-[#94A3B8]">Loading…</td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="p-8 text-center text-[#DC2626]">{error}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-[#94A3B8]">No callback requests here.</td></tr>
              ) : rows.map(r => <RowItem key={r._id} row={r} onSaved={onSaved} canEdit={canEdit} />)}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center p-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
          <span className="text-xs text-[#64748B]">{total} request{total === 1 ? '' : 's'}</span>
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
