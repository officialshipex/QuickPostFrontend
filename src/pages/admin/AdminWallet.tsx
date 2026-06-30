import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../services/apiClient';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Search, ChevronDown, RefreshCcw, Calendar, Check, Package, User, Truck, Banknote, Clock, Upload, Download, MoreVertical, Wallet, FileText, Plus, TrendingUp, Eye, AlertCircle, CheckCircle2, X, CreditCard, Filter, Layers, Hash, CalendarDays, Bot, ArrowLeft } from 'lucide-react';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { GlassDateFilter } from '../../components/ui/GlassDateFilter';

const MAIN_TABS = [
  { name: 'Shipping' },
  { name: 'Passbook' },
  { name: 'Wallet Recharge' },
  { name: 'Invoices' }
];

// Pagination sliding window: up to 5 pages centered on current
const pageWindow = (curr: number, total: number): number[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  let start = Math.max(2, curr - 2);
  let end = Math.min(total - 1, curr + 2);
  if (curr - 2 <= 2) end = Math.min(5, total - 1);
  if (curr + 2 >= total - 1) start = Math.max(total - 4, 2);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
};

const toISOStart = (d: string) => d ? new Date(d + 'T00:00:00+05:30').toISOString() : '';
const toISOEnd = (d: string) => d ? new Date(d + 'T23:59:59+05:30').toISOString() : '';

// Data mapping helpers
const mapShippingItem = (item: any) => {
  const vl = item.packageDetails?.volumetricWeight?.length || 0;
  const vw = item.packageDetails?.volumetricWeight?.width || 0;
  const vh = item.packageDetails?.volumetricWeight?.height || 0;
  const wd = item.weightDiscrepancy;
  return {
    id: String(item.orderId || item._id || ''),
    userId: item.user?.userId || '',
    awb: item.awb_number || '',
    userName: item.user?.name || '',
    userEmail: item.user?.email || '',
    mobile: item.user?.phoneNumber || '',
    date: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
    paymentMethod: item.paymentMethod || 'N/A',
    courier: item.courierServiceName || '',
    bookedDate: item.shipmentCreatedAt ? new Date(item.shipmentCreatedAt).toLocaleDateString('en-IN') : '',
    statusAmount: (item.totalFreightCharges || 0).toFixed(2),
    status: item.status || 'new',
    initialWeight: `${Number(item.packageDetails?.deadWeight || 0).toFixed(3)} Kg`,
    initialDimensions: `L*W*H: ${vl}*${vw}*${vh} cm`,
    initialVol: `Vol. Wt: ${(vl * vw * vh / 5000).toFixed(3)} Kg`,
    courierWeight: wd ? `${Number(wd.chargedWeight?.applicableWeight || 0).toFixed(3)} Kg` : `${Number(item.packageDetails?.deadWeight || 0).toFixed(3)} Kg`,
    courierDimensions: wd?.chargeDimension ? `L*W*H: ${wd.chargeDimension.length || 0}*${wd.chargeDimension.breadth || 0}*${wd.chargeDimension.height || 0} cm` : `L*W*H: ${vl}*${vw}*${vh} cm`,
    courierVol: wd?.chargeDimension ? `Vol. Wt: ${((wd.chargeDimension.length || 0) * (wd.chargeDimension.breadth || 0) * (wd.chargeDimension.height || 0) / 5000).toFixed(3)} Kg` : `Vol. Wt: ${(vl * vw * vh / 5000).toFixed(3)} Kg`,
  };
};

const mapPassbookItem = (item: any) => ({
  id: item.orderId || String(item._id || ''),
  userId: item.user?.userId || '',
  awb: item.awb_number || '',
  userName: item.user?.name || '',
  userEmail: item.user?.email || '',
  mobile: item.user?.phoneNumber || '',
  date: item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
  time: item.date ? new Date(item.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '',
  paymentMethod: item.paymentMethod || '',
  courier: item.courierServiceName || '',
  bookedDate: item.date ? new Date(item.date).toLocaleDateString('en-IN') : '',
  category: item.category === 'debit' ? 'Debit' : 'Credit',
  amount: item.amount || 0,
  balance: item.balanceAfterTransaction || 0,
  description: item.description || '',
  _raw: item,
});

const mapRechargeItem = (item: any) => ({
  id: item._id || '',
  userId: item.user?.userId || '',
  userName: item.user?.name || '',
  userEmail: item.user?.email || '',
  mobile: item.user?.phoneNumber || '',
  date: item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
  time: item.date ? new Date(item.date).toLocaleTimeString('en-IN') : '',
  transactionId: item.transactionId || '',
  amount: item.amount || 0,
  status: (item.status || '').toLowerCase() === 'success' ? 'Success' : 'Failed',
  paymentId: item.paymentId || '',
  orderId: item.orderId || '',
});

const mapInvoiceItem = (item: any) => ({
  id: item._id || '',
  userId: item.userDetails?.userId || '',
  userName: item.userDetails?.fullname || '',
  userEmail: item.userDetails?.email || '',
  mobile: item.userDetails?.phoneNumber || '',
  invoiceNumber: item.invoiceNumber || '',
  shipments: item.totalShipments || 0,
  amount: item.amount || 0,
  createdOn: item.invoiceDate ? new Date(item.invoiceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
  invoicePeriod: [item.periodStart, item.periodEnd].filter(Boolean).join(' - '),
  status: (item.status || '').toUpperCase() === 'PAID' ? 'PAID' : 'UNPAID',
});

const STATUS_BADGE_STYLES: Record<string, string> = {
  'Paid': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'PAID': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Success': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Credit': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'RTO Delivered': 'bg-purple-50 text-purple-700 border-purple-200',
  'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
  'PENDING': 'bg-amber-50 text-amber-700 border-amber-200',
  'In-transit': 'bg-amber-50 text-amber-700 border-amber-200',
  'Out for Delivery': 'bg-amber-50 text-amber-700 border-amber-200',
  'Ready To Ship': 'bg-blue-50 text-blue-700 border-blue-200',
  'new': 'bg-blue-50 text-blue-700 border-blue-200',
  'Debit': 'bg-rose-50 text-rose-700 border-rose-200',
  'Failed': 'bg-rose-50 text-rose-700 border-rose-200',
  'Cancelled': 'bg-rose-50 text-rose-700 border-rose-200',
  'UNPAID': 'bg-rose-50 text-rose-700 border-rose-200',
  'RTO': 'bg-orange-50 text-orange-700 border-orange-200',
  'RTO In-transit': 'bg-orange-50 text-orange-700 border-orange-200',
  'RTO Lost': 'bg-red-50 text-red-700 border-red-200',
  'Lost': 'bg-red-50 text-red-700 border-red-200',
  'Damaged': 'bg-red-50 text-red-700 border-red-200',
};

const getStatusBadgeClass = (status: string) => {
  const normalized = status || '';
  return `${STATUS_BADGE_STYLES[normalized] || 'bg-blue-50 text-blue-700 border-blue-200'} px-2.5 py-0.5 rounded-full border text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap shadow-sm`;
};


export function AdminWallet() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [globalSearchQuery, setGlobalSearchQuery] = useState((window as any).__adminSearchQuery?.toLowerCase() || '');

  useEffect(() => {
    const handleSearch = (e: Event) => {
      setGlobalSearchQuery(((e as CustomEvent).detail || '').toLowerCase());
    };
    window.addEventListener('admin-search', handleSearch);
    setGlobalSearchQuery(((window as any).__adminSearchQuery || '').toLowerCase());
    return () => {
      window.removeEventListener('admin-search', handleSearch);
    };
  }, []);

  const [activeTab, setActiveTab] = useState('Shipping');
  const [toast, setToast] = useState<{type: 'error' | 'success', text: string} | null>(null);

  const showToast = (type: 'error' | 'success', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  // Wallet Balance State
  const [walletBalance, setWalletBalance] = useState(0);

  // Server totals for pagination
  const [shippingTotal, setShippingTotal] = useState(0);
  const [passbookTotal, setPassbookTotal] = useState(0);
  const [rechargeTotal, setRechargeTotal] = useState(0);
  const [invoiceTotal, setInvoiceTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Stateful Data Lists
  const [shippingList, setShippingList] = useState<any[]>([]);
  const [passbookList, setPassbookList] = useState<any[]>([]);
  const [rechargeList, setRechargeList] = useState<any[]>([]);
  const [invoiceList, setInvoiceList] = useState<any[]>([]);

  const [courierOptions, setCourierOptions] = useState<{ label: string; value: string }[]>([]);

  // Pagination page states — declared early so fetch functions can reference setters
  const itemsPerPage = 10;
  const [shippingPage, setShippingPage] = useState(1);
  const [passbookPage, setPassbookPage] = useState(1);
  const [rechargePage, setRechargePage] = useState(1);
  const [invoicePage, setInvoicePage] = useState(1);

  // Top header pickup mobile filter
  const [headerMobileSearch, setHeaderMobileSearch] = useState('');
  
  // Shipping Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSearchTypes, setSelectedSearchTypes] = useState<string[]>([]);
  const [searchTypeId, setSearchTypeId] = useState('');
  const [selectedCouriers, setSelectedCouriers] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [shippingDateStart, setShippingDateStart] = useState('');
  const [shippingDateEnd, setShippingDateEnd] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  
  // Passbook Filters State
  const [passbookSearchTerm, setPassbookSearchTerm] = useState('');
  const [passbookOrderId, setPassbookOrderId] = useState('');
  const [passbookAwb, setPassbookAwb] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDescriptions, setSelectedDescriptions] = useState<string[]>([]);
  const [passbookDateStart, setPassbookDateStart] = useState('');
  const [passbookDateEnd, setPassbookDateEnd] = useState('');
  const [selectedPassbookOrders, setSelectedPassbookOrders] = useState<string[]>([]);

  // Wallet Recharge Filters State
  const [rechargeSearchTerm, setRechargeSearchTerm] = useState('');
  const [rechargeTxnId, setRechargeTxnId] = useState('');
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
  const [selectedRechargeStatuses, setSelectedRechargeStatuses] = useState<string[]>([]);
  const [rechargeDateStart, setRechargeDateStart] = useState('');
  const [rechargeDateEnd, setRechargeDateEnd] = useState('');
  const [selectedRechargeOrders, setSelectedRechargeOrders] = useState<string[]>([]);

  // Invoices Filters State
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [invoiceDateStart, setInvoiceDateStart] = useState('');
  const [invoiceDateEnd, setInvoiceDateEnd] = useState('');
  const [selectedInvoiceOrders, setSelectedInvoiceOrders] = useState<string[]>([]);

  // Per-tab user search autocomplete (admin only)
  const [shipUserQuery, setShipUserQuery] = useState('');
  const [shipUserSuggestions, setShipUserSuggestions] = useState<any[]>([]);
  const [shipUserMongoId, setShipUserMongoId] = useState('');
  const [pbUserQuery, setPbUserQuery] = useState('');
  const [pbUserSuggestions, setPbUserSuggestions] = useState<any[]>([]);
  const [pbUserMongoId, setPbUserMongoId] = useState('');
  const [rcUserQuery, setRcUserQuery] = useState('');
  const [rcUserSuggestions, setRcUserSuggestions] = useState<any[]>([]);
  const [rcUserMongoId, setRcUserMongoId] = useState('');
  const [invUserQuery, setInvUserQuery] = useState('');
  const [invUserSuggestions, setInvUserSuggestions] = useState<any[]>([]);
  const [invUserMongoId, setInvUserMongoId] = useState('');

  // Glass Dropdown Options
  const SEARCH_TYPE_OPTIONS = [
    { label: 'AWB', value: 'AWB' },
    { label: 'Order ID', value: 'Order ID' },
  ];
  const SHIPPING_STATUS_OPTIONS = [
    { label: 'Ready To Ship', value: 'Ready To Ship' },
    { label: 'In-transit', value: 'In-transit' },
    { label: 'Out for Delivery', value: 'Out for Delivery' },
    { label: 'Delivered', value: 'Delivered' },
    { label: 'Cancelled', value: 'Cancelled' },
    { label: 'RTO', value: 'RTO' },
    { label: 'RTO In-transit', value: 'RTO In-transit' },
    { label: 'RTO Delivered', value: 'RTO Delivered' },
    { label: 'RTO Lost', value: 'RTO Lost' },
    { label: 'RTO Damaged', value: 'RTO Damaged' },
    { label: 'Lost', value: 'Lost' },
    { label: 'Damaged', value: 'Damaged' },
    { label: 'Undelivered', value: 'Undelivered' },
  ];
  const CATEGORY_OPTIONS = [
    { label: 'Debit', value: 'Debit' },
    { label: 'Credit', value: 'Credit' },
  ];
  const DESCRIPTION_OPTIONS = [
    { label: 'Freight Charges Applied', value: 'Freight Charges Applied' },
    { label: 'Freight Charges Received', value: 'Freight Charges Received' },
    { label: 'Auto-accepted Weight Dispute charge', value: 'Auto-accepted Weight Dispute charge' },
    { label: 'Weight Dispute Charges Applied', value: 'Weight Dispute Charges Applied' },
    { label: 'COD Charges Received', value: 'COD Charges Received' },
    { label: 'RTO Freight Charges Applied', value: 'RTO Freight Charges Applied' },
  ];
  const PAYMENT_METHOD_OPTIONS = [
    { label: 'UPI', value: 'UPI' },
    { label: 'Card', value: 'Card' },
    { label: 'Net Banking', value: 'Net Banking' },
  ];
  const RECHARGE_STATUS_OPTIONS = [
    { label: 'Success', value: 'Success' },
    { label: 'Failed', value: 'Failed' },
    { label: 'Pending', value: 'Pending' },
  ];
  const MONTH_OPTIONS = [
    { label: 'January', value: 'January' },
    { label: 'February', value: 'February' },
    { label: 'March', value: 'March' },
    { label: 'April', value: 'April' },
    { label: 'May', value: 'May' },
    { label: 'June', value: 'June' },
    { label: 'July', value: 'July' },
    { label: 'August', value: 'August' },
    { label: 'September', value: 'September' },
    { label: 'October', value: 'October' },
    { label: 'November', value: 'November' },
    { label: 'December', value: 'December' },
  ];
  const YEAR_OPTIONS = [
    { label: '2026', value: '2026' },
    { label: '2025', value: '2025' },
    { label: '2024', value: '2024' },
  ];

  // Dropdown Toggles
  const [showShippingActionMenu, setShowShippingActionMenu] = useState(false);
  const [showPassbookActionMenu, setShowPassbookActionMenu] = useState(false);
  const [showRechargeActionMenu, setShowRechargeActionMenu] = useState(false);
  const [showInvoiceActionMenu, setShowInvoiceActionMenu] = useState(false);

  // Modals States
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [isRecharging, setIsRecharging] = useState(false);
  const [rechargeMode, setRechargeMode] = useState<'Payment' | 'COD'>('Payment');
  const [availableCodBalance, setAvailableCodBalance] = useState(0);

  const [activeShipmentHistory, setActiveShipmentHistory] = useState<any | null>(null);
  const [activeInvoicePreview, setActiveInvoicePreview] = useState<any | null>(null);

  // Manual Balance / Update Passbook Modal States
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Update Passbook 3-tab modal state
  const [upbTab, setUpbTab] = useState<'Recharge' | 'Updation' | 'Direct Update'>('Recharge');
  const [upbUserQuery, setUpbUserQuery] = useState('');
  const [upbUserSuggestions, setUpbUserSuggestions] = useState<any[]>([]);
  const [upbSelectedUserId, setUpbSelectedUserId] = useState('');
  const [upbSelectedMongoId, setUpbSelectedMongoId] = useState('');
  const [upbIsSubmitting, setUpbIsSubmitting] = useState(false);
  // Recharge tab
  const [upbPaymentId, setUpbPaymentId] = useState('');
  const [upbRechOrderId, setUpbRechOrderId] = useState('');
  const [upbRechAmount, setUpbRechAmount] = useState('');
  // Updation tab
  const [upbUpdDesc, setUpbUpdDesc] = useState('');
  const [upbUpdAwb, setUpbUpdAwb] = useState('');
  const [upbUpdAwbSuggestions, setUpbUpdAwbSuggestions] = useState<any[]>([]);
  const [upbUpdOrderId, setUpbUpdOrderId] = useState('');
  const [upbUpdAmount, setUpbUpdAmount] = useState('');
  const [upbUpdCategory, setUpbUpdCategory] = useState('');
  // Direct Update tab
  const [upbDirDesc, setUpbDirDesc] = useState('');
  const [upbDirAmount, setUpbDirAmount] = useState('');
  const [upbDirCategory, setUpbDirCategory] = useState('');

  const closeUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setUpbTab('Recharge');
    setUpbUserQuery('');
    setUpbUserSuggestions([]);
    setUpbSelectedUserId('');
    setUpbSelectedMongoId('');
    setUpbPaymentId('');
    setUpbRechOrderId('');
    setUpbRechAmount('');
    setUpbUpdDesc('');
    setUpbUpdAwb('');
    setUpbUpdAwbSuggestions([]);
    setUpbUpdOrderId('');
    setUpbUpdAmount('');
    setUpbUpdCategory('');
    setUpbDirDesc('');
    setUpbDirAmount('');
    setUpbDirCategory('');
  };

  const handleReverseTransaction = async (order: any) => {
    if (!window.confirm(`Reverse this debit of ₹${order.amount.toFixed(2)} (${order.description})?`)) return;
    try {
      await apiClient.post('/adminBilling/reverseTransaction', { transaction: order._raw });
      showToast('success', 'Transaction reversed successfully!');
      fetchPassbookData(passbookPage);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to reverse transaction.');
    }
  };

  const handleUpbRechargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upbSelectedUserId) { showToast('error', 'Please select a user first.'); return; }
    setUpbIsSubmitting(true);
    try {
      await apiClient.post('/adminBilling/add-history', {
        userId: upbSelectedUserId,
        status: 'success',
        paymentId: upbPaymentId,
        orderId: upbRechOrderId,
        amount: parseFloat(upbRechAmount),
      });
      showToast('success', 'Recharge recorded successfully!');
      closeUpdateModal();
      fetchPassbookData(1);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to record recharge.');
    } finally {
      setUpbIsSubmitting(false);
    }
  };

  const handleUpbUpdationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upbSelectedUserId) { showToast('error', 'Please select a user first.'); return; }
    setUpbIsSubmitting(true);
    try {
      await apiClient.post('/adminBilling/walletUpdation', {
        userId: upbSelectedUserId,
        description: upbUpdDesc,
        awbNumber: upbUpdAwb,
        orderId: upbUpdOrderId,
        amount: parseFloat(upbUpdAmount),
        category: upbUpdCategory,
      });
      showToast('success', 'Wallet transaction updated!');
      closeUpdateModal();
      fetchPassbookData(1);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to update wallet.');
    } finally {
      setUpbIsSubmitting(false);
    }
  };

  const handleUpbDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upbSelectedMongoId) { showToast('error', 'Please select a user first.'); return; }
    setUpbIsSubmitting(true);
    try {
      await apiClient.post('/adminBilling/add-passbook', {
        userId: upbSelectedMongoId,
        amount: parseFloat(upbDirAmount),
        transactionType: upbDirCategory,
        description: upbDirDesc,
      });
      showToast('success', 'Passbook entry added!');
      closeUpdateModal();
      fetchPassbookData(1);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to add entry.');
    } finally {
      setUpbIsSubmitting(false);
    }
  };

  // ── API Fetch Functions ────────────────────────────────────────────────
  const fetchWalletBalance = useCallback(async () => {
    try {
      const res = await apiClient.get('/recharge/getWalletBalanceAndHoldAmount');
      if (res.data.success) setWalletBalance(res.data.balance || 0);
    } catch (_) {}
  }, []);

  const fetchShippingData = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit: itemsPerPage };
      if (isAdmin && shipUserMongoId) params.userSearch = shipUserMongoId;
      if (shippingDateStart) params.fromDate = toISOStart(shippingDateStart);
      if (shippingDateEnd) params.toDate = toISOEnd(shippingDateEnd);
      if (selectedStatuses.length === 1) params.status = selectedStatuses[0];
      if (selectedCouriers.length > 0) params.courierServiceName = selectedCouriers.join(',');
      if (searchTypeId) {
        if (selectedSearchTypes.includes('AWB')) params.awbNumber = searchTypeId;
        else params.orderId = searchTypeId;
      }
      const res = await apiClient.get('/adminBilling/allShipping', { params });
      setShippingList((res.data.results || []).map(mapShippingItem));
      setShippingTotal(res.data.total || 0);
      if (res.data.courierServices?.length) {
        setCourierOptions((res.data.courierServices as string[]).map(c => ({ label: c, value: c })));
      }
    } catch (_) {
      showToast('error', 'Failed to load shipping data.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, shippingDateStart, shippingDateEnd, selectedStatuses, selectedCouriers, searchTypeId, selectedSearchTypes]);

  const fetchPassbookData = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit: itemsPerPage };
      if (isAdmin && pbUserMongoId) params.userSearch = pbUserMongoId;
      if (passbookDateStart) params.fromDate = toISOStart(passbookDateStart);
      if (passbookDateEnd) params.toDate = toISOEnd(passbookDateEnd);
      if (selectedCategories.length === 1) params.category = selectedCategories[0].toLowerCase();
      if (passbookOrderId) params.orderId = passbookOrderId;
      if (passbookAwb) params.awbNumber = passbookAwb;
      const res = await apiClient.get('/adminBilling/allPassbook', { params });
      setPassbookList((res.data.results || []).map(mapPassbookItem));
      setPassbookTotal(res.data.total || 0);
    } catch (_) {
      showToast('error', 'Failed to load passbook data.');
    } finally {
      setIsLoading(false);
    }
  }, [passbookSearchTerm, passbookDateStart, passbookDateEnd, selectedCategories, passbookOrderId, passbookAwb]);

  const fetchRechargeData = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit: itemsPerPage };
      if (isAdmin && rcUserMongoId) params.userSearch = rcUserMongoId;
      if (rechargeDateStart) params.fromDate = toISOStart(rechargeDateStart);
      if (rechargeDateEnd) params.toDate = toISOEnd(rechargeDateEnd);
      if (rechargeTxnId) params.transactionId = rechargeTxnId;
      if (selectedRechargeStatuses.length === 1) params.status = selectedRechargeStatuses[0].toLowerCase();
      const res = await apiClient.get('/adminBilling/allTransactionHistory', { params });
      setRechargeList((res.data.results || []).map(mapRechargeItem));
      setRechargeTotal(res.data.total || 0);
    } catch (_) {
      showToast('error', 'Failed to load recharge data.');
    } finally {
      setIsLoading(false);
    }
  }, [rechargeSearchTerm, rechargeDateStart, rechargeDateEnd, rechargeTxnId, selectedRechargeStatuses]);

  const fetchInvoiceData = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit: itemsPerPage };
      if (isAdmin && invUserMongoId) params.userSearch = invUserMongoId;
      if (invoiceDateStart) params.fromDate = toISOStart(invoiceDateStart);
      if (invoiceDateEnd) params.toDate = toISOEnd(invoiceDateEnd);
      if (selectedMonths.length === 1) params.month = selectedMonths[0];
      if (selectedYears.length === 1) params.year = selectedYears[0];
      const res = await apiClient.get('/invoice/adminGetInvoices', { params });
      setInvoiceList((res.data.invoices || []).map(mapInvoiceItem));
      setInvoiceTotal(res.data.totalCount || 0);
    } catch (_) {
      showToast('error', 'Failed to load invoice data.');
    } finally {
      setIsLoading(false);
    }
  }, [invoiceSearchTerm, invoiceDateStart, invoiceDateEnd, selectedMonths, selectedYears]);

  const fetchCodBalance = useCallback(async () => {
    try {
      const res = await apiClient.get('/cod/getCodRemitance');
      setAvailableCodBalance(res.data.remittance || 0);
    } catch (_) {}
  }, []);

  // On mount: fetch balance
  useEffect(() => {
    fetchWalletBalance();
  }, [fetchWalletBalance]);

  // On tab change: fetch first page of that tab's data
  useEffect(() => {
    switch (activeTab) {
      case 'Shipping': fetchShippingData(1); setShippingPage(1); break;
      case 'Passbook': fetchPassbookData(1); setPassbookPage(1); break;
      case 'Wallet Recharge': fetchRechargeData(1); setRechargePage(1); break;
      case 'Invoices': fetchInvoiceData(1); setInvoicePage(1); break;
    }
  }, [activeTab]);

  // On page change (server-side): refetch current tab
  useEffect(() => { if (activeTab === 'Shipping') fetchShippingData(shippingPage); }, [shippingPage]);
  useEffect(() => { if (activeTab === 'Passbook') fetchPassbookData(passbookPage); }, [passbookPage]);
  useEffect(() => { if (activeTab === 'Wallet Recharge') fetchRechargeData(rechargePage); }, [rechargePage]);
  useEffect(() => { if (activeTab === 'Invoices') fetchInvoiceData(invoicePage); }, [invoicePage]);

  // Fetch COD balance when recharge modal opens
  useEffect(() => { if (isRechargeModalOpen) fetchCodBalance(); }, [isRechargeModalOpen, fetchCodBalance]);

  // Update Passbook modal - user search
  useEffect(() => {
    if (!isUpdateModalOpen || upbUserQuery.trim().length < 2) { setUpbUserSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await apiClient.get(`/admin/searchUser?query=${encodeURIComponent(upbUserQuery)}`);
        setUpbUserSuggestions(res.data.users || []);
      } catch (_) { setUpbUserSuggestions([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [upbUserQuery, isUpdateModalOpen]);

  // Update Passbook modal - AWB search (Updation tab)
  useEffect(() => {
    if (upbTab !== 'Updation' || upbUpdAwb.trim().length < 3) { setUpbUpdAwbSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await apiClient.get(`/adminBilling/searchAwb?query=${encodeURIComponent(upbUpdAwb)}`);
        setUpbUpdAwbSuggestions(res.data.awbs || []);
      } catch (_) { setUpbUpdAwbSuggestions([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [upbUpdAwb, upbTab]);

  // Filter bar user search (admin only) — one effect per tab
  const makeUserSearchEffect = (
    query: string,
    setSuggestions: (v: any[]) => void,
  ) => {
    if (!isAdmin || query.trim().length < 2) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await apiClient.get(`/admin/searchUser?query=${encodeURIComponent(query)}`);
        setSuggestions(res.data.users || []);
      } catch (_) { setSuggestions([]); }
    }, 300);
    return () => clearTimeout(timer);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => makeUserSearchEffect(shipUserQuery, setShipUserSuggestions), [shipUserQuery, isAdmin]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => makeUserSearchEffect(pbUserQuery, setPbUserSuggestions), [pbUserQuery, isAdmin]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => makeUserSearchEffect(rcUserQuery, setRcUserSuggestions), [rcUserQuery, isAdmin]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => makeUserSearchEffect(invUserQuery, setInvUserSuggestions), [invUserQuery, isAdmin]);

  // ── End API Fetch Functions ────────────────────────────────────────────

  // Memoized Filtered Lists
  const filteredShippingData = useMemo(() => {
    return shippingList.filter(order => {
      const matchHeader = headerMobileSearch ? order.mobile.includes(headerMobileSearch) : true;
      const matchGlobal = globalSearchQuery ?
        order.userName.toLowerCase().includes(globalSearchQuery) ||
        order.userEmail.toLowerCase().includes(globalSearchQuery) ||
        order.awb.toLowerCase().includes(globalSearchQuery) ||
        order.id.toLowerCase().includes(globalSearchQuery) : true;
      return matchHeader && matchGlobal;
    });
  }, [shippingList, headerMobileSearch, globalSearchQuery]);

  const filteredPassbookData = useMemo(() => {
    return passbookList.filter(order => {
      const matchHeader = headerMobileSearch ? order.mobile.includes(headerMobileSearch) : true;
      const matchGlobal = globalSearchQuery ?
        order.userName.toLowerCase().includes(globalSearchQuery) ||
        order.userEmail.toLowerCase().includes(globalSearchQuery) ||
        order.awb.toLowerCase().includes(globalSearchQuery) ||
        order.id.toLowerCase().includes(globalSearchQuery) : true;
      return matchHeader && matchGlobal;
    });
  }, [passbookList, headerMobileSearch, globalSearchQuery]);

  const filteredWalletRechargeData = useMemo(() => {
    return rechargeList.filter(recharge => {
      const matchHeader = headerMobileSearch ? recharge.mobile.includes(headerMobileSearch) : true;
      const matchGlobal = globalSearchQuery ?
        recharge.userName.toLowerCase().includes(globalSearchQuery) ||
        recharge.userEmail.toLowerCase().includes(globalSearchQuery) ||
        recharge.transactionId.toLowerCase().includes(globalSearchQuery) : true;
      return matchHeader && matchGlobal;
    });
  }, [rechargeList, headerMobileSearch, globalSearchQuery]);

  const filteredInvoicesData = useMemo(() => {
    return invoiceList.filter(invoice => {
      const matchHeader = headerMobileSearch ? invoice.mobile.includes(headerMobileSearch) : true;
      const matchGlobal = globalSearchQuery ?
        invoice.userName.toLowerCase().includes(globalSearchQuery) ||
        invoice.userEmail.toLowerCase().includes(globalSearchQuery) ||
        invoice.invoiceNumber.toLowerCase().includes(globalSearchQuery) : true;
      return matchHeader && matchGlobal;
    });
  }, [invoiceList, headerMobileSearch, globalSearchQuery]);

  // Pagination Logic

  // API already returns the current page — no client-side slicing needed
  const paginatedShippingData = filteredShippingData;
  const totalShippingPages = Math.max(1, Math.ceil(shippingTotal / itemsPerPage));

  const paginatedPassbookData = filteredPassbookData;
  const totalPassbookPages = Math.max(1, Math.ceil(passbookTotal / itemsPerPage));

  const paginatedRechargeData = filteredWalletRechargeData;
  const totalRechargePages = Math.max(1, Math.ceil(rechargeTotal / itemsPerPage));

  const paginatedInvoicesData = filteredInvoicesData;
  const totalInvoicePages = Math.max(1, Math.ceil(invoiceTotal / itemsPerPage));

  // Bulk Actions & Helpers
  const handleRefresh = () => {
    setHeaderMobileSearch('');
    setSearchTerm('');
    setSelectedSearchTypes([]);
    setSearchTypeId('');
    setSelectedCouriers([]);
    setSelectedStatuses([]);
    setShippingDateStart(''); setShippingDateEnd('');
    setShipUserQuery(''); setShipUserMongoId(''); setShipUserSuggestions([]);
    setPbUserQuery(''); setPbUserMongoId(''); setPbUserSuggestions([]);
    setRcUserQuery(''); setRcUserMongoId(''); setRcUserSuggestions([]);
    setInvUserQuery(''); setInvUserMongoId(''); setInvUserSuggestions([]);
    setPassbookSearchTerm('');
    setPassbookOrderId('');
    setPassbookAwb('');
    setSelectedCategories([]);
    setSelectedDescriptions([]);
    setPassbookDateStart(''); setPassbookDateEnd('');
    setRechargeSearchTerm('');
    setRechargeTxnId('');
    setSelectedPaymentMethods([]);
    setSelectedRechargeStatuses([]);
    setRechargeDateStart(''); setRechargeDateEnd('');
    setInvoiceSearchTerm('');
    setSelectedMonths([]);
    setSelectedYears([]);
    setInvoiceDateStart(''); setInvoiceDateEnd('');
    setShippingPage(1);
    setPassbookPage(1);
    setRechargePage(1);
    setInvoicePage(1);
    showToast('success', 'Wallet data refreshed successfully!');
  };

  const handleViewPassbook = (awb: string) => {
    setPassbookAwb(awb);
    setPassbookPage(1);
    setActiveTab('Passbook');
  };

  const renderPaginationButtons = (curr: number, total: number, setPage: (p: number) => void) => {
    if (total <= 1) return null;
    const cls = (p: number) => `w-8 h-8 rounded text-xs font-medium flex items-center justify-center transition-colors ${
      curr === p ? 'bg-[#00A86B] text-white border border-[#00A86B]' : 'border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
    }`;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => (
        <button key={i + 1} onClick={() => setPage(i + 1)} className={cls(i + 1)}>{i + 1}</button>
      ));
    }
    const win = pageWindow(curr, total);
    return (
      <>
        <button onClick={() => setPage(1)} className={cls(1)}>1</button>
        {win[0] > 2 && <span className="px-1 text-[#94A3B8] text-xs">…</span>}
        {win.map(p => <button key={p} onClick={() => setPage(p)} className={cls(p)}>{p}</button>)}
        {win[win.length - 1] < total - 1 && <span className="px-1 text-[#94A3B8] text-xs">…</span>}
        <button onClick={() => setPage(total)} className={cls(total)}>{total}</button>
      </>
    );
  };

  const handleBulkMarkPaid = () => {
    if (selectedOrders.length === 0) return;
    setShippingList(prev => prev.map(item => 
      selectedOrders.includes(item.awb) ? { ...item, status: 'Paid' } : item
    ));
    showToast('success', `Successfully marked ${selectedOrders.length} shipments as Paid!`);
    setSelectedOrders([]);
  };

  const handleExportData = (type: string, dataToExport: any[]) => {
    if (dataToExport.length === 0) {
      showToast('error', "No records found to export.");
      return;
    }
    let csvContent = "";
    if (type === 'shipping') {
      csvContent = "ID,AWB,User Name,Email,Courier,Booked Date,Amount,Status\n" + 
        dataToExport.map(o => `"${o.id}","${o.awb}","${o.userName}","${o.userEmail}","${o.courier}","${o.bookedDate}","${o.statusAmount}","${o.status}"`).join("\n");
    } else if (type === 'passbook') {
      csvContent = "ID,AWB,User Name,Email,Category,Amount,Balance,Description\n" + 
        dataToExport.map(o => `"${o.id}","${o.awb}","${o.userName}","${o.userEmail}","${o.category}","${o.amount}","${o.balance}","${o.description}"`).join("\n");
    } else if (type === 'recharge') {
      csvContent = "ID,User Name,Email,Txn ID,Amount,Status,Payment ID,Order ID\n" + 
        dataToExport.map(o => `"${o.id}","${o.userName}","${o.userEmail}","${o.transactionId}","${o.amount}","${o.status}","${o.paymentId}","${o.orderId}"`).join("\n");
    } else if (type === 'invoice') {
      csvContent = "ID,User Name,Email,Invoice Number,Shipments,Amount,Created On,Period,Status\n" + 
        dataToExport.map(o => `"${o.id}","${o.userName}","${o.userEmail}","${o.invoiceNumber}","${o.shipments}","${o.amount}","${o.createdOn}","${o.invoicePeriod}","${o.status}"`).join("\n");
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${type}_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('success', `${type.toUpperCase()} records exported successfully!`);
    setShowShippingActionMenu(false);
    setShowPassbookActionMenu(false);
    setShowRechargeActionMenu(false);
    setShowInvoiceActionMenu(false);
  };

  const handleRechargeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(rechargeAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('error', 'Please enter a valid amount.');
      return;
    }
    setIsRecharging(true);
    setTimeout(() => {
      const newTxn = {
        id: '86543',
        userName: 'HL ARC Studio',
        userEmail: 'abc@gmail.com',
        mobile: '9876543210',
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        transactionId: `865437654${Math.floor(100000 + Math.random() * 900000)}`,
        amount: amount,
        status: 'Success',
        paymentId: `pay_${paymentMethod.toLowerCase()}_${Math.random().toString(36).substring(2, 12)}`,
        orderId: `order_${Math.random().toString(36).substring(2, 12)}`
      };
      setRechargeList(prev => [newTxn, ...prev]);
      
      const newPassbookEntry = {
        id: '86543',
        awb: `N/A`,
        userName: 'HL ARC Studio',
        userEmail: 'abc@gmail.com',
        mobile: '9876543210',
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        courier: 'N/A',
        bookedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        category: 'Credit',
        amount: amount,
        balance: walletBalance + amount,
        description: 'Wallet Recharge Success'
      };
      setPassbookList(prev => [newPassbookEntry, ...prev]);
      setWalletBalance(prev => prev + amount);
      setIsRecharging(false);
      setIsRechargeModalOpen(false);
      setRechargeAmount('');
      showToast('success', `Wallet recharged with ₹${amount.toFixed(2)} successfully!`);
    }, 1200);
  };

  const handleCodRemittanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(rechargeAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('error', 'Please enter a valid amount.');
      return;
    }
    if (amount > availableCodBalance) {
      showToast('error', 'Transfer amount exceeds available COD balance.');
      return;
    }
    setIsRecharging(true);
    setTimeout(() => {
      const newTxn = {
        id: '86543',
        userName: 'HL ARC Studio',
        userEmail: 'abc@gmail.com',
        mobile: '9876543210',
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        transactionId: `COD${Math.floor(100000 + Math.random() * 900000)}`,
        amount: amount,
        status: 'Success',
        paymentId: `cod_remit_${Math.random().toString(36).substring(2, 12)}`,
        orderId: `order_${Math.random().toString(36).substring(2, 12)}`
      };
      setRechargeList(prev => [newTxn, ...prev]);
      
      const newPassbookEntry = {
        id: '86543',
        awb: `N/A`,
        userName: 'HL ARC Studio',
        userEmail: 'abc@gmail.com',
        mobile: '9876543210',
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        courier: 'N/A',
        bookedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        category: 'Credit',
        amount: amount,
        balance: walletBalance + amount,
        description: 'COD Remittance Transfer'
      };
      setPassbookList(prev => [newPassbookEntry, ...prev]);
      setWalletBalance(prev => prev + amount);
      setAvailableCodBalance(prev => prev - amount);
      setIsRecharging(false);
      setIsRechargeModalOpen(false);
      setRechargeAmount('');
      setRechargeMode('Payment');
      showToast('success', `Successfully transferred ₹${amount.toFixed(2)} from COD Remittance!`);
    }, 1200);
  };

  const handleDownloadInvoice = (invoice: any) => {
    const content = `INVOICE DETAIL\nInvoice No: ${invoice.invoiceNumber}\nUser: ${invoice.userName} (${invoice.userEmail})\nPeriod: ${invoice.invoicePeriod}\nAmount: INR ${invoice.amount.toFixed(2)}\nStatus: ${invoice.status}\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Invoice_${invoice.invoiceNumber}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Invoice downloaded successfully!');
  };

  // Selection state helpers
  const toggleAll = () => setSelectedOrders(selectedOrders.length === filteredShippingData.length && filteredShippingData.length > 0 ? [] : filteredShippingData.map(o => o.awb));
  const toggleSelect = (id: string) => setSelectedOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAllPassbook = () => setSelectedPassbookOrders(selectedPassbookOrders.length === filteredPassbookData.length && filteredPassbookData.length > 0 ? [] : filteredPassbookData.map(o => o.awb));
  const toggleSelectPassbook = (id: string) => setSelectedPassbookOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAllRecharge = () => setSelectedRechargeOrders(selectedRechargeOrders.length === filteredWalletRechargeData.length && filteredWalletRechargeData.length > 0 ? [] : filteredWalletRechargeData.map(o => o.transactionId));
  const toggleSelectRecharge = (id: string) => setSelectedRechargeOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAllInvoices = () => setSelectedInvoiceOrders(selectedInvoiceOrders.length === filteredInvoicesData.length && filteredInvoicesData.length > 0 ? [] : filteredInvoicesData.map(o => o.invoiceNumber));
  const toggleSelectInvoice = (id: string) => setSelectedInvoiceOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">
        <div className="bg-white relative z-50 shrink-0">
          {/* Top Header Row */}
          <div className="flex justify-between items-center px-6 py-2 border-b border-[#E2E8F0] bg-white">
            <div className="flex gap-6 items-center shrink-0">
              {MAIN_TABS.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`relative py-3 text-[13px] font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === tab.name ? 'text-[#00A86B]' : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {tab.name}
                  {activeTab === tab.name && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00A86B] rounded-t-full" />
                  )}
                </button>
              ))}
            </div>

          <div className="flex items-center gap-3 shrink-0 ml-4">
            <button 
              onClick={handleRefresh}
              className="w-8 h-8 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC]"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {activeTab === 'Shipping' && (
          <>
            {/* Filters Row */}
            <div className="p-3 border-b border-[#E2E8F0] flex flex-wrap items-center gap-2.5 bg-[#F8FAFC]/50">
              {isAdmin && (
                <div className="relative shrink-0">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search user..."
                      value={shipUserQuery}
                      onChange={(e) => { setShipUserQuery(e.target.value); if (!e.target.value.trim()) { setShipUserMongoId(''); setShipUserSuggestions([]); } }}
                      className="h-9 pl-8 pr-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[170px]"
                    />
                    <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    {shipUserMongoId && <CheckCircle2 className="w-3.5 h-3.5 text-[#00A86B] absolute right-2.5 top-1/2 -translate-y-1/2" />}
                  </div>
                  {shipUserSuggestions.length > 0 && !shipUserMongoId && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 w-64 max-h-52 overflow-y-auto py-1">
                      {shipUserSuggestions.map((u: any) => (
                        <button key={u._id} type="button" onClick={() => { setShipUserMongoId(u._id); setShipUserQuery(`${u.fullname} (${u.email})`); setShipUserSuggestions([]); }}
                          className="w-full text-left px-3 py-2 hover:bg-[#F0FDF4] flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-bold text-slate-800 truncate">{u.fullname}</div>
                            <div className="text-[10px] text-slate-400 truncate">{u.email} · {u.phoneNumber}</div>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">{u.userId}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <GlassDropdown
                label="Search Type"
                options={SEARCH_TYPE_OPTIONS}
                selected={selectedSearchTypes}
                onChange={setSelectedSearchTypes}
                placeholder="Search type..."
                icon={<Filter className="w-3.5 h-3.5" />}
              />

              <input 
                type="text" 
                placeholder="Search Type ID" 
                value={searchTypeId}
                onChange={(e) => setSearchTypeId(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-32 shrink-0" 
              />
              
              <GlassDropdown
                label="Courier Service"
                options={courierOptions}
                selected={selectedCouriers}
                onChange={setSelectedCouriers}
                placeholder="Search courier..."
                icon={<Truck className="w-3.5 h-3.5" />}
              />

              <GlassDropdown
                label="Status"
                options={SHIPPING_STATUS_OPTIONS}
                selected={selectedStatuses}
                onChange={setSelectedStatuses}
                placeholder="Search status..."
                icon={<Check className="w-3.5 h-3.5" />}
              />

              <GlassDateFilter
                align="right"
                startDate={shippingDateStart}
                endDate={shippingDateEnd}
                onDateChange={(s, e) => { setShippingDateStart(s); setShippingDateEnd(e); }}
              />
              
              <button 
                onClick={() => { setShippingPage(1); fetchShippingData(1); }}
                className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm flex items-center justify-center"
              >
                Apply
              </button>
 
               <div className="relative shrink-0 ml-auto flex items-center gap-2">
                 <button
                   onClick={() => setIsRechargeModalOpen(true)}
                   className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm flex items-center justify-center gap-1.5"
                 >
                   <Plus className="w-3.5 h-3.5" /> Recharge Wallet
                 </button>
                 <div className="relative">
                   <button
                     onClick={() => setShowShippingActionMenu(!showShippingActionMenu)}
                     disabled={selectedOrders.length === 0}
                     className="h-9 pl-4 pr-8 rounded-full border border-[#E2E8F0] text-xs bg-white focus:outline-none flex items-center font-bold text-[#475569] shadow-sm hover:bg-[#F8FAFC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
                   >
                     Action
                     <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                   </button>
                   {showShippingActionMenu && (
                     <div className="absolute right-0 top-full mt-2 w-[180px] bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-[#E2E8F0] py-2 z-50">
                       <button 
                         onClick={() => handleExportData('shipping', filteredShippingData)}
                         className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                       >
                         Export Excel/CSV
                       </button>
                       <button 
                         onClick={() => {
                           if (selectedOrders.length > 0) {
                             handleBulkMarkPaid();
                           } else {
                             showToast('error', 'Please select shipments using checkboxes first.');
                           }
                           setShowShippingActionMenu(false);
                         }}
                         className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#00A86B] hover:bg-[#F0FDF4] transition-colors font-semibold"
                       >
                         Mark Selected Paid
                       </button>
                     </div>
                   )}
                 </div>
               </div>
            </div>
          </>
        )}
 
         {activeTab === 'Passbook' && (
          <>
            {/* Filters Row */}
            <div className="p-3 border-b border-[#E2E8F0] flex flex-wrap items-center gap-2.5 bg-[#F8FAFC]/50">
              {isAdmin && (
                <div className="relative shrink-0">
                  <div className="relative">
                    <input type="text" placeholder="Search user..." value={pbUserQuery}
                      onChange={(e) => { setPbUserQuery(e.target.value); if (!e.target.value.trim()) { setPbUserMongoId(''); setPbUserSuggestions([]); } }}
                      className="h-9 pl-8 pr-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[170px]" />
                    <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    {pbUserMongoId && <CheckCircle2 className="w-3.5 h-3.5 text-[#00A86B] absolute right-2.5 top-1/2 -translate-y-1/2" />}
                  </div>
                  {pbUserSuggestions.length > 0 && !pbUserMongoId && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 w-64 max-h-52 overflow-y-auto py-1">
                      {pbUserSuggestions.map((u: any) => (
                        <button key={u._id} type="button" onClick={() => { setPbUserMongoId(u._id); setPbUserQuery(`${u.fullname} (${u.email})`); setPbUserSuggestions([]); }}
                          className="w-full text-left px-3 py-2 hover:bg-[#F0FDF4] flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-bold text-slate-800 truncate">{u.fullname}</div>
                            <div className="text-[10px] text-slate-400 truncate">{u.email} · {u.phoneNumber}</div>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">{u.userId}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <input 
                type="text" 
                placeholder="Order ID" 
                value={passbookOrderId}
                onChange={(e) => setPassbookOrderId(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-32 shrink-0" 
              />

              <input 
                type="text" 
                placeholder="AWB Number" 
                value={passbookAwb}
                onChange={(e) => setPassbookAwb(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-32 shrink-0" 
              />
              
              <GlassDropdown
                label="Category"
                options={CATEGORY_OPTIONS}
                selected={selectedCategories}
                onChange={setSelectedCategories}
                placeholder="Search category..."
                icon={<Layers className="w-3.5 h-3.5" />}
              />

              <GlassDropdown
                label="Description"
                options={DESCRIPTION_OPTIONS}
                selected={selectedDescriptions}
                onChange={setSelectedDescriptions}
                placeholder="Search description..."
                icon={<FileText className="w-3.5 h-3.5" />}
              />

              <GlassDateFilter
                align="right"
                startDate={passbookDateStart}
                endDate={passbookDateEnd}
                onDateChange={(s, e) => { setPassbookDateStart(s); setPassbookDateEnd(e); }}
              />
              
              <button 
                onClick={() => { setPassbookPage(1); fetchPassbookData(1); }}
                className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm flex items-center justify-center"
              >
                Apply
              </button>

               <div className="relative shrink-0 ml-auto flex items-center gap-2">
                 <button
                   onClick={() => setIsRechargeModalOpen(true)}
                   className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm flex items-center justify-center gap-1.5"
                 >
                   <Plus className="w-3.5 h-3.5" /> Recharge Wallet
                 </button>
                 <div className="relative">
                   <button
                     onClick={() => setShowPassbookActionMenu(!showPassbookActionMenu)}
                     disabled={selectedPassbookOrders.length === 0}
                     className="h-9 pl-4 pr-8 rounded-full border border-[#E2E8F0] text-xs bg-white focus:outline-none flex items-center font-bold text-[#475569] shadow-sm hover:bg-[#F8FAFC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
                   >
                     Action
                     <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                   </button>
                   {showPassbookActionMenu && (
                     <div className="absolute right-0 top-full mt-2 w-[180px] bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-[#E2E8F0] py-2 z-50">
                       <button 
                         onClick={() => handleExportData('passbook', filteredPassbookData)}
                         className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                       >
                         Export Passbook (CSV)
                       </button>
                       <button 
                         onClick={() => {
                           showToast('success', 'Passbook ledger report generated!');
                           setShowPassbookActionMenu(false);
                         }}
                         className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                       >
                         Download Detailed Ledger
                       </button>
                     </div>
                   )}
                 </div>
               </div>
             </div>
          </>
        )}

        {activeTab === 'Wallet Recharge' && (
          <>
            {/* Filters Row */}
            <div className="p-3 border-b border-[#E2E8F0] flex flex-wrap items-center gap-2.5 bg-[#F8FAFC]/50">
              {isAdmin && (
                <div className="relative shrink-0">
                  <div className="relative">
                    <input type="text" placeholder="Search user..." value={rcUserQuery}
                      onChange={(e) => { setRcUserQuery(e.target.value); if (!e.target.value.trim()) { setRcUserMongoId(''); setRcUserSuggestions([]); } }}
                      className="h-9 pl-8 pr-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[170px]" />
                    <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    {rcUserMongoId && <CheckCircle2 className="w-3.5 h-3.5 text-[#00A86B] absolute right-2.5 top-1/2 -translate-y-1/2" />}
                  </div>
                  {rcUserSuggestions.length > 0 && !rcUserMongoId && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 w-64 max-h-52 overflow-y-auto py-1">
                      {rcUserSuggestions.map((u: any) => (
                        <button key={u._id} type="button" onClick={() => { setRcUserMongoId(u._id); setRcUserQuery(`${u.fullname} (${u.email})`); setRcUserSuggestions([]); }}
                          className="w-full text-left px-3 py-2 hover:bg-[#F0FDF4] flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-bold text-slate-800 truncate">{u.fullname}</div>
                            <div className="text-[10px] text-slate-400 truncate">{u.email} · {u.phoneNumber}</div>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">{u.userId}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <input 
                type="text" 
                placeholder="Transaction ID" 
                value={rechargeTxnId}
                onChange={(e) => setRechargeTxnId(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-36 shrink-0" 
              />
              
              <GlassDropdown
                label="Payment Method"
                options={PAYMENT_METHOD_OPTIONS}
                selected={selectedPaymentMethods}
                onChange={setSelectedPaymentMethods}
                placeholder="Search payment..."
                icon={<CreditCard className="w-3.5 h-3.5" />}
              />

              <GlassDropdown
                label="Status"
                options={RECHARGE_STATUS_OPTIONS}
                selected={selectedRechargeStatuses}
                onChange={setSelectedRechargeStatuses}
                placeholder="Search status..."
                icon={<Check className="w-3.5 h-3.5" />}
              />

              <GlassDateFilter
                align="right"
                startDate={rechargeDateStart}
                endDate={rechargeDateEnd}
                onDateChange={(s, e) => { setRechargeDateStart(s); setRechargeDateEnd(e); }}
              />
              
              <button 
                onClick={() => { setRechargePage(1); fetchRechargeData(1); }}
                className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm flex items-center justify-center"
              >
                Apply
              </button>

               <div className="relative shrink-0 ml-auto flex items-center gap-2">
                 <button
                   onClick={() => setIsRechargeModalOpen(true)}
                   className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm flex items-center justify-center gap-1.5"
                 >
                   <Plus className="w-3.5 h-3.5" /> Recharge Wallet
                 </button>
                 <div className="relative">
                   <button
                     onClick={() => setShowRechargeActionMenu(!showRechargeActionMenu)}
                     disabled={selectedRechargeOrders.length === 0}
                     className="h-9 pl-4 pr-8 rounded-full border border-[#E2E8F0] text-xs bg-white focus:outline-none flex items-center font-bold text-[#475569] shadow-sm hover:bg-[#F8FAFC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
                   >
                     Action
                     <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                   </button>
                   {showRechargeActionMenu && (
                     <div className="absolute right-0 top-full mt-2 w-[180px] bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-[#E2E8F0] py-2 z-50">
                       <button 
                         onClick={() => handleExportData('recharge', filteredWalletRechargeData)}
                         className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                       >
                         Export Recharge History
                       </button>
                       <button 
                         onClick={() => {
                           showToast('success', 'Wallet Statement generated successfully!');
                           setShowRechargeActionMenu(false);
                         }}
                         className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                       >
                         Generate Statement
                       </button>
                     </div>
                   )}
                 </div>
               </div>
             </div>
          </>
        )}

        {activeTab === 'Invoices' && (
          <>
            {/* Filters Row */}
            <div className="p-3 border-b border-[#E2E8F0] flex flex-wrap items-center gap-2.5 bg-[#F8FAFC]/50">
              {isAdmin && (
                <div className="relative shrink-0">
                  <div className="relative">
                    <input type="text" placeholder="Search user..." value={invUserQuery}
                      onChange={(e) => { setInvUserQuery(e.target.value); if (!e.target.value.trim()) { setInvUserMongoId(''); setInvUserSuggestions([]); } }}
                      className="h-9 pl-8 pr-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[170px]" />
                    <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    {invUserMongoId && <CheckCircle2 className="w-3.5 h-3.5 text-[#00A86B] absolute right-2.5 top-1/2 -translate-y-1/2" />}
                  </div>
                  {invUserSuggestions.length > 0 && !invUserMongoId && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 w-64 max-h-52 overflow-y-auto py-1">
                      {invUserSuggestions.map((u: any) => (
                        <button key={u._id} type="button" onClick={() => { setInvUserMongoId(u._id); setInvUserQuery(`${u.fullname} (${u.email})`); setInvUserSuggestions([]); }}
                          className="w-full text-left px-3 py-2 hover:bg-[#F0FDF4] flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-bold text-slate-800 truncate">{u.fullname}</div>
                            <div className="text-[10px] text-slate-400 truncate">{u.email} · {u.phoneNumber}</div>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">{u.userId}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <GlassDropdown
                label="Month"
                options={MONTH_OPTIONS}
                selected={selectedMonths}
                onChange={setSelectedMonths}
                placeholder="Search month..."
                icon={<CalendarDays className="w-3.5 h-3.5" />}
              />

              <GlassDropdown
                label="Year"
                options={YEAR_OPTIONS}
                selected={selectedYears}
                onChange={setSelectedYears}
                placeholder="Search year..."
                icon={<Hash className="w-3.5 h-3.5" />}
              />

              <GlassDateFilter
                align="right"
                startDate={invoiceDateStart}
                endDate={invoiceDateEnd}
                onDateChange={(s, e) => { setInvoiceDateStart(s); setInvoiceDateEnd(e); }}
              />
              
              <button 
                onClick={() => { setInvoicePage(1); fetchInvoiceData(1); }}
                className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm flex items-center justify-center"
              >
                Apply
              </button>

               <div className="relative shrink-0 ml-auto flex items-center gap-2">
                 <button
                   onClick={() => setIsRechargeModalOpen(true)}
                   className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm flex items-center justify-center gap-1.5"
                 >
                   <Plus className="w-3.5 h-3.5" /> Recharge Wallet
                 </button>
                 <div className="relative">
                   <button
                     onClick={() => setShowInvoiceActionMenu(!showInvoiceActionMenu)}
                     disabled={selectedInvoiceOrders.length === 0}
                     className="h-9 pl-4 pr-8 rounded-full border border-[#E2E8F0] text-xs bg-white focus:outline-none flex items-center font-bold text-[#475569] shadow-sm hover:bg-[#F8FAFC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
                   >
                     Action
                     <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                   </button>
                   {showInvoiceActionMenu && (
                     <div className="absolute right-0 top-full mt-2 w-[180px] bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-[#E2E8F0] py-2 z-50">
                       <button 
                         onClick={() => handleExportData('invoice', filteredInvoicesData)}
                         className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                       >
                         Export Invoice List
                       </button>
                       <button 
                         onClick={() => {
                           showToast('success', 'Downloading all invoice PDFs...');
                           setShowInvoiceActionMenu(false);
                         }}
                         className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                       >
                         Download All PDF
                       </button>
                     </div>
                   )}
                 </div>
               </div>
             </div>
          </>
        )}
        </div>

        {/* Table Section */}
        <div className="bg-white flex flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
        
        {activeTab === 'Shipping' && (
          <>
            {selectedOrders.length > 0 && (
              <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-3 animate-fade-in">
                <span className="text-xs font-bold text-blue-700">{selectedOrders.length} selected</span>
                <button 
                  onClick={() => handleExportData('shipping', filteredShippingData.filter(o => selectedOrders.includes(o.awb)))}
                  className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm ml-auto hover:bg-blue-100"
                >
                  Export Selected
                </button>
                <button 
                  onClick={handleBulkMarkPaid}
                  className="h-8 px-3 rounded-md bg-white border border-green-200 text-xs font-bold text-green-700 shadow-sm hover:bg-green-50"
                >
                  Mark Paid
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto overflow-x-hidden w-full relative">
              <table className="w-full text-left border-collapse min-w-full">
                <thead>
                  <tr className="bg-[#E6F5F1] text-[10px] font-bold text-[#00A86B] uppercase tracking-wider">
                    <th className="p-3 w-10">
                      <input type="checkbox" checked={selectedOrders.length === filteredShippingData.length && filteredShippingData.length > 0} onChange={toggleAll} className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                    </th>
                    {isAdmin && <th className="p-3"><User className="w-3.5 h-3.5 inline mr-1"/> User Details</th>}
                    <th className="p-3"><Package className="w-3.5 h-3.5 inline mr-1"/> Order Details</th>
                    <th className="p-3"><Truck className="w-3.5 h-3.5 inline mr-1"/> Shipping Details</th>
                    <th className="p-3"><Banknote className="w-3.5 h-3.5 inline mr-1"/> Status</th>
                    <th className="p-3"><Package className="w-3.5 h-3.5 inline mr-1"/> Initial Weight</th>
                    <th className="p-3"><Package className="w-3.5 h-3.5 inline mr-1"/> Courier Weight</th>
                    <th className="p-3 text-right"><MoreVertical className="w-3.5 h-3.5 inline"/> Actions</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] text-[#475569]">
                  {paginatedShippingData.map((order) => (
                    <tr key={order.awb} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors group">
                      <td className="p-3">
                        <input type="checkbox" checked={selectedOrders.includes(order.awb)} onChange={() => toggleSelect(order.awb)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                      </td>
                      {isAdmin && (
                        <td className="p-3">
                          <div className="text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline">{order.userId}</div>
                          <div className="text-sm font-semibold text-[#0F172A] mt-0.5">{order.userName}</div>
                          <div className="text-[11px] text-[#94A3B8]">{order.userEmail}</div>
                        </td>
                      )}
                      <td className="p-3">
                        <div className="text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline">{order.id}</div>
                        <div className="table-date mt-0.5">{order.date}</div>
                        <div className="text-[11px] text-[#475569] mt-0.5 font-medium">{order.paymentMethod}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-xs font-semibold text-[#00A86B]">{order.courier}</div>
                        <div className="table-date mt-0.5">Booked On : {order.bookedDate}</div>
                        <div className="text-xs font-semibold text-[#00A86B] underline decoration-solid underline-offset-2 mt.0.5 hover:text-[#009B63] cursor-pointer">{order.awb}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-[#0F172A] text-[11px]">₹{order.statusAmount}</div>
                        <span className={getStatusBadgeClass(order.status)}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-3 text-xs font-normal text-[#64748B]">
                        <div className="text-[#0F172A] font-medium">{order.initialWeight}</div>
                        <div className="mt-0.5">{order.initialDimensions}</div>
                        <div className="mt-0.5">{order.initialVol}</div>
                      </td>
                      <td className="p-3 text-xs font-normal text-[#64748B]">
                        <div className="text-[#0F172A] font-medium">{order.courierWeight}</div>
                        <div className="mt-0.5">{order.courierDimensions}</div>
                        <div className="mt-0.5">{order.courierVol}</div>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleViewPassbook(order.awb)}
                          className="px-3 py-1.5 rounded-full bg-[#1E3A8A] text-white text-[10px] font-bold hover:bg-[#1E3A8A]/90 transition-colors"
                        >
                          History
                        </button>
                      </td>
                    </tr>
                  ))}
                  {paginatedShippingData.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 8 : 7} className="p-8 text-center text-[#64748B] font-medium">
                        No shipping records found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Shipping Pagination */}
            {shippingTotal > 0 && (
              <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between">
                <div className="text-xs text-[#64748B]">
                  Showing <span className="font-bold text-[#0F172A]">{(shippingPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-[#0F172A]">{Math.min(shippingPage * itemsPerPage, shippingTotal)}</span> of <span className="font-bold text-[#0F172A]">{shippingTotal}</span> entries
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShippingPage(p => Math.max(1, p - 1))}
                    disabled={shippingPage === 1}
                    className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50"
                  >
                    ←
                  </button>
                  {renderPaginationButtons(shippingPage, totalShippingPages, setShippingPage)}
                  <button
                    onClick={() => setShippingPage(p => Math.min(totalShippingPages, p + 1))}
                    disabled={shippingPage === totalShippingPages}
                    className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </>
        )}



        {activeTab === 'Passbook' && (
          <>
            {selectedPassbookOrders.length > 0 && (
              <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-3 animate-fade-in">
                <span className="text-xs font-bold text-blue-700">{selectedPassbookOrders.length} selected</span>
                <button 
                  onClick={() => handleExportData('passbook', filteredPassbookData.filter(o => selectedPassbookOrders.includes(o.awb)))}
                  className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm ml-auto hover:bg-blue-100"
                >
                  Export Selected
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto overflow-x-hidden w-full relative">
              <table className="w-full text-left border-collapse min-w-full">
                <thead>
                  <tr className="bg-[#E6F5F1] text-[10px] font-bold text-[#00A86B] uppercase tracking-wider">
                    <th className="p-3 w-10">
                      <input type="checkbox" checked={selectedPassbookOrders.length === filteredPassbookData.length && filteredPassbookData.length > 0} onChange={toggleAllPassbook} className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                    </th>
                    {isAdmin && <th className="p-3"><User className="w-3.5 h-3.5 inline mr-1"/> User Details</th>}
                    <th className="p-3"><Calendar className="w-3.5 h-3.5 inline mr-1"/> Date / Time</th>
                    <th className="p-3"><Package className="w-3.5 h-3.5 inline mr-1"/> Order Details</th>
                    <th className="p-3"><Truck className="w-3.5 h-3.5 inline mr-1"/> Shipping Details</th>
                    <th className="p-3"><FileText className="w-3.5 h-3.5 inline mr-1"/> Category</th>
                    <th className="p-3"><Banknote className="w-3.5 h-3.5 inline mr-1"/> Amount</th>
                    <th className="p-3"><Wallet className="w-3.5 h-3.5 inline mr-1"/> Available Balance</th>
                    <th className="p-3"><FileText className="w-3.5 h-3.5 inline mr-1"/> Description</th>
                    <th className="p-3 text-right"><MoreVertical className="w-3.5 h-3.5 inline mr-1"/> Actions</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] text-[#475569]">
                  {paginatedPassbookData.map((order) => (
                    <tr key={order.awb} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors group">
                      <td className="p-3">
                        <input type="checkbox" checked={selectedPassbookOrders.includes(order.awb)} onChange={() => toggleSelectPassbook(order.awb)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                      </td>
                      {isAdmin && (
                        <td className="p-3">
                          <div className="text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline">{order.userId}</div>
                          <div className="text-sm font-semibold text-[#0F172A] mt-0.5">{order.userName}</div>
                          <div className="text-[11px] text-[#94A3B8]">{order.userEmail}</div>
                        </td>
                      )}
                      <td className="p-3">
                        <div className="table-date">{order.date}</div>
                        <div className="table-date mt-0.5">{order.time}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline">{order.id}</div>
                        {order.paymentMethod && <div className="text-[11px] text-[#475569] mt-0.5 font-medium">{order.paymentMethod}</div>}
                      </td>
                      <td className="p-3">
                        <div className="text-xs font-semibold text-[#00A86B]">{order.courier}</div>
                        <div className="table-date mt-0.5">Booked On : {order.bookedDate}</div>
                        <div className="text-xs font-semibold text-[#00A86B] underline decoration-solid underline-offset-2 mt-0.5 hover:text-[#009B63] cursor-pointer">{order.awb}</div>
                      </td>
                      <td className="p-3">
                        <span className={getStatusBadgeClass(order.category)}>
                          {order.category}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className={`font-bold text-[11px] ${order.category === 'Debit' ? 'text-red-500' : 'text-green-500'}`}>₹{order.amount.toFixed(2)}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-[#64748B] text-[11px]">₹{order.balance.toFixed(2)}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-[#64748B] text-[11px]">{order.description}</div>
                      </td>
                      <td className="p-3 text-right">
                        {order.category === 'Debit' ? (
                          <button
                            onClick={() => handleReverseTransaction(order)}
                            title="Reverse Transaction"
                            className="w-7 h-7 rounded-full bg-[#FEF2F2] flex items-center justify-center text-[#EF4444] hover:bg-[#FEE2E2] transition-colors ml-auto"
                          >
                            <RefreshCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : <div className="w-7 ml-auto" />}
                      </td>
                    </tr>
                  ))}
                  {paginatedPassbookData.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 10 : 9} className="p-8 text-center text-[#64748B] font-medium">
                        No passbook records found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Passbook Pagination */}
            {passbookTotal > 0 && (
              <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between">
                <div className="text-xs text-[#64748B]">
                  Showing <span className="font-bold text-[#0F172A]">{(passbookPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-[#0F172A]">{Math.min(passbookPage * itemsPerPage, passbookTotal)}</span> of <span className="font-bold text-[#0F172A]">{passbookTotal}</span> entries
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPassbookPage(p => Math.max(1, p - 1))}
                    disabled={passbookPage === 1}
                    className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50"
                  >
                    ←
                  </button>
                  {renderPaginationButtons(passbookPage, totalPassbookPages, setPassbookPage)}
                  <button
                    onClick={() => setPassbookPage(p => Math.min(totalPassbookPages, p + 1))}
                    disabled={passbookPage === totalPassbookPages}
                    className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'Wallet Recharge' && (
          <>
            {selectedRechargeOrders.length > 0 && (
              <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-3 animate-fade-in">
                <span className="text-xs font-bold text-blue-700">{selectedRechargeOrders.length} selected</span>
                <button 
                  onClick={() => handleExportData('recharge', filteredWalletRechargeData.filter(o => selectedRechargeOrders.includes(o.transactionId)))}
                  className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm ml-auto hover:bg-blue-100"
                >
                  Export Selected
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto overflow-x-hidden w-full relative">
              <table className="w-full text-left border-collapse min-w-full">
                <thead>
                  <tr className="bg-[#E6F5F1] text-[10px] font-bold text-[#00A86B] uppercase tracking-wider">
                    <th className="p-3 w-10">
                      <input type="checkbox" checked={selectedRechargeOrders.length === filteredWalletRechargeData.length && filteredWalletRechargeData.length > 0} onChange={toggleAllRecharge} className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                    </th>
                    {isAdmin && <th className="p-3"><User className="w-3.5 h-3.5 inline mr-1"/> User Details</th>}
                    <th className="p-3"><Calendar className="w-3.5 h-3.5 inline mr-1"/> Date</th>
                    <th className="p-3"><FileText className="w-3.5 h-3.5 inline mr-1"/> Transaction ID</th>
                    <th className="p-3"><Banknote className="w-3.5 h-3.5 inline mr-1"/> Amount</th>
                    <th className="p-3"><Check className="w-3.5 h-3.5 inline mr-1"/> Status</th>
                    <th className="p-3"><FileText className="w-3.5 h-3.5 inline mr-1"/> Description</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] text-[#475569]">
                  {paginatedRechargeData.map((recharge) => (
                    <tr key={recharge.transactionId} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors group">
                      <td className="p-3">
                        <input type="checkbox" checked={selectedRechargeOrders.includes(recharge.transactionId)} onChange={() => toggleSelectRecharge(recharge.transactionId)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                      </td>
                      {isAdmin && (
                        <td className="p-3">
                          <div className="text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline">{recharge.userId}</div>
                          <div className="text-sm font-semibold text-[#0F172A] mt-0.5">{recharge.userName}</div>
                          <div className="text-[11px] text-[#94A3B8]">{recharge.userEmail}</div>
                        </td>
                      )}
                      <td className="p-3">
                        <div className="table-date">{recharge.date}</div>
                        <div className="table-date mt-0.5">{recharge.time}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-xs font-semibold text-[#00A86B]">{recharge.transactionId}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-[#0F172A] text-[11px]">₹{recharge.amount.toFixed(2)}</div>
                      </td>
                      <td className="p-3">
                        <span className={getStatusBadgeClass(recharge.status)}>
                          {recharge.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-[#0F172A]">Payment ID : {recharge.paymentId}</div>
                        <div className="font-bold text-[#0F172A] mt-0.5">Order ID: {recharge.orderId}</div>
                      </td>
                    </tr>
                  ))}
                  {paginatedRechargeData.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} className="p-8 text-center text-[#64748B] font-medium">
                        No recharge transactions found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Recharge Pagination */}
            {rechargeTotal > 0 && (
              <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between">
                <div className="text-xs text-[#64748B]">
                  Showing <span className="font-bold text-[#0F172A]">{(rechargePage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-[#0F172A]">{Math.min(rechargePage * itemsPerPage, rechargeTotal)}</span> of <span className="font-bold text-[#0F172A]">{rechargeTotal}</span> entries
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setRechargePage(p => Math.max(1, p - 1))}
                    disabled={rechargePage === 1}
                    className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50"
                  >
                    ←
                  </button>
                  {renderPaginationButtons(rechargePage, totalRechargePages, setRechargePage)}
                  <button
                    onClick={() => setRechargePage(p => Math.min(totalRechargePages, p + 1))}
                    disabled={rechargePage === totalRechargePages}
                    className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'Invoices' && (
          <>
            {selectedInvoiceOrders.length > 0 && (
              <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-3 animate-fade-in">
                <span className="text-xs font-bold text-blue-700">{selectedInvoiceOrders.length} selected</span>
                <button 
                  onClick={() => handleExportData('invoice', filteredInvoicesData.filter(o => selectedInvoiceOrders.includes(o.invoiceNumber)))}
                  className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm ml-auto hover:bg-blue-100"
                >
                  Export Selected
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto overflow-x-hidden w-full relative">
              <table className="w-full text-left border-collapse min-w-full">
                <thead>
                  <tr className="bg-[#E6F5F1] text-[10px] font-bold text-[#00A86B] uppercase tracking-wider">
                    <th className="p-3 w-10">
                      <input type="checkbox" checked={selectedInvoiceOrders.length === filteredInvoicesData.length && filteredInvoicesData.length > 0} onChange={toggleAllInvoices} className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                    </th>
                    {isAdmin && <th className="p-3"><User className="w-3.5 h-3.5 inline mr-1"/> User Details</th>}
                    <th className="p-3"><FileText className="w-3.5 h-3.5 inline mr-1"/> Invoice Number</th>
                    <th className="p-3"><Package className="w-3.5 h-3.5 inline mr-1"/> Shipments</th>
                    <th className="p-3"><Banknote className="w-3.5 h-3.5 inline mr-1"/> Amount Details</th>
                    <th className="p-3"><Calendar className="w-3.5 h-3.5 inline mr-1"/> Created On</th>
                    <th className="p-3"><Calendar className="w-3.5 h-3.5 inline mr-1"/> Invoice Period</th>
                    <th className="p-3"><Check className="w-3.5 h-3.5 inline mr-1"/> Status</th>
                    <th className="p-3 text-right"><MoreVertical className="w-3.5 h-3.5 inline mr-1"/> Actions</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] text-[#475569]">
                  {paginatedInvoicesData.map((invoice) => (
                    <tr key={invoice.invoiceNumber} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors group">
                      <td className="p-3">
                        <input type="checkbox" checked={selectedInvoiceOrders.includes(invoice.invoiceNumber)} onChange={() => toggleSelectInvoice(invoice.invoiceNumber)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                      </td>
                      {isAdmin && (
                        <td className="p-3">
                          <div className="text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline uppercase">{invoice.userId}</div>
                          <div className="text-sm font-semibold text-[#0F172A] mt-0.5">{invoice.userName}</div>
                          <div className="text-[11px] text-[#94A3B8]">{invoice.userEmail}</div>
                        </td>
                      )}
                      <td className="p-3">
                        <div className="text-xs font-semibold text-[#00A86B]">{invoice.invoiceNumber}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-[#64748B] text-[11px]">{invoice.shipments}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-[#0F172A] text-[11px]">₹{invoice.amount.toFixed(2)}</div>
                      </td>
                      <td className="p-3">
                        <div className="table-date">{invoice.createdOn}</div>
                      </td>
                      <td className="p-3">
                        <div className="table-date">{invoice.invoicePeriod}</div>
                      </td>
                      <td className="p-3">
                        <span className={getStatusBadgeClass(invoice.status)}>{invoice.status}</span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleDownloadInvoice(invoice)}
                            title="Download Invoice" 
                            className="w-7 h-7 rounded-full bg-[#E0F2FE] flex items-center justify-center text-[#0EA5E9] hover:bg-[#BAE6FD] transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => setActiveInvoicePreview(invoice)}
                            title="Preview Invoice" 
                            className="w-7 h-7 rounded-full bg-[#E0F2FE] flex items-center justify-center text-[#0EA5E9] hover:bg-[#BAE6FD] transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedInvoicesData.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 9 : 8} className="p-8 text-center text-[#64748B] font-medium">
                        No invoice records found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Invoices Pagination */}
            {invoiceTotal > 0 && (
              <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between">
                <div className="text-xs text-[#64748B]">
                  Showing <span className="font-bold text-[#0F172A]">{(invoicePage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-[#0F172A]">{Math.min(invoicePage * itemsPerPage, invoiceTotal)}</span> of <span className="font-bold text-[#0F172A]">{invoiceTotal}</span> entries
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setInvoicePage(p => Math.max(1, p - 1))}
                    disabled={invoicePage === 1}
                    className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50"
                  >
                    ←
                  </button>
                  {renderPaginationButtons(invoicePage, totalInvoicePages, setInvoicePage)}
                  <button
                    onClick={() => setInvoicePage(p => Math.min(totalInvoicePages, p + 1))}
                    disabled={invoicePage === totalInvoicePages}
                    className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed ${activeTab === 'Passbook' ? 'bottom-24' : 'bottom-6'} right-6 z-[100] bg-[#1E293B] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-white/10 min-w-[320px] transition-all duration-300`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'error' ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
              {toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-[#F87171]" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
              )}
            </div>
            <p className="text-[13px] font-medium pr-4">{toast.text}</p>
            <button onClick={() => setToast(null)} className="p-1 hover:bg-white/10 rounded-md transition-colors ml-auto text-[#94A3B8] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {isRechargeModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-fade-in"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-[#00A86B]" /> Recharge Wallet
                </h3>
                <button 
                  onClick={() => {
                    setIsRechargeModalOpen(false);
                    setRechargeAmount('');
                    setRechargeMode('Payment');
                  }}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={rechargeMode === 'Payment' ? handleRechargeSubmit : handleCodRemittanceSubmit} className="p-6 space-y-5">
                {rechargeMode === 'Payment' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Enter Amount (₹)</label>
                      <input
                        type="number"
                        required
                        placeholder="Enter amount (e.g. 1000)"
                        value={rechargeAmount}
                        onChange={(e) => setRechargeAmount(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] font-bold"
                      />
                      <div className="flex gap-2 mt-2.5">
                        {[500, 1000, 2000, 5000].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setRechargeAmount(String(amt))}
                            className="flex-1 py-1.5 rounded-lg border border-slate-200 hover:border-[#00A86B] hover:bg-[#00A86B]/5 text-xs text-slate-600 hover:text-[#00A86B] font-bold transition-all"
                          >
                            + ₹{amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Method</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['UPI', 'Card', 'Netbanking'].map(method => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setPaymentMethod(method)}
                            className={`py-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                              paymentMethod === method 
                                ? 'border-[#00A86B] bg-[#00A86B]/5 text-[#00A86B] font-bold' 
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-[11px] font-bold uppercase">{method}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isRecharging}
                      className="w-full h-11 rounded-xl bg-[#00A86B] text-white text-sm font-bold shadow-lg shadow-[#00A86B]/25 hover:bg-[#009B63] transition-all flex items-center justify-center disabled:opacity-55 cursor-pointer"
                    >
                      {isRecharging ? (
                        <span className="flex items-center gap-2">
                          <RefreshCcw className="w-4 h-4 animate-spin" /> Processing...
                        </span>
                      ) : `Pay ₹${rechargeAmount ? parseFloat(rechargeAmount).toLocaleString() : '0'}`}
                    </button>

                    {/* OR recharge via COD Remittance */}
                    <div className="relative flex py-2 items-center my-1.5">
                      <div className="flex-grow border-t border-slate-200"></div>
                      <span className="flex-shrink mx-3 text-slate-400 text-[10px] font-bold uppercase tracking-wider">OR</span>
                      <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRechargeMode('COD')}
                      className="w-full py-3 border border-[#00A86B]/30 hover:border-[#00A86B] bg-[#00A86B]/5 hover:bg-[#00A86B]/10 text-[#00A86B] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer"
                    >
                      <Banknote className="w-4 h-4" /> Recharge via COD Remittance
                    </button>
                  </>
                ) : (
                  <div className="space-y-5 animate-fade-in text-left">
                    {/* COD Remittance Info Card */}
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50/30 border border-emerald-100/80 rounded-2xl p-4 text-left">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Available COD Payout</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      </div>
                      <div className="text-2xl font-black text-slate-800">
                        ₹{availableCodBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        Transfer funds directly from your pending COD remittance.
                      </p>
                    </div>

                    {/* Amount Input */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Amount to Transfer (₹)</label>
                      <input
                        type="number"
                        required
                        placeholder="Enter amount (e.g. 1000)"
                        value={rechargeAmount}
                        onChange={(e) => setRechargeAmount(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] font-bold"
                      />
                      <div className="flex gap-2 mt-2.5">
                        {[500, 1000, 2000, 5000].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setRechargeAmount(String(amt))}
                            className="flex-1 py-1.5 rounded-lg border border-slate-200 hover:border-[#00A86B] hover:bg-[#00A86B]/5 text-xs text-slate-600 hover:text-[#00A86B] font-bold transition-all"
                          >
                            + ₹{amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Information banner */}
                    <div className="flex gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-[#94A3B8] shrink-0 mt-0.5" />
                      <p className="text-[10px] text-slate-500 font-medium leading-normal">
                        No gateway charges apply. The transferred amount will be adjusted in your next COD settlement statement.
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2.5">
                      <button
                        type="submit"
                        disabled={isRecharging || !rechargeAmount || parseFloat(rechargeAmount) <= 0 || parseFloat(rechargeAmount) > availableCodBalance}
                        className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-[#00A86B] text-white text-sm font-bold shadow-lg shadow-[#00A86B]/25 hover:from-emerald-700 hover:to-[#009B63] transition-all flex items-center justify-center disabled:opacity-55 cursor-pointer"
                      >
                        {isRecharging ? (
                          <span className="flex items-center gap-2">
                            <RefreshCcw className="w-4 h-4 animate-spin" /> Processing...
                          </span>
                        ) : 'Confirm Transfer'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setRechargeMode('Payment')}
                        className="w-full py-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Online Payment
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}

        {isUpdateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row min-h-[450px]"
            >
              {/* Left Column: Animation */}
              <div className="w-full md:w-[40%] bg-gradient-to-br from-[#E6F5F1] to-[#F0FDF4] p-8 flex flex-col items-center justify-center relative overflow-hidden border-r border-[#E2E8F0] select-none">
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#00A86B_1px,transparent_1px)] [background-size:16px_16px]"></div>
                
                {/* Phones & Money Animation Wrapper */}
                <div className="relative w-64 h-64 flex items-center justify-center">
                  
                  {/* Left Phone (Sending) */}
                  <motion.div 
                    initial={{ y: 10 }}
                    animate={{ y: -10 }}
                    transition={{ repeat: Infinity, repeatType: "reverse", duration: 3, ease: "easeInOut" }}
                    className="absolute left-2 bottom-8 w-24 h-40 bg-[#1E293B] rounded-2xl p-1.5 shadow-2xl border border-[#334155] z-10"
                  >
                    <div className="w-full h-full bg-[#0F172A] rounded-xl relative overflow-hidden flex flex-col items-center justify-between p-2">
                      {/* Phone Speaker */}
                      <div className="w-8 h-1 bg-[#334155] rounded-full mx-auto mb-1"></div>
                      {/* Mini Wallet Icon inside sending phone */}
                      <div className="w-10 h-10 rounded-full bg-[#00A86B]/20 flex items-center justify-center text-[#00A86B]">
                        <Wallet className="w-5 h-5" />
                      </div>
                      {/* Micro screen line */}
                      <div className="w-12 h-2 bg-[#00A86B]/30 rounded mx-auto"></div>
                      <div className="w-full h-1 bg-[#1E293B] rounded"></div>
                    </div>
                  </motion.div>

                  {/* Connecting Dotted Arch */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 256 256">
                    <path 
                      id="flight-path"
                      d="M 60 140 Q 128 40 196 140" 
                      fill="none" 
                      stroke="#00A86B" 
                      strokeWidth="2.5" 
                      strokeDasharray="6 6"
                      className="opacity-60"
                    />
                  </svg>

                  {/* Flying Money Icons along the path */}
                  <motion.div
                    className="absolute w-8 h-6 bg-[#00A86B] text-white text-[10px] font-bold rounded flex items-center justify-center shadow-lg"
                    animate={{
                      x: [-60, 60],
                      y: [10, -80, 10],
                      rotate: [0, 45, 90, 135, 180, 225, 270, 315, 360],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    ₹
                  </motion.div>
                  
                  <motion.div
                    className="absolute w-8 h-6 bg-[#00A86B] text-white text-[10px] font-bold rounded flex items-center justify-center shadow-lg"
                    animate={{
                      x: [-60, 60],
                      y: [10, -80, 10],
                      rotate: [0, -45, -90, -135, -180, -225, -270, -315, -360],
                    }}
                    transition={{
                      duration: 3,
                      delay: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    ₹
                  </motion.div>

                  {/* Right Phone (Receiving) */}
                  <motion.div 
                    initial={{ y: -10 }}
                    animate={{ y: 10 }}
                    transition={{ repeat: Infinity, repeatType: "reverse", duration: 3, ease: "easeInOut" }}
                    className="absolute right-2 bottom-8 w-24 h-40 bg-[#1E293B] rounded-2xl p-1.5 shadow-2xl border border-[#334155] z-10"
                  >
                    <div className="w-full h-full bg-[#0F172A] rounded-xl relative overflow-hidden flex flex-col items-center justify-between p-2">
                      <div className="w-8 h-1 bg-[#334155] rounded-full mx-auto mb-1"></div>
                      <div className="w-10 h-10 rounded-full bg-[#00A86B]/20 flex items-center justify-center text-[#00A86B] animate-bounce">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div className="w-14 h-2.5 bg-[#00A86B]/40 rounded mx-auto text-[7px] text-center text-[#00A86B] font-bold flex items-center justify-center">+ Balance</div>
                      <div className="w-full h-1 bg-[#1E293B] rounded"></div>
                    </div>
                  </motion.div>

                </div>

                <div className="text-center mt-6 z-10">
                  <h4 className="font-bold text-[#0F172A] text-sm">Manual Balance Updation</h4>
                  <p className="text-[11px] text-[#64748B] mt-1 max-w-[200px] leading-relaxed">
                    Easily adjust wallet records, credits, or charges directly to the seller's ledger.
                  </p>
                </div>
              </div>

              {/* Right Column: Forms & Tabs */}
              <div className="flex-1 p-6 flex flex-col overflow-y-auto">
                {/* Modal Header & Tabs Navigation */}
                <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-4 shrink-0">
                  <div className="flex gap-4">
                    {(['Recharge', 'Updation', 'Direct Update'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => {
                          setUpbTab(tab);
                          setUpbUserQuery('');
                          setUpbUserSuggestions([]);
                          setUpbSelectedUserId('');
                          setUpbSelectedMongoId('');
                        }}
                        className={`relative pb-2 text-[12px] font-bold transition-all ${
                          upbTab === tab ? 'text-[#00A86B]' : 'text-[#64748B] hover:text-[#0F172A]'
                        }`}
                      >
                        {tab}
                        {upbTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00A86B]" />}
                      </button>
                    ))}
                  </div>
                  <button onClick={closeUpdateModal} type="button" className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Shared User Search */}
                <div className="relative mb-4 shrink-0">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Search User</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by Name, Email, or Contact"
                      value={upbUserQuery}
                      onChange={(e) => {
                        setUpbUserQuery(e.target.value);
                        if (!e.target.value.trim()) { setUpbSelectedUserId(''); setUpbSelectedMongoId(''); }
                      }}
                      className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B] font-semibold"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  {upbUserSuggestions.length > 0 && !upbSelectedUserId && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#E2E8F0] rounded-xl shadow-xl max-h-48 overflow-y-auto z-[120] py-1">
                      {upbUserSuggestions.map((user: any) => (
                        <button key={user._id} type="button"
                          onClick={() => {
                            setUpbSelectedUserId(user.userId);
                            setUpbSelectedMongoId(user._id);
                            setUpbUserQuery(`${user.fullname} (${user.email})`);
                            setUpbUserSuggestions([]);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-[#F0FDF4] transition-colors flex items-start gap-3">
                          <div className="flex-1">
                            <div className="text-xs font-bold text-slate-800">{user.fullname}</div>
                            <div className="text-[10px] text-slate-400">{user.email} · {user.phoneNumber}</div>
                          </div>
                          <div className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0 mt-0.5">{user.userId}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {upbSelectedUserId && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#00A86B] font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {upbUserQuery}
                    </div>
                  )}
                </div>

                {/* Recharge Tab */}
                {upbTab === 'Recharge' && (
                  <form onSubmit={handleUpbRechargeSubmit} className="space-y-3 flex-1 flex flex-col">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Payment ID</label>
                        <input type="text" required value={upbPaymentId} onChange={(e) => setUpbPaymentId(e.target.value)}
                          placeholder="Payment ID"
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Order ID</label>
                        <input type="text" required value={upbRechOrderId} onChange={(e) => setUpbRechOrderId(e.target.value)}
                          placeholder="Order ID"
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B]" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Amount (₹)</label>
                      <input type="number" required value={upbRechAmount} onChange={(e) => setUpbRechAmount(e.target.value)}
                        placeholder="Amount"
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B] font-bold" />
                    </div>
                    <div className="flex items-center gap-3 pt-3 border-t border-slate-100 mt-auto">
                      <button type="submit" disabled={upbIsSubmitting || !upbSelectedUserId}
                        className="flex-1 h-10 rounded-xl bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors flex items-center justify-center shadow-sm disabled:opacity-50">
                        {upbIsSubmitting ? <RefreshCcw className="w-4 h-4 animate-spin" /> : 'Submit'}
                      </button>
                      <button onClick={closeUpdateModal} type="button"
                        className="flex-1 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Updation Tab */}
                {upbTab === 'Updation' && (
                  <form onSubmit={handleUpbUpdationSubmit} className="space-y-3 flex-1 flex flex-col">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
                      <select value={upbUpdDesc} onChange={(e) => { setUpbUpdDesc(e.target.value); setUpbUpdAwb(''); setUpbUpdOrderId(''); }} required
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B]">
                        <option value="">Select description</option>
                        {['Freight Charges','COD Charges','RTO Freight Charges','Shipment Lost Liability','Shipment Damaged Liability','Weight Dispute Charges','Cashback','Credit Note','Wallet to bank','GST Charges'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    {upbUpdDesc && !['Cashback','Credit Note','Wallet to bank'].includes(upbUpdDesc) && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">AWB Number</label>
                          <input type="text" value={upbUpdAwb} onChange={(e) => setUpbUpdAwb(e.target.value)} placeholder="AWB Number"
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B]" />
                          {upbUpdAwbSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl max-h-40 overflow-y-auto z-[120] py-1">
                              {upbUpdAwbSuggestions.map((awb: any) => (
                                <button key={awb.awbNumber} type="button"
                                  onClick={() => { setUpbUpdAwb(awb.awbNumber); setUpbUpdOrderId(awb.orderId); setUpbUpdAwbSuggestions([]); }}
                                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-[#F0FDF4]">
                                  {awb.awbNumber} <span className="text-slate-400">({awb.orderId})</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Order ID</label>
                          <input type="text" value={upbUpdOrderId} readOnly placeholder="Auto-filled from AWB"
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-500 text-xs bg-slate-50 focus:outline-none" />
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Amount (₹)</label>
                        <input type="number" required value={upbUpdAmount} onChange={(e) => setUpbUpdAmount(e.target.value)} placeholder="Amount"
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B] font-bold" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                        <select value={upbUpdCategory} onChange={(e) => setUpbUpdCategory(e.target.value)} required
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B]">
                          <option value="">Select</option>
                          <option value="credit">Credit</option>
                          <option value="debit">Debit</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-3 border-t border-slate-100 mt-auto">
                      <button type="submit" disabled={upbIsSubmitting || !upbSelectedUserId}
                        className="flex-1 h-10 rounded-xl bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors flex items-center justify-center shadow-sm disabled:opacity-50">
                        {upbIsSubmitting ? <RefreshCcw className="w-4 h-4 animate-spin" /> : 'Submit'}
                      </button>
                      <button onClick={closeUpdateModal} type="button"
                        className="flex-1 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Direct Update Tab */}
                {upbTab === 'Direct Update' && (
                  <form onSubmit={handleUpbDirectSubmit} className="space-y-3 flex-1 flex flex-col">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
                      <select value={upbDirDesc} onChange={(e) => setUpbDirDesc(e.target.value)} required
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B]">
                        <option value="">Select description</option>
                        {['Freight Charges','COD Charges','RTO Freight Charges','Shipment Lost Liability','Shipment Damaged Liability','Weight Dispute Charges','Cashback','Credit Note','Wallet to bank','GST Charges'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Amount (₹)</label>
                        <input type="number" required value={upbDirAmount} onChange={(e) => setUpbDirAmount(e.target.value)} placeholder="Amount"
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B] font-bold" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                        <select value={upbDirCategory} onChange={(e) => setUpbDirCategory(e.target.value)} required
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B]">
                          <option value="">Select</option>
                          <option value="credit">Credit</option>
                          <option value="debit">Debit</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-3 border-t border-slate-100 mt-auto">
                      <button type="submit" disabled={upbIsSubmitting || !upbSelectedMongoId}
                        className="flex-1 h-10 rounded-xl bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors flex items-center justify-center shadow-sm disabled:opacity-50">
                        {upbIsSubmitting ? <RefreshCcw className="w-4 h-4 animate-spin" /> : 'Submit'}
                      </button>
                      <button onClick={closeUpdateModal} type="button"
                        className="flex-1 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Floating Bot Button */}
        {activeTab === 'Passbook' && (
          <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative group"
            >
              {/* Tooltip */}
              <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg">
                Update Passbook
              </div>
              
              {/* Pulsing ring */}
              <div className="absolute inset-0 rounded-full bg-[#00A86B] animate-ping opacity-25"></div>
              
              <button
                onClick={() => setIsUpdateModalOpen(true)}
                className="w-12 h-12 rounded-full bg-[#00A86B] text-white flex items-center justify-center shadow-lg hover:bg-[#009B63] transition-all hover:scale-105 relative z-10"
              >
                <Bot className="w-6 h-6 animate-pulse" />
              </button>
            </motion.div>
          </div>
        )}

        {activeShipmentHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-fade-in"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Shipment History</h3>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">AWB: {activeShipmentHistory.awb}</p>
                </div>
                <button 
                  onClick={() => setActiveShipmentHistory(null)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 max-h-[400px] overflow-y-auto space-y-6">
                {[
                  { title: 'Order Booked', desc: 'Shipment registered successfully.', date: activeShipmentHistory.bookedDate, icon: Check, active: true },
                  { title: 'Pickup Request Raised', desc: 'Pickup request forwarded to courier partner.', date: activeShipmentHistory.bookedDate, icon: User, active: true },
                  { title: 'Package Received', desc: 'Package received at originating courier center.', date: activeShipmentHistory.bookedDate, icon: Package, active: true },
                  { title: 'In Transit', desc: 'Package in transit towards delivery center.', date: '14th Apr 2026', icon: Truck, active: true },
                  { title: 'Out For Delivery', desc: 'Courier representative dispatched for package drop.', date: '15th Apr 2026', icon: Clock, active: activeShipmentHistory.status === 'Paid' },
                  { title: activeShipmentHistory.status === 'Paid' ? 'Delivered' : 'Delivery Attempt Pending', desc: activeShipmentHistory.status === 'Paid' ? 'Package delivered to consignee.' : 'Package delivery scheduled for next cycle.', date: '15th Apr 2026', icon: Check, active: activeShipmentHistory.status === 'Paid', highlight: true }
                ].map((step, idx) => (
                  <div key={idx} className="flex gap-4 relative group">
                    {idx < 5 && (
                      <div className={`absolute left-[13px] top-6 bottom-[-24px] w-[2px] ${step.active ? 'bg-[#00A86B]' : 'bg-slate-200'}`} />
                    )}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      step.highlight 
                        ? step.active ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                        : step.active ? 'bg-[#00A86B] text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <step.icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-slate-800 text-[13px]">{step.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{step.desc}</p>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-1">{step.date}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setActiveShipmentHistory(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeInvoicePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-fade-in"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-2xl w-full overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="text-left">
                  <h3 className="font-bold text-slate-800 text-base">Invoice Details</h3>
                  <p className="text-[10px] text-[#00A86B] font-semibold mt-0.5">Invoice #: {activeInvoicePreview.invoiceNumber}</p>
                </div>
                <button 
                  onClick={() => setActiveInvoicePreview(null)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6 text-[12px] text-slate-600 border-b border-slate-100 pb-4">
                  <div className="text-left">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Billed To</span>
                    <strong className="text-slate-800 block text-sm mt-1">{activeInvoicePreview.userName}</strong>
                    <span className="block mt-0.5">{activeInvoicePreview.userEmail}</span>
                    <span className="block mt-0.5">Mobile: {activeInvoicePreview.mobile}</span>
                  </div>
                  <div className="text-right font-normal">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Billed By</span>
                    <strong className="text-[#00A86B] block text-sm mt-1">QuickPost Logistics</strong>
                    <span className="block mt-0.5">finance@quickpost.com</span>
                    <span className="block mt-0.5">Delhi NCR, India</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-[12px] text-slate-600 border-b border-slate-100 pb-4 text-left">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Invoice Date</span>
                    <strong className="text-slate-800 mt-0.5 block">{activeInvoicePreview.createdOn}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Billing Period</span>
                    <strong className="text-slate-800 mt-0.5 block">{activeInvoicePreview.invoicePeriod}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400 font-semibold">Status</span>
                    <strong className={`mt-0.5 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${activeInvoicePreview.status === 'PAID' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>{activeInvoicePreview.status}</strong>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                        <th className="p-3">Description</th>
                        <th className="p-3 text-right">Shipments</th>
                        <th className="p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-600">
                      <tr className="border-b border-slate-100">
                        <td className="p-3 font-semibold text-left">Freight & Forwarding Charges</td>
                        <td className="p-3 text-right">{activeInvoicePreview.shipments}</td>
                        <td className="p-3 text-right">₹{(activeInvoicePreview.amount * 0.82).toFixed(2)}</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="p-3 text-left">GST (18%)</td>
                        <td className="p-3 text-right">-</td>
                        <td className="p-3 text-right">₹{(activeInvoicePreview.amount * 0.18).toFixed(2)}</td>
                      </tr>
                      <tr className="bg-[#E6F5F1]/30 font-bold text-slate-800">
                        <td className="p-3 text-[#00A86B] text-left">Total Payable</td>
                        <td className="p-3 text-right">-</td>
                        <td className="p-3 text-right text-[#00A86B]">₹{activeInvoicePreview.amount.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
                <button 
                  onClick={() => handleDownloadInvoice(activeInvoicePreview)}
                  className="px-4 py-2 rounded-xl bg-[#00A86B] hover:bg-[#009B63] text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </button>
                <button 
                  onClick={() => setActiveInvoicePreview(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
