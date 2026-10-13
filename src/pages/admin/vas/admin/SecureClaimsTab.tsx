import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, Loader2, Search, X } from 'lucide-react';
import { apiMessage, fmtDate, fmtDateTime, fmtMoney } from '../vasApi';
import { CLAIM_STATUS_LABEL, CLAIM_STATUS_STYLE, secureAdminApi, type Claim, type ClaimDetail } from '../secure/secureApi';
import type { AdminService } from './adminVasApi';
import { inputCls } from './adminShared';

const LIMIT = 20;
const FILTERS = [
  { id: 'submitted', label: 'To review' },
  { id: 'need_info', label: 'Waiting for seller' },
  { id: 'paid', label: 'Paid' },
  { id: 'rejected', label: 'Rejected' },
  { id: '', label: 'All' },
] as const;

type Notify = (type: 'success' | 'error' | 'info', text: string) => void;

export function SecureClaimsTab({ service, refreshKey, onChanged, notify }: { service: AdminService; refreshKey: number; onChanged: () => void; notify: Notify }) {
  const [status, setStatus] = useState<string>('submitted');
  const [type, setType] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Claim[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);
  useEffect(() => { setPage(1); }, [status, type, service.key]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await secureAdminApi.claims({ serviceKey: service.key, status: status || undefined, type: type || undefined, search: search || undefined, page, limit: LIMIT });
      setRows(r.rows); setTotal(r.total);
    } catch (err) {
      notify('error', apiMessage(err));
    } finally {
      setLoading(false);
    }
  }, [service.key, status, type, search, page, notify]);
  useEffect(() => { load(); }, [load, refreshKey]);

  const pages = Math.max(1, Math.ceil(total / LIMIT));
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
      <div className="p-4 flex flex-col lg:flex-row lg:items-center gap-3 border-b border-[#E2E8F0]">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button key={f.label} type="button" onClick={() => setStatus(f.id)} className={`h-8 px-3 rounded-full text-[12px] font-bold border transition-colors ${status === f.id ? 'bg-[#00A86B] border-[#00A86B] text-white' : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 lg:ml-auto">
          <select value={type} onChange={(e) => setType(e.target.value)} className={`${inputCls} w-32`} aria-label="Claim type"><option value="">All types</option><option value="lost">Lost</option><option value="damaged">Damaged</option></select>
          <div className="relative w-full lg:w-64">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Claim no., AWB or seller" className={`${inputCls} w-full pl-9`} aria-label="Search claims" />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-[#E6F9F2] border-b border-[#E2E8F0] text-[11px] uppercase tracking-wider font-bold text-[#64748B]">
              <th className="p-3 pl-4">Claim</th><th className="p-3">Seller</th><th className="p-3">AWB</th><th className="p-3">Type</th><th className="p-3 text-right">Claimed</th><th className="p-3">Status</th><th className="p-3">Filed</th>
            </tr>
          </thead>
          <tbody className="text-[12.5px] text-[#475569]">
            {loading ? <tr><td colSpan={7} className="p-10 text-center text-[#94A3B8]">Loading…</td></tr>
              : rows.length === 0 ? <tr><td colSpan={7} className="p-10 text-center text-[#94A3B8]">{status === 'submitted' ? 'No claims waiting for review.' : 'No claims match.'}</td></tr>
              : rows.map((c) => (
                <tr key={c._id} onClick={() => setOpenId(c._id)} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] cursor-pointer">
                  <td className="p-3 pl-4 font-bold text-[#0F172A]">{c.claimNo}</td>
                  <td className="p-3"><p className="font-semibold text-[#0F172A] text-[13px] truncate max-w-[200px]">{c.user?.fullname || 'Deleted user'}</p><p className="text-[11.5px] text-[#94A3B8] truncate max-w-[200px]">{c.user?.email}</p></td>
                  <td className="p-3">{c.awb}</td>
                  <td className="p-3">{c.type === 'lost' ? 'Lost' : 'Damaged'}</td>
                  <td className="p-3 text-right">{fmtMoney(c.claimedAmount)}</td>
                  <td className="p-3"><span className={`inline-flex h-6 items-center px-2.5 rounded-full border text-[11px] font-bold ${CLAIM_STATUS_STYLE[c.status]}`}>{CLAIM_STATUS_LABEL[c.status]}</span></td>
                  <td className="p-3 whitespace-nowrap">{fmtDate(c.createdAt)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-3 text-[12px] text-[#64748B]">
        <span>{total.toLocaleString('en-IN')} claim{total === 1 ? '' : 's'}</span>
        <div className="flex items-center gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-8 px-3 rounded-lg border border-[#E2E8F0] font-semibold disabled:opacity-40">Previous</button>
          <span>Page {page} of {pages}</span>
          <button type="button" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="h-8 px-3 rounded-lg border border-[#E2E8F0] font-semibold disabled:opacity-40">Next</button>
        </div>
      </div>
      <ClaimDrawer claimId={openId} onClose={() => setOpenId(null)} onChanged={() => { onChanged(); load(); }} notify={notify} />
    </div>
  );
}

type Action = 'approve' | 'reject' | 'info' | null;

function ClaimDrawer({ claimId, onClose, onChanged, notify }: { claimId: string | null; onClose: () => void; onChanged: () => void; notify: Notify }) {
  const [d, setD] = useState<ClaimDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<Action>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  // Parent callbacks are fresh each render; refs keep this panel from refetching (and clearing the form) every time.
  const cb = useRef({ notify, onClose });
  useEffect(() => { cb.current = { notify, onClose }; });

  const load = useCallback(async () => {
    if (!claimId) return;
    setLoading(true);
    try {
      const r = await secureAdminApi.claim(claimId);
      setD(r);
      setAmount(String(r.claim.claimedAmount));
    } catch (err) {
      cb.current.notify('error', apiMessage(err));
      cb.current.onClose();
    } finally {
      setLoading(false);
    }
  }, [claimId]);

  useEffect(() => { setD(null); setAction(null); setNote(''); if (claimId) load(); }, [claimId, load]);

  const c = d?.claim;
  const decidable = c && ['submitted', 'need_info', 'paying'].includes(c.status);
  const approved = Number(amount) || 0;
  const liability = d?.liabilityCredited || 0;
  const payout = Math.max(0, Math.round((approved - liability) * 100) / 100);

  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    try { await fn(); notify('success', ok); setAction(null); setNote(''); await load(); onChanged(); }
    catch (err) { notify('error', apiMessage(err)); }
    finally { setBusy(false); }
  };

  return (
    <AnimatePresence>
      {claimId && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-[#0F172A]/40 z-[150]" />
          <motion.aside initial={{ x: 560 }} animate={{ x: 0 }} exit={{ x: 560 }} transition={{ type: 'spring', stiffness: 380, damping: 38 }} className="fixed top-0 right-0 bottom-0 w-full max-w-[560px] bg-white z-[151] shadow-2xl flex flex-col" role="dialog" aria-modal="true" aria-label="Claim details">
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#E2E8F0]">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Auto Secure claim</p>
                <h2 className="text-[16px] font-bold text-[#0F172A]">{c?.claimNo || 'Loading…'}</h2>
                {c && <span className={`inline-flex h-6 items-center px-2.5 mt-1 rounded-full border text-[11px] font-bold ${CLAIM_STATUS_STYLE[c.status]}`}>{CLAIM_STATUS_LABEL[c.status]}</span>}
              </div>
              <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] flex items-center justify-center shrink-0" aria-label="Close"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {loading && !d && <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#94A3B8]" /></div>}
              {d && c && (
                <>
                  <div className="grid grid-cols-2 gap-3 text-[12.5px]">
                    <Box label="Seller"><p className="font-semibold text-[#0F172A]">{d.user?.fullname}</p><p className="text-[#64748B] break-all">{d.user?.email}</p>{d.user?.phoneNumber && <p className="text-[#64748B]">{d.user.phoneNumber}</p>}</Box>
                    <Box label="Seller's claims"><p><b>{d.sellerHistory.total}</b> other · <b>{d.sellerHistory.paid}</b> paid · <b>{d.sellerHistory.rejected}</b> rejected</p></Box>
                    <Box label="Claim"><p className="font-semibold text-[#0F172A]">{c.type === 'lost' ? 'Lost' : 'Damaged'} · {fmtMoney(c.claimedAmount)}</p><p className="text-[#64748B]">Cover {fmtMoney(c.coverAmount)} · filed {fmtDateTime(c.createdAt)}</p></Box>
                    <Box label="Policy">{d.policy ? <><p className="font-semibold text-[#0F172A]">{d.policy.status === 'covered' ? 'Covered' : d.policy.status}</p><p className="text-[#64748B]">Premium {fmtMoney(d.policy.premium)} · value {fmtMoney(d.policy.declaredValue)}</p></> : '—'}</Box>
                  </div>

                  {d.order && (
                    <div className="rounded-xl border border-[#E2E8F0] px-4 py-3 text-[12.5px] text-[#475569]">
                      <p className="font-bold text-[#0F172A] text-[13px] mb-1">Shipment {d.order.awb_number}</p>
                      <p>{d.order.courierName || '—'} · {d.order.paymentDetails?.method || ''} {d.order.paymentDetails?.amount ? fmtMoney(d.order.paymentDetails.amount) : ''} · status <b>{d.order.status}</b></p>
                      <p>{d.order.pickupAddress?.city || '—'} → {[d.order.receiverAddress?.city, d.order.receiverAddress?.state].filter(Boolean).join(', ') || '—'}</p>
                      {d.order.tracking.length > 0 && (
                        <ul className="mt-2 space-y-1 border-t border-[#F1F5F9] pt-2">
                          {d.order.tracking.map((t, i) => <li key={i} className="text-[11.5px]"><span className="text-[#94A3B8]">{fmtDateTime(t.StatusDateTime)}</span> · {t.status || t.Instructions}{t.StatusLocation ? ` — ${t.StatusLocation}` : ''}</li>)}
                        </ul>
                      )}
                    </div>
                  )}

                  <div>
                    <p className="text-[12px] font-bold text-[#475569] mb-1">Seller's statement</p>
                    <p className="text-[13px] text-[#0F172A] whitespace-pre-wrap bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3">{c.description}</p>
                    {c.evidence.length > 0 && (
                      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px]">
                        {c.evidence.map((e, i) => <a key={e.url} href={e.url} target="_blank" rel="noopener noreferrer" className="text-[#4F46E5] font-semibold hover:underline inline-flex items-center gap-1">{e.name || `File ${i + 1}`} <ExternalLink className="w-3 h-3" /></a>)}
                      </p>
                    )}
                    {c.evidence.length === 0 && c.type === 'lost' && <p className="mt-2 text-[12px] text-[#94A3B8]">No files attached.</p>}
                  </div>

                  {c.status === 'paid' && <p className="text-[12.5px] text-[#16A34A] font-semibold bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl px-4 py-3">Approved {fmtMoney(c.approvedAmount || 0)}; {fmtMoney(c.payoutAmount || 0)} paid to the seller's wallet{c.liabilityDeducted ? ` (${fmtMoney(c.liabilityDeducted)} was already credited as courier liability)` : ''} on {fmtDate(c.paidAt)}.</p>}
                  {c.status === 'rejected' && <p className="text-[12.5px] text-red-700 bg-[#FEF2F2] border border-red-100 rounded-xl px-4 py-3"><b>Rejected:</b> {c.rejectionReason}</p>}
                  {c.status === 'need_info' && <p className="text-[12.5px] text-[#92400E] bg-[#FFFBEB] border border-[#FDE68A] rounded-xl px-4 py-3"><b>Waiting for seller:</b> {c.adminNote}</p>}

                  {decidable && (
                    <section className="border-t border-[#F1F5F9] pt-4 space-y-3">
                      <h3 className="text-[13px] font-bold text-[#0F172A]">Decision</h3>
                      {c.status === 'paying' && <p className="text-[12.5px] text-[#92400E] bg-[#FFFBEB] border border-[#FDE68A] rounded-lg px-3 py-2">A payment for this claim was started but did not finish. Approve again to complete it — the seller is never paid twice.</p>}
                      {!action && (
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => setAction('approve')} className="h-9 px-4 rounded-lg bg-[#00A86B] hover:bg-[#009B63] text-white text-[12.5px] font-bold">Approve &amp; pay</button>
                          {c.status === 'submitted' && <button type="button" onClick={() => setAction('info')} className="h-9 px-4 rounded-lg border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] text-[12.5px] font-bold">Ask for details</button>}
                          {c.status !== 'paying' && <button type="button" onClick={() => setAction('reject')} className="h-9 px-4 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[12.5px] font-bold">Reject</button>}
                        </div>
                      )}
                      {action === 'approve' && (
                        <div className="space-y-2">
                          <label className="text-[12px] font-bold text-[#475569] block">Amount to approve (₹, up to {fmtMoney(c.coverAmount)})</label>
                          <input type="number" min={1} max={c.coverAmount} value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} w-full`} />
                          <div className="text-[12.5px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#475569]">
                            {liability > 0 && <p>Already credited to the seller as courier liability: <b>{fmtMoney(liability)}</b> (deducted so they are not paid twice)</p>}
                            <p>Paid to the seller's wallet now: <b className="text-[#0F172A]">{fmtMoney(payout)}</b></p>
                          </div>
                          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="Note (optional)" className={`${inputCls} w-full`} />
                          <div className="flex gap-2">
                            <button type="button" disabled={busy || approved <= 0 || approved > c.coverAmount} onClick={() => run(() => secureAdminApi.approve(c._id, { approvedAmount: approved, note }), `Paid ${fmtMoney(payout)} to the seller's wallet.`)} className="h-9 px-4 rounded-lg bg-[#00A86B] hover:bg-[#009B63] text-white text-[12.5px] font-bold disabled:opacity-50 inline-flex items-center gap-2">{busy && <Loader2 className="w-4 h-4 animate-spin" />} Confirm payment</button>
                            <button type="button" onClick={() => setAction(null)} className="h-9 px-3 rounded-lg text-[12.5px] font-semibold text-[#64748B] hover:bg-[#F1F5F9]">Cancel</button>
                          </div>
                        </div>
                      )}
                      {(action === 'reject' || action === 'info') && (
                        <div className="space-y-2">
                          <label className="text-[12px] font-bold text-[#475569] block">{action === 'reject' ? 'Reason for rejecting (the seller sees this)' : 'What do you need from the seller?'}</label>
                          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={1000} className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-[13px] outline-none focus:border-[#00A86B]" />
                          <div className="flex gap-2">
                            <button type="button" disabled={busy || !note.trim()} onClick={() => run(() => (action === 'reject' ? secureAdminApi.reject(c._id, note) : secureAdminApi.requestInfo(c._id, note)), action === 'reject' ? 'Claim rejected.' : 'Sent back to the seller.')} className={`h-9 px-4 rounded-lg text-white text-[12.5px] font-bold disabled:opacity-50 inline-flex items-center gap-2 ${action === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#0F172A]'}`}>{busy && <Loader2 className="w-4 h-4 animate-spin" />} {action === 'reject' ? 'Reject claim' : 'Send to seller'}</button>
                            <button type="button" onClick={() => setAction(null)} className="h-9 px-3 rounded-lg text-[12.5px] font-semibold text-[#64748B] hover:bg-[#F1F5F9]">Cancel</button>
                          </div>
                        </div>
                      )}
                    </section>
                  )}

                  {c.history && c.history.length > 0 && (
                    <section>
                      <h3 className="text-[13px] font-bold text-[#0F172A] mb-2">History</h3>
                      <ol className="space-y-2.5 border-l-2 border-[#E2E8F0] pl-4">
                        {c.history.map((h, i) => (
                          <li key={i} className="relative">
                            <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-[#CBD5E1]" />
                            <p className="text-[12.5px] font-semibold text-[#0F172A] capitalize">{h.action.replace('-', ' ')} <span className="font-normal text-[#94A3B8]">· {h.by}</span></p>
                            <p className="text-[11.5px] text-[#94A3B8]">{fmtDateTime(h.at)}{h.note ? ` — ${h.note}` : ''}</p>
                          </li>
                        ))}
                      </ol>
                    </section>
                  )}
                </>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Box({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[#F8FAFC] border border-[#F1F5F9] px-3 py-2.5 min-w-0">
      <p className="text-[10.5px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">{label}</p>
      <div className="text-[12.5px] text-[#475569] break-words">{children}</div>
    </div>
  );
}
