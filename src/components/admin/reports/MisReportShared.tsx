import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { apiClient } from '../../../services/apiClient';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Download, Calendar, CheckCircle2, Clock, FileText, X, RefreshCw, AlertTriangle, Mail, Hash, Users,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { TruncatedText } from '../../ui/TruncatedText';
import { EmptyState } from '../../ui/EmptyState';
import { StatusRibbon } from '../../ui/StatusRibbon';
import { TableLoader } from '../../ui/TableLoader';
import { GlassSingleSelect } from '../../ui/GlassSingleSelect';
import { DesktopPagination } from '../../../hooks/usePagination';
import { MobilePaginationBar } from '../../../hooks/useMobilePaginationBar';
import { useUserSearchFilter } from '../../../hooks/filters/useUserSearchFilter';
import { Search } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface MisReport {
  _id: string; reportType: string; dateFilterType?: string; fromDate: string; toDate: string;
  email?: string; status: 'pending' | 'completed' | 'failed'; downloadUrl?: string;
  createdAt: string; selectedDescriptions?: string[];
  user?: { _id: string; userId?: number; fullname?: string; email?: string };
}

// ─── Report type catalogue — the 7 dedicated report cards plus the legacy
//     types the MIS generator already supported, kept for backward-compat. ──
export const REPORT_TYPES = [
  'All', 'Orders', 'Shipments', 'NDR', 'COD', 'Weight Disputes', 'Passbook', 'Undelivered',
  'Delivered', 'RTO', 'Canceled', 'Pending Order',
];
export const DATE_FILTER_TYPES = ['Pickup Date', 'AWB Assigned Date'];
export const ORDER_DATE_FILTER_TYPES = ['Creation Date', 'AWB Assign Date', 'Pickup Date'];
export const NDR_STATUSES = ['Undelivered', 'Action Required', 'Action Requested'];
export const PASSBOOK_DESCS = [
  'Freight Charges Applied', 'Freight Charges Received', 'Auto-accepted Weight Dispute charge',
  'Weight Dispute Charges Applied', 'COD Charges Received', 'RTO Freight Charges Applied',
  'Cancellation Refund', 'Recharge From Gateway(Razorpay)', 'Referral Commission Received',
];

export const fc = (v: number) => `₹${(v || 0).toLocaleString('en-IN')}`;
export const fn = (v: number) => (v || 0).toLocaleString('en-IN');
export const fmtDate = (d?: string) => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
export const fmtDateTime = (d?: string) => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

// ─── SingleDatePicker — a compact, single-date glass-styled calendar dropdown.
//     Reuses the same calendar-grid CSS as GlassDateFilter (index.css .glass-date-*
//     rules) but drops the range-selection/quick-picks sidebar, since From/To are
//     two independent single dates here rather than one linked range. ────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function fromIsoDate(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function displayShortDate(s: string): string {
  const d = fromIsoDate(s);
  if (!d) return '';
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}
function isSameDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function SingleDatePicker({ value, onChange, placeholder = 'Select date', maxDate }: {
  value: string; onChange: (v: string) => void; placeholder?: string; maxDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const today = new Date();
  const selected = fromIsoDate(value);
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node) &&
          !(e.target as HTMLElement)?.closest('.glass-date-panel-portal')) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open || !containerRef.current) return;
    const PANEL_WIDTH = 280;
    const PANEL_HEIGHT = 400;
    const GAP = 6;
    const updatePos = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      let top = rect.bottom + GAP;
      if (top + PANEL_HEIGHT > window.innerHeight - 12) {
        top = Math.max(12, rect.top - PANEL_HEIGHT - GAP);
      }
      let left = rect.left;
      if (left + PANEL_WIDTH > window.innerWidth - 12) {
        left = Math.max(12, window.innerWidth - 12 - PANEL_WIDTH);
      }
      setPanelPos({ top, left, width: rect.width });
    };
    updatePos();
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [open]);

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const calendarDays: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(new Date(viewYear, viewMonth, i));
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);

  const canGoToday = !maxDate || today <= maxDate;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={[
          'w-full h-11 pl-10 pr-9 rounded-full border text-[13px] text-left transition-all flex items-center',
          open
            ? 'border-[#00A86B] ring-2 ring-[#00A86B]/10 bg-white'
            : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]',
        ].join(' ')}
      >
        <span className={value ? 'text-[#0F172A] font-semibold' : 'text-[#94A3B8] font-medium'}>
          {value ? displayShortDate(value) : placeholder}
        </span>
      </button>
      <span className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center pointer-events-none transition-colors ${value ? 'bg-[#F0FDF4]' : ''}`}>
        <Calendar className={`w-4 h-4 ${value ? 'text-[#00A86B]' : 'text-[#94A3B8]'}`} />
      </span>
      {value && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onChange(''); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#64748B] transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {open && panelPos && createPortal(
        <>
          <div className="fixed inset-0 z-[200] bg-[#0F172A]/20 backdrop-blur-[1px]" onClick={() => setOpen(false)} />
          <div
            className="glass-date-panel glass-date-panel-portal fixed w-[280px] max-w-[calc(100vw-2.5rem)]"
            style={{ top: panelPos.top, left: panelPos.left, zIndex: 210 }}
          >
            <div className="glass-date-calendar !min-w-0 !p-3">
              <div className="glass-date-nav">
                <button onClick={prevMonth} type="button" className="glass-date-nav-btn"><ChevronLeft className="w-4 h-4" /></button>
                <span className="glass-date-month-label">{MONTHS[viewMonth]} {viewYear}</span>
                <button onClick={nextMonth} type="button" className="glass-date-nav-btn"><ChevronRight className="w-4 h-4" /></button>
              </div>
              <div className="glass-date-weekdays">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className="glass-date-weekday">{d}</div>)}
              </div>
              <div className="glass-date-grid">
                {calendarDays.map((day, i) => {
                  if (!day) return <div key={`empty-${i}`} className="glass-date-cell empty" />;
                  const isSelected = !!selected && isSameDate(day, selected);
                  const isFuture = maxDate ? day > maxDate : day > today;
                  const isTodayCell = isSameDate(day, today);
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={isFuture}
                      onClick={() => { onChange(toIsoDate(day)); setOpen(false); }}
                      className={[
                        'glass-date-cell',
                        isSelected ? 'range-start range-end' : '',
                        isTodayCell ? 'today' : '',
                        isFuture ? 'disabled' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
              <div className="glass-date-footer">
                <div className="glass-date-summary">
                  {value
                    ? <span className="glass-date-selected-label">{displayShortDate(value)}</span>
                    : <span className="glass-date-hint">No date selected</span>}
                </div>
                <div className="glass-date-actions">
                  {value && (
                    <button type="button" className="glass-date-action-btn secondary" onClick={() => { onChange(''); setOpen(false); }}>Clear</button>
                  )}
                  <button
                    type="button"
                    disabled={!canGoToday}
                    className="glass-date-action-btn primary"
                    onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); onChange(toIsoDate(today)); setOpen(false); }}
                  >
                    Today
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

// ─── GenerateReportModal ──────────────────────────────────────────────────────
export function GenerateReportModal({ open, onClose, prefillUserId, prefillUserName, isAdminView, initialReportType, lockReportType, reportTypeOptions }: {
  open: boolean; onClose: () => void;
  prefillUserId?: string | null; prefillUserName?: string;
  isAdminView: boolean;
  /** Preselects the report type when opened from a specific report card. Defaults to 'All'. */
  initialReportType?: string;
  /** When true, the report type is fixed to initialReportType and shown as a read-only badge
   *  instead of a dropdown — used when the user already chose the type by clicking a specific
   *  report card, so re-asking them via a picker would be redundant. */
  lockReportType?: boolean;
  /** Restricts the Report Type dropdown to a subset of REPORT_TYPES — used by the "Others" card
   *  so it only offers the legacy types that don't have their own dedicated card. */
  reportTypeOptions?: string[];
}) {
  const [reportType, setReportType]           = useState(initialReportType || 'All');
  const [dateFilterType, setDateFilterType]   = useState('Pickup Date');
  const [dateFilterTypes, setDateFilterTypes] = useState<string[]>(['Pickup Date']);
  const [ndrStatuses, setNdrStatuses]         = useState<string[]>([]);
  const [fromDate, setFromDate]               = useState('');
  const [toDate, setToDate]                 = useState('');
  const [email, setEmail]                   = useState('');
  const [descs, setDescs]                   = useState<string[]>([]);
  const [descOpen, setDescOpen]             = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const [result, setResult]                 = useState<{ ok: boolean; text: string } | null>(null);

  // Seller search — only relevant when the modal wasn't opened for a specific
  // pre-known seller (i.e. from the global reports hub, not a seller's own page).
  const showSellerSearch = isAdminView && !prefillUserId;
  const {
    userQuery, userSuggestions, userMongoId,
    onQueryChange: onUserQueryChange, selectUser: selectUserSuggestion, clearUser: clearUserFilter,
  } = useUserSearchFilter(showSellerSearch && open);

  useEffect(() => {
    if (open) {
      setReportType(initialReportType || 'All');
      setDateFilterType('Pickup Date');
      setDateFilterTypes(['Pickup Date']);
      setNdrStatuses([]);
      setFromDate(''); setToDate('');
      setEmail(''); setDescs([]); setResult(null);
      clearUserFilter();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialReportType]);

  const toggleDesc = (d: string) =>
    setDescs(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const handleGenerate = async () => {
    if (!fromDate || !toDate) { setResult({ ok: false, text: 'From date and to date are required' }); return; }
    setSubmitting(true); setResult(null);
    try {
      const body: any = {
        reportType,
        fromDate: new Date(fromDate).toISOString(),
        toDate: new Date(toDate + 'T23:59:59').toISOString(),
      };
      if (reportType === 'Passbook') {
        body.dateFilterType = 'Transaction Date';
        if (descs.length > 0) body.selectedDescriptions = descs;
      } else if (lockReportType && reportType === 'Orders') {
        body.dateFilterTypes = dateFilterTypes.length > 0 ? dateFilterTypes : ['Pickup Date'];
      } else if (lockReportType && reportType === 'NDR') {
        if (ndrStatuses.length > 0) body.ndrStatuses = ndrStatuses;
      } else {
        body.dateFilterType = dateFilterType;
      }
      if (email) body.email = email;
      if (isAdminView && prefillUserId) body.userSearch = prefillUserId;
      else if (showSellerSearch && userMongoId) body.userSearch = userMongoId;
      await apiClient.post('/mis-report/generate', body);
      setResult({ ok: true, text: 'Report generation started! It will appear in the table below shortly.' });
      setTimeout(() => onClose(), 2500);
    } catch (e: any) { setResult({ ok: false, text: e?.response?.data?.error || 'Failed to start report' }); }
    finally { setSubmitting(false); }
  };

  if (!open) return null;

  const fieldCls = 'w-full h-11 px-4 rounded-full border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10 transition-all';
  const labelCls = 'block text-[11px] font-bold text-[#64748B] mb-1.5 uppercase tracking-wide';

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#0F172A]/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-lg bg-white rounded-[28px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-[#E2E8F0] bg-gradient-to-b from-[#F8FAFC] to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F0FDF4] flex items-center justify-center shrink-0">
              <FileText className="w-[18px] h-[18px] text-[#00A86B]" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#0F172A]">
                {lockReportType ? `${reportType} Report` : 'Generate Report'}
              </h3>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">
                {prefillUserName ? `Seller: ${prefillUserName}` : showSellerSearch && userMongoId ? `Seller: ${userQuery}` : 'Choose a date range to generate this report'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] transition-colors shrink-0"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 md:p-6 space-y-4 overflow-y-auto thin-scrollbar">
          {showSellerSearch && (
            <div className="relative">
              <label className={labelCls}>Seller (optional — leave blank for all sellers)</label>
              <div className="relative">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={userQuery}
                  onChange={e => onUserQueryChange(e.target.value)}
                  placeholder="Search user..."
                  className="w-full h-11 pl-10 pr-9 rounded-full border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10 transition-all"
                />
                {userMongoId && (
                  <button type="button" onClick={clearUserFilter}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-red-500 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {userSuggestions.length > 0 && !userMongoId && (
                <div className="absolute left-0 top-full mt-1.5 w-full bg-white border border-[#E2E8F0] rounded-2xl shadow-xl z-50 max-h-52 overflow-y-auto py-1.5 thin-scrollbar">
                  {userSuggestions.map(u => (
                    <button key={u._id} type="button"
                      onClick={() => selectUserSuggestion(u)}
                      className="w-full text-left px-4 py-2.5 hover:bg-[#F0FDF4] transition-colors flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-bold text-[#0F172A] truncate">{u.fullname}</div>
                        <div className="text-[11px] text-[#94A3B8] truncate">{u.email}{u.phoneNumber ? ` · ${u.phoneNumber}` : ''}</div>
                      </div>
                      {u.userId != null && <span className="text-[10px] font-semibold text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded shrink-0">{u.userId}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className={lockReportType ? '' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
            {!lockReportType && (
              <div>
                <label className={labelCls}>Report Type</label>
                <GlassSingleSelect
                  options={(reportTypeOptions || REPORT_TYPES).map(t => ({ label: t, value: t }))}
                  value={reportType}
                  onChange={setReportType}
                  className="[&_button]:!h-11 [&_button]:!rounded-full [&_button]:!bg-white [&_button]:!border-[#E2E8F0] [&_button]:!px-4 [&_button]:!text-[13px]"
                />
              </div>
            )}
            {/* Other Reports: single date filter dropdown (unchanged) */}
            {!lockReportType && reportType !== 'Passbook' && (
              <div>
                <label className={labelCls}>Date Filter By</label>
                <GlassSingleSelect
                  options={DATE_FILTER_TYPES.map(t => ({ label: t, value: t }))}
                  value={dateFilterType}
                  onChange={setDateFilterType}
                  className="[&_button]:!h-11 [&_button]:!rounded-full [&_button]:!bg-white [&_button]:!border-[#E2E8F0] [&_button]:!px-4 [&_button]:!text-[13px]"
                />
              </div>
            )}
          </div>

          {/* Orders: multi-select date filter (Creation Date / AWB Assign Date / Pickup Date) */}
          {lockReportType && reportType === 'Orders' && (
            <div>
              <label className={labelCls}>Date Filter By</label>
              <div className="flex flex-wrap gap-2 mt-0.5">
                {ORDER_DATE_FILTER_TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDateFilterTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                    className={[
                      'h-9 px-4 rounded-full text-[12px] font-semibold border transition-colors',
                      dateFilterTypes.includes(t)
                        ? 'bg-[#00A86B] text-white border-[#00A86B] shadow-sm'
                        : 'bg-white text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1]',
                    ].join(' ')}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {dateFilterTypes.length === 0 && (
                <p className="text-[11px] text-amber-500 mt-1.5 font-medium">Select at least one filter — defaulting to Pickup Date</p>
              )}
            </div>
          )}

          {/* NDR: status multi-select (Undelivered / Action Required / Action Requested) */}
          {lockReportType && reportType === 'NDR' && (
            <div>
              <label className={labelCls}>NDR Status</label>
              <div className="flex flex-wrap gap-2 mt-0.5">
                {NDR_STATUSES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setNdrStatuses(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                    className={[
                      'h-9 px-4 rounded-full text-[12px] font-semibold border transition-colors',
                      ndrStatuses.includes(s)
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-white text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1]',
                    ].join(' ')}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#94A3B8] mt-1.5 font-medium">Leave all unselected to include all NDR statuses</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>From Date</label>
              <SingleDatePicker value={fromDate} onChange={setFromDate} placeholder="Select start date" maxDate={toDate ? fromIsoDate(toDate) ?? undefined : undefined} />
            </div>
            <div>
              <label className={labelCls}>To Date</label>
              <SingleDatePicker value={toDate} onChange={setToDate} placeholder="Select end date" />
            </div>
          </div>

          {reportType === 'Passbook' && (
            <div className="relative" onClick={() => setDescOpen(o => !o)}>
              <label className={labelCls}>Transaction Descriptions</label>
              <div className="w-full min-h-[44px] px-4 py-2 rounded-[22px] border border-[#E2E8F0] text-[12px] cursor-pointer flex flex-wrap items-center gap-1.5 bg-white hover:border-[#CBD5E1] transition-colors">
                {descs.length === 0
                  ? <span className="text-[#94A3B8] leading-6">All descriptions (leave empty)</span>
                  : descs.map(d => (
                    <span key={d} onClick={e => { e.stopPropagation(); toggleDesc(d); }}
                      className="flex items-center gap-1 bg-[#F0FDF4] text-[#00A86B] border border-[#DCFCE7] px-2.5 py-1 rounded-full font-semibold">
                      {d} <X className="w-3 h-3" />
                    </span>
                  ))}
              </div>
              {descOpen && (
                <>
                  <div className="fixed inset-0 z-40 bg-[#0F172A]/20 backdrop-blur-[1px]" onClick={e => { e.stopPropagation(); setDescOpen(false); }} />
                  <div className="absolute top-full left-0 w-full bg-white border border-[#E2E8F0] rounded-2xl shadow-xl z-50 mt-1.5 max-h-44 overflow-y-auto py-1.5 thin-scrollbar">
                    {PASSBOOK_DESCS.map(d => (
                      <button key={d} type="button" onClick={e => { e.stopPropagation(); toggleDesc(d); }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors flex items-center gap-2 ${descs.includes(d) ? 'bg-[#F0FDF4] text-[#00A86B]' : 'text-[#475569] hover:bg-[#F8FAFC]'}`}>
                        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${descs.includes(d) ? 'bg-[#00A86B] border-[#00A86B]' : 'border-[#CBD5E1]'}`}>
                          {descs.includes(d) && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </span>
                        {d}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div>
            <label className={labelCls}>Email Report To (optional)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#94A3B8] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Leave blank to skip email"
                className={`${fieldCls} pl-10`} />
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] p-3.5">
            <Clock className="w-3.5 h-3.5 text-[#94A3B8] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#64748B] font-medium leading-relaxed">
              Report generation may take 1–5 minutes depending on data size. Download link appears in the table once ready.
            </p>
          </div>

          {result && (
            <div className={`flex items-center gap-2 text-xs font-semibold p-3.5 rounded-2xl ${result.ok ? 'bg-green-50 text-[#00A86B]' : 'bg-red-50 text-red-600'}`}>
              {result.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />} {result.text}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 p-5 md:p-6 border-t border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
          <button onClick={onClose} className="px-5 h-11 rounded-full border border-[#E2E8F0] text-[12.5px] font-bold text-[#64748B] hover:bg-white transition-colors">Cancel</button>
          <button onClick={handleGenerate} disabled={submitting}
            className="px-5 h-11 rounded-full bg-[#00A86B] text-white text-[12.5px] font-bold hover:bg-[#009B63] transition-colors disabled:opacity-60 flex items-center gap-1.5 shadow-sm">
            <FileText className="w-3.5 h-3.5" />{submitting ? 'Starting…' : 'Generate Report'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── MisReportTable ───────────────────────────────────────────────────────────
export function MisReportTable({ userId, isAdminView, fillHeight }: {
  userId: string | null; isAdminView: boolean; fillHeight?: boolean;
}) {
  const [reports, setReports] = useState<MisReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalReports, setTotalReports] = useState(0);
  const totalPages = Math.ceil(totalReports / rowsPerPage);

  const fetchReports = useCallback(async () => {
    if (!isAdminView && !userId) return;
    setLoading(true);
    try {
      const params: any = { page, limit: rowsPerPage };
      if (userId) params.userSearch = userId;
      const res = await apiClient.get('/mis-report/list', { params });
      setReports(res.data?.results || []);
      setTotalReports(res.data?.total || 0);
    } catch { setReports([]); }
    finally { setLoading(false); }
  }, [page, rowsPerPage, userId, isAdminView]);

  useEffect(() => { setPage(1); }, [rowsPerPage]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const statusStyle = (s: string) =>
    s === 'completed' ? 'bg-green-50 text-[#00A86B] border-green-200' :
    s === 'pending'   ? 'bg-amber-50 text-amber-600 border-amber-200' :
                        'bg-red-50 text-red-500 border-red-200';

  const typeColor = (t: string) =>
    t === 'Delivered' ? 'bg-green-50 text-[#00A86B]' :
    t === 'RTO'       ? 'bg-red-50 text-red-500' :
    t === 'Passbook'  ? 'bg-purple-50 text-purple-600' :
    t === 'Canceled'  ? 'bg-orange-50 text-orange-500' :
                        'bg-blue-50 text-blue-500';

  return (
    <div className={fillHeight ? 'flex flex-col flex-1 min-h-0' : ''}>
      <div className={fillHeight ? 'bg-white flex flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]' : 'bg-white border border-[#E2E8F0] rounded-2xl overflow-visible shadow-sm'}>
        {isAdminView && (
          <div className="sticky top-0 z-20 rounded-t-2xl flex items-center justify-between p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#00A86B]" />
                {!userId ? 'All MIS Reports' : 'MIS Reports'}
              </h3>
              <p className="text-[10px] text-[#94A3B8] mt-0.5">Excel reports generated across all report types</p>
            </div>
            <button onClick={fetchReports} title="Refresh"
              className={`w-9 h-9 flex items-center justify-center rounded-full border border-[#E2E8F0] text-[#64748B] hover:text-[#00A86B] hover:border-[#00A86B] transition-colors ${loading ? 'animate-spin' : ''}`}>
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className={`hidden md:block relative overflow-auto no-scrollbar ${fillHeight ? 'flex-1 min-h-0' : 'max-h-[560px]'}`}>
          {loading && <TableLoader />}
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 z-10 bg-[#E6F9F2] shadow-sm">
              <tr className="text-xs leading-[18px] font-medium text-[#64748B] uppercase tracking-wider border border-[#B9EFDB]">
                <th className="py-2 px-4 w-[5%]"><div className="flex items-center gap-1"><Hash className="w-3.5 h-3.5 shrink-0" /><span>#</span></div></th>
                {isAdminView && !userId && <th className="py-2 px-4 w-[14%]"><div className="flex items-center gap-1"><Users className="w-3.5 h-3.5 shrink-0" /><span>User</span></div></th>}
                <th className="py-2 px-4 w-[12%]"><div className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 shrink-0" /><span>Report Type</span></div></th>
                <th className="py-2 px-4 w-[12%]"><div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 shrink-0" /><span>Date Filter</span></div></th>
                <th className="py-2 px-4 w-[9%]"><div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 shrink-0" /><span>From</span></div></th>
                <th className="py-2 px-4 w-[9%]"><div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 shrink-0" /><span>To</span></div></th>
                <th className="py-2 px-4 w-[15%]"><div className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 shrink-0" /><span>Email</span></div></th>
                <th className="py-2 px-4 w-[13%]"><div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 shrink-0" /><span>Generated At</span></div></th>
                <th className="py-2 px-4 text-center w-[9%]"><div className="flex items-center justify-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>Status</span></div></th>
                <th className="py-2 px-4 text-right w-[12%]"><div className="flex items-center justify-end gap-1"><Download className="w-3.5 h-3.5 shrink-0" /><span>Download</span></div></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-12 text-xs text-[#94A3B8]">Loading reports…</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-sm font-medium text-[#94A3B8]">No reports generated yet. Click "Generate Report" to create one.</td></tr>
              ) : reports.map((r, i) => (
                <tr key={r._id} className={`border-b border-[#E2E8F0] transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'}`}>
                  <td className="p-3 text-[12px] font-normal text-[#94A3B8]">{(page - 1) * rowsPerPage + i + 1}</td>
                  {isAdminView && !userId && (
                    <td className="p-3">
                      <TruncatedText text={r.user?.fullname || '—'} maxLength={22} className="text-[12px] leading-[18px] font-semibold text-[#0F172A]" />
                      <TruncatedText text={r.user?.email || '—'} maxLength={26} className="text-[12px] leading-[18px] font-normal text-[#64748B]" />
                    </td>
                  )}
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-md text-[12px] font-semibold ${typeColor(r.reportType)}`}>{r.reportType}</span>
                  </td>
                  <td className="p-3 text-[12px] font-normal text-[#64748B] truncate">{r.dateFilterType || '—'}</td>
                  <td className="p-3 text-[12px] font-normal text-[#0F172A] whitespace-nowrap">{fmtDate(r.fromDate)}</td>
                  <td className="p-3 text-[12px] font-normal text-[#0F172A] whitespace-nowrap">{fmtDate(r.toDate)}</td>
                  <td className="p-3">
                    <TruncatedText text={r.email || '—'} maxLength={16} className="text-[12px] leading-[18px] font-normal text-[#64748B]" tooltipAlign="right" />
                  </td>
                  <td className="p-3 text-[12px] font-normal text-[#64748B] whitespace-nowrap">{fmtDateTime(r.createdAt)}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${statusStyle(r.status)}`}>
                      {r.status === 'pending' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse mr-1 align-middle" />}
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 text-right" style={{ paddingRight: 'calc(0.75rem + 10px)' }}>
                    {r.status === 'completed' && r.downloadUrl
                      ? <a href={r.downloadUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[12px] font-bold text-[#00A86B] hover:underline">
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      : <span className="text-[12px] text-[#CBD5E1] font-semibold">{r.status === 'pending' ? 'Processing…' : '—'}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className={`md:hidden relative bg-[#F8FAFC] ${fillHeight ? 'flex-1 min-h-0 overflow-y-auto' : ''}`}>
          {loading && <div className="relative h-32"><TableLoader /></div>}
          {!loading && reports.length === 0 ? (
            <EmptyState title="No reports yet" subtitle="Click &quot;Generate Report&quot; to create one" />
          ) : !loading && (
            <div className="p-1.5 space-y-2">
              {reports.map((r, i) => (
                <div key={r._id} className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
                  <StatusRibbon label={`#${(page - 1) * rowsPerPage + i + 1}`} color="#00A86B" />
                  <div className="pt-7 px-2.5 pb-2.5">
                    <div className="rounded-xl p-2 mb-1.5 bg-white border border-[#E2E8F0]">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-md text-[12px] font-semibold ${typeColor(r.reportType)}`}>{r.reportType}</span>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize flex items-center ${statusStyle(r.status)}`}>
                          {r.status === 'pending' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse mr-1" />}
                          {r.status}
                        </span>
                      </div>
                      {isAdminView && !userId && (
                        <>
                          <TruncatedText text={r.user?.fullname || '—'} maxLength={22} className="text-[12px] leading-[18px] font-semibold text-[#0F172A]" />
                          <TruncatedText text={r.user?.email || '—'} maxLength={26} className="text-[12px] leading-[18px] font-normal text-[#64748B]" />
                        </>
                      )}
                    </div>

                    <div className="bg-[#F8FAFC] rounded-xl px-2.5 py-2 mb-1.5 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider shrink-0">Date Range</span>
                        <span className="text-[12px] font-normal text-[#0F172A] text-right whitespace-nowrap">{fmtDate(r.fromDate)} → {fmtDate(r.toDate)}</span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider shrink-0">Filter</span>
                        <span className="text-[12px] font-normal text-[#0F172A] text-right truncate">{r.dateFilterType || '—'}</span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider shrink-0">Generated</span>
                        <span className="text-[12px] font-normal text-[#0F172A] text-right whitespace-nowrap">{fmtDateTime(r.createdAt)}</span>
                      </div>
                      {r.email && (
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-normal text-[#94A3B8] uppercase tracking-wider shrink-0">Email</span>
                          <TruncatedText text={r.email} maxLength={18} className="text-[12px] font-normal text-[#0F172A] ml-auto" tooltipAlign="right" />
                        </div>
                      )}
                    </div>

                    {r.status === 'completed' && r.downloadUrl ? (
                      <a href={r.downloadUrl} target="_blank" rel="noopener noreferrer"
                        className="w-full py-2 rounded-full border border-[#1E3A8A]/25 text-[#1E3A8A] text-[12.5px] font-bold flex items-center justify-center gap-1.5 transition-colors hover:bg-[#1E3A8A]/5 active:bg-[#1E3A8A]/10">
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    ) : (
                      <div className="w-full py-2 rounded-full border border-[#E2E8F0] text-[#94A3B8] text-[12.5px] font-bold flex items-center justify-center gap-1.5">
                        {r.status === 'pending' ? 'Processing…' : 'Not Available'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hidden md:block shrink-0">
        <DesktopPagination
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          startIndex={totalReports === 0 ? 0 : (page - 1) * rowsPerPage + 1}
          endIndex={Math.min(page * rowsPerPage, totalReports)}
          totalItems={totalReports}
        />
        </div>
        {<MobilePaginationBar {...({
          page,
          setPage,
          totalPages,
          rowsPerPage,
          setRowsPerPage,
          startIndex: totalReports === 0 ? 0 : (page - 1) * rowsPerPage + 1,
          endIndex: Math.min(page * rowsPerPage, totalReports),
          totalItems: totalReports,
          inline: !fillHeight,
        })} />}
      </div>
    </div>
  );
}
