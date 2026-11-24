import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Search, Trophy, Truck, Users } from 'lucide-react';

/* Dashboard → Summary tab: Top Performing Sellers (admin view) + Couriers Summary.
   Same data and fields as before; adds search, sortable columns, inline bars, zone heat cells and a totals row. */

const num = (v: unknown) => {
  const x = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(x) ? x : 0;
};
const ZONES = ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E'] as const;
/** Zone count for a courier row, whichever key style the API uses ("Zone A" | "zoneA" | "zone_a" | zones.A). */
const zoneOf = (c: any, z: string) => {
  const L = z.slice(-1);
  const v = c?.[z] ?? c?.[`zone${L}`] ?? c?.[`zone_${L.toLowerCase()}`] ?? c?.zones?.[L] ?? c?.zones?.[`zone${L}`] ?? c?.zones?.[z];
  return num(v);
};

type Sort = { key: string; dir: 1 | -1 };
function useSort(initial: Sort) {
  const [sort, setSort] = useState<Sort>(initial);
  const toggle = (key: string) => setSort(cur => ({ key, dir: cur.key === key ? (cur.dir === 1 ? -1 : 1) : -1 }));
  return { sort, toggle };
}

function SortTh({ label, k, sort, onSort, align = 'center', className = '' }: { label: string; k: string; sort: Sort; onSort: (k: string) => void; align?: 'left' | 'center' | 'right'; className?: string }) {
  const active = sort.key === k;
  const Icon = !active ? ArrowUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
  return (
    <th className={`px-3 py-3 font-semibold text-${align} ${className}`}>
      <button type="button" onClick={() => onSort(k)} className={`inline-flex items-center gap-1 whitespace-nowrap hover:text-[#0F172A] transition-colors ${active ? 'text-[#0F172A]' : ''}`}>
        {label}<Icon className={`w-3 h-3 ${active ? 'text-[#00A86B]' : 'text-[#CBD5E1]'}`} />
      </button>
    </th>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full sm:w-[240px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-9 pl-9 pr-3 rounded-full border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10 transition-all" />
    </div>
  );
}

/** Rate chip with a thin bar underneath; tone from thresholds (good = higher for delivery, lower for RTO). */
function RateCell({ value, good, warn, higherIsBetter }: { value: unknown; good: number; warn: number; higherIsBetter: boolean }) {
  const v = num(value);
  const ok = higherIsBetter ? v >= good : v < good;
  const mid = higherIsBetter ? v >= warn : v < warn;
  const tone = ok ? ['#047857', '#ECFDF5', '#10B981'] : mid ? ['#B45309', '#FFFBEB', '#F59E0B'] : ['#B91C1C', '#FEF2F2', '#EF4444'];
  return (
    <div className="inline-flex flex-col items-center gap-1 min-w-[72px]">
      <span className="inline-flex items-center h-6 px-2 rounded-md text-[12px] font-semibold tabular-nums" style={{ color: tone[0], background: tone[1] }}>{v.toFixed(1)}%</span>
      <span className="w-16 h-1 rounded-full bg-[#F1F5F9] overflow-hidden"><span className="block h-full rounded-full" style={{ width: `${Math.min(v, 100)}%`, background: tone[2] }} /></span>
    </div>
  );
}

function ShareBar({ value, max, color = '#00A86B' }: { value: number; max: number; color?: string }) {
  return <span className="mt-1 block w-full h-1 rounded-full bg-[#F1F5F9] overflow-hidden"><span className="block h-full rounded-full" style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, background: color }} /></span>;
}

const RANK = [
  { bg: 'linear-gradient(135deg,#FCD34D,#F59E0B)', ring: '#FDE68A' },
  { bg: 'linear-gradient(135deg,#E2E8F0,#94A3B8)', ring: '#E2E8F0' },
  { bg: 'linear-gradient(135deg,#FDBA74,#C2410C)', ring: '#FED7AA' },
];

function Panel({ icon: Icon, title, count, right, children }: { icon: any; title: string; count?: number; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-[#EEF2F6] shadow-[0_1px_2px_rgba(16,24,40,0.03),0_4px_16px_-6px_rgba(16,24,40,0.06)] overflow-hidden">
      <header className="px-4 md:px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#EEF2F6]">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-[#F0FDF4] flex items-center justify-center shrink-0"><Icon className="w-[18px] h-[18px] text-[#00A86B]" /></span>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-[#0F172A] leading-tight">{title}</h3>
            {count != null && <p className="text-[12px] text-[#94A3B8] mt-0.5">{count} {count === 1 ? 'record' : 'records'}</p>}
          </div>
        </div>
        {right}
      </header>
      {children}
    </section>
  );
}

/* ── Top Performing Sellers ──────────────────────────────────────── */
function TopSellers({ sellers, error, fmt, fmtN, initials }: { sellers: any[]; error?: string; fmt: (v: any) => string; fmtN: (v: any) => string; initials: (s: string) => string }) {
  const [q, setQ] = useState('');
  const { sort, toggle } = useSort({ key: 'rank', dir: 1 });
  const ranked = useMemo(() => sellers.map((s, i) => ({ ...s, _rank: i + 1 })), [sellers]);
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    const f = t ? ranked.filter(s => [s.name, s.company, s.email].some((x: any) => String(x || '').toLowerCase().includes(t))) : ranked;
    const val = (s: any) => sort.key === 'rank' ? s._rank : num(s[sort.key]);
    return [...f].sort((a, b) => (val(a) - val(b)) * sort.dir);
  }, [ranked, q, sort]);
  const maxRev = Math.max(...sellers.map(s => num(s.totalRevenue)), 0);
  const maxOrd = Math.max(...sellers.map(s => num(s.totalOrders)), 0);

  const empty = (
    <div className="p-10 text-center text-[13px]">
      {error ? <span className="text-red-500 font-medium">{error}</span> : <span className="text-[#94A3B8]">{q ? 'No sellers match your search' : 'No seller data available'}</span>}
    </div>
  );

  return (
    <Panel icon={Trophy} title="Top Performing Sellers" count={sellers.length}
      right={<SearchBox value={q} onChange={setQ} placeholder="Search seller, company, email" />}>
      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto">
        {rows.length === 0 ? empty : (
          <table className="w-full min-w-[980px] text-[13px]">
            <thead>
              <tr className="bg-[#F8FAFC] text-[11.5px] uppercase tracking-wide text-[#64748B]">
                <SortTh label="#" k="rank" sort={sort} onSort={toggle} align="left" className="pl-5 w-14" />
                <th className="px-3 py-3 text-left font-semibold">Seller</th>
                <SortTh label="Shipments" k="totalOrders" sort={sort} onSort={toggle} />
                <SortTh label="Revenue" k="totalRevenue" sort={sort} onSort={toggle} />
                <SortTh label="Delivery Rate" k="deliveryRate" sort={sort} onSort={toggle} />
                <SortTh label="COD Pending" k="codAmount" sort={sort} onSort={toggle} />
                <SortTh label="RTO Rate" k="rtoRate" sort={sort} onSort={toggle} />
                <SortTh label="Wallet Balance" k="walletBalance" sort={sort} onSort={toggle} align="right" className="pr-5" />
              </tr>
            </thead>
            <tbody>
              {rows.map(s => {
                const r = RANK[s._rank - 1];
                return (
                  <tr key={s._rank} className="border-t border-[#F1F5F9] hover:bg-[#FAFBFC] transition-colors">
                    <td className="pl-5 pr-3 py-3">
                      {r
                        ? <span className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-sm" style={{ background: r.bg, boxShadow: `0 0 0 3px ${r.ring}` }}>{s._rank}</span>
                        : <span className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-[#64748B] bg-[#F1F5F9]">{s._rank}</span>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {s.profileImage
                          ? <img src={s.profileImage} alt={s.name} className="w-9 h-9 rounded-full object-cover shrink-0 border border-[#E2E8F0]" />
                          : <div className="w-9 h-9 rounded-full bg-[#E6F5F1] text-[#00A86B] flex items-center justify-center shrink-0 font-bold text-xs border border-[#00A86B]/20">{initials(s.name)}</div>}
                        <div className="min-w-0">
                          <div className="font-semibold text-[#0F172A] text-[13.5px] leading-tight truncate max-w-[220px]">{s.name}</div>
                          <div className="text-[12px] text-[#64748B] mt-0.5 truncate max-w-[220px]">{s.company !== '—' ? s.company : s.email}</div>
                          {s.company !== '—' && <div className="text-[11.5px] text-[#94A3B8] mt-0.5 truncate max-w-[220px]">{s.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="inline-block min-w-[80px]">
                        <div className="font-semibold text-[#0F172A] tabular-nums">{fmtN(s.totalOrders)}</div>
                        <ShareBar value={num(s.totalOrders)} max={maxOrd} color="#2F80ED" />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="inline-block min-w-[96px]">
                        <div className="font-semibold text-[#047857] tabular-nums">{fmt(s.totalRevenue)}</div>
                        <ShareBar value={num(s.totalRevenue)} max={maxRev} />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center"><RateCell value={s.deliveryRate} good={80} warn={50} higherIsBetter /></td>
                    <td className="px-3 py-3 text-center text-[#0F172A] tabular-nums">{fmt(s.codAmount)}</td>
                    <td className="px-3 py-3 text-center"><RateCell value={s.rtoRate} good={5} warn={15} higherIsBetter={false} /></td>
                    <td className="pl-3 pr-5 py-3 text-right font-semibold text-[#00A86B] tabular-nums">{fmt(s.walletBalance)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile */}
      <div className="md:hidden p-3 space-y-3 max-h-[600px] overflow-y-auto">
        {rows.length === 0 ? empty : rows.map(s => {
          const r = RANK[s._rank - 1];
          return (
            <div key={s._rank} className="rounded-xl border border-[#EEF2F6] p-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={r ? { background: r.bg, color: '#fff' } : { background: '#F1F5F9', color: '#64748B' }}>{s._rank}</span>
                {s.profileImage
                  ? <img src={s.profileImage} alt={s.name} className="w-9 h-9 rounded-full object-cover shrink-0 border border-[#E2E8F0]" />
                  : <div className="w-9 h-9 rounded-full bg-[#E6F5F1] text-[#00A86B] flex items-center justify-center shrink-0 font-bold text-xs">{initials(s.name)}</div>}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[#0F172A] text-[14px] truncate">{s.name}</div>
                  {s.company !== '—' && <div className="text-[12px] text-[#64748B] truncate">{s.company}</div>}
                  <div className="text-[11.5px] text-[#94A3B8] truncate">{s.email}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#F1F5F9] text-[13px]">
                <div><div className="text-[10.5px] text-[#94A3B8] uppercase tracking-wide">Shipments</div><div className="font-semibold text-[#0F172A] tabular-nums">{fmtN(s.totalOrders)}</div></div>
                <div><div className="text-[10.5px] text-[#94A3B8] uppercase tracking-wide">Revenue</div><div className="font-semibold text-[#047857] tabular-nums truncate">{fmt(s.totalRevenue)}</div></div>
                <div><div className="text-[10.5px] text-[#94A3B8] uppercase tracking-wide">COD</div><div className="font-semibold text-[#0F172A] tabular-nums truncate">{fmt(s.codAmount)}</div></div>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <RateCell value={s.deliveryRate} good={80} warn={50} higherIsBetter />
                <RateCell value={s.rtoRate} good={5} warn={15} higherIsBetter={false} />
                <span className="ml-auto text-[12.5px] font-semibold text-[#00A86B] tabular-nums">{fmt(s.walletBalance)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* ── Couriers Summary ───────────────────────────────────────────── */
function CourierSummary({ couriers, courierIcon, initials }: { couriers: any[]; courierIcon: (c: string) => string | null | undefined; initials: (s: string) => string }) {
  const [q, setQ] = useState('');
  const { sort, toggle } = useSort({ key: 'shipmentCount', dir: -1 });
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    const f = t ? couriers.filter(c => [c.courier, c.courierServiceName].some((x: any) => String(x || '').toLowerCase().includes(t))) : couriers;
    return [...f].sort((a, b) => (num(a[sort.key]) - num(b[sort.key])) * sort.dir);
  }, [couriers, q, sort]);

  const sum = (k: string) => couriers.reduce((a, c) => a + num(c[k]), 0);
  const tot = {
    shipmentCount: sum('shipmentCount'), codOrders: sum('codOrders'), prepaidOrders: sum('prepaidOrders'), delivered: sum('delivered'),
    ndrDelivered: sum('ndrDelivered'), ndrRaised: sum('ndrRaised'), rto: sum('rto'), lost: sum('Lost/Damaged'),
    zones: ZONES.map(z => couriers.reduce((a, c) => a + zoneOf(c, z), 0)),
  };
  const maxShip = Math.max(...couriers.map(c => num(c.shipmentCount)), 0);
  const maxZone = Math.max(...couriers.flatMap(c => ZONES.map(z => zoneOf(c, z))), 0);
  const pctOf = (v: number, t: number) => (t > 0 ? `${((v / t) * 100).toFixed(1)}%` : '—');
  const dash = (v: any) => (v ?? '—');
  const heat = (v: number) => {
    // Solid 4-step scale so the number always has strong contrast on its tint.
    if (v <= 0) return { background: '#F1F5F9', color: '#64748B' };
    const a = maxZone > 0 ? v / maxZone : 0;
    if (a > 0.75) return { background: '#047857', color: '#FFFFFF', fontWeight: 600 };
    if (a > 0.5) return { background: '#A7F3D0', color: '#064E3B', fontWeight: 600 };
    if (a > 0.25) return { background: '#D1FAE5', color: '#065F46', fontWeight: 600 };
    return { background: '#ECFDF5', color: '#065F46', fontWeight: 600, boxShadow: 'inset 0 0 0 1px #A7F3D0' };
  };

  const Logo = ({ name }: { name: string }) => {
    const icon = courierIcon(name);
    return (
      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 border border-[#EEF2F6] p-1.5 overflow-hidden">
        {icon ? <img src={icon} alt={name} className="w-full h-full object-contain" /> : <span className="text-[11px] font-bold text-[#475569]">{initials(name)}</span>}
      </div>
    );
  };

  return (
    <Panel icon={Truck} title="Couriers Summary" count={couriers.length}
      right={<SearchBox value={q} onChange={setQ} placeholder="Search courier or service" />}>
      <div className="hidden md:block overflow-x-auto">
        {rows.length === 0 ? (
          <div className="p-10 text-center text-[13px] text-[#94A3B8]">{q ? 'No couriers match your search' : 'No courier shipments in the selected range'}</div>
        ) : (
          <table className="w-full min-w-[1180px] text-[13px]">
            <thead>
              <tr className="bg-[#F8FAFC] text-[11.5px] uppercase tracking-wide text-[#64748B]">
                <th className="sticky left-0 z-10 bg-[#F8FAFC] pl-5 pr-3 py-3 text-left font-semibold">Courier</th>
                <SortTh label="Shipments" k="shipmentCount" sort={sort} onSort={toggle} />
                <SortTh label="COD" k="codOrders" sort={sort} onSort={toggle} />
                <SortTh label="Prepaid" k="prepaidOrders" sort={sort} onSort={toggle} />
                <SortTh label="Delivered" k="delivered" sort={sort} onSort={toggle} />
                <SortTh label="NDR Delivered" k="ndrDelivered" sort={sort} onSort={toggle} />
                <SortTh label="NDR Raised" k="ndrRaised" sort={sort} onSort={toggle} />
                <SortTh label="RTO" k="rto" sort={sort} onSort={toggle} />
                <SortTh label="Lost/Damaged" k="Lost/Damaged" sort={sort} onSort={toggle} />
                {ZONES.map(z => <SortTh key={z} label={z} k={z} sort={sort} onSort={toggle} className={z === 'Zone A' ? 'border-l border-[#EEF2F6]' : z === 'Zone E' ? 'pr-5' : ''} />)}
              </tr>
            </thead>
            <tbody>
              {rows.map((c, i) => {
                const ship = num(c.shipmentCount);
                const cod = num(c.codOrders), pre = num(c.prepaidOrders);
                return (
                  <tr key={i} className="group border-t border-[#F1F5F9] hover:bg-[#FAFBFC] transition-colors">
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-[#FAFBFC] pl-5 pr-3 py-3 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <Logo name={c.courier} />
                        <div className="min-w-0">
                          <div className="font-semibold text-[#0F172A] text-[13.5px] leading-tight truncate max-w-[180px]">{c.courier}</div>
                          <div className="text-[12px] text-[#94A3B8] mt-0.5 truncate max-w-[180px]">{c.courierServiceName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="inline-block min-w-[72px]">
                        <div className="font-semibold text-[#0F172A] tabular-nums">{dash(c.shipmentCount)}</div>
                        <ShareBar value={ship} max={maxShip} color="#2F80ED" />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center" colSpan={2}>
                      <div className="mx-auto w-[150px]">
                        <div className="flex justify-between text-[12.5px] tabular-nums">
                          <span className="text-[#0F172A] font-medium">{dash(c.codOrders)}</span>
                          <span className="text-[#0F172A] font-medium">{dash(c.prepaidOrders)}</span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-[#F1F5F9] overflow-hidden flex">
                          {cod + pre > 0 && <>
                            <span className="h-full bg-[#F5843B]" style={{ width: `${(cod / (cod + pre)) * 100}%` }} title={`COD ${pctOf(cod, cod + pre)}`} />
                            <span className="h-full bg-[#6D4FC2]" style={{ width: `${(pre / (cod + pre)) * 100}%` }} title={`Prepaid ${pctOf(pre, cod + pre)}`} />
                          </>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="font-semibold text-[#047857] tabular-nums">{dash(c.delivered)}</div>
                      <div className="text-[11px] text-[#94A3B8] tabular-nums">{pctOf(num(c.delivered), ship)}</div>
                    </td>
                    <td className="px-3 py-3 text-center text-[#0F172A] tabular-nums">{dash(c.ndrDelivered)}</td>
                    <td className="px-3 py-3 text-center text-[#B45309] tabular-nums">{dash(c.ndrRaised)}</td>
                    <td className="px-3 py-3 text-center">
                      <div className="text-[#B91C1C] tabular-nums">{dash(c.rto)}</div>
                      <div className="text-[11px] text-[#94A3B8] tabular-nums">{pctOf(num(c.rto), ship)}</div>
                    </td>
                    <td className="px-3 py-3 text-center text-[#64748B] tabular-nums">{dash(c['Lost/Damaged'])}</td>
                    {ZONES.map((z, zi) => {
                      const v = zoneOf(c, z);
                      return (
                        <td key={z} className={`px-1.5 py-3 text-center ${zi === 0 ? 'border-l border-[#EEF2F6] pl-3' : ''} ${zi === ZONES.length - 1 ? 'pr-5' : ''}`}>
                          <span className="inline-flex items-center justify-center min-w-[44px] h-7 px-2 rounded-md text-[12.5px] font-medium tabular-nums" style={heat(v)}>{v.toLocaleString('en-IN')}</span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#E2E8F0] bg-[#F8FAFC] font-semibold text-[#0F172A] tabular-nums">
                <td className="sticky left-0 z-10 bg-[#F8FAFC] pl-5 pr-3 py-3 text-[12px] uppercase tracking-wide text-[#475569]">Total</td>
                <td className="px-3 py-3 text-center">{tot.shipmentCount.toLocaleString('en-IN')}</td>
                <td className="px-3 py-3 text-center" colSpan={2}>
                  <div className="mx-auto w-[150px] flex justify-between text-[12.5px]"><span>{tot.codOrders.toLocaleString('en-IN')}</span><span>{tot.prepaidOrders.toLocaleString('en-IN')}</span></div>
                </td>
                <td className="px-3 py-3 text-center text-[#047857]">{tot.delivered.toLocaleString('en-IN')}</td>
                <td className="px-3 py-3 text-center">{tot.ndrDelivered.toLocaleString('en-IN')}</td>
                <td className="px-3 py-3 text-center">{tot.ndrRaised.toLocaleString('en-IN')}</td>
                <td className="px-3 py-3 text-center text-[#B91C1C]">{tot.rto.toLocaleString('en-IN')}</td>
                <td className="px-3 py-3 text-center">{tot.lost.toLocaleString('en-IN')}</td>
                {tot.zones.map((v, zi) => <td key={zi} className={`px-1.5 py-3 text-center ${zi === 0 ? 'border-l border-[#EEF2F6] pl-3' : ''} ${zi === 4 ? 'pr-5' : ''}`}>{v.toLocaleString('en-IN')}</td>)}
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Legend for the COD/Prepaid split */}
      {rows.length > 0 && (
        <div className="hidden md:flex items-center gap-5 px-5 py-3 border-t border-[#EEF2F6] text-[11.5px] text-[#64748B]">
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#F5843B]" />COD</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#6D4FC2]" />Prepaid</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(0,168,107,0.35)' }} />Zone volume (darker = more)</span>
        </div>
      )}

      {/* Mobile */}
      <div className="md:hidden p-3 space-y-3 max-h-[600px] overflow-y-auto">
        {rows.length === 0 ? (
          <div className="p-6 text-center text-[12px] text-[#94A3B8]">{q ? 'No couriers match your search' : 'No courier shipments in the selected range'}</div>
        ) : rows.map((c, i) => (
          <div key={i} className="rounded-xl border border-[#EEF2F6] p-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <Logo name={c.courier} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-[#0F172A] text-[14px] truncate">{c.courier}</div>
                <div className="text-[12px] text-[#94A3B8] truncate">{c.courierServiceName}</div>
              </div>
              <div className="text-right">
                <div className="text-[15px] font-semibold text-[#0F172A] tabular-nums">{dash(c.shipmentCount)}</div>
                <div className="text-[10.5px] text-[#94A3B8]">shipments</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-x-2 gap-y-3 mt-3 pt-3 border-t border-[#F1F5F9]">
              {[['COD', c.codOrders], ['Prepaid', c.prepaidOrders], ['Delivered', c.delivered], ['NDR Delvd', c.ndrDelivered], ['NDR Raised', c.ndrRaised], ['RTO', c.rto], ['Lost/Dmgd', c['Lost/Damaged']]].map(([l, v]) => (
                <div key={l as string} className="min-w-0">
                  <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider truncate">{l as string}</div>
                  <div className="text-[13px] text-[#0F172A] tabular-nums truncate mt-0.5">{dash(v)}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-1.5 mt-3 pt-3 border-t border-[#F1F5F9]">
              {ZONES.map(z => (
                <div key={z} className="text-center">
                  <div className="text-[10px] font-semibold text-[#94A3B8] uppercase">{z.replace('Zone ', 'Z')}</div>
                  <div className="mt-1 h-7 rounded-md flex items-center justify-center text-[12.5px] tabular-nums" style={heat(zoneOf(c, z))}>{zoneOf(c, z).toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function SummaryTab({ isAdminView, topSellers, topSellersErr, couriers, fmt, fmtN, courierIcon, initials }: {
  isAdminView: boolean; topSellers: any[]; topSellersErr?: string; couriers: any[];
  fmt: (v: any) => string; fmtN: (v: any) => string; courierIcon: (c: string) => string | null | undefined; initials: (s: string) => string;
}) {
  return (
    <div className="space-y-3">
      {isAdminView && <TopSellers sellers={topSellers} error={topSellersErr} fmt={fmt} fmtN={fmtN} initials={initials} />}
      <CourierSummary couriers={couriers} courierIcon={courierIcon} initials={initials} />
      {!isAdminView && couriers.length === 0 && (
        <p className="flex items-center gap-2 text-[12px] text-[#94A3B8]"><Users className="w-3.5 h-3.5" />Courier performance appears here once shipments are booked.</p>
      )}
    </div>
  );
}
