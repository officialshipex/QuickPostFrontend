import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, X, Search, Send, AlertTriangle, CheckCircle, RefreshCw, Ban, Mail, Users } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

// Admin → Notification → Schedule Email: a ready-made QuickPost email (e.g. the Diwali greeting) sent
// automatically at the chosen date and time (India time) to all users or the selected users.

interface Template { key: string; name: string; subject: string }
interface Scheduled {
  id: string; templateKey: string; templateName?: string; subject: string; sendAt: string;
  recipientType: 'all' | 'selected'; selectedCount: number;
  status: 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled' | 'missed';
  createdBy?: string; recipientCount?: number; sentCount?: number; failedCount?: number; errorMessage?: string;
}
interface PickedUser { _id: string; fullname: string; email: string }

const IST_MS = 5.5 * 60 * 60 * 1000;
const todayIst = () => new Date(Date.now() + IST_MS).toISOString().slice(0, 10);
const fmtIst = (d: string) => new Date(d).toLocaleString('en-IN', {
  timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
});
const fmtDateLabel = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};
const pad = (n: number) => String(n).padStart(2, '0');

// Whether an image URL actually loads (8 s timeout).
const imageLoads = (src: string) => new Promise<boolean>(resolve => {
  const img = new Image();
  const timer = setTimeout(() => resolve(false), 8000);
  img.onload = () => { clearTimeout(timer); resolve(img.naturalWidth > 0); };
  img.onerror = () => { clearTimeout(timer); resolve(false); };
  img.src = src;
});

const STATUS_STYLE: Record<Scheduled['status'], { label: string; cls: string }> = {
  scheduled: { label: 'Scheduled', cls: 'bg-blue-50 text-blue-600 border-blue-200' },
  sending:   { label: 'Sending…',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  sent:      { label: 'Sent',      cls: 'bg-green-50 text-[#00A86B] border-green-200' },
  failed:    { label: 'Failed',    cls: 'bg-red-50 text-red-600 border-red-200' },
  cancelled: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
  missed:    { label: 'Missed',    cls: 'bg-orange-50 text-orange-600 border-orange-200' },
};

const fieldCls = 'w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none focus:border-[#00A86B]';
const labelCls = 'block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide';

export function ScheduleEmailModal({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<'new' | 'list'>('new');

  // templates + preview
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateKey, setTemplateKey] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [missingImages, setMissingImages] = useState<string[]>([]);
  const [subject, setSubject] = useState('');

  // recipients
  const [recipientType, setRecipientType] = useState<'all' | 'selected'>('all');
  const [userQuery, setUserQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [picked, setPicked] = useState<PickedUser[]>([]);

  // when
  const [date, setDate] = useState('');
  const [hour, setHour] = useState(10);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');

  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  // scheduled list
  const [items, setItems] = useState<Scheduled[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const loadList = async () => {
    setListLoading(true);
    try {
      const res = await apiClient.get('/notification/scheduledEmail');
      setItems(res.data?.items || []);
    } catch { setItems([]); }
    finally { setListLoading(false); }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/notification/scheduledEmail/templates');
        const list: Template[] = res.data?.templates || [];
        setTemplates(list);
        if (list[0]) { setTemplateKey(list[0].key); setSubject(list[0].subject); }
      } catch (e: any) {
        setResult({ ok: false, text: e?.response?.data?.error || 'Could not load email templates' });
      }
    })();
    loadList();
  }, []);

  useEffect(() => {
    if (!templateKey) { setPreviewHtml(''); return; }
    let live = true;
    setPreviewLoading(true); setPreviewError(''); setMissingImages([]);
    apiClient.get(`/notification/scheduledEmail/templates/${encodeURIComponent(templateKey)}/preview`)
      .then(async res => {
        const html: string = res.data?.html || '';
        // The email loads its images from the email image host (S3). One not uploaded there yet would
        // leave the preview blank (the Diwali email is a single picture), so show QuickPost's own copy
        // in the preview and say which images still have to be uploaded.
        const srcs = Array.from(new Set(Array.from(html.matchAll(/<img[^>]+src="([^"]+)"/g), m => m[1])));
        const missing = (await Promise.all(srcs.map(async s => ((await imageLoads(s)) ? null : s)))).filter(Boolean) as string[];
        let shown = html;
        for (const src of missing) {
          const local = `${window.location.origin}/email/${src.split('/').pop()}`;
          if (await imageLoads(local)) shown = shown.split(src).join(local);
        }
        if (!live) return;
        setPreviewHtml(shown);
        setMissingImages(missing.map(s => s.split('/').pop() || s));
      })
      .catch((e: any) => {
        if (!live) return;
        setPreviewHtml('');
        setPreviewError(e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Could not load the preview');
      })
      .finally(() => { if (live) setPreviewLoading(false); });
    return () => { live = false; };
  }, [templateKey]);

  useEffect(() => {
    if (recipientType !== 'selected' || userQuery.trim().length < 2) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await apiClient.get(`/admin/searchUser?query=${encodeURIComponent(userQuery)}`);
        setSuggestions(res.data?.users || []);
      } catch { setSuggestions([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [userQuery, recipientType]);

  const chooseTemplate = (key: string) => {
    setTemplateKey(key);
    const t = templates.find(x => x.key === key);
    if (t) setSubject(t.subject);
  };
  const addUser = (u: any) => {
    if (!u?._id || picked.some(p => p._id === u._id)) return;
    setPicked(prev => [...prev, { _id: u._id, fullname: u.fullname || u.name || 'User', email: u.email || '' }]);
    setUserQuery(''); setSuggestions([]);
  };

  // The chosen moment, checked in the browser too (the server checks again).
  const sendAtMs = useMemo(() => {
    if (!date) return null;
    const [y, m, d] = date.split('-').map(Number);
    const h24 = (hour % 12) + (ampm === 'PM' ? 12 : 0);
    return Date.UTC(y, m - 1, d, h24, minute) - IST_MS;
  }, [date, hour, minute, ampm]);
  const inPast = sendAtMs !== null && sendAtMs < Date.now() + 60 * 1000;

  const canSubmit = !!templateKey && !!date && !inPast && subject.trim().length > 0
    && (recipientType === 'all' || picked.length > 0) && !saving;

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true); setResult(null);
    try {
      const body: any = { templateKey, subject: subject.trim(), recipientType, date, hour, minute, ampm };
      if (recipientType === 'selected') body.userIds = picked.map(p => p._id);
      const res = await apiClient.post('/notification/scheduledEmail', body);
      const s: Scheduled = res.data?.scheduled;
      setResult({ ok: true, text: `Scheduled for ${s ? fmtIst(s.sendAt) : 'the chosen time'} (India time)` });
      setPicked([]); setDate('');
      await loadList();
      setTimeout(() => { setView('list'); setResult(null); }, 1500);
    } catch (e: any) {
      setResult({ ok: false, text: e?.response?.data?.error || 'Could not schedule the email' });
    } finally {
      setSaving(false);
    }
  };

  const cancel = async (id: string) => {
    if (!window.confirm('Cancel this scheduled email? It will not be sent.')) return;
    setCancelling(id);
    try {
      await apiClient.post(`/notification/scheduledEmail/${id}/cancel`);
    } catch (e: any) {
      window.alert(e?.response?.data?.error || 'Could not cancel');
    } finally {
      setCancelling(null);
      loadList();
    }
  };

  const waitingCount = items.filter(i => i.status === 'scheduled').length;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative z-10 w-full max-w-3xl max-h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
          <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2"><CalendarClock className="w-4 h-4 text-[#00A86B]" /> Schedule Email</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#E2E8F0] transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex border-b border-[#E2E8F0] px-5 shrink-0">
          {([['new', 'New schedule'], ['list', `Scheduled emails${waitingCount ? ` (${waitingCount})` : ''}`]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setView(k)}
              className={`text-[13px] font-bold py-3 mr-6 border-b-[3px] transition-colors ${view === k ? 'border-[#00A86B] text-[#00A86B]' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'}`}>
              {l}
            </button>
          ))}
        </div>

        {view === 'new' ? (
          <>
            <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4 min-w-0">
                <div>
                  <label className={labelCls}>Email template</label>
                  <select value={templateKey} onChange={e => chooseTemplate(e.target.value)} className={fieldCls}>
                    {templates.length === 0 && <option value="">No templates</option>}
                    {templates.map(t => <option key={t.key} value={t.key}>{t.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Subject</label>
                  <input value={subject} onChange={e => setSubject(e.target.value)} maxLength={200} className={fieldCls} />
                </div>

                <div>
                  <label className={labelCls}>Send to</label>
                  <div className="flex gap-4">
                    {([['all', 'All users'], ['selected', 'Selected users']] as const).map(([v, l]) => (
                      <label key={v} className="flex items-center gap-1.5 text-xs font-semibold text-[#475569] cursor-pointer">
                        <input type="radio" checked={recipientType === v} onChange={() => setRecipientType(v)} className="accent-[#00A86B]" />{l}
                      </label>
                    ))}
                  </div>
                </div>

                {recipientType === 'selected' && (
                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-3">
                    <div className="relative">
                      <input type="text" placeholder="Search user by name or email..." value={userQuery}
                        onChange={e => setUserQuery(e.target.value)} autoComplete="off"
                        className="w-full h-9 pl-8 pr-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none focus:border-[#00A86B]" />
                      <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
                      {suggestions.length > 0 && (
                        <div className="absolute left-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 w-full max-h-48 overflow-y-auto py-1">
                          {suggestions.map((u: any) => (
                            <button key={u._id} onClick={() => addUser(u)} className="w-full text-left px-4 py-2.5 text-xs text-[#0F172A] hover:bg-[#F8FAFC] flex flex-col">
                              <span className="font-semibold">{u.fullname || u.name}</span>
                              <span className="text-[#94A3B8]">{u.email}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {picked.length === 0 ? (
                        <p className="text-center text-xs text-[#94A3B8] italic py-2">No users selected</p>
                      ) : picked.map(u => (
                        <div key={u._id} className="flex items-center justify-between p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs">
                          <div className="min-w-0"><div className="font-bold text-[#0F172A] truncate">{u.fullname}</div><div className="text-[#94A3B8] truncate">{u.email}</div></div>
                          <button onClick={() => setPicked(prev => prev.filter(p => p._id !== u._id))} className="ml-2 w-5 h-5 flex items-center justify-center text-[#94A3B8] hover:text-red-500 shrink-0"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className={labelCls}>Date</label>
                  <input type="date" value={date} min={todayIst()} onChange={e => setDate(e.target.value)} className={fieldCls} />
                </div>

                <div>
                  <label className={labelCls}>Time (India time)</label>
                  <div className="flex gap-2">
                    <select value={hour} onChange={e => setHour(Number(e.target.value))} className={fieldCls} aria-label="Hour">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(h => <option key={h} value={h}>{pad(h)}</option>)}
                    </select>
                    <select value={minute} onChange={e => setMinute(Number(e.target.value))} className={fieldCls} aria-label="Minute">
                      {Array.from({ length: 60 }, (_, i) => i).map(m => <option key={m} value={m}>{pad(m)}</option>)}
                    </select>
                    <div className="flex rounded-lg border border-[#E2E8F0] overflow-hidden shrink-0">
                      {(['AM', 'PM'] as const).map(p => (
                        <button key={p} type="button" onClick={() => setAmpm(p)}
                          className={`px-3 text-xs font-bold transition-colors ${ampm === p ? 'bg-[#00A86B] text-white' : 'bg-white text-[#64748B] hover:bg-[#F8FAFC]'}`}>{p}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={`text-xs font-semibold rounded-xl px-3 py-2.5 border flex items-start gap-2 ${inPast ? 'bg-red-50 border-red-200 text-red-600' : 'bg-[#F0FDF4] border-[#DCFCE7] text-[#0F172A]'}`}>
                  <CalendarClock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  {!date ? 'Choose a date and time'
                    : inPast ? 'This time has already passed. Choose a time at least one minute from now.'
                    : `Will be sent on ${fmtDateLabel(date)} at ${pad(hour)}:${pad(minute)} ${ampm} to ${recipientType === 'all' ? 'all users' : `${picked.length} selected user(s)`}`}
                </div>
              </div>

              <div className="min-w-0">
                <label className={labelCls}>Preview</label>
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F3F6F4] overflow-hidden h-[420px]">
                  {previewLoading ? (
                    <div className="h-full flex items-center justify-center text-xs text-[#94A3B8]">Loading preview…</div>
                  ) : previewHtml ? (
                    <iframe title="Email preview" srcDoc={previewHtml} sandbox="" className="w-full h-full bg-white" />
                  ) : previewError ? (
                    <div className="h-full flex flex-col items-center justify-center gap-2 px-6 text-center text-xs text-red-500">
                      <AlertTriangle className="w-5 h-5" />{previewError}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-[#94A3B8]">No preview</div>
                  )}
                </div>
                {missingImages.length > 0 && (
                  <div className="mt-2 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>Not uploaded to the email image storage yet: {missingImages.join(', ')}. The preview uses QuickPost's copy, but the email itself will show a broken image until it is uploaded.</span>
                  </div>
                )}
                <p className="text-[11px] text-[#94A3B8] mt-1.5 flex items-center gap-1"><Mail className="w-3 h-3" /> Sent from QuickPost</p>
              </div>
            </div>

            {result && (
              <div className={`mx-5 mb-3 flex items-center gap-2 text-xs font-semibold p-3 rounded-xl ${result.ok ? 'bg-green-50 text-[#00A86B]' : 'bg-red-50 text-red-600'}`}>
                {result.ok ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}{result.text}
              </div>
            )}

            <div className="flex justify-end gap-3 p-5 border-t border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-[#E2E8F0] transition-colors">Close</button>
              <button onClick={submit} disabled={!canSubmit}
                className="px-4 py-2 rounded-xl bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors disabled:opacity-50 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" />{saving ? 'Scheduling…' : 'Schedule Email'}
              </button>
            </div>
          </>
        ) : (
          <div className="p-5 overflow-y-auto space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-xs text-[#64748B]">Times are India time. A waiting email can be cancelled until it is sent.</p>
              <button onClick={loadList} className={`text-[#94A3B8] hover:text-[#00A86B] ${listLoading ? 'animate-spin' : ''}`} title="Refresh"><RefreshCw className="w-4 h-4" /></button>
            </div>
            {listLoading && items.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#94A3B8]">Loading…</div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#94A3B8]">No scheduled emails yet</div>
            ) : items.map(it => {
              const st = STATUS_STYLE[it.status] || STATUS_STYLE.scheduled;
              return (
                <div key={it.id} className="border border-[#E2E8F0] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#0F172A] truncate">{it.subject}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
                    </div>
                    <div className="text-[11px] text-[#64748B] mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                      <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3" />{fmtIst(it.sendAt)}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{it.recipientType === 'all' ? 'All users' : `${it.selectedCount} selected`}</span>
                      <span>{it.templateName || it.templateKey}</span>
                      {(it.status === 'sent' || it.status === 'failed' || it.status === 'sending') && (
                        <span>{it.sentCount ?? 0} sent{it.failedCount ? ` · ${it.failedCount} failed` : ''}{it.recipientCount ? ` of ${it.recipientCount}` : ''}</span>
                      )}
                    </div>
                    {it.errorMessage && <div className="text-[11px] text-red-500 mt-1 break-words">{it.errorMessage}</div>}
                  </div>
                  {it.status === 'scheduled' && (
                    <button onClick={() => cancel(it.id)} disabled={cancelling === it.id}
                      className="self-start sm:self-center px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-xs font-bold hover:bg-red-50 disabled:opacity-50 flex items-center gap-1 shrink-0">
                      <Ban className="w-3.5 h-3.5" />{cancelling === it.id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
