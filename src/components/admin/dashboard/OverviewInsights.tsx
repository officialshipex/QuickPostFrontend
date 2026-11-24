import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCardLinks } from './cardLinks';
import { AnimatePresence, motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ArrowUpDown, BarChart3, ChevronRight, Table2 } from 'lucide-react';

/* Overview analytics shown under "Action Needed" on the dashboard. Every figure comes from
   /dashboard/getDashboardOverview (+ zone counts from getOverviewCardData, payment split from getOverviewGraphsData).
   All shipment figures cover the same set — orders booked with a courier in the selected range — so each
   breakdown adds up to Total Shipments. */

type Num = number | undefined | null;
const n = (v: Num) => Number(v) || 0;
const pct = (part: number, total: number) => (total > 0 ? (part / total) * 100 : 0);
const pctLabel = (part: number, total: number) => `${pct(part, total).toFixed(total > 0 ? 1 : 0)}%`;

const C = {
  pickup: '#F59E0B', transit: '#3B82F6', ofd: '#8B5CF6', delivered: '#00A86B', ndr: '#F97316', rto: '#EF4444',
  muted: '#E2E8F0',
};

/* ── building blocks ───────────────────────────────────────────────── */
function Card({ title, sub, action, children, className = '' }: { title: string; sub?: string; action?: { label: string; to: string }; children: React.ReactNode; className?: string }) {
  const linksOn = useCardLinks();
  return (
    <section className={`min-w-0 bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4 md:p-5 flex flex-col ${className}`}>
      <header className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-[14px] md:text-[15px] font-semibold text-[#0F172A] leading-tight">{title}</h3>
          {sub && <p className="mt-0.5 text-[11.5px] text-[#94A3B8]">{sub}</p>}
        </div>
        {action && linksOn && (
          <Link to={action.to} className="shrink-0 inline-flex items-center gap-0.5 text-[12px] font-semibold text-[#00A86B] hover:underline">
            {action.label}<ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}

/** One bar split into coloured segments; grey when there is nothing to show. */
function SplitBar({ parts, height = 10 }: { parts: { value: number; color: string; label: string }[]; height?: number }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  return (
    <div className="w-full flex overflow-hidden rounded-full bg-[#F1F5F9]" style={{ height }} role="img"
      aria-label={parts.map(p => `${p.label} ${pctLabel(p.value, total)}`).join(', ')}>
      {total > 0 && parts.map(p => p.value > 0 && (
        <span key={p.label} title={`${p.label}: ${p.value} (${pctLabel(p.value, total)})`}
          className="h-full transition-[width] duration-500 first:rounded-l-full last:rounded-r-full" style={{ width: `${pct(p.value, total)}%`, background: p.color }} />
      ))}
    </div>
  );
}

/** Figures shown side by side above a split bar (Delivered | RTO | Undelivered …). */
function Figures({ items, total }: { items: { label: string; value: number; color: string; to?: string }[]; total: number }) {
  const linksOn = useCardLinks();
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0,1fr))` }}>
      {items.map((it, i) => {
        const body = (
          <>
            <div className="flex items-center gap-1.5 text-[11.5px] text-[#64748B] truncate">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: it.color }} />{it.label}
            </div>
            <div className="mt-1 text-[20px] md:text-[22px] font-bold text-[#0F172A] tabular-nums leading-none">{it.value.toLocaleString('en-IN')}</div>
            <div className="mt-1 text-[11px] font-medium text-[#94A3B8] tabular-nums">{pctLabel(it.value, total)}</div>
          </>
        );
        const cls = `min-w-0 ${i > 0 ? 'pl-3 border-l border-[#F1F5F9]' : ''}`;
        return it.to && linksOn ? <Link key={it.label} to={it.to} className={`${cls} group hover:[&_div:nth-child(2)]:text-[#00A86B]`}>{body}</Link> : <div key={it.label} className={cls}>{body}</div>;
      })}
    </div>
  );
}

function Donut({ data, centerValue, centerLabel }: { data: { name: string; value: number; color: string }[]; centerValue: string; centerLabel: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const chart = total > 0 ? data.filter(d => d.value > 0) : [{ name: 'empty', value: 1, color: C.muted }];
  return (
    <div className="relative w-[156px] h-[156px] shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chart} dataKey="value" innerRadius={52} outerRadius={74} paddingAngle={total > 0 && chart.length > 1 ? 2 : 0} stroke="none" startAngle={90} endAngle={-270} isAnimationActive>
            {chart.map(d => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          {total > 0 && <Tooltip formatter={(v: any, name: any) => [`${Number(v).toLocaleString('en-IN')} (${pctLabel(Number(v), total)})`, name]} contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12 }} />}
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[20px] font-bold text-[#0F172A] tabular-nums leading-none">{centerValue}</span>
        <span className="mt-1 text-[10.5px] font-medium text-[#94A3B8]">{centerLabel}</span>
      </div>
    </div>
  );
}

function Legend({ data, total }: { data: { name: string; value: number; color: string; to?: string }[]; total: number }) {
  const linksOn = useCardLinks();
  return (
    <ul className="flex-1 min-w-0 space-y-1">
      {data.map(d => {
        const row = (
          <>
            <span className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ background: d.color }} />
            <span className="flex-1 min-w-0 truncate text-[12.5px] text-[#475569]">{d.name}</span>
            <span className="text-[12.5px] font-semibold text-[#0F172A] tabular-nums">{d.value.toLocaleString('en-IN')}</span>
            <span className="w-12 text-right text-[11px] text-[#94A3B8] tabular-nums">{pctLabel(d.value, total)}</span>
          </>
        );
        return (
          <li key={d.name}>
            {d.to && linksOn
              ? <Link to={d.to} className="flex items-center gap-2 px-2 py-1.5 -mx-2 rounded-lg hover:bg-[#F8FAFC] transition-colors">{row}</Link>
              : <div className="flex items-center gap-2 px-2 py-1.5 -mx-2">{row}</div>}
          </li>
        );
      })}
    </ul>
  );
}

/** Ring with rounded segments, % labels outside on short leader lines, dot legend underneath.
    With no data the ring still shows every status in equal parts (all labelled 0%). */
export function StatusDonut({ data, total }: { data: { name: string; value: number; color: string }[]; total: number }) {
  const ring = data.map(d => ({ ...d, slice: total > 0 ? d.value : 1 }));
  const RAD = Math.PI / 180;
  const label = ({ cx, cy, midAngle, outerRadius, index }: any) => {
    const d = ring[index];
    if (total > 0 && d.value === 0) return null;
    const cos = Math.cos(-midAngle * RAD), sin = Math.sin(-midAngle * RAD);
    const sx = cx + (outerRadius + 3) * cos, sy = cy + (outerRadius + 3) * sin;
    const mx = cx + (outerRadius + 11) * cos, my = cy + (outerRadius + 11) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 6;
    return (
      <g>
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${my}`} stroke={d.color} strokeWidth={2} fill="none" strokeLinecap="round" />
        <text x={ex + (cos >= 0 ? 4 : -4)} y={my} dy={4} textAnchor={cos >= 0 ? 'start' : 'end'} fontSize={12} fill="#334155">
          {pctLabel(d.value, total).replace('.0%', '%')}
        </text>
      </g>
    );
  };
  // Clicked slice: grows out of the ring and shows a callout (dot · name · count) at its middle.
  const [sel, setSel] = useState<number | null>(null);
  const ringTotal = ring.reduce((a, d) => a + d.slice, 0);
  const callout = (() => {
    if (sel == null) return null;
    const before = ring.slice(0, sel).reduce((a, d) => a + d.slice, 0);
    const mid = 90 - ((before + ring[sel].slice / 2) / ringTotal) * 360;   // degrees, clockwise from 12 o'clock
    const r = 97;
    return { x: Math.cos(mid * RAD) * r, y: -Math.sin(mid * RAD) * r };
  })();
  return (
    <div className="flex flex-col items-center -mt-[5px]">
      <div className="relative w-full h-[270px]" onClick={() => setSel(null)}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={ring} dataKey="slice" nameKey="name" innerRadius={84} outerRadius={110} paddingAngle={3} cornerRadius={7}
              stroke="none" startAngle={90} endAngle={-270} label={label} labelLine={false} isAnimationActive
              onClick={(_: any, i: number, e: any) => { e?.stopPropagation?.(); setSel(cur => (cur === i ? null : i)); }}>
              {ring.map((d, i) => (
                <Cell key={d.name} fill={d.color} cursor="pointer"
                  style={{
                    outline: 'none', transformBox: 'view-box', transformOrigin: 'center',
                    transform: sel === i ? 'scale(1.07)' : 'scale(1)',
                    opacity: sel == null || sel === i ? 1 : 0.55,
                    transition: 'transform 280ms cubic-bezier(0.22,1,0.36,1), opacity 220ms ease',
                  }} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <AnimatePresence>
          {sel != null && callout && (
            <motion.div key={sel}
              initial={{ opacity: 0, scale: 0.9, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute z-10 pointer-events-none whitespace-nowrap inline-flex items-center gap-2.5 h-9 pl-3 pr-3.5 rounded-lg bg-white border border-[#E2E8F0] shadow-[0_8px_24px_-8px_rgba(15,23,42,0.25)]"
              style={{ left: `calc(50% + ${callout.x}px)`, top: `calc(50% + ${callout.y}px)`, translate: '-50% -50%' }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: ring[sel].color }} />
              <span className="text-[14px] text-[#334155]">{ring[sel].name}</span>
              <span className="ml-2 text-[14px] font-bold text-[#0F172A] tabular-nums">{ring[sel].value.toLocaleString('en-IN')}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <ul className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-2">
        {data.map((d, i) => (
          <li key={d.name}>
            <button type="button" onClick={() => setSel(cur => (cur === i ? null : i))}
              className={`inline-flex items-center gap-2 text-[13px] transition-opacity ${sel == null || sel === i ? 'text-[#475569]' : 'text-[#475569] opacity-50'}`}>
              <span className="w-3 h-3 rounded-full" style={{ background: d.color }} />{d.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** "A vs B vs C" figures (first left, middle centred, last right) over one thick split bar. */
export function VsSplit({ items }: { items: { label: string; value: number; color: string }[] }) {
  const t = items.reduce((x, y) => x + y.value, 0);
  const cols = items.map(() => '1fr').join('_auto_');
  const align = (i: number) => (i === 0 ? 'flex-start' : i === items.length - 1 ? 'flex-end' : 'center');
  const text = (i: number) => (i === 0 ? 'text-left' : i === items.length - 1 ? 'text-right' : 'text-center');
  return (
    <>
      <div className="mt-3 grid items-center gap-2" style={{ gridTemplateColumns: cols.replace(/_/g, ' ') }}>
        {items.map((it, i) => (
          <div key={it.label} className="contents">
            {i > 0 && <span className="text-[11px] text-[#94A3B8] self-center">vs</span>}
            <div className={`min-w-0 ${text(i)}`}>
              <div className="min-h-[30px] flex items-end text-[11.5px] leading-[15px] text-[#64748B] break-words" style={{ justifyContent: align(i) }}>{it.label}</div>
              <div className="mt-1 text-[24px] font-semibold text-[#0F172A] tabular-nums leading-none">{it.value.toLocaleString('en-IN')}</div>
              <div className="mt-1.5 text-[11px] font-medium tabular-nums" style={{ color: it.color }}>{pctLabel(it.value, t)}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 h-[18px] w-full rounded-full bg-[#EEF2F7] overflow-hidden flex gap-[2px]">
        {t > 0 && items.map(it => it.value > 0 && (
          <span key={it.label} title={`${it.label}: ${it.value} (${pctLabel(it.value, t)})`}
            className="h-full first:rounded-l-full last:rounded-r-full transition-[width] duration-700 ease-out"
            style={{ width: `${pct(it.value, t)}%`, background: `linear-gradient(180deg, ${it.color}, ${it.color}D9)` }} />
        ))}
      </div>
    </>
  );
}

type ZoneRow = { zone: string; inTransit: number; pickup: number; rto: number; delivered: number; ndr: number; lost: number; other: number; tat: number | null };
const ZS_SERIES = [
  { key: 'inTransit', label: 'In-Transit', color: '#2F80ED' },
  { key: 'pickup', label: 'Pickup', color: '#6D4FC2' },
  { key: 'rto', label: 'RTO', color: '#E8365D' },
  { key: 'delivered', label: 'Delivered', color: '#0DB25B' },
  { key: 'ndr', label: 'NDR', color: '#F5843B' },
  { key: 'lost', label: 'Lost', color: '#64748B' },
  { key: 'other', label: 'Other', color: '#CBD5E1' },
] as const;

/** Zone × status: stacked bars per zone, or a sortable table (toggle top-right). */
function ZoneStatusCard({ rows }: { rows: ZoneRow[] }) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>({ key: 'total', dir: -1 });
  const data = rows.map(r => ({ ...r, total: r.inTransit + r.pickup + r.rto + r.delivered + r.ndr + r.lost + r.other }));
  // Lost / Other only appear when some zone has them
  const series = ZS_SERIES.filter(sr => (sr.key !== 'lost' && sr.key !== 'other') || data.some(r => r[sr.key] > 0));
  const sorted = [...data].sort((a: any, b: any) => {
    const x = a[sort.key], y = b[sort.key];
    return (typeof x === 'string' ? String(x).localeCompare(y) : (x ?? -1) - (y ?? -1)) * sort.dir;
  });
  const cols = [{ key: 'zone', label: 'Zone' }, { key: 'total', label: 'Total' }, ...series.map(s => ({ key: s.key, label: s.label })), { key: 'tat', label: 'Avg. delivery' }];
  const ToggleIcon = view === 'chart' ? Table2 : BarChart3;

  return (
    <section className="min-w-0 bg-white rounded-xl border border-[#EEF2F6] shadow-[0_1px_2px_rgba(16,24,40,0.03),0_4px_16px_-6px_rgba(16,24,40,0.06)] p-4 md:p-5 flex flex-col">
      <header className="flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-semibold text-[#0F172A]">Zone Distribution of Shipment Status</h3>
        <button type="button" onClick={() => setView(v => (v === 'chart' ? 'table' : 'chart'))}
          title={view === 'chart' ? 'Show table' : 'Show chart'} aria-label={view === 'chart' ? 'Show table' : 'Show chart'}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors">
          <ToggleIcon className="w-4 h-4" />
        </button>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        {view === 'chart' ? (
          <motion.div key="chart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="mt-4">
            <div className="h-[300px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="30%">
                  <CartesianGrid vertical={false} stroke="#EEF2F7" />
                  <YAxis width={36} axisLine={false} tickLine={false} allowDecimals={false} domain={[0, (m: number) => Math.max(4, Math.ceil(m * 1.15))]} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <XAxis dataKey="zone" axisLine={{ stroke: '#CBD5E1' }} tickLine={false} tick={{ fontSize: 12, fill: '#475569' }} />
                  <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12 }} />
                  {series.map((sr, i) => (
                    <Bar key={sr.key} dataKey={sr.key} name={sr.label} stackId="z" fill={sr.color} maxBarSize={48} animationDuration={700}
                      radius={i === series.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2">
              {series.map(sr => (
                <li key={sr.key} className="inline-flex items-center gap-2 text-[13px] text-[#475569]">
                  <span className="w-3 h-3 rounded-full" style={{ background: sr.color }} />{sr.label}
                </li>
              ))}
            </ul>
          </motion.div>
        ) : (
          <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  {cols.map(c => {
                    const active = sort.key === c.key;
                    return (
                      <th key={c.key} className="py-3 px-2 text-center font-medium text-[#64748B] first:text-left">
                        <button type="button" onClick={() => setSort(cur => ({ key: c.key, dir: cur.key === c.key ? (cur.dir === 1 ? -1 : 1) : -1 }))}
                          className={`inline-flex items-center gap-1 hover:text-[#0F172A] transition-colors ${active ? 'text-[#0F172A]' : ''}`}>
                          {c.label}
                          <ArrowUpDown className={`w-3 h-3 ${active ? 'text-[#00A86B]' : 'text-[#CBD5E1]'}`} />
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {sorted.map(r => (
                  <tr key={r.zone} className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-2 font-medium text-[#0F172A]">{r.zone}</td>
                    <td className="py-3 px-2 text-center font-semibold text-[#0F172A] tabular-nums">{r.total.toLocaleString('en-IN')}</td>
                    {series.map(sr => (
                      <td key={sr.key} className="py-3 px-2 text-center text-[#475569] tabular-nums">{(r as any)[sr.key].toLocaleString('en-IN')}</td>
                    ))}
                    <td className="py-3 px-2 text-center text-[#475569] tabular-nums" title="Average days from booking to delivery">{r.tat != null ? `${r.tat} d` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ── main ──────────────────────────────────────────────────────────── */
export function OverviewInsights({ ship = {}, ndr = {}, overview = {}, zones = [], navBase, rangeQ, fmt, isAdminView, codSlot, paymentMode = [] }: {
  ship?: any; ndr?: any; overview?: any; zones?: { zone: string; label: string; count?: number; percentage?: number }[];
  navBase: string; rangeQ: string; fmt: (v: any) => string; isAdminView?: boolean; codSlot?: React.ReactNode; paymentMode?: { name: string; value: number }[];
}) {
  /* Shipment by status — every shipment booked in the range sits in exactly one bucket (sum = Total Shipments) */
  const sRto = n(ship.rtoInitiated) + n(ship.rtoInTransitInRange) + n(ship.rto);   // RTO at any stage
  const sNdr = n(ship.undelivered) + n(ship.actionRequested);                      // NDR still open
  const status = [
    { name: 'Intransit', value: n(ship.inTransit) + n(ship.outForDelivery), color: '#2F80ED' },
    { name: 'Pickup', value: n(ship.readyToShip) + n(ship.processing), color: '#6D4FC2' },
    { name: 'RTO', value: sRto, color: '#E8365D' },
    { name: 'Delivered', value: n(ship.delivered), color: '#0DB25B' },
    { name: 'NDR Pending', value: sNdr, color: '#F5843B' },
    ...(n(ship.lost) > 0 ? [{ name: 'Lost', value: n(ship.lost), color: '#64748B' }] : []),
    ...(n(ship.other) > 0 ? [{ name: 'Other', value: n(ship.other), color: '#CBD5E1' }] : []),
  ];
  const statusTotal = status.reduce((s, d) => s + d.value, 0);

  /* NDR raised in the range — where each one stands (pending + taken + no action = total) */
  const ndrTotal = n(ndr.totalNdr);
  const ndrPending = n(ndr.undelivered);        // still Undelivered, waiting for a seller action
  const ndrTaken = n(ndr.actionTaken);          // seller acted (re-attempt / address / RTO request …)
  const ndrNoAction = n(ndr.noAction);          // closed or moving again with no seller action
  const ndrDelivered = n(ndr.ndrDelivered);
  const ndrRto = n(ndr.ndrRto);
  const ndrLost = n(ndr.ndrLost);
  const ndrOpen = n(ndr.ndrOpen);

  /* Delivered vs RTO vs Undelivered — shipments booked in the range */
  const dDelivered = n(ship.delivered);
  const dRto = sRto;
  const dUndelivered = sNdr;

  /* Payment mode — shipments in the range (graphs.paymentMode rows); any name containing "cod" counts as COD */
  const payCod = paymentMode.filter(p => /cod/i.test(String(p.name))).reduce((a, p) => a + n(p.value), 0);
  const payPrepaid = paymentMode.filter(p => !/cod/i.test(String(p.name))).reduce((a, p) => a + n(p.value), 0);

  /* Customers who ordered in the range: first order ever vs returning (ordered before, or more than once) */
  const newCust = n(overview?.customers?.newCustomers), repeatCust = n(overview?.customers?.repeatCustomers);
  const custTotal = newCust + repeatCust;

  // Backend zones: zoneA…zoneE = A Local · B Regional · C Metro · D ROI · E Special (null = no zone on the order)
  const ZONES5 = [
    { name: 'Local', color: '#E8365D', key: 'zonea' },
    { name: 'Regional', color: '#2F80ED', key: 'zoneb' },
    { name: 'Metro', color: '#F5843B', key: 'zonec' },
    { name: 'ROI', color: '#0DB25B', key: 'zoned' },
    { name: 'Special Zone', color: '#38B6F0', key: 'zonee' },
  ];
  const zoneKey = (z: unknown) => String(z ?? '').toLowerCase();
  const known = new Set(ZONES5.map(z => z.key));
  const zoneRing = ZONES5.map(z => ({
    name: z.name, color: z.color,
    value: zones.filter(r => zoneKey(r.zone) === z.key).reduce((a, r) => a + n(r.count), 0),
  }));
  const zoneUnknown = zones.filter(r => !known.has(zoneKey(r.zone))).reduce((a, r) => a + n(r.count), 0);
  if (zoneUnknown > 0) zoneRing.push({ name: 'No zone', color: '#94A3B8', value: zoneUnknown });
  const zoneRingTotal = zoneRing.reduce((a, d) => a + d.value, 0);

  /* Zone × status (+ average days to deliver) from the overview */
  const zsRows: any[] = Array.isArray(overview?.zoneStatus) ? overview.zoneStatus : [];
  const toRow = (name: string, rs: any[]): ZoneRow => ({
    zone: name,
    inTransit: rs.reduce((a, r) => a + n(r.inTransit), 0), pickup: rs.reduce((a, r) => a + n(r.pickup), 0),
    rto: rs.reduce((a, r) => a + n(r.rto), 0), delivered: rs.reduce((a, r) => a + n(r.delivered), 0),
    ndr: rs.reduce((a, r) => a + n(r.ndr), 0), lost: rs.reduce((a, r) => a + n(r.lost), 0), other: rs.reduce((a, r) => a + n(r.other), 0),
    tat: rs.length === 1 && rs[0].tat != null ? Number(rs[0].tat) : null,
  });
  const zoneStatus: ZoneRow[] = ZONES5.map(z => toRow(z.name, zsRows.filter(r => zoneKey(r.zone) === z.key)));
  const zsUnknown = zsRows.filter(r => !known.has(zoneKey(r.zone)));
  if (zsUnknown.length) zoneStatus.push(toRow('No zone', zsUnknown));

  return (
    <div className="mt-3 space-y-3">
      {/* Row A: status · NDR · outcome + TAT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card title="Shipments by Status">
          <StatusDonut data={status} total={statusTotal} />
        </Card>

        {/* NDR raised in the range: three-way split (no action vs action taken vs action pending) + outcome bars */}
        <section className="min-w-0 bg-white rounded-xl border border-[#EEF2F6] shadow-[0_1px_2px_rgba(16,24,40,0.03),0_4px_16px_-6px_rgba(16,24,40,0.06)] p-4 md:p-5 flex flex-col">
          <h3 className="text-[15px] font-semibold text-[#0F172A]">NDR: <span className="font-bold tabular-nums">{ndrTotal.toLocaleString('en-IN')}</span></h3>
          <VsSplit items={[
            { label: 'No Action Taken', value: ndrNoAction, color: '#7C3AED' },
            { label: 'Action Taken', value: ndrTaken, color: '#2F80ED' },
            { label: 'Action Pending', value: ndrPending, color: '#F5843B' },
          ]} />

          <h4 className="mt-7 mb-3 text-[15px] font-medium text-[#0F172A]">Outcome</h4>
          <div className="space-y-3.5">
            {[
              { label: 'RTO', value: ndrRto, color: '#E8365D' },
              { label: 'Delivered', value: ndrDelivered, color: '#0DB25B' },
              ...(ndrLost > 0 ? [{ label: 'Lost', value: ndrLost, color: '#64748B' }] : []),
              { label: 'Open', value: ndrOpen, color: '#2F80ED' },
            ].map(o => (
              <div key={o.label} className="grid grid-cols-[150px_minmax(0,1fr)] items-center gap-4">
                <div className="min-w-0 flex items-baseline gap-1">
                  <span className="text-[14px] text-[#0F172A]">{o.label}</span>
                  <span className="text-[11px] text-[#94A3B8] tabular-nums">{o.value.toLocaleString('en-IN')} ({pctLabel(o.value, ndrTotal)})</span>
                </div>
                <div className="h-4 rounded-full bg-[#EEF2F7] overflow-hidden" title={`${o.label}: ${o.value} (${pctLabel(o.value, ndrTotal)})`}>
                  <div className="h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{ width: `${pct(o.value, ndrTotal)}%`, background: `linear-gradient(90deg, ${o.color}CC, ${o.color})` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-3 min-w-0">
          <section className="min-w-0 bg-white rounded-xl border border-[#EEF2F6] shadow-[0_1px_2px_rgba(16,24,40,0.03),0_4px_16px_-6px_rgba(16,24,40,0.06)] p-4 md:p-5">
            <h3 className="text-[15px] font-semibold text-[#0F172A]">Delivered vs RTO vs Undelivered</h3>
            <VsSplit items={[
              { label: 'Delivered', value: dDelivered, color: '#0DB25B' },
              { label: 'RTO', value: dRto, color: '#E8365D' },
              { label: 'Undelivered', value: dUndelivered, color: '#F5843B' },
            ]} />
          </section>

          <section className="min-w-0 bg-white rounded-xl border border-[#EEF2F6] shadow-[0_1px_2px_rgba(16,24,40,0.03),0_4px_16px_-6px_rgba(16,24,40,0.06)] p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[15px] font-semibold text-[#0F172A]">Payment Mode</h3>
              <span className="text-[12px] text-[#64748B]">Shipments: <span className="font-semibold text-[#0F172A] tabular-nums">{(payPrepaid + payCod).toLocaleString('en-IN')}</span></span>
            </div>
            <VsSplit items={[
              { label: 'Prepaid', value: payPrepaid, color: '#6D4FC2' },
              { label: 'COD', value: payCod, color: '#F5843B' },
            ]} />
          </section>
        </div>
      </div>

      {/* Row B: COD status (cards passed in by the dashboard) */}
      {codSlot}

      {/* Row C: customers · zones · zone x status */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1.4fr] gap-3">
        <section className="min-w-0 bg-white rounded-xl border border-[#EEF2F6] shadow-[0_1px_2px_rgba(16,24,40,0.03),0_4px_16px_-6px_rgba(16,24,40,0.06)] p-4 md:p-5 flex flex-col">
          <h3 className="text-[15px] font-semibold text-[#0F172A]">Customer Insights</h3>
          <p className="mt-2 text-[14px] text-[#334155]">Customers: <span className="font-bold text-[#0F172A] tabular-nums">{custTotal.toLocaleString('en-IN')}</span></p>
          <div className="mt-4 h-[250px] -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'New Customer', value: newCust, color: '#2F80ED' },
                { name: 'Repeat Customer', value: repeatCust, color: '#0DB25B' },
              ]} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="32%">
                <defs>
                  <linearGradient id="ci-new" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2F80ED" /><stop offset="100%" stopColor="#2F80ED" stopOpacity={0.65} /></linearGradient>
                  <linearGradient id="ci-rep" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0DB25B" /><stop offset="100%" stopColor="#0DB25B" stopOpacity={0.65} /></linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#EEF2F7" strokeDasharray="4 4" />
                <YAxis width={40} axisLine={false} tickLine={false} allowDecimals={false}
                  domain={[0, (max: number) => Math.max(4, Math.ceil(max * 1.15))]}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}K` : String(v))} />
                <XAxis dataKey="name" axisLine={{ stroke: '#CBD5E1' }} tickLine={false} interval={0} height={44}
                  tick={({ x, y, payload, index }: any) => {
                    const v = index === 0 ? newCust : repeatCust;
                    return (
                      <g transform={`translate(${x},${y + 14})`}>
                        <text textAnchor="middle" fontSize={12} fill="#334155">{payload.value}</text>
                        <text textAnchor="middle" y={16} fontSize={11} fill="#94A3B8">{v.toLocaleString('en-IN')} ({pctLabel(v, custTotal)})</text>
                      </g>
                    );
                  }} />
                <Tooltip cursor={{ fill: '#F8FAFC' }} formatter={(v: any) => [`${Number(v).toLocaleString('en-IN')} (${pctLabel(Number(v), custTotal)})`, 'Customers']}
                  contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12 }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={72} animationDuration={700} background={{ fill: '#F8FAFC', radius: 8 } as any}>
                  <Cell fill="url(#ci-new)" />
                  <Cell fill="url(#ci-rep)" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <Card title="Zone Distribution of Shipments">
          <StatusDonut data={zoneRing} total={zoneRingTotal} />
        </Card>

        <ZoneStatusCard rows={zoneStatus} />
      </div>
    </div>
  );
}
