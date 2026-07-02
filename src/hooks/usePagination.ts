import { useState, useMemo, useEffect } from 'react';

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

  // Reset to page 1 if the dataset changes or shrinks
  useEffect(() => {
    setPage(1);
  }, [data.length]);

  const totalPages = useMemo(() => {
    return Math.ceil(data.length / perPage);
  }, [data.length, perPage]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * perPage;
    return data.slice(start, start + perPage);
  }, [data, page, perPage]);

  const startIndex = data.length === 0 ? 0 : (page - 1) * perPage + 1;
  const endIndex = Math.min(page * perPage, data.length);

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
  };
}
