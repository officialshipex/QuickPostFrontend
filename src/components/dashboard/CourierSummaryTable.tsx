import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Download, Columns, ChevronLeft, ChevronRight } from 'lucide-react';

interface CourierRow {
  courier: string;
  type: string;
  color: string;
  count: number;
  cod: number;
  prepaid: number;
  del: number;
  ndrDel: number;
  ndrR: string | number;
  rto: string | number;
  lost: string | number;
  za: string | number;
  zb: number;
  zc: number;
  zd: number;
  ze: number;
}

const allData: CourierRow[] = [
  { courier: 'Delhivery', type: 'Delivery Surface 0.5KG', color: '#111827', count: 32, cod: 31, prepaid: 32, del: 13, ndrDel: 14, ndrR: '-', rto: '-', lost: '-', za: '-', zb: 5, zc: 5, zd: 4, ze: 3 },
  { courier: 'Shree Maruti', type: 'Shree Maruti Surface 0.25KG', color: '#EF4444', count: 45, cod: 22, prepaid: 23, del: 18, ndrDel: 7, ndrR: 2, rto: 3, lost: '-', za: '-', zb: 8, zc: 6, zd: 5, ze: 4 },
  { courier: 'Bluedart', type: 'Bluedart Surface 0.5KG', color: '#3B82F6', count: 58, cod: 40, prepaid: 18, del: 30, ndrDel: 5, ndrR: '-', rto: '-', lost: '-', za: '-', zb: 10, zc: 9, zd: 7, ze: 5 },
  { courier: 'Ekart', type: 'Ekart Surface 3KG', color: '#F59E0B', count: 20, cod: 10, prepaid: 10, del: 9, ndrDel: 3, ndrR: 1, rto: 2, lost: '-', za: '-', zb: 4, zc: 3, zd: 3, ze: 2 },
  { courier: 'Shadowfax', type: 'Shadowfax surface 0.5KG', color: '#F97316', count: 37, cod: 20, prepaid: 17, del: 22, ndrDel: 6, ndrR: '-', rto: '-', lost: '-', za: '-', zb: 7, zc: 6, zd: 5, ze: 3 },
  { courier: 'DTDC', type: 'DTDC Surface 1KG', color: '#8B5CF6', count: 25, cod: 14, prepaid: 11, del: 15, ndrDel: 4, ndrR: '-', rto: '-', lost: '-', za: '-', zb: 5, zc: 5, zd: 4, ze: 3 },
  { courier: 'XpressBees', type: 'XpressBees Standard 0.5KG', color: '#10B981', count: 41, cod: 25, prepaid: 16, del: 28, ndrDel: 8, ndrR: 2, rto: 1, lost: '-', za: '-', zb: 8, zc: 7, zd: 6, ze: 4 },
  { courier: 'Delhivery', type: 'Delivery Express 2KG', color: '#111827', count: 19, cod: 12, prepaid: 7, del: 10, ndrDel: 3, ndrR: '-', rto: '-', lost: '-', za: '-', zb: 4, zc: 4, zd: 3, ze: 2 },
  { courier: 'Bluedart', type: 'Bluedart Apex 1KG', color: '#3B82F6', count: 13, cod: 8, prepaid: 5, del: 7, ndrDel: 2, ndrR: '-', rto: '-', lost: '-', za: '-', zb: 3, zc: 2, zd: 2, ze: 2 },
  { courier: 'Shadowfax', type: 'Shadowfax surface 1KG', color: '#F97316', count: 28, cod: 18, prepaid: 10, del: 16, ndrDel: 5, ndrR: 1, rto: '-', lost: '-', za: '-', zb: 6, zc: 5, zd: 4, ze: 3 },
  { courier: 'Ekart', type: 'Ekart Heavy 5KG', color: '#F59E0B', count: 11, cod: 6, prepaid: 5, del: 5, ndrDel: 2, ndrR: '-', rto: '-', lost: 1, za: '-', zb: 2, zc: 2, zd: 2, ze: 1 },
  { courier: 'DTDC', type: 'DTDC Priority 0.5KG', color: '#8B5CF6', count: 33, cod: 19, prepaid: 14, del: 20, ndrDel: 6, ndrR: '-', rto: '-', lost: '-', za: '-', zb: 7, zc: 6, zd: 5, ze: 4 },
];

type SortKey = keyof CourierRow;

const ALL_COLUMNS = [
  { key: 'courier' as SortKey, label: 'Courier', defaultVisible: true },
  { key: 'count' as SortKey, label: 'Shipment Count', defaultVisible: true },
  { key: 'cod' as SortKey, label: 'COD', defaultVisible: true },
  { key: 'prepaid' as SortKey, label: 'Prepaid', defaultVisible: true },
  { key: 'del' as SortKey, label: 'Delivered', defaultVisible: true },
  { key: 'ndrDel' as SortKey, label: 'NDR Delivered', defaultVisible: true },
  { key: 'ndrR' as SortKey, label: 'NDR Raised', defaultVisible: true },
  { key: 'rto' as SortKey, label: 'RTO Initiated', defaultVisible: false },
  { key: 'lost' as SortKey, label: 'Lost/Damaged', defaultVisible: false },
  { key: 'za' as SortKey, label: 'Zone A', defaultVisible: false },
  { key: 'zb' as SortKey, label: 'Zone B', defaultVisible: true },
  { key: 'zc' as SortKey, label: 'Zone C', defaultVisible: true },
  { key: 'zd' as SortKey, label: 'Zone D', defaultVisible: true },
  { key: 'ze' as SortKey, label: 'Zone E', defaultVisible: true },
];

const PAGE_SIZE = 8;

function exportCSV(data: CourierRow[], visibleKeys: string[]) {
  const headers = ALL_COLUMNS.filter(c => visibleKeys.includes(c.key)).map(c => c.label);
  const rows = data.map(row =>
    ALL_COLUMNS.filter(c => visibleKeys.includes(c.key)).map(c => String((row as any)[c.key]))
  );
  const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'courier_summary.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function CourierSummaryTable() {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('count');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(
    new Set(ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.key))
  );
  const [showColMenu, setShowColMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const filtered = useMemo(() => {
    return allData.filter(row =>
      row.courier.toLowerCase().includes(search.toLowerCase()) ||
      row.type.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = (a as any)[sortKey];
      const bv = (b as any)[sortKey];
      const an = typeof av === 'number' ? av : -1;
      const bn = typeof bv === 'number' ? bv : -1;
      return sortDir === 'asc' ? an - bn : bn - an;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (key === 'courier' || key === 'type' || key === 'color') return;
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(1);
  };

  const toggleCol = (key: string) => {
    setVisibleCols(prev => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 ml-1 text-[#CBD5E1]" />;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1 text-[#00A86B]" />
      : <ArrowDown className="w-3 h-3 ml-1 text-[#00A86B]" />;
  };

  const visibleColDefs = ALL_COLUMNS.filter(c => visibleCols.has(c.key));

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm mb-6 overflow-hidden flex flex-col">
      {/* Table Header Toolbar */}
      <div className="p-4 border-b border-[#E2E8F0] flex flex-wrap items-center gap-3 justify-between">
        <h3 className="text-[#0F172A] font-bold text-sm">Couriers Summary</h3>
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full px-3 h-8">
            <Search className="w-3.5 h-3.5 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search courier..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="bg-transparent text-xs text-[#0F172A] outline-none placeholder:text-[#94A3B8] w-36"
            />
          </div>

          {/* Column Toggle */}
          <div className="relative">
            <button
              onClick={() => { setShowColMenu(!showColMenu); setShowExportMenu(false); }}
              onBlur={() => setTimeout(() => setShowColMenu(false), 200)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#475569] px-3 h-8 rounded-full border border-[#E2E8F0] bg-white hover:border-[#00A86B] hover:text-[#00A86B] transition-all"
            >
              <Columns className="w-3.5 h-3.5" /> Columns
            </button>
            {showColMenu && (
              <div className="absolute right-0 mt-1 w-52 bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-30 p-2 max-h-72 overflow-y-auto">
                {ALL_COLUMNS.map(col => (
                  <label key={col.key} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#F8FAFC] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleCols.has(col.key)}
                      onChange={() => toggleCol(col.key)}
                      className="accent-[#00A86B] w-3.5 h-3.5"
                    />
                    <span className="text-xs text-[#475569]">{col.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Export */}
          <div className="relative">
            <button
              onClick={() => { setShowExportMenu(!showExportMenu); setShowColMenu(false); }}
              onBlur={() => setTimeout(() => setShowExportMenu(false), 200)}
              className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 h-8 rounded-full bg-[#00A86B] hover:bg-[#009B63] transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-30 overflow-hidden">
                <button
                  onClick={() => { exportCSV(sorted, [...visibleCols]); setShowExportMenu(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#475569] hover:bg-[#F8FAFC]"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => { alert('Excel export will be available after backend integration.'); setShowExportMenu(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#475569] hover:bg-[#F8FAFC]"
                >
                  Export Excel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-[#475569]">
              {visibleColDefs.map(col => (
                <th
                  key={col.key}
                  className={`p-4 font-semibold whitespace-nowrap ${col.key !== 'courier' ? 'text-center' : ''} ${col.key !== 'courier' && col.key !== 'type' && col.key !== 'color' ? 'cursor-pointer select-none' : ''}`}
                  onClick={() => handleSort(col.key)}
                >
                  <span className="inline-flex items-center">
                    {col.label}
                    {col.key !== 'courier' && col.key !== 'type' && col.key !== 'color' && <SortIcon col={col.key} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={visibleColDefs.length} className="text-center text-sm text-[#94A3B8] py-12">
                  No couriers found matching your search.
                </td>
              </tr>
            ) : (
              paginated.map((row, index) => (
                <tr key={index} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors text-xs text-[#0F172A]">
                  {visibleColDefs.map(col => (
                    col.key === 'courier' ? (
                      <td key={col.key} className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: row.color }}>
                            {row.courier.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold">{row.courier}</span>
                            <span className="text-[10px] text-[#64748B]">{row.type}</span>
                          </div>
                        </div>
                      </td>
                    ) : (
                      <td key={col.key} className="p-4 text-center font-medium text-[#475569]">
                        {String((row as any)[col.key])}
                      </td>
                    )
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] bg-white">
        <span className="text-xs text-[#64748B]">
          Showing {Math.min((page - 1) * PAGE_SIZE + 1, sorted.length)}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length} entries
        </span>
        <div className="flex items-center gap-1">
          <button
            className="w-7 h-7 rounded border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-7 h-7 rounded text-xs font-medium transition-all ${p === page ? 'bg-[#00A86B] text-white border border-[#00A86B]' : 'border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'}`}
            >
              {p}
            </button>
          ))}
          <button
            className="w-7 h-7 rounded border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-40"
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
