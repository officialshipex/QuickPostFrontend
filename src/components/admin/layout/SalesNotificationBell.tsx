import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell, BellOff, AlertCircle, CalendarDays, PhoneCall, ListChecks, ChevronRight, CheckCircle2, Undo2, MessageSquare, Wrench,
  UserPlus, ShieldCheck, ShieldAlert, Gift, Banknote, Users, StickyNote, Volume2, VolumeX, MonitorSmartphone, CheckCheck,
} from 'lucide-react';
import { useAdminTab } from '../../../context/AdminUserContext';
import { salesApiClient, type SalesCall, type SalesNotice, type SalesNoticeType } from '../../../services/salesApi';
import { readTasks, loadTasks, todayStr, TASKS_CHANGED_EVENT, type SalesTask } from '../../../pages/admin/sales/tasksStore';

/* Navbar bell for the Sales team.
   1. Notifications from the server (backend sales/salesNotify.js): Support replied / sent a ticket back / closed it,
      leads assigned, a seller signed up with their code, KYC decision, bonus earned, payout sent. Checked every 30 s
      (every 90 s while the tab is in the background, and at once when it comes back). A new one plays a short chime
      (can be muted) and, when the tab is in the background and the person allowed it, shows a desktop alert.
   2. Reminders worked out here: overdue / due-today tasks (Tasks) and follow-ups due (refreshed every 5 minutes). */

const POLL_MS = 30_000;
const POLL_HIDDEN_MS = 90_000;
const FOLLOW_UPS_MS = 5 * 60_000;
const MUTE_KEY = 'qp_sales_bell_muted';

const NOTICE_STYLE: Record<SalesNoticeType, { icon: typeof Bell; tone: string }> = {
  ticket_handback: { icon: Undo2, tone: 'bg-[#ECFDF5] text-[#047857]' },
  ticket_reply: { icon: MessageSquare, tone: 'bg-sky-50 text-sky-600' },
  ticket_note: { icon: StickyNote, tone: 'bg-amber-50 text-amber-600' },
  ticket_seller_reply: { icon: MessageSquare, tone: 'bg-violet-50 text-violet-600' },
  ticket_tech: { icon: Wrench, tone: 'bg-indigo-50 text-indigo-600' },
  ticket_closed: { icon: CheckCircle2, tone: 'bg-[#F0FDF4] text-[#00A86B]' },
  leads_assigned: { icon: Users, tone: 'bg-sky-50 text-sky-600' },
  seller_signup: { icon: UserPlus, tone: 'bg-[#F0FDF4] text-[#00A86B]' },
  kyc_approved: { icon: ShieldCheck, tone: 'bg-[#F0FDF4] text-[#00A86B]' },
  kyc_rejected: { icon: ShieldAlert, tone: 'bg-red-50 text-red-500' },
  bonus_earned: { icon: Gift, tone: 'bg-amber-50 text-amber-600' },
  payout_paid: { icon: Banknote, tone: 'bg-emerald-50 text-emerald-700' },
};

interface Reminder { id: string; tone: string; icon: typeof Bell; title: string; meta: string; to: string }

const ago = (iso: string) => {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// ─── Sound: a short two-note chime made in the browser (no file to load) ───
let audioCtx: AudioContext | null = null;
function getAudio(): AudioContext | null {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    return audioCtx;
  } catch { return null; }
}
function chime() {
  const ctx = getAudio();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  const now = ctx.currentTime;
  [[880, 0], [1318.5, 0.14]].forEach(([freq, at]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + at);
    gain.gain.exponentialRampToValueAtTime(0.25, now + at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.45);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + at);
    osc.stop(now + at + 0.5);
  });
}

const readMuted = () => { try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; } };
const desktopSupported = () => typeof window !== 'undefined' && 'Notification' in window;

export function SalesNotificationBell() {
  const navigate = useNavigate();
  const { employeeId, currentUserId } = useAdminTab();
  const owner = employeeId || currentUserId;
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<SalesTask[]>(() => readTasks(owner));
  const [loadedFor, setLoadedFor] = useState(owner);
  if (loadedFor !== owner) { setLoadedFor(owner); setTasks(readTasks(owner)); }
  const [followUps, setFollowUps] = useState<SalesCall[]>([]);
  const [notices, setNotices] = useState<SalesNotice[]>([]);
  const [unread, setUnread] = useState(0);
  const [muted, setMuted] = useState(readMuted);
  const [ring, setRing] = useState(0); // bumps to shake the bell
  const [desktop, setDesktop] = useState<NotificationPermission | 'unsupported'>(() => (desktopSupported() ? Notification.permission : 'unsupported'));
  const seen = useRef<Set<string> | null>(null); // ids already shown (null until the first load: no chime for old ones)
  const mutedRef = useRef(muted);
  useEffect(() => { mutedRef.current = muted; }, [muted]);
  const ref = useRef<HTMLDivElement>(null);

  // Browsers only allow sound after the person has clicked / typed on the page once
  useEffect(() => {
    const unlock = () => { const ctx = getAudio(); if (ctx?.state === 'suspended') ctx.resume().catch(() => {}); };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
  }, []);

  // Tasks stay in sync with the Tasks page
  useEffect(() => {
    const sync = () => setTasks(readTasks(owner));
    window.addEventListener(TASKS_CHANGED_EVENT, sync);
    if (owner) loadTasks(owner);
    return () => window.removeEventListener(TASKS_CHANGED_EVENT, sync);
  }, [owner]);

  // Follow-ups due (refused until the person's KYC is verified — then simply none)
  useEffect(() => {
    let alive = true;
    const load = () => salesApiClient.get('/overview').then(res => { if (alive) setFollowUps(res.data?.followUpList || []); }).catch(() => {});
    load();
    const id = window.setInterval(load, FOLLOW_UPS_MS);
    return () => { alive = false; window.clearInterval(id); };
  }, []);

  const announce = useCallback((fresh: SalesNotice[]) => {
    if (!fresh.length) return;
    setRing(r => r + 1);
    if (!mutedRef.current) chime();
    if (document.hidden && desktopSupported() && Notification.permission === 'granted') {
      fresh.slice(0, 3).forEach(n => {
        try {
          const d = new Notification(n.title, { body: n.body || '', tag: n._id, icon: '/favicon.ico' });
          d.onclick = () => { window.focus(); if (n.link) navigate(n.link); d.close(); };
        } catch { /* some browsers only allow this from a service worker */ }
      });
    }
  }, [navigate]);

  // Server notifications: poll, faster while the tab is in front
  const poll = useCallback(async () => {
    try {
      const { data } = await salesApiClient.get('/notifications');
      const items: SalesNotice[] = data?.items || [];
      setNotices(items);
      setUnread(Number(data?.unread) || 0);
      if (seen.current === null) {
        seen.current = new Set(items.map(n => n._id)); // first load: what is already there makes no sound
      } else {
        const fresh = items.filter(n => !n.readAt && !seen.current!.has(n._id));
        items.forEach(n => seen.current!.add(n._id));
        announce(fresh);
      }
    } catch { /* offline / logged out: the next poll tries again */ }
  }, [announce]);

  useEffect(() => {
    let timer: number | undefined;
    let stopped = false;
    const run = async () => {
      await poll();
      if (stopped) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(run, document.hidden ? POLL_HIDDEN_MS : POLL_MS);
    };
    const now = () => { window.clearTimeout(timer); timer = window.setTimeout(run, 0); };
    const onVisible = () => { if (!document.hidden) now(); };
    now();
    document.addEventListener('visibilitychange', onVisible);
    return () => { stopped = true; window.clearTimeout(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [poll]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const markRead = (ids: string[] | 'all') => {
    const now = new Date().toISOString();
    setNotices(list => list.map(n => (ids === 'all' || ids.includes(n._id) ? { ...n, readAt: n.readAt || now } : n)));
    setUnread(u => (ids === 'all' ? 0 : Math.max(0, u - notices.filter(n => !n.readAt && ids.includes(n._id)).length)));
    salesApiClient.post('/notifications/read', ids === 'all' ? { all: true } : { ids }).catch(() => {});
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    try { localStorage.setItem(MUTE_KEY, next ? '1' : '0'); } catch { /* private mode */ }
    if (!next) chime(); // let them hear it
  };
  const askDesktop = () => {
    if (!desktopSupported()) return;
    Notification.requestPermission().then(p => setDesktop(p)).catch(() => {});
  };

  const today = todayStr();
  const reminders: Reminder[] = [
    ...tasks.filter(t => !t.done && t.due && t.due < today).map(t => ({ id: `o-${t.id}`, tone: 'bg-red-50 text-red-500', icon: AlertCircle, title: t.title, meta: `Task overdue${t.relatedTo ? ` · ${t.relatedTo}` : ''}`, to: '/admin/tasks' })),
    ...tasks.filter(t => !t.done && t.due === today).map(t => ({ id: `d-${t.id}`, tone: 'bg-sky-50 text-sky-600', icon: CalendarDays, title: t.title, meta: `Task due today${t.relatedTo ? ` · ${t.relatedTo}` : ''}`, to: '/admin/tasks' })),
    ...followUps.map(c => ({ id: `f-${c._id}`, tone: 'bg-amber-50 text-amber-600', icon: PhoneCall, title: `Follow up with ${c.leadName}`, meta: c.followUpAt ? new Date(c.followUpAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }) : 'Follow-up due', to: '/admin/sales?tab=calls' })),
  ];
  const count = unread + reminders.length;
  const go = (to: string) => { setOpen(false); navigate(to); };

  return (
    <div ref={ref} className="relative">
      <motion.button type="button" onClick={() => setOpen(o => !o)} aria-label={`Sales notifications${count ? ` (${count})` : ''}`}
        key={ring} animate={ring ? { rotate: [0, -14, 12, -8, 6, 0] } : undefined} transition={{ duration: 0.6 }}
        className={`w-10 h-10 rounded-[14px] border flex items-center justify-center transition-colors relative ${open ? 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A]' : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'}`}>
        {muted ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
        {count > 0 && (
          <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white tabular-nums ${unread > 0 ? 'bg-red-500' : 'bg-amber-500'}`}>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-[min(370px,calc(100vw-24px))] bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_20px_40px_-12px_rgba(15,23,42,0.2)] overflow-hidden z-[120] origin-top-right"
          >
            <div className="px-4 py-3 border-b border-[#F1F5F9] flex items-center justify-between gap-2">
              <div className="text-[13.5px] font-bold text-[#0F172A]">Notifications{unread > 0 && <span className="ml-1.5 text-[11.5px] font-semibold text-red-500">{unread} new</span>}</div>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button type="button" onClick={() => markRead('all')} title="Mark all as read" className="h-7 px-2 rounded-lg text-[11.5px] font-semibold text-[#00A86B] hover:bg-[#F0FDF4] inline-flex items-center gap-1"><CheckCheck className="w-3.5 h-3.5" />Read all</button>
                )}
                <button type="button" onClick={toggleMute} title={muted ? 'Sound off — click to turn on' : 'Sound on — click to mute'} aria-label={muted ? 'Turn notification sound on' : 'Mute notification sound'}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9]">
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {desktop === 'default' && (
              <button type="button" onClick={askDesktop} className="w-full px-4 py-2 bg-[#F8FAFC] border-b border-[#F1F5F9] text-left text-[12px] text-[#475569] hover:bg-[#F0FDF4] inline-flex items-center gap-2">
                <MonitorSmartphone className="w-4 h-4 text-[#00A86B] shrink-0" />Turn on desktop alerts — get notified even when this tab is in the background
              </button>
            )}

            <div className="max-h-[420px] overflow-y-auto">
              {notices.length === 0 && reminders.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <span className="mx-auto w-10 h-10 rounded-full bg-[#F0FDF4] flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-[#00A86B]" /></span>
                  <p className="mt-2.5 text-[13px] font-semibold text-[#0F172A]">You're all caught up</p>
                  <p className="text-[12px] text-[#94A3B8] mt-0.5">Support replies on your tickets, new leads, sign-ups, payouts and your reminders show up here.</p>
                </div>
              ) : (
                <>
                  {reminders.length > 0 && (
                    <>
                      <div className="px-4 pt-2.5 pb-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">Reminders</div>
                      <ul className="divide-y divide-[#F1F5F9]">
                        {reminders.slice(0, 8).map(r => (
                          <li key={r.id}>
                            <button type="button" onClick={() => go(r.to)} className="w-full px-4 py-2.5 flex items-start gap-3 text-left hover:bg-[#F8FAFC] transition-colors">
                              <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${r.tone}`}><r.icon className="w-4 h-4" /></span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-[13px] font-medium text-[#0F172A] truncate">{r.title}</span>
                                <span className="block text-[11.5px] text-[#64748B] truncate mt-0.5">{r.meta}</span>
                              </span>
                              <ChevronRight className="w-4 h-4 text-[#CBD5E1] mt-2 shrink-0" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {notices.length > 0 && (
                    <>
                      <div className="px-4 pt-2.5 pb-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">Updates</div>
                      <ul className="divide-y divide-[#F1F5F9]">
                        {notices.map(n => {
                          const s = NOTICE_STYLE[n.type] || { icon: Bell, tone: 'bg-slate-100 text-slate-500' };
                          return (
                            <li key={n._id}>
                              <button type="button" onClick={() => { if (!n.readAt) markRead([n._id]); go(n.link || '/admin/sales'); }}
                                className={`w-full px-4 py-2.5 flex items-start gap-3 text-left transition-colors ${n.readAt ? 'hover:bg-[#F8FAFC]' : 'bg-[#F0FDF4]/60 hover:bg-[#F0FDF4]'}`}>
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${s.tone}`}><s.icon className="w-4 h-4" /></span>
                                <span className="min-w-0 flex-1">
                                  <span className={`block text-[13px] text-[#0F172A] ${n.readAt ? 'font-medium' : 'font-bold'}`}>{n.title}</span>
                                  {n.body && <span className="block text-[11.5px] text-[#64748B] mt-0.5 line-clamp-2 break-words">{n.body}</span>}
                                  <span className="block text-[10.5px] text-[#94A3B8] mt-0.5">{ago(n.createdAt)}</span>
                                </span>
                                {!n.readAt && <span className="w-2 h-2 rounded-full bg-[#00A86B] mt-2 shrink-0" aria-label="Unread" />}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}
                </>
              )}
            </div>
            <div className="grid grid-cols-2 border-t border-[#F1F5F9]">
              <button type="button" onClick={() => go('/admin/sales?tab=tickets')}
                className="px-4 py-2.5 text-[12.5px] font-semibold text-[#00A86B] hover:bg-[#F0FDF4] inline-flex items-center justify-center gap-1.5 border-r border-[#F1F5F9]">
                <MessageSquare className="w-4 h-4" /> My tickets
              </button>
              <button type="button" onClick={() => go('/admin/tasks')}
                className="px-4 py-2.5 text-[12.5px] font-semibold text-[#00A86B] hover:bg-[#F0FDF4] inline-flex items-center justify-center gap-1.5">
                <ListChecks className="w-4 h-4" /> Open Tasks
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
