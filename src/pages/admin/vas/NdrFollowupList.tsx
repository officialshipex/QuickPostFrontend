import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import {
  apiMessage, fmtDateTime, fmtMoney, NDR_CALL_LABEL, NDR_MODE_LABEL, NDR_WA_LABEL,
  type NdrActivity, type NdrActivityParams, type NdrCallStatus, type NdrFollowupRow, type NdrWaStatus,
} from './vasApi';

/* NDR follow-ups list with outcome filter, search and paging. The seller page shows the seller's own follow-ups;
   the admin's Manage VAS tab shows every seller (showSeller). Charges only appear on successful responses. */

const OUTCOMES: { key: string; label: string }[] = [
  { key: '', label: 'All' },
  { key: 'charged', label: 'Charged' },
  { key: 'wa_delivered', label: 'WhatsApp delivered' },
  { key: 'wa_failed', label: 'WhatsApp not delivered' },
  { key: 'call_answered', label: 'Call answered' },
  { key: 'call_not_answered', label: 'Call not answered' },
  { key: 'pending', label: 'In progress' },
  { key: 'charge_failed', label: 'Charge failed' },
];

const WA_TONE: Partial<Record<NdrWaStatus, string>> = { delivered: 'text-[#16A34A]', failed: 'text-red-600', unconfirmed: 'text-[#B45309]', skipped: 'text-[#B45309]' };
const CALL_TONE: Partial<Record<NdrCallStatus, string>> = { answered: 'text-[#16A34A]', failed: 'text-red-600', unanswered: 'text-[#B45309]', no_result: 'text-[#B45309]', skipped: 'text-[#B45309]' };

function Channel({ label, tone, detail, charge }: { label: string; tone?: string; detail?: string; charge?: string }) {
  return (
    <div className="min-w-[140px]">
      <p className={`text-[12.5px] font-semibold ${tone || 'text-[#334155]'}`}>{label}</p>
      {detail && <p className="text-[11px] text-[#94A3B8] max-w-[220px] truncate" title={detail}>{detail}</p>}
      {charge && <p className="text-[11px] font-semibold text-[#0F172A]">{charge}</p>}
    </div>
  );
}

const chargeText = (c: { charged: boolean; chargedAmount: number; chargeError?: string }, success: boolean) =>
  c.chargeError ? `Charge failed: ${c.chargeError}` : success ? (c.chargedAmount > 0 ? `Charged ${fmtMoney(c.chargedAmount)}` : 'Free') : undefined;

export function NdrFollowupList({ load, showSeller, refreshKey = 0 }: { load: (p: NdrActivityParams) => Promise<NdrActivity>; showSeller?: boolean; refreshKey?: number }) {
  const [outcome, setOutcome] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<NdrActivity | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      setError('');
      setData(await load({ outcome: outcome || undefined, search: search || undefined, page, limit }));
    } catch (err) {
      setError(apiMessage(err, 'Could not load NDR follow-ups.'));
    } finally {
      setLoading(false);
    }
  }, [load, outcome, search, page]);

  useEffect(() => { fetchRows(); }, [fetchRows, refreshKey]);

  const pages = data ? Math.max(1, Math.ceil(data.total / limit)) : 1;
  const t = data?.totals30d;
  const cols = showSeller ? 6 : 5;

  return (
    <div className="space-y-4">
      {t && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ['Follow-ups (30 days)', t.followups.toLocaleString('en-IN')],
            ['WhatsApp delivered / sent', `${t.waDelivered} / ${t.waSent}`],
            ['Calls answered / placed', `${t.callsAnswered} / ${t.callsPlaced}`],
            ['Charged (30 days)', fmtMoney(t.charged)],
          ].map(([l, v]) => (
            <div key={l} className="bg-white rounded-xl border border-[#E2E8F0] px-4 py-3">
              <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">{l}</p>
              <p className="text-[17px] font-extrabold mt-0.5 text-[#0F172A]">{v}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="p-3 flex flex-wrap items-center gap-2 border-b border-[#F1F5F9]">
          <div className="flex gap-1 overflow-x-auto">
            {OUTCOMES.map((o) => (
              <button key={o.key} type="button" onClick={() => { setOutcome(o.key); setPage(1); }}
                className={`h-8 px-3 rounded-lg text-[12px] font-semibold whitespace-nowrap ${outcome === o.key ? 'bg-[#F0FDF4] text-[#00A86B] ring-1 ring-[#00A86B]/20' : 'text-[#64748B] hover:bg-[#F8FAFC]'}`}>{o.label}</button>
            ))}
          </div>
          <div className="relative ml-auto">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder={showSeller ? 'AWB or seller' : 'Search AWB'}
              className="h-8 w-48 pl-8 pr-3 rounded-lg border border-[#E2E8F0] text-[12.5px] outline-none focus:border-[#00A86B]" aria-label="Search" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[860px]">
            <thead>
              <tr className="bg-[#E6F9F2] border-b border-[#E2E8F0] text-[11px] uppercase tracking-wider font-bold text-[#64748B]">
                <th className="p-3 pl-4">NDR</th>
                {showSeller && <th className="p-3">Seller</th>}
                <th className="p-3">Mode</th>
                <th className="p-3">WhatsApp</th>
                <th className="p-3">Call</th>
                <th className="p-3 text-right">Charged</th>
              </tr>
            </thead>
            <tbody className="text-[12.5px] text-[#475569]">
              {loading ? (
                <tr><td colSpan={cols} className="p-10 text-center text-[#94A3B8]">Loading…</td></tr>
              ) : error ? (
                <tr><td colSpan={cols} className="p-10 text-center text-red-600 font-semibold">{error}</td></tr>
              ) : !data?.rows.length ? (
                <tr><td colSpan={cols} className="p-10 text-center text-[#94A3B8]">{outcome || search ? 'No follow-ups match this filter.' : 'No NDR follow-ups yet. They appear here when a delivery fails.'}</td></tr>
              ) : data.rows.map((r: NdrFollowupRow) => {
                const wa = r.whatsapp; const call = r.call;
                const total = (wa.chargedAmount || 0) + (call.chargedAmount || 0);
                return (
                  <tr key={r._id} className="border-b border-[#F1F5F9] align-top">
                    <td className="p-3 pl-4">
                      <p className="font-semibold text-[#0F172A] text-[13px]">{r.awb}</p>
                      <p className="text-[11px] text-[#94A3B8]">{fmtDateTime(r.createdAt)}{r.orderId ? ` · #${r.orderId}` : ''}</p>
                    </td>
                    {showSeller && (
                      <td className="p-3">
                        <p className="font-semibold text-[#0F172A]">{r.user?.fullname || '—'}</p>
                        <p className="text-[11px] text-[#94A3B8]">{r.user?.email}</p>
                      </td>
                    )}
                    <td className="p-3 whitespace-nowrap">{NDR_MODE_LABEL[r.mode]}</td>
                    <td className="p-3">
                      {r.mode === 'calling' ? <span className="text-[#CBD5E1]">—</span> : (
                        <Channel label={NDR_WA_LABEL[wa.status]} tone={WA_TONE[wa.status]} detail={wa.error}
                          charge={chargeText(wa, wa.status === 'delivered')} />
                      )}
                    </td>
                    <td className="p-3">
                      {r.mode === 'whatsapp' ? <span className="text-[#CBD5E1]">—</span> : (
                        <Channel
                          label={NDR_CALL_LABEL[call.status]}
                          tone={CALL_TONE[call.status]}
                          detail={call.status === 'waiting' && call.dueAt ? `If still open at ${fmtDateTime(call.dueAt)}` : call.customerResponse ? `“${call.customerResponse}”` : call.error}
                          charge={chargeText(call, call.status === 'answered')}
                        />
                      )}
                    </td>
                    <td className="p-3 text-right font-semibold text-[#0F172A] whitespace-nowrap">{total > 0 ? fmtMoney(total) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {data && data.total > limit && (
          <div className="flex items-center justify-between p-3 border-t border-[#F1F5F9] text-[12px] text-[#64748B]">
            <span>{data.total.toLocaleString('en-IN')} follow-ups</span>
            <div className="flex items-center gap-1">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="w-8 h-8 rounded-lg hover:bg-[#F1F5F9] disabled:opacity-40 flex items-center justify-center" aria-label="Previous page"><ChevronLeft className="w-4 h-4" /></button>
              <span className="px-2">{page} / {pages}</span>
              <button type="button" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="w-8 h-8 rounded-lg hover:bg-[#F1F5F9] disabled:opacity-40 flex items-center justify-center" aria-label="Next page"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
