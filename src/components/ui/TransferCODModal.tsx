import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../../services/apiClient';
import { Toast } from './Toast';
import { useToast } from '../../hooks/useToast';
import { Wallet, Lock, Building2, UserCircle, FileText, Banknote, Scale, Archive } from 'lucide-react';

interface Props {
  userId: string;
  selectedRemittanceIds: string[];
  type?: 'seller' | 'courier';
  onClose: () => void;
  onSuccess?: () => void;
}

export function TransferCODModal({ userId, selectedRemittanceIds, type = 'seller', onClose, onSuccess }: Props) {
  const [remittance, setRemittance] = useState<any>(null);
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [holdAmount, setHoldAmount] = useState(0);
  const [creditLimit, setCreditLimit] = useState(0);
  const [utr, setUtr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [adjustMode, setAdjustMode] = useState<'full' | 'negative_only' | null>('full');
  const [bypassHold, setBypassHold] = useState(false);
  const { toast, showToast, closeToast } = useToast();

  const displayType = type === 'courier' ? 'Courier' : 'Seller';

  useEffect(() => { setAdjustMode('full'); }, [balance]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiClient.get(`/cod/getCODTransferData/${userId}`, {
          params: { selectedRemittanceIds },
        });
        const fetched = res.data?.data;
        setRemittance(Array.isArray(fetched) ? fetched[0] : fetched);
        setBankDetails(res.data.bankDetails || null);
        setBalance(Number(res.data.walletBalance ?? res.data.balance ?? 0));
        setHoldAmount(Number(res.data.holdAmount ?? res.data.holdamount ?? 0));
        setCreditLimit(Number(res.data.creditLimit ?? 0));
      } catch {
        showToast('error', 'Failed to load transfer data.');
      }
    };
    if (userId && selectedRemittanceIds.length) fetch();
  }, [userId, selectedRemittanceIds]);

  const remittanceEntries = useMemo(() => {
    if (!remittance?.remittanceData) return [];
    return remittance.remittanceData.map((r: any) => ({
      ...r,
      remittanceAmount: Number((Number(r.codAvailable || 0)).toFixed(2)),
    }));
  }, [remittance]);

  const holdResolved = useMemo(() => {
    if (bypassHold || !holdAmount || holdAmount <= 0) return { heldIds: [] as string[], heldAmount: 0 };
    const sorted = [...remittanceEntries].sort((a, b) => a.remittanceAmount - b.remittanceAmount);
    const single = sorted.find((r: any) => r.remittanceAmount >= holdAmount);
    if (single) return { heldIds: [String(single.remittanceId || single._id)], heldAmount: single.remittanceAmount };
    const sortedDesc = [...remittanceEntries].sort((a, b) => b.remittanceAmount - a.remittanceAmount);
    let total = 0; const chosen: any[] = [];
    for (const r of sortedDesc) { chosen.push(r); total += r.remittanceAmount; if (total >= holdAmount) break; }
    return { heldIds: chosen.map((c: any) => String(c.remittanceId || c._id)), heldAmount: total };
  }, [holdAmount, remittanceEntries, bypassHold]);

  const walletTopUp = useMemo(() => {
    const needed = balance < 0 ? Math.abs(balance) : 0;
    if (needed <= 0) return { needed: 0, topUpIds: [] as string[], topUpAmount: 0 };
    const available = remittanceEntries.filter((r: any) => !holdResolved.heldIds.includes(String(r.remittanceId || r._id)));
    const sorted = [...available].sort((a, b) => a.remittanceAmount - b.remittanceAmount);
    const single = sorted.find((r: any) => r.remittanceAmount >= needed);
    if (single) return { needed, topUpIds: [String(single.remittanceId || single._id)], topUpAmount: single.remittanceAmount };
    let sum = 0; const chosen: any[] = [];
    for (const r of sorted) { chosen.push(r); sum += r.remittanceAmount; if (sum >= needed) break; }
    return { needed, topUpIds: chosen.map((s: any) => String(s.remittanceId || s._id)), topUpAmount: sum };
  }, [balance, remittanceEntries, holdResolved]);

  const walletNegativeOnly = useMemo(() => {
    if (balance >= 0) return { needed: 0, sourceId: null as string | null };
    const needed = Math.abs(balance);
    const available = remittanceEntries.filter((r: any) => !holdResolved.heldIds.includes(String(r.remittanceId || r._id)));
    const sorted = [...available].sort((a, b) => a.remittanceAmount - b.remittanceAmount);
    const source = sorted.find((r: any) => r.remittanceAmount >= needed) || sorted[sorted.length - 1];
    return { needed, sourceId: source ? String(source.remittanceId || source._id) : null };
  }, [balance, remittanceEntries, holdResolved]);

  const frozenIds = useMemo(() => adjustMode === null ? [...walletTopUp.topUpIds] : [], [adjustMode, walletTopUp]);

  const payableInfo = useMemo(() => {
    const heldSet = new Set(holdResolved.heldIds.map(String));
    const frozenSet = new Set(frozenIds.map(String));
    const topUpSet = new Set(walletTopUp.topUpIds.map(String));
    const payable = remittanceEntries.filter((r: any) => {
      const id = String(r.remittanceId || r._id);
      if (heldSet.has(id)) return false;
      if (frozenSet.has(id)) return false;
      if (adjustMode === 'full' && topUpSet.has(id)) return false;
      return true;
    });
    const total = payable.reduce((sum: number, r: any) => {
      const idStr = String(r.remittanceId || r._id);
      if (adjustMode === 'negative_only' && idStr === walletNegativeOnly.sourceId)
        return sum + Math.max(0, (r.remittanceAmount || 0) - walletNegativeOnly.needed);
      return sum + (r.remittanceAmount || 0);
    }, 0);
    return { payable, payableIds: payable.map((p: any) => String(p.remittanceId || p._id)), payableTotal: Number(total.toFixed(2)) };
  }, [remittanceEntries, holdResolved, walletTopUp, frozenIds, adjustMode, walletNegativeOnly]);

  const handleSubmit = async () => {
    if (payableInfo.payableTotal > 0 && !utr.trim()) { showToast('error', 'Please enter UTR'); return; }
    setSubmitting(true);
    try {
      const payload = {
        utr: utr || null,
        selectedRemittanceIds: remittanceEntries.map((r: any) => String(r.remittanceId || r._id)),
        payableRemittanceIds: payableInfo.payableIds,
        topUpRemittanceIds: adjustMode === 'full' ? walletTopUp.topUpIds : [],
        frozenRemittanceIds: frozenIds,
        negativeOnlyAdjust: adjustMode === 'negative_only' && walletNegativeOnly.sourceId
          ? { remittanceId: walletNegativeOnly.sourceId, amount: walletNegativeOnly.needed }
          : null,
      };
      const res = await apiClient.post(`/cod/transferCOD/${userId}`, payload);
      showToast('success', res.data?.message || 'COD transfer done');
      setTimeout(() => { onClose(); onSuccess?.(); }, 1200);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to transfer COD');
    } finally { setSubmitting(false); }
  };

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[300] p-0 sm:p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="bg-white sm:rounded-[24px] border border-[#E2E8F0] shadow-2xl w-full max-w-6xl relative overflow-y-auto max-h-full sm:max-h-[90vh]"
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}>

          <Toast toast={toast} onClose={closeToast} />

          <button onClick={onClose} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-400 hover:text-gray-700 text-xl font-bold z-10 transition-colors">✕</button>

          {/* Header */}
          <div className="p-5 sm:p-8 border-b border-[#E2E8F0] bg-gradient-to-r from-[#F8FAFC] to-white relative">
            <h1 className="text-[18px] sm:text-[24px] font-bold text-[#0F172A] mb-2 flex items-center gap-2 sm:gap-3 pr-8">
              {displayType === 'Courier' ? <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#00A86B] shrink-0" /> : <UserCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#00A86B] shrink-0" />}
              Transfer COD to {displayType}
            </h1>
            <p className="text-[#64748B] text-[12px] sm:text-[14px]">Review the details and provide the UTR number to initiate the COD transfer request</p>
          </div>

          {!remittance ? (
            <div className="p-5 sm:p-8 space-y-4 animate-pulse">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-20 sm:h-24 bg-[#F1F5F9] rounded-2xl" />)}
              </div>
              <div className="h-48 bg-[#F1F5F9] rounded-2xl" />
              <div className="h-64 bg-[#F1F5F9] rounded-2xl" />
            </div>
          ) : (
            <div className="p-4 sm:p-8">
              {/* Wallet Stats — dynamic colors based on positive/negative values */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-5 sm:mb-8">
                <div className={`bg-white rounded-2xl p-3 sm:p-5 border shadow-sm flex items-center gap-2.5 sm:gap-4 ${balance >= 0 ? 'border-[#BBF7D0]' : 'border-[#FECACA]'}`}>
                  <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${balance >= 0 ? 'bg-[#ECFDF5]' : 'bg-[#FEF2F2]'}`}>
                    <Wallet className={`w-4.5 h-4.5 sm:w-6 sm:h-6 ${balance >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-[13px] font-medium text-[#64748B] mb-0.5 truncate">Wallet Balance</p>
                    <p className={`text-[14px] sm:text-[18px] font-bold truncate ${balance >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>{fmt(balance)}</p>
                  </div>
                </div>
                <div className={`bg-white rounded-2xl p-3 sm:p-5 border shadow-sm flex items-center gap-2.5 sm:gap-4 ${holdAmount <= 0 ? 'border-[#BBF7D0]' : 'border-[#FECACA]'}`}>
                  <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${holdAmount <= 0 ? 'bg-[#ECFDF5]' : 'bg-[#FEF2F2]'}`}>
                    <Lock className={`w-4.5 h-4.5 sm:w-6 sm:h-6 ${holdAmount <= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-[13px] font-medium text-[#64748B] mb-0.5 truncate">Hold Amount</p>
                    <p className={`text-[14px] sm:text-[18px] font-bold truncate ${holdAmount > 0 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>{fmt(holdAmount)}</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-3 sm:p-5 border border-[#E2E8F0] shadow-sm flex items-center gap-2.5 sm:gap-4">
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-[#F5F3FF] flex items-center justify-center shrink-0">
                    <Scale className="w-4.5 h-4.5 sm:w-6 sm:h-6 text-[#8B5CF6]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-[13px] font-medium text-[#64748B] mb-0.5 truncate">Credit Limit</p>
                    <p className="text-[14px] sm:text-[18px] font-bold text-[#8B5CF6] truncate">{fmt(creditLimit)}</p>
                  </div>
                </div>
                <div className={`bg-white rounded-2xl p-3 sm:p-5 border shadow-sm flex items-center gap-2.5 sm:gap-4 ${(balance - holdAmount) >= 0 ? 'border-[#BBF7D0]' : 'border-[#FECACA]'}`}>
                  <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${(balance - holdAmount) >= 0 ? 'bg-[#ECFDF5]' : 'bg-[#FEF2F2]'}`}>
                    <Banknote className={`w-4.5 h-4.5 sm:w-6 sm:h-6 ${(balance - holdAmount) >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-[13px] font-medium text-[#64748B] mb-0.5 truncate">Usable Balance</p>
                    <p className={`text-[14px] sm:text-[18px] font-bold truncate ${(balance - holdAmount) >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>{fmt(balance - holdAmount)}</p>
                  </div>
                </div>
              </div>

              {/* Bypass Hold — shown when user has a hold amount */}
              {holdAmount > 0 && (
                <div className="mb-5 sm:mb-6 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="text-[12px] sm:text-[13px] text-amber-700 font-semibold">
                    ⚠️ This user has a Hold Amount of {fmt(holdAmount)}. Some or all remittances are currently held.
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-xl border border-amber-200 shadow-sm hover:bg-amber-50 transition shrink-0">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-[#00A86B] cursor-pointer"
                      checked={bypassHold}
                      onChange={(e) => setBypassHold(e.target.checked)}
                    />
                    <span className="text-[12px] sm:text-[13px] font-semibold text-[#0F172A] select-none">Bypass Hold &amp; Pay Client</span>
                  </label>
                </div>
              )}

              {/* Negative wallet adjustment — shown when wallet balance is negative */}
              {balance < 0 && (
                <div className="mb-5 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-2xl">
                  <div className="text-[13px] sm:text-[14px] font-bold text-red-600 mb-1">Wallet is negative: {fmt(balance)}</div>
                  <div className="text-[12px] sm:text-[13px] font-semibold text-[#0F172A] mb-2">Top-up Required:</div>
                  <input
                    readOnly
                    value={fmt(walletTopUp.topUpAmount)}
                    className="w-full px-3 py-2 text-[12px] sm:text-[13px] bg-white border border-red-200 rounded-xl mb-2 font-bold text-slate-800"
                  />
                  <div className="text-[10px] sm:text-[11px] text-[#64748B] mb-3 break-words">
                    Top-up Candidate Remittance(s): {walletTopUp.topUpIds.join(', ') || '—'}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-[#00A86B] mt-0.5 shrink-0"
                        checked={adjustMode === 'full'}
                        onChange={() => setAdjustMode(adjustMode === 'full' ? null : 'full')}
                      />
                      <span className="text-[12px] sm:text-[13px] font-semibold text-[#0F172A]">
                        Adjust full remittance amount into wallet ({fmt(walletTopUp.topUpAmount)})
                      </span>
                    </label>
                    <label className={`flex items-start gap-2 ${!walletNegativeOnly.sourceId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-[#00A86B] mt-0.5 shrink-0"
                        checked={adjustMode === 'negative_only'}
                        onChange={() => setAdjustMode(adjustMode === 'negative_only' ? null : 'negative_only')}
                        disabled={!walletNegativeOnly.sourceId}
                      />
                      <span className="text-[12px] sm:text-[13px] font-semibold text-[#0F172A]">
                        Adjust only negative balance ({fmt(walletNegativeOnly.needed)})
                      </span>
                    </label>
                  </div>
                  {adjustMode === null && (
                    <div className="mt-2 text-[11px] sm:text-[12px] text-purple-600 font-medium">
                      These remittances will be Frozen (not paid + not adjusted)
                    </div>
                  )}
                  {adjustMode === 'negative_only' && walletNegativeOnly.sourceId && (
                    <div className="mt-2 text-[11px] sm:text-[12px] text-blue-600 font-medium break-words">
                      {fmt(walletNegativeOnly.needed)} will be deducted from Remittance ID: {walletNegativeOnly.sourceId}
                    </div>
                  )}
                </div>
              )}

              {/* Bank Details & Remittance Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 mb-6 sm:mb-10">

                {/* Bank Details */}
                <div className="lg:col-span-2">
                  <h3 className="text-[13px] sm:text-[15px] font-bold text-[#0F172A] mb-3 sm:mb-4 flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-[#64748B]" />
                    {displayType === 'Courier' ? 'Courier Bank Details' : 'Seller Bank Details'}
                  </h3>
                  <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4 sm:p-6 grid grid-cols-2 md:grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-4 sm:gap-y-6">
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-[12px] font-semibold text-[#1E293B] uppercase tracking-wider mb-1">{displayType === 'Courier' ? 'Company Name' : 'Account Holder'}</p>
                      <p className="text-[12px] sm:text-[14px] font-bold text-[#64748B] truncate">{bankDetails?.nameAtBank || '—'}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-[12px] font-semibold text-[#1E293B] uppercase tracking-wider mb-1">Account Number</p>
                      <p className="text-[12px] sm:text-[14px] font-bold text-[#64748B] tracking-wider truncate">{bankDetails?.accountNumber || '—'}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-[12px] font-semibold text-[#1E293B] uppercase tracking-wider mb-1">Bank Name</p>
                      <p className="text-[12px] sm:text-[14px] font-bold text-[#64748B] truncate">{bankDetails?.bank || '—'}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-[12px] font-semibold text-[#1E293B] uppercase tracking-wider mb-1">IFSC Code</p>
                      <p className="text-[12px] sm:text-[14px] font-bold text-[#64748B] truncate">{bankDetails?.ifsc || '—'}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-[12px] font-semibold text-[#1E293B] uppercase tracking-wider mb-1">Branch</p>
                      <p className="text-[12px] sm:text-[14px] font-bold text-[#64748B] truncate">{bankDetails?.branch || '—'}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-[12px] font-semibold text-[#1E293B] uppercase tracking-wider mb-1">City</p>
                      <p className="text-[12px] sm:text-[14px] font-bold text-[#64748B] truncate">{bankDetails?.city || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Remittance Summary */}
                <div className="lg:col-span-1">
                  <h3 className="text-[13px] sm:text-[15px] font-bold text-[#0F172A] mb-3 sm:mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#64748B]" />
                    Remittance Summary
                  </h3>
                  <div className="bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] p-4 sm:p-6 lg:h-[calc(100%-2rem)] flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-4 sm:mb-6 gap-2">
                      <span className="text-[12px] sm:text-[14px] font-medium text-[#64748B]">Initiated Amount</span>
                      <span className="text-[13px] sm:text-[15px] font-bold text-[#0F172A]">{fmt(remittance?.RemittanceInitiated || 0)}</span>
                    </div>
                    <div className="h-px bg-[#E2E8F0] w-full mb-4 sm:mb-6" />
                    <div className="flex justify-between items-center bg-white p-3 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-sm gap-2">
                      <span className="text-[12px] sm:text-[14px] font-bold text-[#0F172A]">COD To Be Remitted</span>
                      <span className="text-[15px] sm:text-[18px] font-extrabold text-[#00A86B]">{fmt(remittance?.CODToBeRemitted || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Remittance Records */}
              <div className="mb-6 sm:mb-10">
                <h3 className="text-[13px] sm:text-[15px] font-bold text-[#0F172A] mb-3 sm:mb-4 flex items-center gap-2">
                  <Archive className="w-4 h-4 text-[#64748B]" />
                  Remittance Records
                </h3>

                {/* Desktop table */}
                <div className="hidden sm:block border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead>
                        <tr className="bg-[#E6F9F2] text-[11px] font-bold text-[#475569] uppercase tracking-wider border-b border-[#E2E8F0]">
                          <th className="py-4 px-5 whitespace-nowrap">Remittance ID</th>
                          <th className="py-4 px-5 whitespace-nowrap">Total COD Amount</th>
                          <th className="py-4 px-5 whitespace-nowrap">Credited to Wallet</th>
                          <th className="py-4 px-5 whitespace-nowrap">Early COD Charges</th>
                          <th className="py-4 px-5 whitespace-nowrap">Remittance Amount</th>
                          <th className="py-4 px-5 whitespace-nowrap">Status</th>
                          <th className="py-4 px-5 whitespace-nowrap text-right">Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0] bg-white">
                        {remittanceEntries.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-10 text-center text-[13px] text-[#94A3B8]">No remittance records found</td>
                          </tr>
                        ) : remittanceEntries.map((row: any) => {
                          const idStr = String(row.remittanceId || row._id);
                          const isHeld = holdResolved.heldIds.includes(idStr);
                          const isTopUp = walletTopUp.topUpIds.includes(idStr);
                          const isFrozen = frozenIds.includes(idStr);

                          let noteEl: React.ReactNode;
                          if (isHeld) {
                            noteEl = <span className="inline-block px-3 py-1 rounded-lg text-[11px] font-bold text-red-600 bg-red-50 border border-red-200">Held</span>;
                          } else if (isFrozen) {
                            noteEl = <span className="inline-block px-3 py-1 rounded-lg text-[11px] font-bold text-purple-600 bg-purple-50 border border-purple-200">Frozen</span>;
                          } else if (isTopUp && adjustMode === 'full') {
                            noteEl = <span className="inline-block px-3 py-1 rounded-lg text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-200">TopUp</span>;
                          } else if (adjustMode === 'negative_only' && idStr === walletNegativeOnly.sourceId) {
                            noteEl = <span className="inline-block px-3 py-1 rounded-lg text-[11px] font-bold text-orange-500 bg-orange-50 border border-orange-200">Partial TopUp ({fmt(walletNegativeOnly.needed)})</span>;
                          } else {
                            noteEl = <span className="inline-block px-3 py-1 rounded-lg text-[11px] font-bold text-[#00A86B] bg-[#F0FDF4] border border-[#BBF7D0]">Payable</span>;
                          }

                          return (
                            <tr key={idStr} className="text-[13px] text-[#0F172A] hover:bg-[#F8FAFC] transition-colors">
                              <td className="py-4 px-5 font-bold text-[#00A86B]">{row.remittanceId}</td>
                              <td className="py-4 px-5 font-medium">{fmt(Number(row.codAvailable || 0) + Number(row.amountCreditedToWallet || 0) + Number(row.earlyCodCharges || 0))}</td>
                              <td className="py-4 px-5 font-medium">{fmt(Number(row.amountCreditedToWallet || 0))}</td>
                              <td className="py-4 px-5 font-medium">{fmt(Number(row.earlyCodCharges || 0))}</td>
                              <td className="py-4 px-5 font-bold text-[#00A86B]">{fmt(row.remittanceAmount)}</td>
                              <td className="py-4 px-5">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold text-[#F59E0B] border border-[#F59E0B]/30 bg-[#FFFBEB]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] mr-1.5"></span>
                                  {row.status || 'Pending'}
                                </span>
                              </td>
                              <td className="py-4 px-5 text-right">{noteEl}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile card list */}
                <div className="sm:hidden space-y-3">
                  {remittanceEntries.length === 0 ? (
                    <div className="py-10 text-center text-[13px] text-[#94A3B8] bg-white border border-[#E2E8F0] rounded-2xl">No remittance records found</div>
                  ) : remittanceEntries.map((row: any) => {
                    const idStr = String(row.remittanceId || row._id);
                    const isHeld = holdResolved.heldIds.includes(idStr);
                    const isTopUp = walletTopUp.topUpIds.includes(idStr);
                    const isFrozen = frozenIds.includes(idStr);

                    let noteEl: React.ReactNode;
                    if (isHeld) {
                      noteEl = <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold text-red-600 bg-red-50 border border-red-200">Held</span>;
                    } else if (isFrozen) {
                      noteEl = <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-200">Frozen</span>;
                    } else if (isTopUp && adjustMode === 'full') {
                      noteEl = <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200">TopUp</span>;
                    } else if (adjustMode === 'negative_only' && idStr === walletNegativeOnly.sourceId) {
                      noteEl = <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold text-orange-500 bg-orange-50 border border-orange-200">Partial TopUp ({fmt(walletNegativeOnly.needed)})</span>;
                    } else {
                      noteEl = <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold text-[#00A86B] bg-[#F0FDF4] border border-[#BBF7D0]">Payable</span>;
                    }

                    return (
                      <div key={idStr} className="bg-white border border-[#E2E8F0] rounded-2xl p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-2 gap-2">
                          <span className="text-[12px] font-bold text-[#00A86B] truncate">{row.remittanceId}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-[#F59E0B] border border-[#F59E0B]/30 bg-[#FFFBEB] shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] mr-1"></span>
                            {row.status || 'Pending'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 bg-[#F8FAFC] rounded-xl px-3 py-2.5 mb-2">
                          <div>
                            <div className="text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wide">Total COD</div>
                            <div className="text-[12px] font-normal text-[#0F172A] mt-0.5">{fmt(Number(row.codAvailable || 0) + Number(row.amountCreditedToWallet || 0) + Number(row.earlyCodCharges || 0))}</div>
                          </div>
                          <div>
                            <div className="text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wide">Credited to Wallet</div>
                            <div className="text-[12px] font-normal text-[#0F172A] mt-0.5">{fmt(Number(row.amountCreditedToWallet || 0))}</div>
                          </div>
                          <div>
                            <div className="text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wide">Early COD</div>
                            <div className="text-[12px] font-normal text-[#0F172A] mt-0.5">{fmt(Number(row.earlyCodCharges || 0))}</div>
                          </div>
                          <div>
                            <div className="text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wide">Remittance Amt</div>
                            <div className="text-[12px] font-bold text-[#00A86B] mt-0.5">{fmt(row.remittanceAmount)}</div>
                          </div>
                        </div>
                        <div className="flex justify-end">{noteEl}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Action Bar */}
              <div className="bg-[#0F172A] rounded-2xl p-4 sm:p-6 md:p-8 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 sm:gap-6 shadow-lg">
                <div className="flex items-center gap-3 sm:gap-4 text-white">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Banknote className="w-5 h-5 sm:w-6 sm:h-6 text-[#00A86B]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] sm:text-[14px] font-medium text-[#94A3B8]">Amount payable to {displayType.toLowerCase()}</p>
                    <p className="text-[18px] sm:text-[24px] font-extrabold text-white truncate">{fmt(payableInfo.payableTotal)}</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 sm:gap-4 w-full lg:w-auto">
                  {payableInfo.payableTotal > 0 && (
                    <div className="w-full md:w-auto">
                      <input
                        type="text"
                        placeholder="Enter 12-digit UTR Number"
                        value={utr}
                        onChange={(e) => setUtr(e.target.value)}
                        className="w-full md:w-72 h-11 sm:h-12 px-4 rounded-xl border border-white/20 bg-white/5 text-[13px] sm:text-[14px] text-white focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] placeholder:text-[#64748B] transition-all font-semibold"
                      />
                    </div>
                  )}
                  <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={onClose} className="flex-1 md:flex-none px-6 h-11 sm:h-12 bg-transparent border border-white/20 text-white hover:bg-white/10 text-[13px] sm:text-[14px] font-bold rounded-xl transition-colors font-sans">
                      Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={submitting} className="flex-1 md:flex-none px-6 sm:px-8 h-11 sm:h-12 bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] sm:text-[14px] font-bold rounded-xl transition-colors shadow-[0_4px_14px_0_rgba(0,168,107,0.39)] disabled:opacity-60 font-sans">
                      {submitting ? 'Submitting...' : 'Submit Transfer'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
