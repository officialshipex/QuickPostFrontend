import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Check, ChevronDown, Clock, PackageOpen } from 'lucide-react';
import { Sk } from './DashboardSkeleton';
import { currentMonth, last7Range, monthOptions, monthRange, todayRange, useOverviewRange, yesterdayRange } from '../../../hooks/useOverviewRange';

/* Advanced dashboard — compact, month-scoped view.
   Every number comes from /dashboard/getDashboardOverview (per-card month filter; Today / Yesterday / Last 7 days
   share cached requests). Nothing here is mocked. */

const CARD = 'bg-white rounded-xl border border-[#E2E8F0] shadow-sm';
const n = (v: unknown) => Number(v) || 0;

/* ── Month select (portal popover, never clipped) ─────────────────── */
function MonthSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const opts = useMemo(() => monthOptions(), []);
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  useEffect(() => {
    if (!open) return;
    const place = () => { const r = btn.current!.getBoundingClientRect(); setPos({ top: r.bottom + 6, right: window.innerWidth - r.right }); };
    place();
    const down = (e: MouseEvent) => { const t = e.target as Node; if (!btn.current?.contains(t) && !panel.current?.contains(t)) setOpen(false); };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('resize', place); window.addEventListener('scroll', place, true);
    document.addEventListener('mousedown', down); document.addEventListener('keydown', key);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); };
  }, [open]);
  const label = opts.find(o => o.value === value)?.label || value;
  return (
    <>
      <button ref={btn} type="button" onClick={() => setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open}
        className={`inline-flex items-center gap-1.5 h-8 pl-3 pr-2.5 rounded-full border text-[12px] font-medium whitespace-nowrap transition-all ${open ? 'border-[#00A86B] text-[#0F172A] ring-4 ring-[#00A86B]/10' : 'border-[#E2E8F0] text-[#475569] hover:border-[#CBD5E1]'}`}>
        {label}<ChevronDown className={`w-3.5 h-3.5 text-[#94A3B8] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {createPortal(
        <AnimatePresence>
          {open && pos && (
            <motion.div ref={panel} role="listbox" initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.14 }}
              style={{ position: 'fixed', top: pos.top, right: pos.right }}
              className="z-[600] w-[200px] max-h-[300px] overflow-y-auto bg-white rounded-2xl border border-[#EEF2F6] shadow-[0_20px_44px_-14px_rgba(15,23,42,0.3)] p-1.5">
              {opts.map(o => {
                const on = o.value === value;
                return (
                  <button key={o.value} type="button" role="option" aria-selected={on} onClick={() => { onChange(o.value); setOpen(false); }}
                    className={`w-full flex items-center justify-between h-9 px-3 rounded-xl text-[12.5px] transition-colors ${on ? 'bg-[#ECFDF5] text-[#047857] font-semibold' : 'text-[#334155] hover:bg-[#F8FAFC]'}`}>
                    {o.label}{on && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

/* ── KPI card: month total, growth, and Today / Yesterday / Last 7 days ─ */
type Pick = (d: any) => number;
function KpiCard({ title, pick, growth, format, userId, refreshKey }: {
  title: string; pick: Pick; growth?: (d: any) => number | null; format: (v: number) => string; userId: string; refreshKey: number;
}) {
  const [month, setMonth] = useState(currentMonth());
  const mr = useMemo(() => monthRange(month), [month]);
  const t = useMemo(todayRange, []), y = useMemo(yesterdayRange, []), w = useMemo(last7Range, []);
  const M = useOverviewRange(mr.start, mr.end, userId, refreshKey);
  const T = useOverviewRange(t.start, t.end, userId, refreshKey);
  const Y = useOverviewRange(y.start, y.end, userId, refreshKey);
  const W = useOverviewRange(w.start, w.end, userId, refreshKey);
  const g = M.data && growth ? growth(M.data) : null;
  const monthLabel = monthOptions().find(o => o.value === month)?.label || '';
  const rows = [['Today', T], ['Yesterday', Y], ['Last 7 days', W]] as const;

  return (
    <section className={`${CARD} p-5`}>
      <header className="flex items-center justify-between gap-3">
        <h3 className="text-[14px] font-semibold text-[#0F172A]">{title}</h3>
        <MonthSelect value={month} onChange={setMonth} />
      </header>
      <div className="mt-4 flex items-center gap-2 min-h-[32px]">
        {M.loading ? <Sk className="h-7 w-28" /> : (
          <span className="text-[26px] font-bold tracking-[-0.02em] text-[#0F172A] tabular-nums leading-none">{format(M.data ? pick(M.data) : 0)}</span>
        )}
        {!M.loading && g != null && Number.isFinite(g) && (
          <span className={`inline-flex items-center text-[12px] font-semibold tabular-nums ${g >= 0 ? 'text-[#00A86B]' : 'text-red-500'}`} title="vs previous period">
            {g >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}{Math.abs(g).toFixed(1)}%
          </span>
        )}
        {!M.loading && <span className="ml-1 inline-flex items-center h-6 px-2.5 rounded-full bg-[#F0FDF4] text-[11.5px] font-medium text-[#00A86B]">{monthLabel}</span>}
      </div>
      <dl className="mt-4 space-y-1.5">
        {rows.map(([label, r]) => (
          <div key={label} className="flex items-center justify-between text-[12.5px]">
            <dt className="text-[#94A3B8]">{label}</dt>
            <dd className="font-medium text-[#334155] tabular-nums">{r.loading ? <Sk className="h-3.5 w-12" /> : format(r.data ? pick(r.data) : 0)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ── Today's action items ───────────────────────────────────────── */
function ActionItems({ userId, refreshKey }: { userId: string; refreshKey: number }) {
  const t = useMemo(todayRange, []);
  const { data, loading } = useOverviewRange(t.start, t.end, userId, refreshKey);
  const ship = data?.shipmentStats || {}, ndr = data?.ndrStats || {}, delay = data?.delayStats || {};
  const items = [
    { label: 'Orders in Ready to Ship', value: n(ship.readyToShip), icon: PackageOpen, bg: '#E6F7F0', fg: '#00A86B' },
    { label: 'NDR needing action', value: n(ndr.actionRequired), icon: AlertTriangle, bg: '#FFF1F2', fg: '#E11D48' },
    { label: 'Pickup delays', value: n(delay.pickupDelays), icon: Clock, bg: '#FFF7ED', fg: '#EA580C' },
  ];
  return (
    <div>
      <h3 className="mb-3 text-[15px] font-semibold text-[#0F172A]">Today’s Action Items</h3>
      <div className="space-y-3">
        {items.map(it => (
          <div key={it.label} className={`${CARD} px-5 py-4 flex items-center gap-4`}>
            <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: it.bg }}>
              <it.icon className="w-5 h-5" style={{ color: it.fg }} strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <div className="text-[13px] text-[#64748B]">{it.label}</div>
              <div className="mt-0.5 text-[22px] font-bold text-[#0F172A] tabular-nums leading-tight">
                {loading ? <Sk className="h-6 w-10 mt-1" /> : String(it.value).padStart(2, '0')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Overview grid (month filter) ───────────────────────────────── */
function OverviewGrid({ userId, refreshKey }: { userId: string; refreshKey: number }) {
  const [month, setMonth] = useState(currentMonth());
  const r = useMemo(() => monthRange(month), [month]);
  const { data, loading } = useOverviewRange(r.start, r.end, userId, refreshKey);
  const s = data?.shipmentStats || {}, ndr = data?.ndrStats || {};
  const total = n(s.total), pending = n(s.readyToShip);
  const tiles = [
    { label: 'Total Shipments', value: total },
    { label: 'Pickup Pending', value: pending },
    { label: 'Pickup Done', value: total > 0 ? total - pending : 0 },
    { label: 'In Transit', value: n(s.inTransit) + n(s.outForDelivery) },
    { label: 'Delivered', value: n(s.delivered) },
    { label: 'Undelivered', value: n(ndr.undelivered) },
    { label: 'RTO In Transit', value: n(s.rtoInTransit) },
    { label: 'RTO Delivered', value: n(s.rto) },
  ];
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-semibold text-[#0F172A]">Overview</h3>
        <MonthSelect value={month} onChange={setMonth} />
      </div>
      <div className={`${CARD} p-5`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-6">
          {tiles.map(t => (
            <div key={t.label} className="flex flex-col items-center text-center">
              <span className="min-w-[60px] h-[58px] px-3 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center">
                {loading ? <Sk className="h-5 w-8" /> : <span className="text-[18px] font-bold text-[#047857] tabular-nums">{t.value.toLocaleString('en-IN')}</span>}
              </span>
              <span className="mt-2 text-[12.5px] text-[#64748B]">{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdvancedDashboard({ userId = '', refreshKey = 0, fmt, fmtN }: { userId?: string; refreshKey?: number; fmt: (v: number) => string; fmtN: (v: number) => string }) {
  const pct = (v: unknown) => { const x = parseFloat(String(v ?? '')); return Number.isFinite(x) ? x : null; };
  return (
    <div className="mt-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Orders" pick={d => n(d?.orders?.count)} growth={d => pct(d?.orders?.countGrowth)} format={fmtN} userId={userId} refreshKey={refreshKey} />
        <KpiCard title="Revenue" pick={d => n(d?.todaysRevenue)} format={fmt} userId={userId} refreshKey={refreshKey} />
        <KpiCard title="Avg. Shipping Cost" pick={d => n(d?.avgShippingCost)} format={fmt} userId={userId} refreshKey={refreshKey} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <ActionItems userId={userId} refreshKey={refreshKey} />
        <OverviewGrid userId={userId} refreshKey={refreshKey} />
      </div>
    </div>
  );
}
