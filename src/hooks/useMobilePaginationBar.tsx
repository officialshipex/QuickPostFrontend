import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

/**
 * Shared mobile pagination footer: "Show N" rows-per-page dropdown + Prev/Next.
 * Used at the bottom of every mobile card list (Shipping, Passbook, Wallet Recharge, Invoices)
 * so pagination behavior/markup stays identical across tabs.
 */
export function useMobilePaginationBar({
  page,
  setPage,
  totalPages,
  rowsPerPage,
  setRowsPerPage,
  startIndex,
  endIndex,
  totalItems,
  rowsPerPageOptions = [10, 25, 50, 100],
}: MobilePaginationBarProps) {
  if (totalItems === 0) return null;

  return (
    <div className="md:hidden px-3 py-2 border-t border-[#E2E8F0] bg-white flex items-center justify-between gap-2">
      <div className="flex items-center gap-1 shrink-0">
        <select
          value={rowsPerPage}
          onChange={(e) => setRowsPerPage(Number(e.target.value))}
          className="h-6 pl-1.5 pr-4 rounded-md border border-[#E2E8F0] bg-white text-[10px] font-bold text-[#475569] cursor-pointer appearance-none text-center focus:outline-none focus:border-[#00A86B] font-sans bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:9px] bg-[right_4px_center] bg-no-repeat"
        >
          {rowsPerPageOptions.map((v) => (
            <option key={v} value={v}>{v}/page</option>
          ))}
        </select>
        <span className="text-[10px] text-[#94A3B8] font-medium font-sans whitespace-nowrap">{startIndex}–{endIndex} of {totalItems}</span>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-6 h-6 flex items-center justify-center rounded border border-[#E2E8F0] text-[#475569] disabled:opacity-40 font-sans"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-bold text-[#0F172A] px-1.5 font-sans whitespace-nowrap">{page}/{totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-6 h-6 flex items-center justify-center rounded border border-[#E2E8F0] text-[#475569] disabled:opacity-40 font-sans"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
