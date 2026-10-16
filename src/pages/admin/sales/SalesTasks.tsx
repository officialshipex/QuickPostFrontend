import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ListChecks, Plus, CalendarDays, Flag, Trash2, Pencil, X, Check, AlertCircle, Clock, CheckCircle2, User,
  Search, type LucideIcon,
} from 'lucide-react';
import { AdminLayout } from '../../../components/admin/layout/AdminLayout';
import { useAdminTab } from '../../../context/AdminUserContext';
import { readTasks, writeTasks, todayStr, type SalesTask, type TaskPriority } from './tasksStore';

/* Sales — Tasks (personal to-do list for the sales executive).
   Until the Sales backend has a tasks endpoint, tasks are kept in this browser per employee
   (localStorage, key below). Swap readTasks/writeTasks for `/sales/tasks` calls when it exists. */

type Priority = TaskPriority;
type Task = SalesTask;
type View = 'today' | 'upcoming' | 'overdue' | 'completed' | 'all';

const PRIORITY: Record<Priority, { label: string; tone: string; dot: string }> = {
  high: { label: 'High', tone: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-500' },
  medium: { label: 'Medium', tone: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  low: { label: 'Low', tone: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
};
const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

const card = 'bg-white rounded-2xl border border-[#EEF2F6] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)]';
const fieldCls = 'h-10 px-3.5 rounded-full border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] transition-colors';

const fmtDue = (d?: string) => {
  if (!d) return 'No due date';
  const t = todayStr();
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  if (d === t) return 'Today';
  if (d === tomorrow.toISOString().slice(0, 10)) return 'Tomorrow';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

function TaskDialog({ task, onClose, onSave }: { task: Task; onClose: () => void; onSave: (t: Task) => void }) {
  const [draft, setDraft] = useState<Task>(task);
  const [error, setError] = useState('');
  const set = <K extends keyof Task>(k: K, v: Task[K]) => setDraft(d => ({ ...d, [k]: v }));
  const save = () => {
    if (!draft.title.trim()) { setError('Give the task a title.'); return; }
    onSave({ ...draft, title: draft.title.trim(), notes: draft.notes?.trim() || undefined, relatedTo: draft.relatedTo?.trim() || undefined });
    onClose();
  };
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }}
        role="dialog" aria-modal="true" aria-label="Edit task"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)]">
        <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-[#0F172A]">Edit task</h3>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9]"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          {error && <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-[12.5px] text-red-600"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</div>}
          <div>
            <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Title <span className="text-red-500">*</span></label>
            <input value={draft.title} onChange={e => set('title', e.target.value)} className={`${fieldCls} w-full`} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Due date</label>
              <input type="date" value={draft.due || ''} onChange={e => set('due', e.target.value || undefined)} className={`${fieldCls} w-full`} />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Priority</label>
              <div className="grid grid-cols-3 gap-1 p-1 h-10 rounded-full bg-[#F1F5F9] border border-[#E2E8F0]">
                {(['high', 'medium', 'low'] as Priority[]).map(p => (
                  <button key={p} type="button" onClick={() => set('priority', p)}
                    className={`rounded-full text-[12px] font-semibold transition-all ${draft.priority === p ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B]'}`}>{PRIORITY[p].label}</button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Related seller / lead</label>
            <input value={draft.relatedTo || ''} onChange={e => set('relatedTo', e.target.value)} placeholder="e.g. Acme Traders" className={`${fieldCls} w-full`} />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Notes</label>
            <textarea value={draft.notes || ''} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Details, next step…"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-[13px] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] resize-none" />
          </div>
        </div>
        <div className="px-5 py-3.5 border-t border-[#F1F5F9] flex justify-end gap-2.5">
          <button onClick={onClose} className="h-10 px-5 rounded-full border border-[#E2E8F0] text-[13px] font-semibold text-[#475569] hover:bg-[#F8FAFC]">Cancel</button>
          <button onClick={save} className="h-10 px-6 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-semibold">Save task</button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

export function SalesTasks() {
  const { employeeId, currentUserId } = useAdminTab();
  const owner = employeeId || currentUserId;
  // Load once per owner (render-time sync — no effect needed).
  const [loadedFor, setLoadedFor] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  if (owner && loadedFor !== owner) { setLoadedFor(owner); setTasks(readTasks(owner)); }

  const [view, setView] = useState<View>('today');
  const [q, setQ] = useState('');
  const [title, setTitle] = useState('');
  const [due, setDue] = useState(todayStr());
  const [priority, setPriority] = useState<Priority>('medium');
  const [relatedTo, setRelatedTo] = useState('');
  const [editing, setEditing] = useState<Task | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);

  const commit = (next: Task[]) => { setTasks(next); writeTasks(owner, next); };
  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const t: Task = {
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      title: title.trim(), due: due || undefined, priority, relatedTo: relatedTo.trim() || undefined,
      done: false, createdAt: new Date().toISOString(),
    };
    commit([t, ...tasks]);
    setTitle(''); setRelatedTo('');
  };
  const toggle = (id: string) => commit(tasks.map(t => (t.id === id ? { ...t, done: !t.done, completedAt: !t.done ? new Date().toISOString() : undefined } : t)));
  const update = (u: Task) => commit(tasks.map(t => (t.id === u.id ? u : t)));
  const remove = (id: string) => commit(tasks.filter(t => t.id !== id));

  const today = todayStr();
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 6);
  const isOverdue = (t: Task) => !t.done && !!t.due && t.due < today;
  const buckets: Record<View, (t: Task) => boolean> = {
    today: t => !t.done && t.due === today,
    upcoming: t => !t.done && (!t.due || t.due > today),
    overdue: isOverdue,
    completed: t => t.done,
    all: () => true,
  };
  const counts = (Object.keys(buckets) as View[]).reduce((acc, v) => ({ ...acc, [v]: tasks.filter(buckets[v]).length }), {} as Record<View, number>);

  const visible = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return tasks
      .filter(buckets[view])
      .filter(t => !ql || [t.title, t.notes, t.relatedTo].some(v => (v || '').toLowerCase().includes(ql)))
      .sort((a, b) => Number(a.done) - Number(b.done)
        || (a.due || '9999').localeCompare(b.due || '9999')
        || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, view, q, today]);

  const stats: { label: string; value: number; icon: LucideIcon; tone: string }[] = [
    { label: 'Due today', value: counts.today, icon: CalendarDays, tone: 'bg-sky-50 text-sky-600' },
    { label: 'Overdue', value: counts.overdue, icon: AlertCircle, tone: 'bg-red-50 text-red-500' },
    { label: 'Open tasks', value: tasks.filter(t => !t.done).length, icon: Clock, tone: 'bg-amber-50 text-amber-600' },
    { label: 'Done this week', value: tasks.filter(t => t.done && t.completedAt && new Date(t.completedAt) >= weekAgo).length, icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600' },
  ];
  const views: { key: View; label: string }[] = [
    { key: 'today', label: 'Today' }, { key: 'upcoming', label: 'Upcoming' }, { key: 'overdue', label: 'Overdue' },
    { key: 'completed', label: 'Completed' }, { key: 'all', label: 'All' },
  ];
  const emptyCopy: Record<View, [string, string]> = {
    today: ['Nothing due today', 'Add a task above or pick one from Upcoming.'],
    upcoming: ['No upcoming tasks', 'Plan your follow-ups and demos ahead.'],
    overdue: ["You're all caught up", 'No overdue tasks — nice work.'],
    completed: ['No completed tasks yet', 'Tick off a task and it will show up here.'],
    all: ['No tasks yet', 'Add your first task to start planning your day.'],
  };

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-[#F8FAFC] overflow-y-auto">
        <div className="px-4 md:px-6 pt-5 pb-8 flex flex-col gap-5 max-w-[1200px] w-full mx-auto">
          {/* Title */}
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center shrink-0"><ListChecks className="w-5 h-5" /></span>
            <div>
              <h1 className="text-[18px] font-bold text-[#0F172A]">Tasks</h1>
              <p className="text-[12.5px] text-[#64748B]">Plan your calls, demos and follow-ups — and tick them off as you go.</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {stats.map(st => (
              <div key={st.label} className={`${card} px-4 py-3.5 flex items-center justify-between gap-3`}>
                <div className="min-w-0">
                  <div className="text-[12px] font-medium text-[#64748B] truncate">{st.label}</div>
                  <div className="text-[22px] font-bold text-[#0F172A] tabular-nums leading-tight mt-0.5">{st.value}</div>
                </div>
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${st.tone}`}><st.icon className="w-5 h-5" /></span>
              </div>
            ))}
          </div>

          {/* Quick add */}
          <form onSubmit={addTask} className={`${card} p-3 md:p-4`}>
            <div className="flex flex-col lg:flex-row gap-2.5">
              <div className="relative flex-1 min-w-0">
                <Plus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00A86B]" />
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Add a task, e.g. Call Acme Traders about KYC"
                  className={`${fieldCls} w-full pl-10`} />
              </div>
              <div className="flex flex-wrap gap-2.5">
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                  <input value={relatedTo} onChange={e => setRelatedTo(e.target.value)} placeholder="Seller / lead (optional)" className={`${fieldCls} w-[200px] pl-10`} />
                </div>
                <input type="date" value={due} onChange={e => setDue(e.target.value)} aria-label="Due date" className={`${fieldCls} w-[150px]`} />
                <div role="radiogroup" aria-label="Priority" className="inline-flex p-1 h-10 rounded-full bg-[#F1F5F9] border border-[#E2E8F0]">
                  {(['high', 'medium', 'low'] as Priority[]).map(p => (
                    <button key={p} type="button" role="radio" aria-checked={priority === p} onClick={() => setPriority(p)}
                      className={`px-3 rounded-full text-[12px] font-semibold inline-flex items-center gap-1.5 transition-all ${priority === p ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B]'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY[p].dot}`} />{PRIORITY[p].label}
                    </button>
                  ))}
                </div>
                <button type="submit" disabled={!title.trim()}
                  className="h-10 px-5 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-semibold inline-flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-40 disabled:pointer-events-none">
                  <Plus className="w-4 h-4" /> Add task
                </button>
              </div>
            </div>
          </form>

          {/* List */}
          <div className={`${card} overflow-hidden`}>
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-1 overflow-x-auto">
                {views.map(v => (
                  <button key={v.key} onClick={() => setView(v.key)}
                    className={`h-8 px-3 rounded-full text-[12.5px] font-semibold whitespace-nowrap inline-flex items-center gap-1.5 transition-colors ${view === v.key ? 'bg-[#F0FDF4] text-[#00A86B]' : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'}`}>
                    {v.label}
                    <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10.5px] flex items-center justify-center ${view === v.key ? (v.key === 'overdue' && counts.overdue ? 'bg-red-500 text-white' : 'bg-[#00A86B] text-white') : 'bg-[#F1F5F9] text-[#64748B]'}`}>{counts[v.key]}</span>
                  </button>
                ))}
              </div>
              <div className="relative w-[240px] max-w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search tasks" className={`${fieldCls} w-full h-9 pl-10`} />
              </div>
            </div>

            {visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-14 px-4">
                <span className="w-12 h-12 rounded-2xl bg-[#F1F5F9] flex items-center justify-center"><ListChecks className="w-6 h-6 text-[#94A3B8]" /></span>
                <p className="mt-3 text-[13px] font-semibold text-[#0F172A]">{q ? 'No tasks match your search' : emptyCopy[view][0]}</p>
                <p className="text-[12px] text-[#94A3B8] mt-0.5">{q ? 'Try a different word.' : emptyCopy[view][1]}</p>
              </div>
            ) : (
              <ul className="divide-y divide-[#F1F5F9]">
                <AnimatePresence initial={false}>
                  {visible.map(t => {
                    const overdue = isOverdue(t);
                    return (
                      <motion.li key={t.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}
                        className="group px-4 py-3 flex items-start gap-3 hover:bg-[#F8FFFB] transition-colors">
                        <button type="button" onClick={() => toggle(t.id)} role="checkbox" aria-checked={t.done} aria-label={t.done ? 'Mark as not done' : 'Mark as done'}
                          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${t.done ? 'bg-[#00A86B] border-[#00A86B]' : 'border-[#CBD5E1] hover:border-[#00A86B]'}`}>
                          {t.done && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className={`text-[13.5px] font-medium ${t.done ? 'text-[#94A3B8] line-through' : 'text-[#0F172A]'}`}>{t.title}</div>
                          {t.notes && <div className="text-[12px] text-[#64748B] mt-0.5 line-clamp-1">{t.notes}</div>}
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1 text-[11.5px] font-medium px-2 py-0.5 rounded-full ${overdue ? 'bg-red-50 text-red-600' : t.due === today && !t.done ? 'bg-sky-50 text-sky-700' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                              <CalendarDays className="w-3 h-3" />{overdue ? `Overdue · ${fmtDue(t.due)}` : fmtDue(t.due)}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[11.5px] font-medium px-2 py-0.5 rounded-full border ${PRIORITY[t.priority].tone}`}>
                              <Flag className="w-3 h-3" />{PRIORITY[t.priority].label}
                            </span>
                            {t.relatedTo && (
                              <span className="inline-flex items-center gap-1 text-[11.5px] font-medium px-2 py-0.5 rounded-full bg-[#F8FAFC] border border-[#EEF2F6] text-[#475569]">
                                <User className="w-3 h-3" />{t.relatedTo}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => setEditing(t)} aria-label="Edit task" className="w-8 h-8 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-[#00A86B] hover:bg-[#F0FDF4]"><Pencil className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={() => setConfirmDelete(t)} aria-label="Delete task" className="w-8 h-8 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </div>
          <p className="text-[11.5px] text-[#94A3B8]">Tasks are saved on this device for now.</p>
        </div>
      </div>

      <AnimatePresence>
        {editing && <TaskDialog key={editing.id} task={editing} onClose={() => setEditing(null)} onSave={update} />}
      </AnimatePresence>

      {confirmDelete && createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center"><Trash2 className="w-5 h-5 text-red-500" /></span>
              <div>
                <h3 className="text-[14px] font-bold text-[#0F172A]">Delete task?</h3>
                <p className="text-[12px] text-[#64748B]">This can't be undone.</p>
              </div>
            </div>
            <p className="text-[13px] text-[#475569] mb-5 truncate">"{confirmDelete.title}"</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 h-10 rounded-full border border-[#E2E8F0] text-[13px] font-semibold text-[#475569] hover:bg-[#F8FAFC]">Cancel</button>
              <button onClick={() => { remove(confirmDelete.id); setConfirmDelete(null); }} className="flex-1 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white text-[13px] font-semibold">Delete</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </AdminLayout>
  );
}
