import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Download, Search, Eye, IndianRupee, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';

const TABS = ['Wallet & Billing', 'COD Settlements', 'Invoices', 'Passbook'];

const TRANSACTIONS = [
  { id: 'TXN001', date: '12 Jun 2026', type: 'Shipping Charge', description: 'Order QP100245 - Delhivery', amount: '-₹85.00', credit: false },
  { id: 'TXN002', date: '12 Jun 2026', type: 'Wallet Recharge', description: 'Razorpay recharge', amount: '+₹5,000.00', credit: true },
  { id: 'TXN003', date: '11 Jun 2026', type: 'Shipping Charge', description: 'Order QP100246 - Bluedart', amount: '-₹125.00', credit: false },
  { id: 'TXN004', date: '11 Jun 2026', type: 'COD Remittance', description: 'Settlement batch #4521', amount: '+₹12,450.00', credit: true },
  { id: 'TXN005', date: '10 Jun 2026', type: 'Weight Charge', description: 'Weight discrepancy adjustment', amount: '-₹45.50', credit: false },
  { id: 'TXN006', date: '09 Jun 2026', type: 'Shipping Charge', description: 'Order QP100249 - Delhivery', amount: '-₹95.00', credit: false },
  { id: 'TXN007', date: '08 Jun 2026', type: 'COD Remittance', description: 'Settlement batch #4498', amount: '+₹8,900.00', credit: true },
  { id: 'TXN008', date: '07 Jun 2026', type: 'Wallet Recharge', description: 'Net banking recharge', amount: '+₹10,000.00', credit: true },
];

const COD_SETTLEMENTS = [
  { batch: '#4521', settleDate: '11 Jun 2026', orders: 48, gross: '₹42,580', tds: '₹852', net: '₹41,728', status: 'Settled' },
  { batch: '#4498', settleDate: '08 Jun 2026', orders: 37, gross: '₹31,200', tds: '₹624', net: '₹30,576', status: 'Settled' },
  { batch: '#4467', settleDate: '05 Jun 2026', orders: 52, gross: '₹48,900', tds: '₹978', net: '₹47,922', status: 'Settled' },
  { batch: '#4432', settleDate: '02 Jun 2026', orders: 29, gross: '₹24,600', tds: '₹492', net: '₹24,108', status: 'Settled' },
  { batch: '#4551', settleDate: '15 Jun 2026', orders: 61, gross: '₹56,300', tds: '₹1,126', net: '₹55,174', status: 'Processing' },
];

const INVOICES = [
  { id: 'INV-2026-062', period: 'Jun 1–12 2026', amount: '₹4,280', gst: '₹770', total: '₹5,050', status: 'Paid', date: '12 Jun 2026' },
  { id: 'INV-2026-052', period: 'May 2026', amount: '₹18,540', gst: '₹3,337', total: '₹21,877', status: 'Paid', date: '01 Jun 2026' },
  { id: 'INV-2026-042', period: 'Apr 2026', amount: '₹16,200', gst: '₹2,916', total: '₹19,116', status: 'Paid', date: '01 May 2026' },
  { id: 'INV-2026-032', period: 'Mar 2026', amount: '₹21,000', gst: '₹3,780', total: '₹24,780', status: 'Paid', date: '01 Apr 2026' },
];

export function Billing() {
  const [activeTab, setActiveTab] = useState('Wallet & Billing');
  const [search, setSearch] = useState('');

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Billing & Payments</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Manage your wallet, COD settlements, and invoices</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 h-10 rounded-full border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC]">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Wallet Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Wallet Balance', value: '₹7,12,24.82', sub: 'Available', icon: IndianRupee, color: 'text-[#00A86B]', bg: 'from-[#00A86B] to-[#007BFF]', gradient: true },
          { label: 'Total COD Pending', value: '₹56,300', sub: 'Next settlement: 15 Jun', icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50', gradient: false },
          { label: 'This Month Charges', value: '₹4,280', sub: 'Shipping + Weight', icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50', gradient: false },
          { label: 'Total Settled', value: '₹1,44,426', sub: 'All time COD', icon: IndianRupee, color: 'text-blue-500', bg: 'bg-blue-50', gradient: false },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl p-5 border border-[#E2E8F0] shadow-sm ${s.gradient ? `bg-gradient-to-r ${s.bg} text-white` : 'bg-white'}`}>
            <div className={`text-xs font-medium mb-1 ${s.gradient ? 'text-white/80' : 'text-[#64748B]'}`}>{s.label}</div>
            <div className={`text-2xl font-bold mb-1 ${s.gradient ? 'text-white' : 'text-[#0F172A]'}`}>{s.value}</div>
            <div className={`text-[10px] font-medium ${s.gradient ? 'text-white/70' : 'text-[#94A3B8]'}`}>{s.sub}</div>
            {s.gradient && (
              <button className="mt-3 px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-full transition-colors">+ Recharge</button>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-[#E2E8F0] px-4 flex overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-3.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${activeTab === tab ? 'border-[#00A86B] text-[#00A86B]' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'}`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Wallet & Billing' && (
          <>
            <div className="p-4 border-b border-[#E2E8F0] flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full px-3 h-9 flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                <input type="text" placeholder="Search transactions..." value={search} onChange={e => setSearch(e.target.value)}
                  className="bg-transparent text-xs text-[#0F172A] outline-none placeholder:text-[#94A3B8] w-full" />
              </div>
              <div className="flex items-center gap-1.5 px-3 h-9 rounded-full border border-[#E2E8F0] text-xs font-semibold text-[#475569] cursor-pointer hover:bg-[#F8FAFC]">
                <span>All Types</span><ChevronDown className="w-3 h-3" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead><tr className="bg-[#F8FAFC] text-xs font-semibold text-[#475569] border-b border-[#E2E8F0]">
                  <th className="p-4">Transaction ID</th><th className="p-4">Date</th><th className="p-4">Type</th><th className="p-4">Description</th><th className="p-4 text-right">Amount</th>
                </tr></thead>
                <tbody>
                  {TRANSACTIONS.filter(t => !search || t.description.toLowerCase().includes(search.toLowerCase()) || t.type.toLowerCase().includes(search.toLowerCase())).map(t => (
                    <tr key={t.id} className="border-t border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs">
                      <td className="p-4 font-mono font-bold text-[#475569]">{t.id}</td>
                      <td className="p-4 table-date">{t.date}</td>
                      <td className="p-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${t.credit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t.type}</span></td>
                      <td className="p-4 text-[#0F172A]">{t.description}</td>
                      <td className={`p-4 text-right font-bold ${t.credit ? 'text-green-600' : 'text-red-600'}`}>{t.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'COD Settlements' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead><tr className="bg-[#F8FAFC] text-xs font-semibold text-[#475569] border-b border-[#E2E8F0]">
                <th className="p-4">Batch</th><th className="p-4">Settlement Date</th><th className="p-4 text-center">Orders</th><th className="p-4 text-right">Gross Amount</th><th className="p-4 text-right">TDS</th><th className="p-4 text-right">Net Amount</th><th className="p-4">Status</th><th className="p-4">Actions</th>
              </tr></thead>
              <tbody>
                {COD_SETTLEMENTS.map(s => (
                  <tr key={s.batch} className="border-t border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs">
                    <td className="p-4 font-bold text-[#00A86B]">{s.batch}</td>
                    <td className="p-4 table-date">{s.settleDate}</td>
                    <td className="p-4 text-center font-medium">{s.orders}</td>
                    <td className="p-4 text-right font-medium text-[#0F172A]">{s.gross}</td>
                    <td className="p-4 text-right text-red-600 font-medium">-{s.tds}</td>
                    <td className="p-4 text-right font-bold text-green-600">{s.net}</td>
                    <td className="p-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.status === 'Settled' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{s.status}</span></td>
                    <td className="p-4"><button className="w-7 h-7 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#00A86B]"><Download className="w-3.5 h-3.5" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Invoices' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead><tr className="bg-[#F8FAFC] text-xs font-semibold text-[#475569] border-b border-[#E2E8F0]">
                <th className="p-4">Invoice ID</th><th className="p-4">Billing Period</th><th className="p-4 text-right">Charges</th><th className="p-4 text-right">GST (18%)</th><th className="p-4 text-right">Total</th><th className="p-4">Date</th><th className="p-4">Status</th><th className="p-4">Download</th>
              </tr></thead>
              <tbody>
                {INVOICES.map(inv => (
                  <tr key={inv.id} className="border-t border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs">
                    <td className="p-4 font-bold text-[#00A86B]">{inv.id}</td>
                    <td className="p-4 table-date">{inv.period}</td>
                    <td className="p-4 text-right">{inv.amount}</td>
                    <td className="p-4 text-right text-orange-600">{inv.gst}</td>
                    <td className="p-4 text-right font-bold text-[#0F172A]">{inv.total}</td>
                    <td className="p-4 table-date">{inv.date}</td>
                    <td className="p-4"><span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">{inv.status}</span></td>
                    <td className="p-4"><button className="w-7 h-7 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#00A86B]"><Download className="w-3.5 h-3.5" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Passbook' && (
          <div className="p-8 text-center text-sm text-[#64748B]">
            <IndianRupee className="w-12 h-12 mx-auto text-[#E2E8F0] mb-3" />
            <p className="font-semibold text-[#0F172A] text-base">Wallet Passbook</p>
            <p className="mt-1 text-[#64748B]">Complete ledger of all wallet credits and debits</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
