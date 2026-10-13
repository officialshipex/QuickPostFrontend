import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Loader2, Wallet2, X } from 'lucide-react';
import { fmtMoney, planLabel, type VasPlan } from './vasApi';

interface PlanModalProps {
  open: boolean;
  title: string;
  /** What happens once the plan is bought, e.g. "Your page will be published". */
  confirmLabel: string;
  plans: VasPlan[];
  busy?: boolean;
  onClose: () => void;
  /** Called with the chosen plan; the caller buys it and then continues (publish / activate). */
  onConfirm: (plan: VasPlan) => void;
}

/** Plan picker shown when an admin has switched charges on for a service. The amount is taken from the seller's wallet. */
export function PlanModal({ open, title, confirmLabel, plans, busy, onClose, onConfirm }: PlanModalProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const chosen = plans.find((p) => p.months === selected) ?? plans[0];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !busy && onClose()} className="fixed inset-0 bg-[#0F172A]/50 backdrop-blur-sm z-[200]" />
          <div className="fixed inset-0 flex items-center justify-center z-[201] p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="w-full max-w-[440px] bg-white rounded-2xl shadow-2xl p-6 pointer-events-auto border border-[#E2E8F0]"
              role="dialog"
              aria-modal="true"
              aria-label={title}
            >
              <div className="flex items-start justify-between gap-3 mb-1">
                <h2 className="text-[15px] font-bold text-[#0F172A]">{title}</h2>
                <button type="button" onClick={onClose} disabled={busy} className="w-7 h-7 -mt-1 -mr-1 rounded-lg text-[#94A3B8] hover:bg-[#F1F5F9] flex items-center justify-center" aria-label="Close">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[13px] text-[#64748B] leading-relaxed mb-4">Choose a plan. The amount is deducted from your wallet.</p>

              <div className="space-y-2.5 mb-4">
                {plans.map((p) => {
                  const active = p.months === chosen?.months;
                  return (
                    <button
                      key={p.months}
                      type="button"
                      onClick={() => setSelected(p.months)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${active ? 'border-[#00A86B] bg-[#F0FDF4]' : 'border-[#E2E8F0] hover:bg-[#F8FAFC]'}`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${active ? 'border-[#00A86B] bg-[#00A86B]' : 'border-[#CBD5E1]'}`}>
                          {active && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </span>
                        <span className="text-[13px] font-semibold text-[#0F172A]">{planLabel(p)}</span>
                      </span>
                      <span className="text-[14px] font-bold text-[#0F172A]">{fmtMoney(p.price)}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 text-[12px] text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 mb-5">
                <Wallet2 className="w-3.5 h-3.5 shrink-0" />
                <span>{chosen ? `${fmtMoney(chosen.price)} will be charged from your wallet. ${confirmLabel}` : confirmLabel}</span>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={onClose} disabled={busy} className="flex-1 h-10 rounded-full border border-[#E2E8F0] text-[#64748B] hover:text-[#334155] hover:bg-[#F8FAFC] text-[13px] font-bold transition-all">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => chosen && onConfirm(chosen)}
                  disabled={busy || !chosen}
                  className="flex-1 h-10 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-bold shadow-sm transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                  {busy ? 'Processing…' : chosen ? `Pay ${fmtMoney(chosen.price)}` : 'Pay'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
