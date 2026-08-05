import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { useAdminTab } from '../../context/AdminUserContext';
import { apiClient } from '../../services/apiClient';
import { usePagination, DesktopPagination } from '../../hooks/usePagination';
import { MobilePaginationBar } from '../../hooks/useMobilePaginationBar';
import { useUserSearchFilter } from '../../hooks/filters/useUserSearchFilter';
import { Search, ChevronDown, RefreshCcw, Calendar, Check, Package, User, Truck, Banknote, Clock, Upload, Download, MoreVertical, Wallet, ArrowDownCircle, ArrowUpCircle, FileText, Plus, TrendingUp, ChevronLeft, ChevronRight, MinusCircle, Send, Eye, AlertCircle, CheckCircle2, X, CreditCard, Filter, Layers, Hash, CalendarDays, Bot, Settings, Copy } from 'lucide-react';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { GlassDateFilter } from '../../components/ui/GlassDateFilter';
import { useDateRangeFilter } from '../../hooks/filters/useDateRangeFilter';
import { GlassSingleSelect } from '../../components/ui/GlassSingleSelect';
import { useTableLoader } from '../../hooks/useTableLoader';
import { TableLoader } from '../../components/ui/TableLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { TruncatedText } from '../../components/ui/TruncatedText';
import { RechargeWalletModal } from '../../components/ui/RechargeWalletModal';

const UPB_CATEGORY_OPTIONS = [
  { label: 'Wallet Recharge', value: 'recharge' },
  { label: 'Cashback Received', value: 'cashbacks' },
  { label: 'Credit Note', value: 'credit note' },
  { label: 'Bank Withdrawal', value: 'wallet 2 bank' },
];

const MAIN_TABS = [
  { name: 'Shipping' },
  { name: 'Passbook' },
  { name: 'Wallet Recharge' },
  { name: 'Invoices' }
];



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
    priceBreakup: item.priceBreakup || null,
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
  priceBreakup: item.priceBreakup || null,
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

// "March 2026" — the invoice period is always a single billing month, so periodEnd is redundant.
const formatInvoicePeriod = (periodStart: string | undefined) => {
  if (!periodStart) return '—';
  const d = new Date(periodStart);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

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
  invoicePeriod: formatInvoicePeriod(item.periodStart),
  status: (item.status || '').toUpperCase() === 'PAID' ? 'PAID' : 'UNPAID',
  invoiceUrl: item.invoiceUrl || '',
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
  return `${STATUS_BADGE_STYLES[normalized] || 'bg-blue-50 text-blue-700 border-blue-200'} px-2.5 py-0.5 rounded-full border text-[10px] leading-4 font-semibold font-sans uppercase tracking-wider whitespace-nowrap shadow-sm`;
};


export function AdminWallet() {
  const navigate = useNavigate();
  const { isAdmin, adminTab, loadingAdminTab, currentUserId } = useAdminTab();
  const isAdminView = isAdmin && adminTab;
  // AdminLayout adds a 32px impersonation banner (pt-8) above the page when an
  // admin is impersonating a user — the page height calc must account for it too,
  // otherwise the extra 32px overflows the viewport and the whole page scrolls.
  const isImpersonating = !!localStorage.getItem('admin_token_backup');
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

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'Shipping';
  const setActiveTab = (tab: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tab);
    setSearchParams(newParams);
  };
  const [toast, setToast] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const [pricePopupPos, setPricePopupPos] = useState<{ x: number; y: number; dir: string; order: any } | null>(null);
  const pricePopupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mobilePricePopupOrder, setMobilePricePopupOrder] = useState<any | null>(null);

  const showToast = (type: 'error' | 'success', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  const getCourierLogo = (courierName: string) => {
    const name = (courierName || '').toLowerCase();
    if (name.includes('delhivery')) return '/brands/delhivery.png';
    if (name.includes('ekart')) return '/brands/ekart.png';
    if (name.includes('xpressbees')) return '/brands/xpressbees.png';
    if (name.includes('bluedart')) return '/brands/bluedart.png';
    if (name.includes('shadowfax')) return '/brands/shadowfax.png';
    return '/brands/delhivery.png';
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      showToast('success', `${label} copied!`);
    } catch {
      showToast('error', `Failed to copy ${label}.`);
    }
  };

  const truncateChars = (text: string, limit: number) => text && text.length > limit ? `${text.slice(0, limit)}…` : text;

  const renderTruncatedName = (name: string, limit: number = 16, className: string = "font-semibold text-[#0F172A]") => {
    const isTruncated = !!name && name.length > limit;
    return (
      <span
        className={`${className} truncate ${isTruncated ? 'active:opacity-60' : ''}`}
        title={isTruncated ? name : undefined}
        onClick={isTruncated ? (e) => { e.stopPropagation(); showToast('success', name); } : undefined}
      >
        {truncateChars(name, limit)}
      </span>
    );
  };

  const renderCopyable = (text: string, label: string, className: string = "text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline uppercase", onTextClick?: () => void) => (
    <div className="flex items-center gap-1.5 group/copy w-max">
      <div className={className} onClick={(e) => { if (onTextClick) { e.stopPropagation(); onTextClick(); } }}>{text}</div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          copyToClipboard(text, label);
        }}
        className="opacity-100 md:opacity-0 md:group-hover/copy:opacity-100 transition-opacity focus:outline-none"
        title={`Copy ${label}`}
      >
        <Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" />
      </button>
    </div>
  );

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
  const [shippingItemsPerPage, setShippingItemsPerPage] = useState(20);
  const [passbookItemsPerPage, setPassbookItemsPerPage] = useState(20);
  const [rechargeItemsPerPage, setRechargeItemsPerPage] = useState(20);
  const [invoiceItemsPerPage, setInvoiceItemsPerPage] = useState(20);
  const shippingItemsPerPageRef = useRef(20);
  const passbookItemsPerPageRef = useRef(20);
  const rechargeItemsPerPageRef = useRef(20);
  const invoiceItemsPerPageRef = useRef(20);
  const [shippingPage, setShippingPage] = useState(1);
  const [passbookPage, setPassbookPage] = useState(1);
  const [rechargePage, setRechargePage] = useState(1);
  const [invoicePage, setInvoicePage] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Per-tab user search state
  const {
    userQuery: shipUserQuery, userMongoId: shipUserMongoId,
    setUserQuery: setShipUserQuery, setUserMongoId: setShipUserMongoId, setUserSuggestions: setShipUserSuggestions,
    clearUser: clearShipUserFilter,
  } = useUserSearchFilter(isAdminView);
  const {
    userQuery: pbUserQuery, userMongoId: pbUserMongoId,
    setUserQuery: setPbUserQuery, setUserMongoId: setPbUserMongoId, setUserSuggestions: setPbUserSuggestions,
    clearUser: clearPbUserFilter,
  } = useUserSearchFilter(isAdminView);
  const {
    userQuery: rcUserQuery, userMongoId: rcUserMongoId,
    setUserQuery: setRcUserQuery, setUserMongoId: setRcUserMongoId, setUserSuggestions: setRcUserSuggestions,
    clearUser: clearRcUserFilter,
  } = useUserSearchFilter(isAdminView);
  const {
    userQuery: invUserQuery, userMongoId: invUserMongoId,
    setUserQuery: setInvUserQuery, setUserMongoId: setInvUserMongoId, setUserSuggestions: setInvUserSuggestions,
    clearUser: clearInvUserFilter,
  } = useUserSearchFilter(isAdminView);

  // Top header pickup mobile filter
  const [headerMobileSearch, setHeaderMobileSearch] = useState('');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Shipping Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSearchTypes, setSelectedSearchTypes] = useState<string[]>([]);
  const [searchTypeId, setSearchTypeId] = useState('');
  const [selectedCouriers, setSelectedCouriers] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const { dateStart: shippingDateStart, dateEnd: shippingDateEnd, setDateStart: setShippingDateStart, setDateEnd: setShippingDateEnd, onDateChange: onShippingDateChange } = useDateRangeFilter();
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Passbook Filters State
  const [passbookSearchTerm, setPassbookSearchTerm] = useState('');
  const [passbookOrderId, setPassbookOrderId] = useState('');
  const [passbookAwb, setPassbookAwb] = useState('');

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDescriptions, setSelectedDescriptions] = useState<string[]>([]);
  const { dateStart: passbookDateStart, dateEnd: passbookDateEnd, setDateStart: setPassbookDateStart, setDateEnd: setPassbookDateEnd, onDateChange: onPassbookDateChange } = useDateRangeFilter();
  const [selectedPassbookOrders, setSelectedPassbookOrders] = useState<string[]>([]);

  // Wallet Recharge Filters State
  const [rechargeSearchTerm, setRechargeSearchTerm] = useState('');
  const [rechargeTxnId, setRechargeTxnId] = useState('');
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
  const [selectedRechargeStatuses, setSelectedRechargeStatuses] = useState<string[]>([]);
  const { dateStart: rechargeDateStart, dateEnd: rechargeDateEnd, setDateStart: setRechargeDateStart, setDateEnd: setRechargeDateEnd, onDateChange: onRechargeDateChange } = useDateRangeFilter();
  const [selectedRechargeOrders, setSelectedRechargeOrders] = useState<string[]>([]);

  // Invoices Filters State
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const { dateStart: invoiceDateStart, dateEnd: invoiceDateEnd, setDateStart: setInvoiceDateStart, setDateEnd: setInvoiceDateEnd, onDateChange: onInvoiceDateChange } = useDateRangeFilter();
  const [selectedInvoiceOrders, setSelectedInvoiceOrders] = useState<string[]>([]);

  // Clear tab-specific filters when navigating away from them to prevent filters from persisting
  useEffect(() => {
    if (activeTab !== 'Shipping') {
      setSearchTerm('');
      setSelectedSearchTypes([]);
      setSearchTypeId('');
      setSelectedCouriers([]);
      setSelectedStatuses([]);
      setShippingDateStart('');
      setShippingDateEnd('');
      setSelectedOrders([]);
    }

    if (activeTab !== 'Passbook') {
      setPassbookSearchTerm('');
      setPassbookOrderId('');
      setPassbookAwb('');
      setSelectedCategories([]);
      setSelectedDescriptions([]);
      setPassbookDateStart('');
      setPassbookDateEnd('');
      setSelectedPassbookOrders([]);
    }

    if (activeTab !== 'Wallet Recharge') {
      setRechargeSearchTerm('');
      setRechargeTxnId('');
      setSelectedPaymentMethods([]);
      setSelectedRechargeStatuses([]);
      setRechargeDateStart('');
      setRechargeDateEnd('');
      setSelectedRechargeOrders([]);
    }

    if (activeTab !== 'Invoices') {
      setInvoiceSearchTerm('');
      setSelectedMonths([]);
      setSelectedYears([]);
      setInvoiceDateStart('');
      setInvoiceDateEnd('');
      setSelectedInvoiceOrders([]);
    }
  }, [activeTab]);

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

  // Close action menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.action-dropdown-container')) {
        setShowShippingActionMenu(false);
        setShowPassbookActionMenu(false);
        setShowRechargeActionMenu(false);
        setShowInvoiceActionMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Modals States
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);

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

  const [reverseConfirmOrder, setReverseConfirmOrder] = useState<any>(null);

  const handleReverseTransaction = (order: any) => {
    setReverseConfirmOrder(order);
  };

  const doReverseTransaction = async () => {
    const order = reverseConfirmOrder;
    if (!order) return;
    setReverseConfirmOrder(null);
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
    } catch (_) { }
  }, []);

  const fetchShippingData = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit: shippingItemsPerPageRef.current };
      if (isAdminView) {
        if (shipUserMongoId) params.userSearch = shipUserMongoId;
      } else if (currentUserId) {
        params.userSearch = currentUserId;
      }
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
  }, [isAdminView, currentUserId, shipUserMongoId, shippingDateStart, shippingDateEnd, selectedStatuses, selectedCouriers, searchTypeId, selectedSearchTypes]);

  const fetchPassbookData = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit: passbookItemsPerPageRef.current };
      if (isAdminView) {
        if (pbUserMongoId) params.userSearch = pbUserMongoId;
      } else if (currentUserId) {
        params.userSearch = currentUserId;
      }
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
  }, [isAdminView, currentUserId, pbUserMongoId, passbookDateStart, passbookDateEnd, selectedCategories, passbookOrderId, passbookAwb]);

  const fetchRechargeData = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit: rechargeItemsPerPageRef.current };
      if (isAdminView) {
        if (rcUserMongoId) params.userSearch = rcUserMongoId;
      } else if (currentUserId) {
        params.userSearch = currentUserId;
      }
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
  }, [isAdminView, currentUserId, rcUserMongoId, rechargeDateStart, rechargeDateEnd, rechargeTxnId, selectedRechargeStatuses]);

  const MONTH_NAME_TO_NUM: Record<string, number> = {
    January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
    July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
  };

  const fetchInvoiceData = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit: invoiceItemsPerPageRef.current };
      if (isAdminView) {
        if (invUserMongoId) params.userId = invUserMongoId;
      }
      if (invoiceDateStart) params.fromDate = toISOStart(invoiceDateStart);
      if (invoiceDateEnd) params.toDate = toISOEnd(invoiceDateEnd);
      if (selectedMonths.length === 1) params.month = MONTH_NAME_TO_NUM[selectedMonths[0]] ?? selectedMonths[0];
      if (selectedYears.length === 1) params.year = selectedYears[0];
      const endpoint = isAdminView ? '/invoice/adminGetInvoices' : '/invoice/userGetInvoices';
      const res = await apiClient.get(endpoint, { params });
      setInvoiceList((res.data.invoices || []).map(mapInvoiceItem));
      setInvoiceTotal(res.data.totalCount || 0);
    } catch (_) {
      showToast('error', 'Failed to load invoice data.');
    } finally {
      setIsLoading(false);
    }
  }, [isAdminView, invUserMongoId, invoiceDateStart, invoiceDateEnd, selectedMonths, selectedYears]);


  // On mount: fetch balance
  useEffect(() => {
    fetchWalletBalance();
  }, [fetchWalletBalance]);

  // On tab change: fetch first page of that tab's data.
  // Guard on loadingAdminTab so we use the correct isAdminView/currentUserId values.
  useEffect(() => {
    if (loadingAdminTab) return;
    switch (activeTab) {
      case 'Shipping': fetchShippingData(1); setShippingPage(1); break;
      case 'Passbook': fetchPassbookData(1); setPassbookPage(1); break;
      case 'Wallet Recharge': fetchRechargeData(1); setRechargePage(1); break;
      case 'Invoices': fetchInvoiceData(1); setInvoicePage(1); break;
    }
  }, [activeTab, loadingAdminTab, refreshTrigger]);

  // On page change (server-side): refetch current tab
  useEffect(() => { if (activeTab === 'Shipping') fetchShippingData(shippingPage); }, [shippingPage]);
  useEffect(() => { if (activeTab === 'Passbook') fetchPassbookData(passbookPage); }, [passbookPage]);
  useEffect(() => { if (activeTab === 'Wallet Recharge') fetchRechargeData(rechargePage); }, [rechargePage]);
  useEffect(() => { if (activeTab === 'Invoices') fetchInvoiceData(invoicePage); }, [invoicePage]);

  const clearShippingFilters = () => {
    setSearchTerm(''); setSelectedSearchTypes([]); setSearchTypeId('');
    setSelectedCouriers([]); setSelectedStatuses([]);
    setShippingDateStart(''); setShippingDateEnd('');
    if (isAdminView) { clearShipUserFilter(); }
    setShippingPage(1);
    setRefreshTrigger(t => t + 1);
  };
  const hasShippingFilters = !!(searchTerm || selectedSearchTypes.length || searchTypeId || selectedCouriers.length || selectedStatuses.length || (shippingDateStart && shippingDateEnd) || (isAdminView && shipUserMongoId));

  const clearPassbookFilters = () => {
    setPassbookSearchTerm(''); setPassbookOrderId(''); setPassbookAwb('');
    setSelectedCategories([]); setSelectedDescriptions([]);
    setPassbookDateStart(''); setPassbookDateEnd('');
    if (isAdminView) { clearPbUserFilter(); }
    setPassbookPage(1);
    setRefreshTrigger(t => t + 1);
  };
  const hasPassbookFilters = !!(passbookSearchTerm || passbookOrderId || passbookAwb || selectedCategories.length || selectedDescriptions.length || (passbookDateStart && passbookDateEnd) || (isAdminView && pbUserMongoId));

  const clearRechargeFilters = () => {
    setRechargeSearchTerm(''); setRechargeTxnId('');
    setSelectedPaymentMethods([]); setSelectedRechargeStatuses([]);
    setRechargeDateStart(''); setRechargeDateEnd('');
    if (isAdminView) { clearRcUserFilter(); }
    setRechargePage(1);
    setRefreshTrigger(t => t + 1);
  };
  const hasRechargeFilters = !!(rechargeSearchTerm || rechargeTxnId || selectedPaymentMethods.length || selectedRechargeStatuses.length || (rechargeDateStart && rechargeDateEnd) || (isAdminView && rcUserMongoId));

  const clearInvoiceFilters = () => {
    setInvoiceSearchTerm(''); setSelectedMonths([]); setSelectedYears([]);
    setInvoiceDateStart(''); setInvoiceDateEnd('');
    if (isAdminView) { clearInvUserFilter(); }
    setInvoicePage(1);
    setRefreshTrigger(t => t + 1);
  };
  const hasInvoiceFilters = !!(invoiceSearchTerm || selectedMonths.length || selectedYears.length || (invoiceDateStart && invoiceDateEnd) || (isAdminView && invUserMongoId));


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

  // Filter bar user search (admin only) — now handled per-tab by useUserSearchFilter

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
      const matchSearchTerm = searchTerm ?
        order.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.awb.toLowerCase().includes(searchTerm.toLowerCase()) : true;
      return matchHeader && matchGlobal && matchSearchTerm;
    });
  }, [shippingList, headerMobileSearch, globalSearchQuery, searchTerm]);

  const filteredPassbookData = useMemo(() => {
    return passbookList.filter(order => {
      const matchHeader = headerMobileSearch ? order.mobile.includes(headerMobileSearch) : true;
      const matchGlobal = globalSearchQuery ?
        order.userName.toLowerCase().includes(globalSearchQuery) ||
        order.userEmail.toLowerCase().includes(globalSearchQuery) ||
        order.awb.toLowerCase().includes(globalSearchQuery) ||
        order.id.toLowerCase().includes(globalSearchQuery) : true;
      const matchSearchTerm = passbookSearchTerm ?
        order.userName.toLowerCase().includes(passbookSearchTerm.toLowerCase()) ||
        order.userEmail.toLowerCase().includes(passbookSearchTerm.toLowerCase()) ||
        order.awb.toLowerCase().includes(passbookSearchTerm.toLowerCase()) : true;
      const matchDescription = selectedDescriptions.length === 0 || selectedDescriptions.includes(order.description);
      return matchHeader && matchGlobal && matchSearchTerm && matchDescription;
    });
  }, [passbookList, headerMobileSearch, globalSearchQuery, passbookSearchTerm, selectedDescriptions]);

  const filteredWalletRechargeData = useMemo(() => {
    return rechargeList.filter(recharge => {
      const matchHeader = headerMobileSearch ? recharge.mobile.includes(headerMobileSearch) : true;
      const matchGlobal = globalSearchQuery ?
        recharge.userName.toLowerCase().includes(globalSearchQuery) ||
        recharge.userEmail.toLowerCase().includes(globalSearchQuery) ||
        recharge.transactionId.toLowerCase().includes(globalSearchQuery) : true;
      const matchSearchTerm = rechargeSearchTerm ?
        recharge.userName.toLowerCase().includes(rechargeSearchTerm.toLowerCase()) ||
        recharge.userEmail.toLowerCase().includes(rechargeSearchTerm.toLowerCase()) : true;
      const matchPaymentMethod = selectedPaymentMethods.length === 0 || selectedPaymentMethods.some(method =>
        recharge.paymentId.toLowerCase().includes(method.toLowerCase().replace(' ', ''))
      );
      return matchHeader && matchGlobal && matchSearchTerm && matchPaymentMethod;
    });
  }, [rechargeList, headerMobileSearch, globalSearchQuery, rechargeSearchTerm, selectedPaymentMethods]);

  const filteredInvoicesData = useMemo(() => {
    return invoiceList.filter(invoice => {
      const matchHeader = headerMobileSearch ? invoice.mobile.includes(headerMobileSearch) : true;
      const matchGlobal = globalSearchQuery ?
        invoice.userName.toLowerCase().includes(globalSearchQuery) ||
        invoice.userEmail.toLowerCase().includes(globalSearchQuery) ||
        invoice.invoiceNumber.toLowerCase().includes(globalSearchQuery) : true;
      const matchSearchTerm = invoiceSearchTerm ?
        invoice.userName.toLowerCase().includes(invoiceSearchTerm.toLowerCase()) ||
        invoice.userEmail.toLowerCase().includes(invoiceSearchTerm.toLowerCase()) : true;
      return matchHeader && matchGlobal && matchSearchTerm;
    });
  }, [invoiceList, headerMobileSearch, globalSearchQuery, invoiceSearchTerm]);

  const { paginatedData: paginatedShippingData } = usePagination({ data: filteredShippingData, perPage: shippingItemsPerPage });
  const totalShippingPages = Math.max(1, Math.ceil(shippingTotal / shippingItemsPerPage));
  const shippingStartIndex = shippingTotal === 0 ? 0 : (shippingPage - 1) * shippingItemsPerPage + 1;
  const shippingEndIndex = Math.min(shippingPage * shippingItemsPerPage, shippingTotal);
  const handleShippingItemsPerPage: React.Dispatch<React.SetStateAction<number>> = (n) => {
    const val = typeof n === 'function' ? n(shippingItemsPerPage) : n;
    shippingItemsPerPageRef.current = val;
    setShippingItemsPerPage(val);
    if (shippingPage === 1) fetchShippingData(1); else setShippingPage(1);
  };

  const { paginatedData: paginatedPassbookData } = usePagination({ data: filteredPassbookData, perPage: passbookItemsPerPage });
  const totalPassbookPages = Math.max(1, Math.ceil(passbookTotal / passbookItemsPerPage));
  const passbookStartIndex = passbookTotal === 0 ? 0 : (passbookPage - 1) * passbookItemsPerPage + 1;
  const passbookEndIndex = Math.min(passbookPage * passbookItemsPerPage, passbookTotal);
  const handlePassbookItemsPerPage: React.Dispatch<React.SetStateAction<number>> = (n) => {
    const val = typeof n === 'function' ? n(passbookItemsPerPage) : n;
    passbookItemsPerPageRef.current = val;
    setPassbookItemsPerPage(val);
    if (passbookPage === 1) fetchPassbookData(1); else setPassbookPage(1);
  };

  const { paginatedData: paginatedRechargeData } = usePagination({ data: filteredWalletRechargeData, perPage: rechargeItemsPerPage });
  const totalRechargePages = Math.max(1, Math.ceil(rechargeTotal / rechargeItemsPerPage));
  const rechargeStartIndex = rechargeTotal === 0 ? 0 : (rechargePage - 1) * rechargeItemsPerPage + 1;
  const rechargeEndIndex = Math.min(rechargePage * rechargeItemsPerPage, rechargeTotal);
  const handleRechargeItemsPerPage: React.Dispatch<React.SetStateAction<number>> = (n) => {
    const val = typeof n === 'function' ? n(rechargeItemsPerPage) : n;
    rechargeItemsPerPageRef.current = val;
    setRechargeItemsPerPage(val);
    if (rechargePage === 1) fetchRechargeData(1); else setRechargePage(1);
  };

  const { paginatedData: paginatedInvoicesData } = usePagination({ data: filteredInvoicesData, perPage: invoiceItemsPerPage });
  const totalInvoicePages = Math.max(1, Math.ceil(invoiceTotal / invoiceItemsPerPage));
  const invoiceStartIndex = invoiceTotal === 0 ? 0 : (invoicePage - 1) * invoiceItemsPerPage + 1;
  const invoiceEndIndex = Math.min(invoicePage * invoiceItemsPerPage, invoiceTotal);
  const handleInvoiceItemsPerPage: React.Dispatch<React.SetStateAction<number>> = (n) => {
    const val = typeof n === 'function' ? n(invoiceItemsPerPage) : n;
    invoiceItemsPerPageRef.current = val;
    setInvoiceItemsPerPage(val);
    if (invoicePage === 1) fetchInvoiceData(1); else setInvoicePage(1);
  };

  // Bulk Actions & Helpers
  const handleRefresh = () => {
    if (activeTab === 'Shipping') fetchShippingData(shippingPage);
    else if (activeTab === 'Passbook') fetchPassbookData(passbookPage);
    else if (activeTab === 'Wallet Recharge') fetchRechargeData(rechargePage);
    else if (activeTab === 'Invoices') fetchInvoiceData(invoicePage);
  };

  const handleViewPassbook = (awb: string) => {
    setPassbookAwb(awb);
    setPassbookPage(1);
    setActiveTab('Passbook');
  };



  const handleBulkMarkPaid = () => {
    if (selectedOrders.length === 0) return;
    setShippingList(prev => prev.map(item =>
      selectedOrders.includes(item.awb) ? { ...item, status: 'Paid' } : item
    ));
    showToast('success', `Successfully marked ${selectedOrders.length} shipments as Paid!`);
    setSelectedOrders([]);
  };

  const requireSelection = () => {
    if (selectedOrders.length === 0) {
      showToast('error', 'Please select shipments using checkboxes first.');
      return false;
    }
    return true;
  };

  const handleBulkShip = () => {
    if (!requireSelection()) return;
    showToast('success', `${selectedOrders.length} shipment(s) queued for pickup successfully!`);
    setSelectedOrders([]);
  };

  const handleUpdatePackageDetails = () => {
    if (!requireSelection()) return;
    showToast('success', `Package details update requested for ${selectedOrders.length} shipment(s).`);
  };

  const handleUpdatePickupAddress = () => {
    if (!requireSelection()) return;
    showToast('success', `Pickup address update requested for ${selectedOrders.length} shipment(s).`);
  };

  const handleVerifyOrders = () => {
    if (!requireSelection()) return;
    showToast('success', `${selectedOrders.length} order(s) marked as verified!`);
    setSelectedOrders([]);
  };

  const handleDownloadInvoices = () => {
    if (!requireSelection()) return;
    showToast('success', `Downloading invoices for ${selectedOrders.length} shipment(s)...`);
  };

  const handleBulkDelete = () => {
    if (!requireSelection()) return;
    setShippingList(prev => prev.filter(item => !selectedOrders.includes(item.awb)));
    showToast('success', `${selectedOrders.length} shipment(s) deleted successfully!`);
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
    link.setAttribute("download", `${type}_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('success', `${type.toUpperCase()} records exported successfully!`);
    setShowShippingActionMenu(false);
    setShowPassbookActionMenu(false);
    setShowRechargeActionMenu(false);
    setShowInvoiceActionMenu(false);
  };


  const handleDownloadInvoice = (invoice: any) => {
    if (invoice.invoiceUrl) {
      window.open(invoice.invoiceUrl, '_blank', 'noopener,noreferrer');
      showToast('success', 'Opening invoice PDF…');
    } else {
      showToast('error', 'Invoice PDF not available yet.');
    }
  };

  const handleDownloadExcel = async (invoice: any) => {
    try {
      const res = await apiClient.get('/invoice/export-excel', {
        params: { invoiceNumber: invoice.invoiceNumber },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${invoice.invoiceNumber}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('success', 'Excel downloaded!');
    } catch {
      showToast('error', 'Failed to download Excel.');
    }
  };

  const handleBulkDownloadPDF = () => {
    if (selectedInvoiceOrders.length === 0) { showToast('error', 'Select at least one invoice.'); return; }
    const urls = selectedInvoiceOrders
      .map(num => filteredInvoicesData.find((inv: any) => inv.invoiceNumber === num)?.invoiceUrl)
      .filter(Boolean);
    if (urls.length === 0) { showToast('error', 'No PDF URLs available for selected invoices.'); return; }
    urls.forEach((url: string) => window.open(url, '_blank', 'noopener,noreferrer'));
    showToast('success', `Opening ${urls.length} invoice PDF(s)…`);
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
      <div className={`flex flex-col ${isImpersonating ? 'h-[calc(100vh-104px)] md:h-[calc(100vh-104px)]' : 'h-[calc(100vh-72px)] md:h-[calc(100vh-72px)]'} -m-4 md:-m-6 bg-white ${!isAdminView ? 'overflow-hidden' : ''}`}>
        <div className="bg-white relative z-50 shrink-0">
          {/* Mobile Search Bar */}
          <div className="md:hidden px-3 py-2.5 border-b border-[#E2E8F0] flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder={
                  activeTab === 'Shipping' ? 'AWB/Order ID tracking' :
                    activeTab === 'Passbook' ? 'Search by name, email, or AWB' :
                      activeTab === 'Wallet Recharge' ? 'Search by name, email, or txn ID' :
                        'Search by name, email, or invoice no.'
                }
                value={
                  activeTab === 'Shipping' ? searchTerm :
                    activeTab === 'Passbook' ? passbookSearchTerm :
                      activeTab === 'Wallet Recharge' ? rechargeSearchTerm :
                        invoiceSearchTerm
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (activeTab === 'Shipping') setSearchTerm(val);
                  else if (activeTab === 'Passbook') setPassbookSearchTerm(val);
                  else if (activeTab === 'Wallet Recharge') setRechargeSearchTerm(val);
                  else setInvoiceSearchTerm(val);
                }}
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10 transition-all"
              />
            </div>
            {/* Filter icon */}
            <button
              onClick={() => setIsMobileFiltersOpen(true)}
              className="w-9 h-9 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#475569] bg-white shrink-0"
            >
              <Filter className="w-4 h-4" />
            </button>
            {/* Action icon + per-tab dropdowns */}
            <div className="relative action-dropdown-container shrink-0">
              {(() => {
                const count = activeTab === 'Shipping' ? selectedOrders.length :
                  activeTab === 'Passbook' ? selectedPassbookOrders.length :
                  activeTab === 'Wallet Recharge' ? selectedRechargeOrders.length :
                  selectedInvoiceOrders.length;
                const hasSelection = count > 0;
                return (
                  <button
                    onClick={() => {
                      if (!hasSelection) return;
                      if (activeTab === 'Shipping') setShowShippingActionMenu(v => !v);
                      else if (activeTab === 'Passbook') setShowPassbookActionMenu(v => !v);
                      else if (activeTab === 'Wallet Recharge') setShowRechargeActionMenu(v => !v);
                      else setShowInvoiceActionMenu(v => !v);
                    }}
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center bg-white relative transition-colors ${hasSelection ? 'border-[#00A86B] text-[#00A86B]' : 'border-[#E2E8F0] text-[#CBD5E1] opacity-50 cursor-not-allowed'}`}
                  >
                    <MoreVertical className="w-4 h-4" />
                    {hasSelection && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-[#00A86B] text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })()}

              {activeTab === 'Shipping' && showShippingActionMenu && (
                <div className="absolute right-0 top-full mt-2 w-[200px] bg-white rounded-xl shadow-[0_8px_28px_-6px_rgba(0,0,0,0.15)] border border-[#E2E8F0] py-1.5 z-[200]">
                  <button
                    onClick={() => { handleExportData('shipping', filteredShippingData); setShowShippingActionMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                  >
                    Export Excel/CSV
                  </button>
                </div>
              )}
              {activeTab === 'Passbook' && showPassbookActionMenu && (
                <div className="absolute right-0 top-full mt-2 w-[200px] bg-white rounded-xl shadow-[0_8px_28px_-6px_rgba(0,0,0,0.15)] border border-[#E2E8F0] py-1.5 z-[200]">
                  <button
                    onClick={() => { handleExportData('passbook', filteredPassbookData); setShowPassbookActionMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                  >
                    Export Passbook (CSV)
                  </button>
                </div>
              )}
              {activeTab === 'Wallet Recharge' && showRechargeActionMenu && (
                <div className="absolute right-0 top-full mt-2 w-[200px] bg-white rounded-xl shadow-[0_8px_28px_-6px_rgba(0,0,0,0.15)] border border-[#E2E8F0] py-1.5 z-[200]">
                  <button
                    onClick={() => { handleExportData('recharge', filteredWalletRechargeData); setShowRechargeActionMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                  >
                    Export Recharge History
                  </button>
                </div>
              )}
              {activeTab === 'Invoices' && showInvoiceActionMenu && (
                <div className="absolute right-0 top-full mt-2 w-[200px] bg-white rounded-xl shadow-[0_8px_28px_-6px_rgba(0,0,0,0.15)] border border-[#E2E8F0] py-1.5 z-[200]">
                  <button
                    onClick={() => { handleExportData('invoice', filteredInvoicesData); setShowInvoiceActionMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                  >
                    Export Invoice List
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Top Header Row — Tabs */}
          <div className="flex justify-between items-center px-4 md:px-6 py-2 border-b border-[#E2E8F0] bg-white">
            <div className="flex gap-1 items-center min-w-0 bg-[#F7FEFC] rounded-full p-1.5">
              <div className="flex gap-1 items-center overflow-x-auto no-scrollbar flex-1 min-w-0">
                {MAIN_TABS.map((tab) => (
                  <button
                    key={tab.name}
                    onClick={() => setActiveTab(tab.name)}
                    ref={(el) => { if (el && activeTab === tab.name) el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }}
                    className={`relative px-4 py-2 text-[14px] md:text-[13px] font-semibold md:font-bold transition-colors whitespace-nowrap rounded-full flex items-center gap-1.5 cursor-pointer ${activeTab === tab.name ? 'text-[#00A86B] underline underline-offset-4 decoration-2' : 'text-[#64748B] hover:text-[#0F172A]'
                      }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>
              <ChevronRight className="md:hidden w-4 h-4 text-[#94A3B8] shrink-0" />
            </div>

            <div className="hidden md:flex items-center gap-3 shrink-0 ml-4">
              <button
                onClick={handleRefresh}
                className="w-8 h-8 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC]"
                disabled={isLoading}
              >
                <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#00A86B]' : ''}`} />
              </button>
            </div>
          </div>

          {activeTab === 'Shipping' && (
            <>
              {/* Desktop Filters Row */}
              <div className="hidden md:flex py-3 px-6 border-b border-[#CBD5F5] flex-wrap items-center gap-3 bg-[#F8FAFC]/50">
                <input
                  type="text"
                  placeholder="Search by name, email, o..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glass-search-input w-[180px] shrink-0"
                />

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
                  className="glass-search-input w-32 shrink-0"
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
                  onDateChange={onShippingDateChange}
                />

                <button
                  onClick={() => { setShippingPage(1); fetchShippingData(1); showToast('success', 'Shipping filters applied successfully!'); }}
                  className="py-2 px-4 shrink-0 rounded-[32px] bg-[#009D64] border border-[#009D64] text-white text-xs font-medium leading-[18px] hover:bg-[#008a57] transition-colors cursor-pointer"
                >
                  Apply Filters
                </button>

                {hasShippingFilters && (
                  <button onClick={clearShippingFilters}
                    className="py-2 px-4 shrink-0 rounded-[32px] border border-red-200 text-red-500 text-xs font-medium leading-[18px] hover:bg-red-50 transition-colors cursor-pointer">
                    Clear All
                  </button>
                )}

                <div className="relative shrink-0 ml-auto flex items-center gap-2">
                  <div className="relative action-dropdown-container">
                    <button
                      onClick={() => selectedOrders.length > 0 && setShowShippingActionMenu(!showShippingActionMenu)}
                      disabled={selectedOrders.length === 0}
                      className={`py-2 pl-4 pr-8 rounded-[32px] border text-xs leading-[18px] flex items-center font-medium relative transition-colors ${selectedOrders.length === 0 ? 'border-[#E2E8F0] bg-[#F8FAFC] text-[#CBD5E1] cursor-not-allowed' : 'border-[#03C27D] bg-white text-[#64748B] hover:bg-[#F0FDF9] cursor-pointer'}`}
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
                  <button
                    onClick={() => setIsRechargeModalOpen(true)}
                    aria-label="Recharge Wallet"
                    className="w-9 h-9 rounded-[80px] border border-[#03C27D] flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105 bg-[#009D64]"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </>
          )}

          {activeTab === 'Passbook' && (
            <>
              {/* Desktop Filters Row */}
              <div className="hidden md:flex py-3 px-6 border-b border-[#CBD5F5] flex-wrap items-center gap-3 bg-[#F8FAFC]/50">
                <input
                  type="text"
                  placeholder="Search by name, email, o..."
                  value={passbookSearchTerm}
                  onChange={(e) => setPassbookSearchTerm(e.target.value)}
                  className="glass-search-input w-[180px] shrink-0"
                />

                <input
                  type="text"
                  placeholder="Order ID"
                  value={passbookOrderId}
                  onChange={(e) => setPassbookOrderId(e.target.value)}
                  className="glass-search-input w-32 shrink-0"
                />

                <input
                  type="text"
                  placeholder="AWB Number"
                  value={passbookAwb}
                  onChange={(e) => setPassbookAwb(e.target.value)}
                  className="glass-search-input w-32 shrink-0"
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
                  onDateChange={onPassbookDateChange}
                />

                <button
                  onClick={() => { setPassbookPage(1); fetchPassbookData(1); showToast('success', 'Passbook filters applied successfully!'); }}
                  className="py-2 px-4 shrink-0 rounded-[32px] bg-[#009D64] border border-[#009D64] text-white text-xs font-medium leading-[18px] hover:bg-[#008a57] transition-colors cursor-pointer"
                >
                  Apply Filters
                </button>

                {hasPassbookFilters && (
                  <button onClick={clearPassbookFilters}
                    className="py-2 px-4 shrink-0 rounded-[32px] border border-red-200 text-red-500 text-xs font-medium leading-[18px] hover:bg-red-50 transition-colors cursor-pointer">
                    Clear All
                  </button>
                )}

                <div className="relative shrink-0 ml-auto flex items-center gap-2">
                  <div className="relative action-dropdown-container">
                    <button
                      onClick={() => selectedPassbookOrders.length > 0 && setShowPassbookActionMenu(!showPassbookActionMenu)}
                      disabled={selectedPassbookOrders.length === 0}
                      className={`py-2 pl-4 pr-8 rounded-[32px] border text-xs leading-[18px] flex items-center font-medium relative transition-colors ${selectedPassbookOrders.length === 0 ? 'border-[#E2E8F0] bg-[#F8FAFC] text-[#CBD5E1] cursor-not-allowed' : 'border-[#03C27D] bg-white text-[#64748B] hover:bg-[#F0FDF9] cursor-pointer'}`}
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
                  <button
                    onClick={() => setIsRechargeModalOpen(true)}
                    aria-label="Recharge Wallet"
                    className="w-9 h-9 rounded-[80px] border border-[#03C27D] flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105 bg-[#009D64]"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'Wallet Recharge' && (
            <>
              {/* Desktop Filters Row */}
              <div className="hidden md:flex py-3 px-6 border-b border-[#CBD5F5] flex-wrap items-center gap-3 bg-[#F8FAFC]/50">
                <input
                  type="text"
                  placeholder="Search by name, email, o..."
                  value={rechargeSearchTerm}
                  onChange={(e) => setRechargeSearchTerm(e.target.value)}
                  className="glass-search-input w-[180px] shrink-0"
                />

                <input
                  type="text"
                  placeholder="Transaction ID"
                  value={rechargeTxnId}
                  onChange={(e) => setRechargeTxnId(e.target.value)}
                  className="glass-search-input w-36 shrink-0"
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
                  onDateChange={onRechargeDateChange}
                />

                <button
                  onClick={() => { setRechargePage(1); fetchRechargeData(1); showToast('success', 'Wallet Recharge filters applied successfully!'); }}
                  className="py-2 px-4 shrink-0 rounded-[32px] bg-[#009D64] border border-[#009D64] text-white text-xs font-medium leading-[18px] hover:bg-[#008a57] transition-colors cursor-pointer"
                >
                  Apply Filters
                </button>

                {hasRechargeFilters && (
                  <button onClick={clearRechargeFilters}
                    className="py-2 px-4 shrink-0 rounded-[32px] border border-red-200 text-red-500 text-xs font-medium leading-[18px] hover:bg-red-50 transition-colors cursor-pointer">
                    Clear All
                  </button>
                )}

                <div className="relative shrink-0 ml-auto flex items-center gap-2">
                  <div className="relative action-dropdown-container">
                    <button
                      onClick={() => selectedRechargeOrders.length > 0 && setShowRechargeActionMenu(!showRechargeActionMenu)}
                      disabled={selectedRechargeOrders.length === 0}
                      className={`py-2 pl-4 pr-8 rounded-[32px] border text-xs leading-[18px] flex items-center font-medium relative transition-colors ${selectedRechargeOrders.length === 0 ? 'border-[#E2E8F0] bg-[#F8FAFC] text-[#CBD5E1] cursor-not-allowed' : 'border-[#03C27D] bg-white text-[#64748B] hover:bg-[#F0FDF9] cursor-pointer'}`}
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
                  <button
                    onClick={() => setIsRechargeModalOpen(true)}
                    aria-label="Recharge Wallet"
                    className="w-9 h-9 rounded-[80px] border border-[#03C27D] flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105 bg-[#009D64]"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </>
          )}

          {activeTab === 'Invoices' && (
            <>
              {/* Desktop Filters Row */}
              <div className="hidden md:flex py-3 px-6 border-b border-[#CBD5F5] flex-wrap items-center gap-3 bg-[#F8FAFC]/50">
                <input
                  type="text"
                  placeholder="Search by name, email, o..."
                  value={invoiceSearchTerm}
                  onChange={(e) => setInvoiceSearchTerm(e.target.value)}
                  className="glass-search-input w-[180px] shrink-0"
                />

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
                  onDateChange={onInvoiceDateChange}
                />

                <button
                  onClick={() => { setInvoicePage(1); fetchInvoiceData(1); showToast('success', 'Invoice filters applied successfully!'); }}
                  className="py-2 px-4 shrink-0 rounded-[32px] bg-[#009D64] border border-[#009D64] text-white text-xs font-medium leading-[18px] hover:bg-[#008a57] transition-colors cursor-pointer"
                >
                  Apply Filters
                </button>

                {hasInvoiceFilters && (
                  <button onClick={clearInvoiceFilters}
                    className="py-2 px-4 shrink-0 rounded-[32px] border border-red-200 text-red-500 text-xs font-medium leading-[18px] hover:bg-red-50 transition-colors cursor-pointer">
                    Clear All
                  </button>
                )}

                <div className="relative shrink-0 ml-auto flex items-center gap-2">
                  <div className="relative action-dropdown-container">
                    <button
                      onClick={() => selectedInvoiceOrders.length > 0 && setShowInvoiceActionMenu(!showInvoiceActionMenu)}
                      disabled={selectedInvoiceOrders.length === 0}
                      className={`py-2 pl-4 pr-8 rounded-[32px] border text-xs leading-[18px] flex items-center font-medium relative transition-colors ${selectedInvoiceOrders.length === 0 ? 'border-[#E2E8F0] bg-[#F8FAFC] text-[#CBD5E1] cursor-not-allowed' : 'border-[#03C27D] bg-white text-[#64748B] hover:bg-[#F0FDF9] cursor-pointer'}`}
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
                          onClick={() => { handleBulkDownloadPDF(); setShowInvoiceActionMenu(false); }}
                          className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                        >
                          Download Selected PDF
                        </button>
                      </div>
                    )}
                  </div>
                  {isAdminView && (
                    <button
                      onClick={() => setIsRechargeModalOpen(true)}
                      aria-label="Recharge Wallet"
                      className="w-9 h-9 rounded-[80px] border border-[#03C27D] flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105 bg-[#009D64]"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

            </>
          )}
        </div>

        {/* Table Section */}
        <div className="bg-white flex flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0] relative">
          {isLoading && <TableLoader />}

          {activeTab === 'Shipping' && (
            <>
              {selectedOrders.length > 0 && (
                <div className="hidden md:flex px-4 py-2 bg-blue-50 border-b border-blue-100 items-center gap-3 animate-fade-in">
                  <span className="text-xs font-bold text-blue-700">{selectedOrders.length} selected</span>
                </div>
              )}

              {/* Desktop Table */}
              <div className="hidden md:block flex-1 overflow-y-auto overflow-x-hidden w-full relative">
                <table className="w-full text-left border-collapse min-w-full">
                  <thead className="sticky top-0 z-20 bg-[#E6F9F2] shadow-sm">
                    <tr className="text-xs leading-[18px] font-medium text-[#64748B] uppercase tracking-wider border border-[#B9EFDB]">
                      <th className="py-2 px-4 w-10 text-left align-middle rounded-l-lg">
                        <input type="checkbox" checked={selectedOrders.length === filteredShippingData.length && filteredShippingData.length > 0} onChange={toggleAll} className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                      </th>
                      {isAdminView && (
                        <th className="py-2 px-4 text-left align-middle whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 shrink-0" />
                            <span>User Details</span>
                          </div>
                        </th>
                      )}
                      <th className="py-2 px-4 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 shrink-0" />
                          <span>Order Details</span>
                        </div>
                      </th>
                      <th className="py-2 px-4 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 shrink-0" />
                          <span>Shipping Details</span>
                        </div>
                      </th>
                      <th className="py-2 px-4 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Banknote className="w-3.5 h-3.5 shrink-0" />
                          <span>Status</span>
                        </div>
                      </th>
                      <th className="py-2 px-4 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 shrink-0" />
                          <span>Initial Weight</span>
                        </div>
                      </th>
                      <th className="py-2 px-4 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 shrink-0" />
                          <span>Courier Weight</span>
                        </div>
                      </th>
                      <th className="py-2 px-4 text-center align-middle whitespace-nowrap rounded-r-lg">
                        <div className="flex items-center justify-center gap-1">
                          <Settings className="w-3.5 h-3.5 shrink-0" />
                          <span>Actions</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] text-[#475569]">
                    {paginatedShippingData.map((order, idx) => (
                      <tr key={order.awb} className={`border-b border-[#E2E8F0] transition-colors group ${idx % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'}`}>
                        <td className="p-4">
                          <input type="checkbox" checked={selectedOrders.includes(order.awb)} onChange={() => toggleSelect(order.awb)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                        </td>
                        {isAdminView && (
                          <td className="p-4">
                            {renderCopyable(order.userId, 'User ID', "text-[12px] font-semibold font-sans text-[#00A86B] cursor-pointer hover:underline uppercase")}
                            <TruncatedText text={order.userName} maxLength={20} className="text-[14px] font-semibold font-sans text-[#0F172A] mt-0.5 max-w-[160px]" />
                            <TruncatedText text={order.userEmail} maxLength={25} className="text-[12px] font-normal font-sans text-[#94A3B8] max-w-[180px]" />
                          </td>
                        )}
                        <td className="p-4">
                          {renderCopyable(order.id, 'Order ID', "text-[12px] font-semibold font-sans text-[#00A86B] cursor-pointer hover:underline uppercase", () => navigate(`${isAdminView ? '/admin' : '/user'}/order-tracking?id=${order.id}`))}
                          <div className="table-date mt-0.5">{order.date}</div>
                          <span className="px-2 py-0.5 rounded-full border border-blue-200 text-[#004AAD] font-semibold text-[10px] leading-4 bg-blue-50/50 inline-block w-fit mt-0.5">{order.paymentMethod}</span>
                        </td>
                        <td className="p-4">
                          <div className="text-xs font-semibold text-[#00A86B]">{order.courier}</div>
                          <div className="table-date mt-0.5">Booked On : {order.bookedDate}</div>
                          {renderCopyable(order.awb, 'AWB', "text-[12px] font-semibold font-sans text-[#00A86B] cursor-pointer hover:underline mt-0.5", () => navigate(`${isAdminView ? '/admin' : '/user'}/tracking?awb=${order.awb}`))}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <div className="text-[12px] font-normal font-sans text-[#0F172A]">₹{order.statusAmount}</div>
                            {order.priceBreakup && (
                              <div
                                className="cursor-help shrink-0"
                                onMouseEnter={(e) => {
                                  if (pricePopupTimerRef.current) clearTimeout(pricePopupTimerRef.current);
                                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                  const dir = rect.top < window.innerHeight * 0.4 ? 'bottom' : 'top';
                                  setPricePopupPos({ x: rect.left + rect.width / 2, y: dir === 'top' ? rect.top - 10 : rect.bottom + 10, dir, order });
                                }}
                                onMouseLeave={() => { pricePopupTimerRef.current = setTimeout(() => setPricePopupPos(null), 150); }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-[#00A86B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01" strokeLinecap="round"/></svg>
                              </div>
                            )}
                          </div>
                          <span className={getStatusBadgeClass(order.status)}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-normal text-[#64748B]">
                          <div className="text-[#0F172A] font-medium">{order.initialWeight}</div>
                          <div className="mt-0.5">{order.initialDimensions}</div>
                          <div className="mt-0.5">{order.initialVol}</div>
                        </td>
                        <td className="p-4 text-xs font-normal text-[#64748B]">
                          <div className="text-[#0F172A] font-medium">{order.courierWeight}</div>
                          <div className="mt-0.5">{order.courierDimensions}</div>
                          <div className="mt-0.5">{order.courierVol}</div>
                        </td>
                        <td className="p-4 text-center align-middle">
                          <button
                            onClick={() => {
                              setPassbookAwb(order.awb);
                              setActiveTab('Passbook');
                            }}
                            className="px-3 py-1.5 rounded-full bg-[#1E3A8A] text-white text-[10px] font-semibold font-sans hover:bg-[#1E3A8A]/90 transition-colors mx-auto inline-block"
                          >
                            History
                          </button>
                        </td>
                      </tr>
                    ))}
                    {paginatedShippingData.length === 0 && (
                      <tr>
                        <td colSpan={isAdminView ? 8 : 7}>
                          <EmptyState title="No shipping records found" />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Shipping Pagination — Desktop */}
              <div className="hidden md:block">
                {totalShippingPages > 0 && (
                  <DesktopPagination
                    page={shippingPage}
                    setPage={setShippingPage}
                    totalPages={totalShippingPages}
                    rowsPerPage={shippingItemsPerPage}
                    setRowsPerPage={handleShippingItemsPerPage}
                    startIndex={shippingStartIndex}
                    endIndex={shippingEndIndex}
                    totalItems={shippingTotal}
                  />
                )}
              </div>

              {/* Mobile Card Layout */}
              <div className="md:hidden flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto">
                {paginatedShippingData.length === 0 ? (
                  <EmptyState title="No shipping records found" />
                ) : (
                  <div className="p-3 space-y-3 bg-[#F8FAFC]">
                    {paginatedShippingData.map((order) => {
                      const isPaid = order.status === 'Paid';
                      const accent = isPaid ? '#00A86B' : '#F59E0B';
                      return (
                        <div key={order.awb} className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                          {/* Ribbon Tag */}
                          <div
                            className="absolute top-0 left-0 px-3.5 py-1 text-[10px] font-bold text-white uppercase tracking-wide"
                            style={{ background: accent, clipPath: 'polygon(0 0, 100% 0, 84% 100%, 0% 100%)' }}
                          >
                            {isPaid ? 'Paid' : 'Ready To Ship'}
                          </div>
                          <div className="absolute top-1.5 right-2">
                            <input type="checkbox" checked={selectedOrders.includes(order.awb)} onChange={() => toggleSelect(order.awb)} className="rounded border-gray-300 accent-[#00A86B] w-4 h-4" />
                          </div>

                          <div className="pt-7 px-3 pb-3">
                            {/* User Details Row */}
                            {isAdminView && (
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[#64748B] font-medium text-[12px] font-sans">User Details</span>
                                <span className="text-[12px] font-sans inline-flex items-baseline gap-1 max-w-[180px]">
                                  <span className="font-semibold text-[#0F172A] text-[12px] truncate">{(order.userName || '—').split(' ')[0]}</span>
                                  <span className="text-[#64748B] font-semibold shrink-0">({order.userId || '—'})</span>
                                </span>
                              </div>
                            )}

                            {/* Courier & Order Card */}
                            <div className="rounded-xl p-2.5 mb-2 bg-white" style={{ border: `1px solid ${accent}` }}>
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div className="w-10 h-10 bg-white border border-[#E2E8F0] rounded-xl flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-sm">
                                    <img src={getCourierLogo(order.courier)} alt={order.courier} className="w-full h-full object-contain" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[12px] font-normal text-[#0F172A] font-sans truncate">{order.courier} 2KG</div>
                                    <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
                                      <span
                                        className="text-[12px] font-semibold text-[#00A86B] font-sans truncate active:opacity-60"
                                        title={order.awb}
                                        onClick={(e) => { e.stopPropagation(); navigate(`${isAdminView ? '/admin' : '/user'}/tracking?awb=${order.awb}`); }}
                                      >
                                        {order.awb}
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          copyToClipboard(order.awb, 'AWB');
                                        }}
                                        className="shrink-0 focus:outline-none"
                                        title="Copy AWB"
                                      >
                                        <Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-[12px] font-normal text-[#00A86B] font-sans shrink-0 ml-2">₹{order.statusAmount}</div>
                              </div>
                            </div>

                            {/* Weight & Dimensions */}
                            <div className="flex items-center justify-between mb-2 px-1">
                              <span className="text-[11px] font-medium text-[#64748B] font-sans">Ent. Wt & Dim:</span>
                              <span className="text-[12px] font-medium text-[#0F172A] font-sans">1.2 Kg | 20×15×20 cm</span>
                            </div>

                            {/* Weight / Freight Row */}
                            <div className="flex items-center justify-between bg-[#F8FAFC] rounded-xl px-3 py-2 mb-2">
                              <div className="text-center">
                                <div className="text-[12px] font-normal text-[#94A3B8] uppercase tracking-wider font-sans">AWB Wt.</div>
                                <div className="text-[12px] font-medium text-[#0F172A] mt-0.5 font-sans">1.200 Kg</div>
                              </div>
                              <div className="text-right">
                                <div className="text-[12px] font-normal text-[#94A3B8] uppercase tracking-wider font-sans">Total Freight</div>
                                <div className="flex items-center gap-1 mt-0.5 justify-end">
                                  <div className="text-[12px] font-medium text-[#0F172A] font-sans">₹{order.statusAmount}</div>
                                  {order.priceBreakup && (
                                    <button onClick={(e) => { e.stopPropagation(); setMobilePricePopupOrder(order); }} className="text-[#00A86B] flex items-center justify-center cursor-pointer focus:outline-none">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01" strokeLinecap="round"/></svg>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* History Button */}
                            <button
                              onClick={() => {
                                setPassbookAwb(order.awb);
                                setActiveTab('Passbook');
                              }}
                              className="w-full py-2.5 rounded-xl bg-[#1E3A8A] text-white text-[12px] font-medium text-center hover:bg-[#1E3A8A]/90 transition-colors font-sans"
                            >
                              History
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                </div>
                {/* Mobile Pagination */}
                {<MobilePaginationBar {...({
                  page: shippingPage,
                  setPage: setShippingPage,
                  totalPages: totalShippingPages,
                  rowsPerPage: shippingItemsPerPage,
                  setRowsPerPage: handleShippingItemsPerPage,
                  startIndex: shippingStartIndex,
                  endIndex: shippingEndIndex,
                  totalItems: shippingTotal,
                })} />}
              </div>
            </>
          )}

          {activeTab === 'Passbook' && (
            <>
              {selectedPassbookOrders.length > 0 && (
                <div className="hidden md:flex px-4 py-2 bg-blue-50 border-b border-blue-100 items-center gap-3 animate-fade-in">
                  <span className="text-xs font-bold text-blue-700">{selectedPassbookOrders.length} selected</span>
                  <button
                    onClick={() => handleExportData('passbook', filteredPassbookData.filter(o => selectedPassbookOrders.includes(o.awb)))}
                    className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm ml-auto hover:bg-blue-100"
                  >
                    Export Selected
                  </button>
                </div>
              )}

              {/* Desktop Passbook Table */}
              <div className="hidden md:block flex-1 overflow-y-auto overflow-x-hidden w-full relative">
                <table className="w-full text-left border-collapse min-w-full">
                  <thead className="sticky top-0 z-20 bg-[#E6F9F2] shadow-sm">
                    <tr className="text-xs leading-[18px] font-medium text-[#64748B] uppercase tracking-wider border border-[#B9EFDB]">
                      <th className="py-2 px-4 w-10 text-left align-middle rounded-l-lg">
                        <input type="checkbox" checked={selectedPassbookOrders.length === filteredPassbookData.length && filteredPassbookData.length > 0} onChange={toggleAllPassbook} className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                      </th>
                      {isAdminView && (
                        <th className="py-2 px-4 text-left align-middle whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 shrink-0" />
                            <span>User</span>
                          </div>
                        </th>
                      )}
                      <th className="py-2 px-4 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>Date / Time</span>
                        </div>
                      </th>
                      <th className="py-2 px-4 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 shrink-0" />
                          <span>Shipment</span>
                        </div>
                      </th>
                      <th className="py-2 px-4 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span>Category</span>
                        </div>
                      </th>
                      <th className="py-2 px-4 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Banknote className="w-3.5 h-3.5 shrink-0" />
                          <span>Amount</span>
                        </div>
                      </th>
                      <th className="py-2 px-4 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Wallet className="w-3.5 h-3.5 shrink-0" />
                          <span>Balance</span>
                        </div>
                      </th>
                      <th className="py-2 px-4 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span>Description</span>
                        </div>
                      </th>
                      {isAdminView && (
                        <th className="py-2 px-4 text-center align-middle whitespace-nowrap rounded-r-lg">
                          <div className="flex items-center justify-center gap-1">
                            <Settings className="w-3.5 h-3.5 shrink-0" />
                            <span>Actions</span>
                          </div>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="text-[11px] text-[#475569]">
                    {paginatedPassbookData.map((order, idx) => (
                      <tr key={order.awb} className={`border-b border-[#E2E8F0] transition-colors group ${idx % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'}`}>
                        <td className="p-4">
                          <input type="checkbox" checked={selectedPassbookOrders.includes(order.awb)} onChange={() => toggleSelectPassbook(order.awb)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                        </td>
                        {isAdminView && (
                          <td className="p-4">
                            <div className="text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline">{order.userId}</div>
                            <div className="text-sm font-semibold text-[#0F172A] mt-0.5">{order.userName}</div>
                            <div className="text-[11px] text-[#94A3B8]">{order.userEmail}</div>
                          </td>
                        )}
                        <td className="p-4">
                          {renderCopyable(order.id, 'Order ID', "text-[12px] font-semibold font-sans text-[#00A86B] cursor-pointer hover:underline uppercase", () => navigate(`${isAdminView ? '/admin' : '/user'}/order-tracking?id=${order.id}`))}
                          <div className="table-date mt-0.5">{order.date}</div>
                          <div className="table-date mt-0.5">{order.day}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-[12px] font-semibold text-[#0F172A] font-sans">{order.courier || '—'}</div>
                          {order.awb && order.awb !== 'N/A' && (
                            <div className="flex items-center gap-1 group/copy mt-0.5">
                              <div className="text-[12px] font-semibold text-[#00A86B] cursor-pointer hover:text-[#009B63] font-sans underline" onClick={() => navigate(`${isAdminView ? '/admin' : '/user'}/tracking?awb=${order.awb}`)}>{order.awb}</div>
                              <button onClick={(e) => { e.stopPropagation(); copyToClipboard(order.awb, 'AWB'); }} className="opacity-100 md:opacity-0 md:group-hover/copy:opacity-100 transition-opacity shrink-0 focus:outline-none" title="Copy AWB"><Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" /></button>
                            </div>
                          )}
                          {order.bookedDate && (
                            <div className="text-[11px] text-[#94A3B8] font-sans">{order.bookedDate}</div>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={getStatusBadgeClass(order.category)}>
                            {order.category}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <div className={`text-[12px] font-normal font-sans ${order.category === 'Debit' ? 'text-red-500' : 'text-green-500'}`}>₹{order.amount.toFixed(2)}</div>
                            {order.category === 'Debit' && order.priceBreakup && (
                              <div
                                className="cursor-help shrink-0"
                                onMouseEnter={(e) => {
                                  if (pricePopupTimerRef.current) clearTimeout(pricePopupTimerRef.current);
                                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                  const dir = rect.top < window.innerHeight * 0.4 ? 'bottom' : 'top';
                                  setPricePopupPos({ x: rect.left + rect.width / 2, y: dir === 'top' ? rect.top - 10 : rect.bottom + 10, dir, order });
                                }}
                                onMouseLeave={() => { pricePopupTimerRef.current = setTimeout(() => setPricePopupPos(null), 150); }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-[#00A86B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01" strokeLinecap="round"/></svg>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-[#64748B] text-[12px] font-normal font-sans">₹{order.balance.toFixed(2)}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-[#64748B] text-[12px] font-normal font-sans">{order.description}</div>
                        </td>
                        {isAdminView && (
                          <td className="p-4 text-center align-middle">
                            {order.category === 'Debit' ? (
                              <button
                                onClick={() => handleReverseTransaction(order)}
                                title="Reverse Transaction"
                                className="w-7 h-7 rounded-full bg-[#FEF2F2] flex items-center justify-center text-[#EF4444] hover:bg-[#FEE2E2] transition-colors mx-auto"
                              >
                                <RefreshCcw className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <div className="w-7 mx-auto" />
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                    {paginatedPassbookData.length === 0 && (
                      <tr>
                        <td colSpan={isAdminView ? 10 : 8}>
                          <EmptyState title="No passbook records found" />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Desktop Passbook Pagination */}
              <div className="hidden md:block">
                {totalPassbookPages > 0 && (
                  <DesktopPagination
                    page={passbookPage}
                    setPage={setPassbookPage}
                    totalPages={totalPassbookPages}
                    rowsPerPage={passbookItemsPerPage}
                    setRowsPerPage={handlePassbookItemsPerPage}
                    startIndex={passbookStartIndex}
                    endIndex={passbookEndIndex}
                    totalItems={passbookTotal}
                  />
                )}
              </div>

              {/* Mobile Passbook Card Layout */}
              <div className="md:hidden flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto">
                {passbookAwb && (
                  <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-700">Filtered by AWB: <span className="font-bold">{passbookAwb}</span></span>
                    <button
                      onClick={() => setPassbookAwb('')}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold underline"
                    >
                      Clear Filter
                    </button>
                  </div>
                )}

                {paginatedPassbookData.length === 0 ? (
                  <EmptyState title="No passbook records found" />
                ) : (
                  <div className="p-3 space-y-3 bg-[#F8FAFC]">
                    {paginatedPassbookData.map((order) => {
                      const isDebit = order.category === 'Debit';
                      const accent = isDebit ? '#EF4444' : '#00A86B';
                      return (
                        <div key={order.awb} className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                          {/* Ribbon Tag */}
                          <div
                            className="absolute top-0 left-0 px-3.5 py-1 text-[10px] font-bold text-white uppercase tracking-wide"
                            style={{ background: accent, clipPath: 'polygon(0 0, 100% 0, 84% 100%, 0% 100%)' }}
                          >
                            {order.category}
                          </div>
                          <div className="absolute top-1.5 right-2">
                            <input
                              type="checkbox"
                              checked={selectedPassbookOrders.includes(order.awb)}
                              onChange={() => toggleSelectPassbook(order.awb)}
                              className="rounded border-gray-300 accent-[#00A86B] w-4 h-4"
                            />
                          </div>

                          <div className="pt-7 px-3 pb-3">
                            {/* User Info */}
                            {isAdminView && (
                              <div className="flex justify-between items-center text-[12px] mb-2">
                                <span className="text-[#64748B] font-medium text-[12px] font-sans">User Details</span>
                                <span className="text-[12px] font-sans inline-flex items-baseline gap-1 max-w-[180px]">
                                  <span className="font-semibold text-[#0F172A] text-[12px] truncate">{(order.userName || '—').split(' ')[0]}</span>
                                  <span className="text-[#94A3B8] font-semibold shrink-0">({order.userId || '—'})</span>
                                </span>
                              </div>
                            )}

                            {/* Courier Card */}
                            {order.awb && order.awb !== 'N/A' && (
                            <div className="rounded-xl p-2.5 mb-2 bg-white" style={{ border: `1px solid ${accent}` }}>
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-9 h-9 bg-white border border-[#E2E8F0] rounded-xl flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-sm">
                                    <img src={getCourierLogo(order.courier)} alt={order.courier} className="w-full h-full object-contain" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[12px] font-normal text-[#0F172A] truncate font-sans">{order.courier} 2KG</div>
                                    {order.awb !== 'N/A' && (
                                      <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
                                        <span className="text-[12px] font-semibold text-[#00A86B] underline truncate font-sans cursor-pointer active:opacity-60" onClick={(e) => { e.stopPropagation(); navigate(`${isAdminView ? '/admin' : '/user'}/tracking?awb=${order.awb}`); }}>{order.awb}</span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            copyToClipboard(order.awb, 'AWB');
                                          }}
                                          className="shrink-0 focus:outline-none"
                                          title="Copy AWB"
                                        >
                                          <Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <div className={`text-[12px] font-normal font-sans ${isDebit ? 'text-red-500' : 'text-[#00A86B]'}`}>
                                    {isDebit ? '-' : '+'} ₹{order.amount.toFixed(2)}
                                  </div>
                                  {isDebit && order.priceBreakup && (
                                    <button onClick={(e) => { e.stopPropagation(); setMobilePricePopupOrder(order); }} className="text-[#00A86B] flex items-center justify-center cursor-pointer focus:outline-none">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01" strokeLinecap="round"/></svg>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                            )}
                            {/* Amount row — only for non-shipment entries (no AWB) */}
                            {(!order.awb || order.awb === 'N/A') && (
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[12px] font-medium text-[#64748B] font-sans">Amount</span>
                                <span className={`text-[12px] font-medium font-sans ${isDebit ? 'text-red-500' : 'text-[#00A86B]'}`}>
                                  {isDebit ? '-' : '+'} ₹{order.amount.toFixed(2)}
                                </span>
                              </div>
                            )}

                            {/* Date & Time / Balance Row */}
                            <div className="flex items-center justify-between bg-[#F8FAFC] rounded-xl px-3 py-2 mb-2">
                              <div className="min-w-0 text-left flex-1">
                                <div className="text-[12px] font-normal text-[#94A3B8] uppercase tracking-wider font-sans">Date & Time</div>
                                <div className="text-[12px] font-medium text-[#0F172A] mt-0.5 truncate font-sans">{order.date}</div>
                                <div className="text-[12px] font-medium text-[#64748B] truncate font-sans">{order.time}</div>
                              </div>
                              <div className="text-right flex-1">
                                <div className="text-[12px] font-normal text-[#94A3B8] uppercase tracking-wider font-sans">Avail. Balance</div>
                                <div className="text-[12px] font-medium text-[#0F172A] mt-0.5 truncate font-sans">₹{order.balance.toFixed(2)}</div>
                              </div>
                            </div>
                            {/* Description + Action */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[12px] font-sans truncate">
                                <span className="font-medium text-[#64748B]">Description: </span>
                                <span className="font-normal text-[#0F172A]">{order.description}</span>
                              </span>
                              {isAdminView && isDebit && (
                                <button
                                  onClick={() => handleReverseTransaction(order)}
                                  title="Reverse Transaction"
                                  className="w-8 h-8 rounded-full bg-[#FEF2F2] flex items-center justify-center text-[#EF4444] hover:bg-[#FEE2E2] transition-colors shrink-0"
                                >
                                  <RefreshCcw className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                </div>
                {/* Mobile Passbook Pagination */}
                {<MobilePaginationBar {...({
                  page: passbookPage,
                  setPage: setPassbookPage,
                  totalPages: totalPassbookPages,
                  rowsPerPage: passbookItemsPerPage,
                  setRowsPerPage: handlePassbookItemsPerPage,
                  startIndex: passbookStartIndex,
                  endIndex: passbookEndIndex,
                  totalItems: passbookTotal,
                })} />}
              </div>
            </>
          )}

          {activeTab === 'Wallet Recharge' && (
            <>
              {selectedRechargeOrders.length > 0 && (
                <div className="hidden md:flex px-4 py-2 bg-blue-50 border-b border-blue-100 items-center gap-3 animate-fade-in">
                  <span className="text-xs font-bold text-blue-700">{selectedRechargeOrders.length} selected</span>
                  <button
                    onClick={() => handleExportData('recharge', filteredWalletRechargeData.filter(o => selectedRechargeOrders.includes(o.transactionId)))}
                    className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm ml-auto hover:bg-blue-100"
                  >
                    Export Selected
                  </button>
                </div>
              )}

              {/* Desktop Table */}
              <div className="hidden md:block flex-1 overflow-y-auto overflow-x-hidden w-full relative">
                <table className="w-full text-left border-collapse min-w-full">
                  <thead className="sticky top-0 z-20 bg-[#E6F9F2] shadow-sm">
                    <tr className="text-xs leading-[18px] font-medium text-[#64748B] uppercase tracking-wider border border-[#B9EFDB]">
                      <th className="py-2 px-4 w-10 text-left align-middle rounded-l-lg">
                        <input type="checkbox" checked={selectedRechargeOrders.length === filteredWalletRechargeData.length && filteredWalletRechargeData.length > 0} onChange={toggleAllRecharge} className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                      </th>
                      {isAdminView && (
                        <th className="py-2 px-4 text-left align-middle whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 shrink-0" />
                            <span>User</span>
                          </div>
                        </th>
                      )}
                      <th className="py-2 px-4 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>Date</span>
                        </div>
                      </th>
                      <th className="py-2 px-4 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span>Transaction ID</span>
                        </div>
                      </th>
                      <th className="py-2 px-4 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Banknote className="w-3.5 h-3.5 shrink-0" />
                          <span>Amount</span>
                        </div>
                      </th>
                      <th className="py-2 px-4 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>Status</span>
                        </div>
                      </th>
                      <th className="py-2 px-4 text-left align-middle whitespace-nowrap rounded-r-lg">
                        <div className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span>Description</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] text-[#475569]">
                    {paginatedRechargeData.map((recharge, idx) => (
                      <tr key={recharge.transactionId} className={`border-b border-[#E2E8F0] transition-colors group ${idx % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'}`}>
                        <td className="p-4">
                          <input type="checkbox" checked={selectedRechargeOrders.includes(recharge.transactionId)} onChange={() => toggleSelectRecharge(recharge.transactionId)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                        </td>
                        {isAdminView && (
                          <td className="p-4">
                            <div className="text-xs font-semibold text-[#00A86B]">{recharge.userId}</div>
                            <TruncatedText text={recharge.userName} maxLength={20} className="text-[14px] font-semibold font-sans text-[#0F172A] mt-0.5 max-w-[160px]" />
                            <TruncatedText text={recharge.userEmail} maxLength={25} className="text-[12px] font-normal font-sans text-[#94A3B8] max-w-[180px]" />
                          </td>
                        )}
                        <td className="p-4">
                          <div className="table-date">{recharge.date}</div>
                          <div className="table-date mt-0.5">{recharge.time}</div>
                        </td>
                        <td className="p-4">
                          {renderCopyable(recharge.transactionId, 'Transaction ID')}
                        </td>
                        <td className="p-4">
                          <div className="text-[#0F172A] text-[12px] font-normal font-sans">₹{recharge.amount.toFixed(2)}</div>
                        </td>
                        <td className="p-4">
                          <span className={getStatusBadgeClass(recharge.status)}>
                            {recharge.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="text-[12px] text-[#0F172A] font-sans"><span className="font-medium">Payment ID : </span><span className="font-normal">{recharge.paymentId}</span></div>
                          <div className="text-[12px] text-[#0F172A] font-sans mt-0.5"><span className="font-medium">Order ID: </span><span className="font-normal">{recharge.orderId}</span></div>
                        </td>
                      </tr>
                    ))}
                    {paginatedRechargeData.length === 0 && (
                      <tr>
                        <td colSpan={isAdminView ? 7 : 6}>
                          <EmptyState title="No recharge transactions found" />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Desktop Recharge Pagination */}
              <div className="hidden md:block">
                {totalRechargePages > 0 && (
                  <DesktopPagination
                    page={rechargePage}
                    setPage={setRechargePage}
                    totalPages={totalRechargePages}
                    rowsPerPage={rechargeItemsPerPage}
                    setRowsPerPage={handleRechargeItemsPerPage}
                    startIndex={rechargeStartIndex}
                    endIndex={rechargeEndIndex}
                    totalItems={rechargeTotal}
                  />
                )}
              </div>

              {/* Mobile Card Layout */}
              <div className="md:hidden flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto">
                {paginatedRechargeData.length === 0 ? (
                  <EmptyState title="No recharge transactions found" />
                ) : (
                  <div className="p-3 space-y-3 bg-[#F8FAFC]">
                    {paginatedRechargeData.map((recharge) => {
                      const isSuccess = recharge.status === 'Success';
                      const accent = isSuccess ? '#00A86B' : recharge.status === 'Failed' ? '#EF4444' : '#F59E0B';
                      return (
                        <div key={recharge.transactionId} className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                          {/* Ribbon Tag */}
                          <div
                            className="absolute top-0 left-0 px-3.5 py-1 text-[10px] font-bold text-white uppercase tracking-wide"
                            style={{ background: accent, clipPath: 'polygon(0 0, 100% 0, 84% 100%, 0% 100%)' }}
                          >
                            {recharge.status}
                          </div>
                          <div className="absolute top-1.5 right-2">
                            <input
                              type="checkbox"
                              checked={selectedRechargeOrders.includes(recharge.transactionId)}
                              onChange={() => toggleSelectRecharge(recharge.transactionId)}
                              className="rounded border-gray-300 accent-[#00A86B] w-4 h-4"
                            />
                          </div>

                          <div className="pt-7 px-3 pb-3">
                            {/* User Info */}
                            {isAdminView && (
                              <div className="flex justify-between items-center text-[12px] mb-2.5">
                                <span className="text-[#64748B] font-medium text-[12px] font-sans">User Details</span>
                                <span className="text-[12px] font-sans inline-flex items-baseline gap-1 max-w-[180px]">
                                  <TruncatedText text={recharge.userName || '—'} maxLength={16} className="font-semibold text-[#0F172A] text-[12px]" />
                                  <span className="text-[#94A3B8] font-semibold shrink-0">({recharge.userId || '—'})</span>
                                </span>
                              </div>
                            )}

                            {/* Created At */}
                            <div className="text-[12px] mb-1.5 font-sans">
                              <span className="text-[#64748B] font-medium">Created At: </span>
                              <span className="text-[#0F172A] font-normal">{recharge.date} | {recharge.time}</span>
                            </div>

                            {/* Payment ID */}
                            <div className="text-[12px] mb-1.5 font-sans flex items-center gap-1 group/copyPayment">
                              <span className="text-[#64748B] font-medium shrink-0">Payment ID: </span>
                              <span className="text-[#0F172A] font-normal truncate">{recharge.paymentId || '—'}</span>
                              {recharge.paymentId && (
                                <button onClick={(e) => { e.stopPropagation(); copyToClipboard(recharge.paymentId, 'Payment ID'); }} className="opacity-100 md:opacity-0 md:group-hover/copyPayment:opacity-100 transition-opacity shrink-0 focus:outline-none" title="Copy Payment ID">
                                  <Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" />
                                </button>
                              )}
                            </div>

                            {/* Order ID */}
                            <div className="text-[12px] mb-2 font-sans flex items-center gap-1 group/copyOrder">
                              <span className="text-[#64748B] font-medium shrink-0">Order ID: </span>
                              <span className="text-[#0F172A] font-normal truncate">{recharge.orderId || '—'}</span>
                              {recharge.orderId && (
                                <button onClick={(e) => { e.stopPropagation(); copyToClipboard(recharge.orderId, 'Order ID'); }} className="opacity-100 md:opacity-0 md:group-hover/copyOrder:opacity-100 transition-opacity shrink-0 focus:outline-none" title="Copy Order ID">
                                  <Copy className="w-3 h-3 text-[#94A3B8] hover:text-[#00A86B]" />
                                </button>
                              )}
                            </div>

                            {/* Transaction ID / Amount Box */}
                            <div className="flex items-center justify-between bg-[#F8FAFC] rounded-xl px-3 py-2.5">
                              <div className="min-w-0">
                                <div className="text-[12px] font-normal text-[#94A3B8] uppercase tracking-wider font-sans">Transaction ID</div>
                                {renderCopyable(recharge.transactionId, 'Transaction ID', 'text-[12px] font-semibold text-[#00A86B] mt-0.5 font-sans')}
                              </div>
                              <div className="text-center shrink-0">
                                <div className="text-[12px] font-normal text-[#94A3B8] uppercase tracking-wider font-sans">Amount Details</div>
                                <div className="text-[12px] font-semibold text-[#00A86B] mt-0.5 font-sans">₹{recharge.amount.toFixed(2)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                </div>
                {/* Mobile Recharge Pagination */}
                {<MobilePaginationBar {...({
                  page: rechargePage,
                  setPage: setRechargePage,
                  totalPages: totalRechargePages,
                  rowsPerPage: rechargeItemsPerPage,
                  setRowsPerPage: handleRechargeItemsPerPage,
                  startIndex: rechargeStartIndex,
                  endIndex: rechargeEndIndex,
                  totalItems: rechargeTotal,
                })} />}
              </div>
            </>
          )}

          {activeTab === 'Invoices' && (
            <>
              {selectedInvoiceOrders.length > 0 && (
                <div className="hidden md:flex px-4 py-2 bg-blue-50 border-b border-blue-100 items-center gap-3 animate-fade-in">
                  <span className="text-xs font-bold text-blue-700">{selectedInvoiceOrders.length} selected</span>
                  <button
                    onClick={() => handleExportData('invoice', filteredInvoicesData.filter(o => selectedInvoiceOrders.includes(o.invoiceNumber)))}
                    className="h-8 px-3 rounded-md bg-white border border-blue-200 text-xs font-bold text-blue-700 shadow-sm ml-auto hover:bg-blue-100"
                  >
                    Export Selected
                  </button>
                </div>
              )}
              <div className="hidden md:block flex-1 overflow-y-auto overflow-x-hidden w-full relative">
                <table className="w-full text-left border-collapse min-w-full">
                  <thead className="sticky top-0 z-20 bg-[#E6F9F2] shadow-sm">
                    <tr className="text-xs leading-[18px] font-medium text-[#64748B] uppercase tracking-wider border border-[#B9EFDB]">
                      <th className="py-2 px-4 w-10 text-left align-middle rounded-l-lg">
                        <input type="checkbox" checked={selectedInvoiceOrders.length === filteredInvoicesData.length && filteredInvoicesData.length > 0} onChange={toggleAllInvoices} className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                      </th>
                      {isAdminView && (
                        <th className="py-2 px-4 text-left align-middle whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 shrink-0" />
                            <span>User</span>
                          </div>
                        </th>
                      )}
                      <th className="py-2 px-4 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span>Invoice No.</span>
                        </div>
                      </th>
                      <th className="py-2 px-4 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 shrink-0" />
                          <span>Shipments</span>
                        </div>
                      </th>
                      <th className="py-2 px-4 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Banknote className="w-3.5 h-3.5 shrink-0" />
                          <span>Amount</span>
                        </div>
                      </th>
                      <th className="py-2 px-4 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>Created Date</span>
                        </div>
                      </th>
                      <th className="py-2 px-4 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>Period</span>
                        </div>
                      </th>
                      <th className="py-2 px-4 text-left align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>Status</span>
                        </div>
                      </th>
                      <th className="py-2 px-4 text-center align-middle whitespace-nowrap rounded-r-lg">
                        <div className="flex items-center justify-center gap-1">
                          <Settings className="w-3.5 h-3.5 shrink-0" />
                          <span>Actions</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] text-[#475569]">
                    {paginatedInvoicesData.map((invoice, idx) => (
                      <tr key={invoice.invoiceNumber} className={`border-b border-[#E2E8F0] transition-colors group ${idx % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'}`}>
                        <td className="p-4">
                          <input type="checkbox" checked={selectedInvoiceOrders.includes(invoice.invoiceNumber)} onChange={() => toggleSelectInvoice(invoice.invoiceNumber)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                        </td>
                        {isAdminView && (
                          <td className="p-4">
                            <div className="text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline uppercase">{invoice.userId}</div>
                            <TruncatedText text={invoice.userName} maxLength={20} className="text-[14px] font-semibold font-sans text-[#0F172A] mt-0.5 max-w-[160px]" />
                            <TruncatedText text={invoice.userEmail} maxLength={25} className="text-[12px] font-normal font-sans text-[#94A3B8] max-w-[180px]" />
                          </td>
                        )}
                        <td className="p-4">
                          <div className="text-xs font-semibold text-[#00A86B]">{invoice.invoiceNumber}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-[12px] font-normal font-sans text-[#64748B]">{invoice.shipments}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-[12px] font-normal font-sans text-[#0F172A]">₹{invoice.amount.toFixed(2)}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-[12px] font-normal font-sans text-[#64748B]">{invoice.createdOn}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-[12px] font-normal font-sans text-[#64748B]">{invoice.invoicePeriod}</div>
                        </td>
                        <td className="p-4">
                          <span className={getStatusBadgeClass(invoice.status)}>{invoice.status}</span>
                        </td>
                        <td className="p-4 text-center align-middle">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleDownloadInvoice(invoice)}
                              title="Download PDF"
                              className="w-7 h-7 rounded-full bg-[#E0F2FE] flex items-center justify-center text-[#0EA5E9] hover:bg-[#BAE6FD] transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDownloadExcel(invoice)}
                              title="Download Excel"
                              className="w-7 h-7 rounded-full bg-[#F0FDF4] flex items-center justify-center text-[#00A86B] hover:bg-[#DCFCE7] transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
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
                        <td colSpan={isAdminView ? 9 : 8}>
                          <EmptyState title="No invoice records found" />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Desktop Invoices Pagination */}
              <div className="hidden md:block">
                {totalInvoicePages > 0 && (
                  <DesktopPagination
                    page={invoicePage}
                    setPage={setInvoicePage}
                    totalPages={totalInvoicePages}
                    rowsPerPage={invoiceItemsPerPage}
                    setRowsPerPage={handleInvoiceItemsPerPage}
                    startIndex={invoiceStartIndex}
                    endIndex={invoiceEndIndex}
                    totalItems={invoiceTotal}
                  />
                )}
              </div>

              {/* Mobile Card Layout */}
              <div className="md:hidden flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto">
                {paginatedInvoicesData.length === 0 ? (
                  <EmptyState title="No invoice records found" />
                ) : (
                  <div className="p-3 space-y-3 bg-[#F8FAFC]">
                    {paginatedInvoicesData.map((invoice) => {
                      const accent = invoice.status === 'PAID' ? '#00A86B' : '#EF4444';
                      return (
                        <div key={invoice.invoiceNumber} className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                          {/* Ribbon Tag */}
                          <div
                            className="absolute top-0 left-0 px-3.5 py-1 text-[10px] font-bold text-white uppercase tracking-wide"
                            style={{ background: accent, clipPath: 'polygon(0 0, 100% 0, 84% 100%, 0% 100%)' }}
                          >
                            {invoice.status === 'PAID' ? 'Paid' : 'Unpaid'}
                          </div>
                          <div className="absolute top-1.5 right-2">
                            <input
                              type="checkbox"
                              checked={selectedInvoiceOrders.includes(invoice.invoiceNumber)}
                              onChange={() => toggleSelectInvoice(invoice.invoiceNumber)}
                              className="rounded border-gray-300 accent-[#00A86B] w-4 h-4"
                            />
                          </div>

                          <div className="pt-7 px-3 pb-3">
                            {/* User Info */}
                            <div className="flex justify-between items-center text-[12px] mb-2">
                              {isAdminView ? (
                                <span className="text-[#64748B] font-medium text-[12px] font-sans">User Details</span>
                              ) : <div />}
                              <div className="flex items-center gap-2">
                                {isAdminView && (
                                  <span className="text-[12px] font-sans inline-flex items-baseline gap-1 max-w-[130px]">
                                    <span className="font-semibold text-[#0F172A] text-[12px] truncate">{(invoice.userName || '—').split(' ')[0]}</span>
                                    <span className="text-[#94A3B8] font-semibold shrink-0">({invoice.userId || '—'})</span>
                                  </span>
                                )}
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => handleDownloadInvoice(invoice)}
                                    title="Download PDF"
                                    className="w-7 h-7 rounded-full bg-[#E0F2FE] flex items-center justify-center text-[#0EA5E9] hover:bg-[#BAE6FD] transition-colors"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDownloadExcel(invoice)}
                                    title="Download Excel"
                                    className="w-7 h-7 rounded-full bg-[#F0FDF4] flex items-center justify-center text-[#00A86B] hover:bg-[#DCFCE7] transition-colors"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setActiveInvoicePreview(invoice)}
                                    title="Preview Invoice"
                                    className="w-7 h-7 rounded-full bg-[#E0F2FE] flex items-center justify-center text-[#0EA5E9] hover:bg-[#BAE6FD] transition-colors"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Created At / Period */}
                            <div className="flex items-center justify-between text-[12px] mb-2 font-sans">
                              <span>
                                <span className="text-[#64748B] font-semibold">Created At: </span>
                                <span className="text-[#0F172A] font-normal">{invoice.createdOn}</span>
                              </span>
                              <span>
                                <span className="text-[#64748B] font-semibold">Period: </span>
                                <span className="text-[#0F172A] font-normal">{invoice.invoicePeriod}</span>
                              </span>
                            </div>

                            {/* Invoice No / Shipments / Amount Box */}
                            <div className="grid grid-cols-3 gap-2 items-start bg-[#F8FAFC] rounded-xl px-3 py-2">
                              <div className="min-w-0">
                                <div className="text-[12px] font-normal text-[#94A3B8] uppercase tracking-wider font-sans">Invoice No</div>
                                {renderCopyable(invoice.invoiceNumber || '—', 'Invoice No', 'text-[12px] font-semibold text-[#00A86B] mt-0.5 font-sans')}
                              </div>
                              <div className="text-center min-w-0">
                                <div className="text-[12px] font-normal text-[#94A3B8] uppercase tracking-wider font-sans">Shipments</div>
                                <div className="text-[12px] font-semibold text-[#00A86B] mt-0.5 font-sans truncate">{invoice.shipments}</div>
                              </div>
                              <div className="text-center min-w-0">
                                <div className="text-[12px] font-normal text-[#94A3B8] uppercase tracking-wider font-sans">Amount Details</div>
                                <div className="text-[12px] font-semibold text-[#00A86B] mt-0.5 font-sans truncate">₹{invoice.amount.toFixed(2)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                </div>
                {/* Mobile Invoices Pagination */}
                {<MobilePaginationBar {...({
                  page: invoicePage,
                  setPage: setInvoicePage,
                  totalPages: totalInvoicePages,
                  rowsPerPage: invoiceItemsPerPage,
                  setRowsPerPage: handleInvoiceItemsPerPage,
                  startIndex: invoiceStartIndex,
                  endIndex: invoiceEndIndex,
                  totalItems: invoiceTotal,
                })} />}
              </div>
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

        <RechargeWalletModal
          open={isRechargeModalOpen}
          onClose={() => setIsRechargeModalOpen(false)}
          walletBalance={walletBalance}
          onSuccess={(amount) => setWalletBalance(prev => prev + amount)}
        />

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
                        className={`relative pb-2 text-[12px] font-bold transition-all ${upbTab === tab ? 'text-[#00A86B]' : 'text-[#64748B] hover:text-[#0F172A]'
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
                        {['Freight Charges', 'COD Charges', 'RTO Freight Charges', 'Shipment Lost Liability', 'Shipment Damaged Liability', 'Weight Dispute Charges', 'Cashback', 'Credit Note', 'Wallet to bank', 'GST Charges'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    {upbUpdDesc && !['Cashback', 'Credit Note', 'Wallet to bank'].includes(upbUpdDesc) && (
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
                        {['Freight Charges', 'COD Charges', 'RTO Freight Charges', 'Shipment Lost Liability', 'Shipment Damaged Liability', 'Weight Dispute Charges', 'Cashback', 'Credit Note', 'Wallet to bank', 'GST Charges'].map(d => (
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

        {/* Floating Bot Button — admin only */}
        {activeTab === 'Passbook' && isAdminView && (
          <div className="hidden md:flex fixed bottom-24 right-8 z-40 items-center gap-2">
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

        {/* Floating Bot Button — Mobile (compact chat-bubble style) */}
        {activeTab === 'Passbook' && (
          <div className="md:hidden fixed bottom-20 right-3 z-40">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <div className="absolute inset-0 rounded-full bg-[#00A86B] animate-ping opacity-25"></div>
              <button
                onClick={() => {
                  setUpbUserQuery('');
                  setUpbUserSuggestions([]);
                  setUpbSelectedUserId('');
                  setUpbSelectedMongoId('');
                  setUpbUpdAwb('');
                  setUpbUpdOrderId('');
                  setUpbUpdAmount('');
                  setUpbUpdDesc('Credit Note Received');
                  setUpbUpdCategory('credit note');
                  setUpbTab('Updation');
                  setIsUpdateModalOpen(true);
                }}
                className="w-9 h-9 rounded-full bg-[#00A86B] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform relative z-10"
              >
                <Bot className="w-4 h-4" />
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
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${step.highlight
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
                    <thead className="sticky top-0 z-20">
                      <tr className="bg-[#E6F9F2] border-b border-slate-100 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
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
        {isMobileFiltersOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[140] md:hidden flex items-end justify-center animate-fade-in"
            onClick={() => setIsMobileFiltersOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white rounded-t-3xl border-t border-[#E2E8F0] shadow-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Filter className="w-5 h-5 text-[#00A86B]" /> Filter Options
                </h3>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6 space-y-4">
                {activeTab === 'Shipping' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Search Query</label>
                      <input
                        type="text"
                        placeholder="Search name, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Search Type</label>
                        <select
                          value={selectedSearchTypes[0] || ''}
                          onChange={(e) => setSelectedSearchTypes(e.target.value ? [e.target.value] : [])}
                          className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                        >
                          {SEARCH_TYPE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Search Type ID</label>
                        <input
                          type="text"
                          placeholder="Type ID..."
                          value={searchTypeId}
                          onChange={(e) => setSearchTypeId(e.target.value)}
                          className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Courier Partner</label>
                      <select
                        value={selectedCouriers[0] || ''}
                        onChange={(e) => setSelectedCouriers(e.target.value ? [e.target.value] : [])}
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                      >
                        <option value="">All Couriers</option>
                        {courierOptions.map((opt: { label: string; value: string }) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                      <select
                        value={selectedStatuses[0] || ''}
                        onChange={(e) => setSelectedStatuses(e.target.value ? [e.target.value] : [])}
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                      >
                        <option value="">All Statuses</option>
                        {SHIPPING_STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date Range</label>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="date"
                          value={shippingDateStart}
                          onChange={(e) => setShippingDateStart(e.target.value)}
                          className="h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B]"
                        />
                        <input
                          type="date"
                          value={shippingDateEnd}
                          onChange={(e) => setShippingDateEnd(e.target.value)}
                          className="h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B]"
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'Passbook' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date Range</label>
                      <GlassDateFilter
                        className="w-full [&_.glass-dropdown-trigger]:w-full [&_.glass-dropdown-trigger]:h-11"
                        startDate={passbookDateStart}
                        endDate={passbookDateEnd}
                        onDateChange={onPassbookDateChange}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Search Query</label>
                      <input
                        type="text"
                        placeholder="Search by name, email, or contact..."
                        value={passbookSearchTerm}
                        onChange={(e) => setPassbookSearchTerm(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Order ID</label>
                      <input
                        type="text"
                        placeholder="Order ID..."
                        value={passbookOrderId}
                        onChange={(e) => setPassbookOrderId(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">AWB Number</label>
                      <input
                        type="text"
                        placeholder="AWB Number..."
                        value={passbookAwb}
                        onChange={(e) => setPassbookAwb(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                      <select
                        value={selectedCategories[0] || ''}
                        onChange={(e) => setSelectedCategories(e.target.value ? [e.target.value] : [])}
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                      >
                        <option value="">All Categories</option>
                        {CATEGORY_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                      <select
                        value={selectedDescriptions[0] || ''}
                        onChange={(e) => setSelectedDescriptions(e.target.value ? [e.target.value] : [])}
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                      >
                        <option value="">All Descriptions</option>
                        {DESCRIPTION_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {activeTab === 'Wallet Recharge' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date Range</label>
                      <GlassDateFilter
                        className="w-full [&_.glass-dropdown-trigger]:w-full [&_.glass-dropdown-trigger]:h-11"
                        startDate={rechargeDateStart}
                        endDate={rechargeDateEnd}
                        onDateChange={onRechargeDateChange}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Search Query</label>
                      <input
                        type="text"
                        placeholder="Search by name, email, or contact..."
                        value={rechargeSearchTerm}
                        onChange={(e) => setRechargeSearchTerm(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Transaction ID</label>
                      <input
                        type="text"
                        placeholder="Transaction ID..."
                        value={rechargeTxnId}
                        onChange={(e) => setRechargeTxnId(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Payment ID</label>
                      <select
                        value={selectedPaymentMethods[0] || ''}
                        onChange={(e) => setSelectedPaymentMethods(e.target.value ? [e.target.value] : [])}
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                      >
                        <option value="">All Payment Methods</option>
                        {PAYMENT_METHOD_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                      <select
                        value={selectedRechargeStatuses[0] || ''}
                        onChange={(e) => setSelectedRechargeStatuses(e.target.value ? [e.target.value] : [])}
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                      >
                        <option value="">All Statuses</option>
                        {RECHARGE_STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {activeTab === 'Invoices' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date Range</label>
                      <GlassDateFilter
                        className="w-full [&_.glass-dropdown-trigger]:w-full [&_.glass-dropdown-trigger]:h-11"
                        startDate={invoiceDateStart}
                        endDate={invoiceDateEnd}
                        onDateChange={onInvoiceDateChange}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Search Query</label>
                      <input
                        type="text"
                        placeholder="Search by name, email, or contact..."
                        value={invoiceSearchTerm}
                        onChange={(e) => setInvoiceSearchTerm(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Month</label>
                      <select
                        value={selectedMonths[0] || ''}
                        onChange={(e) => setSelectedMonths(e.target.value ? [e.target.value] : [])}
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                      >
                        <option value="">All Months</option>
                        {MONTH_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Year</label>
                      <select
                        value={selectedYears[0] || ''}
                        onChange={(e) => setSelectedYears(e.target.value ? [e.target.value] : [])}
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#00A86B] bg-white"
                      >
                        <option value="">All Years</option>
                        {YEAR_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Footer Buttons */}
                <div className="flex gap-3 pt-4 border-t border-[#E2E8F0] mt-6">
                  <button
                    onClick={() => {
                      if (activeTab === 'Shipping') clearShippingFilters();
                      else if (activeTab === 'Passbook') clearPassbookFilters();
                      else if (activeTab === 'Wallet Recharge') clearRechargeFilters();
                      else if (activeTab === 'Invoices') clearInvoiceFilters();
                      setIsMobileFiltersOpen(false);
                      showToast('success', 'Filters cleared');
                    }}
                    className="flex-1 h-11 rounded-xl border border-[#CBD5E1] text-[#475569] text-sm font-bold hover:bg-[#F8FAFC]"
                  >
                    Reset All
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileFiltersOpen(false);
                      showToast('success', 'Filters applied successfully!');
                    }}
                    className="flex-1 h-11 rounded-xl bg-[#009D64] text-white text-sm font-bold hover:bg-[#009B63]"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ── Reverse Transaction Confirmation Modal ────────────────────────── */}
        {reverseConfirmOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4"
            onClick={() => setReverseConfirmOrder(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                  <RefreshCcw className="w-5 h-5 text-[#EF4444]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#0F172A]">Confirm Reversal</h3>
                  <p className="text-[12px] text-[#64748B]">This action cannot be undone</p>
                </div>
              </div>

              {/* Transaction details */}
              <div className="bg-[#F8FAFC] rounded-xl px-4 py-3 mb-5 space-y-2.5 border border-[#E2E8F0]">
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-[#64748B]">Amount</span>
                  <span className="text-[13px] font-bold text-red-500">−₹{reverseConfirmOrder.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center gap-3">
                  <span className="text-[12px] text-[#64748B] shrink-0">Description</span>
                  <span className="text-[12px] font-semibold text-[#0F172A] text-right truncate">{reverseConfirmOrder.description}</span>
                </div>
                {reverseConfirmOrder.awb && reverseConfirmOrder.awb !== 'N/A' && (
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] text-[#64748B]">AWB</span>
                    <span className="text-[12px] font-semibold text-[#00A86B]">{reverseConfirmOrder.awb}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setReverseConfirmOrder(null)}
                  className="flex-1 h-10 rounded-xl border border-[#E2E8F0] text-[13px] font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={doReverseTransaction}
                  className="flex-1 h-10 rounded-xl bg-[#EF4444] text-white text-[13px] font-bold hover:bg-[#DC2626] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCcw className="w-3.5 h-3.5" /> Reverse
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ── Price Breakup Desktop Popup (fixed, never clipped) ── */}
      {pricePopupPos && (
        <div
          style={{
            position: 'fixed', zIndex: 9999,
            left: pricePopupPos.x,
            ...(pricePopupPos.dir === 'top' ? { bottom: window.innerHeight - pricePopupPos.y } : { top: pricePopupPos.y }),
            transform: 'translateX(-50%)',
            pointerEvents: 'auto',
          }}
          className="bg-white border border-[#E2E8F0] shadow-2xl rounded-xl p-3 w-52 text-[11px] text-[#475569]"
          onMouseEnter={() => { if (pricePopupTimerRef.current) clearTimeout(pricePopupTimerRef.current); }}
          onMouseLeave={() => { pricePopupTimerRef.current = setTimeout(() => setPricePopupPos(null), 150); }}
        >
          <p className="font-bold text-[#0F172A] text-[12px] mb-2 pb-1.5 border-b border-[#F1F5F9]">Price Breakup</p>
          <div className="space-y-1.5">
            <div className="flex justify-between"><span className="text-[#64748B]">Freight</span><span className="font-semibold text-[#0F172A]">₹{Number(pricePopupPos.order.priceBreakup?.freight ?? 0).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-[#64748B]">COD</span><span className="font-semibold text-[#0F172A]">₹{Number(pricePopupPos.order.priceBreakup?.cod ?? 0).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-[#64748B]">GST</span><span className="font-semibold text-[#0F172A]">₹{Number(pricePopupPos.order.priceBreakup?.gst ?? 0).toFixed(2)}</span></div>
            <div className="flex justify-between pt-1.5 border-t border-[#F1F5F9]"><span className="font-bold text-[#0F172A]">Total</span><span className="font-bold text-[#00A86B]">₹{Number(pricePopupPos.order.priceBreakup?.total ?? pricePopupPos.order.statusAmount ?? pricePopupPos.order.amount ?? 0).toFixed(2)}</span></div>
          </div>
        </div>
      )}

      {/* ── Price Breakup Mobile Modal ── */}
      <AnimatePresence>
        {mobilePricePopupOrder && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobilePricePopupOrder(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.18 }}
              className="relative z-10 bg-white rounded-2xl shadow-2xl p-5 w-full max-w-xs"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-[#0F172A] text-[13px] uppercase tracking-wide">Price Breakup</h3>
                <button onClick={() => setMobilePricePopupOrder(null)} className="w-6 h-6 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#64748B] hover:bg-[#E2E8F0]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="space-y-2.5 text-[12px]">
                <div className="flex justify-between"><span className="text-[#64748B]">Freight</span><span className="font-semibold text-[#0F172A]">₹{Number(mobilePricePopupOrder.priceBreakup?.freight ?? 0).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-[#64748B]">COD</span><span className="font-semibold text-[#0F172A]">₹{Number(mobilePricePopupOrder.priceBreakup?.cod ?? 0).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-[#64748B]">GST</span><span className="font-semibold text-[#0F172A]">₹{Number(mobilePricePopupOrder.priceBreakup?.gst ?? 0).toFixed(2)}</span></div>
                <div className="flex justify-between pt-2 border-t border-[#F1F5F9]"><span className="font-bold text-[#0F172A]">Total</span><span className="font-bold text-[#00A86B]">₹{Number(mobilePricePopupOrder.priceBreakup?.total ?? mobilePricePopupOrder.statusAmount ?? mobilePricePopupOrder.amount ?? 0).toFixed(2)}</span></div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
