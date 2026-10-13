import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { apiMessage, fmtDate, fmtMoney } from '../vasApi';
import { ClaimModal } from './ClaimModal';
import {
  CLAIM_STATUS_LABEL, CLAIM_STATUS_STYLE, secureApi, type Claim, type ClaimType, type Policy, type PolicyStatus,
} from './secureApi';

const LIMIT = 10;
const SERVICE_SHORT: Record<string, string> = { 'auto-secure-above-2500': 'High value', 'auto-secure-india-post': 'India Post' };
const POLICY_STYLE: Record<PolicyStatus, string> = {
  covered: 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]',
  not_covered: 'bg-[#FEF2F2] text-red-600 border-red-200',
  cancelled: 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]',
};
const POLICY_LABEL: Record<PolicyStatus, string> = { covered: 'Covered', not_covered: 'Not covered', cancelled: 'Cancelled' };

interface Props {
  notify: (type: 'success' | 'error' | 'info', text: string) => void;
}

/** The seller's covered shipments and their claims, under the Auto Secure plans. */
export function SellerSecure({ notify }: Props) {
  const [tab, setTab] = useState<'shipments' | 'claims'>('shipments');
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [newClaim, setNewClaim] = useState<{ policy: Policy; type: ClaimType } | null>(null);
  const [respondTo, setRespondTo] = useState<Claim | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);
  useEffect(() => { setPage(1); }, [tab, status]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'shipments') {
        const r = await secureApi.policies({ status: status || undefined, search: search || undefined, page, limit: LIMIT });
        setPolicies(r.rows); setTotal(r.total);
      } else {
        const r = await secureApi.claims({ page, limit: LIMIT });
        setClaims(r.rows); setTotal(r.total);
      }
    } catch (err) {
      notify('error', apiMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tab, status, search, page, notify]);

  useEffect(() => { load(); }, [load, tick]);

  const pages = Math.max(1, Math.ceil(total / LIMIT));
  const refresh = () => setTick((t) => t + 1);

  const withdraw = async (c: Claim) => {
    try { await secureApi.withdraw(c._id); notify('info', `Claim ${c.claimNo} withdrawn.`); refresh(); }
    catch (err) { notify('error', apiMessage(err)); }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
      <div className="px-5 pt-4 flex flex-wrap items-center gap-3 border-b border-[#E2E8F0]">
        <div className="flex gap-1" role="tablist">
          {([['shipments', 'Secured shipments'], ['claims', 'My claims']] as const).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`h-10 px-3 text-[13px] font-bold border-b-2 -mb-px transition-colors ${tab === id ? 'border-[#00A86B] text-[#00A86B]' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'}`}>{label}</button>
          ))}
        </div>
        {tab === 'shipments' && (
          <div className="ml-auto flex flex-wrap items-center gap-2 pb-2">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 px-2 rounded-lg border border-[#E2E8F0] text-[12.5px] bg-white" aria-label="Cover status">
              <option value="">All</option><option value="covered">Covered</option><option value="not_covered">Not covered</option><option value="cancelled">Cancelled</option>
            </select>
            <div className="relative">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search AWB" className="h-9 w-44 pl-8 pr-2 rounded-lg border border-[#E2E8F0] text-[12.5px] outline-none focus:border-[#00A86B]" aria-label="Search AWB" />
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        {tab === 'shipments' ? (
          <table className="w-full text-left border-collapse min-w-[860px]">
            <thead>
              <tr className="bg-[#E6F9F2] border-b border-[#E2E8F0] text-[11px] uppercase tracking-wider font-bold text-[#64748B]">
                <th className="p-3 pl-5">AWB</th><th className="p-3">Plan</th><th className="p-3 text-right">Value</th><th className="p-3 text-right">Premium</th><th className="p-3 text-right">Cover</th><th className="p-3">Shipment</th><th className="p-3">Cover status</th><th className="p-3 pr-5">Claim</th>
              </tr>
            </thead>
            <tbody className="text-[12.5px] text-[#475569]">
              {loading ? <tr><td colSpan={8} className="p-10 text-center text-[#94A3B8]">Loading…</td></tr>
                : policies.length === 0 ? <tr><td colSpan={8} className="p-10 text-center text-[#94A3B8]">{search || status ? 'No shipments match.' : 'No secured shipments yet. Shipments you book while Auto Secure is active appear here.'}</td></tr>
                : policies.map((p) => (
                  <tr key={p._id} className="border-b border-[#F1F5F9]">
                    <td className="p-3 pl-5 font-semibold text-[#0F172A]">{p.awb}<p className="font-normal text-[11px] text-[#94A3B8]">{fmtDate(p.issuedAt)}</p></td>
                    <td className="p-3">{SERVICE_SHORT[p.serviceKey] || p.serviceKey}</td>
                    <td className="p-3 text-right">{fmtMoney(p.declaredValue)}</td>
                    <td className="p-3 text-right">{p.premium ? fmtMoney(p.premium) : '—'}</td>
                    <td className="p-3 text-right">{p.status === 'covered' ? fmtMoney(p.coverAmount) : '—'}</td>
                    <td className="p-3">{p.orderStatus || '—'}</td>
                    <td className="p-3">
                      <span className={`inline-flex h-6 items-center px-2.5 rounded-full border text-[11px] font-bold ${POLICY_STYLE[p.status]}`} title={p.reason || undefined}>{POLICY_LABEL[p.status]}</span>
                    </td>
                    <td className="p-3 pr-5">
                      {p.claim && p.claim.status !== 'rejected' ? (
                        <span className={`inline-flex h-6 items-center px-2.5 rounded-full border text-[11px] font-bold ${CLAIM_STATUS_STYLE[p.claim.status]}`}>{CLAIM_STATUS_LABEL[p.claim.status]}</span>
                      ) : p.claimable ? (
                        <button type="button" onClick={() => setNewClaim({ policy: p, type: p.claimable! })} className="text-[12px] font-bold text-[#00A86B] hover:underline">File {p.claimable} claim</button>
                      ) : p.status === 'not_covered' ? <span className="text-[11.5px] text-[#94A3B8]">{p.reason ? 'Low wallet balance' : '—'}</span> : <span className="text-[#CBD5E1]">—</span>}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : (
          <div className="divide-y divide-[#F1F5F9]">
            {loading ? <p className="p-10 text-center text-[#94A3B8] text-[13px]">Loading…</p>
              : claims.length === 0 ? <p className="p-10 text-center text-[#94A3B8] text-[13px]">You have not filed any claims.</p>
              : claims.map((c) => (
                <div key={c._id} className="p-5">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="text-[13px] font-bold text-[#0F172A]">{c.claimNo}</span>
                    <span className={`inline-flex h-6 items-center px-2.5 rounded-full border text-[11px] font-bold ${CLAIM_STATUS_STYLE[c.status]}`}>{CLAIM_STATUS_LABEL[c.status]}</span>
                    <span className="text-[12.5px] text-[#475569]">AWB {c.awb} · {c.type === 'lost' ? 'Lost' : 'Damaged'} · claimed {fmtMoney(c.claimedAmount)}</span>
                    <span className="text-[12px] text-[#94A3B8] ml-auto">{fmtDate(c.createdAt)}</span>
                  </div>
                  {c.status === 'paid' && <p className="mt-2 text-[12.5px] text-[#16A34A] font-semibold">{fmtMoney(c.payoutAmount || 0)} credited to your wallet{c.liabilityDeducted ? ` (after ${fmtMoney(c.liabilityDeducted)} already credited as courier liability)` : ''}.</p>}
                  {c.status === 'need_info' && <p className="mt-2 text-[12.5px] text-[#B45309] bg-[#FFFBEB] border border-[#FDE68A] rounded-lg px-3 py-2">{c.adminNote}</p>}
                  {c.status === 'rejected' && <p className="mt-2 text-[12.5px] text-red-700 bg-[#FEF2F2] border border-red-100 rounded-lg px-3 py-2">{c.rejectionReason}</p>}
                  {c.evidence.length > 0 && (
                    <p className="mt-2 text-[12px] text-[#64748B] flex flex-wrap gap-x-3">
                      {c.evidence.map((e, i) => <a key={e.url} href={e.url} target="_blank" rel="noopener noreferrer" className="text-[#4F46E5] hover:underline inline-flex items-center gap-1">{e.name || `File ${i + 1}`} <ExternalLink className="w-3 h-3" /></a>)}
                    </p>
                  )}
                  {['submitted', 'need_info'].includes(c.status) && (
                    <div className="mt-3 flex gap-3">
                      {c.status === 'need_info' && <button type="button" onClick={() => setRespondTo(c)} className="h-8 px-3 rounded-lg bg-[#00A86B] text-white text-[12px] font-bold">Add details</button>}
                      <button type="button" onClick={() => withdraw(c)} className="text-[12px] font-bold text-red-600 hover:underline">Withdraw claim</button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-5 py-3 text-[12px] text-[#64748B] border-t border-[#F1F5F9]">
        <span>{total.toLocaleString('en-IN')} {tab === 'shipments' ? 'shipment' : 'claim'}{total === 1 ? '' : 's'}</span>
        <div className="flex items-center gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-8 px-3 rounded-lg border border-[#E2E8F0] font-semibold disabled:opacity-40">Previous</button>
          <span>Page {page} of {pages}</span>
          <button type="button" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="h-8 px-3 rounded-lg border border-[#E2E8F0] font-semibold disabled:opacity-40">Next</button>
        </div>
      </div>

      {newClaim && (
        <ClaimModal mode="new" policy={newClaim.policy} type={newClaim.type} onClose={() => setNewClaim(null)}
          onDone={(c) => { setNewClaim(null); notify('success', `Claim ${c.claimNo} submitted. We will review it shortly.`); setTab('claims'); refresh(); }} />
      )}
      {respondTo && (
        <ClaimModal mode="respond" claim={respondTo} onClose={() => setRespondTo(null)}
          onDone={(c) => { setRespondTo(null); notify('success', `Details sent for ${c.claimNo}.`); refresh(); }} />
      )}
    </div>
  );
}
