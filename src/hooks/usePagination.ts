import React, { useState, useMemo, useEffect, useRef } from 'react';

export interface UsePaginationOptions<T> {
  data: T[];
  perPage?: number;
  initialPage?: number;
}

export function usePagination<T>({
  data,
  perPage = 10,
  initialPage = 1,
}: UsePaginationOptions<T>) {
  const [page, setPage] = useState(initialPage);
  const [rowsPerPage, setRowsPerPage] = useState(perPage);

  // Keep internal rowsPerPage in sync with the perPage prop — useState(perPage) only
  // applies on first mount, so without this, callers that pass an external/controlled
  // perPage value (e.g. a "rows per page" dropdown driven by the caller's own state)
  // would see paginatedData stay sliced at the original page size forever.
  useEffect(() => {
    setRowsPerPage(perPage);
  }, [perPage]);

  // Reset to page 1 if the dataset changes or shrinks
  useEffect(() => {
    setPage(1);
  }, [data.length]);

  // Reset to page 1 when rows per page changes
  useEffect(() => {
    setPage(1);
  }, [rowsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(data.length / rowsPerPage);
  }, [data.length, rowsPerPage]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return data.slice(start, start + rowsPerPage);
  }, [data, page, rowsPerPage]);

  const startIndex = data.length === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const endIndex = Math.min(page * rowsPerPage, data.length);

  const nextPage = () => setPage((p) => Math.min(totalPages, p + 1));
  const prevPage = () => setPage((p) => Math.max(1, p - 1));

  return {
    page,
    setPage,
    totalPages,
    paginatedData,
    startIndex,
    endIndex,
    totalItems: data.length,
    nextPage,
    prevPage,
    rowsPerPage,
    setRowsPerPage,
  };
}

export interface DesktopPaginationProps {
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  rowsPerPage: number;
  setRowsPerPage: React.Dispatch<React.SetStateAction<number>>;
  startIndex: number;
  endIndex: number;
  totalItems: number;
  rowsPerPageOptions?: number[];
}

export function DesktopPagination({
  page,
  setPage,
  totalPages,
  rowsPerPage,
  setRowsPerPage,
  startIndex,
  endIndex,
  totalItems,
  rowsPerPageOptions = [20, 50, 100, 200],
}: DesktopPaginationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ left: 0, bottom: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click — both button and floating panel
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !panelRef.current?.contains(t)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  if (totalPages === 0) return null;

  const handleToggle = () => {
    if (!isOpen && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      // Always open upward — pagination bar is always near the bottom of the viewport
      setPanelPos({
        left: r.left,
        bottom: window.innerHeight - r.top + 4,
        width: r.width,
      });
    }
    setIsOpen(v => !v);
  };

  const arrowBtnClass = 'w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150';

  const chevron = React.createElement('svg', {
    width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round',
    style: { transition: 'transform 200ms ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 },
  }, React.createElement('polyline', { points: '6 9 12 15 18 9' }));

  return React.createElement('div', { className: 'hidden md:block' },
    React.createElement('div', { className: 'px-5 py-3 border-t border-[#E2E8F0] flex items-center justify-between bg-white' },

      // Left: custom rows-per-page dropdown (fixed panel escapes overflow clipping)
      React.createElement('div', { className: 'flex items-center gap-2' },
        React.createElement('span', { className: 'text-[13px] text-[#64748B] font-medium select-none' }, 'Rows per page:'),

        // Trigger button
        React.createElement('button', {
          ref: btnRef,
          onClick: handleToggle,
          className: 'h-8 pl-3 pr-2.5 flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white text-[13px] font-semibold text-[#0F172A] cursor-pointer shadow-sm hover:border-[#CBD5E1] focus:outline-none focus:border-[#00A86B] focus:shadow-[0_0_0_2px_rgba(0,168,107,0.08)] transition-all duration-150 min-w-[72px] justify-between',
        }, React.createElement('span', null, rowsPerPage), chevron),

        // Floating panel — position: fixed so parent overflow never clips it
        React.createElement('div', {
          ref: panelRef,
          style: {
            position: 'fixed',
            left: panelPos.left,
            bottom: panelPos.bottom,
            width: panelPos.width,
            zIndex: 9999,
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? 'scaleY(1) translateY(0)' : 'scaleY(0.92) translateY(4px)',
            transformOrigin: 'bottom left',
            transition: 'opacity 180ms ease, transform 180ms ease',
            pointerEvents: isOpen ? 'auto' : 'none',
          },
          className: 'bg-white rounded-xl border border-[#E2E8F0] shadow-xl overflow-hidden',
        },
          ...rowsPerPageOptions.map((v) =>
            React.createElement('button', {
              key: v,
              onClick: () => { setRowsPerPage(v); setIsOpen(false); },
              className: `w-full px-4 py-2 text-left text-[13px] font-semibold transition-colors whitespace-nowrap ${
                v === rowsPerPage
                  ? 'bg-[#E6F7F1] text-[#00A86B]'
                  : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              }`,
            }, v)
          )
        )
      ),

      // Right: start–end of total  ← Page X of Y →
      React.createElement('div', { className: 'flex items-center gap-3' },
        React.createElement('span', { className: 'text-[13px] text-[#64748B] font-medium select-none' }, `${startIndex}–${endIndex} of ${totalItems}`),
        React.createElement('button', { onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1, className: arrowBtnClass, 'aria-label': 'Previous page' },
          React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
            React.createElement('polyline', { points: '15 18 9 12 15 6' })
          )
        ),
        React.createElement('span', { className: 'text-[13px] text-[#64748B] font-medium select-none' },
          'Page ',
          React.createElement('span', { className: 'font-bold text-[#0F172A]' }, page),
          ' of ',
          React.createElement('span', { className: 'font-bold text-[#0F172A]' }, totalPages)
        ),
        React.createElement('button', { onClick: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: page === totalPages, className: arrowBtnClass, 'aria-label': 'Next page' },
          React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
            React.createElement('polyline', { points: '9 18 15 12 9 6' })
          )
        )
      )
    )
  );
}

