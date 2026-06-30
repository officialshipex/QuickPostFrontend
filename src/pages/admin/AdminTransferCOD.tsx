import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Wallet, Building2, UserCircle, FileText, Banknote, Scale, Archive, ArrowLeft } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export function AdminTransferCOD() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [utr, setUtr] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const type = searchParams.get('type') === 'courier' ? 'Courier' : 'Seller';
  const userId = searchParams.get('userId') || '';
  const selectedIds = (searchParams.get('ids') || '').split(',').filter(Boolean);

  // API data
  const [remittance, setRemittance] = useState<any>(null);
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [holdAmount, setHoldAmount] = useState(0);
  const [creditLimit, setCreditLimit] = useState(0);

  useEffect(() => {
    if (!userId || selectedIds.length === 0) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/cod/getCODTransferData/${userId}`, {
          params: { selectedRemittanceIds: selectedIds },
        });
        const fetched = res.data?.data;
        setRemittance(Array.isArray(fetched) ? fetched[0] : fetched);
        setBankDetails(res.data.bankDetails || null);
        setBalance(Number(res.data.walletBalance ?? res.data.balance ?? 0));
        setHoldAmount(Number(res.data.holdAmount ?? res.data.holdamount ?? 0));
        setCreditLimit(Number(res.data.creditLimit ?? 0));
      } catch {
        // stay on page, show empty state
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const remittanceEntries = useMemo(() => {
    if (!remittance?.remittanceData) return [];
    return remittance.remittanceData.map((r: any) => ({
      ...r,
      remittanceAmount: Number(r.codAvailable || 0),
    }));
  }, [remittance]);

  const payableTotal = useMemo(
    () => remittanceEntries.reduce((sum: number, r: any) => sum + r.remittanceAmount, 0),
    [remittanceEntries]
  );

  const handleSubmit = async () => {
    if (payableTotal > 0 && !utr.trim()) {
      alert('Please enter UTR number');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        utr: utr || null,
        selectedRemittanceIds: remittanceEntries.map((r: any) => String(r.remittanceId || r._id)),
        payableRemittanceIds: remittanceEntries.map((r: any) => String(r.remittanceId || r._id)),
        topUpRemittanceIds: [],
        frozenRemittanceIds: [],
        negativeOnlyAdjust: null,
      };
      await apiClient.post(`/cod/transferCOD/${userId}`, payload);
      navigate('/admin/cod');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to transfer COD');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto py-8">

        <button
          onClick={() => navigate('/admin/cod')}
          className="flex items-center gap-2 text-[#64748B] hover:text-[#0F172A] font-medium text-[14px] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to COD
        </button>

        <div className="bg-white rounded-[24px] border border-[#E2E8F0] shadow-sm overflow-hidden">

          {/* Header */}
          <div className="p-8 border-b border-[#E2E8F0] bg-gradient-to-r from-[#F8FAFC] to-white">
            <h1 className="text-[24px] font-bold text-[#0F172A] mb-2 flex items-center gap-3">
              {type === 'Courier' ? <Building2 className="w-6 h-6 text-[#00A86B]" /> : <UserCircle className="w-6 h-6 text-[#00A86B]" />}
              Transfer COD to {type}
            </h1>
            <p className="text-[#64748B] text-[14px]">Review the details and provide the UTR number to initiate the COD transfer request</p>
          </div>

          <div className="p-8">

            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="grid grid-cols-4 gap-6">
                  {[1,2,3,4].map(i => <div key={i} className="h-24 bg-[#F1F5F9] rounded-2xl" />)}
                </div>
                <div className="h-48 bg-[#F1F5F9] rounded-2xl" />
                <div className="h-64 bg-[#F1F5F9] rounded-2xl" />
              </div>
            ) : (
              <>
                {/* Wallet Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                  {[
                    { label: 'Wallet Balance', value: fmt(balance), icon: Wallet, color: 'text-[#3B82F6]', bg: 'bg-[#EFF6FF]' },
                    { label: 'Hold Amount', value: fmt(holdAmount), icon: Archive, color: 'text-[#F59E0B]', bg: 'bg-[#FFFBEB]' },
                    { label: 'Credit Limit', value: fmt(creditLimit), icon: Scale, color: 'text-[#8B5CF6]', bg: 'bg-[#F5F3FF]' },
                    { label: 'Usable Balance', value: fmt(balance - holdAmount), icon: Banknote, color: 'text-[#10B981]', bg: 'bg-[#ECFDF5]' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex items-center gap-4 hover:border-[#CBD5E1] transition-colors">
                      <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-[#64748B] mb-0.5">{stat.label}</p>
                        <p className="text-[18px] font-bold text-[#0F172A]">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bank Details & Remittance Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

                  {/* Bank Details */}
                  <div className="lg:col-span-2">
                    <h3 className="text-[15px] font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-[#64748B]" />
                      {type === 'Courier' ? 'Courier Bank Details' : 'Seller Bank Details'}
                    </h3>
                    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div>
                        <p className="text-[12px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">{type === 'Courier' ? 'Company Name' : 'Account Holder'}</p>
                        <p className="text-[14px] font-bold text-[#0F172A]">{bankDetails?.nameAtBank || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Account Number</p>
                        <p className="text-[14px] font-bold text-[#0F172A] tracking-wider">{bankDetails?.accountNumber || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Bank Name</p>
                        <p className="text-[14px] font-bold text-[#0F172A]">{bankDetails?.bank || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">IFSC Code</p>
                        <p className="text-[14px] font-bold text-[#0F172A]">{bankDetails?.ifsc || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Branch</p>
                        <p className="text-[14px] font-bold text-[#0F172A]">{bankDetails?.branch || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">City</p>
                        <p className="text-[14px] font-bold text-[#0F172A]">{bankDetails?.city || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Remittance Summary */}
                  <div className="lg:col-span-1">
                    <h3 className="text-[15px] font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#64748B]" />
                      Remittance Summary
                    </h3>
                    <div className="bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] p-6 h-[calc(100%-2rem)] flex flex-col justify-center">
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-[14px] font-medium text-[#64748B]">Initiated Amount</span>
                        <span className="text-[15px] font-bold text-[#0F172A]">{fmt(remittance?.RemittanceInitiated || 0)}</span>
                      </div>
                      <div className="h-px bg-[#E2E8F0] w-full mb-6" />
                      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
                        <span className="text-[14px] font-bold text-[#0F172A]">COD To Be Remitted</span>
                        <span className="text-[18px] font-extrabold text-[#00A86B]">{fmt(remittance?.CODToBeRemitted || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Remittance Records Table */}
                <div className="mb-10">
                  <h3 className="text-[15px] font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                    <Archive className="w-4 h-4 text-[#64748B]" />
                    Remittance Records
                  </h3>
                  <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto no-scrollbar">
                      <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                          <tr className="bg-[#F8FAFC] text-[11px] font-bold text-[#475569] uppercase tracking-wider border-b border-[#E2E8F0]">
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
                          ) : remittanceEntries.map((row: any) => (
                            <tr key={row.remittanceId || row._id} className="text-[13px] text-[#0F172A] hover:bg-[#F8FAFC] transition-colors">
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
                              <td className="py-4 px-5 text-right">
                                <span className="inline-block px-3 py-1 rounded-lg text-[11px] font-bold text-[#00A86B] bg-[#F0FDF4] border border-[#BBF7D0]">Payable</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Submit Action Bar */}
                <div className="bg-[#0F172A] rounded-2xl p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-lg">
                  <div className="flex items-center gap-4 text-white">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                      <Banknote className="w-6 h-6 text-[#00A86B]" />
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-[#94A3B8]">Amount payable to {type.toLowerCase()}</p>
                      <p className="text-[24px] font-extrabold text-white">{fmt(payableTotal)}</p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
                    {payableTotal > 0 && (
                      <div className="w-full md:w-auto">
                        <input
                          type="text"
                          placeholder="Enter 12-digit UTR Number"
                          value={utr}
                          onChange={(e) => setUtr(e.target.value)}
                          className="w-full md:w-72 h-12 px-4 rounded-xl border border-white/20 bg-white/5 text-[14px] text-white focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] placeholder:text-[#64748B] transition-all"
                        />
                      </div>
                    )}
                    <div className="flex gap-3 w-full md:w-auto">
                      <button onClick={() => navigate('/admin/cod')} className="flex-1 md:flex-none px-6 h-12 bg-transparent border border-white/20 text-white hover:bg-white/10 text-[14px] font-bold rounded-xl transition-colors">
                        Cancel
                      </button>
                      <button onClick={handleSubmit} disabled={submitting} className="flex-1 md:flex-none px-8 h-12 bg-[#00A86B] hover:bg-[#009B63] text-white text-[14px] font-bold rounded-xl transition-colors shadow-[0_4px_14px_0_rgba(0,168,107,0.39)] disabled:opacity-60">
                        {submitting ? 'Submitting...' : 'Submit Transfer'}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
