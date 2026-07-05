import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { usePagination } from '../../hooks/usePagination';
import { useMobilePaginationBar } from '../../hooks/useMobilePaginationBar';
import { Search, ChevronDown, RefreshCcw, Calendar, Check, Package, User, Truck, Banknote, Clock, Upload, Download, MoreVertical, Wallet, ArrowDownCircle, ArrowUpCircle, FileText, Plus, TrendingUp, ChevronLeft, ChevronRight, MinusCircle, Send, Eye, AlertCircle, CheckCircle2, X, CreditCard, Filter, Layers, Hash, CalendarDays, Bot, ArrowLeft, Settings, Copy } from 'lucide-react';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { GlassDateFilter } from '../../components/ui/GlassDateFilter';
import { GlassSingleSelect } from '../../components/ui/GlassSingleSelect';
import { useTableLoader } from '../../hooks/useTableLoader';
import { TableLoader } from '../../components/ui/TableLoader';
import { TruncatedText } from '../../components/ui/TruncatedText';

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

// Mock data for Shipping (active tab in image)
const SHIPPING_DATA = Array.from({ length: 15 }, (_, i) => {
  const names = ['Dinesh Tharwani', 'Aarav Mehta', 'Ishaan Sharma', 'Pooja Patel'];
  const emails = ['dineshtharwani@gmail.com', 'aarav.mehta@gmail.com', 'ishaan.sharma@gmail.com', 'pooja.patel@gmail.com'];
  const mobiles = ['9876543210', '9812345678', '9988776655', '9765432109'];
  const couriers = ['Ekart Surface', 'Delhivery'];
  const statuses = ['Paid', 'Pending'];
  return {
    id: String(86543 + i),
    awb: `QPSP${String(45 + i).padStart(9, '0')}`,
    userName: names[i % names.length],
    userEmail: emails[i % emails.length],
    mobile: mobiles[i % mobiles.length],
    date: `${10 + (i % 20)}th Apr 2026`,
    day: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][i % 5],
    courier: couriers[i % couriers.length],
    bookedDate: `${10 + (i % 20)} Apr 2026`,
    statusAmount: (112.04 + i * 15.5).toFixed(2),
    status: statuses[i % statuses.length],
    initialWeight: 'Weight: 250g',
    initialDimensions: 'L*W*H: 10*10*10',
    initialVol: 'Vol. Weight: 0.20 KG',
    courierWeight: 'Weight: 250g',
    courierDimensions: 'L*W*H: 10*10*10',
    courierVol: 'Vol. Weight: 0.20 KG',
  };
});

const STATUS_BADGE_STYLES: Record<string, string> = {
  'Paid': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'PAID': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Success': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Credit': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
  'PENDING': 'bg-amber-50 text-amber-700 border-amber-200',
  'Debit': 'bg-rose-50 text-rose-700 border-rose-200',
};

const getStatusBadgeClass = (status: string) => {
  const normalized = status || '';
  return `${STATUS_BADGE_STYLES[normalized] || 'bg-blue-50 text-blue-700 border-blue-200'} px-2.5 py-0.5 rounded-full border text-[10px] font-semibold font-sans uppercase tracking-wider whitespace-nowrap shadow-sm`;
};

// Mock data for Passbook
const PASSBOOK_DATA = Array.from({ length: 15 }, (_, i) => {
  const names = ['Dinesh Tharwani', 'Aarav Mehta', 'Ishaan Sharma', 'Pooja Patel'];
  const emails = ['dineshtharwani@gmail.com', 'aarav.mehta@gmail.com', 'ishaan.sharma@gmail.com', 'pooja.patel@gmail.com'];
  const mobiles = ['9876543210', '9812345678', '9988776655', '9765432109'];
  const couriers = ['Ekart Surface', 'Delhivery'];
  return {
    id: String(86543 + i),
    awb: `QPSP${String(45 + i).padStart(9, '0')}`,
    userName: names[i % names.length],
    userEmail: emails[i % emails.length],
    mobile: mobiles[i % mobiles.length],
    date: `${10 + (i % 20)}th Apr 2026`,
    day: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][i % 5],
    courier: couriers[i % couriers.length],
    bookedDate: `${10 + (i % 20)} Apr 2026`,
    category: i % 2 === 0 ? 'Debit' : 'Credit',
    amount: 112.04 + i * 20.2,
    balance: 71234.82 - i * 100,
    description: i % 2 === 0 ? 'Freight Charges Applied' : 'Wallet Recharge Success',
  };
});

// Mock data for Wallet Recharge
const WALLET_RECHARGE_DATA = Array.from({ length: 15 }, (_, i) => {
  const names = ['Dinesh Tharwani', 'Aarav Mehta', 'Ishaan Sharma', 'Pooja Patel'];
  const emails = ['dineshtharwani@gmail.com', 'aarav.mehta@gmail.com', 'ishaan.sharma@gmail.com', 'pooja.patel@gmail.com'];
  const mobiles = ['9876543210', '9812345678', '9988776655', '9765432109'];
  return {
    id: String(86543 + i),
    userName: names[i % names.length],
    userEmail: emails[i % emails.length],
    mobile: mobiles[i % mobiles.length],
    date: `${10 + (i % 20)}th Apr 2026`,
    time: `12h:${10 + i}min:09sec`,
    transactionId: `8654376543219${i}`,
    amount: 500 + i * 200,
    status: i % 5 === 0 ? 'Failed' : 'Success',
    paymentId: i % 2 === 0 ? 'pay_UPIrnSh2lbEExl' : 'pay_CardrmuQJqBlZD',
    orderId: `order_SermuQJqBlZDCO${i}`
  };
});

// Mock data for Invoices
const INVOICES_DATA = Array.from({ length: 15 }, (_, i) => {
  const names = ['Dinesh Tharwani', 'Aarav Mehta', 'Ishaan Sharma', 'Pooja Patel'];
  const emails = ['dineshtharwani@gmail.com', 'aarav.mehta@gmail.com', 'ishaan.sharma@gmail.com', 'pooja.patel@gmail.com'];
  const mobiles = ['9876543210', '9812345678', '9988776655', '9765432109'];
  const months = ['January', 'February', 'March', 'April'];
  const years = ['2026', '2025'];
  return {
    id: String(86543 + i),
    userName: names[i % names.length],
    userEmail: emails[i % emails.length],
    mobile: mobiles[i % mobiles.length],
    invoiceNumber: `8654376543219${i}`,
    shipments: i % 4 + 1,
    amount: 534.54 + i * 150,
    createdOn: `${10 + (i % 20)}th Apr 2026`,
    invoicePeriod: `${months[i % months.length]} ${years[i % years.length]}`,
    status: i % 4 === 0 ? 'UNPAID' : 'PAID'
  };
});

export function AdminWallet() {
  const navigate = useNavigate();
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
    startLoading(600);
  };
  const { isLoading, startLoading } = useTableLoader(800);
  const [toast, setToast] = useState<{type: 'error' | 'success', text: string} | null>(null);

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
  const [walletBalance, setWalletBalance] = useState(71234.82);

  // Stateful Data Lists
  const [shippingList, setShippingList] = useState(SHIPPING_DATA);
  const [passbookList, setPassbookList] = useState(PASSBOOK_DATA);
  const [rechargeList, setRechargeList] = useState(WALLET_RECHARGE_DATA);
  const [invoiceList, setInvoiceList] = useState(INVOICES_DATA);

  // Top header pickup mobile filter
  const [headerMobileSearch, setHeaderMobileSearch] = useState('');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  
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
  const COURIER_OPTIONS = [
    { label: 'Ekart Surface', value: 'Ekart Surface' },
    { label: 'Delhivery', value: 'Delhivery' },
    { label: 'Bluedart', value: 'Bluedart' },
    { label: 'XpressBees', value: 'XpressBees' },
  ];
  const SHIPPING_STATUS_OPTIONS = [
    { label: 'Pending', value: 'Pending' },
    { label: 'Paid', value: 'Paid' },
  ];
  const CATEGORY_OPTIONS = [
    { label: 'Debit', value: 'Debit' },
    { label: 'Credit', value: 'Credit' },
  ];
  const DESCRIPTION_OPTIONS = [
    { label: 'Freight Charges Applied', value: 'Freight Charges Applied' },
    { label: 'Wallet Recharge Success', value: 'Wallet Recharge Success' },
    { label: 'COD Remittance', value: 'COD Remittance' },
    { label: 'Refund Credited', value: 'Refund Credited' },
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
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [isRecharging, setIsRecharging] = useState(false);
  const [rechargeMode, setRechargeMode] = useState<'Payment' | 'COD'>('Payment');
  const [availableCodBalance, setAvailableCodBalance] = useState(48250);

  const [activeShipmentHistory, setActiveShipmentHistory] = useState<any | null>(null);
  const [activeInvoicePreview, setActiveInvoicePreview] = useState<any | null>(null);

  // Manual Balance / Update Passbook Modal States
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [modalActiveTab, setModalActiveTab] = useState('Updation');
  const [modalSellerQuery, setModalSellerQuery] = useState('');
  const [modalSelectedSeller, setModalSelectedSeller] = useState<{ userName: string; userEmail: string; mobile: string } | null>(null);
  const [modalAwb, setModalAwb] = useState('');
  const [modalOrderId, setModalOrderId] = useState('');
  const [modalDescription, setModalDescription] = useState('Credit Note Received');
  const [modalAmount, setModalAmount] = useState('');
  const [modalCategory, setModalCategory] = useState('credit note'); // recharge, cashbacks, credit note, wallet 2 bank
  const [modalMode, setModalMode] = useState<'Debit' | 'Credit'>('Credit');

  const SELLER_DATABASE = useMemo(() => [
    { userName: 'Dinesh Tharwani', userEmail: 'dineshtharwani@gmail.com', mobile: '9876543210' },
    { userName: 'Aarav Mehta', userEmail: 'aarav.mehta@gmail.com', mobile: '9812345678' },
    { userName: 'Ishaan Sharma', userEmail: 'ishaan.sharma@gmail.com', mobile: '9988776655' },
    { userName: 'Pooja Patel', userEmail: 'pooja.patel@gmail.com', mobile: '9765432109' },
    { userName: 'HL ARC Studio', userEmail: 'abc@gmail.com', mobile: '9876543210' }
  ], []);

  const handleOpenUpdateModal = (order: any) => {
    const seller = SELLER_DATABASE.find(s => s.userName === order.userName) || {
      userName: order.userName,
      userEmail: order.userEmail || '',
      mobile: order.mobile || ''
    };
    setModalSelectedSeller(seller);
    setModalSellerQuery(seller.userName);
    setModalAwb(order.awb !== 'N/A' ? order.awb : '');
    setModalOrderId(order.id !== 'N/A' ? order.id : '');
    setModalMode(order.category === 'Debit' ? 'Debit' : 'Credit');
    setModalAmount('');
    setModalDescription(order.category === 'Debit' ? 'Freight Charges Balancing' : 'Credit Note Received');
    setModalCategory('credit note');
    setModalActiveTab('Updation');
    setIsUpdateModalOpen(true);
  };

  const handleUpdatePassbookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalSelectedSeller) {
      showToast('error', 'Please select a seller from the suggestions.');
      return;
    }
    const amountVal = parseFloat(modalAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      showToast('error', 'Please enter a valid amount.');
      return;
    }
    const updatedBalance = modalMode === 'Credit' 
      ? walletBalance + amountVal 
      : walletBalance - amountVal;

    const newEntry = {
      id: modalOrderId || String(Math.floor(100000 + Math.random() * 900000)),
      awb: modalAwb || 'N/A',
      userName: modalSelectedSeller.userName,
      userEmail: modalSelectedSeller.userEmail,
      mobile: modalSelectedSeller.mobile,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      courier: 'N/A',
      bookedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      category: modalMode,
      amount: amountVal,
      balance: updatedBalance,
      description: modalDescription || (modalMode === 'Credit' ? 'Credit Note Applied' : 'Freight Charges Balancing')
    };

    setPassbookList(prev => [newEntry, ...prev]);
    setWalletBalance(updatedBalance);
    setIsUpdateModalOpen(false);
    showToast('success', `Passbook manual update applied for ${modalSelectedSeller.userName}!`);
  };

  // Memoized Filtered Lists
  const filteredShippingData = useMemo(() => {
    return shippingList.filter(order => {
      const matchHeader = headerMobileSearch ? order.mobile.includes(headerMobileSearch) : true;
      const matchSearch = searchTerm ? 
        order.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        order.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) : true;
      const matchGlobal = globalSearchQuery ?
        order.userName.toLowerCase().includes(globalSearchQuery) || 
        order.userEmail.toLowerCase().includes(globalSearchQuery) || 
        order.awb.toLowerCase().includes(globalSearchQuery) ||
        order.id.toLowerCase().includes(globalSearchQuery) : true;
      
      let matchTypeId = true;
      if (searchTypeId) {
        if (selectedSearchTypes.length === 1 && selectedSearchTypes[0] === 'AWB') {
          matchTypeId = order.awb.toLowerCase().includes(searchTypeId.toLowerCase());
        } else if (selectedSearchTypes.length === 1 && selectedSearchTypes[0] === 'Order ID') {
          matchTypeId = order.id.toLowerCase().includes(searchTypeId.toLowerCase());
        } else {
          matchTypeId = order.awb.toLowerCase().includes(searchTypeId.toLowerCase()) || order.id.toLowerCase().includes(searchTypeId.toLowerCase());
        }
      }
      
      const matchCourier = selectedCouriers.length === 0 || selectedCouriers.includes(order.courier);
      const matchStatus = selectedStatuses.length === 0 || selectedStatuses.includes(order.status);
      
      return matchHeader && matchSearch && matchGlobal && matchTypeId && matchCourier && matchStatus;
    });
  }, [shippingList, headerMobileSearch, searchTerm, globalSearchQuery, selectedSearchTypes, searchTypeId, selectedCouriers, selectedStatuses]);

  const filteredPassbookData = useMemo(() => {
    return passbookList.filter(order => {
      const matchHeader = headerMobileSearch ? order.mobile.includes(headerMobileSearch) : true;
      const matchSearch = passbookSearchTerm ? 
        order.userName.toLowerCase().includes(passbookSearchTerm.toLowerCase()) || 
        order.userEmail.toLowerCase().includes(passbookSearchTerm.toLowerCase()) : true;
      const matchGlobal = globalSearchQuery ?
        order.userName.toLowerCase().includes(globalSearchQuery) || 
        order.userEmail.toLowerCase().includes(globalSearchQuery) || 
        order.awb.toLowerCase().includes(globalSearchQuery) ||
        order.id.toLowerCase().includes(globalSearchQuery) : true;
      const matchOrderId = passbookOrderId ? order.id.includes(passbookOrderId) : true;
      const matchAwb = passbookAwb ? order.awb.toLowerCase().includes(passbookAwb.toLowerCase()) : true;
      const matchCategory = selectedCategories.length === 0 || selectedCategories.includes(order.category);
      const matchDescription = selectedDescriptions.length === 0 || selectedDescriptions.includes(order.description);
      
      return matchHeader && matchSearch && matchGlobal && matchOrderId && matchAwb && matchCategory && matchDescription;
    });
  }, [passbookList, headerMobileSearch, passbookSearchTerm, globalSearchQuery, passbookOrderId, passbookAwb, selectedCategories, selectedDescriptions]);

  const filteredWalletRechargeData = useMemo(() => {
    return rechargeList.filter(recharge => {
      const matchHeader = headerMobileSearch ? recharge.mobile.includes(headerMobileSearch) : true;
      const matchSearch = rechargeSearchTerm ? 
        recharge.userName.toLowerCase().includes(rechargeSearchTerm.toLowerCase()) || 
        recharge.userEmail.toLowerCase().includes(rechargeSearchTerm.toLowerCase()) : true;
      const matchGlobal = globalSearchQuery ?
        recharge.userName.toLowerCase().includes(globalSearchQuery) || 
        recharge.userEmail.toLowerCase().includes(globalSearchQuery) || 
        recharge.transactionId.toLowerCase().includes(globalSearchQuery) : true;
      const matchTxnId = rechargeTxnId ? recharge.transactionId.includes(rechargeTxnId) : true;
      
      let matchPaymentId = true;
      if (selectedPaymentMethods.length > 0) {
        matchPaymentId = selectedPaymentMethods.some(method => {
          if (method === 'UPI') return recharge.paymentId.toLowerCase().includes('upi') || recharge.paymentId.toLowerCase().startsWith('pay_s');
          if (method === 'Card') return recharge.paymentId.toLowerCase().includes('card') || !recharge.paymentId.toLowerCase().includes('upi');
          return true;
        });
      }
      
      const matchStatus = selectedRechargeStatuses.length === 0 || selectedRechargeStatuses.includes(recharge.status);
      
      return matchHeader && matchSearch && matchGlobal && matchTxnId && matchPaymentId && matchStatus;
    });
  }, [rechargeList, headerMobileSearch, rechargeSearchTerm, globalSearchQuery, rechargeTxnId, selectedPaymentMethods, selectedRechargeStatuses]);

  const filteredInvoicesData = useMemo(() => {
    return invoiceList.filter(invoice => {
      const matchHeader = headerMobileSearch ? invoice.mobile.includes(headerMobileSearch) : true;
      const matchSearch = invoiceSearchTerm ? 
        invoice.userName.toLowerCase().includes(invoiceSearchTerm.toLowerCase()) || 
        invoice.userEmail.toLowerCase().includes(invoiceSearchTerm.toLowerCase()) : true;
      const matchGlobal = globalSearchQuery ?
        invoice.userName.toLowerCase().includes(globalSearchQuery) || 
        invoice.userEmail.toLowerCase().includes(globalSearchQuery) || 
        invoice.invoiceNumber.toLowerCase().includes(globalSearchQuery) : true;
      
      const matchMonth = selectedMonths.length === 0 || selectedMonths.some(m => invoice.invoicePeriod.toLowerCase().includes(m.toLowerCase()));
      const matchYear = selectedYears.length === 0 || selectedYears.some(y => invoice.invoicePeriod.toLowerCase().includes(y.toLowerCase()));
      
      return matchHeader && matchSearch && matchGlobal && matchMonth && matchYear;
    });
  }, [invoiceList, headerMobileSearch, invoiceSearchTerm, globalSearchQuery, selectedMonths, selectedYears]);

  const {
    page: shippingPage,
    setPage: setShippingPage,
    totalPages: totalShippingPages,
    paginatedData: paginatedShippingData,
    startIndex: shippingStartIndex,
    endIndex: shippingEndIndex,
    rowsPerPage: shippingRowsPerPage,
    setRowsPerPage: setShippingRowsPerPage,
  } = usePagination({ data: filteredShippingData, perPage: 10 });

  const {
    page: passbookPage,
    setPage: setPassbookPage,
    totalPages: totalPassbookPages,
    paginatedData: paginatedPassbookData,
    startIndex: passbookStartIndex,
    endIndex: passbookEndIndex,
    rowsPerPage: passbookRowsPerPage,
    setRowsPerPage: setPassbookRowsPerPage,
  } = usePagination({ data: filteredPassbookData, perPage: 10 });

  const {
    page: rechargePage,
    setPage: setRechargePage,
    totalPages: totalRechargePages,
    paginatedData: paginatedRechargeData,
    startIndex: rechargeStartIndex,
    endIndex: rechargeEndIndex,
    rowsPerPage: rechargeRowsPerPage,
    setRowsPerPage: setRechargeRowsPerPage,
  } = usePagination({ data: filteredWalletRechargeData, perPage: 10 });

  const {
    page: invoicePage,
    setPage: setInvoicePage,
    totalPages: totalInvoicePages,
    paginatedData: paginatedInvoicesData,
    startIndex: invoiceStartIndex,
    endIndex: invoiceEndIndex,
    rowsPerPage: invoiceRowsPerPage,
    setRowsPerPage: setInvoiceRowsPerPage,
  } = usePagination({ data: filteredInvoicesData, perPage: 10 });

  // Bulk Actions & Helpers
  const handleRefresh = () => {
    startLoading(1000).then(() => {
      setShippingList(SHIPPING_DATA);
      setPassbookList(PASSBOOK_DATA);
      setRechargeList(WALLET_RECHARGE_DATA);
      setInvoiceList(INVOICES_DATA);
      showToast('success', 'Wallet data refreshed successfully!');
    });
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
      <div className="flex flex-col h-[calc(100vh-72px)] md:h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">
        <div className="bg-white relative z-50 shrink-0">
          {/* Mobile Search Bar */}
          <div className="md:hidden px-4 py-3 border-b border-[#E2E8F0]">
            <div className="relative">
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
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10 transition-all"
              />
            </div>
          </div>

          {/* Top Header Row — Tabs */}
          <div className="flex justify-between items-center px-4 md:px-6 py-2 border-b border-[#E2E8F0] bg-white">
            <div className="flex gap-4 md:gap-6 items-center shrink-0 overflow-x-auto no-scrollbar">
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
            <div className="hidden md:flex p-3 border-b border-[#E2E8F0] flex-wrap items-center gap-2.5 bg-[#F8FAFC]/50">
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
                options={COURIER_OPTIONS}
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
                onClick={() => showToast('success', 'Shipping filters applied successfully!')}
                className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm flex items-center justify-center cursor-pointer"
              >
                Apply
              </button>
 
               <div className="relative shrink-0 ml-auto flex items-center gap-2">
                 <button 
                   onClick={() => setIsRechargeModalOpen(true)}
                   className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                 >
                   <Plus className="w-3.5 h-3.5" /> Recharge Wallet
                 </button>
                 <div className="relative action-dropdown-container">
                   <button
                     onClick={() => setShowShippingActionMenu(!showShippingActionMenu)}
                     className="glass-dropdown-trigger w-auto px-4 justify-between min-w-[100px]"
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

            {/* Mobile Filters + Action Row */}
            <div className="md:hidden px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#00A86B] text-white text-[12px] font-bold shadow-sm"
                >
                  <Filter className="w-3.5 h-3.5" /> Filters
                </button>
                {selectedOrders.length > 0 && (
                  <span className="text-[11px] font-bold text-[#00A86B] bg-[#F0FDF4] border border-[#00A86B]/20 px-2.5 py-1 rounded-full">
                    {selectedOrders.length} selected
                  </span>
                )}
              </div>
              <div className="relative action-dropdown-container">
                <button
                  onClick={() => setShowShippingActionMenu(!showShippingActionMenu)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E2E8F0] text-[12px] font-semibold text-[#475569] bg-white active:bg-[#F8FAFC] transition-colors"
                >
                  Action
                  <ChevronDown className={`w-3.5 h-3.5 text-[#94A3B8] transition-transform duration-200 ${showShippingActionMenu ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showShippingActionMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.16, ease: 'easeOut' }}
                      className="absolute right-0 top-full mt-2 w-[200px] bg-white rounded-xl shadow-[0_8px_28px_-6px_rgba(0,0,0,0.15)] border border-[#E2E8F0] py-1.5 z-50 origin-top-right"
                    >
                      <button
                        disabled={selectedOrders.length === 0}
                        onClick={() => { handleBulkShip(); setShowShippingActionMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        Bulk Ship
                      </button>
                      <button
                        disabled={selectedOrders.length === 0}
                        onClick={() => { handleUpdatePackageDetails(); setShowShippingActionMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        Update Package Details
                      </button>
                      <button
                        disabled={selectedOrders.length === 0}
                        onClick={() => { handleUpdatePickupAddress(); setShowShippingActionMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        Update Pickup Address
                      </button>
                      <button
                        disabled={selectedOrders.length === 0}
                        onClick={() => { handleVerifyOrders(); setShowShippingActionMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        Verify Orders
                      </button>
                      <button
                        onClick={() => { handleExportData('shipping', filteredShippingData); setShowShippingActionMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                      >
                        Export Excel
                      </button>
                      <button
                        disabled={selectedOrders.length === 0}
                        onClick={() => { handleDownloadInvoices(); setShowShippingActionMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        Download Invoices
                      </button>
                      <div className="h-px bg-[#E2E8F0] my-1" />
                      <button
                        disabled={selectedOrders.length === 0}
                        onClick={() => { handleBulkDelete(); setShowShippingActionMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        Bulk Delete
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </>
        )}

         {activeTab === 'Passbook' && (
          <>
            {/* Desktop Filters Row */}
            <div className="hidden md:flex p-3 border-b border-[#E2E8F0] flex-wrap items-center gap-2.5 bg-[#F8FAFC]/50">
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
                onDateChange={(s, e) => { setPassbookDateStart(s); setPassbookDateEnd(e); }}
              />

              <button
                onClick={() => showToast('success', 'Passbook filters applied successfully!')}
                className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm flex items-center justify-center cursor-pointer"
              >
                Apply
              </button>

               <div className="relative shrink-0 ml-auto flex items-center gap-2">
                 <button
                   onClick={() => setIsRechargeModalOpen(true)}
                   className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                 >
                   <Plus className="w-3.5 h-3.5" /> Recharge Wallet
                 </button>
                 <div className="relative action-dropdown-container">
                   <button
                     onClick={() => setShowPassbookActionMenu(!showPassbookActionMenu)}
                     className="glass-dropdown-trigger w-auto px-4 justify-between min-w-[100px]"
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
            {/* Desktop Filters Row */}
            <div className="hidden md:flex p-3 border-b border-[#E2E8F0] flex-wrap items-center gap-2.5 bg-[#F8FAFC]/50">
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
                onDateChange={(s, e) => { setRechargeDateStart(s); setRechargeDateEnd(e); }}
              />

              <button
                onClick={() => showToast('success', 'Wallet Recharge filters applied successfully!')}
                className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm flex items-center justify-center cursor-pointer"
              >
                Apply
              </button>

               <div className="relative shrink-0 ml-auto flex items-center gap-2">
                 <button
                   onClick={() => setIsRechargeModalOpen(true)}
                   className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                 >
                   <Plus className="w-3.5 h-3.5" /> Recharge Wallet
                 </button>
                 <div className="relative action-dropdown-container">
                   <button
                     onClick={() => setShowRechargeActionMenu(!showRechargeActionMenu)}
                     className="glass-dropdown-trigger w-auto px-4 justify-between min-w-[100px]"
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

            {/* Mobile Filters + Action Row */}
            <div className="md:hidden px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#00A86B] text-white text-[12px] font-bold shadow-sm"
                >
                  <Filter className="w-3.5 h-3.5" /> Filters
                </button>
                {selectedRechargeOrders.length > 0 && (
                  <span className="text-[11px] font-bold text-[#00A86B] bg-[#F0FDF4] border border-[#00A86B]/20 px-2.5 py-1 rounded-full">
                    {selectedRechargeOrders.length} selected
                  </span>
                )}
              </div>
              <div className="relative action-dropdown-container">
                <button
                  onClick={() => setShowRechargeActionMenu(!showRechargeActionMenu)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E2E8F0] text-[12px] font-semibold text-[#475569] bg-white active:bg-[#F8FAFC] transition-colors"
                >
                  Action
                  <ChevronDown className={`w-3.5 h-3.5 text-[#94A3B8] transition-transform duration-200 ${showRechargeActionMenu ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showRechargeActionMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.16, ease: 'easeOut' }}
                      className="absolute right-0 top-full mt-2 w-[200px] bg-white rounded-xl shadow-[0_8px_28px_-6px_rgba(0,0,0,0.15)] border border-[#E2E8F0] py-1.5 z-50 origin-top-right"
                    >
                      <button
                        onClick={() => { handleExportData('recharge', filteredWalletRechargeData); setShowRechargeActionMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                      >
                        Export Recharge History
                      </button>
                      <button
                        onClick={() => {
                          showToast('success', 'Wallet Statement generated successfully!');
                          setShowRechargeActionMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                      >
                        Generate Statement
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </>
        )}

        {activeTab === 'Invoices' && (
          <>
            {/* Desktop Filters Row */}
            <div className="hidden md:flex p-3 border-b border-[#E2E8F0] flex-wrap items-center gap-2.5 bg-[#F8FAFC]/50">
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
                onDateChange={(s, e) => { setInvoiceDateStart(s); setInvoiceDateEnd(e); }}
              />

              <button
                onClick={() => showToast('success', 'Invoice filters applied successfully!')}
                className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm flex items-center justify-center cursor-pointer"
              >
                Apply
              </button>

               <div className="relative shrink-0 ml-auto flex items-center gap-2">
                 <button
                   onClick={() => setIsRechargeModalOpen(true)}
                   className="h-9 px-4 shrink-0 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                 >
                   <Plus className="w-3.5 h-3.5" /> Recharge Wallet
                 </button>
                 <div className="relative action-dropdown-container">
                   <button
                     onClick={() => setShowInvoiceActionMenu(!showInvoiceActionMenu)}
                     className="glass-dropdown-trigger w-auto px-4 justify-between min-w-[100px]"
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

            {/* Mobile Filters + Action Row */}
            <div className="md:hidden px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#00A86B] text-white text-[12px] font-bold shadow-sm"
                >
                  <Filter className="w-3.5 h-3.5" /> Filters
                </button>
                {selectedInvoiceOrders.length > 0 && (
                  <span className="text-[11px] font-bold text-[#00A86B] bg-[#F0FDF4] border border-[#00A86B]/20 px-2.5 py-1 rounded-full">
                    {selectedInvoiceOrders.length} selected
                  </span>
                )}
              </div>
              <div className="relative action-dropdown-container">
                <button
                  onClick={() => setShowInvoiceActionMenu(!showInvoiceActionMenu)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E2E8F0] text-[12px] font-semibold text-[#475569] bg-white active:bg-[#F8FAFC] transition-colors"
                >
                  Action
                  <ChevronDown className={`w-3.5 h-3.5 text-[#94A3B8] transition-transform duration-200 ${showInvoiceActionMenu ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showInvoiceActionMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.16, ease: 'easeOut' }}
                      className="absolute right-0 top-full mt-2 w-[200px] bg-white rounded-xl shadow-[0_8px_28px_-6px_rgba(0,0,0,0.15)] border border-[#E2E8F0] py-1.5 z-50 origin-top-right"
                    >
                      <button
                        onClick={() => { handleExportData('invoice', filteredInvoicesData); setShowInvoiceActionMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                      >
                        Export Invoice List
                      </button>
                      <button
                        onClick={() => {
                          showToast('success', 'Downloading all invoice PDFs...');
                          setShowInvoiceActionMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                      >
                        Download All PDF
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                <thead className="sticky top-0 z-20">
                  <tr className="bg-[#E6F5F1] text-xs font-medium text-[#00A86B] uppercase tracking-wider">
                    <th className="p-3 w-10 text-left align-middle">
                      <input type="checkbox" checked={selectedOrders.length === filteredShippingData.length && filteredShippingData.length > 0} onChange={toggleAll} className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                    </th>
                    <th className="p-3 text-left align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 shrink-0" />
                        <span>User</span>
                      </div>
                    </th>
                    <th className="p-3 text-left align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 shrink-0" />
                        <span>Order</span>
                      </div>
                    </th>
                    <th className="p-3 text-left align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 shrink-0" />
                        <span>Shipment</span>
                      </div>
                    </th>
                    <th className="p-3 text-left align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Banknote className="w-3.5 h-3.5 shrink-0" />
                        <span>Status</span>
                      </div>
                    </th>
                    <th className="p-3 text-left align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 shrink-0" />
                        <span>Initial Weight</span>
                      </div>
                    </th>
                    <th className="p-3 text-left align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 shrink-0" />
                        <span>Courier Weight</span>
                      </div>
                    </th>
                    <th className="p-3 text-center align-middle whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <Settings className="w-3.5 h-3.5 shrink-0" />
                        <span>Actions</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[11px] text-[#475569]">
                  {paginatedShippingData.map((order) => (
                    <tr key={order.awb} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors group">
                      <td className="p-3">
                        <input type="checkbox" checked={selectedOrders.includes(order.awb)} onChange={() => toggleSelect(order.awb)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                      </td>
                      <td className="p-3">
                        {renderCopyable(order.id, 'User ID', "text-[12px] font-semibold font-sans text-[#00A86B] cursor-pointer hover:underline uppercase")}
                        <TruncatedText text={order.userName} maxLength={20} className="text-[14px] font-semibold font-sans text-[#0F172A] mt-0.5 max-w-[160px]" />
                        <TruncatedText text={order.userEmail} maxLength={25} className="text-[12px] font-normal font-sans text-[#94A3B8] max-w-[180px]" />
                      </td>
                      <td className="p-3">
                        {renderCopyable(order.id, 'Order ID', "text-[12px] font-semibold font-sans text-[#00A86B] cursor-pointer hover:underline uppercase", () => navigate(`/admin/order-tracking?id=${order.id}`))}
                        <div className="table-date mt-0.5">{order.date}</div>
                        <div className="table-date mt-0.5">{order.day}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-xs font-semibold text-[#00A86B]">{order.courier}</div>
                        <div className="table-date mt-0.5">Booked On : {order.bookedDate}</div>
                        {renderCopyable(order.awb, 'AWB', "text-[12px] font-semibold font-sans text-[#00A86B] underline decoration-solid underline-offset-2 mt-0.5 hover:text-[#009B63] cursor-pointer", () => navigate('/admin/tracking', { state: { awb: order.awb } }))}
                      </td>
                      <td className="p-3">
                        <div className="text-[12px] font-normal font-sans text-[#0F172A]">₹{order.statusAmount}</div>
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
                      <td className="p-3 text-center align-middle">
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
                      <td colSpan={8} className="p-8 text-center text-[#64748B] font-medium">
                        No shipping records found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Shipping Pagination — Desktop */}
            <div className="hidden md:block">
            {totalShippingPages > 0 && (
              <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-xs text-[#64748B]">
                    Showing <span className="font-bold text-[#0F172A]">{shippingStartIndex}</span> to <span className="font-bold text-[#0F172A]">{shippingEndIndex}</span> of <span className="font-bold text-[#0F172A]">{filteredShippingData.length}</span> entries
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#94A3B8] font-semibold uppercase tracking-wider">Show</span>
                    <select
                      value={shippingRowsPerPage}
                      onChange={(e) => setShippingRowsPerPage(Number(e.target.value))}
                      className="h-8 px-2.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-bold text-[#475569] cursor-pointer appearance-none min-w-[56px] text-center shadow-sm hover:border-[#00A86B]/40 hover:shadow-[0_0_0_3px_rgba(0,168,107,0.06)] focus:outline-none focus:border-[#00A86B] focus:shadow-[0_0_0_3px_rgba(0,168,107,0.1)] transition-all duration-200 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_8px_center] bg-no-repeat pr-7"
                    >
                      {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setShippingPage(p => Math.max(1, p - 1))}
                    disabled={shippingPage === 1}
                    className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalShippingPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setShippingPage(i + 1)}
                      className={`w-8 h-8 rounded text-xs font-medium flex items-center justify-center transition-colors ${
                        shippingPage === i + 1 ? 'bg-[#00A86B] text-white border border-[#00A86B]' : 'border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    onClick={() => setShippingPage(p => Math.min(totalShippingPages, p + 1))}
                    disabled={shippingPage === totalShippingPages}
                    className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden flex-1 overflow-y-auto">
              {paginatedShippingData.length === 0 ? (
                <div className="p-8 text-center text-[#64748B] font-medium text-sm">
                  No shipping records found.
                </div>
              ) : (
                <div className="p-4 space-y-4 bg-[#F8FAFC]">
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

                        <div className="pt-8 px-4 pb-4">
                          {/* User Details Row */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <input type="checkbox" checked={selectedOrders.includes(order.awb)} onChange={() => toggleSelect(order.awb)} className="rounded border-gray-300 accent-[#00A86B] w-4 h-4" />
                              <span className="text-[#64748B] font-medium text-[12px] font-sans">User Details</span>
                            </div>
                            <span className="text-[12px] font-sans inline-flex items-baseline gap-1 max-w-[180px]">
                              {renderTruncatedName(order.userName, 16, "font-semibold text-[#0F172A] text-[12px]")}
                              <span className="text-[#64748B] font-semibold shrink-0">({order.id})</span>
                            </span>
                          </div>

                          {/* Courier & Order Card */}
                          <div className="rounded-xl p-3 mb-3 bg-white" style={{ border: `1px solid ${accent}` }}>
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
                                      onClick={(e) => { e.stopPropagation(); showToast('success', order.awb); }}
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
                          <div className="flex items-center justify-between mb-3 px-1">
                            <span className="text-[11px] font-medium text-[#64748B] font-sans">Ent. Wt & Dim:</span>
                            <span className="text-[12px] font-medium text-[#0F172A] font-sans">1.2 Kg | 20×15×20 cm</span>
                          </div>

                          {/* AWB / Weight / Freight Row */}
                          <div className="flex items-start justify-between bg-[#F8FAFC] rounded-xl px-3 py-2.5 mb-3">
                            <div className="min-w-0">
                              <div className="text-[12px] font-normal text-[#94A3B8] uppercase tracking-wider font-sans">AWB Number</div>
                              <div
                                className="text-[12px] font-medium text-[#00A86B] mt-0.5 font-sans truncate active:opacity-60"
                                title={order.awb}
                                onClick={() => showToast('success', order.awb)}
                              >
                                {order.awb}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-[12px] font-normal text-[#94A3B8] uppercase tracking-wider font-sans">AWB Assigned Wt.</div>
                              <div className="text-[12px] font-medium text-[#0F172A] mt-0.5 font-sans">1.200 Kg</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[12px] font-normal text-[#94A3B8] uppercase tracking-wider font-sans">Total Freight</div>
                              <div className="text-[12px] font-medium text-[#0F172A] mt-0.5 font-sans">₹{order.statusAmount} <span className="inline-block w-3 h-3 rounded-full border border-[#CBD5E1] text-[8px] text-[#94A3B8] text-center leading-3">ⓘ</span></div>
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

              {/* Mobile Pagination */}
              {useMobilePaginationBar({
                page: shippingPage,
                setPage: setShippingPage,
                totalPages: totalShippingPages,
                rowsPerPage: shippingRowsPerPage,
                setRowsPerPage: setShippingRowsPerPage,
                startIndex: shippingStartIndex,
                endIndex: shippingEndIndex,
                totalItems: filteredShippingData.length,
              })}
            </div>
          </>
        )}

        {activeTab === 'Passbook' && (
          <>
            {/* Mobile Filters Row */}
            <div className="md:hidden px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#00A86B] text-white text-[12px] font-bold shadow-sm"
                >
                  <Filter className="w-3.5 h-3.5" /> Filters
                </button>
                {selectedPassbookOrders.length > 0 && (
                  <span className="text-[11px] font-bold text-[#00A86B] bg-[#F0FDF4] border border-[#00A86B]/20 px-2.5 py-1 rounded-full">
                    {selectedPassbookOrders.length} selected
                  </span>
                )}
              </div>
              <div className="relative action-dropdown-container">
                <button
                  onClick={() => setShowPassbookActionMenu(!showPassbookActionMenu)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E2E8F0] text-[12px] font-semibold text-[#475569] bg-white active:bg-[#F8FAFC] transition-colors"
                >
                  Action
                  <ChevronDown className={`w-3.5 h-3.5 text-[#94A3B8] transition-transform duration-200 ${showPassbookActionMenu ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showPassbookActionMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.16, ease: 'easeOut' }}
                      className="absolute right-0 top-full mt-2 w-[200px] bg-white rounded-xl shadow-[0_8px_28px_-6px_rgba(0,0,0,0.15)] border border-[#E2E8F0] py-1.5 z-50 origin-top-right"
                    >
                      <button
                        onClick={() => { handleExportData('passbook', filteredPassbookData); setShowPassbookActionMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                      >
                        Export Passbook (CSV)
                      </button>
                      <button
                        onClick={() => {
                          showToast('success', 'Passbook ledger report generated!');
                          setShowPassbookActionMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                      >
                        Download Detailed Ledger
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

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
                <thead className="sticky top-0 z-20">
                  <tr className="bg-[#E6F5F1] text-xs font-medium text-[#00A86B] uppercase tracking-wider">
                    <th className="p-3 w-10 text-left align-middle">
                      <input type="checkbox" checked={selectedPassbookOrders.length === filteredPassbookData.length && filteredPassbookData.length > 0} onChange={toggleAllPassbook} className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                    </th>
                    <th className="p-3 text-left align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 shrink-0" />
                        <span>User</span>
                      </div>
                    </th>
                    <th className="p-3 text-left align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 shrink-0" />
                        <span>Order</span>
                      </div>
                    </th>
                    <th className="p-3 text-left align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 shrink-0" />
                        <span>Shipment</span>
                      </div>
                    </th>
                    <th className="p-3 text-left align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span>Category</span>
                      </div>
                    </th>
                    <th className="p-3 text-left align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Banknote className="w-3.5 h-3.5 shrink-0" />
                        <span>Amount</span>
                      </div>
                    </th>
                    <th className="p-3 text-left align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 shrink-0" />
                        <span>Balance</span>
                      </div>
                    </th>
                    <th className="p-3 text-left align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span>Description</span>
                      </div>
                    </th>
                    <th className="p-3 text-center align-middle whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <Settings className="w-3.5 h-3.5 shrink-0" />
                        <span>Actions</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[11px] text-[#475569]">
                  {paginatedPassbookData.map((order) => (
                    <tr key={order.awb} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors group">
                      <td className="p-3">
                        <input type="checkbox" checked={selectedPassbookOrders.includes(order.awb)} onChange={() => toggleSelectPassbook(order.awb)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                      </td>
                      <td className="p-3">
                        {renderCopyable(order.id, 'User ID', "text-[12px] font-semibold font-sans text-[#00A86B] cursor-pointer hover:underline uppercase")}
                        <TruncatedText text={order.userName} maxLength={20} className="text-[14px] font-semibold font-sans text-[#0F172A] mt-0.5 max-w-[160px]" />
                        <TruncatedText text={order.userEmail} maxLength={25} className="text-[12px] font-normal font-sans text-[#94A3B8] max-w-[180px]" />
                      </td>
                      <td className="p-3">
                        {renderCopyable(order.id, 'Order ID', "text-[12px] font-semibold font-sans text-[#00A86B] cursor-pointer hover:underline uppercase")}
                        <div className="table-date mt-0.5">{order.date}</div>
                        <div className="table-date mt-0.5">{order.day}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-xs font-semibold text-[#00A86B]">{order.courier}</div>
                        <div className="text-[12px] font-normal font-sans text-[#64748B] mt-0.5">Booked On : {order.bookedDate}</div>
                        {renderCopyable(order.awb, 'AWB', "text-[12px] font-semibold font-sans text-[#00A86B] underline decoration-solid underline-offset-2 mt-0.5 hover:text-[#009B63] cursor-pointer", () => navigate('/admin/tracking', { state: { awb: order.awb } }))}
                      </td>
                      <td className="p-3">
                        <span className={getStatusBadgeClass(order.category)}>
                          {order.category}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className={`text-[12px] font-normal font-sans ${order.category === 'Debit' ? 'text-red-500' : 'text-green-500'}`}>₹{order.amount.toFixed(2)}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-[#64748B] text-[12px] font-normal font-sans">₹{order.balance.toFixed(2)}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-[#64748B] text-[12px] font-normal font-sans">{order.description}</div>
                      </td>
                      <td className="p-3 text-center align-middle">
                        <button 
                          onClick={() => showToast('success', `Verification complete for record AWB: ${order.awb !== 'N/A' ? order.awb : 'N/A'}`)}
                          className="w-7 h-7 rounded-full bg-[#E0F2FE] flex items-center justify-center text-[#0EA5E9] hover:bg-[#BAE6FD] transition-colors mx-auto"
                        >
                          <RefreshCcw className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {paginatedPassbookData.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-[#64748B] font-medium">
                        No passbook records found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Desktop Passbook Pagination */}
            <div className="hidden md:block">
              {totalPassbookPages > 0 && (
                <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-xs text-[#64748B]">
                      Showing <span className="font-bold text-[#0F172A]">{passbookStartIndex}</span> to <span className="font-bold text-[#0F172A]">{passbookEndIndex}</span> of <span className="font-bold text-[#0F172A]">{filteredPassbookData.length}</span> entries
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-[#94A3B8] font-semibold uppercase tracking-wider">Show</span>
                      <select
                        value={passbookRowsPerPage}
                        onChange={(e) => setPassbookRowsPerPage(Number(e.target.value))}
                        className="h-8 px-2.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-bold text-[#475569] cursor-pointer appearance-none min-w-[56px] text-center shadow-sm hover:border-[#00A86B]/40 hover:shadow-[0_0_0_3px_rgba(0,168,107,0.06)] focus:outline-none focus:border-[#00A86B] focus:shadow-[0_0_0_3px_rgba(0,168,107,0.1)] transition-all duration-200 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_8px_center] bg-no-repeat pr-7"
                      >
                        {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setPassbookPage(p => Math.max(1, p - 1))}
                      disabled={passbookPage === 1}
                      className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPassbookPages }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setPassbookPage(i + 1)}
                        className={`w-8 h-8 rounded text-xs font-medium flex items-center justify-center transition-colors ${
                          passbookPage === i + 1 ? 'bg-[#00A86B] text-white border border-[#00A86B]' : 'border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button 
                      onClick={() => setPassbookPage(p => Math.min(totalPassbookPages, p + 1))}
                      disabled={passbookPage === totalPassbookPages}
                      className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Passbook Card Layout */}
            <div className="md:hidden flex-1 overflow-y-auto">
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
                <div className="p-8 text-center text-[#64748B] font-medium text-sm">
                  No passbook records found.
                </div>
              ) : (
                <div className="p-4 space-y-4 bg-[#F8FAFC]">
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

                        <div className="pt-8 px-4 pb-4">
                          {/* User Info */}
                          <div className="flex justify-between items-center text-[12px] mb-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedPassbookOrders.includes(order.awb)}
                                onChange={() => toggleSelectPassbook(order.awb)}
                                className="rounded border-gray-300 accent-[#00A86B] w-4 h-4"
                              />
                              <span className="text-[#64748B] font-medium text-[12px] font-sans">User Details</span>
                            </div>
                            <span className="text-[12px] font-sans inline-flex items-baseline gap-1 max-w-[180px]">
                              {renderTruncatedName(order.userName, 16, "font-semibold text-[#0F172A] text-[12px]")}
                              <span className="text-[#94A3B8] font-semibold shrink-0">({order.id})</span>
                            </span>
                          </div>

                          {/* Courier Card */}
                          <div className="rounded-xl p-3 mb-3 bg-white" style={{ border: `1px solid ${accent}` }}>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-9 h-9 bg-white border border-[#E2E8F0] rounded-xl flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-sm">
                                  <img src={getCourierLogo(order.courier)} alt={order.courier} className="w-full h-full object-contain" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-[12px] font-normal text-[#0F172A] truncate font-sans">{order.courier} 2KG</div>
                                  {order.awb !== 'N/A' && (
                                    <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
                                      <span className="text-[12px] font-semibold text-[#00A86B] truncate font-sans">{order.awb}</span>
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
                              <div className={`text-[12px] font-normal shrink-0 font-sans ${isDebit ? 'text-red-500' : 'text-[#00A86B]'}`}>
                                {isDebit ? '-' : '+'} ₹{order.amount.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          {/* AWB / Date & Time / Balance Row */}
                          <div className="grid grid-cols-3 gap-2 items-start bg-[#F8FAFC] rounded-xl px-3 py-2.5 mb-3">
                            <div className="min-w-0">
                              <div className="text-[12px] font-normal text-[#94A3B8] uppercase tracking-wider font-sans">AWB Number</div>
                              <div
                                className="text-[12px] font-medium text-[#00A86B] mt-0.5 truncate active:opacity-60 font-sans"
                                title={order.awb !== 'N/A' ? order.awb : undefined}
                                onClick={() => { if (order.awb !== 'N/A') showToast('success', order.awb); }}
                              >
                                {order.awb !== 'N/A' ? order.awb : '—'}
                              </div>
                            </div>
                            <div className="min-w-0 text-center">
                              <div className="text-[12px] font-normal text-[#94A3B8] uppercase tracking-wider font-sans">Date & Time</div>
                              <div className="text-[12px] font-medium text-[#0F172A] mt-0.5 truncate font-sans">{order.date}</div>
                              <div className="text-[12px] font-medium text-[#64748B] truncate font-sans">{order.day}</div>
                            </div>
                            <div className="text-right min-w-0">
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
                            <button
                              onClick={() => showToast('success', `Verification complete for record AWB: ${order.awb !== 'N/A' ? order.awb : 'N/A'}`)}
                              className="w-8 h-8 rounded-full bg-[#E0F2FE] flex items-center justify-center text-[#0EA5E9] hover:bg-[#BAE6FD] transition-colors shrink-0"
                            >
                              <RefreshCcw className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Mobile Passbook Pagination */}
              {useMobilePaginationBar({
                page: passbookPage,
                setPage: setPassbookPage,
                totalPages: totalPassbookPages,
                rowsPerPage: passbookRowsPerPage,
                setRowsPerPage: setPassbookRowsPerPage,
                startIndex: passbookStartIndex,
                endIndex: passbookEndIndex,
                totalItems: filteredPassbookData.length,
              })}
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
                <thead className="sticky top-0 z-20">
                  <tr className="bg-[#E6F5F1] text-xs font-medium text-[#00A86B] uppercase tracking-wider">
                    <th className="p-3 w-10 text-left align-middle">
                      <input type="checkbox" checked={selectedRechargeOrders.length === filteredWalletRechargeData.length && filteredWalletRechargeData.length > 0} onChange={toggleAllRecharge} className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                    </th>
                    <th className="p-3 text-left align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 shrink-0" />
                        <span>User</span>
                      </div>
                    </th>
                    <th className="p-3 text-left align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>Date</span>
                      </div>
                    </th>
                    <th className="p-3 text-left align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span>Transaction ID</span>
                      </div>
                    </th>
                    <th className="p-3 text-left align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Banknote className="w-3.5 h-3.5 shrink-0" />
                        <span>Amount</span>
                      </div>
                    </th>
                    <th className="p-3 text-left align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>Status</span>
                      </div>
                    </th>
                    <th className="p-3 text-left align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span>Description</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[11px] text-[#475569]">
                  {paginatedRechargeData.map((recharge) => (
                    <tr key={recharge.transactionId} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors group">
                      <td className="p-3">
                        <input type="checkbox" checked={selectedRechargeOrders.includes(recharge.transactionId)} onChange={() => toggleSelectRecharge(recharge.transactionId)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                      </td>
                      <td className="p-3">
                        <div className="text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline">{recharge.id}</div>
                        <TruncatedText text={recharge.userName} maxLength={20} className="text-[14px] font-semibold font-sans text-[#0F172A] mt-0.5 max-w-[160px]" />
                        <TruncatedText text={recharge.userEmail} maxLength={25} className="text-[12px] font-normal font-sans text-[#94A3B8] max-w-[180px]" />
                      </td>
                      <td className="p-3">
                        <div className="table-date">{recharge.date}</div>
                        <div className="table-date mt-0.5">{recharge.time}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-[12px] font-semibold font-sans text-[#00A86B]">{recharge.transactionId}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-[#0F172A] text-[12px] font-normal font-sans">₹{recharge.amount.toFixed(2)}</div>
                      </td>
                      <td className="p-3">
                        <span className={getStatusBadgeClass(recharge.status)}>
                          {recharge.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-[12px] text-[#0F172A] font-sans"><span className="font-medium">Payment ID : </span><span className="font-normal">{recharge.paymentId}</span></div>
                        <div className="text-[12px] text-[#0F172A] font-sans mt-0.5"><span className="font-medium">Order ID: </span><span className="font-normal">{recharge.orderId}</span></div>
                      </td>
                    </tr>
                  ))}
                  {paginatedRechargeData.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#64748B] font-medium">
                        No recharge transactions found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Desktop Recharge Pagination */}
            <div className="hidden md:block">
              {totalRechargePages > 0 && (
                <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-xs text-[#64748B]">
                      Showing <span className="font-bold text-[#0F172A]">{rechargeStartIndex}</span> to <span className="font-bold text-[#0F172A]">{rechargeEndIndex}</span> of <span className="font-bold text-[#0F172A]">{filteredWalletRechargeData.length}</span> entries
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-[#94A3B8] font-semibold uppercase tracking-wider">Show</span>
                      <select
                        value={rechargeRowsPerPage}
                        onChange={(e) => setRechargeRowsPerPage(Number(e.target.value))}
                        className="h-8 px-2.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-bold text-[#475569] cursor-pointer appearance-none min-w-[56px] text-center shadow-sm hover:border-[#00A86B]/40 hover:shadow-[0_0_0_3px_rgba(0,168,107,0.06)] focus:outline-none focus:border-[#00A86B] focus:shadow-[0_0_0_3px_rgba(0,168,107,0.1)] transition-all duration-200 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_8px_center] bg-no-repeat pr-7"
                      >
                        {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setRechargePage(p => Math.max(1, p - 1))}
                      disabled={rechargePage === 1}
                      className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalRechargePages }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setRechargePage(i + 1)}
                        className={`w-8 h-8 rounded text-xs font-medium flex items-center justify-center transition-colors ${
                          rechargePage === i + 1 ? 'bg-[#00A86B] text-white border border-[#00A86B]' : 'border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setRechargePage(p => Math.min(totalRechargePages, p + 1))}
                      disabled={rechargePage === totalRechargePages}
                      className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden flex-1 overflow-y-auto">
              {paginatedRechargeData.length === 0 ? (
                <div className="p-8 text-center text-[#64748B] font-medium text-sm">
                  No recharge transactions found.
                </div>
              ) : (
                <div className="p-4 space-y-4 bg-[#F8FAFC]">
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

                        <div className="pt-8 px-4 pb-4">
                          {/* User Info */}
                          <div className="flex justify-between items-center text-[12px] mb-2.5">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedRechargeOrders.includes(recharge.transactionId)}
                                onChange={() => toggleSelectRecharge(recharge.transactionId)}
                                className="rounded border-gray-300 accent-[#00A86B] w-4 h-4"
                              />
                              <span className="text-[#64748B] font-medium text-[12px] font-sans">User Details</span>
                            </div>
                            <span className="text-[12px] font-sans inline-flex items-baseline gap-1 max-w-[180px]">
                              {renderTruncatedName(recharge.userName, 16, "font-semibold text-[#0F172A] text-[12px]")}
                              <span className="text-[#94A3B8] font-semibold shrink-0">({recharge.id})</span>
                            </span>
                          </div>

                          {/* Created At */}
                          <div className="text-[12px] mb-1.5 font-sans">
                            <span className="text-[#64748B] font-medium">Created At: </span>
                            <span className="text-[#0F172A] font-normal">{recharge.date} | {recharge.time}</span>
                          </div>

                          {/* Payment ID */}
                          <div className="text-[12px] mb-1.5 truncate font-sans">
                            <span className="text-[#64748B] font-medium">Payment ID: </span>
                            <span className="text-[#0F172A] font-normal">{recharge.paymentId}</span>
                          </div>

                          {/* Order ID */}
                          <div className="text-[12px] mb-3 truncate font-sans">
                            <span className="text-[#64748B] font-medium">Order ID: </span>
                            <span className="text-[#0F172A] font-normal">{recharge.orderId}</span>
                          </div>

                          {/* Transaction ID / Amount Box */}
                          <div className="flex items-center justify-between bg-[#F8FAFC] rounded-xl px-3 py-2.5">
                            <div className="min-w-0">
                              <div className="text-[12px] font-normal text-[#94A3B8] uppercase tracking-wider font-sans">Transaction ID</div>
                              <div className="text-[12px] font-semibold text-[#00A86B] mt-0.5 truncate font-sans">{recharge.transactionId}</div>
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

              {/* Mobile Recharge Pagination */}
              {useMobilePaginationBar({
                page: rechargePage,
                setPage: setRechargePage,
                totalPages: totalRechargePages,
                rowsPerPage: rechargeRowsPerPage,
                setRowsPerPage: setRechargeRowsPerPage,
                startIndex: rechargeStartIndex,
                endIndex: rechargeEndIndex,
                totalItems: filteredWalletRechargeData.length,
              })}
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
                <thead className="sticky top-0 z-20">
                  <tr className="bg-[#E6F5F1] text-xs font-medium text-[#00A86B] uppercase tracking-wider">
                    <th className="p-3 w-10 text-left align-middle">
                      <input type="checkbox" checked={selectedInvoiceOrders.length === filteredInvoicesData.length && filteredInvoicesData.length > 0} onChange={toggleAllInvoices} className="rounded border-[#00A86B] accent-[#00A86B] w-3.5 h-3.5" />
                    </th>
                    <th className="p-3 text-left align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 shrink-0" />
                        <span>User</span>
                      </div>
                    </th>
                    <th className="p-3 text-left align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span>Invoice No.</span>
                      </div>
                    </th>
                    <th className="p-3 text-left align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 shrink-0" />
                        <span>Shipments</span>
                      </div>
                    </th>
                    <th className="p-3 text-left align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Banknote className="w-3.5 h-3.5 shrink-0" />
                        <span>Amount</span>
                      </div>
                    </th>
                    <th className="p-3 text-left align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>Created Date</span>
                      </div>
                    </th>
                    <th className="p-3 text-left align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>Period</span>
                      </div>
                    </th>
                    <th className="p-3 text-left align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>Status</span>
                      </div>
                    </th>
                    <th className="p-3 text-center align-middle whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <Settings className="w-3.5 h-3.5 shrink-0" />
                        <span>Actions</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[11px] text-[#475569]">
                  {paginatedInvoicesData.map((invoice) => (
                    <tr key={invoice.invoiceNumber} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors group">
                      <td className="p-3">
                        <input type="checkbox" checked={selectedInvoiceOrders.includes(invoice.invoiceNumber)} onChange={() => toggleSelectInvoice(invoice.invoiceNumber)} className="rounded border-gray-300 accent-[#00A86B] w-3.5 h-3.5" />
                      </td>
                      <td className="p-3">
                        <div className="text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline uppercase">{invoice.id}</div>
                        <TruncatedText text={invoice.userName} maxLength={20} className="text-[14px] font-semibold font-sans text-[#0F172A] mt-0.5 max-w-[160px]" />
                        <TruncatedText text={invoice.userEmail} maxLength={25} className="text-[12px] font-normal font-sans text-[#94A3B8] max-w-[180px]" />
                      </td>
                      <td className="p-3">
                        <div className="text-xs font-semibold text-[#00A86B]">{invoice.invoiceNumber}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-[12px] font-normal font-sans text-[#64748B]">{invoice.shipments}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-[12px] font-normal font-sans text-[#0F172A]">₹{invoice.amount.toFixed(2)}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-[12px] font-normal font-sans text-[#64748B]">{invoice.createdOn}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-[12px] font-normal font-sans text-[#64748B]">{invoice.invoicePeriod}</div>
                      </td>
                      <td className="p-3">
                        <span className={getStatusBadgeClass(invoice.status)}>{invoice.status}</span>
                      </td>
                      <td className="p-3 text-center align-middle">
                        <div className="flex items-center justify-center gap-2">
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
                      <td colSpan={9} className="p-8 text-center text-[#64748B] font-medium">
                        No invoice records found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Desktop Invoices Pagination */}
            <div className="hidden md:block">
              {totalInvoicePages > 0 && (
                <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-xs text-[#64748B]">
                      Showing <span className="font-bold text-[#0F172A]">{invoiceStartIndex}</span> to <span className="font-bold text-[#0F172A]">{invoiceEndIndex}</span> of <span className="font-bold text-[#0F172A]">{filteredInvoicesData.length}</span> entries
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-[#94A3B8] font-semibold uppercase tracking-wider">Show</span>
                      <select
                        value={invoiceRowsPerPage}
                        onChange={(e) => setInvoiceRowsPerPage(Number(e.target.value))}
                        className="h-8 px-2.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-bold text-[#475569] cursor-pointer appearance-none min-w-[56px] text-center shadow-sm hover:border-[#00A86B]/40 hover:shadow-[0_0_0_3px_rgba(0,168,107,0.06)] focus:outline-none focus:border-[#00A86B] focus:shadow-[0_0_0_3px_rgba(0,168,107,0.1)] transition-all duration-200 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_8px_center] bg-no-repeat pr-7"
                      >
                        {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setInvoicePage(p => Math.max(1, p - 1))}
                      disabled={invoicePage === 1}
                      className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalInvoicePages }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setInvoicePage(i + 1)}
                        className={`w-8 h-8 rounded text-xs font-medium flex items-center justify-center transition-colors ${
                          invoicePage === i + 1 ? 'bg-[#00A86B] text-white border border-[#00A86B]' : 'border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setInvoicePage(p => Math.min(totalInvoicePages, p + 1))}
                      disabled={invoicePage === totalInvoicePages}
                      className="px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden flex-1 overflow-y-auto">
              {paginatedInvoicesData.length === 0 ? (
                <div className="p-8 text-center text-[#64748B] font-medium text-sm">
                  No invoice records found.
                </div>
              ) : (
                <div className="p-4 space-y-4 bg-[#F8FAFC]">
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

                        <div className="pt-8 px-4 pb-4">
                          {/* User Info + Actions */}
                          <div className="flex items-center justify-between mb-3 gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={selectedInvoiceOrders.includes(invoice.invoiceNumber)}
                                onChange={() => toggleSelectInvoice(invoice.invoiceNumber)}
                                className="rounded border-gray-300 accent-[#00A86B] w-4 h-4 shrink-0"
                              />
                              <div className="w-8 h-8 rounded-full bg-[#E6F5F1] text-[#00A86B] font-bold text-xs flex items-center justify-center shrink-0">
                                {invoice.userName.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div
                                  className={`text-[12px] font-normal text-[#0F172A] truncate font-sans ${invoice.userName.length > 16 ? 'active:opacity-60' : ''}`}
                                  title={invoice.userName.length > 16 ? invoice.userName : undefined}
                                  onClick={invoice.userName.length > 16 ? () => showToast('success', invoice.userName) : undefined}
                                >
                                  {truncateChars(invoice.userName, 16)}
                                </div>
                                <div
                                  className={`text-[12px] font-normal text-[#94A3B8] font-sans truncate ${invoice.userEmail.length > 15 ? 'active:opacity-60' : ''}`}
                                  title={invoice.userEmail.length > 15 ? invoice.userEmail : undefined}
                                  onClick={invoice.userEmail.length > 15 ? () => showToast('success', invoice.userEmail) : undefined}
                                >
                                  {truncateChars(invoice.userEmail, 15)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[12px] font-semibold text-[#00A86B] font-sans">{invoice.id}</span>
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
                          </div>

                          {/* Created At / Period */}
                          <div className="flex items-center justify-between text-[12px] mb-3 font-sans">
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
                          <div className="grid grid-cols-3 gap-2 items-start bg-[#F8FAFC] rounded-xl px-3 py-2.5">
                            <div className="min-w-0">
                              <div className="text-[12px] font-normal text-[#94A3B8] uppercase tracking-wider font-sans">Invoice No</div>
                              <div
                                className={`text-[12px] font-semibold text-[#00A86B] mt-0.5 font-sans truncate ${invoice.invoiceNumber.length > 20 ? 'active:opacity-60' : ''}`}
                                title={invoice.invoiceNumber.length > 20 ? invoice.invoiceNumber : undefined}
                                onClick={invoice.invoiceNumber.length > 20 ? () => showToast('success', invoice.invoiceNumber) : undefined}
                              >
                                {truncateChars(invoice.invoiceNumber, 20)}
                              </div>
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

              {/* Mobile Invoices Pagination */}
              {useMobilePaginationBar({
                page: invoicePage,
                setPage: setInvoicePage,
                totalPages: totalInvoicePages,
                rowsPerPage: invoiceRowsPerPage,
                setRowsPerPage: setInvoiceRowsPerPage,
                startIndex: invoiceStartIndex,
                endIndex: invoiceEndIndex,
                totalItems: filteredInvoicesData.length,
              })}
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
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  {/* Modal Header & Tabs Navigation */}
                  <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                    {/* Tab Selection */}
                    <div className="flex gap-4">
                      {['Updation'].map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setModalActiveTab(tab)}
                          className={`relative pb-2 text-[13px] font-bold transition-all ${
                            modalActiveTab === tab ? 'text-[#00A86B]' : 'text-[#64748B] hover:text-[#0F172A]'
                          }`}
                        >
                          {tab}
                          {modalActiveTab === tab && (
                            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00A86B]" />
                          )}
                        </button>
                      ))}
                    </div>
                    
                    <button 
                      onClick={() => setIsUpdateModalOpen(false)}
                      type="button"
                      className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Form Content depending on Active Tab */}
                  <form onSubmit={handleUpdatePassbookSubmit} className="mt-6 space-y-4 text-left">
                    {modalActiveTab === 'Updation' && (
                      <>
                        {/* 1. Seller Name Search with Autocomplete */}
                        <div className="relative">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Search by Name, Email, or Contact</label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              placeholder="Search by Name, Email, or Contact"
                              value={modalSellerQuery}
                              onChange={(e) => {
                                setModalSellerQuery(e.target.value);
                                setModalSelectedSeller(null); // Clear selected if they edit
                              }}
                              className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B] font-semibold"
                            />
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          </div>

                          {/* Autocomplete Suggestions Box */}
                          {!modalSelectedSeller && modalSellerQuery.trim() !== '' && (
                            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#E2E8F0] rounded-xl shadow-xl max-h-48 overflow-y-auto z-[120] py-1">
                              {SELLER_DATABASE.filter(seller => 
                                seller.userName.toLowerCase().includes(modalSellerQuery.toLowerCase()) ||
                                seller.userEmail.toLowerCase().includes(modalSellerQuery.toLowerCase()) ||
                                seller.mobile.includes(modalSellerQuery)
                              ).map((seller) => (
                                <button
                                  key={seller.userName}
                                  type="button"
                                  onClick={() => {
                                    setModalSelectedSeller(seller);
                                    setModalSellerQuery(seller.userName);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-[#F0FDF4] transition-colors flex items-center justify-between"
                                >
                                  <div>
                                    <div className="text-xs font-bold text-slate-800">{seller.userName}</div>
                                    <div className="text-[10px] text-slate-400">{seller.userEmail}</div>
                                  </div>
                                  <div className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{seller.mobile}</div>
                                </button>
                              ))}
                              {SELLER_DATABASE.filter(seller => 
                                seller.userName.toLowerCase().includes(modalSellerQuery.toLowerCase()) ||
                                seller.userEmail.toLowerCase().includes(modalSellerQuery.toLowerCase()) ||
                                seller.mobile.includes(modalSellerQuery)
                              ).length === 0 && (
                                <div className="px-4 py-2.5 text-xs text-slate-500 italic">No matches found. Try another query.</div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 2 & 3. Category & Amount (Side-by-Side) */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                            <GlassSingleSelect
                              options={UPB_CATEGORY_OPTIONS}
                              value={modalCategory}
                              onChange={setModalCategory}
                              placeholder="Select Category"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Amount</label>
                            <input
                              type="number"
                              required
                              placeholder="Amount"
                              value={modalAmount}
                              onChange={(e) => setModalAmount(e.target.value)}
                              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B] font-bold"
                            />
                          </div>
                        </div>

                        {/* Mode Select: Debit / Credit */}
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Transaction Mode</label>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => setModalMode('Credit')}
                              className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all font-bold text-xs ${
                                modalMode === 'Credit'
                                  ? 'border-[#00A86B] bg-[#F0FDF4] text-[#00A86B]'
                                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              <ArrowUpCircle className="w-4 h-4" /> Credit
                            </button>
                            <button
                              type="button"
                              onClick={() => setModalMode('Debit')}
                              className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all font-bold text-xs ${
                                modalMode === 'Debit'
                                  ? 'border-red-500 bg-red-50 text-red-500'
                                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              <ArrowDownCircle className="w-4 h-4" /> Debit
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {modalActiveTab !== 'Updation' && (
                      <div className="py-8 text-center text-slate-500 text-xs italic">
                        The {modalActiveTab} layout has been routed to manual updates. Complete your details on the 'Updation' tab for manual balancing of charges.
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-6">
                      <button
                        type="submit"
                        disabled={modalActiveTab !== 'Updation'}
                        className="flex-1 h-10 rounded-xl bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors flex items-center justify-center shadow-sm disabled:opacity-50"
                      >
                        Submit
                      </button>
                      <button
                        onClick={() => setIsUpdateModalOpen(false)}
                        type="button"
                        className="flex-1 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
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
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  {/* Modal Header & Tabs Navigation */}
                  <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                    {/* Tab Selection */}
                    <div className="flex gap-4">
                      {['Updation'].map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setModalActiveTab(tab)}
                          className={`relative pb-2 text-[13px] font-bold transition-all ${
                            modalActiveTab === tab ? 'text-[#00A86B] ' : 'text-[#64748B] hover:text-[#0F172A]'
                          }`}
                        >
                          {tab}
                          {modalActiveTab === tab && (
                            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00A86B]" />
                          )}
                        </button>
                      ))}
                    </div>
                    
                    <button 
                      onClick={() => setIsUpdateModalOpen(false)}
                      type="button"
                      className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Form Content depending on Active Tab */}
                  <form onSubmit={handleUpdatePassbookSubmit} className="mt-6 space-y-4 text-left">
                    {modalActiveTab === 'Updation' && (
                      <>
                        {/* 1. Seller Name Search with Autocomplete */}
                        <div className="relative">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Search by Name, Email, or Contact</label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              placeholder="Search by Name, Email, or Contact"
                              value={modalSellerQuery}
                              onChange={(e) => {
                                setModalSellerQuery(e.target.value);
                                setModalSelectedSeller(null); // Clear selected if they edit
                              }}
                              className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B] font-semibold"
                            />
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          </div>

                          {/* Autocomplete Suggestions Box */}
                          {!modalSelectedSeller && modalSellerQuery.trim() !== '' && (
                            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#E2E8F0] rounded-xl shadow-xl max-h-48 overflow-y-auto z-[120] py-1">
                              {SELLER_DATABASE.filter(seller => 
                                seller.userName.toLowerCase().includes(modalSellerQuery.toLowerCase()) ||
                                seller.userEmail.toLowerCase().includes(modalSellerQuery.toLowerCase()) ||
                                seller.mobile.includes(modalSellerQuery)
                              ).map((seller) => (
                                <button
                                  key={seller.userName}
                                  type="button"
                                  onClick={() => {
                                    setModalSelectedSeller(seller);
                                    setModalSellerQuery(seller.userName);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-[#F0FDF4] transition-colors flex items-center justify-between"
                                >
                                  <div>
                                    <div className="text-xs font-bold text-slate-800">{seller.userName}</div>
                                    <div className="text-[10px] text-slate-400">{seller.userEmail}</div>
                                  </div>
                                  <div className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{seller.mobile}</div>
                                </button>
                              ))}
                              {SELLER_DATABASE.filter(seller => 
                                seller.userName.toLowerCase().includes(modalSellerQuery.toLowerCase()) ||
                                seller.userEmail.toLowerCase().includes(modalSellerQuery.toLowerCase()) ||
                                seller.mobile.includes(modalSellerQuery)
                              ).length === 0 && (
                                <div className="px-4 py-2.5 text-xs text-slate-500 italic">No matches found. Try another query.</div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 2 & 3. Category & Amount (Side-by-Side) */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                            <GlassSingleSelect
                              options={UPB_CATEGORY_OPTIONS}
                              value={modalCategory}
                              onChange={setModalCategory}
                              placeholder="Select Category"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Amount</label>
                            <input
                              type="number"
                              required
                              placeholder="Amount"
                              value={modalAmount}
                              onChange={(e) => setModalAmount(e.target.value)}
                              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#00A86B] font-bold"
                            />
                          </div>
                        </div>

                        {/* Mode Select: Debit / Credit */}
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Transaction Mode</label>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => setModalMode('Credit')}
                              className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all font-bold text-xs ${
                                modalMode === 'Credit'
                                  ? 'border-[#00A86B] bg-[#F0FDF4] text-[#00A86B]'
                                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              <ArrowUpCircle className="w-4 h-4" /> Credit
                            </button>
                            <button
                              type="button"
                              onClick={() => setModalMode('Debit')}
                              className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all font-bold text-xs ${
                                modalMode === 'Debit'
                                  ? 'border-red-500 bg-red-50 text-red-500'
                                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              <ArrowDownCircle className="w-4 h-4" /> Debit
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {modalActiveTab !== 'Updation' && (
                      <div className="py-8 text-center text-slate-500 text-xs italic">
                        The {modalActiveTab} layout has been routed to manual updates. Complete your details on the 'Updation' tab for manual balancing of charges.
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-6">
                      <button
                        type="submit"
                        disabled={modalActiveTab !== 'Updation'}
                        className="flex-1 h-10 rounded-xl bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors flex items-center justify-center shadow-sm disabled:opacity-50"
                      >
                        Submit
                      </button>
                      <button
                        onClick={() => setIsUpdateModalOpen(false)}
                        type="button"
                        className="flex-1 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Floating Bot Button */}
        {activeTab === 'Passbook' && (
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
                onClick={() => {
                  setModalSelectedSeller(null);
                  setModalSellerQuery('');
                  setModalAwb('');
                  setModalOrderId('');
                  setModalMode('Credit');
                  setModalAmount('');
                  setModalDescription('Credit Note Received');
                  setModalCategory('credit note');
                  setModalActiveTab('Updation');
                  setIsUpdateModalOpen(true);
                }}
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
                  setModalSelectedSeller(null);
                  setModalSellerQuery('');
                  setModalAwb('');
                  setModalOrderId('');
                  setModalMode('Credit');
                  setModalAmount('');
                  setModalDescription('Credit Note Received');
                  setModalCategory('credit note');
                  setModalActiveTab('Updation');
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
                    <thead className="sticky top-0 z-20">
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
                        {COURIER_OPTIONS.map(opt => (
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
                        onDateChange={(s, e) => { setPassbookDateStart(s); setPassbookDateEnd(e); }}
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
                        onDateChange={(s, e) => { setRechargeDateStart(s); setRechargeDateEnd(e); }}
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
                        onDateChange={(s, e) => { setInvoiceDateStart(s); setInvoiceDateEnd(e); }}
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
                      if (activeTab === 'Shipping') {
                        setSearchTerm('');
                        setSelectedSearchTypes([]);
                        setSearchTypeId('');
                        setSelectedCouriers([]);
                        setSelectedStatuses([]);
                        setShippingDateStart('');
                        setShippingDateEnd('');
                      } else if (activeTab === 'Passbook') {
                        setPassbookSearchTerm('');
                        setPassbookOrderId('');
                        setPassbookAwb('');
                        setSelectedCategories([]);
                        setSelectedDescriptions([]);
                        setPassbookDateStart('');
                        setPassbookDateEnd('');
                      } else if (activeTab === 'Wallet Recharge') {
                        setRechargeSearchTerm('');
                        setRechargeTxnId('');
                        setSelectedPaymentMethods([]);
                        setSelectedRechargeStatuses([]);
                        setRechargeDateStart('');
                        setRechargeDateEnd('');
                      } else if (activeTab === 'Invoices') {
                        setInvoiceSearchTerm('');
                        setSelectedMonths([]);
                        setSelectedYears([]);
                        setInvoiceDateStart('');
                        setInvoiceDateEnd('');
                      }
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
                    className="flex-1 h-11 rounded-xl bg-[#00A86B] text-white text-sm font-bold hover:bg-[#009B63]"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
