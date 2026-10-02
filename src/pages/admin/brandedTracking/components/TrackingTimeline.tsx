import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Bike, Check, ClipboardCheck, Copy, Headset, House, PackageCheck, Share2, Truck,
} from 'lucide-react';
import type { BrandedTrackingData, MilestoneKey, TrackingAppearanceConfig, TrackingEvent } from '../types';
import { MILESTONES } from '../trackingService';
import { cardStyle, type ThemeTokens } from '../theme';
import { copyToClipboard } from '../../../../utils/clipboard';

const MILESTONE_ICONS: Record<MilestoneKey, React.ElementType> = {
  booked: ClipboardCheck,
  pickedUp: PackageCheck,
  inTransit: Truck,
  outForDelivery: Bike,
  delivered: House,
};

type NodeState = 'completed' | 'current' | 'pending' | 'exception';

function nodeState(i: number, data: BrandedTrackingData): NodeState {
  const delivered = data.milestoneIndex === 4 && !data.isException;
  if (i < data.milestoneIndex || (delivered && i === 4)) return 'completed';
  if (i === data.milestoneIndex) return data.isException ? 'exception' : 'current';
  return 'pending';
}

const stateColor = (state: NodeState, cfg: TrackingAppearanceConfig) => cfg.statusColors[state];

/* ── Date helpers ─────────────────────────────────────────────────────── */

function parseDate(iso?: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function bigDateParts(iso?: string) {
  const d = parseDate(iso);
  if (!d) return null;
  return {
    weekday: d.toLocaleDateString('en-IN', { weekday: 'long' }),
    month: d.toLocaleDateString('en-IN', { month: 'long' }),
    day: d.getDate(),
  };
}

function eventStamp(e: TrackingEvent) {
  const d = parseDate(e.timestamp);
  if (!d) return { day: e.date, time: e.time };
  return {
    day: `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleDateString('en-IN', { month: 'short' }).replace('.', '').slice(0, 3).toUpperCase()}`,
    time: d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase(),
  };
}

/* ── Milestone stepper (horizontal style) ─────────────────────────────── */
function MilestoneNode({ k, state, cfg, t }: { k: MilestoneKey; state: NodeState; cfg: TrackingAppearanceConfig; t: ThemeTokens }) {
  const color = stateColor(state, cfg);
  const Icon = MILESTONE_ICONS[k];
  const filled = state !== 'pending';
  const size = cfg.showStatusIcons ? 32 : 16;
  return (
    <span className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
      {(state === 'current' || state === 'exception') && (
        <span className="absolute inset-0 rounded-full animate-ping" style={{ background: color, opacity: 0.18 }} />
      )}
      <span className="relative w-full h-full rounded-full flex items-center justify-center" style={{ background: filled ? color : t.surface, border: `2px solid ${color}`, color: filled ? '#FFFFFF' : color }}>
        {cfg.showStatusIcons ? (
          state === 'completed' ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : state === 'exception' ? <AlertTriangle className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />
        ) : state === 'completed' ? (
          <Check className="w-2.5 h-2.5" strokeWidth={4} />
        ) : null}
      </span>
    </span>
  );
}

function MilestoneStepper({ data, cfg, t }: { data: BrandedTrackingData; cfg: TrackingAppearanceConfig; t: ThemeTokens }) {
  return (
    <div className="overflow-x-auto -mx-1 px-1 pb-1 mb-5">
      <ol className="grid grid-cols-5 min-w-[460px]">
        {MILESTONES.map((m, i) => {
          const state = nodeState(i, data);
          const ev = data.milestoneEvents[m.key];
          const nextDone = i < MILESTONES.length - 1 && nodeState(i + 1, data) !== 'pending';
          return (
            <li key={m.key} className="relative flex flex-col items-center text-center px-1">
              {i < MILESTONES.length - 1 && (
                <span className="absolute h-[2px]" style={{ top: cfg.showStatusIcons ? 15 : 7, left: '50%', right: '-50%', background: nextDone ? cfg.statusColors.completed : cfg.statusColors.pending }} />
              )}
              <span className="relative z-[1]"><MilestoneNode k={m.key} state={state} cfg={cfg} t={t} /></span>
              <p className="text-[11.5px] font-semibold mt-1.5 leading-tight" style={{ color: state === 'pending' ? t.muted : t.text }}>{m.label}</p>
              {cfg.showTimestamps && ev && state !== 'pending' && <p className="text-[10.5px] mt-0.5" style={{ color: t.muted }}>{eventStamp(ev).day}</p>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ── Delivered celebration ────────────────────────────────────────────── */
function DeliveredCelebration({ t, color, size = 64 }: { t: ThemeTokens; color: string; size?: number }) {
  const reach = size * 0.85;
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    return { x: Math.cos(angle) * reach, y: Math.sin(angle) * reach, c: i % 3 === 0 ? t.secondary : i % 3 === 1 ? color : t.primary, r: (i % 4) * 30 };
  });
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-hidden>
      {[0, 1].map((i) => (
        <motion.span key={i} className="absolute inset-0 rounded-full" style={{ border: `2px solid ${color}` }} initial={{ scale: 0.6, opacity: 0.6 }} animate={{ scale: 1.7, opacity: 0 }} transition={{ duration: 1.4, delay: 0.25 + i * 0.35, ease: 'easeOut' }} />
      ))}
      {particles.map((p, i) => (
        <motion.span key={i} className="absolute left-1/2 top-1/2 w-2 h-1 rounded-[1px]" style={{ background: p.c, marginLeft: -4, marginTop: -2 }} initial={{ x: 0, y: 0, opacity: 0, rotate: 0 }} animate={{ x: p.x, y: p.y, opacity: [0, 1, 0], rotate: p.r + 180 }} transition={{ duration: 1.1, delay: 0.35, ease: 'easeOut' }} />
      ))}
      <motion.span className="absolute inset-0 rounded-full flex items-center justify-center shadow-lg" style={{ background: color }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
        <svg viewBox="0 0 24 24" style={{ width: size * 0.5, height: size * 0.5 }} fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, delay: 0.25 }} />
        </svg>
      </motion.span>
    </div>
  );
}

/* ── Activity feed (reference: date column · dashed rail · key/value rows) ── */
function ActivityFeed({ data, cfg, t }: { data: BrandedTrackingData; cfg: TrackingAppearanceConfig; t: ThemeTokens }) {
  if (!data.events.length) {
    return <p className="text-[13px] py-8 text-center" style={{ color: t.muted }}>No tracking updates yet. Updates appear once the courier scans your shipment.</p>;
  }
  const latestColor = data.isException ? cfg.statusColors.exception : cfg.statusColors.completed;
  const cols = cfg.showTimestamps ? '64px 22px minmax(0,1fr)' : '22px minmax(0,1fr)';

  return (
    <ol className="max-h-[420px] overflow-y-auto pr-2 -mr-2 [scrollbar-width:thin]">
      {data.events.map((e, i) => {
        const stamp = eventStamp(e);
        const isFirst = i === 0;
        const isLast = i === data.events.length - 1;
        const dotColor = isFirst ? latestColor : cfg.statusColors.completed;
        return (
          <li key={`${e.timestamp ?? e.date}-${i}`} className="grid gap-x-2" style={{ gridTemplateColumns: cols }}>
            {cfg.showTimestamps && (
              <div className="pt-0.5">
                <p className="text-[12px] font-bold tracking-wide whitespace-nowrap" style={{ color: t.text }}>{stamp.day}</p>
                {stamp.time && <p className="text-[11px] mt-0.5 whitespace-nowrap" style={{ color: t.muted }}>{stamp.time}</p>}
              </div>
            )}

            <div className="relative flex justify-center">
              <span
                className="relative z-[1] mt-1 w-3 h-3 rounded-full shrink-0"
                style={{
                  background: isFirst ? dotColor : t.surface,
                  border: `2px solid ${dotColor}`,
                  boxShadow: isFirst ? `0 0 0 4px color-mix(in srgb, ${dotColor} 18%, transparent)` : undefined,
                }}
              />
              {!isLast && <span className="absolute top-5 bottom-0 left-1/2 -translate-x-1/2 border-l-2 border-dashed" style={{ borderColor: `color-mix(in srgb, ${cfg.statusColors.completed} 45%, transparent)` }} />}
            </div>

            <div className={`min-w-0 ${isLast ? 'pb-1' : 'pb-4 mb-4'}`} style={isLast ? undefined : { borderBottom: `1px solid ${t.border}` }}>
              <dl className="grid gap-y-1 text-[12.5px]" style={{ gridTemplateColumns: '64px 12px minmax(0,1fr)' }}>
                <dt style={{ color: t.muted }}>Activity</dt>
                <span style={{ color: t.muted }}>:</span>
                <dd className={`${isFirst ? 'font-bold' : 'font-semibold'} break-words`} style={{ color: isFirst && data.isException ? cfg.statusColors.exception : t.text }}>{e.description || e.status}</dd>
                {cfg.showLocation && e.location && (
                  <>
                    <dt style={{ color: t.muted }}>Location</dt>
                    <span style={{ color: t.muted }}>:</span>
                    <dd className="break-words" style={{ color: t.text }}>{e.location}</dd>
                  </>
                )}
              </dl>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ── Main tracking card ───────────────────────────────────────────────── */
export function TrackingTimeline({ data, cfg, t, helpHref }: { data: BrandedTrackingData; cfg: TrackingAppearanceConfig; t: ThemeTokens; helpHref?: string }) {
  const [copied, setCopied] = useState<'awb' | 'link' | null>(null);
  const delivered = data.milestoneIndex === 4 && !data.isException;
  const statusColor = data.isException ? cfg.statusColors.exception : delivered ? cfg.statusColors.completed : cfg.statusColors.current;
  const progress = delivered ? 100 : Math.round((data.milestoneIndex / (MILESTONES.length - 1)) * 100);
  const dateIso = delivered ? data.deliveredOnISO : data.estimatedDeliveryISO;
  const dateLabel = delivered ? data.deliveredOn : data.estimatedDelivery;
  const big = bigDateParts(dateIso);
  const showDate = cfg.showEstimatedDelivery && (big || dateLabel);
  const latest = data.events[0];
  const latestStamp = latest ? eventStamp(latest) : null;

  const flash = (k: 'awb' | 'link') => { setCopied(k); setTimeout(() => setCopied(null), 1500); };
  const copyAwb = async () => { await copyToClipboard(data.awb); flash('awb'); };
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: `Track shipment ${data.awb}`, url }); return; } catch { /* dismissed — fall back to copy */ }
    }
    await copyToClipboard(url);
    flash('link');
  };

  const borderSoft = `1px solid ${t.border}`;

  return (
    <div className="overflow-hidden grid grid-cols-1 @3xl:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]" style={cardStyle(t)}>
      {/* ── Left: delivery date, status, courier ── */}
      <div className="p-5 @2xl:p-7 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[13px] font-medium" style={{ color: t.text }}>
            {showDate ? (delivered ? 'Delivered On' : 'Estimated Delivery Date') : 'Shipment Status'}
          </p>
          <button type="button" onClick={share} className="relative -mt-1 -mr-1 w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70" style={{ color: t.text }} aria-label="Share tracking link" title={copied === 'link' ? 'Link copied' : 'Share'}>
            {copied === 'link' ? <Check className="w-[18px] h-[18px]" style={{ color: cfg.statusColors.completed }} /> : <Share2 className="w-[18px] h-[18px]" />}
          </button>
        </div>

        {showDate && (
          big ? (
            <div className="mt-1">
              <p className="text-[22px] font-bold leading-tight" style={{ color: t.text }}>{big.weekday}</p>
              <p className="text-[15px] font-semibold leading-tight" style={{ color: t.text }}>{big.month}</p>
              <div className="flex items-center gap-5">
                <p className="text-[88px] leading-[0.95] font-normal tabular-nums tracking-tight my-1" style={{ color: t.primary }}>{big.day}</p>
                {delivered && cfg.showDeliveredAnimation && <DeliveredCelebration key={data.awb + data.status} t={t} color={cfg.statusColors.completed} size={56} />}
              </div>
            </div>
          ) : (
            <p className="text-[26px] font-bold mt-1" style={{ color: t.primary }}>{dateLabel}</p>
          )
        )}
        {!showDate && delivered && cfg.showDeliveredAnimation && (
          <div className="mt-3"><DeliveredCelebration key={data.awb + data.status} t={t} color={cfg.statusColors.completed} size={56} /></div>
        )}

        <p className="text-[26px] @2xl:text-[30px] font-normal uppercase tracking-wide leading-tight mt-2" style={{ color: statusColor }}>
          {data.status}
        </p>
        {latest && latestStamp && (
          <p className="text-[12px] mt-1" style={{ color: t.muted }}>Last updated {latestStamp.day.replace(/([A-Z])([A-Z]+)/, (_, a: string, b: string) => a + b.toLowerCase())}{latestStamp.time ? `, ${latestStamp.time}` : ''}</p>
        )}

        {data.isException && (
          <div className="mt-3 flex items-start gap-2 px-3 py-2.5" style={{ background: `color-mix(in srgb, ${cfg.statusColors.exception} 12%, transparent)`, borderRadius: t.radiusSm }}>
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: cfg.statusColors.exception }} />
            <p className="text-[12.5px] font-medium" style={{ color: t.text }}>{latest?.description || 'There is an issue with this shipment. The courier will update the status shortly.'}</p>
          </div>
        )}

        {cfg.showProgressBar && (
          <div className="mt-4">
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `color-mix(in srgb, ${cfg.statusColors.pending} 45%, transparent)` }}>
              <motion.div className="h-full rounded-full" style={{ background: data.isException ? cfg.statusColors.exception : cfg.statusColors.completed }} initial={false} animate={{ width: `${Math.max(progress, 4)}%` }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
            </div>
            <p className="text-[11.5px] font-medium mt-1.5" style={{ color: t.muted }}>
              {MILESTONES[Math.min(data.milestoneIndex, MILESTONES.length - 1)].label} · Step {Math.min(data.milestoneIndex + 1, MILESTONES.length)} of {MILESTONES.length}
            </p>
          </div>
        )}

        {helpHref && !delivered && (
          <a href={helpHref} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold hover:underline underline-offset-4 self-start" style={{ color: t.primary }}>
            <Headset className="w-4 h-4" /> Need help with delivery?
          </a>
        )}

        {(cfg.showCourier || cfg.showAwb) && (
          <div className="mt-auto pt-5">
            <div className="flex items-center justify-between gap-4 pt-5" style={{ borderTop: borderSoft }}>
              {cfg.showCourier && data.courierName ? (
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-12 h-12 shrink-0 flex items-center justify-center overflow-hidden bg-white" style={{ boxShadow: `inset 0 0 0 1px ${t.border}`, borderRadius: t.radiusSm }}>
                    {data.courierLogo ? (
                      <img src={data.courierLogo} alt={data.courierName} className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-[16px] font-extrabold" style={{ color: t.primary }}>{data.courierName.charAt(0)}</span>
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold truncate" style={{ color: t.text }}>{data.courierName}</p>
                    <p className="text-[11.5px]" style={{ color: t.muted }}>Courier Partner</p>
                  </div>
                </div>
              ) : <span />}
              {cfg.showAwb && (
                <div className="text-right shrink-0">
                  <p className="text-[12.5px] font-semibold" style={{ color: t.text }}>Tracking ID</p>
                  <button type="button" onClick={copyAwb} className="inline-flex items-center gap-1 text-[13.5px] font-semibold tabular-nums mt-0.5 hover:opacity-80" style={{ color: t.primary }} aria-label="Copy tracking ID">
                    {data.awb}
                    {copied === 'awb' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3 h-3 opacity-70" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Right: tracking history ── */}
      <div className="p-5 @2xl:p-7" style={{ background: t.surfaceMuted }}>
        <div className="flex items-center justify-between gap-3 mb-5">
          <h3 className="text-[15px] font-bold" style={{ color: t.text }}>Tracking History</h3>
          <span className="text-[11.5px] font-semibold px-2 py-0.5" style={{ color: t.muted, background: t.surfaceMuted, borderRadius: 999 }}>
            {data.events.length} {data.events.length === 1 ? 'update' : 'updates'}
          </span>
        </div>
        {cfg.timelineStyle === 'horizontal' && <MilestoneStepper data={data} cfg={cfg} t={t} />}
        <ActivityFeed data={data} cfg={cfg} t={t} />
      </div>
    </div>
  );
}
