import React from 'react';
import { Package, IndianRupee, Store, Truck, Map, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

const KPI_DATA = [
  { label: 'Total Orders', value: '2,45,320', change: '+12.5%', isUp: true, icon: Package, bg: 'from-[#00A86B] to-[#007BFF]', textColor: 'text-white' },
  { label: 'Total Revenue', value: '₹4.2 Cr', change: '+8.2%', isUp: true, icon: IndianRupee, bg: 'bg-white', textColor: 'text-[#0F172A]' },
  { label: 'Active Sellers', value: '12,540', change: '+15.3%', isUp: true, icon: Store, bg: 'bg-white', textColor: 'text-[#0F172A]' },
  { label: 'Courier Partners', value: '28', change: '+2', isUp: true, icon: Truck, bg: 'bg-white', textColor: 'text-[#0F172A]' },
  { label: 'Total Shipments', value: '18,90,000', change: '+10.1%', isUp: true, icon: Map, bg: 'bg-white', textColor: 'text-[#0F172A]' },
  { label: 'Wallet Balance', value: '₹48.2 L', change: '-2.4%', isUp: false, icon: Wallet, bg: 'bg-white', textColor: 'text-[#0F172A]' },
];

export function AdminKPIs() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {KPI_DATA.map((kpi, idx) => (
        <motion.div 
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          key={idx} 
          className={`relative overflow-hidden rounded-2xl p-5 border cursor-pointer transition-all ${
            kpi.bg.includes('from-') ? `bg-gradient-to-br ${kpi.bg} border-transparent shadow-[0_4px_16px_rgba(0,168,107,0.2)]` : 'bg-white border-[#E2E8F0] shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-[#00A86B]/30'
          }`}
          title={`View ${kpi.label} details`}
        >
          {kpi.bg.includes('from-') && (
            <>
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full"></div>
              <div className="absolute -right-2 -bottom-4 w-12 h-12 bg-white/10 rounded-full"></div>
            </>
          )}
          <div className="flex justify-between items-start mb-3 relative z-10">
            <span className={`text-xs font-semibold ${kpi.textColor === 'text-white' ? 'text-white/80' : 'text-[#64748B]'}`}>
              {kpi.label}
            </span>
            <kpi.icon className={`w-4 h-4 ${kpi.textColor === 'text-white' ? 'text-white/80' : 'text-[#94A3B8]'}`} />
          </div>
          <div className={`text-2xl font-bold ${kpi.textColor} mb-1 relative z-10`}>
            {kpi.value}
          </div>
          <div className={`flex items-center gap-1 text-[10px] font-bold relative z-10 ${
            kpi.textColor === 'text-white' 
              ? 'text-white/90' 
              : (kpi.isUp ? 'text-green-600' : 'text-red-500')
          }`}>
            {kpi.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {kpi.change} vs last month
          </div>
        </motion.div>
      ))}
    </div>
  );
}
