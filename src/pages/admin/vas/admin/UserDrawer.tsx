import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, Loader2, X } from 'lucide-react';
import { apiMessage, fmtDate, fmtDateTime, fmtMoney } from '../vasApi';
import { getPublicTrackingUrl } from '../../brandedTracking/trackingService';
import { adminVasApi, type AdminService, type FollowUpStatus } from './adminVasApi';
import { FOLLOW_LABEL, FollowBadge, StatusBadge, inputCls } from './adminShared';

type Detail = Awaited<ReturnType<typeof adminVasApi.userDetail>>;

const ACTION_LABEL: Record<string, string> = {
  activated: 'Activated',
  republished: 'Published again',
  deactivated: 'Deactivated',
  expired: 'Plan expired',
  'plan-purchased': 'Bought a plan',
  'plan-granted': 'Plan given by admin',
  followup: 'Follow-up updated',
};
const BY_LABEL = { user: 'Seller', admin: 'Admin', system: 'System' } as const;

interface Props {
  service: AdminService;
  userId: string | null;
  onClose: () => void;
  onChanged: () => void;
  notify: (type: 'success' | 'error' | 'info', text: string) => void;
}

export function UserDrawer({ service, userId, onClose, onChanged, notify }: Props) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [grantMonths, setGrantMonths] = useState('1');
  const [grantAmount, setGrantAmount] = useState('');
  const [grantNote, setGrantNote] = useState('');
  const [followStatus, setFollowStatus] = useState<FollowUpStatus>('none');
  const [followNote, setFollowNote] = useState('');
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  // The parent passes fresh callbacks on every render; keeping them in refs stops this panel from refetching
  // (and wiping what the admin is typing) each time the page re-renders.
  const cb = useRef({ notify, onClose });
  useEffect(() => { cb.current = { notify, onClose }; });

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const d = await adminVasApi.userDetail(service.key, userId);
      setDetail(d);
      setFollowStatus(d.subscription?.followUp?.status || 'none');
      setFollowNote(d.subscription?.followUp?.note || '');
    } catch (err) {
      cb.current.notify('error', apiMessage(err));
      cb.current.onClose();
    } finally {
      setLoading(false);
    }
  }, [userId, service.key]);

  useEffect(() => {
    setDetail(null);
    setConfirmDeactivate(false);
    setGrantNote('');
    setGrantAmount('');
    setGrantMonths('1');
    if (userId) load();
  }, [userId, load]);

  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      notify('success', ok);
      await load();
      onChanged();
    } catch (err) {
      notify('error', apiMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const sub = detail?.subscription;
  const status = sub?.status;
  const blocked = detail?.override?.access === 'disabled';

  return (
    <AnimatePresence>
      {userId && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-[#0F172A]/40 z-[150]" />
          <motion.aside
            initial={{ x: 480 }} animate={{ x: 0 }} exit={{ x: 480 }} transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-[480px] bg-white z-[151] shadow-2xl flex flex-col" role="dialog" aria-modal="true" aria-label="Seller details"
          >
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#E2E8F0]">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">{service.name}</p>
                <h2 className="text-[16px] font-bold text-[#0F172A] truncate">{detail?.user.fullname || 'Loading…'}</h2>
                {detail && <p className="text-[12.5px] text-[#64748B] truncate">{detail.user.email}{detail.user.phoneNumber ? ` · ${detail.user.phoneNumber}` : ''}</p>}
                {detail?.user.company && <p className="text-[12px] text-[#94A3B8] truncate">{detail.user.company}</p>}
              </div>
              <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] flex items-center justify-center shrink-0" aria-label="Close"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              {(loading && !detail) && <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#94A3B8]" /></div>}

              {detail && (
                <>
                  {!sub ? (
                    <p className="text-[13px] text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3">This seller has not activated this service yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <Info label="Status"><StatusBadge status={status!} blocked={blocked} /></Info>
                      <Info label="Times activated">{sub.activationCount}</Info>
                      <Info label="First activated">{fmtDate(sub.firstActivatedAt)}</Info>
                      <Info label="Last activated">{fmtDate(sub.lastActivatedAt)}</Info>
                      <Info label="Last deactivated">{sub.lastDeactivatedAt ? `${fmtDate(sub.lastDeactivatedAt)}${sub.deactivatedBy ? ` (${sub.deactivatedBy === 'user' ? 'by seller' : sub.deactivatedBy === 'admin' ? 'by admin' : 'plan expired'})` : ''}` : '—'}</Info>
                      <Info label="Plan valid until">{sub.entitledUntil ? fmtDate(sub.entitledUntil) : 'No end date'}</Info>
                      <Info label="Total paid">{fmtMoney(sub.totalPaid)}</Info>
                      <Info label="Follow-up"><FollowBadge status={sub.followUp?.status || 'none'} /></Info>
                    </div>
                  )}

                  {detail.page && (
                    <div className="rounded-xl border border-[#E2E8F0] px-4 py-3 text-[12.5px] text-[#475569] space-y-1">
                      <p className="font-bold text-[#0F172A] text-[13px]">Branded page</p>
                      {detail.page.slug ? (
                        <p>
                          {detail.page.live ? (
                            <a href={getPublicTrackingUrl(detail.page.slug)} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#00A86B] hover:underline inline-flex items-center gap-1">
                              /track/{detail.page.slug} <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : <span>/track/{detail.page.slug} <span className="text-[#94A3B8]">(not live)</span></span>}
                        </p>
                      ) : <p>No page created.</p>}
                      <p>{detail.page.views.toLocaleString('en-IN')} customer visits{detail.page.lastViewedAt ? ` · last ${fmtDate(detail.page.lastViewedAt)}` : ''}</p>
                    </div>
                  )}

                  {detail.override && (
                    <p className="text-[12.5px] text-[#475569] bg-[#FFFBEB] border border-[#FDE68A] rounded-xl px-4 py-3">
                      <span className="font-bold text-[#78350F]">Special rule:</span>{' '}
                      {detail.override.access === 'disabled' ? 'switched off for this seller' : detail.override.access === 'enabled' ? 'kept on for this seller' : 'normal access'}
                      {detail.override.chargeMode === 'free' ? ', free' : detail.override.chargeMode === 'custom' ? ', own plans' : ''}
                      {detail.override.note ? ` — ${detail.override.note}` : ''}
                    </p>
                  )}

                  {/* Follow-up */}
                  {sub && (
                    <section>
                      <h3 className="text-[13px] font-bold text-[#0F172A] mb-2">Follow-up</h3>
                      <div className="space-y-2">
                        <select value={followStatus} onChange={(e) => setFollowStatus(e.target.value as FollowUpStatus)} className={`${inputCls} w-full`} aria-label="Follow-up status">
                          {(Object.keys(FOLLOW_LABEL) as FollowUpStatus[]).map((k) => <option key={k} value={k}>{FOLLOW_LABEL[k]}</option>)}
                        </select>
                        <textarea
                          value={followNote} onChange={(e) => setFollowNote(e.target.value)} rows={3} maxLength={1000}
                          placeholder="What did the seller say? Why did they deactivate?"
                          className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-[13px] outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10"
                        />
                        <button
                          type="button" disabled={busy}
                          onClick={() => run(() => adminVasApi.setFollowUp(service.key, userId!, followStatus, followNote), 'Follow-up saved.')}
                          className="h-9 px-4 rounded-lg bg-[#0F172A] text-white text-[12.5px] font-bold disabled:opacity-60"
                        >Save follow-up</button>
                      </div>
                    </section>
                  )}

                  {/* Give / extend a plan */}
                  <section>
                    <h3 className="text-[13px] font-bold text-[#0F172A] mb-1">Give or extend a plan</h3>
                    <p className="text-[12px] text-[#64748B] mb-2">Does not touch the seller's wallet. Enter an amount only to record a payment received outside the wallet.</p>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input type="number" min={1} max={60} value={grantMonths} onChange={(e) => setGrantMonths(e.target.value)} className={inputCls} aria-label="Months" placeholder="Months" />
                      <input type="number" min={0} value={grantAmount} onChange={(e) => setGrantAmount(e.target.value)} className={inputCls} aria-label="Amount received" placeholder="Amount received (₹, optional)" />
                    </div>
                    <input value={grantNote} onChange={(e) => setGrantNote(e.target.value)} maxLength={300} className={`${inputCls} w-full mb-2`} aria-label="Note" placeholder="Note (e.g. paid by UPI, complimentary for 2 months)" />
                    <button
                      type="button" disabled={busy}
                      onClick={() => {
                        const m = Number(grantMonths);
                        if (!Number.isInteger(m) || m < 1 || m > 60) { notify('error', 'Enter months between 1 and 60.'); return; }
                        run(async () => { await adminVasApi.grant(service.key, userId!, { months: m, amount: Number(grantAmount) || 0, note: grantNote }); }, 'Plan updated.');
                      }}
                      className="h-9 px-4 rounded-lg bg-[#00A86B] hover:bg-[#009B63] text-white text-[12.5px] font-bold disabled:opacity-60"
                    >Give plan</button>
                  </section>

                  {/* Deactivate */}
                  {status === 'active' && (
                    <section>
                      <h3 className="text-[13px] font-bold text-[#0F172A] mb-1">Deactivate</h3>
                      <p className="text-[12px] text-[#64748B] mb-2">
                        {service.activation === 'publish' ? 'Takes the seller\'s branded page down. Their design stays saved and they can publish again.' : 'Stops the service for this seller. They can activate it again.'}
                      </p>
                      {confirmDeactivate ? (
                        <div className="flex items-center gap-2">
                          <button type="button" disabled={busy} onClick={() => run(async () => { await adminVasApi.deactivate(service.key, userId!); setConfirmDeactivate(false); }, 'Deactivated.')} className="h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[12.5px] font-bold disabled:opacity-60">Yes, deactivate</button>
                          <button type="button" onClick={() => setConfirmDeactivate(false)} className="h-9 px-3 rounded-lg text-[12.5px] font-semibold text-[#64748B] hover:bg-[#F1F5F9]">Cancel</button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setConfirmDeactivate(true)} className="h-9 px-4 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[12.5px] font-bold">Deactivate for this seller</button>
                      )}
                    </section>
                  )}

                  {/* History */}
                  {sub && sub.history.length > 0 && (
                    <section>
                      <h3 className="text-[13px] font-bold text-[#0F172A] mb-2">History</h3>
                      <ol className="space-y-2.5 border-l-2 border-[#E2E8F0] pl-4">
                        {sub.history.map((h, i) => (
                          <li key={i} className="relative">
                            <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-[#CBD5E1]" />
                            <p className="text-[12.5px] text-[#0F172A] font-semibold">
                              {ACTION_LABEL[h.action] || h.action}
                              {h.months ? ` · ${h.months} month${h.months > 1 ? 's' : ''}` : ''}
                              {h.amount ? ` · ${fmtMoney(h.amount)}` : ''}
                            </p>
                            <p className="text-[11.5px] text-[#94A3B8]">{fmtDateTime(h.at)} · {BY_LABEL[h.by]}{h.note ? ` — ${h.note}` : ''}</p>
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

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[#F8FAFC] border border-[#F1F5F9] px-3 py-2.5 min-w-0">
      <p className="text-[10.5px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">{label}</p>
      <div className="text-[13px] font-semibold text-[#0F172A] break-words">{children}</div>
    </div>
  );
}
