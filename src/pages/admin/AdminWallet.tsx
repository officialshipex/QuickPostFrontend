import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { usePagination } from '../../hooks/usePagination';
import { Search, ChevronDown, RefreshCcw, Calendar, Check, Package, User, Truck, Banknote, Clock, Upload, Download, MoreVertical, Wallet, ArrowDownCircle, ArrowUpCircle, FileText, Plus, TrendingUp, ChevronLeft, ChevronRight, MinusCircle, Send, Eye, AlertCircle, CheckCircle2, X, CreditCard, Filter, Layers, Hash, CalendarDays, Bot, ArrowLeft, Settings } from 'lucide-react';
import { GlassDropdown } from '../../components/ui/GlassDropdown';
import { GlassDateFilter } from '../../components/ui/GlassDateFilter';
import { GlassSingleSelect } from '../../components/ui/GlassSingleSelect';

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
  return `${STATUS_BADGE_STYLES[normalized] || 'bg-blue-50 text-blue-700 border-blue-200'} px-2.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap shadow-sm`;
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

  const [activeTab, setActiveTab] = useState('Shipping');
  const [toast, setToast] = useState<{type: 'error' | 'success', text: string} | null>(null);

  const showToast = (type: 'error' | 'success', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  // Wallet Balance State
  const [walletBalance, setWalletBalance] = useState(71234.82);

  // Stateful Data Lists
  const [shippingList, setShippingList] = useState(SHIPPING_DATA);
  const [passbookList, setPassbookList] = useState(PASSBOOK_DATA);
  const [rechargeList, setRechargeList] = useState(WALLET_RECHARGE_DATA);
  const [invoiceList, setInvoiceList] = useState(INVOICES_DATA);

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
  } = usePagination({ data: filteredShippingData, perPage: 10 });

  const {
    page: passbookPage,
    setPage: setPassbookPage,
    totalPages: totalPassbookPages,
    paginatedData: paginatedPassbookData,
    startIndex: passbookStartIndex,
    endIndex: passbookEndIndex,
  } = usePagination({ data: filteredPassbookData, perPage: 10 });

  const {
    page: rechargePage,
    setPage: setRechargePage,
    totalPages: totalRechargePages,
    paginatedData: paginatedRechargeData,
    startIndex: rechargeStartIndex,
    endIndex: rechargeEndIndex,
  } = usePagination({ data: filteredWalletRechargeData, perPage: 10 });

  const {
    page: invoicePage,
    setPage: setInvoicePage,
    totalPages: totalInvoicePages,
    paginatedData: paginatedInvoicesData,
    startIndex: invoiceStartIndex,
    endIndex: invoiceEndIndex,
  } = usePagination({ data: filteredInvoicesData, perPage: 10 });

  // Bulk Actions & Helpers
  const handleRefresh = () => {
    setHeaderMobileSearch('');
    setSearchTerm('');
    setSelectedSearchTypes([]);
    setSearchTypeId('');
    setSelectedCouriers([]);
    setSelectedStatuses([]);
    setShippingDateStart(''); setShippingDateEnd('');
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
              <input 
                type="text" 
                placeholder="Search by name, email, o..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[180px] shrink-0" 
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
                className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-32 shrink-0" 
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
                     className="h-9 pl-4 pr-8 rounded-full border border-[#E2E8F0] text-xs bg-white focus:outline-none flex items-center font-bold text-[#475569] shadow-sm hover:bg-[#F8FAFC] transition-colors"
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
              <input 
                type="text" 
                placeholder="Search by name, email, o..." 
                value={passbookSearchTerm}
                onChange={(e) => setPassbookSearchTerm(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[180px] shrink-0" 
              />
              
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
                onClick={() => showToast('success', 'Passbook filters applied successfully!')}
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
                     className="h-9 pl-4 pr-8 rounded-full border border-[#E2E8F0] text-xs bg-white focus:outline-none flex items-center font-bold text-[#475569] shadow-sm hover:bg-[#F8FAFC] transition-colors"
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
              <input 
                type="text" 
                placeholder="Search by name, email, o..." 
                value={rechargeSearchTerm}
                onChange={(e) => setRechargeSearchTerm(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[180px] shrink-0" 
              />
              
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
                onClick={() => showToast('success', 'Wallet Recharge filters applied successfully!')}
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
                     className="h-9 pl-4 pr-8 rounded-full border border-[#E2E8F0] text-xs bg-white focus:outline-none flex items-center font-bold text-[#475569] shadow-sm hover:bg-[#F8FAFC] transition-colors"
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
              <input 
                type="text" 
                placeholder="Search by name, email, o..." 
                value={invoiceSearchTerm}
                onChange={(e) => setInvoiceSearchTerm(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none w-[180px] shrink-0" 
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
                     className="h-9 pl-4 pr-8 rounded-full border border-[#E2E8F0] text-xs bg-white focus:outline-none flex items-center font-bold text-[#475569] shadow-sm hover:bg-[#F8FAFC] transition-colors"
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
                        <div className="text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline">{order.id}</div>
                        <div className="text-sm font-semibold text-[#0F172A] mt-0.5">{order.userName}</div>
                        <div className="font-sans text-xs font-normal text-[#94A3B8]">{order.userEmail}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline">{order.id}</div>
                        <div className="table-date mt-0.5">{order.date}</div>
                        <div className="table-date mt-0.5">{order.day}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-xs font-semibold text-[#00A86B]">{order.courier}</div>
                        <div className="table-date mt-0.5">Booked On : {order.bookedDate}</div>
                        <div className="text-xs font-semibold text-[#00A86B] underline decoration-solid underline-offset-2 mt-0.5 hover:text-[#009B63] cursor-pointer">{order.awb}</div>
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
                      <td className="p-3 text-center align-middle">
                        <button 
                          onClick={() => setActiveShipmentHistory(order)}
                          className="px-3 py-1.5 rounded-full bg-[#1E3A8A] text-white text-[10px] font-bold hover:bg-[#1E3A8A]/90 transition-colors mx-auto inline-block"
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
            
            {/* Shipping Pagination */}
            {totalShippingPages > 0 && (
              <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between">
                <div className="text-xs text-[#64748B]">
                  Showing <span className="font-bold text-[#0F172A]">{shippingStartIndex}</span> to <span className="font-bold text-[#0F172A]">{shippingEndIndex}</span> of <span className="font-bold text-[#0F172A]">{filteredShippingData.length}</span> entries
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
                        <div className="text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline">{order.id}</div>
                        <div className="text-sm font-semibold text-[#0F172A] mt-0.5">{order.userName}</div>
                        <div className="font-sans text-xs font-normal text-[#94A3B8]">{order.userEmail}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline">{order.id}</div>
                        <div className="table-date mt-0.5">{order.date}</div>
                        <div className="table-date mt-0.5">{order.day}</div>
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

            {/* Passbook Pagination */}
            {totalPassbookPages > 0 && (
              <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between">
                <div className="text-xs text-[#64748B]">
                  Showing <span className="font-bold text-[#0F172A]">{passbookStartIndex}</span> to <span className="font-bold text-[#0F172A]">{passbookEndIndex}</span> of <span className="font-bold text-[#0F172A]">{filteredPassbookData.length}</span> entries
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
                        <div className="text-sm font-semibold text-[#0F172A] mt-0.5">{recharge.userName}</div>
                        <div className="font-sans text-xs font-normal text-[#94A3B8]">{recharge.userEmail}</div>
                      </td>
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
                      <td colSpan={7} className="p-8 text-center text-[#64748B] font-medium">
                        No recharge transactions found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Recharge Pagination */}
            {totalRechargePages > 0 && (
              <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between">
                <div className="text-xs text-[#64748B]">
                  Showing <span className="font-bold text-[#0F172A]">{rechargeStartIndex}</span> to <span className="font-bold text-[#0F172A]">{rechargeEndIndex}</span> of <span className="font-bold text-[#0F172A]">{filteredWalletRechargeData.length}</span> entries
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
                        <div className="text-sm font-semibold text-[#0F172A] mt-0.5">{invoice.userName}</div>
                        <div className="font-sans text-xs font-normal text-[#94A3B8]">{invoice.userEmail}</div>
                      </td>
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

            {/* Invoices Pagination */}
            {totalInvoicePages > 0 && (
              <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between">
                <div className="text-xs text-[#64748B]">
                  Showing <span className="font-bold text-[#0F172A]">{invoiceStartIndex}</span> to <span className="font-bold text-[#0F172A]">{invoiceEndIndex}</span> of <span className="font-bold text-[#0F172A]">{filteredInvoicesData.length}</span> entries
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
