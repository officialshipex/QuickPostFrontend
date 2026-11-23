import { useState } from 'react';
import { BadgeCheck, Boxes, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { StatusDonut, VsSplit } from './OverviewInsights';

/* Dashboard → Shipments tab: headline cards, same card/type scale as the Overview analytics cards.
   Every figure covers the same shipments (booked with a courier in the selected range), so the splits add up. */

const n = (v: unknown) => Number(v) || 0;
const pctLabel = (p: number, t: number) => `${(t > 0 ? (p / t) * 100 : 0).toFixed(t > 0 ? 1 : 0)}%`;

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="min-w-0 bg-white rounded-xl border border-[#EEF2F6] shadow-[0_1px_2px_rgba(16,24,40,0.03),0_4px_16px_-6px_rgba(16,24,40,0.06)] p-4 md:p-5 flex flex-col">
      <header className="flex items-start justify-between gap-2">
        <h3 className="text-[15px] font-semibold text-[#0F172A]">{title}</h3>
        {action}
      </header>
      {children}
    </section>
  );
}

/** Single figure laid out like one column of VsSplit (label · value · %), so heights line up. */
function Figure({ label, value, sub, subColor = '#94A3B8' }: { label: string; value: string; sub?: string; subColor?: string }) {
  return (
    <div className="mt-3">
      <div className="min-h-[30px] flex items-end text-[11.5px] leading-[15px] text-[#64748B]">{label}</div>
      <div className="mt-1 text-[24px] font-semibold text-[#0F172A] tabular-nums leading-none">{value}</div>
      {sub != null && <div className="mt-1.5 text-[11px] font-medium tabular-nums" style={{ color: subColor }}>{sub}</div>}
    </div>
  );
}

const WEIGHT_COLORS = ['#6D4FC2', '#0DB25B', '#2F80ED', '#F5843B', '#38B6F0', '#7C5E4A', '#E8365D', '#94A3B8'];

/** Clean donut (no on-ring numbers) with total in the centre; legend carries count + %. Hover a slab or row to focus it. */
function WeightCard({ split }: { split: { range: string; count: number }[] }) {
  const data = split.map((w, i) => ({ name: w.range, value: Number(w.count) || 0, color: WEIGHT_COLORS[i % WEIGHT_COLORS.length] }));
  const total = data.reduce((a, d) => a + d.value, 0);
  const [hi, setHi] = useState<number | null>(null);
  const share = (v: number) => (total > 0 ? (v / total) * 100 : 0);
  const ring = total > 0 ? data : [{ name: 'empty', value: 1, color: '#EEF2F7' }];
  return (
    <section className="min-w-0 bg-white rounded-xl border border-[#EEF2F6] shadow-[0_1px_2px_rgba(16,24,40,0.03),0_4px_16px_-6px_rgba(16,24,40,0.06)] p-4 md:p-5 flex flex-col">
      <h3 className="text-[15px] font-semibold text-[#0F172A]">Shipments by Weight</h3>
      <div className="flex-1 mt-2 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full sm:w-[58%] h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={ring} dataKey="value" nameKey="name" innerRadius={86} outerRadius={104} paddingAngle={total > 0 && data.filter(d => d.value > 0).length > 1 ? 1.5 : 0}
                cornerRadius={4} stroke="none" startAngle={90} endAngle={-270} label={false} labelLine={false} isAnimationActive
                onMouseLeave={() => setHi(null)}>
                {ring.map((d, i) => (
                  <Cell key={d.name} fill={d.color} onMouseEnter={() => total > 0 && setHi(i)}
                    style={{ outline: 'none', transition: 'opacity 200ms ease', opacity: hi == null || hi === i ? 1 : 0.45, cursor: total > 0 ? 'pointer' : 'default' }} />
                ))}
              </Pie>
              {total > 0 && <Tooltip formatter={(v: any, n: any) => [`${Number(v).toLocaleString('en-IN')} (${share(Number(v)).toFixed(2)}%)`, n]} contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12 }} />}
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[22px] font-semibold text-[#0F172A] tabular-nums leading-none">{(hi != null ? data[hi].value : total).toLocaleString('en-IN')}</span>
            <span className="mt-1 text-[11px] text-[#94A3B8]">{hi != null ? data[hi].name : 'Shipments'}</span>
          </div>
        </div>
        <ul className="w-full sm:flex-1 space-y-1">
          {data.length === 0 && <li className="text-[12.5px] text-[#94A3B8]">No weight data for this range yet.</li>}
          {data.map((d, i) => (
            <li key={d.name} onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)}
              className={`flex items-center gap-2.5 px-2 py-1.5 -mx-2 rounded-lg transition-colors ${hi === i ? 'bg-[#F8FAFC]' : ''}`}>
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
              <span className="flex-1 min-w-0 truncate text-[13px] text-[#334155]">{d.name}</span>
              <span className="text-[12.5px] font-semibold text-[#0F172A] tabular-nums">{d.value.toLocaleString('en-IN')}</span>
              <span className="w-14 text-right text-[11.5px] text-[#94A3B8] tabular-nums">{share(d.value).toFixed(2)}%</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer insights — fills the card bottom with useful read-outs */}
      {(() => {
        const top = data.reduce<typeof data[number] | null>((m, d) => (!m || d.value > m.value ? d : m), null);
        const firstTwo = data.slice(0, 2).reduce((a, d) => a + d.value, 0);
        const heavy = data.slice(-2).reduce((a, d) => a + d.value, 0);
        const cells = [
          { label: 'Most shipped slab', value: total > 0 && top ? top.name : '—', sub: total > 0 && top ? `${share(top.value).toFixed(1)}% of shipments` : 'No data yet' },
          { label: 'Lightweight share', value: total > 0 ? `${share(firstTwo).toFixed(1)}%` : '—', sub: data.length ? `${data.slice(0, 2).map(d => d.name).join(' + ')}` : 'First two slabs' },
          { label: 'Heavy share', value: total > 0 ? `${share(heavy).toFixed(1)}%` : '—', sub: data.length ? `${data.slice(-2).map(d => d.name).join(' + ')}` : 'Last two slabs' },
        ];
        return (
          <div className="mt-4 pt-4 border-t border-[#F1F5F9] grid grid-cols-3 divide-x divide-[#F1F5F9]">
            {cells.map(c => (
              <div key={c.label} className="min-w-0 px-3 first:pl-0 last:pr-0">
                <div className="text-[11px] text-[#94A3B8] truncate">{c.label}</div>
                <div className="mt-1 text-[15px] font-semibold text-[#0F172A] tabular-nums truncate">{c.value}</div>
                <div className="mt-0.5 text-[11px] text-[#64748B] truncate">{c.sub}</div>
              </div>
            ))}
          </div>
        );
      })()}
    </section>
  );
}

/** Courier split: ranked list with brand logo, share bar, count and %; leader called out on top. */
function CourierSplitCard({ split, courierIcon }: { split: { name: string; value: number }[]; courierIcon?: (n: string) => string | null | undefined }) {
  const rows = [...split].map(c => ({ name: c.name, value: Number(c.value) || 0 })).sort((a, b) => b.value - a.value);
  const total = rows.reduce((a, r) => a + r.value, 0);
  const max = rows[0]?.value || 0;
  const share = (v: number) => (total > 0 ? (v / total) * 100 : 0);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? rows : rows.slice(0, 7);
  const initials = (n: string) => n.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const Logo = ({ name, size = 'w-9 h-9' }: { name: string; size?: string }) => {
    const icon = courierIcon?.(name);
    return (
      <span className={`${size} rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 overflow-hidden p-1`}>
        {icon ? <img src={icon} alt="" className="w-full h-full object-contain" /> : <span className="text-[10px] font-bold text-[#475569]">{initials(name)}</span>}
      </span>
    );
  };
  return (
    <section className="min-w-0 bg-white rounded-xl border border-[#EEF2F6] shadow-[0_1px_2px_rgba(16,24,40,0.03),0_4px_16px_-6px_rgba(16,24,40,0.06)] p-4 md:p-5 flex flex-col">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-semibold text-[#0F172A]">Courier Split</h3>
        <span className="text-[12px] text-[#64748B]">{rows.length} courier{rows.length === 1 ? '' : 's'} · <span className="font-semibold text-[#0F172A] tabular-nums">{total.toLocaleString('en-IN')}</span> shipments</span>
      </div>

      {rows.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-10 text-[12.5px] text-[#94A3B8]">No shipments in this range yet.</div>
      ) : (
        <>
          {/* Leader */}
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] px-3.5 py-3">
            <Logo name={rows[0].name} size="w-10 h-10" />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[#047857]">Most used courier</div>
              <div className="text-[14px] font-semibold text-[#0F172A] truncate">{rows[0].name}</div>
            </div>
            <div className="text-right">
              <div className="text-[18px] font-semibold text-[#0F172A] tabular-nums leading-none">{share(rows[0].value).toFixed(1)}%</div>
              <div className="mt-1 text-[11px] text-[#64748B] tabular-nums">{rows[0].value.toLocaleString('en-IN')} shipments</div>
            </div>
          </div>

          {/* Ranked list */}
          <ul className="mt-3 flex-1 flex flex-col justify-evenly divide-y divide-[#F1F5F9]">
            {visible.map((r, i) => (
              <li key={r.name} className="py-2.5 flex items-center gap-3">
                <span className="w-5 text-[12px] font-semibold text-[#94A3B8] tabular-nums text-center">{i + 1}</span>
                <Logo name={r.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[13px] font-medium text-[#0F172A] truncate">{r.name}</span>
                    <span className="text-[12.5px] tabular-nums shrink-0"><span className="font-semibold text-[#0F172A]">{r.value.toLocaleString('en-IN')}</span> <span className="text-[#94A3B8]">· {share(r.value).toFixed(1)}%</span></span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-[#F1F5F9] overflow-hidden">
                    <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${max > 0 ? (r.value / max) * 100 : 0}%`, background: i === 0 ? '#00A86B' : '#2F80ED' }} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {rows.length > 7 && (
            <button type="button" onClick={() => setShowAll(v => !v)} className="mt-2 self-start text-[12.5px] font-semibold text-[#00A86B] hover:underline">
              {showAll ? 'Show less' : `Show all ${rows.length}`}
            </button>
          )}
        </>
      )}
    </section>
  );
}

/** Compact semi-circle meter: gradient arc sweeps to the value, end marker, % in the centre. */
function Meter({ id, value, color, light, label, sub }: { id: string; value: number; color: string; light: string; label: string; sub: string }) {
  const v = Math.max(0, Math.min(100, value));
  const R = 54, CX = 66, CY = 70, C = Math.PI * R;
  const ang = Math.PI * (1 - v / 100);
  return (
    <div className="flex flex-col items-center min-w-0">
      <div className="relative w-[200px] h-[118px] shrink-0">
        <svg viewBox="0 0 132 80" className="w-full h-full" aria-label={`${label} ${v.toFixed(1)}%`}>
          <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={light} /><stop offset="100%" stopColor={color} /></linearGradient></defs>
          <path d="M12 70 A54 54 0 0 1 120 70" fill="none" stroke="#EEF2F7" strokeWidth={11} strokeLinecap="round" />
          <motion.path d="M12 70 A54 54 0 0 1 120 70" fill="none" stroke={`url(#${id})`} strokeWidth={11} strokeLinecap="round"
            strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - v / 100) }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} />
          {v > 0 && <motion.circle r={4.5} fill="#fff" stroke={color} strokeWidth={3} initial={{ cx: 12, cy: 70 }} animate={{ cx: CX + R * Math.cos(ang), cy: CY - R * Math.sin(ang) }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} />}
        </svg>
        <span className="absolute inset-x-0 bottom-0 text-center text-[28px] font-bold tabular-nums leading-none" style={{ color }}>{v.toFixed(1)}%</span>
      </div>
      <div className="mt-2 text-center min-w-0">
        <div className="text-[14px] font-semibold text-[#0F172A]">{label}</div>
        <div className="mt-0.5 text-[12.5px] text-[#64748B] tabular-nums">{sub}</div>
      </div>
    </div>
  );
}

/** Pickup & Delivery Performance — compact: one journey strip (Booked › Picked up › In transit › Delivered)
    and two rate meters. Same formulas as the old Overview card. */
function PickupDeliveryCard({ ship }: { ship: any }) {
  // ship.total = shipments booked in the range (never-shipped and cancelled orders excluded)
  const total = n(ship.total);
  const notPicked = n(ship.readyToShip) + n(ship.processing);
  const pickedUp = Math.max(total - notPicked, 0);
  const inFlight = n(ship.inTransit) + n(ship.outForDelivery);
  const delivered = n(ship.delivered);
  const rto = n(ship.rtoInitiated) + n(ship.rtoInTransitInRange) + n(ship.rto);   // same shipments, RTO at any stage
  const pickupRate = total > 0 ? (pickedUp / total) * 100 : 0;
  const deliveryRate = total > 0 ? (delivered / total) * 100 : 0;
  const stages = [
    { label: 'Booked', value: total, color: '#475569' },
    { label: 'Picked up', value: pickedUp, color: '#6D4FC2' },
    { label: 'In transit', value: inFlight, color: '#2F80ED' },
    { label: 'Delivered', value: delivered, color: '#0DB25B' },
  ];
  const meters = [
    { label: 'Pickup rate', value: pickupRate, color: '#6D4FC2', sub: `${pickedUp.toLocaleString('en-IN')} / ${total.toLocaleString('en-IN')}` },
    { label: 'Delivery rate', value: deliveryRate, color: '#0DB25B', sub: `${delivered.toLocaleString('en-IN')} / ${total.toLocaleString('en-IN')}` },
  ];
  return (
    <section className="min-w-0 h-full bg-white rounded-xl border border-[#EEF2F6] shadow-[0_1px_2px_rgba(16,24,40,0.03),0_4px_16px_-6px_rgba(16,24,40,0.06)] p-4 md:p-5 flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-[15px] font-semibold text-[#0F172A]">Pickup &amp; Delivery Performance</h3>
        <div className="flex flex-wrap gap-2 text-[12px]">
          <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-amber-50 text-amber-700">Not yet picked <b className="font-semibold tabular-nums">{notPicked.toLocaleString('en-IN')}</b></span>
          <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-red-50 text-red-700">RTO <b className="font-semibold tabular-nums">{rto.toLocaleString('en-IN')}</b></span>
        </div>
      </div>

      {/* Journey strip */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 rounded-xl border border-[#EEF2F6] overflow-hidden">
        {stages.map((st, i) => (
          <div key={st.label} className={`relative min-w-0 px-4 py-3 ${i > 0 ? 'sm:border-l border-[#EEF2F6]' : ''} ${i >= 2 ? 'border-t sm:border-t-0 border-[#EEF2F6]' : ''} ${i % 2 === 1 ? 'border-l border-[#EEF2F6]' : ''}`}>
            <div className="flex items-center justify-center gap-1.5 text-[12px] font-medium text-[#64748B]">
              <span className="w-2 h-2 rounded-full" style={{ background: st.color }} />{st.label}
            </div>
            <div className="mt-1 text-center text-[22px] font-bold text-[#0F172A] tabular-nums leading-tight">{st.value.toLocaleString('en-IN')}</div>
            {i < stages.length - 1 && (
              <span aria-hidden className="hidden sm:flex absolute -right-[9px] top-1/2 -translate-y-1/2 z-10 w-[18px] h-[18px] rounded-full bg-white border border-[#E2E8F0] items-center justify-center text-[#94A3B8] text-[11px] leading-none">›</span>
            )}
          </div>
        ))}
      </div>

      {/* Rate meters */}
      <div className="mt-4 flex-1 grid grid-cols-1 sm:grid-cols-2 items-center gap-4 rounded-xl bg-[#FAFBFC] border border-[#EEF2F6] py-5">
        <Meter id="m-pickup" value={pickupRate} color="#6D4FC2" light="#C4B5FD" label="Pickup rate" sub={meters[0].sub} />
        <Meter id="m-delivery" value={deliveryRate} color="#0DB25B" light="#86EFAC" label="Delivery rate" sub={meters[1].sub} />
      </div>
    </section>
  );
}

export function ShipmentsTab({ ship = {}, fmt, weightSplit = [], couriersSplit = [], courierIcon, attempts = {} }: { ship?: any; fmt: (v: any) => string; weightSplit?: { range: string; count: number }[]; couriersSplit?: { name: string; value: number }[]; courierIcon?: (n: string) => string | null | undefined; attempts?: { first?: number; second?: number; third?: number; more?: number } }) {
  const total = n(ship.total);
  const delivered = n(ship.delivered);
  // Delivered shipments by attempt (1 + NDR rounds before delivery); adds up to Delivered
  const attemptRows = [
    { name: '1st attempt delivery', value: n(attempts.first), color: '#0DB25B' },
    { name: '2nd attempt delivery', value: n(attempts.second), color: '#6D4FC2' },
    { name: '3rd attempt delivery', value: n(attempts.third), color: '#F5843B' },
    { name: '> 3rd attempt delivery', value: n(attempts.more), color: '#E8365D' },
  ];
  const attemptTotal = attemptRows.reduce((a, r) => a + r.value, 0);

  return (
    <div className="space-y-3">
    {/* Compact KPI tiles on the left, journey/performance on the right */}
    <div className="grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)] gap-3">
      <div className="grid grid-cols-2 xl:grid-cols-1 gap-3">
        <section className="min-w-0 h-full bg-white rounded-xl border border-[#EEF2F6] shadow-[0_1px_2px_rgba(16,24,40,0.03),0_4px_16px_-6px_rgba(16,24,40,0.06)] p-4 flex flex-col justify-center gap-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-[14px] font-medium text-[#475569]">Total Shipments</h3>
              <div className="mt-1.5 text-[28px] font-semibold text-[#0F172A] tabular-nums leading-tight tracking-[-0.02em]">{total.toLocaleString('en-IN')}</div>
            </div>
            <Boxes className="w-7 h-7 md:w-8 md:h-8 text-[#00A86B] shrink-0" strokeWidth={1.4} fill="currentColor" fillOpacity={0.12} />
          </div>
          <div className="text-[12px] text-[#94A3B8]">in selected range</div>
        </section>
        <section className="min-w-0 h-full bg-white rounded-xl border border-[#EEF2F6] shadow-[0_1px_2px_rgba(16,24,40,0.03),0_4px_16px_-6px_rgba(16,24,40,0.06)] p-4 flex flex-col justify-center gap-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-[14px] font-medium text-[#475569]">Delivery Metrics</h3>
              <div className="mt-1.5 text-[28px] font-semibold text-[#0F172A] tabular-nums leading-tight tracking-[-0.02em]">{delivered.toLocaleString('en-IN')}</div>
            </div>
            <BadgeCheck className="w-7 h-7 md:w-8 md:h-8 text-[#00A86B] shrink-0" strokeWidth={1.4} fill="currentColor" fillOpacity={0.12} />
          </div>
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-[#64748B]">Delivery rate</span>
            <span className="text-[14px] font-bold text-[#0DB25B] tabular-nums">{pctLabel(delivered, total)}</span>
          </div>
          <div className="-mt-1 h-2 rounded-full bg-[#EEF2F7] overflow-hidden">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-[#34D399] to-[#0DB25B]"
              initial={{ width: 0 }} animate={{ width: `${total > 0 ? (delivered / total) * 100 : 0}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
          </div>
        </section>
      </div>
      <PickupDeliveryCard ship={ship} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
      <WeightCard split={weightSplit} />
      <CourierSplitCard split={couriersSplit} courierIcon={courierIcon} />
      <section className="min-w-0 bg-white rounded-xl border border-[#EEF2F6] shadow-[0_1px_2px_rgba(16,24,40,0.03),0_4px_16px_-6px_rgba(16,24,40,0.06)] p-4 md:p-5 flex flex-col">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[15px] font-semibold text-[#0F172A]">Delivery Attempts</h3>
          <span className="text-[12px] text-[#64748B]">Delivered: <span className="font-semibold text-[#0F172A] tabular-nums">{attemptTotal.toLocaleString('en-IN')}</span></span>
        </div>
        <div className="mt-2">
          <StatusDonut total={attemptTotal} data={attemptRows} />
        </div>
      </section>
    </div>
    </div>
  );
}
