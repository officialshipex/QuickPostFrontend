import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Banknote, ArrowLeft, Shield, ChevronUp, ChevronDown } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface Props {
  open: boolean;
  onClose: () => void;
  walletBalance: number;
  onSuccess?: (addedAmount: number) => void;
}

export function RechargeWalletModal({ open, onClose, walletBalance, onSuccess }: Props) {
  const [rechargeAmount, setRechargeAmount] = useState(0);
  const [rechargeMode, setRechargeMode] = useState<'Payment' | 'COD'>('Payment');
  const [availableCodBalance, setAvailableCodBalance] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [showBillSummary, setShowBillSummary] = useState(true);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [tempCouponCode, setTempCouponCode] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleClose = () => {
    setRechargeAmount(0);
    setRechargeMode('Payment');
    setCouponCode('');
    setToast(null);
    onClose();
  };

  // Fetch COD balance when modal opens
  useEffect(() => {
    if (!open) return;
    apiClient.get('/cod/getCodRemitance')
      .then(res => setAvailableCodBalance(res.data.remittance || 0))
      .catch(() => {});
  }, [open]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* ── Recharge Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[200]"
            />

            <div className="fixed inset-0 flex items-center justify-center z-[201] p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="w-full max-w-[300px] sm:max-w-[380px] max-h-[88vh] sm:max-h-[92vh] overflow-y-auto bg-white rounded-2xl sm:rounded-3xl shadow-[0_24px_48px_rgba(0,0,0,0.16)] p-4 sm:p-6 relative pointer-events-auto border border-slate-100"
              >
                {/* Close button */}
                <button
                  type="button"
                  onClick={handleClose}
                  className="absolute -top-3.5 sm:-top-5 left-1/2 -translate-x-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:bg-slate-50 transition-colors border border-slate-100 cursor-pointer focus:outline-none"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
                </button>

                {/* Toast */}
                {toast && (
                  <div className="mb-3 px-3 py-2 rounded-xl bg-[#F0FDF4] text-[#00A86B] text-[12px] font-semibold text-center">
                    {toast}
                  </div>
                )}

                {/* Header */}
                <div className="flex justify-between items-center mb-3 sm:mb-5 mt-1 sm:mt-2">
                  <h2 className="text-sm sm:text-lg font-bold text-[#0F172A]">Recharge Wallet</h2>
                  <div className="flex items-center gap-1 text-[#00A86B] font-semibold text-xs sm:text-sm">
                    <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="h-[1px] bg-slate-100 mb-3 sm:mb-5" />

                {rechargeMode === 'Payment' ? (
                  <>
                    {/* Amount input */}
                    <div className="text-center mb-3 sm:mb-5">
                      <p className="text-[10px] sm:text-[11px] font-bold text-[#64748B] uppercase tracking-wide mb-2 sm:mb-3">Enter Amount to Add</p>
                      <div className="inline-block relative">
                        <div className="flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
                          <span className="mr-1 font-extrabold select-none">₹</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={rechargeAmount || ''}
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, '');
                              setRechargeAmount(val ? parseInt(val) : 0);
                            }}
                            style={{ width: `${Math.max(1.5, rechargeAmount ? rechargeAmount.toString().length : 1.5) * 16}px`, minWidth: '26px' }}
                            className="text-center bg-transparent focus:outline-none font-extrabold border-none p-0 select-all"
                            placeholder="0"
                          />
                        </div>
                        <div className="w-full border-b border-dashed border-[#94A3B8] mt-1 h-0" />
                      </div>

                      {/* Quick pills */}
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-5">
                        {[500, 1000, 2000, 5000].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setRechargeAmount(amt)}
                            className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full border text-[11px] sm:text-xs font-semibold transition-all ${
                              rechargeAmount === amt
                                ? 'border-[#00A86B] bg-[#00A86B]/5 text-[#00A86B]'
                                : 'border-slate-200 text-[#64748B] hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            ₹{amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="h-[1px] bg-slate-100 mb-3 sm:mb-4" />

                    {/* Offer & Bill Summary */}
                    <div className="mb-3 sm:mb-5">
                      <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 sm:mb-2.5">Offer & Bill Summary</p>

                      {/* Coupon box */}
                      <div
                        onClick={() => { setTempCouponCode(couponCode); setShowCouponModal(true); }}
                        className="border border-slate-200/80 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between bg-white mb-2 sm:mb-3 hover:border-slate-300 transition-colors cursor-pointer"
                      >
                        <div className="flex flex-col text-left">
                          <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wide">Coupon Code</span>
                          <span className="text-[11px] sm:text-xs font-semibold text-slate-700">
                            {couponCode
                              ? <span className="text-[#00A86B] font-bold">{couponCode}</span>
                              : 'Have Coupon Code?'
                            }
                          </span>
                        </div>
                        <span className="text-[11px] sm:text-xs font-bold text-[#00A86B] hover:text-[#009B63] select-none">
                          {couponCode ? 'Change' : 'View Coupons'}
                        </span>
                      </div>

                      {/* Bill details */}
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0]/50 rounded-xl p-2.5 sm:p-3">
                        <button
                          type="button"
                          onClick={() => setShowBillSummary(!showBillSummary)}
                          className="w-full flex items-center justify-between text-[11px] sm:text-xs font-bold text-[#475569] focus:outline-none"
                        >
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#94A3B8]" />
                            <span>Amount to be credited: ₹{(rechargeAmount || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[#94A3B8]">
                            <span className="text-[9px] sm:text-[10px] font-bold hidden sm:inline">{showBillSummary ? 'Hide Bill Summary' : 'Show Bill Summary'}</span>
                            {showBillSummary ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </div>
                        </button>
                        {showBillSummary && (
                          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-[#E2E8F0] space-y-1.5 sm:space-y-2">
                            <div className="flex justify-between text-[11px] sm:text-xs font-semibold text-[#64748B]">
                              <span>Recharge Amount</span>
                              <span>₹{(rechargeAmount || 0).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-[11px] sm:text-xs font-bold text-[#0F172A] pt-2 border-t border-dashed border-[#E2E8F0]">
                              <span>Payable Amount</span>
                              <span>₹{(rechargeAmount || 0).toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pay button */}
                    <button
                      type="button"
                      disabled={!rechargeAmount || rechargeAmount <= 0}
                      onClick={() => {
                        onSuccess?.(rechargeAmount);
                        showToast(`Recharge of ₹${rechargeAmount.toLocaleString('en-IN')} successful!`);
                        setTimeout(handleClose, 1500);
                      }}
                      className="w-full py-2.5 sm:py-3.5 bg-gradient-to-r from-[#00b876] to-[#00A86B] text-white text-xs sm:text-sm font-bold rounded-full shadow-[0_4px_12px_rgba(0,168,107,0.2)] hover:from-[#00c982] hover:to-[#00b876] transition-all disabled:opacity-50 disabled:pointer-events-none text-center focus:outline-none cursor-pointer"
                    >
                      Pay ₹{(rechargeAmount || 0).toLocaleString('en-IN')}
                    </button>

                    {/* OR divider */}
                    <div className="relative flex py-1.5 sm:py-2 items-center my-1 sm:my-1.5">
                      <div className="flex-grow border-t border-slate-100" />
                      <span className="flex-shrink mx-3 text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">OR</span>
                      <div className="flex-grow border-t border-slate-100" />
                    </div>

                    <button
                      type="button"
                      onClick={() => setRechargeMode('COD')}
                      className="w-full py-2.5 sm:py-3 border border-[#00A86B]/30 hover:border-[#00A86B] bg-[#00A86B]/5 hover:bg-[#00A86B]/10 text-[#00A86B] text-[11px] sm:text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer"
                    >
                      <Banknote className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Recharge via COD Remittance
                    </button>
                  </>
                ) : (
                  <div className="space-y-3 sm:space-y-5 animate-fade-in">
                    {/* COD info card */}
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50/30 border border-emerald-100/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-left">
                      <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                        <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Available COD Payout</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-slate-800">
                        ₹{availableCodBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-slate-400 font-semibold mt-1">
                        Transfer funds directly from your pending COD remittance.
                      </p>
                    </div>

                    {/* Amount input */}
                    <div className="text-center">
                      <p className="text-[10px] sm:text-[11px] font-bold text-[#64748B] uppercase tracking-wide mb-2 sm:mb-2.5">Amount to Transfer</p>
                      <div className="inline-block relative">
                        <div className="flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
                          <span className="mr-1 font-extrabold select-none">₹</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={rechargeAmount || ''}
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, '');
                              setRechargeAmount(val ? parseInt(val) : 0);
                            }}
                            style={{ width: `${Math.max(1.5, rechargeAmount ? rechargeAmount.toString().length : 1.5) * 16}px`, minWidth: '26px' }}
                            className="text-center bg-transparent focus:outline-none font-extrabold border-none p-0 select-all"
                            placeholder="0"
                          />
                        </div>
                        <div className="w-full border-b border-dashed border-[#94A3B8] mt-1 h-0" />
                      </div>
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                        {[500, 1000, 2000, 5000].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setRechargeAmount(amt)}
                            className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full border text-[11px] sm:text-xs font-semibold transition-all ${
                              rechargeAmount === amt
                                ? 'border-[#00A86B] bg-[#00A86B]/5 text-[#00A86B]'
                                : 'border-slate-200 text-[#64748B] hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            ₹{amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Info banner */}
                    <div className="flex gap-2 p-2.5 sm:p-3 bg-slate-50 border border-slate-100 rounded-xl text-left">
                      <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#94A3B8] shrink-0 mt-0.5" />
                      <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium leading-normal">
                        No gateway charges apply. The transferred amount will be adjusted in your next COD settlement statement.
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2 sm:space-y-2.5">
                      <button
                        type="button"
                        disabled={!rechargeAmount || rechargeAmount <= 0 || rechargeAmount > availableCodBalance}
                        onClick={() => {
                          setAvailableCodBalance(prev => prev - rechargeAmount);
                          onSuccess?.(rechargeAmount);
                          showToast(`Successfully transferred ₹${rechargeAmount.toLocaleString('en-IN')} from COD Remittance!`);
                          setTimeout(() => { handleClose(); setRechargeMode('Payment'); }, 1500);
                        }}
                        className="w-full py-2.5 sm:py-3.5 bg-gradient-to-r from-emerald-600 to-[#00A86B] text-white text-xs sm:text-sm font-bold rounded-full shadow-[0_4px_12px_rgba(0,168,107,0.2)] hover:from-emerald-700 hover:to-[#009B63] transition-all disabled:opacity-50 disabled:pointer-events-none text-center focus:outline-none cursor-pointer"
                      >
                        Confirm Transfer
                      </button>
                      <button
                        type="button"
                        onClick={() => setRechargeMode('Payment')}
                        className="w-full py-2 sm:py-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 text-[11px] sm:text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer"
                      >
                        <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Back to Online Payment
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── Coupon Modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCouponModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCouponModal(false)}
              className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[210]"
            />
            <div className="fixed inset-0 flex items-center justify-center z-[211] p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="w-full max-w-[360px] max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-[0_24px_48px_rgba(0,0,0,0.16)] p-6 relative pointer-events-auto border border-slate-100"
              >
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:bg-slate-50 transition-colors border border-slate-100 cursor-pointer focus:outline-none"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>

                <div className="text-center mb-5 mt-2">
                  <h2 className="text-lg font-bold text-[#0F172A] mb-1">Available Coupon</h2>
                  <p className="text-[11px] text-[#64748B] font-medium">Note: Cash-back amount will expire in 30 days.</p>
                </div>

                <div className="h-[1px] bg-slate-100 mb-4" />

                <div className="border border-slate-200/80 rounded-xl px-4 py-2.5 flex items-center justify-between bg-white mb-5 hover:border-slate-300 transition-colors">
                  <input
                    type="text"
                    placeholder="Enter Coupon Code"
                    value={tempCouponCode}
                    onChange={e => setTempCouponCode(e.target.value.toUpperCase())}
                    className="bg-transparent focus:outline-none text-xs font-bold text-[#0F172A] placeholder:text-[#94A3B8] w-full mr-2 uppercase"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (tempCouponCode.trim()) {
                        setCouponCode(tempCouponCode);
                        showToast(`Coupon "${tempCouponCode}" applied!`);
                        setShowCouponModal(false);
                      } else {
                        showToast('Please enter a coupon code.');
                      }
                    }}
                    className="text-xs font-bold text-[#00A86B] hover:text-[#009B63] transition-colors shrink-0 focus:outline-none"
                  >
                    Apply
                  </button>
                </div>

                <div className="text-center mb-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Available Coupons</span>
                </div>

                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {[
                    { code: 'SHIPFIRST25', desc: 'Save ₹25 using this code', actionText: 'Apply Code' },
                    { code: 'FREESHIP100', desc: 'Free shipping on orders over ₹1000', actionText: 'Apply Code' },
                    { code: 'WELCOME50',   desc: 'Get ₹50 off on your first purchase', actionText: 'Apply Code' },
                    { code: 'BUY2GET1',    desc: 'Buy 2 items, get 1 free', actionText: 'Apply Offer' },
                  ].map(coupon => {
                    const isApplied = couponCode === coupon.code;
                    return (
                      <div
                        key={coupon.code}
                        className={`border rounded-xl px-4 py-3 flex items-center justify-between transition-all ${
                          isApplied
                            ? 'border-[#00A86B] bg-[#00A86B]/5 shadow-[0_2px_8px_rgba(0,168,107,0.05)]'
                            : 'border-slate-100 hover:border-slate-200 bg-[#F8FAFC]/40'
                        }`}
                      >
                        <div className="flex flex-col text-left mr-3">
                          <span className="text-xs font-bold text-[#0F172A] tracking-tight">{coupon.code}</span>
                          <span className="text-[10px] text-[#64748B] font-medium mt-0.5">{coupon.desc}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (isApplied) {
                              setCouponCode('');
                              showToast('Coupon removed.');
                            } else {
                              setCouponCode(coupon.code);
                              showToast(`Coupon "${coupon.code}" applied!`);
                              setShowCouponModal(false);
                            }
                          }}
                          className={`text-[10px] font-bold shrink-0 transition-colors focus:outline-none ${
                            isApplied ? 'text-[#00A86B]' : 'text-slate-500 hover:text-[#00A86B]'
                          }`}
                        >
                          {isApplied ? 'Applied' : coupon.actionText}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
