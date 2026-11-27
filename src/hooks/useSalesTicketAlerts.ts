import { useCallback, useEffect, useRef, useState } from 'react';
import { getTeamTickets, type Ticket } from '../services/api/supportService';

/**
 * Sales team: watches the Sales ticket queue. Polls every `intervalMs`; a ticket the browser has not seen before
 * plays a short chime and is returned in `fresh` (for a pop-up). The first load only records what exists, so
 * nobody is alerted for old tickets. Seen IDs live in localStorage per browser.
 */
const SEEN_KEY = 'qp_sales_tickets_seen';

const readSeen = (): Set<string> | null => {
  try { const v = localStorage.getItem(SEEN_KEY); return v ? new Set(JSON.parse(v)) : null; } catch { return null; }
};
const writeSeen = (s: Set<string>) => { try { localStorage.setItem(SEEN_KEY, JSON.stringify([...s].slice(-500))); } catch { /* ignore */ } };

/** Two-note chime, generated (no audio file). Browsers allow it after the user has interacted with the page. */
export function playChime() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!Ctx) return;
    const ctx = new Ctx();
    [[880, 0], [1320, 0.16]].forEach(([freq, at]) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + at);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.45);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + at); o.stop(ctx.currentTime + at + 0.5);
    });
    setTimeout(() => ctx.close().catch(() => {}), 1200);
  } catch { /* sound is best-effort */ }
}

export function useSalesTicketAlerts(enabled: boolean, intervalMs = 30_000) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [fresh, setFresh] = useState<Ticket[]>([]);
  const busy = useRef(false);

  const check = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const list = await getTeamTickets('sales');
      setTickets(list);
      const seen = readSeen();
      if (!seen) { writeSeen(new Set(list.map(t => t._id))); return; }       // first run: baseline only
      const open = list.filter(t => t.status !== 'closed' && t.status !== 'resolved');
      const added = open.filter(t => !seen.has(t._id));
      if (added.length) {
        added.forEach(t => seen.add(t._id));
        writeSeen(seen);
        setFresh(added);
        playChime();
      }
    } catch { /* offline / no access: stay quiet */ } finally { busy.current = false; }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    check();
    const t = setInterval(check, intervalMs);
    const onFocus = () => check();
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(t); window.removeEventListener('focus', onFocus); };
  }, [enabled, intervalMs, check]);

  const openCount = tickets.filter(t => t.status !== 'closed' && t.status !== 'resolved').length;
  return { tickets, openCount, fresh, dismiss: () => setFresh([]), refresh: check };
}
