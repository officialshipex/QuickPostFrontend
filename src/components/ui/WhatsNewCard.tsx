import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { ANNOUNCEMENTS, ANNOUNCEMENT_DELAY_MS, ANNOUNCEMENT_EVERY_LOGIN, ANNOUNCEMENT_PAGES } from '../../config/announcements';
import { getRoleFromToken, getToken, getUserFromToken } from '../../utils/session';
import { useShippingMode } from '../../context/shippingMode';

/* Seller-side "What's New" card. Bottom-right on desktop, bottom sheet-style card on mobile.
   - Appears ANNOUNCEMENT_DELAY_MS after landing on an allowed page (never on forms/KYC/payments).
   - Items are page-aware: an announcement with `pages` shows only there; others show on ANNOUNCEMENT_PAGES.
   - ✕ or the main button → items marked seen for this seller (localStorage, per user id),
     or — with ANNOUNCEMENT_EVERY_LOGIN — hidden until the next login like "Later".
   - "Later" or swipe down → those items hidden until the next login (sessionStorage, tied to the token). */

const seenKey = (uid: string) => `qp_whats_new_seen:${uid}`;
const LATER_KEY = 'qp_whats_new_later';

function readSeen(uid: string): string[] {
  try { return JSON.parse(localStorage.getItem(seenKey(uid)) || '[]'); } catch { return []; }
}
function writeSeen(uid: string, ids: string[]) {
  try { localStorage.setItem(seenKey(uid), JSON.stringify([...new Set([...readSeen(uid), ...ids])])); } catch { /* storage blocked */ }
}
function readLater(token: string): string[] {
  try {
    const v = JSON.parse(sessionStorage.getItem(LATER_KEY) || 'null');
    return v?.t === token.slice(-16) && Array.isArray(v.ids) ? v.ids : [];
  } catch { return []; }
}
function writeLater(token: string, ids: string[]) {
  try { sessionStorage.setItem(LATER_KEY, JSON.stringify({ t: token.slice(-16), ids: [...new Set([...readLater(token), ...ids])] })); } catch { /* storage blocked */ }
}
const onPage = (pages: string[], path: string) => pages.some(p => path === p || path.startsWith(p + '/'));

export function WhatsNewCard() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = getToken() || '';
  const user = token ? getUserFromToken(token) : null;
  const uid: string = user?._id || user?.id || user?.userId || 'seller';
  const { isCargo } = useShippingMode();
  // B2C announcements only — Cargo gets its own later.
  const eligible = !!token && !isCargo && getRoleFromToken(token) === 'user' && !localStorage.getItem('admin_token_backup');

  const [hidden, setHidden] = useState<string[]>(() => (token ? readLater(token) : []));
  const path = location.pathname;
  // Sub-views like /user/channels?view=shopify are forms — stay out of the way there.
  const inForm = new URLSearchParams(location.search).has('view');

  const items = useMemo(() => {
    if (!eligible || inForm) return [];
    const seen = ANNOUNCEMENT_EVERY_LOGIN ? [] : readSeen(uid);
    return ANNOUNCEMENTS
      .filter(a => onPage(a.pages || ANNOUNCEMENT_PAGES, path))
      .filter(a => !seen.includes(a.id) && !hidden.includes(a.id))
      .slice(0, 3);
  }, [eligible, inForm, uid, path, hidden]);

  // Re-arm the delay and reset the dots whenever the set of items changes (e.g. Home → Channels).
  const groupKey = items.map(a => a.id).join(',');
  const [openKey, setOpenKey] = useState('');
  const [pos, setPos] = useState({ key: '', i: 0 });
  const index = pos.key === groupKey ? pos.i : 0;
  const setIndex = (i: number) => setPos({ key: groupKey, i });

  useEffect(() => {
    if (!groupKey || openKey === groupKey) return;
    const t = setTimeout(() => setOpenKey(groupKey), ANNOUNCEMENT_DELAY_MS);
    return () => clearTimeout(t);
  }, [groupKey, openKey]);

  const visible = !!groupKey && openKey === groupKey;
  const item = items[Math.min(index, items.length - 1)];
  const heading = item?.heading || "What's new in QuickPost";

  const later = () => {
    const ids = items.map(a => a.id);
    writeLater(token, ids);
    setHidden(h => [...h, ...ids]);
  };
  const dismiss = () => {
    if (ANNOUNCEMENT_EVERY_LOGIN) { later(); return; }
    const ids = items.map(a => a.id);
    writeSeen(uid, ids);
    setHidden(h => [...h, ...ids]);
  };
  const act = () => {
    const href = item?.href;
    dismiss();
    if (href) navigate(href);
  };

  return (
    <AnimatePresence>
      {visible && item && (
        <motion.div
          role="dialog"
          aria-label={heading}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.6 }}
          onDragEnd={(_, info) => { if (info.offset.y > 60) later(); }}
          className="fixed z-[150] bottom-3 inset-x-3 md:inset-x-auto md:right-6 md:bottom-6 md:w-[360px] bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_12px_40px_-12px_rgba(15,23,42,0.25),0_2px_8px_rgba(16,24,40,0.06)] p-4 touch-pan-x md:touch-auto"
        >
          <div className="md:hidden w-9 h-1 rounded-full bg-[#E2E8F0] mx-auto -mt-1.5 mb-2.5" />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full ${item.tag === 'NEW' ? 'bg-[#00A86B]/10 text-[#00A86B]' : item.tag === 'COMING SOON' ? 'bg-amber-50 text-amber-700' : 'bg-sky-50 text-sky-700'}`}>
                {item.tag}
              </span>
              <span className="text-[12px] font-medium text-[#64748B] truncate">{heading}</span>
            </div>
            <button type="button" onClick={dismiss} aria-label="Dismiss what's new"
              className="w-7 h-7 -mr-1 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.16 }}
              className="mt-2.5"
            >
              <h4 className="text-[14px] font-bold text-[#0F172A]">{item.title}</h4>
              <p className="text-[12.5px] leading-[1.5] text-[#475569] mt-1">{item.body}</p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between gap-3 mt-3.5">
            <div className="flex items-center gap-1.5">
              {items.length > 1 && items.map((a, i) => (
                <button key={a.id} type="button" onClick={() => setIndex(i)} aria-label={`Show update ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-[#00A86B]' : 'w-1.5 bg-[#CBD5E1] hover:bg-[#94A3B8]'}`} />
              ))}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button type="button" onClick={later}
                className="h-8 px-3 rounded-full text-[12px] font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors">
                Later
              </button>
              <button type="button" onClick={act}
                className="h-8 px-4 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[12px] font-bold transition-colors shadow-sm">
                {item.cta}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
