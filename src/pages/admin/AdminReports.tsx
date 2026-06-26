import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { 
  ShoppingCart, 
  Package, 
  Wallet, 
  Scale, 
  Banknote, 
  Download, 
  RefreshCcw, 
  Trash2, 
  Mail, 
  Calendar, 
  ChevronDown, 
  Check, 
  X, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Filter,
  Send,
  ArrowRight,
  FileCheck,
  Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock options for filters
const SELLERS = ['All Sellers', 'SuperMart Pvt Ltd', 'Fashion Hub', 'ElectroWorld', 'Beauty Basics', 'Home Essentials'];
const COURIERS = ['All Couriers', 'Delhivery Surface', 'Ekart Surface', 'Shree Maruti', 'Bluedart', 'Shadowfax'];
const DATE_RANGES = ['Last 7 Days', 'Last 30 Days', 'Last 3 Months', 'Last 6 Months', 'This Year', 'Custom Range'];

interface GeneratedReport {
  id: string;
  name: string;
  type: 'Order' | 'Shipment' | 'Passbook' | 'Weight Dispute' | 'COD Remittance';
  format: 'CSV' | 'XLS' | 'PDF';
  date: string;
  size: string;
  fileName: string;
}

export function AdminReports() {
  // Config Form State
  const [activeReport, setActiveReport] = useState<'Order' | 'Shipment' | 'Passbook' | 'Weight Dispute' | 'COD Remittance' | null>(null);

  // Filter configurations
  const [selectedSeller, setSelectedSeller] = useState('All Sellers');
  const [selectedDateRange, setSelectedDateRange] = useState('Last 30 Days');
  const [selectedFormat, setSelectedFormat] = useState<'CSV' | 'XLS' | 'PDF'>('CSV');
  
  // Custom context filters
  const [orderStatus, setOrderStatus] = useState('All');
  const [shipmentStatus, setShipmentStatus] = useState('All');
  const [selectedCourier, setSelectedCourier] = useState('All Couriers');
  const [disputeStatus, setDisputeStatus] = useState('All');
  const [remittanceStatus, setRemittanceStatus] = useState('All');

  // Interactive Generation States
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  
  // Email Modal States
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailTargetReport, setEmailTargetReport] = useState<GeneratedReport | null>(null);
  const [targetEmail, setTargetEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  // Generated reports list
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([
    {
      id: 'REP-78201',
      name: 'Monthly Shipment Ledger - June',
      type: 'Shipment',
      format: 'CSV',
      date: '25 Jun 2026, 04:30 PM',
      size: '48.2 KB',
      fileName: 'shipment_report_june_2026.csv'
    },
    {
      id: 'REP-78199',
      name: 'Weight Disputes Resolution Log',
      type: 'Weight Dispute',
      format: 'CSV',
      date: '22 Jun 2026, 11:15 AM',
      size: '12.4 KB',
      fileName: 'weight_disputes_log.csv'
    },
    {
      id: 'REP-78195',
      name: 'Q2 Order Remittance Summary',
      type: 'COD Remittance',
      format: 'CSV',
      date: '18 Jun 2026, 02:45 PM',
      size: '95.1 KB',
      fileName: 'q2_cod_remittance_summary.csv'
    }
  ]);

  // Report configuration metadata helper
  const getReportDetails = (type: 'Order' | 'Shipment' | 'Passbook' | 'Weight Dispute' | 'COD Remittance' | null) => {
    if (!type) return null;
    switch (type) {
      case 'Order':
        return {
          title: 'Order Reports',
          desc: 'Analyze sales velocity, order payment options, and channel fulfillment logs.',
          icon: ShoppingCart,
          color: '#3B82F6',
          bg: 'bg-blue-50/70 border-blue-100',
        };
      case 'Shipment':
        return {
          title: 'Shipment Reports',
          desc: 'Monitor shipping zones distribution, carrier delivery metrics, and weight profiles.',
          icon: Package,
          color: '#10B981',
          bg: 'bg-emerald-50/70 border-emerald-100',
        };
      case 'Passbook':
        return {
          title: 'Passbook Reports',
          desc: 'Generate financial ledgers, wallet recharges, debit transactions, and COD collections.',
          icon: Wallet,
          color: '#8B5CF6',
          bg: 'bg-purple-50/70 border-purple-100',
        };
      case 'Weight Dispute':
        return {
          title: 'Weight Dispute Reports',
          desc: 'Review applied vs charged weight discrepancies, resolved amounts, and carrier audits.',
          icon: Scale,
          color: '#EF4444',
          bg: 'bg-rose-50/70 border-rose-100',
        };
      case 'COD Remittance':
        return {
          title: 'COD Remittance Reports',
          desc: 'Audit remittance batch timelines, bank settlement confirmations, and pending payouts.',
          icon: Banknote,
          color: '#F59E0B',
          bg: 'bg-amber-50/70 border-amber-100',
        };
    }
  };

  // Report Generation Simulator
  const handleGenerateReport = () => {
    if (!activeReport || isGenerating) return;
    setIsGenerating(true);
    setProgress(0);
    setProgressStatus('Connecting to database...');

    const statuses = [
      { p: 15, msg: 'Querying indexed records...' },
      { p: 40, msg: 'Filtering records based on selections...' },
      { p: 70, msg: 'Compiling report tables & summary metadata...' },
      { p: 90, msg: 'Structuring file encoding formats...' },
      { p: 100, msg: 'Report successfully generated!' }
    ];

    statuses.forEach((step) => {
      setTimeout(() => {
        setProgress(step.p);
        setProgressStatus(step.msg);

        if (step.p === 100) {
          setTimeout(() => {
            const timestamp = new Date();
            const dateStr = timestamp.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });
            const timeStr = timestamp.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit'
            });

            const uniqueId = `REP-${Math.floor(10000 + Math.random() * 90000)}`;
            const reportName = `${activeReport} Report - ${selectedSeller !== 'All Sellers' ? selectedSeller : 'All Sellers'}`;
            const fileExt = selectedFormat.toLowerCase();
            const sizeStr = `${(10 + Math.random() * 85).toFixed(1)} KB`;
            const cleanFileName = `${activeReport.toLowerCase().replace(' ', '_')}_report_${timestamp.toISOString().split('T')[0]}.${fileExt}`;

            const newReport: GeneratedReport = {
              id: uniqueId,
              name: reportName,
              type: activeReport,
              format: selectedFormat,
              date: `${dateStr}, ${timeStr}`,
              size: sizeStr,
              fileName: cleanFileName
            };

            setGeneratedReports((prev) => [newReport, ...prev]);
            setIsGenerating(false);
            setActiveReport(null); // Close Inline Panel
          }, 800);
        }
      }, step.p * 20); // Simulates linear loader increments
    });
  };

  // Real client-side browser file downloader
  const handleDownloadFile = (report: GeneratedReport) => {
    let csvContent = '\uFEFF'; // Add BOM for Excel readability

    if (report.type === 'Order') {
      csvContent += 'Order ID,AWB,Date,Product,Qty,Amount,Payment,Customer,Status\n' +
        'ORD86543,QPSP000000045,13 Jun 2026,Money Attraction Program,12,₹2400,Prepaid,Abdul Latiff,Delivered\n' +
        'ORD86544,QPSP000000046,13 Jun 2026,Wireless Earbuds,1,₹1299,COD,Rohan Sharma,In-Transit\n' +
        'ORD86545,QPSP000000047,12 Jun 2026,Leather Wallet,2,₹899,Prepaid,Sneha Patel,Delivered\n';
    } else if (report.type === 'Shipment') {
      csvContent += 'AWB,Courier,Status,Weight,Zone,Booking Date,Shipping Cost\n' +
        'QPSP000000045,Ekart Surface,Delivered,250g,Zone A,13 Apr 2026,₹54\n' +
        'QPSP000000046,Delhivery Surface,In-Transit,500g,Zone B,14 Apr 2026,₹78\n' +
        'QPSP000000047,Maruti Air,Delivered,1.2kg,Zone D,15 Apr 2026,₹145\n';
    } else if (report.type === 'Passbook') {
      csvContent += 'Transaction ID,Date,Type,Amount,Wallet Balance,Details\n' +
        'TXN98701,15 Jun 2026,Wallet Recharge,₹50000,₹124500,Recharge via UPI\n' +
        'TXN98702,14 Jun 2026,Shipping Charge,-₹12400,₹112100,Deduction for AWB QPSP000000045\n' +
        'TXN98703,13 Jun 2026,Weight Discrepancy,-₹2800,₹109300,Charge for dispute WD-78901\n';
    } else if (report.type === 'Weight Dispute') {
      csvContent += 'Dispute ID,AWB,Raised Date,Applied Wt,Charged Wt,Disputed Amount,Status\n' +
        'WD-78901,147852369012,18 Jun 2026,0.5 kg,1.5 kg,₹120,Pending\n' +
        'WD-78892,147852369044,16 Jun 2026,1.0 kg,2.0 kg,₹180,Resolved\n' +
        'WD-78845,147852369088,12 Jun 2026,2.5 kg,5.0 kg,₹450,Rejected\n';
    } else {
      csvContent += 'Net Remitted,Cycle Date,COD Collected,Shipping Charges,Net Remitted,Status\n' +
        'REM-2026-001,15 Jun 2026,₹1820000,₹362000,₹1458000,Remitted\n' +
        'REM-2026-002,10 Jun 2026,₹1250000,₹250000,₹1000000,Remitted\n' +
        'REM-2026-003,05 Jun 2026,₹840000,₹168000,₹672000,Awaiting Settlement\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', report.fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mock Email Trigger
  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail) return;
    setEmailStatus('sending');
    setTimeout(() => {
      setEmailStatus('success');
      setTimeout(() => {
        setIsEmailModalOpen(false);
        setTargetEmail('');
        setEmailStatus('idle');
        setEmailTargetReport(null);
      }, 1500);
    }, 1200);
  };

  // Delete report
  const handleDeleteReport = (id: string) => {
    setGeneratedReports((prev) => prev.filter((r) => r.id !== id));
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'Order': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Shipment': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Passbook': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Weight Dispute': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-amber-50 text-amber-700 border-amber-100';
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto text-[#0F172A] pb-16 font-sans" style={{ fontFamily: "'Roboto', sans-serif" }}>
        
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#0F172A]">Reports Centre</h2>
          <p className="text-xs text-[#64748B] mt-1">Configure parameters, compile transactional data ledgers, and download CSV reports.</p>
        </div>

        {/* ── CARD GRID SELECTOR (Aligned to 5-columns horizontally) ── */}
        <div className="mb-8">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 mb-4">Select Report Category</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* 1. Order Reports */}
            <div 
              onClick={() => {
                setActiveReport('Order');
                setSelectedFormat('CSV');
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between bg-white h-[115px] group ${
                activeReport === 'Order' ? 'border-blue-500 bg-blue-50/5' : 'border-slate-100 hover:border-blue-500/40 hover:shadow-sm'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                activeReport === 'Order' ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white'
              }`}>
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div className="text-left mt-2">
                <h4 className="text-xs font-bold text-slate-800">Order Reports</h4>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Velocities, payment modes, and order details.</p>
              </div>
            </div>

            {/* 2. Shipment Reports */}
            <div 
              onClick={() => {
                setActiveReport('Shipment');
                setSelectedFormat('CSV');
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between bg-white h-[115px] group ${
                activeReport === 'Shipment' ? 'border-emerald-500 bg-emerald-50/5' : 'border-slate-100 hover:border-emerald-500/40 hover:shadow-sm'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                activeReport === 'Shipment' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white'
              }`}>
                <Package className="w-5 h-5" />
              </div>
              <div className="text-left mt-2">
                <h4 className="text-xs font-bold text-slate-800">Shipment Reports</h4>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">AWB operational tracking, couriers, and zones.</p>
              </div>
            </div>

            {/* 3. Passbook Reports */}
            <div 
              onClick={() => {
                setActiveReport('Passbook');
                setSelectedFormat('CSV');
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between bg-white h-[115px] group ${
                activeReport === 'Passbook' ? 'border-purple-500 bg-purple-50/5' : 'border-slate-100 hover:border-purple-500/40 hover:shadow-sm'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                activeReport === 'Passbook' ? 'bg-purple-500 text-white' : 'bg-slate-50 text-purple-500 group-hover:bg-purple-500 group-hover:text-white'
              }`}>
                <Wallet className="w-5 h-5" />
              </div>
              <div className="text-left mt-2">
                <h4 className="text-xs font-bold text-slate-800">Passbook Reports</h4>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Wallet ledger, recharge summaries, and debits.</p>
              </div>
            </div>

            {/* 4. Weight Dispute Reports */}
            <div 
              onClick={() => {
                setActiveReport('Weight Dispute');
                setSelectedFormat('CSV');
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between bg-white h-[115px] group ${
                activeReport === 'Weight Dispute' ? 'border-rose-500 bg-rose-50/5' : 'border-slate-100 hover:border-rose-500/40 hover:shadow-sm'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                activeReport === 'Weight Dispute' ? 'bg-rose-500 text-white' : 'bg-slate-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white'
              }`}>
                <Scale className="w-5 h-5" />
              </div>
              <div className="text-left mt-2">
                <h4 className="text-xs font-bold text-slate-800">Weight Dispute Reports</h4>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Weight discrepancy claims and audits.</p>
              </div>
            </div>

            {/* 5. COD Remittance Reports */}
            <div 
              onClick={() => {
                setActiveReport('COD Remittance');
                setSelectedFormat('CSV');
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between bg-white h-[115px] group ${
                activeReport === 'COD Remittance' ? 'border-amber-500 bg-amber-50/5' : 'border-slate-100 hover:border-amber-500/40 hover:shadow-sm'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                activeReport === 'COD Remittance' ? 'bg-amber-500 text-white' : 'bg-slate-50 text-amber-500 group-hover:bg-amber-500 group-hover:text-white'
              }`}>
                <Banknote className="w-5 h-5" />
              </div>
              <div className="text-left mt-2">
                <h4 className="text-xs font-bold text-slate-800">COD Remittance Reports</h4>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Schedules, remitted payout sums, and details.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── INLINE REPORT GENERATOR FORM PANEL (Replaces the modal style) ── */}
        <AnimatePresence>
          {activeReport && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -15 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -15 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="mb-8"
            >
              <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm relative overflow-hidden">
                
                {/* Inline Form Header Close Trigger */}
                {!isGenerating && (
                  <button
                    type="button"
                    onClick={() => setActiveReport(null)}
                    className="absolute top-4 right-4 w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                )}

                {/* Form Heading details */}
                <div className="flex items-center gap-3.5 mb-6">
                  <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
                    {React.createElement(getReportDetails(activeReport)?.icon || FileText, {
                      className: 'w-5 h-5',
                      style: { color: getReportDetails(activeReport)?.color }
                    })}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Configure {getReportDetails(activeReport)?.title} Parameters</h3>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5">{getReportDetails(activeReport)?.desc}</p>
                  </div>
                </div>

                <div className="h-[1px] bg-slate-100 mb-6" />

                {/* Simulated progress layout */}
                <AnimatePresence mode="wait">
                  {isGenerating ? (
                    <motion.div 
                      key="progress"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-6 text-center space-y-4"
                    >
                      <div className="flex justify-between items-center text-xs font-bold px-2">
                        <span className="text-[#00A86B] flex items-center gap-1.5">
                          <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> {progressStatus}
                        </span>
                        <span className="text-slate-600">{progress}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#00A86B] to-[#10B981] transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="form-content"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-5"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        {/* 1. Date Range */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1.5 uppercase tracking-wide">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date Range
                          </label>
                          <select 
                            value={selectedDateRange}
                            onChange={(e) => setSelectedDateRange(e.target.value)}
                            className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-700 bg-white text-xs font-bold focus:outline-none focus:border-[#00A86B]"
                          >
                            {DATE_RANGES.map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>

                        {/* 2. Seller Selector */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1.5 uppercase tracking-wide">
                            <FileText className="w-3.5 h-3.5 text-slate-400" /> Seller Account
                          </label>
                          <select 
                            value={selectedSeller}
                            onChange={(e) => setSelectedSeller(e.target.value)}
                            className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-700 bg-white text-xs font-bold focus:outline-none focus:border-[#00A86B]"
                          >
                            {SELLERS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>

                        {/* 3. Dynamic Filter */}
                        {activeReport === 'Order' && (
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1.5 uppercase tracking-wide">
                              <Filter className="w-3.5 h-3.5 text-slate-400" /> Payment Mode
                            </label>
                            <select 
                              value={orderStatus} 
                              onChange={(e) => setOrderStatus(e.target.value)}
                              className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-700 bg-white text-xs font-bold focus:outline-none"
                            >
                              <option value="All">All Modes (Prepaid & COD)</option>
                              <option value="Prepaid">Prepaid Only</option>
                              <option value="COD">COD Only</option>
                            </select>
                          </div>
                        )}

                        {activeReport === 'Shipment' && (
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1.5 uppercase tracking-wide">
                              <Truck className="w-3.5 h-3.5 text-slate-400" /> Courier Service
                            </label>
                            <select 
                              value={selectedCourier} 
                              onChange={(e) => setSelectedCourier(e.target.value)}
                              className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-700 bg-white text-xs font-bold focus:outline-none"
                            >
                              {COURIERS.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {activeReport === 'Passbook' && (
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1.5 uppercase tracking-wide">
                              <Filter className="w-3.5 h-3.5 text-slate-400" /> Transaction Type
                            </label>
                            <select 
                              className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-700 bg-white text-xs font-bold focus:outline-none"
                            >
                              <option value="All">All Transactions</option>
                              <option value="Recharge">Recharges & Credits Only</option>
                              <option value="Debit">Fulfillment Charges (Debits)</option>
                            </select>
                          </div>
                        )}

                        {activeReport === 'Weight Dispute' && (
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1.5 uppercase tracking-wide">
                              <Filter className="w-3.5 h-3.5 text-slate-400" /> Dispute Status
                            </label>
                            <select 
                              value={disputeStatus} 
                              onChange={(e) => setDisputeStatus(e.target.value)}
                              className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-700 bg-white text-xs font-bold focus:outline-none"
                            >
                              <option value="All">All Statuses</option>
                              <option value="Pending">Pending</option>
                              <option value="Resolved">Resolved</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </div>
                        )}

                        {activeReport === 'COD Remittance' && (
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1.5 uppercase tracking-wide">
                              <Filter className="w-3.5 h-3.5 text-slate-400" /> Settlement Status
                            </label>
                            <select 
                              value={remittanceStatus} 
                              onChange={(e) => setRemittanceStatus(e.target.value)}
                              className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-700 bg-white text-xs font-bold focus:outline-none"
                            >
                              <option value="All">All Settlements</option>
                              <option value="Remitted">Remitted</option>
                              <option value="Pending">Pending Payout</option>
                            </select>
                          </div>
                        )}

                      </div>

                      {/* File Format Options & Action Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 pt-5">
                        
                        {/* Format radio group */}
                        <div className="flex items-center gap-4">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Export Format:</span>
                          <div className="flex gap-3">
                            {['CSV', 'XLS', 'PDF'].map((f) => (
                              <label key={f} className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700 select-none">
                                <input 
                                  type="radio" 
                                  name="format"
                                  value={f}
                                  checked={selectedFormat === f} 
                                  onChange={() => setSelectedFormat(f as any)}
                                  className="w-3.5 h-3.5 accent-[#00A86B]" 
                                />
                                {f}
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveReport(null)}
                            className="h-10 px-5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all focus:outline-none cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleGenerateReport}
                            className="h-10 px-6 rounded-lg bg-[#00A86B] hover:bg-[#009B63] text-white text-xs font-bold shadow-lg shadow-[#00A86B]/25 transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer"
                          >
                            Generate Report <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── RECENTLY GENERATED REPORTS TABLE ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Recently Generated Reports</h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase">{generatedReports.length} Available</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-100 text-[10px] uppercase tracking-wider font-bold text-slate-500">
                  <th className="p-4 pl-6">Report ID</th>
                  <th className="p-4">Report Name</th>
                  <th className="p-4">Report Category</th>
                  <th className="p-4">Format</th>
                  <th className="p-4">Date Compiled</th>
                  <th className="p-4">File Size</th>
                  <th className="p-4 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="text-xs font-bold text-slate-600">
                <AnimatePresence>
                  {generatedReports.map((report) => (
                    <motion.tr 
                      key={report.id}
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-b border-slate-50 hover:bg-[#F8FAFC] transition-colors"
                    >
                      <td className="p-4 pl-6 font-mono text-[11px] text-slate-400">#{report.id}</td>
                      <td className="p-4 text-slate-800 font-semibold">{report.name}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${getTypeBadgeClass(report.type)}`}>
                          {report.type}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-extrabold border border-slate-200">
                          {report.format}
                        </span>
                      </td>
                      <td className="p-4 font-normal text-slate-500">{report.date}</td>
                      <td className="p-4 font-normal text-slate-500">{report.size}</td>
                      <td className="p-4 text-right pr-6 flex items-center justify-end gap-2.5">
                        
                        <button 
                          onClick={() => handleDownloadFile(report)}
                          title="Download File"
                          className="w-8 h-8 rounded-lg border border-slate-200 hover:border-[#00A86B] text-slate-500 hover:text-[#00A86B] flex items-center justify-center transition-all bg-white cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button 
                          onClick={() => {
                            setEmailTargetReport(report);
                            setIsEmailModalOpen(true);
                          }}
                          title="Email Report"
                          className="w-8 h-8 rounded-lg border border-slate-200 hover:border-[#00A86B] text-slate-500 hover:text-[#00A86B] flex items-center justify-center transition-all bg-white cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>

                        <button 
                          onClick={() => handleDeleteReport(report.id)}
                          title="Delete History"
                          className="w-8 h-8 rounded-lg border border-slate-200 hover:border-red-500 text-slate-400 hover:text-red-500 flex items-center justify-center transition-all bg-white cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {generatedReports.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                      No reports generated in this session. Click on any card above to configure and compile a report.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── EMAIL MODAL ── */}
        <AnimatePresence>
          {isEmailModalOpen && emailTargetReport && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsEmailModalOpen(false)}
                className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[200]"
              />

              {/* Modal Card */}
              <div className="fixed inset-0 flex items-center justify-center z-[201] p-4 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ type: 'spring', duration: 0.4 }}
                  className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-6 relative pointer-events-auto border border-slate-100"
                >
                  <button
                    type="button"
                    onClick={() => setIsEmailModalOpen(false)}
                    className="absolute top-4 right-4 w-7 h-7 bg-slate-50 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-6 h-6" />
                    </div>
                    
                    <h3 className="text-sm font-bold text-slate-800 mb-1">Email Report</h3>
                    <p className="text-[10px] text-slate-400 leading-normal px-4 mb-5">
                      Send <span className="font-bold text-slate-600">{emailTargetReport.fileName}</span> to any verified email address.
                    </p>

                    <AnimatePresence mode="wait">
                      {emailStatus === 'success' ? (
                        <motion.div 
                          key="success"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center text-emerald-700 text-xs font-bold flex flex-col items-center justify-center gap-1"
                        >
                          <FileCheck className="w-6 h-6 text-[#00A86B]" />
                          Report Successfully Emailed!
                        </motion.div>
                      ) : (
                        <motion.form 
                          key="form"
                          onSubmit={handleSendEmail} 
                          className="space-y-4"
                        >
                          <input 
                            type="email"
                            required
                            placeholder="Enter recipient email address"
                            value={targetEmail}
                            onChange={(e) => setTargetEmail(e.target.value)}
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-[#00A86B]"
                          />

                          <button
                            type="submit"
                            disabled={emailStatus === 'sending'}
                            className="w-full h-11 rounded-xl bg-[#00A86B] hover:bg-[#009B63] text-white text-xs font-bold shadow-lg shadow-[#00A86B]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {emailStatus === 'sending' ? (
                              <>
                                <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> Sending...
                              </>
                            ) : (
                              <>
                                Send Report <Send className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        </motion.form>
                      )}
                    </AnimatePresence>

                  </div>
                </motion.div>
              </div>

            </>
          )}
        </AnimatePresence>

      </div>
    </AdminLayout>
  );
}
