import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Check, ChevronDown } from 'lucide-react';
import { useDashboardFilters } from '../../../context/DashboardFilterContext';
import { useToast } from '../../../hooks/useToast';
import { Toast } from '../../ui/Toast';

/* Mobile copy of the navbar's desktop date filter (AdminHeader) — same options,
   same date boundaries, same shared dashboard filter. Dropdown opens right-aligned
   so it stays on screen when placed at the right edge. */

const PRESETS = ['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month'];

const getPresetDates = (option: string): { start: Date; end: Date } => {
  const now = new Date();
  const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999);
  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
  switch (option) {
    case 'Today':
      return { start: startOfToday, end: endOfToday };
    case 'Yesterday': {
      const s = new Date(startOfToday); s.setDate(s.getDate() - 1);
      const e = new Date(s); e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
    case 'Last 7 Days': {
      const s = new Date(startOfToday); s.setDate(s.getDate() - 6);
      return { start: s, end: endOfToday };
    }
    case 'This Month':
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: endOfToday };
    case 'Last Month': {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0); e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
    default: {
      const s = new Date(startOfToday); s.setDate(s.getDate() - 29);
      return { start: s, end: endOfToday };
    }
  }
};

const dropdownVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 30 } },
  exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2 } },
};

export function MobileDateFilter({ bare = false }: { bare?: boolean }) {
  const { filters, updateFilter } = useDashboardFilters();
  const { toast, showToast: _showToast, closeToast } = useToast();
  const showToast = (message: string) => _showToast('success', message);
  const [open, setOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const close = () => { setOpen(false); setIsCustomMode(false); };

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => { setOpen(!open); setIsCustomMode(false); }}
        className={`flex items-center gap-1.5 h-9 text-[12px] font-semibold text-[#334155] focus:outline-none max-w-[170px] ${bare ? 'pl-3 pr-2.5 rounded-l-full active:bg-[#F8FAFC]' : 'px-3 rounded-full border border-[#E2E8F0] bg-white shadow-sm'}`}
      >
        <Calendar className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
        <span className="truncate">{filters.dateRange.label}</span>
        <ChevronDown className="w-3 h-3 text-[#94A3B8] shrink-0" />
      </motion.button>

      {open && <div className="fixed inset-0 z-[105] bg-transparent" onClick={close} />}

      <AnimatePresence>
        {open && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)] overflow-hidden z-[110] origin-top-right p-2"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {isCustomMode ? (
              <div className="p-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Custom Range</span>
                  <button onClick={() => setIsCustomMode(false)} className="text-[10px] text-[#00A86B] font-bold hover:underline">
                    Back
                  </button>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Start Date</label>
                  <input type="date" required value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#00A86B] font-medium" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">End Date</label>
                  <input type="date" required value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#00A86B] font-medium" />
                </div>
                <button
                  onClick={() => {
                    if (!customStart || !customEnd) {
                      showToast('Please select both start and end dates.');
                      return;
                    }
                    const start = new Date(customStart); start.setHours(0, 0, 0, 0);
                    const end = new Date(customEnd); end.setHours(23, 59, 59, 999);
                    const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const label = `${fmt(start)} – ${fmt(end)}`;
                    updateFilter('dateRange', { start, end, label });
                    close();
                    showToast(`Date range set to: ${label}`);
                  }}
                  className="w-full h-8 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors"
                >
                  Apply Range
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {PRESETS.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      const { start, end } = getPresetDates(option);
                      updateFilter('dateRange', { start, end, label: option });
                      close();
                      showToast(`Date range set to: ${option}`);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-[13px] font-semibold transition-colors flex items-center justify-between ${
                      filters.dateRange.label === option ? 'bg-[#00A86B]/10 text-[#00A86B]' : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                    }`}
                  >
                    {option}
                    {filters.dateRange.label === option && <Check className="w-4 h-4 text-[#00A86B]" />}
                  </button>
                ))}
                <div className="h-[1px] bg-slate-100 my-1" />
                <button onClick={() => setIsCustomMode(true)} className="w-full text-left px-3 py-1.5 rounded-xl text-[13px] font-semibold text-[#00A86B] hover:bg-[#00A86B]/5 transition-colors">
                  Custom Date...
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
