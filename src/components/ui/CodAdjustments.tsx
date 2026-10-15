import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info, X, RotateCcw } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

// COD of orders the courier returned after delivery (RTO after "Delivered") is adjusted automatically by the backend
// (COD/codReversal.js): taken out of "COD to be remitted", removed from an unpaid remittance, or recovered from the
// next remittance when it was already paid. These pieces show the seller and the admin why amounts changed.

export interface CodAdjustment {
  kind?: string;
  orderId?: string;
  awb?: string;
  amount?: number;
  note?: string;
  date?: string;
}

const inr = (n: any) => `₹${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d?: string) => {
  if (!d) return '';
  const x = new Date(d);
  return isNaN(x.getTime()) ? '' : x.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Reasons attached to one remittance (detail popups).
export function CodAdjustmentNotes({ adjustments }: { adjustments?: CodAdjustment[] }) {
  const list = Array.isArray(adjustments) ? adjustments : [];
  if (!list.length) return null;
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
      <p className="font-semibold flex items-center gap-1 mb-1">
        <Info className="w-3.5 h-3.5" /> Why the amount of this remittance changed
      </p>
      <ul className="space-y-1 list-disc pl-4">
        {list.map((a, i) => (
          <li key={i}>
            {a.note}
            {a.date && <span className="text-amber-600"> ({fmtDate(a.date)})</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Small marker for a remittance row; opens the reasons.
export function CodAdjustmentBadge({ adjustments, remittanceId }: { adjustments?: CodAdjustment[]; remittanceId?: string }) {
  const [open, setOpen] = useState(false);
  const list = Array.isArray(adjustments) ? adjustments : [];
  if (!list.length) return null;
  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        title={list.map((a) => a.note).join('\n')}
        className="mt-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-semibold hover:bg-amber-100 whitespace-nowrap"
      >
        <Info className="w-3 h-3" /> Adjusted
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-[300] bg-black/40 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[13px] font-bold text-[#0F172A]">Remittance {remittanceId}</h3>
              <button onClick={() => setOpen(false)} className="text-[#94A3B8] hover:text-red-500"><X className="w-4 h-4" /></button>
            </div>
            <CodAdjustmentNotes adjustments={list} />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

// Amount still to be recovered from the next COD remittance(s).
export function CodRecoveryBanner({ amount, onView }: { amount?: number; onView?: () => void }) {
  if (!(Number(amount) > 0)) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
      <RotateCcw className="w-4 h-4 shrink-0" />
      <span>
        <b>{inr(amount)}</b> will be recovered from the next COD remittance: COD already paid for orders the courier
        returned (RTO) after delivery.
      </span>
      {onView && (
        <button onClick={onView} className="ml-auto font-semibold underline hover:text-amber-900 whitespace-nowrap">View details</button>
      )}
    </div>
  );
}

const STAGE_LABEL: Record<string, string> = {
  queued: 'Removed from "COD to be remitted"',
  pending_remittance: 'Removed from unpaid remittance',
  paid_remittance: 'Recovered from next remittance',
};
const RECOVERY_LABEL: Record<string, string> = {
  none: '—',
  pending: 'To be recovered',
  partial: 'Partly recovered',
  recovered: 'Recovered',
  cancelled: 'Cancelled',
};

// Every returned-after-delivery adjustment. A seller gets their own; admin gets all, or one seller with `userId`.
export function CodReversalsModal({ open, onClose, userId, isAdmin }: { open: boolean; onClose: () => void; userId?: string; isAdmin?: boolean }) {
  const [rows, setRows] = useState<any[]>([]);
  const [due, setDue] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const params: Record<string, any> = { page, limit: 100 };
        if (userId) params.userId = userId;
        const res = await apiClient.get('/cod/codReversals', { params });
        if (cancelled) return;
        setRows(res.data?.results || []);
        setDue(res.data?.summary?.recoveryDue || 0);
        setTotalPages(res.data?.totalPages || 1);
      } catch (err: any) {
        if (!cancelled) setError(err?.response?.data?.message || 'Could not load the adjustments.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, page, userId]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[250] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#E2E8F0]">
          <div>
            <h3 className="text-[14px] font-bold text-[#0F172A]">COD orders returned after delivery</h3>
            <p className="text-[11px] text-[#64748B]">
              The courier marked these orders RTO after they were delivered, so their COD was adjusted automatically.
              {due > 0 && <> Still to be recovered: <b className="text-amber-700">{inr(due)}</b></>}
            </p>
          </div>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-red-500"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-auto flex-1">
          {loading ? (
            <p className="py-10 text-center text-[12px] text-[#64748B]">Loading…</p>
          ) : error ? (
            <p className="py-10 text-center text-[12px] text-red-600">{error}</p>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-[12px] text-[#64748B]">No returned COD orders.</p>
          ) : (
            <table className="w-full text-[12px] border-collapse">
              <thead className="bg-[#E6F9F2] sticky top-0">
                <tr className="text-[#0F172A]">
                  <th className="text-left px-3 py-2 font-semibold">Date</th>
                  {isAdmin && <th className="text-left px-3 py-2 font-semibold">Seller</th>}
                  <th className="text-left px-3 py-2 font-semibold">Order / AWB</th>
                  <th className="text-left px-3 py-2 font-semibold">COD</th>
                  <th className="text-left px-3 py-2 font-semibold">What was done</th>
                  <th className="text-left px-3 py-2 font-semibold">Recovery</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id} className="border-t border-[#E2E8F0] align-top">
                    <td className="px-3 py-2 text-[#475569] whitespace-nowrap">{fmtDate(r.date)}</td>
                    {isAdmin && (
                      <td className="px-3 py-2 text-[#475569]">
                        <p>{r.user?.name || '—'}</p>
                        <p className="text-[10px] text-[#94A3B8]">{r.user?.userId}</p>
                      </td>
                    )}
                    <td className="px-3 py-2">
                      <p className="text-[#00A86B] font-semibold">#{r.orderId}</p>
                      <p className="text-[10px] text-[#64748B]">{r.awb}</p>
                      <p className="text-[10px] text-[#64748B]">{r.toStatus}</p>
                    </td>
                    <td className="px-3 py-2 text-[#0F172A] whitespace-nowrap">{inr(r.codAmount)}</td>
                    <td className="px-3 py-2 text-[#475569] max-w-[340px]">
                      <p className="font-semibold text-[#0F172A]">
                        {STAGE_LABEL[r.stage] || r.stage}
                        {r.remittanceId ? ` (${r.remittanceId})` : ''}
                        {r.status === 'undone' && <span className="ml-1 text-[#00A86B]">· delivered again</span>}
                      </p>
                      <p className="text-[11px] text-[#64748B] mt-0.5">{r.status === 'undone' ? r.undoNote : r.note}</p>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.recoveryAmount > 0 ? (
                        <>
                          <p className="text-[#0F172A]">{inr(r.recoveredAmount)} / {inr(r.recoveryAmount)}</p>
                          <p className={`text-[10px] font-semibold ${r.recoveryStatus === 'recovered' ? 'text-[#00A86B]' : r.recoveryStatus === 'cancelled' ? 'text-[#94A3B8]' : 'text-amber-600'}`}>
                            {RECOVERY_LABEL[r.recoveryStatus] || r.recoveryStatus}
                          </p>
                          {(r.recoveredIn || []).map((x: any, i: number) => (
                            <p key={i} className="text-[10px] text-[#94A3B8]">{inr(x.amount)} in {x.remittanceId}</p>
                          ))}
                        </>
                      ) : <span className="text-[#94A3B8]">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 px-5 py-2 border-t border-[#E2E8F0] text-[12px]">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 border rounded-md disabled:opacity-40">Prev</button>
            <span className="text-[#64748B]">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 border rounded-md disabled:opacity-40">Next</button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
