import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { IndianRupee, Plus, Download, ArrowUpRight, ArrowDownLeft, TrendingUp, ChevronRight, X } from 'lucide-react';

const TRANSACTIONS = [
  { id: 'WT001', date: '12 Jun 2026, 3:45 PM', type: 'credit', label: 'Recharge via Razorpay', amount: 5000, balance: 72124.82 },
  { id: 'WT002', date: '12 Jun 2026, 10:20 AM', type: 'debit', label: 'Shipping - DEL1234567890', amount: -85, balance: 67124.82 },
  { id: 'WT003', date: '11 Jun 2026, 6:00 PM', type: 'credit', label: 'COD Remittance #4521', amount: 41728, balance: 67209.82 },
  { id: 'WT004', date: '11 Jun 2026, 11:30 AM', type: 'debit', label: 'Shipping - BDT9876543210', amount: -125, balance: 25481.82 },
  { id: 'WT005', date: '10 Jun 2026, 4:00 PM', type: 'debit', label: 'Weight adjustment - XPB1122334455', amount: -45.5, balance: 25606.82 },
  { id: 'WT006', date: '09 Jun 2026, 2:15 PM', type: 'debit', label: 'Shipping - EKT3344556677', amount: -65, balance: 25652.32 },
  { id: 'WT007', date: '08 Jun 2026, 11:00 AM', type: 'credit', label: 'COD Remittance #4498', amount: 30576, balance: 25717.32 },
  { id: 'WT008', date: '07 Jun 2026, 9:30 AM', type: 'credit', label: 'Recharge via Net Banking', amount: 10000, balance: -4858.68 },
];

const RECHARGE_PRESETS = [500, 1000, 2000, 5000, 10000, 25000];

export function Wallet() {
  const [showRecharge, setShowRecharge] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');

  const totalCredits = TRANSACTIONS.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalDebits = TRANSACTIONS.filter(t => t.type === 'debit').reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Wallet</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Manage your shipping wallet balance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Wallet Card + Stats */}
        <div className="space-y-4">
          {/* Main Wallet Card */}
          <div className="bg-gradient-to-br from-[#00A86B] to-[#007BFF] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full"></div>
            <div className="absolute -right-4 -bottom-8 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="text-xs font-medium text-white/70 mb-1">Available Balance</div>
            <div className="text-4xl font-bold mb-1">₹7,12,24<span className="text-2xl">.82</span></div>
            <div className="text-xs text-white/70 mb-5">Last updated: Today, 3:45 PM</div>
            <button onClick={() => setShowRecharge(true)} className="flex items-center gap-2 px-4 py-2 bg-white text-[#00A86B] text-sm font-bold rounded-full hover:bg-white/90 transition-all shadow-sm">
              <Plus className="w-4 h-4" /> Recharge Wallet
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center"><ArrowDownLeft className="w-3.5 h-3.5 text-green-500" /></div>
                <span className="text-[10px] font-semibold text-[#64748B]">Total Credits</span>
              </div>
              <div className="text-lg font-bold text-green-600">+₹{totalCredits.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center"><ArrowUpRight className="w-3.5 h-3.5 text-red-500" /></div>
                <span className="text-[10px] font-semibold text-[#64748B]">Total Debits</span>
              </div>
              <div className="text-lg font-bold text-red-600">-₹{totalDebits.toFixed(2)}</div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            {[
              { label: 'Transaction History', sub: 'All wallet entries' },
              { label: 'GST Invoices', sub: 'Download invoices' },
              { label: 'COD Settlements', sub: 'View remittances' },
              { label: 'Recharge History', sub: 'Past recharges' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b border-[#E2E8F0] last:border-0 cursor-pointer hover:bg-[#F8FAFC] transition-colors">
                <div>
                  <div className="text-xs font-semibold text-[#0F172A]">{item.label}</div>
                  <div className="text-[10px] text-[#64748B]">{item.sub}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Transactions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#0F172A]">Transaction History</h3>
            <button className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#00A86B]"><Download className="w-3.5 h-3.5" /> Export</button>
          </div>
          <div className="divide-y divide-[#E2E8F0]">
            {TRANSACTIONS.map(t => (
              <div key={t.id} className="p-4 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${t.type === 'credit' ? 'bg-green-50' : 'bg-red-50'}`}>
                    {t.type === 'credit' ? <ArrowDownLeft className="w-4 h-4 text-green-500" /> : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#0F172A]">{t.label}</div>
                    <div className="table-date">{t.date}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${t.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'credit' ? '+' : ''}₹{Math.abs(t.amount).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[#94A3B8]">Bal: ₹{t.balance.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recharge Modal */}
      {showRecharge && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-[#0F172A]">Recharge Wallet</h3>
              <button onClick={() => setShowRecharge(false)} className="w-8 h-8 rounded-full hover:bg-[#F8FAFC] flex items-center justify-center text-[#64748B]"><X className="w-4 h-4" /></button>
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-[#475569] mb-2 block">Enter Amount (₹)</label>
              <div className="flex items-center gap-2 border border-[#E2E8F0] rounded-xl px-4 h-12 focus-within:border-[#00A86B]">
                <span className="text-lg font-bold text-[#64748B]">₹</span>
                <input type="number" value={rechargeAmount} onChange={e => setRechargeAmount(e.target.value)} placeholder="0.00"
                  className="flex-1 outline-none text-lg font-bold text-[#0F172A]" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-5">
              {RECHARGE_PRESETS.map(p => (
                <button key={p} onClick={() => setRechargeAmount(String(p))}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${rechargeAmount === String(p) ? 'bg-[#00A86B] text-white border-[#00A86B]' : 'border-[#E2E8F0] text-[#475569] hover:border-[#00A86B] hover:text-[#00A86B]'}`}>
                  ₹{p.toLocaleString()}
                </button>
              ))}
            </div>
            <button className="w-full h-11 rounded-full bg-[#00A86B] text-white font-bold hover:bg-[#009B63] transition-colors">
              Proceed to Pay {rechargeAmount ? `₹${Number(rechargeAmount).toLocaleString()}` : ''}
            </button>
            <p className="text-[10px] text-center text-[#94A3B8] mt-3">Secure payment via Razorpay · GST applicable</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
