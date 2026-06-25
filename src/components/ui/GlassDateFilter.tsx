import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface GlassDateFilterProps {
  startDate: string; // yyyy-mm-dd
  endDate: string;   // yyyy-mm-dd
  onDateChange: (start: string, end: string) => void;
  className?: string;
  align?: 'left' | 'right';
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const QUICK_RANGES = [
  { label: 'Today', getDates: () => { const d = new Date(); return [d, d]; } },
  { label: 'Yesterday', getDates: () => { const d = new Date(); d.setDate(d.getDate() - 1); return [d, d]; } },
  { label: 'Last 7 Days', getDates: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate() - 6); return [s, e]; } },
  { label: 'Last 30 Days', getDates: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate() - 29); return [s, e]; } },
  { label: 'This Month', getDates: () => { const now = new Date(); return [new Date(now.getFullYear(), now.getMonth(), 1), now]; } },
  { label: 'Last Month', getDates: () => { const now = new Date(); return [new Date(now.getFullYear(), now.getMonth() - 1, 1), new Date(now.getFullYear(), now.getMonth(), 0)]; } },
];

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDate(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function displayDate(s: string): string {
  const d = parseDate(s);
  if (!d) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const mon = MONTHS[d.getMonth()].slice(0, 3);
  const year = d.getFullYear();
  return `${day} ${mon} ${year}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function GlassDateFilter({
  startDate,
  endDate,
  onDateChange,
  className = '',
  align = 'left',
}: GlassDateFilterProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calendar state
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  // Selection state for interaction
  const [selectStart, setSelectStart] = useState<Date | null>(parseDate(startDate));
  const [selectEnd, setSelectEnd] = useState<Date | null>(parseDate(endDate));
  const [selecting, setSelecting] = useState(false); // true when user picked start, hasn't picked end

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleDayClick = (day: Date) => {
    if (!selecting) {
      // First click: set start
      setSelectStart(day);
      setSelectEnd(null);
      setSelecting(true);
    } else {
      // Second click: set end
      if (selectStart && day < selectStart) {
        setSelectEnd(selectStart);
        setSelectStart(day);
      } else {
        setSelectEnd(day);
      }
      setSelecting(false);
    }
  };

  const handleApply = () => {
    if (selectStart && selectEnd) {
      onDateChange(formatDate(selectStart), formatDate(selectEnd));
      setOpen(false);
    } else if (selectStart) {
      onDateChange(formatDate(selectStart), formatDate(selectStart));
      setOpen(false);
    }
  };

  const handleQuickRange = (getDates: () => Date[]) => {
    const [s, e] = getDates();
    setSelectStart(s);
    setSelectEnd(e);
    setSelecting(false);
    setViewYear(s.getFullYear());
    setViewMonth(s.getMonth());
  };

  const handleClear = () => {
    setSelectStart(null);
    setSelectEnd(null);
    setSelecting(false);
  };

  // Build calendar grid
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const calendarDays: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(new Date(viewYear, viewMonth, i));
  // Fill remaining
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);

  const isInRange = (day: Date): boolean => {
    const s = selectStart;
    const e = selectEnd || (selecting ? hoverDate : null);
    if (!s || !e) return false;
    const start = s < e ? s : e;
    const end = s < e ? e : s;
    return day >= start && day <= end;
  };

  const isRangeStart = (day: Date): boolean => {
    if (!selectStart) return false;
    return isSameDay(day, selectStart);
  };

  const isRangeEnd = (day: Date): boolean => {
    const e = selectEnd || (selecting ? hoverDate : null);
    if (!e) return false;
    return isSameDay(day, e);
  };

  const isToday = (day: Date): boolean => isSameDay(day, today);

  const hasRange = startDate && endDate;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="glass-dropdown-trigger group"
        type="button"
      >
        <Calendar className="glass-dropdown-icon-svg" />
        <span className={`glass-dropdown-label ${hasRange ? 'has-value' : ''}`}>
          {hasRange
            ? `${displayDate(startDate)} — ${displayDate(endDate)}`
            : 'Select Date Range'
          }
        </span>
        {hasRange && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDateChange('', '');
              handleClear();
            }}
            className="glass-dropdown-search-clear"
            type="button"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </button>

      {/* Calendar Panel */}
      {open && (
        <div 
          className="glass-date-panel" 
          style={align === 'right' ? { right: 0, left: 'auto' } : {}}
        >
          <div className="glass-shimmer" />

          <div className="glass-date-layout">
            {/* Quick Ranges Sidebar */}
            <div className="glass-date-sidebar">
              <div className="glass-date-sidebar-title">Quick Select</div>
              {QUICK_RANGES.map(range => (
                <button
                  key={range.label}
                  onClick={() => handleQuickRange(range.getDates)}
                  className="glass-date-quick-btn"
                  type="button"
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Calendar */}
            <div className="glass-date-calendar">
              {/* Month Navigation */}
              <div className="glass-date-nav">
                <button onClick={prevMonth} className="glass-date-nav-btn" type="button">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="glass-date-month-label">
                  {MONTHS[viewMonth]} {viewYear}
                </span>
                <button onClick={nextMonth} className="glass-date-nav-btn" type="button">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Day Headers */}
              <div className="glass-date-weekdays">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="glass-date-weekday">{d}</div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="glass-date-grid">
                {calendarDays.map((day, i) => {
                  if (!day) return <div key={`empty-${i}`} className="glass-date-cell empty" />;

                  const inRange = isInRange(day);
                  const rangeStart = isRangeStart(day);
                  const rangeEnd = isRangeEnd(day);
                  const todayClass = isToday(day);
                  const isFuture = day > today;

                  return (
                    <button
                      key={i}
                      onClick={() => !isFuture && handleDayClick(day)}
                      onMouseEnter={() => selecting && setHoverDate(day)}
                      className={[
                        'glass-date-cell',
                        inRange ? 'in-range' : '',
                        rangeStart ? 'range-start' : '',
                        rangeEnd ? 'range-end' : '',
                        todayClass ? 'today' : '',
                        isFuture ? 'disabled' : '',
                      ].filter(Boolean).join(' ')}
                      type="button"
                      disabled={isFuture}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>

              {/* Selected Summary & Actions */}
              <div className="glass-date-footer">
                <div className="glass-date-summary">
                  {selectStart && (
                    <span className="glass-date-selected-label">
                      {displayDate(formatDate(selectStart))}
                      {selectEnd && ` — ${displayDate(formatDate(selectEnd))}`}
                    </span>
                  )}
                  {!selectStart && (
                    <span className="glass-date-hint">
                      {selecting ? 'Select end date' : 'Select start date'}
                    </span>
                  )}
                </div>
                <div className="glass-date-actions">
                  <button
                    onClick={handleClear}
                    className="glass-date-action-btn secondary"
                    type="button"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleApply}
                    className="glass-date-action-btn primary"
                    disabled={!selectStart}
                    type="button"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
