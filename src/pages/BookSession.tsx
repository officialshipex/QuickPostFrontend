import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarCheck, Check, ChevronLeft, ChevronRight, Clock, GraduationCap, Headphones, Lock,
  MonitorPlay, PlayCircle, ShieldCheck, Sparkles, X,
} from 'lucide-react';

/* Seller training — book a free 1:1 onboarding session (opens in its own tab from Home).
   Pick a date and a time slot, optionally the topics to cover, and confirm. The request is
   acknowledged in-page; wire `confirm()` to the booking API when the backend is ready. */

const SLOT_START_HOUR = 10;   // 10:00 AM
const SLOT_END_HOUR = 18;     // last slot starts 5:30 PM
const SLOT_MINUTES = 30;
const DAYS_AHEAD = 30;        // bookable window
const CLOSED_WEEKDAYS = [0];  // Sunday

const TOPICS = ['Dashboard & reports', 'Creating & shipping orders', 'NDR & RTO', 'COD & wallet', 'Channels (Shopify / WooCommerce)', 'Rate cards & courier selection'];

const MODULES = [
  { title: 'Getting started with QuickPost', meta: '6 lessons · 18 min', icon: PlayCircle },
  { title: 'Shipping 101: orders to doorstep', meta: '8 lessons · 25 min', icon: MonitorPlay },
  { title: 'Reducing RTO and handling NDR', meta: '5 lessons · 15 min', icon: ShieldCheck },
  { title: 'COD, wallet and remittance', meta: '4 lessons · 12 min', icon: Sparkles },
];

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const fmtTime = (h: number, m: number) => new Date(2000, 0, 1, h, m).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
const fmtDate = (d: Date) => d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

function slotsFor(day: Date): { label: string; past: boolean }[] {
  const now = new Date();
  const out: { label: string; past: boolean }[] = [];
  for (let mins = SLOT_START_HOUR * 60; mins < SLOT_END_HOUR * 60; mins += SLOT_MINUTES) {
    const h = Math.floor(mins / 60), m = mins % 60;
    const at = new Date(day); at.setHours(h, m, 0, 0);
    out.push({ label: fmtTime(h, m), past: at.getTime() <= now.getTime() + 60 * 60 * 1000 }); // 1h notice
  }
  return out;
}

export function BookSession() {
  const today = startOfDay(new Date());
  const lastDay = new Date(today); lastDay.setDate(today.getDate() + DAYS_AHEAD);
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  const days = useMemo(() => {
    const first = new Date(month);
    const lead = first.getDay();
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))] as (Date | null)[];
  }, [month]);

  const isBookable = (d: Date) => d >= today && d <= lastDay && !CLOSED_WEEKDAYS.includes(d.getDay()) && slotsFor(d).some(s => !s.past);
  const canPrev = month > new Date(today.getFullYear(), today.getMonth(), 1);
  const canNext = new Date(month.getFullYear(), month.getMonth() + 1, 1) <= lastDay;
  const slots = date ? slotsFor(date) : [];

  const toggleTopic = (t: string) => setTopics(v => (v.includes(t) ? v.filter(x => x !== t) : [...v, t]));
  const confirm = () => { if (date && time) setConfirmed(true); };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Top bar */}
      <header className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <img src="/logo-color.png" alt="QuickPost" className="h-12 w-auto object-contain scale-[1.4] origin-left" />
          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#00A86B] bg-[#F0FDF4] border border-[#DCFCE7] px-3 py-1 rounded-full">
            <GraduationCap className="w-4 h-4" /> Seller Training
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-[24px] md:text-[30px] font-bold tracking-tight">Book your free onboarding session</h1>
          <p className="text-[14px] md:text-[15px] text-[#64748B] mt-2">
            A 1:1 walkthrough with a QuickPost expert — set up faster, ship smarter and get every question answered.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-5 items-start">
          {/* Session details */}
          <aside className="bg-white rounded-2xl border border-[#EEF2F6] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)] p-5">
            <span className="w-11 h-11 rounded-xl bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center"><Headphones className="w-5 h-5" /></span>
            <h2 className="mt-3 text-[16px] font-bold">1:1 Onboarding Session</h2>
            <div className="mt-3 space-y-2 text-[13px] text-[#475569]">
              <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#94A3B8]" /> Free for all QuickPost sellers</div>
            </div>
            <div className="h-px bg-[#F1F5F9] my-4" />
            <div className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wider mb-2">What we'll cover</div>
            <ul className="space-y-2">
              {['A tour of your dashboard and reports', 'Creating, shipping and tracking orders', 'Handling NDR, RTO and weight disputes', 'Wallet, COD remittance and invoices'].map(t => (
                <li key={t} className="flex items-start gap-2 text-[13px] text-[#334155]">
                  <Check className="w-4 h-4 text-[#00A86B] mt-0.5 shrink-0" strokeWidth={3} /> {t}
                </li>
              ))}
            </ul>
          </aside>

          {/* Scheduler */}
          <section className="bg-white rounded-2xl border border-[#EEF2F6] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)] overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_260px]">
              {/* Calendar */}
              <div className="p-5 md:border-r border-[#F1F5F9]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[15px] font-bold">Select a date</h3>
                  <div className="flex items-center gap-1">
                    <button type="button" disabled={!canPrev} aria-label="Previous month"
                      onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-30 disabled:pointer-events-none">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[13px] font-semibold w-[120px] text-center">{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
                    <button type="button" disabled={!canNext} aria-label="Next month"
                      onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-30 disabled:pointer-events-none">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[#94A3B8] uppercase mb-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="py-1">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {days.map((d, i) => {
                    if (!d) return <div key={i} />;
                    const ok = isBookable(d);
                    const sel = !!date && sameDay(d, date);
                    const isToday = sameDay(d, today);
                    return (
                      <button key={i} type="button" disabled={!ok}
                        onClick={() => { setDate(d); setTime(null); }}
                        className={`relative h-10 rounded-xl text-[13px] font-semibold transition-colors ${
                          sel ? 'bg-[#00A86B] text-white shadow-[0_4px_12px_-4px_rgba(0,168,107,0.6)]'
                            : ok ? 'text-[#0F172A] bg-[#F0FDF4]/60 hover:bg-[#DCFCE7]'
                              : 'text-[#CBD5E1] cursor-not-allowed'
                        }`}>
                        {d.getDate()}
                        {isToday && !sel && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#00A86B]" />}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-[11.5px] text-[#94A3B8]">Available Monday to Saturday · All times in IST</p>
              </div>

              {/* Time slots */}
              <div className="p-5 bg-[#FCFDFD]">
                <h3 className="text-[15px] font-bold">Select a time</h3>
                <p className="text-[12px] text-[#64748B] mt-0.5 mb-3">{date ? date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Pick a date first'}</p>
                {date ? (
                  <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                    {slots.map(sl => {
                      const sel = time === sl.label;
                      return (
                        <button key={sl.label} type="button" disabled={sl.past} onClick={() => setTime(sl.label)}
                          className={`h-9 rounded-full text-[12.5px] font-semibold border transition-colors ${
                            sel ? 'bg-[#00A86B] border-[#00A86B] text-white'
                              : sl.past ? 'border-[#F1F5F9] text-[#CBD5E1] cursor-not-allowed line-through'
                                : 'border-[#E2E8F0] text-[#334155] hover:border-[#00A86B] hover:text-[#00A86B]'
                          }`}>
                          {sl.label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-[180px] rounded-xl border border-dashed border-[#E2E8F0] flex flex-col items-center justify-center text-center px-4">
                    <CalendarCheck className="w-6 h-6 text-[#CBD5E1]" />
                    <p className="text-[12px] text-[#94A3B8] mt-2">Available time slots will appear here</p>
                  </div>
                )}
              </div>
            </div>

            {/* Topics + confirm */}
            <div className="border-t border-[#F1F5F9] p-5">
              <div className="text-[13px] font-semibold text-[#0F172A]">What would you like help with? <span className="font-normal text-[#94A3B8]">(optional)</span></div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {TOPICS.map(t => {
                  const on = topics.includes(t);
                  return (
                    <button key={t} type="button" onClick={() => toggleTopic(t)}
                      className={`h-8 px-3.5 rounded-full text-[12.5px] font-medium border inline-flex items-center gap-1.5 transition-colors ${
                        on ? 'bg-[#F0FDF4] border-[#00A86B] text-[#00A86B]' : 'border-[#E2E8F0] text-[#475569] hover:border-[#CBD5E1]'
                      }`}>
                      {on && <Check className="w-3.5 h-3.5" strokeWidth={3} />}{t}
                    </button>
                  );
                })}
              </div>
              <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-[13px] text-[#475569]">
                  {date && time
                    ? <>Your session: <span className="font-semibold text-[#0F172A]">{fmtDate(date)}, {time}</span></>
                    : 'Choose a date and time to continue.'}
                </p>
                <button type="button" disabled={!date || !time} onClick={confirm}
                  className="h-11 px-7 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[14px] font-semibold shadow-sm inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:pointer-events-none">
                  <CalendarCheck className="w-4 h-4" /> Confirm session
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Training modules — coming soon */}
        <section className="mt-12">
          <div className="flex items-end justify-between gap-3 mb-4">
            <div>
              <h2 className="text-[18px] md:text-[20px] font-bold">Self-paced training modules</h2>
              <p className="text-[13px] text-[#64748B] mt-0.5">Short video lessons to master QuickPost at your own pace.</p>
            </div>
            <span className="hidden sm:inline-flex text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Coming soon</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MODULES.map(m => (
              <div key={m.title} className="relative bg-white rounded-2xl border border-[#EEF2F6] shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
                <div className="h-28 bg-gradient-to-br from-[#E6F9F2] to-[#F8FAFC] flex items-center justify-center">
                  <m.icon className="w-9 h-9 text-[#00A86B]/70" />
                </div>
                <div className="p-4">
                  <div className="text-[13.5px] font-semibold leading-snug">{m.title}</div>
                  <div className="text-[12px] text-[#94A3B8] mt-1">{m.meta}</div>
                </div>
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-[#64748B] border border-[#E2E8F0]">
                  <Lock className="w-3 h-3" /> Soon
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Confirmation */}
      <AnimatePresence>
        {confirmed && date && time && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={() => setConfirmed(false)} />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              role="dialog" aria-modal="true" aria-label="Session request received"
              className="relative w-full max-w-[420px] bg-white rounded-3xl shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] p-6 text-center"
            >
              <button type="button" onClick={() => setConfirmed(false)} aria-label="Close"
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#0F172A]">
                <X className="w-4 h-4" />
              </button>
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.1 }}
                className="mx-auto w-16 h-16 rounded-full bg-[#00A86B] text-white flex items-center justify-center ring-8 ring-[#F0FDF4]">
                <Check className="w-8 h-8" strokeWidth={3} />
              </motion.span>
              <h3 className="mt-5 text-[19px] font-bold">Session request received</h3>
              <p className="mt-1.5 text-[13.5px] text-[#64748B] leading-relaxed">Our team will reach out to you soon to confirm your session.</p>
              <div className="mt-5 rounded-2xl bg-[#F8FAFC] border border-[#EEF2F6] p-4 text-left space-y-2.5">
                <div className="flex items-center gap-2.5 text-[13px]"><CalendarCheck className="w-4 h-4 text-[#00A86B]" /><span className="font-semibold">{fmtDate(date)}</span></div>
                <div className="flex items-center gap-2.5 text-[13px]"><Clock className="w-4 h-4 text-[#00A86B]" /><span className="font-semibold">{time} IST</span></div>
                {topics.length > 0 && (
                  <div className="flex items-start gap-2.5 text-[13px]"><Sparkles className="w-4 h-4 text-[#00A86B] mt-0.5" /><span className="text-[#475569]">{topics.join(', ')}</span></div>
                )}
              </div>
              <button type="button" onClick={() => { window.close(); setConfirmed(false); }}
                className="mt-5 w-full h-11 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[14px] font-semibold shadow-sm transition-colors">
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
