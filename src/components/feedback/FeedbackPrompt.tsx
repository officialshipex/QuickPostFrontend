import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Check, ArrowRight } from 'lucide-react';
import { useAdminTab } from '../../context/AdminUserContext';
import { getToken } from '../../utils/session';

/* Seller feedback prompt (user side only). Mounted once for every logged-in page, so it measures continuous use
   of QuickPost — across pages and tabs — not time on one page. Time only counts while a QuickPost tab is visible;
   with several tabs open each time slot is counted once. The counter resets on every new login.
   Schedule: first shown after 30 min of use. "Maybe later" / close → shown again after every further 10 min of
   use, until the seller submits. Submitted → not shown again for 90 days.
   Backend not connected yet: responses are kept locally under FEEDBACK_STORE_KEY until an endpoint exists. */

const ACTIVE_MS_KEY = 'qp_active_ms';               // localStorage — active time in the current login
const ACTIVE_OWNER_KEY = 'qp_active_owner';         // localStorage — which login the counter belongs to
const LAST_TICK_KEY = 'qp_active_last_tick';        // localStorage — last counted slot (cross-tab de-dup)
const NEXT_AT_KEY = 'qp_feedback_next_at';          // localStorage — active-time mark (ms) when it shows next
const DONE_KEY = 'qp_feedback_done_until';          // localStorage — epoch ms; set after a submission
const FEEDBACK_STORE_KEY = 'qp_feedback_responses'; // localStorage — pending responses
const FIRST_SHOW_MS = 30 * 60 * 1000;               // first prompt after 30 min of use
const REMIND_EVERY_MS = 10 * 60 * 1000;             // after "Maybe later", again every 10 min of use
const TICK_MS = 15 * 1000;
const DAY = 24 * 60 * 60 * 1000;

const OPTIONS = ['Going well', 'Could be better', 'Facing issues'] as const;
type Sentiment = typeof OPTIONS[number];

const read = (store: Storage, key: string) => { try { return store.getItem(key); } catch { return null; } };
const write = (store: Storage, key: string, v: string) => { try { store.setItem(key, v); } catch { /* storage blocked */ } };

/** Small 3D visual: three stacked message cards gently tilting in perspective. */
function FeedbackVisual() {
  return (
    <div className="relative w-[72px] h-[64px] shrink-0 [perspective:420px]" aria-hidden>
      <motion.div className="absolute inset-0 [transform-style:preserve-3d]"
        animate={{ rotateY: [-16, 14, -16], rotateX: [10, 4, 10] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}>
        <div className="absolute left-3 top-1 w-[52px] h-[34px] rounded-lg bg-[#DCFCE7] border border-[#BBF7D0]" style={{ transform: 'translateZ(-18px)' }} />
        <div className="absolute left-1.5 top-3.5 w-[54px] h-[36px] rounded-lg bg-white border border-[#E2E8F0] shadow-sm p-1.5 space-y-1" style={{ transform: 'translateZ(0px)' }}>
          <span className="block h-1 w-8 rounded bg-[#E2E8F0]" />
          <span className="block h-1 w-6 rounded bg-[#E2E8F0]" />
        </div>
        <div className="absolute left-5 top-7 w-[48px] h-[30px] rounded-lg bg-[#00A86B] shadow-[0_8px_16px_-8px_rgba(0,168,107,0.6)] p-1.5 space-y-1" style={{ transform: 'translateZ(22px)' }}>
          <span className="block h-1 w-7 rounded bg-white/80" />
          <span className="block h-1 w-4 rounded bg-white/60" />
        </div>
      </motion.div>
    </div>
  );
}

export function FeedbackPrompt() {
  const { isAdmin, adminTab, loadingAdminTab } = useAdminTab();
  const userSide = !loadingAdminTab && !(isAdmin && adminTab);
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<Sentiment | null>(null);
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);

  // Accumulate continuous active time for this login; open once it crosses the threshold.
  useEffect(() => {
    if (!userSide) return;
    const tick = () => {
      if (Number(read(localStorage, DONE_KEY) || 0) > Date.now()) { setOpen(false); return; } // already submitted
      if (document.visibilityState !== 'visible') return;
      const owner = (getToken() || '').slice(-24);
      if (read(localStorage, ACTIVE_OWNER_KEY) !== owner) {
        write(localStorage, ACTIVE_OWNER_KEY, owner);
        write(localStorage, ACTIVE_MS_KEY, '0');
        write(localStorage, LAST_TICK_KEY, '0');
        write(localStorage, NEXT_AT_KEY, String(FIRST_SHOW_MS));
      }
      const now = Date.now();
      let total = Number(read(localStorage, ACTIVE_MS_KEY) || 0);
      // Another visible tab already counted this slot → don't count it twice.
      if (now - Number(read(localStorage, LAST_TICK_KEY) || 0) >= TICK_MS * 0.8) {
        total += TICK_MS;
        write(localStorage, ACTIVE_MS_KEY, String(total));
        write(localStorage, LAST_TICK_KEY, String(now));
      }
      const nextAt = Number(read(localStorage, NEXT_AT_KEY) || FIRST_SHOW_MS);
      // Open when due; closes here too if "Maybe later" was pressed in another tab.
      setOpen(total >= nextAt);
    };
    const id = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(id);
  }, [userSide]);

  // "Maybe later" / close: remind again after another REMIND_EVERY_MS of use.
  const remindLater = () => {
    const total = Number(read(localStorage, ACTIVE_MS_KEY) || 0);
    write(localStorage, NEXT_AT_KEY, String(total + REMIND_EVERY_MS));
    setOpen(false);
  };

  const submit = () => {
    if (!choice) return;
    let list: unknown[];
    try { list = JSON.parse(read(localStorage, FEEDBACK_STORE_KEY) || '[]'); } catch { list = []; }
    list.push({ sentiment: choice, note: note.trim(), page: window.location.pathname, at: new Date().toISOString() });
    write(localStorage, FEEDBACK_STORE_KEY, JSON.stringify(list));
    setSent(true);
    write(localStorage, DONE_KEY, String(Date.now() + 90 * DAY));
    window.setTimeout(() => setOpen(false), 2200);
  };

  if (!userSide) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="feedback" className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <div className="absolute inset-0 bg-[#0F172A]/45 backdrop-blur-[2px]" onClick={remindLater} />

          <motion.div role="dialog" aria-modal="true" aria-labelledby="qp-feedback-title"
            initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[440px] bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_24px_60px_-20px_rgba(15,23,42,0.4)] overflow-hidden">
            <button type="button" onClick={remindLater} aria-label="Close"
              className="absolute right-3 top-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-white hover:text-[#0F172A] transition-colors">
              <X className="w-4 h-4" />
            </button>

            <AnimatePresence mode="wait" initial={false}>
              {sent ? (
                <motion.div key="thanks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-6 py-10 flex flex-col items-center text-center">
                  <motion.span initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="w-12 h-12 rounded-full bg-[#F0FDF4] flex items-center justify-center">
                    <Check className="w-6 h-6 text-[#00A86B]" />
                  </motion.span>
                  <p className="mt-3 text-[16px] font-bold text-[#0F172A]">Thank you for your feedback</p>
                  <p className="mt-1 text-[13px] text-[#64748B]">It helps us make QuickPost better for you.</p>
                </motion.div>
              ) : (
                <motion.div key="form" exit={{ opacity: 0 }}>
                  {/* Header */}
                  <div className="bg-[#F8FAFC] border-b border-[#F1F5F9] pt-7 pb-5 px-6 flex flex-col items-center text-center">
                    <div className="scale-[1.2] origin-center"><FeedbackVisual /></div>
                    <h2 id="qp-feedback-title" className="mt-4 text-[17px] font-bold text-[#0F172A]">Help us improve QuickPost</h2>
                    <p className="mt-1 text-[13px] text-[#64748B]">How has your experience been so far?</p>
                  </div>

                  {/* Body */}
                  <div className="px-6 pt-5 pb-6">
                    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Your experience">
                      {OPTIONS.map(o => (
                        <button key={o} type="button" role="radio" aria-checked={choice === o} onClick={() => setChoice(o)}
                          className={`h-10 px-2 rounded-lg border text-[12.5px] font-semibold transition-colors ${choice === o
                            ? 'border-[#00A86B] bg-[#F0FDF4] text-[#0F6B38]'
                            : 'border-[#E2E8F0] text-[#475569] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'}`}>
                          {o}
                        </button>
                      ))}
                    </div>

                    <AnimatePresence initial={false}>
                      {choice && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <label className="block mt-4 text-[12.5px] font-semibold text-[#334155]">
                            {choice === 'Going well' ? 'Anything we could do even better?' : 'What should we improve?'}
                            <span className="font-normal text-[#94A3B8]"> (optional)</span>
                          </label>
                          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} maxLength={500}
                            placeholder="Share your thoughts"
                            className="mt-1.5 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] resize-none focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="mt-5 flex items-center gap-3">
                      <button type="button" onClick={remindLater}
                        className="flex-1 h-10 rounded-lg border border-[#E2E8F0] text-[13px] font-semibold text-[#475569] hover:bg-[#F8FAFC] transition-colors">
                        Maybe later
                      </button>
                      <button type="button" onClick={submit} disabled={!choice}
                        className="flex-1 h-10 rounded-lg bg-[#00A86B] hover:bg-[#00965F] text-white text-[13px] font-bold inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        Submit feedback <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
