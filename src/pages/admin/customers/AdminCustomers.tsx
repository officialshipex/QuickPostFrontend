import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus, Search, Download, Eye, EyeOff, User, Phone, MapPin, ShoppingCart, Settings, Pencil, Trash2, X, Mail,
  AlertCircle, Users, UserPlus, Repeat, Package, ChevronRight, Hash, MoreHorizontal, UserCheck,
} from 'lucide-react';
import { AdminLayout } from '../../../components/admin/layout/AdminLayout';
import { apiClient } from '../../../services/apiClient';
import { useAdminTab } from '../../../context/AdminUserContext';
import { useTableLoader } from '../../../hooks/useTableLoader';
import { TableLoader } from '../../../components/ui/TableLoader';
import { TruncatedText } from '../../../components/ui/TruncatedText';
import { StatusRibbon } from '../../../components/ui/StatusRibbon';
import { usePagination, DesktopPagination } from '../../../hooks/usePagination';
import { MobilePaginationBar } from '../../../hooks/useMobilePaginationBar';
import { deleteCustomer, prefillOrderWith, readCustomers, type Customer } from './customersStore';

/* Setup & Manage → Customers. One row per buyer: customers the seller saved here, merged (by phone number) with
   the buyers of their recent orders, so repeat buyers show their order count, spend and channel. */

const ORDERS_TO_SCAN = 500;

interface OrderLite { id: string; orderId: string; date: string | null; amount: number; status: string; channel: string; method: string }

interface CustomerRow {
  key: string;
  saved?: Customer;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  pinCode: string;
  channel: string;
  orders: OrderLite[];
  spend: number;
  lastOrderAt: string | null;
  createdAt: string | null;
}

const digits = (s: unknown) => String(s ?? '').replace(/\D/g, '').slice(-10);
const fullName = (r: Pick<CustomerRow, 'firstName' | 'lastName'>) => `${r.firstName} ${r.lastName}`.trim() || '—';
const maskPhone = (p: string) => (p.length === 10 ? `${p.slice(0, 2)}XXX-XXX${p.slice(8)}` : 'XXXXX-XXXXX');
const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
/** Same marker the Orders page uses for a repeat customer. */
const RepeatMark = ({ onOpen }: { onOpen: (rect: DOMRect) => void }) => (
  <button type="button" title="Repeat customer" aria-label="Repeat customer"
    onClick={e => { e.stopPropagation(); onOpen(e.currentTarget.getBoundingClientRect()); }}
    className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#EEF2FF] text-[#4F46E5] hover:text-[#4338CA] cursor-pointer transition-colors">
    <UserCheck className="w-3 h-3" />
  </button>
);
const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || 'C';

function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') };
}

function mergeRows(saved: Customer[], rawOrders: any[]): CustomerRow[] {
  const map = new Map<string, CustomerRow>();
  for (const c of saved) {
    map.set(c.phone || c.id, {
      key: c.phone || c.id, saved: c, firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone,
      address1: c.address1, address2: c.address2, city: c.city, state: c.state, pinCode: c.pinCode,
      channel: 'Manual', orders: [], spend: 0, lastOrderAt: null, createdAt: c.createdAt,
    });
  }
  for (const o of rawOrders) {
    const r = o.receiverAddress || {};
    const phone = digits(r.phoneNumber);
    if (phone.length !== 10) continue;
    const order: OrderLite = {
      id: o._id, orderId: String(o.orderId || o._id), date: o.createdAt || null, amount: Number(o.paymentDetails?.amount) || 0,
      status: o.status || 'New', channel: o.channel || 'Custom', method: o.paymentDetails?.method || 'Prepaid',
    };
    let row = map.get(phone);
    if (!row) {
      const n = splitName(r.contactName || '');
      row = {
        key: phone, firstName: n.firstName, lastName: n.lastName, email: typeof r.email === 'string' ? r.email : '', phone,
        address1: r.address || '', address2: '', city: r.city || '', state: r.state || '', pinCode: String(r.pinCode || r.pincode || ''),
        channel: order.channel, orders: [], spend: 0, lastOrderAt: null, createdAt: order.date,
      };
      map.set(phone, row);
    }
    row.orders.push(order);
    row.spend += order.amount;
    if (order.date && (!row.lastOrderAt || order.date > row.lastOrderAt)) {
      row.lastOrderAt = order.date;
      if (!row.saved) row.channel = order.channel;
    }
    if (order.date && (!row.createdAt || order.date < row.createdAt)) row.createdAt = order.date;
  }
  return [...map.values()].sort((a, b) => (b.lastOrderAt || b.createdAt || '').localeCompare(a.lastOrderAt || a.createdAt || ''));
}


function ChannelTag({ channel }: { channel: string }) {
  const manual = channel === 'Manual';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${manual ? 'bg-[#F1F5F9] text-[#475569]' : 'bg-[#F0FDF4] text-[#00A86B]'}`}>
      {channel === 'WooCommerce' ? 'Woo' : channel === 'CUSTOM' ? 'Custom' : channel}
    </span>
  );
}

export function AdminCustomers() {
  const navigate = useNavigate();
  const { currentUserId } = useAdminTab();
  const isImpersonating = !!localStorage.getItem('admin_token_backup');

  const [saved, setSaved] = useState<Customer[]>(() => readCustomers(currentUserId));
  const [rawOrders, setRawOrders] = useState<any[]>([]);
  const { isLoading: loading, setIsLoading: setLoading } = useTableLoader(0);
  const [ordersFailed, setOrdersFailed] = useState(false);
  const [q, setQ] = useState('');
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [viewing, setViewing] = useState<CustomerRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CustomerRow | null>(null);
  const [menu, setMenu] = useState<{ key: string; top: number; left: number } | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [repeatPopover, setRepeatPopover] = useState<{ rect: DOMRect; key: string } | null>(null);
  const toggleSelect = (key: string) => setSelected(s => (s.includes(key) ? s.filter(k => k !== key) : [...s, key]));

  useEffect(() => { setSaved(readCustomers(currentUserId)); }, [currentUserId]);

  const fetchOrders = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);
    setOrdersFailed(false);
    try {
      const res = await apiClient.get('/admin/filterEmployeeOrders', { params: { page: 1, limit: ORDERS_TO_SCAN, userId: currentUserId } });
      setRawOrders(res.data?.orders || []);
    } catch {
      setOrdersFailed(true);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, setLoading]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const rows = useMemo(() => mergeRows(saved, rawOrders), [saved, rawOrders]);

  const counts = useMemo(() => ({ repeat: rows.filter(r => r.orders.length > 1).length, saved: rows.filter(r => r.saved).length }), [rows]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const termDigits = term.replace(/\D/g, '');
    return rows.filter(r => !term
      || fullName(r).toLowerCase().includes(term)
      || r.email.toLowerCase().includes(term)
      || r.city.toLowerCase().includes(term)
      || r.pinCode.includes(term)
      || (termDigits.length >= 3 && r.phone.includes(termDigits)));
  }, [rows, q]);

  const { page, setPage, totalPages, paginatedData, startIndex, endIndex, totalItems, rowsPerPage, setRowsPerPage } =
    usePagination({ data: filtered, perPage: 20 });

  const stats = [
    { label: 'Total customers', value: rows.length, icon: Users },
    { label: 'Repeat customers', value: counts.repeat ?? 0, icon: Repeat },
    { label: 'Added manually', value: counts.saved ?? 0, icon: UserPlus },
    { label: 'Orders (recent)', value: rawOrders.length, icon: Package },
  ];

  // Showing a number waits 2 s (spinner), then fades it in; hiding is instant.
  const [revealing, setRevealing] = useState<Set<string>>(new Set());
  const toggleReveal = (key: string) => {
    if (revealing.has(key)) return;
    if (revealed.has(key)) { setRevealed(s => { const n = new Set(s); n.delete(key); return n; }); return; }
    setRevealing(s => new Set(s).add(key));
    window.setTimeout(() => {
      setRevealing(s => { const n = new Set(s); n.delete(key); return n; });
      setRevealed(s => new Set(s).add(key));
    }, 2000);
  };

  const addOrderFor = (r: CustomerRow) => {
    prefillOrderWith(r);
    navigate('/user/add-order');
  };

  const removeSaved = () => {
    if (!confirmDelete?.saved) return;
    deleteCustomer(currentUserId, confirmDelete.saved.id);
    setSaved(readCustomers(currentUserId));
    if (viewing?.key === confirmDelete.key) setViewing(null);
    setConfirmDelete(null);
  };

  const exportCsv = () => {
    const head = ['Name', 'Phone', 'Email', 'Address', 'City', 'State', 'Pincode', 'Channel', 'Orders', 'Total spend', 'Last order'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const picked = selected.length ? filtered.filter(r => selected.includes(r.key)) : filtered;
    const lines = picked.map(r => [fullName(r), r.phone, r.email, [r.address1, r.address2].filter(Boolean).join(', '), r.city, r.state, r.pinCode,
      r.channel, r.orders.length, Math.round(r.spend), fmtDate(r.lastOrderAt)].map(esc).join(','));
    const blob = new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const phoneCell = (r: CustomerRow) => (
    <span className="inline-flex items-center gap-1.5 tabular-nums">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={revealed.has(r.key) ? 'shown' : 'masked'} initial={{ opacity: 0, filter: 'blur(3px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0 }} transition={{ duration: 0.35 }} >
          {revealed.has(r.key) ? r.phone : maskPhone(r.phone)}
        </motion.span>
      </AnimatePresence>
      {r.phone && (
        <button type="button" onClick={e => { e.stopPropagation(); toggleReveal(r.key); }} disabled={revealing.has(r.key)}
          aria-label={revealing.has(r.key) ? 'Loading phone number' : revealed.has(r.key) ? 'Hide phone number' : 'Show phone number'}
          className="w-6 h-6 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-[#00A86B] hover:bg-[#F0FDF4]">
          {revealed.has(r.key) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      )}
    </span>
  );

  return (
    <AdminLayout>
      <div className={`flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white overflow-hidden`}>

        {/* Top bar — desktop */}
        <div className="hidden md:flex items-center justify-between gap-3 px-6 py-4 border-b border-[#E2E8F0] shrink-0">
          <div>
            <h1 className="text-[20px] font-bold text-[#0F172A]">Customers</h1>
            <p className="text-[13px] text-[#64748B] mt-0.5">Everyone you ship to — saved customers and buyers from your orders</p>
          </div>
          <div className="flex items-center gap-2">
            <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, phone, email, city…" className="glass-search-input w-[260px]" />
            <button onClick={exportCsv} disabled={!filtered.length} aria-label="Export CSV" title="Export CSV"
              className="w-9 h-9 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] hover:border-[#00A86B] hover:text-[#00A86B] transition-colors shrink-0 disabled:opacity-40">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={() => navigate('/user/customers/new')}
              className="h-9 px-4 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-semibold inline-flex items-center gap-1.5 shadow-sm transition-colors shrink-0">
              <Plus className="w-4 h-4" /> Add Customer
            </button>
          </div>
        </div>

        {/* Top bar — mobile */}
        <div className="md:hidden px-3 py-2.5 border-b border-[#E2E8F0] flex items-center gap-2 bg-white shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="Search customers…"
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10" />
          </div>
          <button onClick={exportCsv} disabled={!filtered.length} aria-label="Export CSV" className="w-9 h-9 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#475569] bg-white shrink-0 disabled:opacity-40">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={() => navigate('/user/customers/new')} aria-label="Add customer" className="w-9 h-9 rounded-full bg-[#00A86B] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Stats + segments */}
        <div className="px-3 md:px-6 pt-3 md:pt-4 pb-3 border-b border-[#F1F5F9] shrink-0 bg-white">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
            {stats.map(s => (
              <div key={s.label} className="rounded-xl border border-[#E2E8F0] px-3 py-2.5 md:px-4 md:py-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11.5px] md:text-[12px] font-medium text-[#64748B] leading-tight md:truncate">{s.label}</div>
                  <div className="text-[18px] md:text-[20px] font-bold text-[#0F172A] tabular-nums leading-tight mt-0.5">{loading ? '—' : s.value.toLocaleString('en-IN')}</div>
                </div>
                <span className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center shrink-0"><s.icon className="w-4 h-4" /></span>
              </div>
            ))}
          </div>
        </div>

        {ordersFailed && (
          <div className="flex items-center gap-2 p-3 mx-3 md:mx-6 mt-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-[12.5px] shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" /> Couldn't load buyers from your orders. Showing saved customers only.
            <button onClick={fetchOrders} className="ml-auto font-semibold underline underline-offset-2">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="flex-1 relative"><TableLoader /></div>
        ) : rows.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-14 h-14 rounded-full bg-[#F0FDF4] flex items-center justify-center mb-4"><Users className="w-7 h-7 text-[#00A86B]" /></div>
            <p className="text-[15px] font-semibold text-[#0F172A] mb-1">No customers yet</p>
            <p className="text-[13px] text-[#64748B] mb-5 max-w-sm">Buyers from your orders appear here automatically. You can also add a customer to reuse their address on new orders.</p>
            <button onClick={() => navigate('/user/customers/new')} className="flex items-center gap-2 h-9 px-5 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-semibold">
              <Plus className="w-4 h-4" /> Add Customer
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <Search className="w-8 h-8 text-[#CBD5E1] mb-3" />
            <p className="text-[14px] font-semibold text-[#0F172A] mb-1">No customers match</p>
            <p className="text-[13px] text-[#64748B]">Try a different name, phone number or city</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-auto w-full relative">
                <table className="w-full text-left border-collapse min-w-full">
                  <thead className="sticky top-0 z-40 bg-[#E6F9F2] shadow-sm">
                    <tr className="text-xs leading-[18px] font-medium text-[#64748B] uppercase tracking-wider border border-[#B9EFDB]">
                      <th className="py-2 px-4 w-10 rounded-l-lg">
                        <input type="checkbox" aria-label="Select all customers"
                          checked={paginatedData.length > 0 && paginatedData.every(r => selected.includes(r.key))}
                          onChange={e => { const keys = paginatedData.map(r => r.key); setSelected(s => (e.target.checked ? [...new Set([...s, ...keys])] : s.filter(k => !keys.includes(k)))); }}
                          className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                      </th>
                      <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><User className="w-3.5 h-3.5" /><span>Customer</span></div></th>
                      <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /><span>Phone</span></div></th>
                      <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /><span>Address</span></div></th>
                      <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center gap-1"><ShoppingCart className="w-3.5 h-3.5" /><span>Channel</span></div></th>
                      <th className="py-2 px-4 whitespace-nowrap"><div className="flex items-center justify-center gap-1"><Hash className="w-3.5 h-3.5" /><span>Orders</span></div></th>
                      <th className="py-2 px-4 whitespace-nowrap sticky right-0 bg-[#E6F9F2] w-[90px] min-w-[90px]"><div className="flex items-center justify-center gap-1"><Settings className="w-3.5 h-3.5" /><span>Actions</span></div></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((r, i) => {
                      const bg = i % 2 === 0 ? 'bg-white' : 'bg-[#FAFBFD]';
                      return (
                        <tr key={r.key} className={`border-b border-[#E2E8F0] transition-colors ${bg}`}>
                          <td className="p-3">
                            <input type="checkbox" aria-label={`Select ${fullName(r)}`} checked={selected.includes(r.key)} onChange={() => toggleSelect(r.key)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                          </td>
                          <td className="p-3 max-w-[220px]">
                            <button onClick={() => setViewing(r)} className="text-left inline-flex items-center">
                              <TruncatedText text={fullName(r)} maxLength={24} className="text-[14px] leading-[20px] font-semibold text-[#0F172A] hover:text-[#00A86B]" />
                            </button>
                            {r.email && <TruncatedText text={r.email} maxLength={28} className="text-[12px] leading-[18px] text-[#94A3B8]" />}
                          </td>
                          <td className="p-3 text-[12px] text-[#475569] whitespace-nowrap">{phoneCell(r)}</td>
                          <td className="p-3 max-w-[300px] text-[12px] text-[#475569]">
                            <div className="truncate">{[r.address1, r.address2].filter(Boolean).join(', ') || '—'}</div>
                            <div className="text-[#94A3B8] truncate">{[r.city, r.state].filter(Boolean).join(', ')}{r.pinCode && ` – ${r.pinCode}`}</div>
                          </td>
                          <td className="p-3"><ChannelTag channel={r.channel} /></td>
                          <td className="p-3 text-[12px] text-[#475569] whitespace-nowrap text-center">
                            <div className="inline-flex items-center justify-center gap-1.5 font-semibold text-[#0F172A] tabular-nums">{r.orders.length}{r.orders.length > 1 && <RepeatMark onOpen={rect => setRepeatPopover(p => (p?.key === r.key ? null : { rect, key: r.key }))} />}</div>
                            <div className="text-[#94A3B8] tabular-nums">{r.orders.length ? inr(r.spend) : 'No orders yet'}</div>
                          </td>
                          <td className={`p-3 sticky right-0 w-[90px] min-w-[90px] ${bg}`}>
                            <div className="flex items-center justify-center">
                              <button
                                onClick={e => {
                                  if (menu?.key === r.key) { setMenu(null); return; }
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setMenu({ key: r.key, top: rect.bottom + 4, left: rect.right - 176 });
                                }}
                                aria-label="Customer actions"
                                className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors ${menu?.key === r.key ? 'bg-green-100 border-[#00A86B] text-[#00A86B]' : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'}`}
                              >
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <DesktopPagination page={page} setPage={setPage} totalPages={totalPages} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage}
                startIndex={startIndex} endIndex={endIndex} totalItems={totalItems} />
            </div>

            {/* Mobile cards */}
            <div className="md:hidden flex flex-col flex-1 min-h-0 bg-[#F8FAFC]">
              <div className="flex-1 overflow-y-auto">
                <div className="p-2 space-y-2">
                  {paginatedData.map(r => (
                    <div key={r.key} className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
                      <StatusRibbon label={r.orders.length > 1 ? 'Repeat' : r.saved && !r.orders.length ? 'Saved' : 'Customer'} color={r.orders.length > 1 ? '#00A86B' : '#94A3B8'} />
                      <div className="pt-7 px-3 pb-3">
                        <button onClick={() => setViewing(r)} className="w-full flex items-start justify-between gap-2 text-left">
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-[#0F172A] truncate">{fullName(r)}</div>
                            {r.email && <div className="text-[12px] text-[#94A3B8] truncate">{r.email}</div>}
                          </div>
                          <ChannelTag channel={r.channel} />
                        </button>
                        <div className="mt-2 bg-[#F8FAFC] rounded-xl px-2.5 py-2 space-y-1 text-[12px] text-[#0F172A]">
                          <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />{phoneCell(r)}</div>
                          <div className="flex items-start gap-1.5 min-w-0">
                            <MapPin className="w-3.5 h-3.5 text-[#94A3B8] mt-0.5 shrink-0" />
                            <span className="line-clamp-2">{[r.address1, r.address2, r.city, r.state].filter(Boolean).join(', ')}{r.pinCode && ` – ${r.pinCode}`}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1 text-[11.5px] text-[#64748B]">
                            <span className="inline-flex items-center gap-1.5">{r.orders.length} order{r.orders.length === 1 ? '' : 's'}{r.orders.length > 0 && ` · ${inr(r.spend)}`}{r.orders.length > 1 && <RepeatMark onOpen={rect => setRepeatPopover(p => (p?.key === r.key ? null : { rect, key: r.key }))} />}</span>
                            <span>Last: {fmtDate(r.lastOrderAt)}</span>
                          </div>
                        </div>
                        <div className="mt-2.5 flex items-center gap-2">
                          <button onClick={() => setViewing(r)} className="flex-1 h-8 rounded-full border border-[#E2E8F0] text-[12px] font-semibold text-[#475569]">View details</button>
                          <button onClick={() => addOrderFor(r)} className="flex-1 h-8 rounded-full bg-[#00A86B] text-white text-[12px] font-semibold inline-flex items-center justify-center gap-1"><Plus className="w-3.5 h-3.5" />Add order</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <MobilePaginationBar {...({ page, setPage, totalPages, rowsPerPage, setRowsPerPage, startIndex, endIndex, totalItems })} />
            </div>
          </>
        )}
      </div>

      {/* Details drawer */}
      {createPortal(
        <AnimatePresence>
          {viewing && (
            <>
              <motion.div key="bd" className="fixed inset-0 z-[900] bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewing(null)} />
              <motion.aside key="dr" role="dialog" aria-modal="true" aria-label="Customer details"
                className="fixed z-[901] bg-white flex flex-col shadow-2xl inset-x-0 bottom-0 max-h-[88vh] rounded-t-2xl md:inset-y-0 md:left-auto md:right-0 md:w-[440px] md:max-h-none md:rounded-none"
                initial={{ x: 0, y: '100%' }} animate={{ x: 0, y: 0 }} exit={{ y: '100%' }} transition={{ type: 'tween', duration: 0.25 }}>
                <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center gap-3 shrink-0">
                  <span className="w-11 h-11 rounded-full bg-gradient-to-br from-[#00A86B] to-[#00875A] text-white text-[14px] font-bold flex items-center justify-center shrink-0">{initials(fullName(viewing))}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-bold text-[#0F172A] truncate">{fullName(viewing)}</div>
                    <div className="text-[12px] text-[#64748B]">Customer since {fmtDate(viewing.createdAt)}</div>
                  </div>
                  <button onClick={() => setViewing(null)} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9]"><X className="w-4 h-4" /></button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {[['Orders', String(viewing.orders.length)], ['Total spend', inr(viewing.spend)], ['Avg. order', viewing.orders.length ? inr(viewing.spend / viewing.orders.length) : '—']].map(([l, v]) => (
                      <div key={l} className="rounded-xl border border-[#E2E8F0] px-3 py-2">
                        <div className="text-[11px] text-[#64748B]">{l}</div>
                        <div className="text-[14px] font-bold text-[#0F172A] tabular-nums">{v}</div>
                      </div>
                    ))}
                  </div>
                  <section className="rounded-xl border border-[#E2E8F0] divide-y divide-[#F1F5F9] text-[12.5px]">
                    <div className="px-3.5 py-2.5 flex items-center gap-2.5"><Phone className="w-4 h-4 text-[#94A3B8]" /><span className="text-[#0F172A] tabular-nums">+91 {viewing.phone}</span></div>
                    <div className="px-3.5 py-2.5 flex items-center gap-2.5"><Mail className="w-4 h-4 text-[#94A3B8]" /><span className="text-[#0F172A] break-all">{viewing.email || '—'}</span></div>
                    <div className="px-3.5 py-2.5 flex items-start gap-2.5"><MapPin className="w-4 h-4 text-[#94A3B8] mt-0.5" />
                      <span className="text-[#0F172A]">{[viewing.address1, viewing.address2].filter(Boolean).join(', ') || '—'}<br /><span className="text-[#64748B]">{[viewing.city, viewing.state].filter(Boolean).join(', ')}{viewing.pinCode && ` – ${viewing.pinCode}`}</span></span>
                    </div>
                  </section>
                  {viewing.saved?.notes && <p className="text-[12.5px] text-[#475569] bg-[#F8FAFC] rounded-xl px-3.5 py-2.5">{viewing.saved.notes}</p>}
                  <section>
                    <h3 className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider mb-2">Recent orders</h3>
                    {viewing.orders.length === 0 ? (
                      <p className="text-[12.5px] text-[#94A3B8]">No orders for this customer yet.</p>
                    ) : (
                      <ul className="rounded-xl border border-[#E2E8F0] divide-y divide-[#F1F5F9]">
                        {[...viewing.orders].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 8).map(o => (
                          <li key={o.id} className="px-3.5 py-2.5 flex items-center justify-between gap-2 text-[12.5px]">
                            <div className="min-w-0">
                              <div className="font-semibold text-[#0F172A] truncate">#{o.orderId}</div>
                              <div className="text-[11.5px] text-[#94A3B8]">{fmtDate(o.date)} · {o.method}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-semibold text-[#0F172A] tabular-nums">{inr(o.amount)}</div>
                              <div className="text-[11px] text-[#64748B]">{o.status}</div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                    {viewing.orders.length > 0 && (
                      <button onClick={() => navigate('/user/orders')} className="mt-2 text-[12px] font-semibold text-[#00A86B] inline-flex items-center gap-0.5">All orders <ChevronRight className="w-3.5 h-3.5" /></button>
                    )}
                  </section>
                </div>
                <div className="px-5 py-3 border-t border-[#F1F5F9] flex items-center gap-2 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  {viewing.saved ? (
                    <>
                      <button onClick={() => setConfirmDelete(viewing)} aria-label="Delete customer" className="w-9 h-9 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#94A3B8] hover:text-red-500 hover:border-red-300"><Trash2 className="w-4 h-4" /></button>
                      <button onClick={() => navigate(`/user/customers/${viewing.saved!.id}/edit`)} className="h-9 px-4 rounded-full border border-[#E2E8F0] text-[12.5px] font-semibold text-[#475569] inline-flex items-center gap-1.5 hover:border-[#00A86B] hover:text-[#00A86B]"><Pencil className="w-3.5 h-3.5" />Edit</button>
                    </>
                  ) : (
                    <button onClick={() => navigate('/user/customers/new', { state: { from: viewing } })} className="h-9 px-4 rounded-full border border-[#E2E8F0] text-[12.5px] font-semibold text-[#475569] inline-flex items-center gap-1.5 hover:border-[#00A86B] hover:text-[#00A86B]"><UserPlus className="w-3.5 h-3.5" />Save customer</button>
                  )}
                  <button onClick={() => addOrderFor(viewing)} className="ml-auto h-9 px-4 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />Add order</button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}

      {/* Repeat customer "Customer Profile" popover — same as the Orders page (New tab) */}
      {repeatPopover && (() => {
        const r = rows.find(x => x.key === repeatPopover.key);
        if (!r) return null;
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const recent = r.orders.filter(o => o.date && new Date(o.date) >= sixMonthsAgo);
        const repeat = {
          totalOrders: recent.length,
          delivered: recent.filter(o => o.status === 'Delivered').length,
          cancelled: recent.filter(o => o.status === 'Cancelled').length,
          rto: recent.filter(o => o.status.startsWith('RTO')).length,
        };
        const last = recent.reduce<string | null>((m, o) => (!m || (o.date && o.date > m) ? o.date : m), null);
        const lastOrderDate = last ? new Date(last).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
        const rect = repeatPopover.rect;
        const showBelow = rect.top < 340;
        const POPOVER_WIDTH = 272;
        return createPortal(
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setRepeatPopover(null)} />
            <div className="fixed z-[9999] bg-white rounded-2xl shadow-[0_16px_40px_-8px_rgba(15,23,42,0.2)] border border-[#E2E8F0]"
              style={{
                width: POPOVER_WIDTH,
                top: showBelow ? rect.bottom + 8 : undefined,
                bottom: showBelow ? undefined : window.innerHeight - rect.top + 8,
                left: Math.min(Math.max(rect.left, 12), window.innerWidth - POPOVER_WIDTH - 12),
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4">
                <h4 className="text-[14px] font-bold text-[#0F172A] mb-3">Customer Profile</h4>

                <div className="flex items-center justify-between px-3 py-2.5 bg-[#F8FAFC] rounded-xl mb-3">
                  <span className="text-[12px] font-medium text-[#64748B]">Last Order Date:</span>
                  <span className="text-[12px] font-bold text-[#0F172A]">{lastOrderDate}</span>
                </div>

                <div className="px-3 py-2.5 bg-[#F8FAFC] rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-[#0F172A]">Total Orders:</span>
                    <span className="text-[12px] font-bold text-[#0F172A]">{repeat.totalOrders}</span>
                  </div>
                  <div className="h-px bg-[#E2E8F0]" />
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-[#64748B]">Delivered:</span>
                    <span className="text-[12px] font-bold text-[#0F172A]">{repeat.delivered}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-[#64748B]">Cancelled:</span>
                    <span className="text-[12px] font-bold text-[#0F172A]">{repeat.cancelled}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-[#64748B]">RTO:</span>
                    <span className="text-[12px] font-bold text-[#0F172A]">{repeat.rto}</span>
                  </div>
                </div>

                <p className="text-[10px] text-[#94A3B8] mt-3">This data is for last 6 months only</p>

                <div className="flex justify-end mt-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-semibold tracking-wide">
                    <UserCheck className="w-3 h-3" /> REPEAT CUSTOMER
                  </span>
                </div>
              </div>
            </div>
          </>,
          document.body,
        );
      })()}

      {/* Row actions menu */}
      {menu && createPortal(
        <>
          <div className="fixed inset-0 z-[998]" onClick={() => setMenu(null)} />
          <div className="fixed z-[999] w-44 bg-white rounded-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.15)] border border-[#E2E8F0] py-2"
            style={{ top: menu.top, left: Math.max(4, Math.min(menu.left, window.innerWidth - 180)) }}>
            {(() => {
              const r = rows.find(x => x.key === menu.key);
              if (!r) return null;
              return (
                <>
                  <button onClick={() => { setMenu(null); setViewing(r); }} className="w-full flex items-center gap-2 px-4 py-2 text-[13px] text-[#334155] hover:bg-[#F0FDF4] hover:text-[#00A86B]">
                    <Eye className="w-3.5 h-3.5" /> View details
                  </button>
                  <button onClick={() => { setMenu(null); addOrderFor(r); }} className="w-full flex items-center gap-2 px-4 py-2 text-[13px] text-[#334155] hover:bg-[#F0FDF4] hover:text-[#00A86B]">
                    <Plus className="w-3.5 h-3.5" /> Add order
                  </button>
                </>
              );
            })()}
          </div>
        </>,
        document.body,
      )}

      {/* Delete confirm */}
      {confirmDelete && createPortal(
        <div className="fixed inset-0 z-[950] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
            <h3 className="text-[15px] font-bold text-[#0F172A]">Delete customer?</h3>
            <p className="mt-1 text-[13px] text-[#64748B]">{fullName(confirmDelete)} will be removed from your saved customers. Their past orders are not affected.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="h-9 px-4 rounded-full border border-[#E2E8F0] text-[12.5px] font-semibold text-[#475569]">Cancel</button>
              <button onClick={removeSaved} className="h-9 px-4 rounded-full bg-red-500 hover:bg-red-600 text-white text-[12.5px] font-semibold">Delete</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </AdminLayout>
  );
}
