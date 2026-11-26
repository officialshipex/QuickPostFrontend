import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/* Page title row: "Shipment Overview" on the left; on the right, an ops pulse strip — the three live queues a
   seller acts on today (pickups waiting, out for delivery, NDR needing action) — and when the data was last
   fetched. Uses data the dashboard already loads; no extra request, no extra height. */

type Pulse = { label: string; value: number; color: string };

function useAgo(at?: Date | null) {
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick(x => x + 1), 30_000); return () => clearInterval(t); }, []);
  if (!at) return '';
  const s = Math.max(0, Math.round((Date.now() - at.getTime()) / 1000));
  if (s < 45) return 'Updated just now';
  const m = Math.round(s / 60);
  return m < 60 ? `Updated ${m} min ago` : `Updated at ${at.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`;
}

function PulseChip({ p, i }: { p: Pulse; i: number }) {
  const reduce = useReducedMotion();
  const hot = p.value > 0;
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 * i }}
      className="flex items-center gap-2.5 pl-3 pr-3.5 h-10 rounded-full bg-white border border-[#EEF2F6] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <span className="relative flex w-2 h-2">
        {hot && !reduce && <span className="absolute inset-0 rounded-full animate-ping opacity-60" style={{ background: p.color }} />}
        <span className="relative w-2 h-2 rounded-full" style={{ background: hot ? p.color : '#CBD5E1' }} />
      </span>
      <span className="text-[12.5px] text-[#64748B] whitespace-nowrap">{p.label}</span>
      <span className="text-[15px] font-bold text-[#0F172A] tabular-nums">{p.value.toLocaleString('en-IN')}</span>
    </motion.div>
  );
}

export function ShipmentOverviewTitle({ text = 'Shipment Overview', pulses = [], updatedAt }: { text?: string; pulses?: Pulse[]; updatedAt?: Date | null }) {
  void updatedAt; void useAgo;
  const [first, ...rest] = text.split(' ');
  return (
    <div className="flex items-center gap-6 min-w-0 w-full">
      <div className="min-w-0">
        <h1 className="text-[25.0186px] leading-[1.15] font-bold tracking-[-0.03em] text-[#0F172A] whitespace-nowrap">
          {first}{rest.length > 0 && <> <span className="bg-gradient-to-r from-[#00A86B] to-[#0F6B38] bg-clip-text text-transparent">{rest.join(' ')}</span></>}
        </h1>
      </div>

      {pulses.length > 0 && (
        <div className="ml-auto flex items-center gap-2" aria-label="Needs attention today">
          <span className="hidden 2xl:inline text-[11.5px] font-semibold uppercase tracking-[0.12em] text-[#94A3B8] mr-1">Needs attention</span>
          {pulses.map((p, i) => <PulseChip key={p.label} p={p} i={i} />)}
        </div>
      )}
    </div>
  );
}
