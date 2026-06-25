import React, { useState, useMemo } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Download, Calendar, ChevronDown, ChevronLeft, Users, Truck, IndianRupee, Package, RotateCcw, AlertTriangle, CheckCircle2, Clock, TrendingUp, TrendingDown, Search, Wallet, Scale, FileText, MapPin, ShieldAlert, UserCheck, CreditCard, X } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

/* ══════════════════════════════════════════════════════════
   SELLER DATA — Production-realistic for a logistics aggregator
   ══════════════════════════════════════════════════════════ */
const SELLERS = [
  {
    id: 1, name: 'SuperMart Pvt Ltd', contact: 'Rajesh Kumar', email: 'rajesh@supermart.in', phone: '+91 98765 43210',
    joined: '12 Jan 2025', gstin: '27AABCS1429B1ZK', plan: 'Platinum', status: 'Active' as const, city: 'Mumbai', state: 'Maharashtra',
    // Shipment Stats
    totalOrders: 12450, delivered: 11200, rto: 620, ndr: 530, inTransit: 100, cancelled: 0,
    lostDamaged: 18, outForDelivery: 82, rtoInTransit: 45,
    deliveryRate: 89.96, rtoRate: 4.98, ndrRate: 4.26, avgDeliveryDays: 3.2,
    // Financial
    totalBilled: 4850000, totalRevenue: 4250000, pendingPayment: 186000, walletBalance: 124500,
    codCollected: 1820000, codRemitted: 1640000, codPending: 180000, prepaid: 2430000,
    avgOrderValue: 341, shippingChargesBilled: 3620000, weightDiscrepancyCharges: 48000,
    // Weight Discrepancy
    totalWeightDisputes: 84, disputesResolved: 62, disputesPending: 22, excessChargesCollected: 48000,
    // Zones
    zoneWise: [
      { name: 'Zone A (Local)', value: 4200 }, { name: 'Zone B (Regional)', value: 3800 },
      { name: 'Zone C (Metro)', value: 2400 }, { name: 'Zone D (ROI)', value: 1500 }, { name: 'Zone E (Special)', value: 550 },
    ],
    shipmentsByMode: [{ name: 'Surface', value: 8400 }, { name: 'Air', value: 4050 }],
    ordersByPayment: [{ name: 'Prepaid', value: 7200 }, { name: 'COD', value: 5250 }],
    topCouriers: [
      { name: 'Delhivery', shipments: 5200, delivered: 4800, rto: 200, ndr: 150, avgDays: 2.8 },
      { name: 'Ekart', shipments: 3800, delivered: 3500, rto: 180, ndr: 90, avgDays: 3.1 },
      { name: 'XpressBees', shipments: 2100, delivered: 1900, rto: 140, ndr: 180, avgDays: 3.6 },
      { name: 'Shadowfax', shipments: 1350, delivered: 1000, rto: 100, ndr: 110, avgDays: 4.1 },
    ],
    recentTransactions: [
      { date: '15 Jun 2026', type: 'COD Remittance', amount: 84500, status: 'Completed' },
      { date: '14 Jun 2026', type: 'Shipping Charge', amount: -12400, status: 'Deducted' },
      { date: '13 Jun 2026', type: 'Wallet Recharge', amount: 50000, status: 'Completed' },
      { date: '12 Jun 2026', type: 'Weight Discrepancy', amount: -2800, status: 'Deducted' },
      { date: '10 Jun 2026', type: 'COD Remittance', amount: 96200, status: 'Completed' },
      { date: '08 Jun 2026', type: 'Shipping Charge', amount: -18600, status: 'Deducted' },
    ],
  },
  {
    id: 2, name: 'Fashion Hub', contact: 'Priya Sharma', email: 'priya@fashionhub.in', phone: '+91 87654 32109',
    joined: '04 Mar 2025', gstin: '07AAECF8462R1Z2', plan: 'Gold', status: 'Active' as const, city: 'Delhi', state: 'Delhi',
    totalOrders: 8210, delivered: 7100, rto: 540, ndr: 420, inTransit: 150, cancelled: 0,
    lostDamaged: 12, outForDelivery: 65, rtoInTransit: 38,
    deliveryRate: 86.48, rtoRate: 6.58, ndrRate: 5.12, avgDeliveryDays: 3.8,
    totalBilled: 2890000, totalRevenue: 2410000, pendingPayment: 142000, walletBalance: 84200,
    codCollected: 1250000, codRemitted: 1080000, codPending: 170000, prepaid: 1160000,
    avgOrderValue: 294, shippingChargesBilled: 2180000, weightDiscrepancyCharges: 32000,
    totalWeightDisputes: 56, disputesResolved: 44, disputesPending: 12, excessChargesCollected: 32000,
    zoneWise: [
      { name: 'Zone A (Local)', value: 2800 }, { name: 'Zone B (Regional)', value: 2200 },
      { name: 'Zone C (Metro)', value: 1800 }, { name: 'Zone D (ROI)', value: 1000 }, { name: 'Zone E (Special)', value: 410 },
    ],
    shipmentsByMode: [{ name: 'Surface', value: 5500 }, { name: 'Air', value: 2710 }],
    ordersByPayment: [{ name: 'Prepaid', value: 3800 }, { name: 'COD', value: 4410 }],
    topCouriers: [
      { name: 'Delhivery', shipments: 3200, delivered: 2800, rto: 220, ndr: 130, avgDays: 3.2 },
      { name: 'Shiprocket', shipments: 2800, delivered: 2500, rto: 180, ndr: 160, avgDays: 3.5 },
      { name: 'DTDC', shipments: 2210, delivered: 1800, rto: 140, ndr: 130, avgDays: 4.4 },
    ],
    recentTransactions: [
      { date: '15 Jun 2026', type: 'COD Remittance', amount: 62000, status: 'Completed' },
      { date: '13 Jun 2026', type: 'Shipping Charge', amount: -8200, status: 'Deducted' },
      { date: '11 Jun 2026', type: 'Wallet Recharge', amount: 30000, status: 'Completed' },
      { date: '10 Jun 2026', type: 'Weight Discrepancy', amount: -1400, status: 'Deducted' },
      { date: '08 Jun 2026', type: 'COD Remittance', amount: 71800, status: 'Completed' },
      { date: '06 Jun 2026', type: 'Shipping Charge', amount: -9800, status: 'Deducted' },
    ],
  },
  {
    id: 3, name: 'ElectroWorld', contact: 'Amit Patel', email: 'amit@electroworld.in', phone: '+91 76543 21098',
    joined: '18 Aug 2024', gstin: '24AABCE1234F1Z5', plan: 'Platinum', status: 'Active' as const, city: 'Ahmedabad', state: 'Gujarat',
    totalOrders: 5600, delivered: 5180, rto: 220, ndr: 155, inTransit: 45, cancelled: 0,
    lostDamaged: 8, outForDelivery: 30, rtoInTransit: 12,
    deliveryRate: 92.50, rtoRate: 3.93, ndrRate: 2.77, avgDeliveryDays: 2.8,
    totalBilled: 6200000, totalRevenue: 5580000, pendingPayment: 94000, walletBalance: 210800,
    codCollected: 840000, codRemitted: 780000, codPending: 60000, prepaid: 4740000,
    avgOrderValue: 996, shippingChargesBilled: 4820000, weightDiscrepancyCharges: 18000,
    totalWeightDisputes: 24, disputesResolved: 22, disputesPending: 2, excessChargesCollected: 18000,
    zoneWise: [
      { name: 'Zone A (Local)', value: 1800 }, { name: 'Zone B (Regional)', value: 1500 },
      { name: 'Zone C (Metro)', value: 1200 }, { name: 'Zone D (ROI)', value: 800 }, { name: 'Zone E (Special)', value: 300 },
    ],
    shipmentsByMode: [{ name: 'Surface', value: 2100 }, { name: 'Air', value: 3500 }],
    ordersByPayment: [{ name: 'Prepaid', value: 4200 }, { name: 'COD', value: 1400 }],
    topCouriers: [
      { name: 'Delhivery', shipments: 2800, delivered: 2600, rto: 100, ndr: 60, avgDays: 2.4 },
      { name: 'Ekart', shipments: 1800, delivered: 1700, rto: 80, ndr: 55, avgDays: 2.9 },
      { name: 'XpressBees', shipments: 1000, delivered: 880, rto: 40, ndr: 40, avgDays: 3.4 },
    ],
    recentTransactions: [
      { date: '16 Jun 2026', type: 'COD Remittance', amount: 48000, status: 'Completed' },
      { date: '15 Jun 2026', type: 'Shipping Charge', amount: -22400, status: 'Deducted' },
      { date: '14 Jun 2026', type: 'Wallet Recharge', amount: 100000, status: 'Completed' },
      { date: '12 Jun 2026', type: 'COD Remittance', amount: 52000, status: 'Completed' },
      { date: '10 Jun 2026', type: 'Shipping Charge', amount: -19200, status: 'Deducted' },
      { date: '09 Jun 2026', type: 'Weight Discrepancy', amount: -4200, status: 'Deducted' },
    ],
  },
  {
    id: 4, name: 'Beauty Basics', contact: 'Neha Gupta', email: 'neha@beautybasics.in', phone: '+91 65432 10987',
    joined: '22 Nov 2024', gstin: '09AABCB5643K1Z8', plan: 'Silver', status: 'Active' as const, city: 'Lucknow', state: 'Uttar Pradesh',
    totalOrders: 4100, delivered: 3500, rto: 340, ndr: 210, inTransit: 50, cancelled: 0,
    lostDamaged: 6, outForDelivery: 28, rtoInTransit: 16,
    deliveryRate: 85.37, rtoRate: 8.29, ndrRate: 5.12, avgDeliveryDays: 4.1,
    totalBilled: 1580000, totalRevenue: 1240000, pendingPayment: 118000, walletBalance: 45200,
    codCollected: 620000, codRemitted: 520000, codPending: 100000, prepaid: 620000,
    avgOrderValue: 302, shippingChargesBilled: 1120000, weightDiscrepancyCharges: 14000,
    totalWeightDisputes: 38, disputesResolved: 28, disputesPending: 10, excessChargesCollected: 14000,
    zoneWise: [
      { name: 'Zone A (Local)', value: 1100 }, { name: 'Zone B (Regional)', value: 1200 },
      { name: 'Zone C (Metro)', value: 900 }, { name: 'Zone D (ROI)', value: 600 }, { name: 'Zone E (Special)', value: 300 },
    ],
    shipmentsByMode: [{ name: 'Surface', value: 3200 }, { name: 'Air', value: 900 }],
    ordersByPayment: [{ name: 'Prepaid', value: 2050 }, { name: 'COD', value: 2050 }],
    topCouriers: [
      { name: 'Ekart', shipments: 1800, delivered: 1500, rto: 180, ndr: 90, avgDays: 3.8 },
      { name: 'Delhivery', shipments: 1400, delivered: 1200, rto: 100, ndr: 70, avgDays: 4.2 },
      { name: 'Shadowfax', shipments: 900, delivered: 800, rto: 60, ndr: 50, avgDays: 4.6 },
    ],
    recentTransactions: [
      { date: '14 Jun 2026', type: 'COD Remittance', amount: 28000, status: 'Completed' },
      { date: '12 Jun 2026', type: 'Shipping Charge', amount: -5200, status: 'Deducted' },
      { date: '10 Jun 2026', type: 'Wallet Recharge', amount: 15000, status: 'Completed' },
      { date: '08 Jun 2026', type: 'Weight Discrepancy', amount: -1200, status: 'Deducted' },
      { date: '06 Jun 2026', type: 'COD Remittance', amount: 32400, status: 'Completed' },
      { date: '04 Jun 2026', type: 'Shipping Charge', amount: -6800, status: 'Deducted' },
    ],
  },
  {
    id: 5, name: 'Home Essentials', contact: 'Vikram Singh', email: 'vikram@homeessentials.in', phone: '+91 54321 09876',
    joined: '05 May 2025', gstin: '06AABCH7891P1Z3', plan: 'Gold', status: 'Active' as const, city: 'Chandigarh', state: 'Punjab',
    totalOrders: 3800, delivered: 3450, rto: 180, ndr: 130, inTransit: 40, cancelled: 0,
    lostDamaged: 4, outForDelivery: 22, rtoInTransit: 14,
    deliveryRate: 90.79, rtoRate: 4.74, ndrRate: 3.42, avgDeliveryDays: 3.5,
    totalBilled: 2240000, totalRevenue: 1890000, pendingPayment: 74000, walletBalance: 67800,
    codCollected: 910000, codRemitted: 830000, codPending: 80000, prepaid: 980000,
    avgOrderValue: 497, shippingChargesBilled: 1780000, weightDiscrepancyCharges: 22000,
    totalWeightDisputes: 32, disputesResolved: 26, disputesPending: 6, excessChargesCollected: 22000,
    zoneWise: [
      { name: 'Zone A (Local)', value: 1200 }, { name: 'Zone B (Regional)', value: 1000 },
      { name: 'Zone C (Metro)', value: 800 }, { name: 'Zone D (ROI)', value: 500 }, { name: 'Zone E (Special)', value: 300 },
    ],
    shipmentsByMode: [{ name: 'Surface', value: 2800 }, { name: 'Air', value: 1000 }],
    ordersByPayment: [{ name: 'Prepaid', value: 1900 }, { name: 'COD', value: 1900 }],
    topCouriers: [
      { name: 'Delhivery', shipments: 1600, delivered: 1500, rto: 60, ndr: 30, avgDays: 3.0 },
      { name: 'XpressBees', shipments: 1200, delivered: 1100, rto: 70, ndr: 60, avgDays: 3.6 },
      { name: 'Ekart', shipments: 1000, delivered: 850, rto: 50, ndr: 40, avgDays: 4.0 },
    ],
    recentTransactions: [
      { date: '16 Jun 2026', type: 'COD Remittance', amount: 42000, status: 'Completed' },
      { date: '14 Jun 2026', type: 'Shipping Charge', amount: -9400, status: 'Deducted' },
      { date: '12 Jun 2026', type: 'Wallet Recharge', amount: 25000, status: 'Completed' },
      { date: '10 Jun 2026', type: 'COD Remittance', amount: 38200, status: 'Completed' },
      { date: '08 Jun 2026', type: 'Shipping Charge', amount: -11200, status: 'Deducted' },
      { date: '06 Jun 2026', type: 'Weight Discrepancy', amount: -3200, status: 'Deducted' },
    ],
  },
];

/* ══════════════════════════════════════════════════════════
   COURIER DATA (unchanged from before)
   ══════════════════════════════════════════════════════════ */
const COURIERS = [
  {
    id: 1, name: 'Delhivery', type: 'Domestic',
    totalShipments: 842000, delivered: 784000, rto: 42000, ndr: 84000, inTransit: 32000,
    revenueGenerated: 12000000, avgDeliveryDays: 3.1, deliveryRate: 93.11, rtoRate: 4.99,
    shipmentsByZone: [
      { name: 'Zone A', value: 280000 }, { name: 'Zone B', value: 240000 },
      { name: 'Zone C', value: 180000 }, { name: 'Zone D', value: 92000 }, { name: 'Zone E', value: 50000 },
    ],
    shipmentsByMode: [{ name: 'Surface', value: 520000 }, { name: 'Air', value: 322000 }],
    statusBreakdown: [
      { name: 'Delivered', value: 784000 }, { name: 'In Transit', value: 32000 },
      { name: 'RTO', value: 42000 }, { name: 'NDR', value: 84000 },
    ],
  },
  {
    id: 2, name: 'Ekart', type: 'Domestic',
    totalShipments: 524000, delivered: 492000, rto: 18000, ndr: 45000, inTransit: 19000,
    revenueGenerated: 8200000, avgDeliveryDays: 3.4, deliveryRate: 93.89, rtoRate: 3.44,
    shipmentsByZone: [
      { name: 'Zone A', value: 180000 }, { name: 'Zone B', value: 150000 },
      { name: 'Zone C', value: 110000 }, { name: 'Zone D', value: 54000 }, { name: 'Zone E', value: 30000 },
    ],
    shipmentsByMode: [{ name: 'Surface', value: 340000 }, { name: 'Air', value: 184000 }],
    statusBreakdown: [
      { name: 'Delivered', value: 492000 }, { name: 'In Transit', value: 19000 },
      { name: 'RTO', value: 18000 }, { name: 'NDR', value: 45000 },
    ],
  },
  {
    id: 3, name: 'XpressBees', type: 'Domestic',
    totalShipments: 281000, delivered: 252000, rto: 22000, ndr: 35000, inTransit: 12000,
    revenueGenerated: 4400000, avgDeliveryDays: 3.6, deliveryRate: 89.68, rtoRate: 7.83,
    shipmentsByZone: [
      { name: 'Zone A', value: 95000 }, { name: 'Zone B', value: 78000 },
      { name: 'Zone C', value: 60000 }, { name: 'Zone D', value: 30000 }, { name: 'Zone E', value: 18000 },
    ],
    shipmentsByMode: [{ name: 'Surface', value: 190000 }, { name: 'Air', value: 91000 }],
    statusBreakdown: [
      { name: 'Delivered', value: 252000 }, { name: 'In Transit', value: 12000 },
      { name: 'RTO', value: 22000 }, { name: 'NDR', value: 35000 },
    ],
  },
  {
    id: 4, name: 'Shadowfax', type: 'Domestic',
    totalShipments: 152000, delivered: 138000, rto: 14000, ndr: 21000, inTransit: 9000,
    revenueGenerated: 2400000, avgDeliveryDays: 3.9, deliveryRate: 90.79, rtoRate: 9.21,
    shipmentsByZone: [
      { name: 'Zone A', value: 52000 }, { name: 'Zone B', value: 42000 },
      { name: 'Zone C', value: 32000 }, { name: 'Zone D', value: 16000 }, { name: 'Zone E', value: 10000 },
    ],
    shipmentsByMode: [{ name: 'Surface', value: 110000 }, { name: 'Air', value: 42000 }],
    statusBreakdown: [
      { name: 'Delivered', value: 138000 }, { name: 'In Transit', value: 9000 },
      { name: 'RTO', value: 14000 }, { name: 'NDR', value: 21000 },
    ],
  },
  {
    id: 5, name: 'DTDC', type: 'Domestic',
    totalShipments: 102000, delivered: 96000, rto: 5000, ndr: 12000, inTransit: 5000,
    revenueGenerated: 1800000, avgDeliveryDays: 4.2, deliveryRate: 94.12, rtoRate: 4.90,
    shipmentsByZone: [
      { name: 'Zone A', value: 35000 }, { name: 'Zone B', value: 28000 },
      { name: 'Zone C', value: 22000 }, { name: 'Zone D', value: 10000 }, { name: 'Zone E', value: 7000 },
    ],
    shipmentsByMode: [{ name: 'Surface', value: 72000 }, { name: 'Air', value: 30000 }],
    statusBreakdown: [
      { name: 'Delivered', value: 96000 }, { name: 'In Transit', value: 5000 },
      { name: 'RTO', value: 5000 }, { name: 'NDR', value: 12000 },
    ],
  },
];

/* ── Constants ── */
const PIE_COLORS = ['#00A86B', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
const STATUS_COLORS: Record<string, string> = { 'Delivered': '#00A86B', 'In Transit': '#3B82F6', 'RTO': '#EF4444', 'NDR': '#F59E0B' };
const DATE_RANGES = ['Last 7 Days', 'Last 30 Days', 'Last 3 Months', 'Last 6 Months', 'This Year'];

function formatCurrency(v: number) {
  return `₹${v.toLocaleString('en-IN')}`;
}
function formatNum(v: number) {
  return v.toLocaleString('en-IN');
}

/* ── Pie Chart Card ── */
function PieChartCard({ title, data, colors }: { title: string; data: { name: string; value: number }[]; colors?: string[] }) {
  const clrs = colors || PIE_COLORS;
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm h-full flex flex-col">
      <h4 className="font-bold text-[13px] text-[#0F172A] mb-4">{title}</h4>
      <div className="flex-1 min-h-[260px] w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="45%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
              {data.map((_, i) => <Cell key={i} fill={clrs[i % clrs.length]} />)}
            </Pie>
            <Tooltip
              formatter={((value: any, name: any) => [`${Number(value).toLocaleString('en-IN')} (${((Number(value) / total) * 100).toFixed(1)}%)`, name]) as any}
              contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px', fontWeight: 600 }}
            />
            <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }} iconType="circle" iconSize={8} formatter={(value: string) => <span className="text-[11px] font-semibold text-[#475569] ml-1">{value}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ── Stat Card ── */
function StatCard({ label, value, icon: Icon, color, bg, trend, sub, onClick }: { label: string; value: string; icon: any; color: string; bg: string; trend?: { value: string; up: boolean }; sub?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm transition-all ${onClick ? 'cursor-pointer hover:border-[#00A86B] hover:shadow-md hover:-translate-y-0.5' : 'hover:shadow-md'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`w-[18px] h-[18px] ${color}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[11px] font-bold ${trend.up ? 'text-green-600' : 'text-red-500'}`}>
            {trend.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.value}
          </div>
        )}
      </div>
      <div className="text-xl font-extrabold text-[#0F172A] leading-tight">{value}</div>
      <div className="text-[11px] font-semibold text-[#64748B] mt-1">{label}</div>
      {sub && <div className="text-[10px] font-medium text-[#94A3B8] mt-0.5">{sub}</div>}
    </div>
  );
}

/* ── Section Header ── */
function SectionTitle({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4 mt-2">
      <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] flex items-center justify-center">
        <Icon className="w-4 h-4 text-[#00A86B]" />
      </div>
      <h3 className="text-sm font-bold text-[#0F172A]">{title}</h3>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */
export function AdminReports() {
  const [activeTab, setActiveTab] = useState<'seller' | 'courier'>('seller');
  const [dateRange, setDateRange] = useState('Last 6 Months');
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [selectedSellerId, setSelectedSellerId] = useState<number | null>(null);
  const [sellerSearch, setSellerSearch] = useState('');
  const [showClaimsModal, setShowClaimsModal] = useState(false);
  const [enabledSellers, setEnabledSellers] = useState<Record<number, boolean>>({});

  const selectedSeller = useMemo(() => SELLERS.find(s => s.id === selectedSellerId) || null, [selectedSellerId]);

  const isEnabled = selectedSeller ? (enabledSellers[selectedSeller.id] ?? (selectedSeller.status === 'Active')) : false;

  const handleToggleEnable = () => {
    if (selectedSeller) {
      setEnabledSellers(prev => ({ ...prev, [selectedSeller.id]: !isEnabled }));
    }
  };

  /* ── Aggregated seller-level ── */
  const totals = useMemo(() => {
    return SELLERS.reduce((a, s) => ({
      orders: a.orders + s.totalOrders,
      delivered: a.delivered + s.delivered,
      rto: a.rto + s.rto,
      ndr: a.ndr + s.ndr,
      revenue: a.revenue + s.totalRevenue,
      billed: a.billed + s.totalBilled,
      pending: a.pending + s.pendingPayment,
      wallets: a.wallets + s.walletBalance,
      cod: a.cod + s.codCollected,
      codPending: a.codPending + s.codPending,
      prepaid: a.prepaid + s.prepaid,
      weightDisputes: a.weightDisputes + s.totalWeightDisputes,
      disputesPending: a.disputesPending + s.disputesPending,
      lostDamaged: a.lostDamaged + s.lostDamaged,
    }), { orders: 0, delivered: 0, rto: 0, ndr: 0, revenue: 0, billed: 0, pending: 0, wallets: 0, cod: 0, codPending: 0, prepaid: 0, weightDisputes: 0, disputesPending: 0, lostDamaged: 0 });
  }, []);

  const sellerOrderStatusPie = useMemo(() => [
    { name: 'Delivered', value: totals.delivered }, { name: 'RTO', value: totals.rto },
    { name: 'NDR', value: totals.ndr }, { name: 'Lost/Damaged', value: totals.lostDamaged },
  ], [totals]);

  const sellerRevenuePie = useMemo(() => SELLERS.map(s => ({ name: s.name, value: s.totalRevenue })), []);

  const sellerRtoPie = useMemo(() => SELLERS.map(s => ({ name: s.name, value: s.rto })), []);

  const sellerPaymentPie = useMemo(() => [{ name: 'Prepaid', value: totals.prepaid }, { name: 'COD', value: totals.cod }], [totals]);

  const filteredSellers = useMemo(() => SELLERS.filter(s => s.name.toLowerCase().includes(sellerSearch.toLowerCase())), [sellerSearch]);

  /* ── Courier aggregated ── */
  const courierShipmentPie = useMemo(() => COURIERS.map(c => ({ name: c.name, value: c.totalShipments })), []);
  const courierStatusPie = useMemo(() => {
    const d = COURIERS.reduce((a, c) => ({ del: a.del + c.delivered, transit: a.transit + c.inTransit, rto: a.rto + c.rto, ndr: a.ndr + c.ndr }), { del: 0, transit: 0, rto: 0, ndr: 0 });
    return [{ name: 'Delivered', value: d.del }, { name: 'In Transit', value: d.transit }, { name: 'RTO', value: d.rto }, { name: 'NDR', value: d.ndr }];
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A]">Analytics & Intelligence</h2>
            <p className="text-xs text-[#64748B] mt-1">Detailed analytics for sellers and couriers across QuickPost.</p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="relative">
              <button onClick={() => setIsDateOpen(!isDateOpen)} className={`flex items-center gap-2 px-4 h-9 rounded-lg border text-xs font-semibold transition-all ${isDateOpen ? 'border-[#00A86B] text-[#00A86B] ring-1 ring-[#00A86B]/20' : 'border-[#E2E8F0] text-[#475569] hover:border-[#00A86B]'}`}>
                <Calendar className="w-4 h-4" /> {dateRange} <ChevronDown className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {isDateOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsDateOpen(false)} />
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.12 }} className="absolute right-0 top-[calc(100%+6px)] bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-20 py-1 min-w-[180px]">
                      {DATE_RANGES.map(r => (
                        <button key={r} onClick={() => { setDateRange(r); setIsDateOpen(false); }} className={`w-full text-left px-4 py-2.5 text-[12px] font-semibold transition-colors ${dateRange === r ? 'bg-[#F0FDF4] text-[#00A86B]' : 'text-[#475569] hover:bg-[#F8FAFC]'}`}>{r}</button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <button className="h-9 px-4 rounded-lg bg-[#00A86B] text-white text-xs font-semibold flex items-center gap-2 hover:bg-[#009B63] transition-colors shadow-sm">
              <Download className="w-4 h-4" /> Export Report
            </button>
          </div>
        </div>

        {/* ── Tab Switcher ── */}
        <div className="border-b border-[#E2E8F0] mb-6">
          <div className="flex gap-8">
            <button onClick={() => { setActiveTab('seller'); setSelectedSellerId(null); }} className={`flex items-center gap-2 px-1 py-4 text-sm font-bold transition-colors ${activeTab === 'seller' ? 'text-[#00A86B] border-b-2 border-[#00A86B]' : 'text-[#64748B] hover:text-[#0F172A]'}`}>
              <Users className="w-4 h-4" /> Seller Performance
            </button>
            <button onClick={() => { setActiveTab('courier'); setSelectedSellerId(null); }} className={`flex items-center gap-2 px-1 py-4 text-sm font-bold transition-colors ${activeTab === 'courier' ? 'text-[#00A86B] border-b-2 border-[#00A86B]' : 'text-[#64748B] hover:text-[#0F172A]'}`}>
              <Truck className="w-4 h-4" /> Courier Performance
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
           SELLER TAB — OVERVIEW
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'seller' && !selectedSeller && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>

            {/* Row 1: Platform Health KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <StatCard label="Active Sellers" value={SELLERS.filter(s => s.status === 'Active').length.toString()} icon={UserCheck} color="text-blue-500" bg="bg-blue-50" sub={`${SELLERS.length} total registered`} />
              <StatCard label="Total Billed" value={formatCurrency(totals.billed)} icon={FileText} color="text-indigo-500" bg="bg-indigo-50" trend={{ value: '+14.2%', up: true }} sub="Shipping + surcharges" />
              <StatCard label="Revenue Collected" value={formatCurrency(totals.revenue)} icon={IndianRupee} color="text-green-500" bg="bg-green-50" trend={{ value: '+12.4%', up: true }} />
              <StatCard label="Outstanding Payments" value={formatCurrency(totals.pending)} icon={Clock} color="text-orange-500" bg="bg-orange-50" sub="Due from sellers" />
            </div>

            {/* Row 2: Operational KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <StatCard label="Total Orders" value={formatNum(totals.orders)} icon={Package} color="text-purple-500" bg="bg-purple-50" trend={{ value: '+8.2%', up: true }} />
              <StatCard label="Platform Delivery Rate" value={`${((totals.delivered / totals.orders) * 100).toFixed(1)}%`} icon={CheckCircle2} color="text-emerald-500" bg="bg-emerald-50" />
              <StatCard label="Platform RTO Rate" value={`${((totals.rto / totals.orders) * 100).toFixed(1)}%`} icon={RotateCcw} color="text-red-500" bg="bg-red-50" trend={{ value: '-0.8%', up: true }} />
              <StatCard label="Total Wallet Balance" value={formatCurrency(totals.wallets)} icon={Wallet} color="text-cyan-500" bg="bg-cyan-50" sub="Across all sellers" />
            </div>

            {/* Row 3: COD + Risk KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard label="COD Collected" value={formatCurrency(totals.cod)} icon={CreditCard} color="text-amber-600" bg="bg-amber-50" />
              <StatCard label="COD Pending Remittance" value={formatCurrency(totals.codPending)} icon={AlertTriangle} color="text-orange-500" bg="bg-orange-50" sub="Awaiting settlement" />
              <StatCard label="Weight Disputes" value={totals.weightDisputes.toString()} icon={Scale} color="text-rose-500" bg="bg-rose-50" sub={`${totals.disputesPending} unresolved`} />
              <StatCard label="Lost / Damaged" value={totals.lostDamaged.toString()} icon={ShieldAlert} color="text-gray-500" bg="bg-gray-100" sub="Across all sellers" />
            </div>

            {/* Pie Charts — 4 across */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
              <PieChartCard title="Order Status Distribution" data={sellerOrderStatusPie} colors={['#00A86B', '#EF4444', '#F59E0B', '#94A3B8']} />
              <PieChartCard title="Payment Mode Split" data={sellerPaymentPie} colors={['#3B82F6', '#F59E0B']} />
              <PieChartCard title="Revenue by Seller" data={sellerRevenuePie} />
              <PieChartCard title="RTO by Seller" data={sellerRtoPie} colors={['#EF4444', '#F97316', '#F59E0B', '#FB923C', '#FBBF24']} />
            </div>

            {/* Seller Table */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <h3 className="font-bold text-sm text-[#0F172A]">Seller-wise Detailed Report</h3>
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input type="text" placeholder="Search sellers..." value={sellerSearch} onChange={e => setSellerSearch(e.target.value)} className="w-full h-9 pl-10 pr-4 border border-[#E2E8F0] rounded-lg text-xs outline-none focus:border-[#00A86B] text-[#0F172A]" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] uppercase tracking-wider font-bold text-[#64748B]">
                      <th className="p-4">Seller</th>
                      <th className="p-4">Plan</th>
                      <th className="p-4">Orders</th>
                      <th className="p-4">Billed</th>
                      <th className="p-4">Pending</th>
                      <th className="p-4">Wallet</th>
                      <th className="p-4">Delivered</th>
                      <th className="p-4">RTO %</th>
                      <th className="p-4">NDR %</th>
                      <th className="p-4">COD Pending</th>
                      <th className="p-4">Wt. Disputes</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-semibold text-[#475569]">
                    {filteredSellers.map(s => (
                      <tr key={s.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#10B981]/10 text-[#00A86B] flex items-center justify-center font-bold text-xs">{s.name.charAt(0)}</div>
                            <div>
                              <div className="font-semibold text-[#0F172A] text-[14px]">{s.name}</div>
                              <div className="text-[10px] text-[#94A3B8] font-medium">{s.city}, {s.state}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${s.plan === 'Platinum' ? 'bg-purple-50 text-purple-600' : s.plan === 'Gold' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-600'}`}>{s.plan}</span>
                        </td>
                        <td className="p-4 font-normal text-[14px]">{s.totalOrders.toLocaleString('en-IN')}</td>
                        <td className="p-4 font-normal text-[14px] text-[#0F172A]">{formatCurrency(s.totalBilled)}</td>
                        <td className="p-4 font-normal text-[14px]">
                          <span className={`${s.pendingPayment > 100000 ? 'text-red-500' : 'text-[#475569]'}`}>{formatCurrency(s.pendingPayment)}</span>
                        </td>
                        <td className="p-4 text-[#00A86B] font-normal text-[14px]">{formatCurrency(s.walletBalance)}</td>
                        <td className="p-4 font-normal text-[14px]">
                          <span className={`px-2 py-1 rounded-md text-[14px] font-normal ${s.deliveryRate >= 90 ? 'bg-green-50 text-green-600' : s.deliveryRate >= 85 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>{s.deliveryRate}%</span>
                        </td>
                        <td className="p-4 font-normal text-[14px]">
                          <span className={`${s.rtoRate > 6 ? 'text-red-500 font-normal' : 'text-[#475569]'}`}>{s.rtoRate}%</span>
                        </td>
                        <td className="p-4 font-normal text-[14px]">
                          <span className={`${s.ndrRate > 5 ? 'text-orange-500 font-normal' : 'text-[#475569]'}`}>{s.ndrRate}%</span>
                        </td>
                        <td className="p-4 font-normal text-[14px]">
                          <span className={`${s.codPending > 100000 ? 'text-orange-500 font-normal' : 'text-[#475569]'}`}>{formatCurrency(s.codPending)}</span>
                        </td>
                        <td className="p-4 font-normal text-[14px]">
                          <span className={`${s.disputesPending > 10 ? 'text-red-500 font-normal' : 'text-[#475569]'}`}>{s.disputesPending} open</span>
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={() => setSelectedSellerId(s.id)} className="text-[#00A86B] hover:text-[#009B63] font-bold text-[11px] hover:underline transition-colors">View Report →</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════
           INDIVIDUAL SELLER REPORT
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'seller' && selectedSeller && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>

            {/* Back */}
            <button onClick={() => setSelectedSellerId(null)} className="flex items-center gap-2 text-sm font-semibold text-[#64748B] hover:text-[#00A86B] transition-colors mb-5">
              <ChevronLeft className="w-4 h-4" /> Back to All Sellers
            </button>

            {/* ── SECTION 1: Seller Profile Header ── */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 mb-6 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-[#10B981]/10 text-[#00A86B] flex items-center justify-center font-extrabold text-xl shrink-0">{selectedSeller.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-extrabold text-[#0F172A]">{selectedSeller.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[12px] font-bold ${selectedSeller.plan === 'Platinum' ? 'bg-purple-100 text-purple-700' : selectedSeller.plan === 'Gold' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>{selectedSeller.plan} Plan</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-green-100 text-green-700">{selectedSeller.status}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">ID: #QP-S{selectedSeller.id.toString().padStart(4, '0')}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> KYC Verified
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2 mt-3 text-[14px] font-normal text-[#64748B]">
                    <div><span className="text-[#94A3B8]">Contact:</span> {selectedSeller.contact}</div>
                    <div><span className="text-[#94A3B8]">Email:</span> {selectedSeller.email}</div>
                    <div><span className="text-[#94A3B8]">Phone:</span> {selectedSeller.phone}</div>
                    <div><span className="text-[#94A3B8]">Joined:</span> {selectedSeller.joined}</div>
                    <div><span className="text-[#94A3B8]">GSTIN:</span> {selectedSeller.gstin}</div>
                    <div><span className="text-[#94A3B8]">Location:</span> {selectedSeller.city}, {selectedSeller.state}</div>
                    <div><span className="text-[#94A3B8]">Avg Order Value:</span> ₹{selectedSeller.avgOrderValue}</div>
                    <div><span className="text-[#94A3B8]">Avg Delivery:</span> {selectedSeller.avgDeliveryDays} days</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3 shrink-0">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg transition-colors">
                    <span className={`text-[11px] font-bold ${isEnabled ? 'text-[#00A86B]' : 'text-red-500'}`}>{isEnabled ? 'Seller Enabled' : 'Seller Disabled'}</span>
                    <label className="relative inline-flex items-center cursor-pointer ml-1">
                      <input type="checkbox" className="sr-only peer" checked={isEnabled} onChange={handleToggleEnable} />
                      <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00A86B]"></div>
                    </label>
                  </div>
                  <button className="h-9 w-full px-4 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#475569] flex items-center justify-center gap-2 hover:bg-[#F8FAFC] transition-colors">
                    <Download className="w-4 h-4" /> Export Report
                  </button>
                </div>
              </div>
            </div>

            {/* ── SECTION 2: Financial Summary ── */}
            <SectionTitle icon={IndianRupee} title="Financial Summary" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard label="Total Billed" value={formatCurrency(selectedSeller.totalBilled)} icon={FileText} color="text-indigo-500" bg="bg-indigo-50" sub="Shipping + Weight charges" />
              <StatCard label="Revenue Collected" value={formatCurrency(selectedSeller.totalRevenue)} icon={IndianRupee} color="text-green-500" bg="bg-green-50" />
              <StatCard label="Pending Payment" value={formatCurrency(selectedSeller.pendingPayment)} icon={Clock} color="text-orange-500" bg="bg-orange-50" sub="Due from seller" />
              <StatCard label="Wallet Balance" value={formatCurrency(selectedSeller.walletBalance)} icon={Wallet} color="text-cyan-500" bg="bg-cyan-50" />
            </div>

            {/* ── SECTION 3: Shipment Operations ── */}
            <SectionTitle icon={Package} title="Shipment Operations" />
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3 mb-6">
              {[
                { label: 'Total Shipments', value: selectedSeller.totalOrders, color: 'text-[#0F172A]' },
                { label: 'Delivered', value: selectedSeller.delivered, color: 'text-green-600' },
                { label: 'In Transit', value: selectedSeller.inTransit, color: 'text-blue-500' },
                { label: 'Out for Delivery', value: selectedSeller.outForDelivery, color: 'text-sky-500' },
                { label: 'RTO', value: selectedSeller.rto, color: 'text-red-500' },
                { label: 'RTO In Transit', value: selectedSeller.rtoInTransit, color: 'text-rose-400' },
                { label: 'NDR', value: selectedSeller.ndr, color: 'text-orange-500' },
                { label: 'Lost/Damaged', value: selectedSeller.lostDamaged, color: 'text-gray-500' },
                { label: 'Delivery %', value: selectedSeller.deliveryRate, color: selectedSeller.deliveryRate >= 90 ? 'text-green-600' : 'text-yellow-600', isPercent: true },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl border border-[#E2E8F0] p-3 text-center">
                  <div className={`text-base font-extrabold ${item.color}`}>{(item as any).isPercent ? `${item.value}%` : (item.value as number).toLocaleString('en-IN')}</div>
                  <div className="text-[9px] font-semibold text-[#94A3B8] mt-0.5 leading-tight">{item.label}</div>
                </div>
              ))}
            </div>

            {/* Pie charts: Mode + Payment + Zone */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              <PieChartCard title="Shipments by Mode" data={selectedSeller.shipmentsByMode} colors={['#3B82F6', '#8B5CF6']} />
              <PieChartCard title="Orders by Payment" data={selectedSeller.ordersByPayment} colors={['#00A86B', '#F59E0B']} />
              <PieChartCard title="Zone-wise Distribution" data={selectedSeller.zoneWise} />
            </div>

            {/* ── SECTION 4: COD & Billing ── */}
            <SectionTitle icon={CreditCard} title="COD & Billing" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <StatCard label="COD Collected" value={formatCurrency(selectedSeller.codCollected)} icon={IndianRupee} color="text-amber-600" bg="bg-amber-50" />
              <StatCard label="COD Remitted" value={formatCurrency(selectedSeller.codRemitted)} icon={CheckCircle2} color="text-green-500" bg="bg-green-50" />
              <StatCard label="COD Pending" value={formatCurrency(selectedSeller.codPending)} icon={AlertTriangle} color="text-orange-500" bg="bg-orange-50" sub="Awaiting remittance" />
              <StatCard label="Weight Discrepancy" value={formatCurrency(selectedSeller.weightDiscrepancyCharges)} icon={Scale} color="text-rose-500" bg="bg-rose-50" sub={`${selectedSeller.disputesPending} disputes pending`} onClick={() => setShowClaimsModal(true)} />
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden mb-6">
              <div className="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <h4 className="font-bold text-sm text-[#0F172A]">Recent Transactions</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] uppercase tracking-wider font-bold text-[#64748B]">
                      <th className="p-4">Date</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-semibold text-[#475569]">
                    {selectedSeller.recentTransactions.map((tx, i) => (
                      <tr key={i} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                        <td className="p-4 font-normal text-[14px] text-[#64748B]">{tx.date}</td>
                        <td className="p-4 font-normal text-[14px] text-[#0F172A]">{tx.type}</td>
                        <td className={`p-4 font-normal text-[14px] ${tx.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {tx.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${tx.status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>{tx.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── SECTION 5: Courier Performance for this Seller ── */}
            <SectionTitle icon={Truck} title="Courier-wise Performance" />
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] uppercase tracking-wider font-bold text-[#64748B]">
                      <th className="p-4">Courier</th>
                      <th className="p-4">Shipments</th>
                      <th className="p-4">Delivered</th>
                      <th className="p-4">RTO %</th>
                      <th className="p-4">NDR</th>
                      <th className="p-4">Avg TAT</th>
                      <th className="p-4">Delivery %</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-semibold text-[#475569]">
                    {selectedSeller.topCouriers.map((c, i) => {
                      const delRate = ((c.delivered / c.shipments) * 100).toFixed(1);
                      return (
                        <tr key={i} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                          <td className="p-4 font-semibold text-[14px] text-[#0F172A]">{c.name}</td>
                          <td className="p-4 font-normal text-[14px]">{c.shipments.toLocaleString('en-IN')}</td>
                          <td className="p-4 font-normal text-[14px] text-green-600">{c.delivered.toLocaleString('en-IN')}</td>
                          <td className="p-4 font-normal text-[14px] text-red-500">{c.rto.toLocaleString('en-IN')}</td>
                          <td className="p-4 font-normal text-[14px] text-orange-500">{c.ndr.toLocaleString('en-IN')}</td>
                          <td className="p-4 font-normal text-[14px]">{c.avgDays} days</td>
                          <td className="p-4 font-normal text-[14px]">
                            <span className={`px-2 py-1 rounded-md text-[14px] font-normal ${parseFloat(delRate) >= 90 ? 'bg-green-50 text-green-600' : parseFloat(delRate) >= 85 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>{delRate}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════
           COURIER TAB (unchanged)
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'courier' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard label="Total Shipments" value={formatNum(COURIERS.reduce((a, c) => a + c.totalShipments, 0))} icon={Truck} color="text-blue-500" bg="bg-blue-50" trend={{ value: '+6.8%', up: true }} />
              <StatCard label="Revenue Generated" value={formatCurrency(COURIERS.reduce((a, c) => a + c.revenueGenerated, 0))} icon={IndianRupee} color="text-green-500" bg="bg-green-50" trend={{ value: '+11.2%', up: true }} />
              <StatCard label="Avg Delivery Rate" value={`${(COURIERS.reduce((a, c) => a + c.deliveryRate, 0) / COURIERS.length).toFixed(1)}%`} icon={CheckCircle2} color="text-emerald-500" bg="bg-emerald-50" />
              <StatCard label="Avg RTO Rate" value={`${(COURIERS.reduce((a, c) => a + c.rtoRate, 0) / COURIERS.length).toFixed(1)}%`} icon={RotateCcw} color="text-red-500" bg="bg-red-50" trend={{ value: '-1.2%', up: true }} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <PieChartCard title="Shipment Share by Courier" data={courierShipmentPie} />
              <PieChartCard title="Overall Status Distribution" data={courierStatusPie} colors={[STATUS_COLORS['Delivered'], STATUS_COLORS['In Transit'], STATUS_COLORS['RTO'], STATUS_COLORS['NDR']]} />
            </div>
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden mb-6">
              <div className="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <h3 className="font-bold text-sm text-[#0F172A]">Courier Performance Report</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] uppercase tracking-wider font-bold text-[#64748B]">
                      <th className="p-4">Courier</th>
                      <th className="p-4">Total Shipments</th>
                      <th className="p-4">Delivered</th>
                      <th className="p-4">In Transit</th>
                      <th className="p-4">RTO %</th>
                      <th className="p-4">NDR</th>
                      <th className="p-4">Delivery %</th>
                      <th className="p-4">Avg TAT</th>
                      <th className="p-4">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-semibold text-[#475569]">
                    {COURIERS.map(c => (
                      <tr key={c.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                        <td className="p-4 font-semibold text-[14px] text-[#0F172A]">{c.name}</td>
                        <td className="p-4 font-normal text-[14px]">{c.totalShipments.toLocaleString('en-IN')}</td>
                        <td className="p-4 font-normal text-[14px] text-green-600">{c.delivered.toLocaleString('en-IN')}</td>
                        <td className="p-4 font-normal text-[14px] text-blue-500">{c.inTransit.toLocaleString('en-IN')}</td>
                        <td className="p-4 font-normal text-[14px] text-red-500">{c.rto.toLocaleString('en-IN')}</td>
                        <td className="p-4 font-normal text-[14px] text-orange-500">{c.ndr.toLocaleString('en-IN')}</td>
                        <td className="p-4 font-normal text-[14px]">
                          <span className={`px-2 py-1 rounded-md text-[14px] font-normal ${c.deliveryRate >= 93 ? 'bg-green-50 text-green-600' : c.deliveryRate >= 90 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>{c.deliveryRate}%</span>
                        </td>
                        <td className="p-4 font-normal text-[14px]">{c.avgDeliveryDays} days</td>
                        <td className="p-4 font-normal text-[14px] text-[#00A86B]">{formatCurrency(c.revenueGenerated)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden mb-6">
              <div className="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <h3 className="font-bold text-sm text-[#0F172A]">Courier Zone Distribution</h3>
              </div>
              <div className="overflow-y-auto max-h-[500px] p-6 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300/80 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-thumb]:rounded-full">
                {COURIERS.map(c => {
                  const total = c.shipmentsByZone.reduce((acc, z) => acc + z.value, 0);
                  return (
                    <div key={c.id} className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col md:flex-row group">
                      <div className="bg-[#F8FAFC] group-hover:bg-white transition-colors border-b md:border-b-0 md:border-r border-[#E2E8F0] p-6 flex flex-col items-center justify-center w-full md:w-64 shrink-0 relative overflow-hidden">
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00A86B]/10 to-transparent rounded-bl-full opacity-50 -mr-10 -mt-10 pointer-events-none"></div>
                        
                        <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#E2E8F0] overflow-hidden mb-4 z-10">
                           <img 
                             src={(c as any).logo || `/brands/${c.name.toLowerCase().replace(/ /g, '_')}.png`} 
                             alt={c.name} 
                             className="w-full h-full object-contain p-4 transition-transform group-hover:scale-110" 
                             onError={(e) => {
                               // Fallback if image fails to load
                               e.currentTarget.style.display = 'none';
                               e.currentTarget.nextElementSibling?.classList.remove('hidden');
                             }}
                           />
                           <div className="hidden w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white text-3xl font-black tracking-tighter absolute inset-0">
                             {c.name.substring(0, 2).toUpperCase()}
                           </div>
                        </div>
                        <h4 className="font-extrabold text-lg text-[#0F172A] text-center z-10">{c.name}</h4>
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mt-2 px-3 py-1 bg-white rounded-full border border-[#E2E8F0] z-10">{c.type}</span>
                      </div>
                      <div className="flex-1 p-0 bg-white">
                        <table className="w-full text-left border-collapse h-full">
                          <thead className="bg-[#F8FAFC]/30">
                            <tr className="border-b border-[#E2E8F0] text-[10px] uppercase tracking-wider font-bold text-[#64748B]">
                              <th className="p-4 pl-6">Zone</th>
                              <th className="p-4">Shipments</th>
                              <th className="p-4 pr-6">Share %</th>
                            </tr>
                          </thead>
                          <tbody className="text-xs font-semibold text-[#475569]">
                            {c.shipmentsByZone.map((z, idx) => (
                              <tr key={idx} className="border-b last:border-0 border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                                <td className="p-4 pl-6 font-normal text-[14px]">{z.name}</td>
                                <td className="p-4 font-normal text-[14px] text-[#0F172A]">{z.value.toLocaleString('en-IN')}</td>
                                <td className="p-4 pr-6 font-normal text-[14px]">
                                  <div className="flex items-center gap-3">
                                    <span className="w-12 font-normal text-[14px] text-[#0F172A] text-right">{((z.value / total) * 100).toFixed(1)}%</span>
                                    <div className="flex-1 max-w-[150px] h-2.5 bg-[#E2E8F0] rounded-full overflow-hidden shadow-inner">
                                      <div className="h-full bg-gradient-to-r from-[#00A86B] to-[#10B981] rounded-full" style={{ width: `${(z.value / total) * 100}%` }}></div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

      </div>

      {/* ══════════════════════════════════════════════════════════
         CLAIMS MODAL (GLASSMORPHISM)
         ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showClaimsModal && selectedSeller && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" 
              onClick={() => setShowClaimsModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-4xl bg-white/80 backdrop-blur-2xl border border-white/60 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/30 bg-white/40">
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">Weight Discrepancy Claims</h3>
                  <p className="text-[11px] font-semibold text-[#64748B] mt-0.5">Seller: {selectedSeller.name} • {selectedSeller.disputesPending} Pending Disputes</p>
                </div>
                <button onClick={() => setShowClaimsModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/50 text-[#475569] hover:bg-white/80 hover:text-[#0F172A] transition-all border border-white/40">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300/80 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-thumb]:rounded-full">
                <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/50 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E2E8F0]/60 text-[10px] uppercase tracking-wider font-bold text-[#64748B] bg-white/40 sticky top-0 backdrop-blur-md z-10">
                        <th className="p-4">Claim ID</th>
                        <th className="p-4">AWB Number</th>
                        <th className="p-4">Date Raised</th>
                        <th className="p-4">Applied / Charged Wt.</th>
                        <th className="p-4 text-right">Disputed Amount</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-semibold text-[#475569]">
                      {[
                        { id: 'WD-78901', awb: '147852369012', date: '18 Jun 2026', appWt: '0.5 kg', chgWt: '1.5 kg', amt: 120, status: 'Pending' },
                        { id: 'WD-78892', awb: '147852369044', date: '16 Jun 2026', appWt: '1.0 kg', chgWt: '2.0 kg', amt: 180, status: 'Resolved' },
                        { id: 'WD-78845', awb: '147852369088', date: '12 Jun 2026', appWt: '2.5 kg', chgWt: '5.0 kg', amt: 450, status: 'Rejected' },
                        { id: 'WD-78810', awb: '147852369105', date: '10 Jun 2026', appWt: '0.2 kg', chgWt: '1.0 kg', amt: 85, status: 'Pending' },
                        { id: 'WD-78799', awb: '147852369150', date: '05 Jun 2026', appWt: '1.5 kg', chgWt: '2.5 kg', amt: 150, status: 'Resolved' },
                        { id: 'WD-78780', awb: '147852369190', date: '04 Jun 2026', appWt: '0.5 kg', chgWt: '1.0 kg', amt: 60, status: 'Resolved' },
                        { id: 'WD-78765', awb: '147852369211', date: '02 Jun 2026', appWt: '3.0 kg', chgWt: '4.5 kg', amt: 220, status: 'Rejected' },
                        { id: 'WD-78740', awb: '147852369255', date: '01 Jun 2026', appWt: '1.0 kg', chgWt: '3.0 kg', amt: 300, status: 'Pending' },
                        { id: 'WD-78712', awb: '147852369299', date: '28 May 2026', appWt: '0.5 kg', chgWt: '2.0 kg', amt: 180, status: 'Resolved' },
                        { id: 'WD-78695', awb: '147852369330', date: '25 May 2026', appWt: '2.0 kg', chgWt: '2.5 kg', amt: 50, status: 'Resolved' },
                      ].map((c, i) => (
                        <tr key={i} className="border-b border-[#E2E8F0]/40 hover:bg-white/50 transition-colors">
                          <td className="p-4 font-normal text-[14px] text-[#0F172A]">#{c.id}</td>
                          <td className="p-4 font-normal text-[14px] text-[#3B82F6] hover:underline cursor-pointer">{c.awb}</td>
                          <td className="p-4 font-normal text-[14px]">{c.date}</td>
                          <td className="p-4 font-normal text-[14px]">
                            <div className="flex items-center gap-2">
                              <span className="bg-emerald-50/80 text-emerald-600 px-1.5 py-0.5 rounded text-[10px] border border-emerald-100">{c.appWt}</span>
                              <span className="text-[#94A3B8]">&rarr;</span>
                              <span className="bg-rose-50/80 text-rose-600 px-1.5 py-0.5 rounded text-[10px] border border-rose-100">{c.chgWt}</span>
                            </div>
                          </td>
                          <td className="p-4 text-right font-normal text-[14px] text-[#0F172A]">₹{c.amt}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${c.status === 'Pending' ? 'bg-amber-100/80 text-amber-700' : c.status === 'Resolved' ? 'bg-emerald-100/80 text-emerald-700' : 'bg-red-100/80 text-red-700'}`}>{c.status}</span>
                          </td>
                          <td className="p-4 text-right">
                            <button className="text-[#00A86B] font-bold text-[11px] hover:text-[#009B63] transition-colors">View Docs</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </AdminLayout>
  );
}
