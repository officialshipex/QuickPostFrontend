import React from 'react';
import { Package, AlertTriangle, IndianRupee, RotateCcw, CheckCircle2, Clock, Trash2, HelpCircle } from 'lucide-react';

const SHIPMENT_METRICS = [
  { label: 'Total Shipments', value: '18.9L', icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
  { label: 'In Transit', value: '3.2L', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
  { label: 'Delivered', value: '14.1L', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
  { label: 'RTO', value: '1.2L', icon: RotateCcw, color: 'text-red-500', bg: 'bg-red-50' },
  { label: 'NDR', value: '2.5L', icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { label: 'Lost/Damaged', value: '12.4k', icon: HelpCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
];

const NDR_METRICS = [
  { label: 'Open NDR', value: '3.2L', icon: AlertTriangle, color: 'text-blue-500', bg: 'bg-blue-50' },
  { label: 'Action Required', value: '1.1L', icon: Clock, color: 'text-red-500', bg: 'bg-red-50' },
  { label: 'Customer Unreachable', value: '84k', icon: HelpCircle, color: 'text-orange-500', bg: 'bg-orange-50' },
  { label: 'Reattempt Scheduled', value: '76k', icon: RotateCcw, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { label: 'Delivered via NDR', value: '42k', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
  { label: 'RTO Completed', value: '8.4k', icon: RotateCcw, color: 'text-rose-500', bg: 'bg-rose-50' },
];

const COD_METRICS = [
  { label: 'Total COD', value: '₹2.8 Cr', icon: IndianRupee, color: 'text-purple-500', bg: 'bg-purple-50' },
  { label: 'Pending Settlement', value: '₹42 L', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
  { label: 'Settled', value: '₹2.3 Cr', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
  { label: 'Settlement Failed', value: '₹1.2 L', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
  { label: 'Refund Initiated', value: '₹8.4 L', icon: RotateCcw, color: 'text-blue-500', bg: 'bg-blue-50' },
  { label: 'Refund Completed', value: '₹6.2 L', icon: CheckCircle2, color: 'text-teal-500', bg: 'bg-teal-50' },
];

function AnalyticsCard({ title, metrics }: { title: string, metrics: typeof SHIPMENT_METRICS }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm h-full flex flex-col">
      <h3 className="font-bold text-sm text-[#0F172A] mb-5 shrink-0">{title}</h3>
      <div className="grid grid-cols-2 gap-3 flex-1 content-start">
        {metrics.map((metric, idx) => (
          <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-[#E2E8F0] hover:border-[#00A86B] hover:shadow-sm transition-all cursor-pointer bg-white">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${metric.bg}`}>
              <metric.icon className={`w-4 h-4 ${metric.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-[#0F172A] leading-tight">{metric.value}</div>
              <div className="text-[10px] font-semibold text-[#64748B] truncate mt-0.5">{metric.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminAnalyticsSection() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
      <div className="xl:col-span-1">
        <AnalyticsCard title="Shipment Analytics" metrics={SHIPMENT_METRICS} />
      </div>
      <div className="xl:col-span-1">
        <AnalyticsCard title="NDR Analytics" metrics={NDR_METRICS} />
      </div>
      <div className="xl:col-span-1">
        <AnalyticsCard title="COD Analytics" metrics={COD_METRICS} />
      </div>
    </div>
  );
}
