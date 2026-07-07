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
  rowsPerPageOptions = [10, 25, 50, 100],
}: DesktopPaginationProps) {
  if (totalPages === 0) return null;

  return React.createElement('div', { className: 'hidden md:block' },
    React.createElement('div', { className: 'p-4 border-t border-[#E2E8F0] flex items-center justify-between' },
      React.createElement('div', { className: 'flex items-center gap-4' },
        React.createElement('div', { className: 'text-xs text-[#64748B]' },
          'Showing ',
          React.createElement('span', { className: 'font-bold text-[#0F172A]' }, startIndex),
          ' to ',
          React.createElement('span', { className: 'font-bold text-[#0F172A]' }, endIndex),
          ' of ',
          React.createElement('span', { className: 'font-bold text-[#0F172A]' }, totalItems),
          ' entries'
        ),
        React.createElement('div', { className: 'flex items-center gap-1.5' },
          React.createElement('span', { className: 'text-[11px] text-[#94A3B8] font-semibold uppercase tracking-wider' }, 'Show'),
          React.createElement('select', {
            value: rowsPerPage,
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setRowsPerPage(Number(e.target.value)),
            className: "h-8 px-2.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-bold text-[#475569] cursor-pointer appearance-none min-w-[56px] text-center shadow-sm hover:border-[#00A86B]/40 hover:shadow-[0_0_0_3px_rgba(0,168,107,0.06)] focus:outline-none focus:border-[#00A86B] focus:shadow-[0_0_0_3px_rgba(0,168,107,0.1)] transition-all duration-200 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_8px_center] bg-no-repeat pr-7"
          },
            rowsPerPageOptions.map((v) => React.createElement('option', { key: v, value: v }, v))
          )
        )
      ),
      React.createElement('div', { className: 'flex items-center gap-1' },
        React.createElement('button', {
          onClick: () => setPage((p) => Math.max(1, p - 1)),
          disabled: page === 1,
          className: 'px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50'
        }, 'Previous'),
        Array.from({ length: totalPages }, (_, i) => (
          React.createElement('button', {
            key: i + 1,
            onClick: () => setPage(i + 1),
            className: `w-8 h-8 rounded text-xs font-medium flex items-center justify-center transition-colors ${
              page === i + 1 ? 'bg-[#00A86B] text-white border border-[#00A86B]' : 'border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
            }`
          }, i + 1)
        )),
        React.createElement('button', {
          onClick: () => setPage((p) => Math.min(totalPages, p + 1)),
          disabled: page === totalPages,
          className: 'px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50'
        }, 'Next')
      )
    )
  );
}
