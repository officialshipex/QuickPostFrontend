/* B2C <-> Cargo wallet transfer (backend POST /recharge/transfer, wallet/cargoWallet.js).
   Every recharge lands in the B2C wallet; Cargo (B2B) shipments are paid from the Cargo wallet, filled from here.
   Minimum ₹1,000 either way; only the free balance (balance − hold) can move, never the credit limit. */
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowDown, ArrowUpDown, Plus } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { Toast } from './Toast';
import { useToast } from '../../hooks/useToast';

const MIN_TRANSFER = 1000;

type Direction = 'toCargo' | 'toMain';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Direction the popup opens with (Cargo panel: B2C → Cargo). */
  defaultDirection?: Direction;
  /** After a transfer: both new balances. */
  onSuccess?: (balances: { main: number; cargo: number }) => void;
  /** "Recharge B2C wallet" link (recharges always go to the B2C wallet). */
  onRecharge?: () => void;
}

const fmt = (n: number) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function TransferWalletModal({ open, onClose, defaultDirection = 'toCargo', onSuccess, onRecharge }: Props) {
  const [direction, setDirection] = useState<Direction>(defaultDirection);
  const [amount, setAmount] = useState(0);
  const [main, setMain] = useState({ balance: 0, holdAmount: 0 });
  const [cargo, setCargo] = useState({ balance: 0, holdAmount: 0 });
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast, showToast, closeToast } = useToast();

  const load = async () => {
    try {
      const { data } = await apiClient.get('/recharge/wallets');
      setMain({ balance: Number(data.main?.balance || 0), holdAmount: Number(data.main?.holdAmount || 0) });
      setCargo({ balance: Number(data.cargo?.balance || 0), holdAmount: Number(data.cargo?.holdAmount || 0) });
      setLoaded(true);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Could not load the wallet balances.');
    }
  };

  useEffect(() => {
    if (!open) return;
    setDirection(defaultDirection);
    setAmount(0);
    setLoading(false);
    setLoaded(false);
    closeToast();
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultDirection]);

  const from = direction === 'toCargo' ? main : cargo;
  const available = Math.max(0, Math.round((from.balance - from.holdAmount) * 100) / 100);
  const fromName = direction === 'toCargo' ? 'B2C Wallet' : 'Cargo Wallet';
  const toName = direction === 'toCargo' ? 'Cargo Wallet' : 'B2C Wallet';
  const tooLow = amount > 0 && amount < MIN_TRANSFER;
  const tooHigh = amount > available;

  const submit = async () => {
    if (amount < MIN_TRANSFER) return showToast('error', `Minimum transfer is ₹${MIN_TRANSFER.toLocaleString('en-IN')}`);
    if (amount > available) return showToast('error', `Only ${fmt(available)} can be transferred from the ${fromName}`);
    setLoading(true);
    try {
      const { data } = await apiClient.post('/recharge/transfer', { direction, amount });
      setMain((m) => ({ ...m, balance: Number(data.main) }));
      setCargo((c) => ({ ...c, balance: Number(data.cargo) }));
      showToast('success', data.message || 'Transferred');
      setAmount(0);
      onSuccess?.({ main: Number(data.main), cargo: Number(data.cargo) });
      setTimeout(onClose, 1500);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Transfer failed. Nothing was moved — please try again.');
      load();
    } finally {
      setLoading(false);
    }
  };

  if (typeof document === 'undefined') return null;

  const WalletRow = ({ label, w, tone }: { label: string; w: { balance: number; holdAmount: number }; tone: string }) => (
    <div className={`rounded-xl border px-3 py-2.5 ${tone}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
        <span className={`text-sm sm:text-base font-extrabold ${w.balance < 0 ? 'text-red-500' : 'text-[#0F172A]'}`}>{fmt(w.balance)}</span>
      </div>
      {w.holdAmount > 0 && <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Hold {fmt(w.holdAmount)} (stays in the wallet)</p>}
    </div>
  );

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
            className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[200]" />
          <div className="fixed inset-0 flex items-center justify-center z-[201] p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-full max-w-[320px] sm:max-w-[400px] relative pointer-events-auto"
            >
              <button type="button" onClick={onClose}
                className="absolute -top-3.5 sm:-top-5 left-1/2 -translate-x-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:bg-slate-50 transition-colors border border-slate-100 cursor-pointer focus:outline-none z-10">
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
              </button>
              <div className="max-h-[88vh] sm:max-h-[92vh] overflow-y-auto bg-white rounded-2xl sm:rounded-3xl shadow-[0_24px_48px_rgba(0,0,0,0.16)] p-4 sm:p-6 border border-slate-100">
                <Toast toast={toast} onClose={closeToast} />

                <div className="flex justify-between items-center mb-3 sm:mb-4 mt-1 sm:mt-2">
                  <h2 className="text-sm sm:text-lg font-bold text-[#0F172A]">Transfer Between Wallets</h2>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mb-3 sm:mb-4 leading-normal">
                  Recharges go to the B2C wallet. Cargo (B2B) shipments are paid from the Cargo wallet.
                </p>

                {/* from -> to */}
                <div className="space-y-1.5">
                  <WalletRow label={`From · ${fromName}`} w={from} tone="border-slate-200 bg-[#F8FAFC]" />
                  <div className="flex justify-center">
                    <button type="button" onClick={() => { setDirection(direction === 'toCargo' ? 'toMain' : 'toCargo'); setAmount(0); }}
                      title="Switch direction"
                      className="w-8 h-8 rounded-full border border-[#00A86B]/30 bg-[#00A86B]/5 text-[#00A86B] flex items-center justify-center hover:bg-[#00A86B]/10 transition-colors cursor-pointer focus:outline-none">
                      <span className="sr-only">Switch direction</span>
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                  <WalletRow label={`To · ${toName}`} w={direction === 'toCargo' ? cargo : main} tone="border-[#00A86B]/20 bg-[#00A86B]/5" />
                </div>

                {/* amount */}
                <div className="text-center mt-4 sm:mt-5 mb-3 sm:mb-4">
                  <p className="text-[10px] sm:text-[11px] font-bold text-[#64748B] uppercase tracking-wide mb-2">Amount to Transfer</p>
                  <div className="inline-block relative">
                    <div className="flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
                      <span className="mr-1 font-extrabold select-none">₹</span>
                      <input type="text" inputMode="numeric" pattern="[0-9]*" value={amount || ''} placeholder="0"
                        onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setAmount(v ? parseInt(v, 10) : 0); }}
                        style={{ width: `${Math.max(1, amount ? amount.toString().length : 1) + 0.4}ch` }}
                        className="text-center bg-transparent focus:outline-none font-extrabold border-none p-0 select-all" />
                    </div>
                    <div className="w-full border-b border-dashed border-[#94A3B8] mt-1 h-0" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1.5">Available to transfer: {loaded ? fmt(available) : '…'}</p>
                  {tooLow && <p className="text-[10px] text-red-500 font-semibold mt-1">Minimum transfer is ₹{MIN_TRANSFER.toLocaleString('en-IN')}</p>}
                  {!tooLow && tooHigh && <p className="text-[10px] text-red-500 font-semibold mt-1">More than the {fromName} has free</p>}
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-3">
                    {[1000, 2000, 5000, 10000].map((amt) => (
                      <button key={amt} type="button" onClick={() => setAmount(amt)}
                        className={`px-2.5 sm:px-3.5 py-1 rounded-full border text-[11px] sm:text-xs font-semibold transition-all ${amount === amt ? 'border-[#00A86B] bg-[#00A86B]/5 text-[#00A86B]' : 'border-slate-200 text-[#64748B] hover:border-slate-300 hover:bg-slate-50'}`}>
                        ₹{amt / 1000}k
                      </button>
                    ))}
                    {available >= MIN_TRANSFER && (
                      <button type="button" onClick={() => setAmount(Math.floor(available))}
                        className="px-2.5 sm:px-3.5 py-1 rounded-full border border-slate-200 text-[11px] sm:text-xs font-semibold text-[#64748B] hover:border-slate-300 hover:bg-slate-50">
                        All
                      </button>
                    )}
                  </div>
                </div>

                <button type="button" disabled={!loaded || !amount || tooLow || tooHigh || loading} onClick={submit}
                  className="w-full py-2.5 sm:py-3.5 bg-gradient-to-r from-[#00b876] to-[#00A86B] text-white text-xs sm:text-sm font-bold rounded-full shadow-[0_4px_12px_rgba(0,168,107,0.2)] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  {loading ? 'Transferring…' : `Transfer ₹${(amount || 0).toLocaleString('en-IN')} to ${toName}`}
                </button>

                {onRecharge && (
                  <button type="button" onClick={onRecharge}
                    className="w-full mt-2 py-2 sm:py-2.5 border border-[#00A86B]/30 hover:border-[#00A86B] bg-white text-[#00A86B] text-[11px] sm:text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer">
                    <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Recharge B2C Wallet
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
