import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { apiMessage, fmtDate, fmtMoney } from '../vasApi';
import { secureAdminApi, type Policy } from '../secure/secureApi';
import type { AdminService } from './adminVasApi';
import { inputCls } from './adminShared';

const LIMIT = 20;
const STYLE: Record<string, string> = {
  covered: 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]',
  not_covered: 'bg-[#FEF2F2] text-red-600 border-red-200',
  cancelled: 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]',
};
const LABEL: Record<string, string> = { covered: 'Covered', not_covered: 'Not covered', cancelled: 'Cancelled' };

interface Props {
  service: AdminService;
  refreshKey: number;
  onChanged: () => void;
  notify: (type: 'success' | 'error' | 'info', text: string) => void;
}

/** Every shipment this plan has covered, with the premium taken. Cover is normally issued by a sweep every ten minutes. */
export function SecurePoliciesTab({ service, refreshKey, onChanged, notify }: Props) {
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Policy[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sweeping, setSweeping] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);
  useEffect(() => { setPage(1); }, [status, service.key]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await secureAdminApi.policies({ serviceKey: service.key, status: status || undefined, search: search || undefined, page, limit: LIMIT });
      setRows(r.rows); setTotal(r.total);
    } catch (err) {
      notify('error', apiMessage(err));
    } finally {
      setLoading(false);
    }
  }, [service.key, status, search, page, notify]);
  useEffect(() => { load(); }, [load, refreshKey]);

  const sweep = async () => {
    setSweeping(true);
    try {
      const r = await secureAdminApi.sweep();
      notify('success', `Checked ${r.sellers} seller${r.sellers === 1 ? '' : 's'}: ${r.issued} shipment${r.issued === 1 ? '' : 's'} covered, ${r.refunded} premium${r.refunded === 1 ? '' : 's'} refunded.`);
      onChanged();
    } catch (err) {
      notify('error', apiMessage(err));
    } finally {
      setSweeping(false);
    }
  };

  const pages = Math.max(1, Math.ceil(total / LIMIT));
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
      <div className="p-4 flex flex-col md:flex-row md:items-center gap-3 border-b border-[#E2E8F0]">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputCls} w-full md:w-44`} aria-label="Cover status">
          <option value="">All covers</option><option value="covered">Covered</option><option value="not_covered">Not covered</option><option value="cancelled">Cancelled (refunded)</option>
        </select>
        <div className="relative md:w-72">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="AWB, order no. or seller" className={`${inputCls} w-full pl-9`} aria-label="Search" />
        </div>
        <button type="button" onClick={sweep} disabled={sweeping} className="md:ml-auto h-10 px-4 rounded-lg border border-[#00A86B] text-[#00A86B] hover:bg-[#F0FDF4] text-[12.5px] font-bold disabled:opacity-60 inline-flex items-center gap-2" title="Issue cover for newly booked shipments and refund cancelled ones now">
          <RefreshCw className={`w-4 h-4 ${sweeping ? 'animate-spin' : ''}`} /> Run cover check now
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-[#E6F9F2] border-b border-[#E2E8F0] text-[11px] uppercase tracking-wider font-bold text-[#64748B]">
              <th className="p-3 pl-4">Seller</th><th className="p-3">AWB</th><th className="p-3">Courier</th><th className="p-3 text-right">Value</th><th className="p-3 text-right">Premium</th><th className="p-3 text-right">Cover</th><th className="p-3">Status</th><th className="p-3">Issued</th>
            </tr>
          </thead>
          <tbody className="text-[12.5px] text-[#475569]">
            {loading ? <tr><td colSpan={8} className="p-10 text-center text-[#94A3B8]">Loading…</td></tr>
              : rows.length === 0 ? <tr><td colSpan={8} className="p-10 text-center text-[#94A3B8]">No covered shipments yet.</td></tr>
              : rows.map((p) => (
                <tr key={p._id} className="border-b border-[#F1F5F9]">
                  <td className="p-3 pl-4"><p className="font-semibold text-[#0F172A] text-[13px] truncate max-w-[200px]">{p.user?.fullname || 'Deleted user'}</p><p className="text-[11.5px] text-[#94A3B8] truncate max-w-[200px]">{p.user?.email}</p></td>
                  <td className="p-3 font-semibold text-[#0F172A]">{p.awb}</td>
                  <td className="p-3">{p.courierName || '—'}</td>
                  <td className="p-3 text-right">{fmtMoney(p.declaredValue)}</td>
                  <td className="p-3 text-right">{p.premium ? fmtMoney(p.premium) : '—'}</td>
                  <td className="p-3 text-right">{p.status === 'covered' ? fmtMoney(p.coverAmount) : '—'}</td>
                  <td className="p-3"><span className={`inline-flex h-6 items-center px-2.5 rounded-full border text-[11px] font-bold ${STYLE[p.status]}`} title={p.reason || undefined}>{LABEL[p.status]}</span></td>
                  <td className="p-3 whitespace-nowrap">{fmtDate(p.issuedAt)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-3 text-[12px] text-[#64748B]">
        <span>{total.toLocaleString('en-IN')} shipment{total === 1 ? '' : 's'}</span>
        <div className="flex items-center gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-8 px-3 rounded-lg border border-[#E2E8F0] font-semibold disabled:opacity-40">Previous</button>
          <span>Page {page} of {pages}</span>
          <button type="button" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="h-8 px-3 rounded-lg border border-[#E2E8F0] font-semibold disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}
