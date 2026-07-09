import React, { useState, useMemo, useEffect } from 'react';

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
  rowsPerPageOptions = [10, 20, 50, 100],
}: DesktopPaginationProps) {
  if (totalPages === 0) return null;

  const arrowBtnClass = 'w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150';

  return React.createElement('div', { className: 'hidden md:block' },
    React.createElement('div', { className: 'px-5 py-3 border-t border-[#E2E8F0] flex items-center justify-between bg-white' },
      // Left: Rows per page
      React.createElement('div', { className: 'flex items-center gap-2' },
        React.createElement('span', { className: 'text-[13px] text-[#64748B] font-medium select-none' }, 'Rows per page:'),
        React.createElement('select', {
          value: rowsPerPage,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setRowsPerPage(Number(e.target.value)),
          className: "h-8 pl-2.5 pr-7 rounded-lg border border-[#E2E8F0] bg-white text-[13px] font-semibold text-[#0F172A] cursor-pointer appearance-none min-w-[52px] text-center shadow-sm hover:border-[#CBD5E1] focus:outline-none focus:border-[#00A86B] focus:shadow-[0_0_0_2px_rgba(0,168,107,0.08)] transition-all duration-150 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:10px] bg-[right_8px_center] bg-no-repeat"
        },
          rowsPerPageOptions.map((v) => React.createElement('option', { key: v, value: v }, v))
        )
      ),
      // Right: ← Page X of Y →
      React.createElement('div', { className: 'flex items-center gap-3' },
        React.createElement('button', {
          onClick: () => setPage((p) => Math.max(1, p - 1)),
          disabled: page === 1,
          className: arrowBtnClass,
          'aria-label': 'Previous page'
        },
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
        React.createElement('button', {
          onClick: () => setPage((p) => Math.min(totalPages, p + 1)),
          disabled: page === totalPages,
          className: arrowBtnClass,
          'aria-label': 'Next page'
        },
          React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
            React.createElement('polyline', { points: '9 18 15 12 9 6' })
          )
        )
      )
    )
  );
}

