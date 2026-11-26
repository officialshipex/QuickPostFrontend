import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Check, ChevronDown, LayoutGrid, RefreshCcw } from 'lucide-react';
import { useDashboardFilters } from '../../../context/DashboardFilterContext';

/* Dashboard filter bar: quick range pills (Today / 7 / 30 / 90 days), the exact range as a date pill with a
   custom-range popover, and on the right an optional slot (admin user search) + refresh.
   Writes the same DashboardFilterContext the navbar filter used, so data fetching is unchanged. */

const QUICK = [
  { label: 'Today', short: 'Today', days: 1 },
  { label: 'Last 7 Days', short: '7 Days', days: 7 },
  { label: 'Last 30 Days', short: '30 Days', days: 30 },
  { label: 'Last 90 Days', short: '90 Days', days: 90 },
] as const;

const MORE = ['Yesterday', 'This Month', 'Last Month'] as const;

function rangeFor(label: string): { start: Date; end: Date } {
  const start = new Date(); const end = new Date();
  start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 999);
  const q = QUICK.find(x => x.label === label);
  if (q) { start.setDate(start.getDate() - (q.days - 1)); return { start, end }; }
  if (label === 'Yesterday') { start.setDate(start.getDate() - 1); end.setDate(end.getDate() - 1); return { start, end }; }
  if (label === 'This Month') { start.setDate(1); return { start, end }; }
  if (label === 'Last Month') {
    const s = new Date(start.getFullYear(), start.getMonth() - 1, 1);
    const e = new Date(start.getFullYear(), start.getMonth(), 0); e.setHours(23, 59, 59, 999);
    return { start: s, end: e };
  }
  return { start, end };
}

const fmtDay = (d: Date, withYear: boolean) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) });
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function DashboardToolbar({ onRefresh, refreshing = false, right, advanced, onToggleAdvanced }: { onRefresh: () => void; refreshing?: boolean; right?: React.ReactNode; advanced?: boolean; onToggleAdvanced?: () => void }) {
  const { filters, updateFilter } = useDashboardFilters();
  const { start, end, label } = filters.dateRange;
  const [open, setOpen] = useState(false);
  const [cStart, setCStart] = useState(iso(start));
  const [cEnd, setCEnd] = useState(iso(end));
  const [err, setErr] = useState('');
  const popRef = useRef<HTMLDivElement>(null);   // the date pill (anchor)
  const panelRef = useRef<HTMLDivElement>(null); // the popover

  useEffect(() => {
    if (!open) return;
    setCStart(iso(start)); setCEnd(iso(end)); setErr('');
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!popRef.current?.contains(t) && !panelRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const apply = (l: string) => { const r = rangeFor(l); updateFilter('dateRange', { ...r, label: l }); setOpen(false); };
  const applyCustom = () => {
    if (!cStart || !cEnd) { setErr('Pick both dates'); return; }
    const s = new Date(cStart); s.setHours(0, 0, 0, 0);
    const e = new Date(cEnd); e.setHours(23, 59, 59, 999);
    if (s > e) { setErr('Start date is after end date'); return; }
    updateFilter('dateRange', { start: s, end: e, label: 'Custom' });
    setOpen(false);
  };

  const sameYear = start.getFullYear() === end.getFullYear();
  const rangeText = iso(start) === iso(end) ? fmtDay(start, true) : `${fmtDay(start, !sameYear)} – ${fmtDay(end, true)}`;

  return (
    <div className="relative flex flex-col lg:flex-row lg:items-center gap-2.5 lg:gap-3 py-3 border-y border-[#EEF2F6]">
      <div className="flex items-center gap-2.5 min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Quick range pills */}
        <div role="radiogroup" aria-label="Date range" className="relative inline-flex shrink-0 p-1 rounded-full bg-[#F1F5F9]">
          {QUICK.map(q => {
            const on = label === q.label;
            return (
              <button key={q.label} type="button" role="radio" aria-checked={on} onClick={() => apply(q.label)}
                className={`relative h-8 px-3.5 sm:px-4 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors ${on ? 'text-white' : 'text-[#475569] hover:text-[#0F172A]'}`}>
                {on && <motion.span layoutId="dash-range-pill" className="absolute inset-0 rounded-full bg-[#00A86B] shadow-[0_4px_10px_-4px_rgba(0,168,107,0.7)]" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
                <span className="relative">{q.short}</span>
              </button>
            );
          })}
        </div>

        {/* Exact range + custom picker */}
        <div ref={popRef} className="relative shrink-0">
          <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-haspopup="dialog"
            className={`inline-flex items-center gap-2 h-10 pl-3.5 pr-3 rounded-full border bg-white text-[13px] font-semibold text-[#334155] whitespace-nowrap transition-all ${open ? 'border-[#00A86B] ring-4 ring-[#00A86B]/10' : 'border-[#E2E8F0] hover:border-[#CBD5E1]'}`}>
            <Calendar className="w-4 h-4 text-[#94A3B8]" />
            <span className="tabular-nums">{rangeText}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#94A3B8] transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:ml-auto min-w-0">
        {right}
        {onToggleAdvanced && (
          <button type="button" onClick={onToggleAdvanced} aria-pressed={!!advanced}
            title={advanced ? 'Switch to standard dashboard' : 'Switch to advanced dashboard'}
            className={`group relative h-10 shrink-0 rounded-full border inline-flex items-center gap-2 px-3.5 text-[12.5px] font-semibold transition-all active:scale-[0.97] ${
              advanced ? 'bg-[#0F172A] border-[#0F172A] text-white shadow-[0_8px_18px_-10px_rgba(15,23,42,0.8)]' : 'bg-white border-[#E2E8F0] text-[#475569] hover:border-[#00A86B]/50 hover:text-[#00A86B]'}`}>
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">{advanced ? 'Advanced' : 'Advanced view'}</span>
            <span className={`relative w-7 h-4 rounded-full transition-colors ${advanced ? 'bg-[#00A86B]' : 'bg-[#E2E8F0]'}`}>
              <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 34 }}
                className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow" style={{ left: advanced ? 14 : 2 }} />
            </span>
          </button>
        )}
        <button type="button" onClick={onRefresh} title="Refresh data" aria-label="Refresh dashboard"
          className="w-10 h-10 shrink-0 rounded-full border border-[#E2E8F0] bg-white flex items-center justify-center text-[#475569] hover:text-[#00A86B] hover:border-[#00A86B]/50 active:scale-95 transition-all">
          <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Popover lives outside the scroll row so it is never clipped */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute z-[120] mt-[48px] w-[320px] max-w-[calc(100vw-32px)] bg-white rounded-2xl border border-[#EEF2F6] shadow-[0_24px_48px_-16px_rgba(15,23,42,0.28)] p-3"
            style={{ left: popRef.current ? popRef.current.offsetLeft : 0, top: popRef.current ? popRef.current.offsetTop : 0 }}
            ref={panelRef}>
            <div className="grid grid-cols-3 gap-1.5">
              {MORE.map(m => (
                <button key={m} type="button" onClick={() => apply(m)}
                  className={`h-8 rounded-full text-[12px] font-semibold transition-colors ${label === m ? 'bg-[#ECFDF5] text-[#047857]' : 'bg-[#F8FAFC] text-[#475569] hover:bg-[#F1F5F9]'}`}>
                  {label === m && <Check className="inline w-3 h-3 mr-0.5 -mt-0.5" />}{m}
                </button>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-[#F1F5F9]">
              <div className="text-[11.5px] font-semibold uppercase tracking-wide text-[#94A3B8]">Custom range</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="block"><span className="block mb-1 text-[11.5px] text-[#64748B]">From</span>
                  <input type="date" value={cStart} max={cEnd || undefined} onChange={e => setCStart(e.target.value)}
                    className="w-full h-9 px-3 rounded-full border border-[#E2E8F0] text-[12.5px] text-[#0F172A] focus:outline-none focus:border-[#00A86B]" /></label>
                <label className="block"><span className="block mb-1 text-[11.5px] text-[#64748B]">To</span>
                  <input type="date" value={cEnd} min={cStart || undefined} max={iso(new Date())} onChange={e => setCEnd(e.target.value)}
                    className="w-full h-9 px-3 rounded-full border border-[#E2E8F0] text-[12.5px] text-[#0F172A] focus:outline-none focus:border-[#00A86B]" /></label>
              </div>
              {err && <p className="mt-1.5 text-[11.5px] text-red-500">{err}</p>}
              <button type="button" onClick={applyCustom}
                className="mt-3 w-full h-9 rounded-full bg-[#00A86B] hover:bg-[#00965F] text-white text-[12.5px] font-bold transition-colors">Apply range</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
