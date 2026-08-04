import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

export interface MobilePaginationBarProps {
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

export function useMobilePaginationBar({
  page,
  setPage,
  totalPages,
  rowsPerPage,
  setRowsPerPage,
  startIndex,
  endIndex,
  totalItems,
  rowsPerPageOptions = [20, 50, 100, 200],
}: MobilePaginationBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ left: 0, bottom: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click — check both button and floating panel
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

  if (totalItems === 0) return null;

  const handleToggle = () => {
    if (!isOpen && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPanelPos({
        left: r.left,
        bottom: window.innerHeight - r.top + 4,
        width: r.width,
      });
    }
    setIsOpen(v => !v);
  };

  return (
    <div className="md:hidden px-3 py-2 border-t border-[#E2E8F0] bg-white flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 shrink-0">

        {/* Trigger button */}
        <button
          ref={btnRef}
          onClick={handleToggle}
          className="h-6 pl-2 pr-1.5 flex items-center gap-1 rounded-md border border-[#E2E8F0] bg-white text-[10px] font-bold text-[#475569] cursor-pointer hover:border-[#CBD5E1] focus:outline-none focus:border-[#00A86B] transition-colors whitespace-nowrap"
        >
          <span>{rowsPerPage}/page</span>
          <ChevronDown
            className="w-3 h-3 text-[#94A3B8] transition-transform duration-200"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>

        {/* Floating panel — fixed so it escapes parent overflow */}
        <div
          ref={panelRef}
          style={{
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
          }}
          className="bg-white rounded-xl border border-[#E2E8F0] shadow-xl overflow-hidden"
        >
          {rowsPerPageOptions.map((v) => (
            <button
              key={v}
              onClick={() => { setRowsPerPage(v); setIsOpen(false); }}
              className={`w-full px-3 py-2 text-left text-[11px] font-semibold transition-colors whitespace-nowrap ${
                v === rowsPerPage
                  ? 'bg-[#E6F7F1] text-[#00A86B]'
                  : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              }`}
            >
              {v} / page
            </button>
          ))}
        </div>

        <span className="text-[10px] text-[#94A3B8] font-medium font-sans whitespace-nowrap">
          {startIndex}–{endIndex} of {totalItems}
        </span>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-6 h-6 flex items-center justify-center rounded border border-[#E2E8F0] text-[#475569] disabled:opacity-40"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-bold text-[#0F172A] px-1.5 whitespace-nowrap">{page}/{totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-6 h-6 flex items-center justify-center rounded border border-[#E2E8F0] text-[#475569] disabled:opacity-40"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
