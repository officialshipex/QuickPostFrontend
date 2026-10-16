import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, AlertCircle, CalendarDays, PhoneCall, ListChecks, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useAdminTab } from '../../../context/AdminUserContext';
import { salesApiClient, type SalesCall } from '../../../services/salesApi';
import { readTasks, todayStr, TASKS_CHANGED_EVENT, type SalesTask } from '../../../pages/admin/sales/tasksStore';

/* Navbar bell for the Sales team: overdue / due-today tasks (from Tasks) and sales activity
   (follow-ups due, from the Sales API — empty until the backend is connected). */

interface Notice { id: string; tone: 'red' | 'amber' | 'sky' | 'green'; icon: typeof Bell; title: string; meta: string; to: string }

const TONE: Record<Notice['tone'], string> = {
  red: 'bg-red-50 text-red-500', amber: 'bg-amber-50 text-amber-600', sky: 'bg-sky-50 text-sky-600', green: 'bg-[#F0FDF4] text-[#00A86B]',
};

export function SalesNotificationBell() {
  const navigate = useNavigate();
  const { employeeId, currentUserId } = useAdminTab();
  const owner = employeeId || currentUserId;
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<SalesTask[]>(() => readTasks(owner));
  const [loadedFor, setLoadedFor] = useState(owner);
  if (loadedFor !== owner) { setLoadedFor(owner); setTasks(readTasks(owner)); }
  const [followUps, setFollowUps] = useState<SalesCall[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  // Keep tasks in sync with the Tasks page (same tab or other tabs).
  useEffect(() => {
    const sync = () => setTasks(readTasks(owner));
    window.addEventListener(TASKS_CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener(TASKS_CHANGED_EVENT, sync); window.removeEventListener('storage', sync); };
  }, [owner]);

  // Sales activity — follow-ups due (Sales API).
  useEffect(() => {
    let alive = true;
    salesApiClient.get('/overview').then(res => { if (alive) setFollowUps(res.data?.followUpList || []); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const today = todayStr();
  const overdue = tasks.filter(t => !t.done && t.due && t.due < today);
  const dueToday = tasks.filter(t => !t.done && t.due === today);
  const notices: Notice[] = [
    ...overdue.map(t => ({ id: `o-${t.id}`, tone: 'red' as const, icon: AlertCircle, title: t.title, meta: `Task overdue${t.relatedTo ? ` · ${t.relatedTo}` : ''}`, to: '/admin/tasks' })),
    ...dueToday.map(t => ({ id: `d-${t.id}`, tone: 'sky' as const, icon: CalendarDays, title: t.title, meta: `Task due today${t.relatedTo ? ` · ${t.relatedTo}` : ''}`, to: '/admin/tasks' })),
    ...followUps.map(c => ({ id: `f-${c._id}`, tone: 'amber' as const, icon: PhoneCall, title: `Follow up with ${c.leadName}`, meta: c.followUpAt ? new Date(c.followUpAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }) : 'Follow-up due', to: '/admin/sales' })),
  ];
  const count = notices.length;

  const go = (to: string) => { setOpen(false); navigate(to); };

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)} aria-label={`Sales notifications${count ? ` (${count})` : ''}`}
        className={`w-10 h-10 rounded-[14px] border flex items-center justify-center transition-all relative ${open ? 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A]' : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'}`}>
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white tabular-nums">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-[340px] bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_20px_40px_-12px_rgba(15,23,42,0.2)] overflow-hidden z-[120] origin-top-right"
          >
            <div className="px-4 py-3 border-b border-[#F1F5F9] flex items-center justify-between">
              <div className="text-[13.5px] font-bold text-[#0F172A]">Notifications</div>
              {count > 0 && <span className="text-[11.5px] font-semibold text-[#64748B]">{count} need attention</span>}
            </div>
            {count === 0 ? (
              <div className="px-4 py-8 text-center">
                <span className="mx-auto w-10 h-10 rounded-full bg-[#F0FDF4] flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-[#00A86B]" /></span>
                <p className="mt-2.5 text-[13px] font-semibold text-[#0F172A]">You're all caught up</p>
                <p className="text-[12px] text-[#94A3B8] mt-0.5">Overdue tasks, today's tasks and follow-ups will show up here.</p>
              </div>
            ) : (
              <ul className="max-h-[360px] overflow-y-auto divide-y divide-[#F1F5F9]">
                {notices.slice(0, 12).map(nt => (
                  <li key={nt.id}>
                    <button type="button" onClick={() => go(nt.to)} className="w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-[#F8FAFC] transition-colors">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${TONE[nt.tone]}`}><nt.icon className="w-4 h-4" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium text-[#0F172A] truncate">{nt.title}</span>
                        <span className="block text-[11.5px] text-[#64748B] truncate mt-0.5">{nt.meta}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#CBD5E1] mt-2 shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" onClick={() => go('/admin/tasks')}
              className="w-full px-4 py-2.5 border-t border-[#F1F5F9] text-[12.5px] font-semibold text-[#00A86B] hover:bg-[#F0FDF4] inline-flex items-center justify-center gap-1.5">
              <ListChecks className="w-4 h-4" /> Open Tasks
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
