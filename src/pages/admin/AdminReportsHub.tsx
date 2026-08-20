import { useState } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { useAdminTab } from '../../context/AdminUserContext';
import { AnimatePresence } from 'framer-motion';
import {
  FileText, Package, Truck, AlertTriangle, Banknote, Scale, Wallet, ShieldAlert,
  ArrowRight, RefreshCw, MoreHorizontal,
} from 'lucide-react';
import { GenerateReportModal, MisReportTable } from '../../components/admin/reports/MisReportShared';

// Legacy report types that predate the dedicated cards below — kept generatable
// via the "Others" card instead of being deleted outright.
const OTHER_REPORT_TYPES = ['All', 'Delivered', 'RTO', 'Canceled', 'Pending Order'];

interface ReportCardDef {
  reportType: string;
  title: string;
  description: string;
  icon: any;
  accent: string;   // icon badge bg
  accentText: string; // icon color
}

const REPORT_CARDS: ReportCardDef[] = [
  { reportType: 'Orders',          title: 'Orders Report',          description: 'Every order placed, with status, courier, and payment breakdown.', icon: Package,      accent: 'bg-blue-50',    accentText: 'text-blue-600' },
  { reportType: 'Shipments',       title: 'Shipments Report',       description: 'Shipment-level tracking history across all courier partners.',      icon: Truck,        accent: 'bg-indigo-50',  accentText: 'text-indigo-600' },
  { reportType: 'NDR',             title: 'NDR Report',             description: 'Non-delivery reports with reason codes and resolution status.',     icon: AlertTriangle,accent: 'bg-amber-50',   accentText: 'text-amber-600' },
  { reportType: 'COD',             title: 'COD Report',             description: 'Cash-on-delivery collections, remittance, and pending payouts.',    icon: Banknote,     accent: 'bg-emerald-50', accentText: 'text-emerald-600' },
  { reportType: 'Weight Disputes', title: 'Weight Disputes Report', description: 'Raised, accepted, and rejected weight discrepancy claims.',         icon: Scale,        accent: 'bg-purple-50',  accentText: 'text-purple-600' },
  { reportType: 'Passbook',        title: 'Passbook Report',        description: 'Wallet transaction history — credits, debits, and charges.',        icon: Wallet,       accent: 'bg-cyan-50',    accentText: 'text-cyan-600' },
  { reportType: 'Undelivered',     title: 'Undelivered Report',     description: 'Shipments still undelivered, RTO-bound, or stuck in transit.',      icon: ShieldAlert,  accent: 'bg-rose-50',    accentText: 'text-rose-600' },
];

function ReportCard({ def, onGenerate }: { def: ReportCardDef; onGenerate: (reportType: string) => void }) {
  const Icon = def.icon;
  return (
    <div className="group bg-white rounded-2xl border border-[#E2E8F0] p-4 md:p-5 shadow-sm hover:border-[#00A86B]/30 hover:shadow-lg hover:shadow-[#00A86B]/5 hover:-translate-y-0.5 transition-all duration-250 flex flex-col">
      <div className={`w-10 h-10 rounded-xl ${def.accent} flex items-center justify-center shrink-0 mb-3.5`}>
        <Icon className={`w-[18px] h-[18px] ${def.accentText}`} />
      </div>
      <h3 className="text-[14px] font-bold text-[#0F172A] mb-1">{def.title}</h3>
      <p className="text-[12px] text-[#64748B] leading-relaxed mb-4 flex-1">{def.description}</p>
      <button
        onClick={() => onGenerate(def.reportType)}
        className="w-full py-2.5 rounded-full border border-[#1E3A8A]/25 text-[#1E3A8A] text-[12.5px] font-bold flex items-center justify-center gap-1.5 transition-colors hover:bg-[#1E3A8A]/5 active:bg-[#1E3A8A]/10"
      >
        Generate Report
        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}

/** "Others" card — surfaces the legacy report types (Delivered/RTO/Canceled/Pending Order)
 *  that predate the dedicated cards above, instead of dropping them. Dashed border and
 *  muted styling visually mark it as a catch-all, distinct from the primary report types. */
function OtherReportCard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="group bg-[#F8FAFC] rounded-2xl border-2 border-dashed border-[#CBD5E1] p-4 md:p-5 hover:border-[#94A3B8] hover:bg-white transition-all duration-250 flex flex-col">
      <div className="w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 mb-3.5">
        <MoreHorizontal className="w-[18px] h-[18px] text-[#64748B]" />
      </div>
      <h3 className="text-[14px] font-bold text-[#0F172A] mb-1">Other Reports</h3>
      <p className="text-[12px] text-[#64748B] leading-relaxed mb-4 flex-1">Legacy report types — Delivered, RTO, Canceled, and Pending Order.</p>
      <button
        onClick={onOpen}
        className="w-full py-2.5 rounded-full border border-[#64748B]/25 text-[#475569] text-[12.5px] font-bold flex items-center justify-center gap-1.5 transition-colors hover:bg-[#64748B]/5 active:bg-[#64748B]/10"
      >
        Choose Report
        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}

export function AdminReportsHub() {
  const { isAdmin, adminTab, currentUserId } = useAdminTab();
  const isAdminView = isAdmin && adminTab;

  const [genOpen, setGenOpen]     = useState(false);
  const [genType, setGenType]     = useState('All');
  const [genLocked, setGenLocked] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const openGenerate = (reportType: string) => {
    setGenType(reportType);
    setGenLocked(true);
    setGenOpen(true);
  };

  const openOtherReports = () => {
    setGenType(OTHER_REPORT_TYPES[0]);
    setGenLocked(false);
    setGenOpen(true);
  };

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white overflow-hidden">
        {/* Header */}
        <div className="flex flex-row justify-between items-center gap-4 px-4 md:px-6 py-4 border-b border-[#E2E8F0] shrink-0">
          <div>
            <h2 className="text-base md:text-xl font-bold text-[#0F172A] flex items-center gap-2">
              <FileText className="w-4 h-4 md:w-5 md:h-5 text-[#00A86B]" /> Reports
            </h2>
            <p className="hidden md:block text-xs text-[#64748B] mt-1">Generate and download Excel reports for orders, shipments, NDR, COD, and more.</p>
          </div>
          <button onClick={() => setRefreshKey(k => k + 1)} title="Refresh"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-[#E2E8F0] text-[#64748B] hover:text-[#00A86B] hover:border-[#00A86B] transition-colors shrink-0">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4 md:p-6">
            {/* Report cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {REPORT_CARDS.map(def => (
                <ReportCard key={def.reportType} def={def} onGenerate={openGenerate} />
              ))}
              <OtherReportCard onOpen={openOtherReports} />
            </div>

            {/* Recent reports */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] flex items-center justify-center">
                <FileText className="w-4 h-4 text-[#00A86B]" />
              </div>
              <h3 className="text-sm font-bold text-[#0F172A]">Recent Reports</h3>
            </div>
            <MisReportTable
              key={`reports-hub-${refreshKey}`}
              userId={isAdminView ? null : currentUserId}
              isAdminView={isAdminView}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {genOpen && (
          <GenerateReportModal
            open
            onClose={() => { setGenOpen(false); setRefreshKey(k => k + 1); }}
            prefillUserId={null}
            prefillUserName={undefined}
            isAdminView={isAdminView}
            initialReportType={genType}
            lockReportType={genLocked}
            reportTypeOptions={genLocked ? undefined : OTHER_REPORT_TYPES}
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
