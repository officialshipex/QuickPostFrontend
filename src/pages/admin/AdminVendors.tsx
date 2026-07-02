import React, { useState, useMemo } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { usePagination } from '../../hooks/usePagination';
import { 
  Search, Store, CheckCircle2, Clock, XCircle, IndianRupee, Package, 
  TrendingUp, Eye, ChevronLeft, ChevronRight, SlidersHorizontal, 
  Trash2, Edit3, Plus, X, Check, Building2, CreditCard, ArrowUpDown, 
  ChevronDown, User, Mail, Phone, MapPin, Download, AlertTriangle, 
  ShieldAlert, Sparkles, AlertCircle, Ban, RefreshCcw, FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Vendor {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  gst: string;
  pan: string;
  status: 'Approved' | 'Pending Approval' | 'Rejected' | 'Suspended';
  orders: number;
  revenue: number; // in Rupees
  city: string;
  joined: string;
  score: number;
  bankName: string;
  accountNum: string;
  ifsc: string;
  address: string;
}

const INITIAL_MOCK_VENDORS: Vendor[] = [
  {
    id: 'VND05001',
    name: 'SuperMart Pvt Ltd',
    ownerName: 'Ramesh Sharma',
    email: 'vendor1@business.com',
    phone: '+91 9100000000',
    gst: '29AABCU9361F1ZL',
    pan: 'ABCDE1234F',
    status: 'Approved',
    orders: 12450,
    revenue: 4250000,
    city: 'Mumbai',
    joined: 'Jan 2026',
    score: 98,
    bankName: 'HDFC Bank',
    accountNum: '50100412345678',
    ifsc: 'HDFC0000123',
    address: '402, Trade Centre, Bandra Kurla Complex, Mumbai, Maharashtra 400051',
  },
  {
    id: 'VND05002',
    name: 'Fashion Hub',
    ownerName: 'Priya Patel',
    email: 'vendor2@business.com',
    phone: '+91 9100000222',
    gst: '29AABCU9362F1ZL',
    pan: 'BCDEF2345G',
    status: 'Approved',
    orders: 8210,
    revenue: 2410000,
    city: 'Delhi',
    joined: 'Feb 2026',
    score: 95,
    bankName: 'ICICI Bank',
    accountNum: '000401567890',
    ifsc: 'ICIC0000004',
    address: 'A-12, Connaught Place, New Delhi, Delhi 110001',
  },
  {
    id: 'VND05003',
    name: 'ElectroWorld',
    ownerName: 'Amit Verma',
    email: 'vendor3@business.com',
    phone: '+91 9100000444',
    gst: '29AABCU9363F1ZL',
    pan: 'CDEFG3456H',
    status: 'Approved',
    orders: 5600,
    revenue: 5580000,
    city: 'Bangalore',
    joined: 'Mar 2026',
    score: 99,
    bankName: 'State Bank of India',
    accountNum: '30912345678',
    ifsc: 'SBIN0000847',
    address: 'Building 4B, Manyata Tech Park, Outer Ring Road, Bangalore, Karnataka 560045',
  },
  {
    id: 'VND05004',
    name: 'Beauty Basics',
    ownerName: 'Neha Sen',
    email: 'vendor4@business.com',
    phone: '+91 9100000666',
    gst: '29AABCU9364F1ZL',
    pan: 'DEFGH4567I',
    status: 'Approved',
    orders: 4100,
    revenue: 1240000,
    city: 'Hyderabad',
    joined: 'Apr 2026',
    score: 92,
    bankName: 'Axis Bank',
    accountNum: '912010045678912',
    ifsc: 'UTIB0000045',
    address: 'Plot 18, Gachibowli, Hyderabad, Telangana 500032',
  },
  {
    id: 'VND05005',
    name: 'Home Essentials',
    ownerName: 'Vikram Malhotra',
    email: 'vendor5@business.com',
    phone: '+91 9100000888',
    gst: '29AABCU9365F1ZL',
    pan: 'EFGHI5678J',
    status: 'Approved',
    orders: 3800,
    revenue: 1890000,
    city: 'Chennai',
    joined: 'May 2026',
    score: 96,
    bankName: 'Kotak Mahindra Bank',
    accountNum: '2811456789',
    ifsc: 'KKBK0000958',
    address: '56, Mount Road, Teynampet, Chennai, Tamil Nadu 600018',
  },
  {
    id: 'VND05006',
    name: 'GadgetZone',
    ownerName: 'Siddharth Roy',
    email: 'vendor6@business.com',
    phone: '+91 9100001110',
    gst: '29AABCU9366F1ZL',
    pan: 'FGHIJ6789K',
    status: 'Approved',
    orders: 2900,
    revenue: 820000,
    city: 'Pune',
    joined: 'Jun 2026',
    score: 88,
    bankName: 'Yes Bank',
    accountNum: '012394700000123',
    ifsc: 'YESB0000123',
    address: 'Office 7, Hinjewadi Phase 1, Pune, Maharashtra 411057',
  },
  {
    id: 'VND05007',
    name: 'StyleCraft',
    ownerName: 'Sanjay Jain',
    email: 'vendor7@business.com',
    phone: '+91 9100001332',
    gst: '29AABCU9367F1ZL',
    pan: 'GHIJK7890L',
    status: 'Approved',
    orders: 2100,
    revenue: 610000,
    city: 'Kolkata',
    joined: 'Jul 2026',
    score: 91,
    bankName: 'IndusInd Bank',
    accountNum: '100056789012',
    ifsc: 'INDB0000012',
    address: 'Block EP, Sector V, Salt Lake City, Kolkata, West Bengal 700091',
  },
  {
    id: 'VND05008',
    name: 'FitGear India',
    ownerName: 'Rajesh Nair',
    email: 'vendor8@business.com',
    phone: '+91 9100001554',
    gst: '29AABCU9368F1ZL',
    pan: 'HIJKL8901M',
    status: 'Approved',
    orders: 1800,
    revenue: 480000,
    city: 'Ahmedabad',
    joined: 'Aug 2026',
    score: 85,
    bankName: 'Federal Bank',
    accountNum: '10230100456789',
    ifsc: 'FDRL0001023',
    address: 'SG Highway, Bodakdev, Ahmedabad, Gujarat 380054',
  },
  {
    id: 'VND05009',
    name: 'BookWorm',
    ownerName: 'Divya Joshi',
    email: 'vendor9@business.com',
    phone: '+91 9100001776',
    gst: '29AABCU9369F1ZL',
    pan: 'IJKLM9012N',
    status: 'Approved',
    orders: 1500,
    revenue: 320000,
    city: 'Jaipur',
    joined: 'Sep 2026',
    score: 90,
    bankName: 'Bank of Baroda',
    accountNum: '00230100045678',
    ifsc: 'BARB0JAIPUR',
    address: 'M.I. Road, Jaipur, Rajasthan 302001',
  },
  {
    id: 'VND05010',
    name: 'PetCare Plus',
    ownerName: 'Karan Mehra',
    email: 'vendor10@business.com',
    phone: '+91 9100001998',
    gst: '29AABCU9370F1ZL',
    pan: 'JKLMN0123O',
    status: 'Approved',
    orders: 1200,
    revenue: 210000,
    city: 'Lucknow',
    joined: 'Oct 2026',
    score: 87,
    bankName: 'Union Bank of India',
    accountNum: '520101234567890',
    ifsc: 'UBIN0552011',
    address: 'Hazratganj, Lucknow, Uttar Pradesh 226001',
  },
  {
    id: 'VND05011',
    name: 'KidZone',
    ownerName: 'Meera Rajput',
    email: 'vendor11@business.com',
    phone: '+91 9100002220',
    gst: '29AABCU9371F1ZL',
    pan: 'KLMNO1234P',
    status: 'Pending Approval',
    orders: 900,
    revenue: 180000,
    city: 'Chandigarh',
    joined: 'Nov 2026',
    score: 0,
    bankName: 'Punjab National Bank',
    accountNum: '0054000100456789',
    ifsc: 'PUNB0005400',
    address: 'Sector 17, Chandigarh 160017',
  },
  {
    id: 'VND05012',
    name: 'AutoParts Hub',
    ownerName: 'Manish Goel',
    email: 'vendor12@business.com',
    phone: '+91 9100002442',
    gst: '29AABCU9372F1ZL',
    pan: 'LMNOP2345Q',
    status: 'Pending Approval',
    orders: 600,
    revenue: 120000,
    city: 'Indore',
    joined: 'Dec 2026',
    score: 0,
    bankName: 'Canara Bank',
    accountNum: '0124101004567',
    ifsc: 'CNRB0000124',
    address: 'Vijay Nagar, Indore, Madhya Pradesh 452010',
  },
  {
    id: 'VND05013',
    name: 'FreshFarm',
    ownerName: 'Anil Yadav',
    email: 'vendor13@business.com',
    phone: '+91 9100002664',
    gst: '29AABCU9373F1ZL',
    pan: 'MNOPQ3456R',
    status: 'Pending Approval',
    orders: 400,
    revenue: 80000,
    city: 'Bhopal',
    joined: 'Jan 2026',
    score: 0,
    bankName: 'Central Bank of India',
    accountNum: '1004567890',
    ifsc: 'CBIN0280456',
    address: 'Arera Colony, Bhopal, Madhya Pradesh 462016',
  },
  {
    id: 'VND05014',
    name: 'TechNova',
    ownerName: 'Rohan Deshmukh',
    email: 'vendor14@business.com',
    phone: '+91 9100002886',
    gst: '29AABCU9374F1ZL',
    pan: 'NOPQR4567S',
    status: 'Rejected',
    orders: 200,
    revenue: 40000,
    city: 'Kochi',
    joined: 'Feb 2026',
    score: 0,
    bankName: 'IDBI Bank',
    accountNum: '012310400001234',
    ifsc: 'IBKL0000123',
    address: 'M.G. Road, Ernakulam, Kochi, Kerala 682016',
  },
  {
    id: 'VND05015',
    name: 'ArtisanCraft',
    ownerName: 'Elena Gomes',
    email: 'vendor15@business.com',
    phone: '+91 9100003108',
    gst: '29AABCU9375F1ZL',
    pan: 'OPQRS5678T',
    status: 'Rejected',
    orders: 100,
    revenue: 20000,
    city: 'Goa',
    joined: 'Mar 2026',
    score: 0,
    bankName: 'Indian Bank',
    accountNum: '6012456789',
    ifsc: 'IDIB000P042',
    address: 'Panaji, Goa 403001',
  }
];

export function AdminVendors() {
  const [vendors, setVendors] = useState<Vendor[]>(INITIAL_MOCK_VENDORS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Approved' | 'Pending Approval' | 'Rejected' | 'Suspended'>('All');
  const [scoreFilter, setScoreFilter] = useState<string>('All');
  const [cityFilter, setCityFilter] = useState<string>('All');
  const [sortKey, setSortKey] = useState<keyof Vendor>('orders');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  // Drawer / Modals
  const [detailsVendor, setDetailsVendor] = useState<Vendor | null>(null);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [rejectReasonVendor, setRejectReasonVendor] = useState<Vendor | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Tab within details drawer
  const [drawerTab, setDrawerTab] = useState<'overview' | 'financials' | 'shipments'>('overview');

  // Toasts
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Unique cities for city dropdown
  const uniqueCities = useMemo(() => {
    return Array.from(new Set(vendors.map(v => v.city))).sort();
  }, [vendors]);

  // Form states for adding a vendor
  const [newVendor, setNewVendor] = useState({
    name: '',
    ownerName: '',
    email: '',
    phone: '',
    gst: '',
    pan: '',
    city: '',
    bankName: '',
    accountNum: '',
    ifsc: '',
    address: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Form states for editing a vendor
  const [editForm, setEditForm] = useState<Partial<Vendor>>({});

  // Summary Metrics calculations
  const summaryMetrics = useMemo(() => {
    const total = vendors.length;
    const approved = vendors.filter(v => v.status === 'Approved').length;
    const pending = vendors.filter(v => v.status === 'Pending Approval').length;
    const rejectedOrSuspended = vendors.filter(v => v.status === 'Rejected' || v.status === 'Suspended').length;
    
    // Average score of approved vendors with rating > 0
    const scoredApproved = vendors.filter(v => v.status === 'Approved' && v.score > 0);
    const avgScore = scoredApproved.length > 0 
      ? Math.round(scoredApproved.reduce((sum, v) => sum + v.score, 0) / scoredApproved.length) 
      : 0;

    return { total, approved, pending, rejectedOrSuspended, avgScore };
  }, [vendors]);

  // Handle Sort Toggle
  const requestSort = (key: keyof Vendor) => {
    let order: 'asc' | 'desc' = 'asc';
    if (sortKey === key && sortOrder === 'asc') {
      order = 'desc';
    }
    setSortKey(key);
    setSortOrder(order);
  };

  // Filtered & Sorted Vendors
  const filteredVendors = useMemo(() => {
    return vendors
      .filter(v => {
        // Status Filter
        const matchesStatus = activeFilter === 'All' || v.status === activeFilter;
        
        // Search Query (ID, Name, Owner, Email, Phone, GST, City)
        const matchesSearch = searchQuery === '' || 
          v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.phone.includes(searchQuery) ||
          v.gst.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.city.toLowerCase().includes(searchQuery.toLowerCase());

        // Score Filter
        let matchesScore = true;
        if (scoreFilter !== 'All') {
          if (scoreFilter === 'Elite') matchesScore = v.score >= 95;
          else if (scoreFilter === 'Gold') matchesScore = v.score >= 90 && v.score < 95;
          else if (scoreFilter === 'Silver') matchesScore = v.score >= 80 && v.score < 90;
          else if (scoreFilter === 'Bronze') matchesScore = v.score > 0 && v.score < 80;
          else if (scoreFilter === 'No Score') matchesScore = v.score === 0;
        }

        // City Filter
        const matchesCity = cityFilter === 'All' || v.city === cityFilter;

        return matchesStatus && matchesSearch && matchesScore && matchesCity;
      })
      .sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortOrder === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
        }
        
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }
        
        return 0;
      });
  }, [vendors, activeFilter, searchQuery, scoreFilter, cityFilter, sortKey, sortOrder]);

  const {
    page: currentPage,
    setPage: setCurrentPage,
    totalPages,
    paginatedData: paginatedVendors,
    startIndex,
    endIndex,
  } = usePagination({ data: filteredVendors, perPage: 8 });

  // Checkbox functions
  const toggleSelectAll = () => {
    if (selectedVendorIds.length === paginatedVendors.length && paginatedVendors.length > 0) {
      setSelectedVendorIds([]);
    } else {
      setSelectedVendorIds(paginatedVendors.map(v => v.id));
    }
  };

  const toggleSelectVendor = (id: string) => {
    setSelectedVendorIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Format Currency to Lakhs/Thousands
  const formatCurrency = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    return `₹${(value / 1000).toFixed(0)}k`;
  };

  // Form Validation
  const validateForm = (data: typeof newVendor) => {
    const errors: Record<string, string> = {};
    if (!data.name.trim()) errors.name = 'Business name is required';
    if (!data.ownerName.trim()) errors.ownerName = 'Owner name is required';
    if (!data.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      errors.email = 'Invalid email address';
    }
    if (!data.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?([0-9\s-]{8,15})$/.test(data.phone)) {
      errors.phone = 'Invalid phone number';
    }
    if (!data.gst.trim()) {
      errors.gst = 'GSTIN is required';
    } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(data.gst.toUpperCase())) {
      errors.gst = 'Invalid GSTIN format';
    }
    if (!data.pan.trim()) {
      errors.pan = 'PAN is required';
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(data.pan.toUpperCase())) {
      errors.pan = 'Invalid PAN format';
    }
    if (!data.city.trim()) errors.city = 'City is required';
    if (!data.address.trim()) errors.address = 'Address is required';
    
    return errors;
  };

  // Add Vendor Handler
  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(newVendor);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('Please correct form errors.', 'error');
      return;
    }

    const nextIdNum = Math.max(...vendors.map(v => parseInt(v.id.replace('VND', '')))) + 1;
    const generatedId = `VND${String(nextIdNum).padStart(5, '0')}`;

    const vendorToAdd: Vendor = {
      ...newVendor,
      id: generatedId,
      status: 'Pending Approval',
      orders: 0,
      revenue: 0,
      score: 0,
      gst: newVendor.gst.toUpperCase(),
      pan: newVendor.pan.toUpperCase(),
      joined: new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' })
    };

    setVendors(prev => [vendorToAdd, ...prev]);
    setIsAddOpen(false);
    setNewVendor({
      name: '',
      ownerName: '',
      email: '',
      phone: '',
      gst: '',
      pan: '',
      city: '',
      bankName: '',
      accountNum: '',
      ifsc: '',
      address: '',
    });
    setFormErrors({});
    showToast(`Vendor ${vendorToAdd.name} registered as pending approval!`);
  };

  // Edit Vendor Handler
  const handleEditVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVendor) return;

    // Validate using the temporary editForm state
    const merged = { ...editVendor, ...editForm } as any;
    const errors = validateForm(merged);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('Please correct form errors.', 'error');
      return;
    }

    setVendors(prev => prev.map(v => v.id === editVendor.id ? { ...v, ...editForm } as Vendor : v));
    setEditVendor(null);
    setEditForm({});
    setFormErrors({});
    
    // Update active details drawer state if it is currently displaying the edited vendor
    if (detailsVendor?.id === editVendor.id) {
      setDetailsVendor(prev => prev ? { ...prev, ...editForm } as Vendor : null);
    }

    showToast(`Vendor ${merged.name} profile updated successfully!`);
  };

  // Approve Vendor
  const handleApprove = (vendor: Vendor) => {
    setVendors(prev => prev.map(v => {
      if (v.id === vendor.id) {
        return { ...v, status: 'Approved', score: 90 }; // assign a starting performance rating
      }
      return v;
    }));
    
    if (detailsVendor?.id === vendor.id) {
      setDetailsVendor(prev => prev ? { ...prev, status: 'Approved', score: 90 } : null);
    }
    
    showToast(`Vendor "${vendor.name}" has been approved!`);
  };

  // Reject Vendor Submit
  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReasonVendor) return;

    setVendors(prev => prev.map(v => {
      if (v.id === rejectReasonVendor.id) {
        return { ...v, status: 'Rejected' };
      }
      return v;
    }));

    if (detailsVendor?.id === rejectReasonVendor.id) {
      setDetailsVendor(prev => prev ? { ...prev, status: 'Rejected' } : null);
    }

    showToast(`Vendor "${rejectReasonVendor.name}" rejected. Reason: ${rejectionReason || 'None provided'}`, 'info');
    setRejectReasonVendor(null);
    setRejectionReason('');
  };

  // Suspend / Un-suspend Vendor
  const handleToggleSuspend = (vendor: Vendor) => {
    const isCurrentlySuspended = vendor.status === 'Suspended';
    const nextStatus = isCurrentlySuspended ? 'Approved' : 'Suspended';
    
    setVendors(prev => prev.map(v => {
      if (v.id === vendor.id) {
        return { ...v, status: nextStatus };
      }
      return v;
    }));

    if (detailsVendor?.id === vendor.id) {
      setDetailsVendor(prev => prev ? { ...prev, status: nextStatus } : null);
    }

    showToast(
      `Vendor "${vendor.name}" has been ${isCurrentlySuspended ? 'unsuspended' : 'suspended'}!`,
      isCurrentlySuspended ? 'success' : 'error'
    );
  };

  // Delete Vendor Handler
  const handleDeleteVendor = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete vendor "${name}"?`)) {
      setVendors(prev => prev.filter(v => v.id !== id));
      setSelectedVendorIds(prev => prev.filter(x => x !== id));
      if (detailsVendor?.id === id) {
        setDetailsVendor(null);
      }
      showToast(`Vendor "${name}" has been deleted.`, 'error');
    }
  };

  // Bulk Actions Handlers
  const handleBulkApprove = () => {
    setVendors(prev => prev.map(v => 
      selectedVendorIds.includes(v.id) ? { ...v, status: 'Approved', score: v.score === 0 ? 85 : v.score } : v
    ));
    showToast(`Approved ${selectedVendorIds.length} vendors!`);
    setSelectedVendorIds([]);
  };

  const handleBulkReject = () => {
    setVendors(prev => prev.map(v => 
      selectedVendorIds.includes(v.id) ? { ...v, status: 'Rejected' } : v
    ));
    showToast(`Rejected ${selectedVendorIds.length} vendors!`, 'info');
    setSelectedVendorIds([]);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete all ${selectedVendorIds.length} selected vendors?`)) {
      setVendors(prev => prev.filter(v => !selectedVendorIds.includes(v.id)));
      showToast(`Deleted ${selectedVendorIds.length} vendors!`, 'error');
      setSelectedVendorIds([]);
    }
  };

  const handleBulkExport = () => {
    const exportData = vendors.filter(v => selectedVendorIds.includes(v.id));
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["ID,Business Name,Owner,Email,Phone,GST,City,Joined Date,Status,Orders,Revenue"].join("\n") + "\n"
      + exportData.map(v => `"${v.id}","${v.name}","${v.ownerName}","${v.email}","${v.phone}","${v.gst}","${v.city}","${v.joined}","${v.status}",${v.orders},${v.revenue}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `quickpost_vendors_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Exported ${selectedVendorIds.length} vendors to CSV!`);
    setSelectedVendorIds([]);
  };

  // Score tier styles helper
  const getScoreBadgeStyles = (score: number) => {
    if (score >= 95) return 'text-purple-600 bg-purple-50 border-purple-200';
    if (score >= 90) return 'text-amber-600 bg-amber-50 border-amber-200';
    if (score >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score > 0) return 'text-rose-600 bg-rose-50 border-rose-200';
    return 'text-slate-500 bg-slate-50 border-slate-200';
  };

  const getScoreBadgeLabel = (score: number) => {
    if (score >= 95) return 'Elite';
    if (score >= 90) return 'Gold';
    if (score >= 80) return 'Silver';
    if (score > 0) return 'Bronze';
    return 'N/A';
  };

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto text-[#0F172A] pb-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">Vendors Management</h2>
            <p className="text-xs text-[#64748B] mt-1 font-medium">Verify credentials, track performance, and manage marketplace sellers.</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAddOpen(true)}
            className="h-10 px-4 rounded-[14px] bg-gradient-to-b from-[#00b876] to-[#00A86B] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(0,168,107,0.2),inset_0_1px_1px_rgba(255,255,255,0.2)] border border-[#009B63] transition-all cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" /> Add New Vendor
          </motion.button>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-6">
          {[
            { label: 'Total Vendors', value: summaryMetrics.total, description: 'Registered in system', icon: Store, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100' },
            { label: 'Approved Sellers', value: summaryMetrics.approved, description: 'Fully operational', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
            { label: 'Pending Approvals', value: summaryMetrics.pending, description: 'Credentials verification', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
            { label: 'Rejected / Suspended', value: summaryMetrics.rejectedOrSuspended, description: 'Restricted access', icon: Ban, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' },
            { label: 'Avg Performance Score', value: `${summaryMetrics.avgScore}/100`, description: 'Elite tier standards', icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' },
          ].map((card, idx) => (
            <div 
              key={idx} 
              className={`bg-white rounded-2xl border ${card.border} p-4.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group cursor-default`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.bg} group-hover:scale-110 transition-transform`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#0F172A] tracking-tight">{card.value}</div>
                <div className="text-[11px] font-bold text-[#475569] mt-1">{card.label}</div>
                <div className="text-[9px] font-semibold text-[#94A3B8] mt-0.5">{card.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Controls Row */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm mb-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
            
            {/* Status Tabs */}
            <div className="flex flex-wrap gap-1 border-b lg:border-b-0 pb-3 lg:pb-0 border-[#E2E8F0]">
              {(['All', 'Approved', 'Pending Approval', 'Rejected', 'Suspended'] as const).map(tab => {
                const count = tab === 'All' 
                  ? vendors.length 
                  : tab === 'Rejected' 
                    ? vendors.filter(v => v.status === 'Rejected').length 
                    : vendors.filter(v => v.status === tab).length;

                return (
                  <button 
                    key={tab} 
                    onClick={() => {
                      setActiveFilter(tab);
                      setCurrentPage(1);
                    }} 
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeFilter === tab 
                        ? 'bg-[#00A86B]/10 text-[#00A86B]' 
                        : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                    }`}
                  >
                    {tab}
                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                      activeFilter === tab ? 'bg-[#00A86B] text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Advanced Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input 
                  type="text" 
                  placeholder="Search by name, GSTIN, city..." 
                  value={searchQuery} 
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }} 
                  className="w-full h-10 pl-9 pr-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/50 text-xs focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] transition-all text-[#0F172A] placeholder:text-[#94A3B8] font-semibold" 
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569]">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* City Dropdown */}
              <div className="relative shrink-0 w-full sm:w-auto">
                <select
                  value={cityFilter}
                  onChange={(e) => {
                    setCityFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-10 pl-3 pr-8 rounded-xl border border-[#E2E8F0] text-xs bg-white focus:outline-none appearance-none font-bold text-[#475569] w-full sm:w-36 shadow-sm cursor-pointer hover:border-[#CBD5E1] transition-colors"
                >
                  <option value="All">All Cities</option>
                  {uniqueCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
              </div>

              {/* Score Filter */}
              <div className="relative shrink-0 w-full sm:w-auto">
                <select
                  value={scoreFilter}
                  onChange={(e) => {
                    setScoreFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-10 pl-3 pr-8 rounded-xl border border-[#E2E8F0] text-xs bg-white focus:outline-none appearance-none font-bold text-[#475569] w-full sm:w-40 shadow-sm cursor-pointer hover:border-[#CBD5E1] transition-colors"
                >
                  <option value="All">Performance Rating</option>
                  <option value="Elite">Elite (95+)</option>
                  <option value="Gold">Gold (90-94)</option>
                  <option value="Silver">Silver (80-89)</option>
                  <option value="Bronze">Bronze (&lt;80)</option>
                  <option value="No Score">Unverified (N/A)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
              </div>

              {/* Reset Filters */}
              {(searchQuery || cityFilter !== 'All' || scoreFilter !== 'All') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCityFilter('All');
                    setScoreFilter('All');
                    setActiveFilter('All');
                    setCurrentPage(1);
                    showToast('All filters reset successfully!', 'info');
                  }}
                  className="h-10 w-10 flex items-center justify-center rounded-xl border border-[#E2E8F0] hover:bg-slate-50 transition-colors"
                  title="Clear All Filters"
                >
                  <RefreshCcw className="w-4 h-4 text-[#64748B]" />
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Bulk Action Toolbar */}
        <AnimatePresence>
          {selectedVendorIds.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-4 py-3 bg-[#E6F5F1] border border-[#00A86B]/30 rounded-2xl flex flex-wrap items-center gap-3.5 mb-4 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#00A86B] text-white flex items-center justify-center text-[10px] font-bold">
                  {selectedVendorIds.length}
                </div>
                <span className="text-xs font-bold text-[#166534]">vendors selected for bulk actions</span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button 
                  onClick={handleBulkApprove}
                  className="h-8 px-3 rounded-lg bg-white border border-[#00A86B]/30 text-xs font-bold text-[#00A86B] shadow-xs flex items-center gap-1.5 hover:bg-[#00A86B]/5 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Bulk Approve
                </button>
                <button 
                  onClick={handleBulkReject}
                  className="h-8 px-3 rounded-lg bg-white border border-rose-300 text-xs font-bold text-rose-600 shadow-xs flex items-center gap-1.5 hover:bg-rose-50 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" /> Bulk Reject
                </button>
                <button 
                  onClick={handleBulkExport}
                  className="h-8 px-3 rounded-lg bg-white border border-indigo-200 text-xs font-bold text-indigo-600 shadow-xs flex items-center gap-1.5 hover:bg-indigo-50 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Export Selected
                </button>
                <button 
                  onClick={handleBulkDelete}
                  className="h-8 px-3 rounded-lg bg-rose-600 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 hover:bg-rose-700 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Bulk Delete
                </button>
                <button 
                  onClick={() => setSelectedVendorIds([])}
                  className="text-xs text-slate-500 hover:text-slate-700 font-bold ml-2 underline underline-offset-2"
                >
                  Clear Selection
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vendors Data Table */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] uppercase tracking-wider font-extrabold text-[#64748B]">
                  <th className="p-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedVendorIds.length === paginatedVendors.length && paginatedVendors.length > 0} 
                      onChange={toggleSelectAll} 
                      className="rounded border-slate-300 accent-[#00A86B] w-3.5 h-3.5 cursor-pointer" 
                    />
                  </th>
                  <th className="p-4 select-none cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => requestSort('name')}>
                    <div className="flex items-center gap-1.5">
                      Vendor details {sortKey === 'name' && <ArrowUpDown className="w-3 h-3 text-[#00A86B]" />}
                    </div>
                  </th>
                  <th className="p-4">GSTIN & PAN</th>
                  <th className="p-4 select-none cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => requestSort('city')}>
                    <div className="flex items-center gap-1.5">
                      Location {sortKey === 'city' && <ArrowUpDown className="w-3 h-3 text-[#00A86B]" />}
                    </div>
                  </th>
                  <th className="p-4 select-none cursor-pointer hover:bg-slate-100/50 transition-colors text-center" onClick={() => requestSort('orders')}>
                    <div className="flex items-center justify-center gap-1.5">
                      Total Orders {sortKey === 'orders' && <ArrowUpDown className="w-3 h-3 text-[#00A86B]" />}
                    </div>
                  </th>
                  <th className="p-4 select-none cursor-pointer hover:bg-slate-100/50 transition-colors text-right" onClick={() => requestSort('revenue')}>
                    <div className="flex items-center justify-end gap-1.5">
                      Revenue {sortKey === 'revenue' && <ArrowUpDown className="w-3 h-3 text-[#00A86B]" />}
                    </div>
                  </th>
                  <th className="p-4 text-center">Verification Status</th>
                  <th className="p-4 select-none cursor-pointer hover:bg-slate-100/50 transition-colors text-center" onClick={() => requestSort('score')}>
                    <div className="flex items-center justify-center gap-1.5">
                      Rating {sortKey === 'score' && <ArrowUpDown className="w-3 h-3 text-[#00A86B]" />}
                    </div>
                  </th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs font-semibold text-[#475569]">
                {paginatedVendors.map(vendor => {
                  const isSelected = selectedVendorIds.includes(vendor.id);
                  return (
                    <tr 
                      key={vendor.id} 
                      className={`border-b border-[#F1F5F9] hover:bg-[#F8FAFC]/75 transition-colors group ${
                        isSelected ? 'bg-[#00A86B]/5' : ''
                      }`}
                    >
                      <td className="p-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={isSelected} 
                          onChange={() => toggleSelectVendor(vendor.id)} 
                          className="rounded border-slate-300 accent-[#00A86B] w-3.5 h-3.5 cursor-pointer" 
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E6F5F1] to-[#D1EDE6] text-[#00A86B] flex items-center justify-center font-bold text-sm shrink-0 border border-[#00A86B]/15">
                            {vendor.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span 
                                onClick={() => setDetailsVendor(vendor)}
                                className="text-[#0F172A] font-bold text-[13px] hover:text-[#00A86B] hover:underline cursor-pointer transition-colors"
                              >
                                {vendor.name}
                              </span>
                              <span className="text-[9px] font-bold text-[#94A3B8] px-1.5 py-0.5 bg-slate-100 rounded">
                                {vendor.id}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-[#94A3B8] mt-1 font-medium">
                              <span className="flex items-center gap-1 font-sans text-xs font-normal"><Mail className="w-3 h-3" /> {vendor.email}</span>
                              <span className="w-1 h-1 bg-slate-200 rounded-full" />
                              <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {vendor.phone}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-[10px] font-mono font-bold text-slate-700 uppercase">
                          GST: {vendor.gst}
                        </div>
                        <div className="text-[9px] font-mono text-slate-400 uppercase mt-0.5">
                          PAN: {vendor.pan}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-[#334155] font-bold flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" /> {vendor.city}
                        </div>
                        <div className="text-[9px] text-[#94A3B8] font-bold mt-0.5 ml-4.5">
                          Joined {vendor.joined}
                        </div>
                      </td>
                      <td className="p-4 text-center font-bold text-[#0F172A] text-[13px]">
                        {vendor.orders.toLocaleString()}
                      </td>
                      <td className="p-4 text-right text-emerald-600 font-extrabold text-[13px]">
                        {formatCurrency(vendor.revenue)}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                          vendor.status === 'Approved' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : vendor.status === 'Pending Approval' 
                              ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' 
                              : vendor.status === 'Suspended'
                                ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                : 'bg-rose-50 text-rose-500 border-rose-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            vendor.status === 'Approved' 
                              ? 'bg-emerald-500' 
                              : vendor.status === 'Pending Approval' 
                                ? 'bg-amber-500' 
                                : vendor.status === 'Suspended'
                                  ? 'bg-indigo-500'
                                  : 'bg-rose-500'
                          }`} />
                          {vendor.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center justify-center">
                          {vendor.score > 0 ? (
                            <>
                              <span className="text-slate-800 font-extrabold text-[12px]">{vendor.score}/100</span>
                              <span className={`px-1.5 py-0.2 mt-0.5 rounded border text-[8px] font-bold uppercase tracking-wider ${getScoreBadgeStyles(vendor.score)}`}>
                                {getScoreBadgeLabel(vendor.score)}
                              </span>
                            </>
                          ) : (
                            <span className="text-[#94A3B8] text-[10px] font-bold">Unverified</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Details Eye Button */}
                          <button 
                            onClick={() => setDetailsVendor(vendor)}
                            className="w-7 h-7 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#00A86B] hover:bg-[#00A86B]/5 hover:border-[#00A86B]/30 transition-all cursor-pointer" 
                            title="View Vendor Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          
                          {/* Edit Pencil Button */}
                          <button 
                            onClick={() => {
                              setEditVendor(vendor);
                              setEditForm({ ...vendor });
                            }}
                            className="w-7 h-7 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all cursor-pointer" 
                            title="Edit Vendor"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Conditional Admin Approvals */}
                          {vendor.status === 'Pending Approval' ? (
                            <>
                              <button 
                                onClick={() => handleApprove(vendor)}
                                className="px-2.5 h-7 rounded-lg bg-[#00A86B] text-white text-[10px] font-bold hover:bg-[#009B63] transition-colors cursor-pointer"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => setRejectReasonVendor(vendor)}
                                className="px-2.5 h-7 rounded-lg bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700 transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            /* Status Toggle Actions (Suspend/Unsuspend) */
                            <button
                              onClick={() => handleToggleSuspend(vendor)}
                              className={`px-2 h-7 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                vendor.status === 'Suspended'
                                  ? 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100/50'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
                              }`}
                              title={vendor.status === 'Suspended' ? 'Unsuspend Access' : 'Suspend Access'}
                            >
                              {vendor.status === 'Suspended' ? 'Activate' : 'Suspend'}
                            </button>
                          )}

                          {/* Trash Delete Button */}
                          <button 
                            onClick={() => handleDeleteVendor(vendor.id, vendor.name)}
                            className="w-7 h-7 rounded-lg border border-red-100 text-red-500 hover:text-white hover:bg-red-600 hover:border-red-600 flex items-center justify-center transition-all cursor-pointer"
                            title="Delete Vendor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredVendors.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-[#64748B] font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Store className="w-8 h-8 text-[#94A3B8]" />
                        <span className="text-sm">No vendors found matching your filter criteria.</span>
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setCityFilter('All');
                            setScoreFilter('All');
                            setActiveFilter('All');
                          }}
                          className="mt-2 text-xs font-bold text-[#00A86B] underline"
                        >
                          Clear all filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 0 && (
            <div className="flex justify-between items-center p-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
              <span className="text-xs text-[#64748B] font-medium">
                Showing <span className="font-bold text-[#0F172A]">{startIndex}</span> to <span className="font-bold text-[#0F172A]">{endIndex}</span> of <span className="font-bold text-[#0F172A]">{filteredVendors.length}</span> vendors
              </span>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-white disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button 
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      currentPage === i + 1 
                        ? 'bg-[#00A86B] text-white shadow-xs' 
                        : 'border border-[#E2E8F0] text-[#64748B] hover:bg-white'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-white disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* DETAIL DRAWER */}
      <AnimatePresence>
        {detailsVendor && (
          <div className="fixed inset-0 z-50 flex overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs" 
              onClick={() => setDetailsVendor(null)} 
            />
            
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl overflow-y-auto z-10 flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00b876] to-[#00A86B] text-white flex items-center justify-center font-extrabold text-lg shadow-sm border border-[#009B63]">
                      {detailsVendor.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#0F172A] leading-tight">{detailsVendor.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-[#94A3B8]">{detailsVendor.id}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          detailsVendor.status === 'Approved' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : detailsVendor.status === 'Pending Approval' 
                              ? 'bg-amber-50 text-amber-600 border-amber-100' 
                              : detailsVendor.status === 'Suspended'
                                ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                : 'bg-rose-50 text-rose-500 border-rose-100'
                        }`}>
                          {detailsVendor.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setDetailsVendor(null)} 
                    className="w-8 h-8 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:bg-slate-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick actions inside drawer */}
                <div className="flex gap-2.5 mt-4">
                  {detailsVendor.status === 'Pending Approval' ? (
                    <>
                      <button 
                        onClick={() => handleApprove(detailsVendor)}
                        className="flex-1 h-8 rounded-lg bg-[#00A86B] text-white text-xs font-bold hover:bg-[#009B63] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve Vendor
                      </button>
                      <button 
                        onClick={() => setRejectReasonVendor(detailsVendor)}
                        className="flex-1 h-8 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <X className="w-3.5 h-3.5" /> Reject Application
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => handleToggleSuspend(detailsVendor)}
                      className={`flex-1 h-8 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-colors ${
                        detailsVendor.status === 'Suspended'
                          ? 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {detailsVendor.status === 'Suspended' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-indigo-600" /> Reactivate Account
                        </>
                      ) : (
                        <>
                          <Ban className="w-3.5 h-3.5 text-slate-500" /> Suspend Vendor Access
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditVendor(detailsVendor);
                      setEditForm({ ...detailsVendor });
                    }}
                    className="h-8 px-3 rounded-lg border border-[#E2E8F0] bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" /> Edit
                  </button>
                </div>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-[#E2E8F0] px-6">
                {(['overview', 'financials', 'shipments'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setDrawerTab(tab)}
                    className={`py-3 px-1.5 border-b-2 text-xs font-bold capitalize transition-colors mr-6 relative ${
                      drawerTab === tab 
                        ? 'border-[#00A86B] text-[#00A86B]' 
                        : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    {tab}
                    {drawerTab === tab && (
                      <motion.div layoutId="drawerTabIndicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00A86B]" />
                    )}
                  </button>
                ))}
              </div>

              {/* Drawer Content Area */}
              <div className="p-6 flex-1 space-y-6">
                {drawerTab === 'overview' && (
                  <div className="space-y-5">
                    
                    {/* Metrics Row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-[10px] font-bold text-[#64748B] uppercase">Orders</div>
                        <div className="text-base font-extrabold text-[#0F172A] mt-1">{detailsVendor.orders.toLocaleString()}</div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-[10px] font-bold text-[#64748B] uppercase">Revenue</div>
                        <div className="text-base font-extrabold text-emerald-600 mt-1">{formatCurrency(detailsVendor.revenue)}</div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-[10px] font-bold text-[#64748B] uppercase">Score Rating</div>
                        <div className="text-base font-extrabold text-[#0F172A] mt-1">
                          {detailsVendor.score > 0 ? `${detailsVendor.score}/100` : 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Owner Details */}
                    <div className="border border-slate-100 rounded-xl p-4.5 bg-white space-y-3.5">
                      <h4 className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <User className="w-4 h-4 text-[#00A86B]" /> Contact Profile Details
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="text-[10px] text-[#94A3B8] font-bold uppercase">Owner Name</div>
                          <div className="text-[#0F172A] font-bold mt-0.5">{detailsVendor.ownerName}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#94A3B8] font-bold uppercase">City / Location</div>
                          <div className="text-[#0F172A] font-bold mt-0.5">{detailsVendor.city}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#94A3B8] font-bold uppercase">Email ID</div>
                          <div className="text-[#0F172A] font-bold mt-0.5">{detailsVendor.email}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#94A3B8] font-bold uppercase">Phone Number</div>
                          <div className="text-[#0F172A] font-bold mt-0.5">{detailsVendor.phone}</div>
                        </div>
                      </div>
                    </div>

                    {/* Registrations */}
                    <div className="border border-slate-100 rounded-xl p-4.5 bg-white space-y-3.5">
                      <h4 className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <Building2 className="w-4 h-4 text-[#00A86B]" /> Government Registrations
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="text-[10px] text-[#94A3B8] font-bold uppercase flex items-center gap-1">
                            GSTIN Number <span className="text-[8px] font-extrabold text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-100">Verified</span>
                          </div>
                          <div className="text-[#0F172A] font-bold font-mono mt-1 uppercase">{detailsVendor.gst}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#94A3B8] font-bold uppercase flex items-center gap-1">
                            PAN Number <span className="text-[8px] font-extrabold text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-100">Verified</span>
                          </div>
                          <div className="text-[#0F172A] font-bold font-mono mt-1 uppercase">{detailsVendor.pan}</div>
                        </div>
                      </div>
                    </div>

                    {/* Address details */}
                    <div className="border border-slate-100 rounded-xl p-4.5 bg-white space-y-3">
                      <h4 className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <MapPin className="w-4 h-4 text-[#00A86B]" /> Registered Address
                      </h4>
                      <div className="text-xs text-[#475569] font-medium leading-relaxed">
                        {detailsVendor.address}
                      </div>
                    </div>

                  </div>
                )}

                {drawerTab === 'financials' && (
                  <div className="space-y-5">
                    
                    {/* Bank Details */}
                    <div className="border border-slate-100 rounded-xl p-4.5 bg-white space-y-3.5">
                      <h4 className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <CreditCard className="w-4 h-4 text-[#00A86B]" /> Settlement Bank Account
                      </h4>
                      <div className="space-y-3.5 text-xs">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-[10px] text-[#94A3B8] font-bold uppercase">Beneficiary Name</div>
                            <div className="text-[#0F172A] font-bold mt-0.5">{detailsVendor.ownerName}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-[#94A3B8] font-bold uppercase">Bank Name</div>
                            <div className="text-[#0F172A] font-bold mt-0.5">{detailsVendor.bankName || 'N/A'}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-[#94A3B8] font-bold uppercase">Account Number</div>
                            <div className="text-[#0F172A] font-mono font-bold mt-0.5">{detailsVendor.accountNum || 'N/A'}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-[#94A3B8] font-bold uppercase">IFSC Code</div>
                            <div className="text-[#0F172A] font-mono font-bold mt-0.5 uppercase">{detailsVendor.ifsc || 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="border border-slate-100 rounded-xl p-4.5 bg-white space-y-3">
                      <h4 className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <TrendingUp className="w-4 h-4 text-[#00A86B]" /> Remittance Summary
                      </h4>
                      <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between font-semibold">
                          <span className="text-[#64748B]">Total Shipping Billing</span>
                          <span className="text-[#0F172A]">{formatCurrency(detailsVendor.revenue * 0.15)}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span className="text-[#64748B]">COD Collected</span>
                          <span className="text-[#0F172A]">{formatCurrency(detailsVendor.revenue * 0.7)}</span>
                        </div>
                        <div className="flex justify-between font-semibold border-t border-slate-100 pt-2">
                          <span className="text-slate-800 font-bold">Pending Remittance</span>
                          <span className="text-[#00A86B] font-extrabold">{formatCurrency(detailsVendor.revenue * 0.05)}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {drawerTab === 'shipments' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-[#0F172A] border-b border-slate-100 pb-2 flex justify-between items-center">
                      <span>Simulated Shipments Log</span>
                      <span className="text-[10px] text-[#64748B] font-semibold">Showing last 4 orders</span>
                    </h4>
                    
                    {detailsVendor.orders > 0 ? (
                      <div className="space-y-3">
                        {[
                          { awb: 'QPSP000281734', date: '16 Jun 2026', customer: 'Rohan Deshpande', value: '₹1,450', status: 'Delivered', cost: '₹62.00', type: 'Prepaid' },
                          { awb: 'QPSP000281982', date: '15 Jun 2026', customer: 'Amit Kumar', value: '₹2,300', status: 'In Transit', cost: '₹78.50', type: 'COD' },
                          { awb: 'QPSP000282142', date: '14 Jun 2026', customer: 'Vikram Singh', value: '₹899', status: 'Pending Pickup', cost: '₹55.00', type: 'Prepaid' },
                          { awb: 'QPSP000280456', date: '10 Jun 2026', customer: 'Sneha Patel', value: '₹3,400', status: 'RTO Delivered', cost: '₹95.00', type: 'COD' }
                        ].map((shipment, i) => (
                          <div key={i} className="p-3.5 rounded-xl border border-slate-100 bg-[#F8FAFC]/50 flex flex-col sm:flex-row justify-between gap-3 text-xs">
                            <div>
                              <div className="font-bold text-[#00A86B]">{shipment.awb}</div>
                              <div className="text-[10px] text-[#94A3B8] mt-0.5 font-medium">{shipment.date} | Customer: {shipment.customer}</div>
                            </div>
                            <div className="flex flex-row sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-1">
                              <span className={`px-2 py-0.2 rounded text-[9px] font-bold uppercase ${
                                shipment.status === 'Delivered' 
                                  ? 'bg-emerald-50 text-emerald-600' 
                                  : shipment.status === 'In Transit' 
                                    ? 'bg-amber-50 text-amber-600' 
                                    : shipment.status === 'RTO Delivered' 
                                      ? 'bg-rose-50 text-rose-500' 
                                      : 'bg-blue-50 text-blue-600'
                              }`}>
                                {shipment.status}
                              </span>
                              <div className="font-semibold text-slate-800 text-[10px] mt-0.5">Value: {shipment.value} ({shipment.type})</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-10 text-center text-[#94A3B8] border border-dashed border-slate-200 rounded-xl">
                        <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <span className="text-xs font-semibold">No shipments recorded yet. This is a newly onboarded vendor.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD VENDOR MODAL */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs" 
              onClick={() => setIsAddOpen(false)} 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden w-full max-w-2xl z-10 flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center">
                <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <Store className="w-5 h-5 text-[#00A86B]" /> Register New Vendor Account
                </h3>
                <button 
                  onClick={() => setIsAddOpen(false)} 
                  className="w-7 h-7 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:bg-slate-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddVendor} className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Section 1: Business Details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#00A86B] uppercase tracking-wider border-b border-[#E6F5F1] pb-1.5">1. Business Profile</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-[#475569] mb-1.5">Business Name *</label>
                      <input 
                        type="text"
                        placeholder="e.g. Acme Retailers Pvt Ltd"
                        value={newVendor.name}
                        onChange={e => setNewVendor(prev => ({ ...prev, name: e.target.value }))}
                        className={`w-full h-9 px-3 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-[#00A86B] ${
                          formErrors.name ? 'border-red-500 bg-red-50/20' : 'border-[#E2E8F0]'
                        }`}
                      />
                      {formErrors.name && <span className="text-[10px] text-red-500 mt-1 font-bold block">{formErrors.name}</span>}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#475569] mb-1.5">Owner / Contact Name *</label>
                      <input 
                        type="text"
                        placeholder="e.g. John Doe"
                        value={newVendor.ownerName}
                        onChange={e => setNewVendor(prev => ({ ...prev, ownerName: e.target.value }))}
                        className={`w-full h-9 px-3 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-[#00A86B] ${
                          formErrors.ownerName ? 'border-red-500' : 'border-[#E2E8F0]'
                        }`}
                      />
                      {formErrors.ownerName && <span className="text-[10px] text-red-500 mt-1 font-bold block">{formErrors.ownerName}</span>}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#475569] mb-1.5">E-mail Address *</label>
                      <input 
                        type="email"
                        placeholder="e.g. sales@acme.com"
                        value={newVendor.email}
                        onChange={e => setNewVendor(prev => ({ ...prev, email: e.target.value }))}
                        className={`w-full h-9 px-3 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-[#00A86B] ${
                          formErrors.email ? 'border-red-500' : 'border-[#E2E8F0]'
                        }`}
                      />
                      {formErrors.email && <span className="text-[10px] text-red-500 mt-1 font-bold block">{formErrors.email}</span>}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#475569] mb-1.5">Phone Number *</label>
                      <input 
                        type="text"
                        placeholder="e.g. +91 9999999999"
                        value={newVendor.phone}
                        onChange={e => setNewVendor(prev => ({ ...prev, phone: e.target.value }))}
                        className={`w-full h-9 px-3 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-[#00A86B] ${
                          formErrors.phone ? 'border-red-500' : 'border-[#E2E8F0]'
                        }`}
                      />
                      {formErrors.phone && <span className="text-[10px] text-red-500 mt-1 font-bold block">{formErrors.phone}</span>}
                    </div>
                  </div>
                </div>

                {/* Section 2: Registration Details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#00A86B] uppercase tracking-wider border-b border-[#E6F5F1] pb-1.5">2. Registrations & Address</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <label className="block text-[11px] font-bold text-[#475569] mb-1.5">GSTIN *</label>
                      <input 
                        type="text"
                        placeholder="e.g. 29AABCU9361F1ZL"
                        value={newVendor.gst}
                        onChange={e => setNewVendor(prev => ({ ...prev, gst: e.target.value }))}
                        className={`w-full h-9 px-3 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-[#00A86B] ${
                          formErrors.gst ? 'border-red-500' : 'border-[#E2E8F0]'
                        }`}
                      />
                      {formErrors.gst && <span className="text-[10px] text-red-500 mt-1 font-bold block">{formErrors.gst}</span>}
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-[11px] font-bold text-[#475569] mb-1.5">PAN Number *</label>
                      <input 
                        type="text"
                        placeholder="e.g. ABCDE1234F"
                        value={newVendor.pan}
                        onChange={e => setNewVendor(prev => ({ ...prev, pan: e.target.value }))}
                        className={`w-full h-9 px-3 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-[#00A86B] ${
                          formErrors.pan ? 'border-red-500' : 'border-[#E2E8F0]'
                        }`}
                      />
                      {formErrors.pan && <span className="text-[10px] text-red-500 mt-1 font-bold block">{formErrors.pan}</span>}
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-[11px] font-bold text-[#475569] mb-1.5">City *</label>
                      <input 
                        type="text"
                        placeholder="e.g. Mumbai"
                        value={newVendor.city}
                        onChange={e => setNewVendor(prev => ({ ...prev, city: e.target.value }))}
                        className={`w-full h-9 px-3 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-[#00A86B] ${
                          formErrors.city ? 'border-red-500' : 'border-[#E2E8F0]'
                        }`}
                      />
                      {formErrors.city && <span className="text-[10px] text-red-500 mt-1 font-bold block">{formErrors.city}</span>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#475569] mb-1.5">Full Corporate Address *</label>
                    <textarea 
                      rows={2}
                      placeholder="Street name, building number, pin code"
                      value={newVendor.address}
                      onChange={e => setNewVendor(prev => ({ ...prev, address: e.target.value }))}
                      className={`w-full p-2.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-[#00A86B] ${
                        formErrors.address ? 'border-red-500' : 'border-[#E2E8F0]'
                      }`}
                    />
                    {formErrors.address && <span className="text-[10px] text-red-500 mt-1 font-bold block">{formErrors.address}</span>}
                  </div>
                </div>

                {/* Section 3: Financial Settlements */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#00A86B] uppercase tracking-wider border-b border-[#E6F5F1] pb-1.5">3. Financial Bank Details</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-[#475569] mb-1.5">Bank Name</label>
                      <input 
                        type="text"
                        placeholder="e.g. HDFC Bank"
                        value={newVendor.bankName}
                        onChange={e => setNewVendor(prev => ({ ...prev, bankName: e.target.value }))}
                        className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-1 focus:ring-[#00A86B]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#475569] mb-1.5">Account Number</label>
                      <input 
                        type="text"
                        placeholder="e.g. 50100234567"
                        value={newVendor.accountNum}
                        onChange={e => setNewVendor(prev => ({ ...prev, accountNum: e.target.value }))}
                        className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-1 focus:ring-[#00A86B]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#475569] mb-1.5">IFSC Code</label>
                      <input 
                        type="text"
                        placeholder="e.g. HDFC0000123"
                        value={newVendor.ifsc}
                        onChange={e => setNewVendor(prev => ({ ...prev, ifsc: e.target.value }))}
                        className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-1 focus:ring-[#00A86B]"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 pt-4 border-t border-[#E2E8F0]">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsAddOpen(false);
                      setFormErrors({});
                    }}
                    className="flex-1 h-10 rounded-xl border border-[#E2E8F0] text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 h-10 rounded-xl bg-[#00A86B] hover:bg-[#009B63] text-white text-xs font-bold shadow-sm transition-colors flex items-center justify-center"
                  >
                    Register Vendor Account
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT VENDOR MODAL */}
      <AnimatePresence>
        {editVendor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs" 
              onClick={() => {
                setEditVendor(null);
                setFormErrors({});
              }} 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden w-full max-w-2xl z-10 flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center">
                <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-indigo-600" /> Edit Vendor Profile: {editVendor.name}
                </h3>
                <button 
                  onClick={() => {
                    setEditVendor(null);
                    setFormErrors({});
                  }} 
                  className="w-7 h-7 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:bg-slate-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditVendorSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Section 1: Business Details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider border-b border-indigo-50 pb-1.5">1. Business Profile</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-[#475569] mb-1.5">Business Name *</label>
                      <input 
                        type="text"
                        value={editForm.name ?? ''}
                        onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className={`w-full h-9 px-3 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                          formErrors.name ? 'border-red-500' : 'border-[#E2E8F0]'
                        }`}
                      />
                      {formErrors.name && <span className="text-[10px] text-red-500 mt-1 font-bold block">{formErrors.name}</span>}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#475569] mb-1.5">Owner / Contact Name *</label>
                      <input 
                        type="text"
                        value={editForm.ownerName ?? ''}
                        onChange={e => setEditForm(prev => ({ ...prev, ownerName: e.target.value }))}
                        className={`w-full h-9 px-3 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                          formErrors.ownerName ? 'border-red-500' : 'border-[#E2E8F0]'
                        }`}
                      />
                      {formErrors.ownerName && <span className="text-[10px] text-red-500 mt-1 font-bold block">{formErrors.ownerName}</span>}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#475569] mb-1.5">E-mail Address *</label>
                      <input 
                        type="email"
                        value={editForm.email ?? ''}
                        onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                        className={`w-full h-9 px-3 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                          formErrors.email ? 'border-red-500' : 'border-[#E2E8F0]'
                        }`}
                      />
                      {formErrors.email && <span className="text-[10px] text-red-500 mt-1 font-bold block">{formErrors.email}</span>}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#475569] mb-1.5">Phone Number *</label>
                      <input 
                        type="text"
                        value={editForm.phone ?? ''}
                        onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                        className={`w-full h-9 px-3 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                          formErrors.phone ? 'border-red-500' : 'border-[#E2E8F0]'
                        }`}
                      />
                      {formErrors.phone && <span className="text-[10px] text-red-500 mt-1 font-bold block">{formErrors.phone}</span>}
                    </div>
                  </div>
                </div>

                {/* Section 2: Registration Details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider border-b border-indigo-50 pb-1.5">2. Registrations & Address</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <label className="block text-[11px] font-bold text-[#475569] mb-1.5">GSTIN *</label>
                      <input 
                        type="text"
                        value={editForm.gst ?? ''}
                        onChange={e => setEditForm(prev => ({ ...prev, gst: e.target.value }))}
                        className={`w-full h-9 px-3 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                          formErrors.gst ? 'border-red-500' : 'border-[#E2E8F0]'
                        }`}
                      />
                      {formErrors.gst && <span className="text-[10px] text-red-500 mt-1 font-bold block">{formErrors.gst}</span>}
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-[11px] font-bold text-[#475569] mb-1.5">PAN Number *</label>
                      <input 
                        type="text"
                        value={editForm.pan ?? ''}
                        onChange={e => setEditForm(prev => ({ ...prev, pan: e.target.value }))}
                        className={`w-full h-9 px-3 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                          formErrors.pan ? 'border-red-500' : 'border-[#E2E8F0]'
                        }`}
                      />
                      {formErrors.pan && <span className="text-[10px] text-red-500 mt-1 font-bold block">{formErrors.pan}</span>}
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-[11px] font-bold text-[#475569] mb-1.5">City *</label>
                      <input 
                        type="text"
                        value={editForm.city ?? ''}
                        onChange={e => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                        className={`w-full h-9 px-3 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                          formErrors.city ? 'border-red-500' : 'border-[#E2E8F0]'
                        }`}
                      />
                      {formErrors.city && <span className="text-[10px] text-red-500 mt-1 font-bold block">{formErrors.city}</span>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#475569] mb-1.5">Full Corporate Address *</label>
                    <textarea 
                      rows={2}
                      value={editForm.address ?? ''}
                      onChange={e => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                      className={`w-full p-2.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                        formErrors.address ? 'border-red-500' : 'border-[#E2E8F0]'
                      }`}
                    />
                    {formErrors.address && <span className="text-[10px] text-red-500 mt-1 font-bold block">{formErrors.address}</span>}
                  </div>
                </div>

                {/* Section 3: Financial Settlements */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider border-b border-indigo-50 pb-1.5">3. Financial Bank Details</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-[#475569] mb-1.5">Bank Name</label>
                      <input 
                        type="text"
                        value={editForm.bankName ?? ''}
                        onChange={e => setEditForm(prev => ({ ...prev, bankName: e.target.value }))}
                        className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#475569] mb-1.5">Account Number</label>
                      <input 
                        type="text"
                        value={editForm.accountNum ?? ''}
                        onChange={e => setEditForm(prev => ({ ...prev, accountNum: e.target.value }))}
                        className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#475569] mb-1.5">IFSC Code</label>
                      <input 
                        type="text"
                        value={editForm.ifsc ?? ''}
                        onChange={e => setEditForm(prev => ({ ...prev, ifsc: e.target.value }))}
                        className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 pt-4 border-t border-[#E2E8F0]">
                  <button 
                    type="button" 
                    onClick={() => {
                      setEditVendor(null);
                      setFormErrors({});
                    }}
                    className="flex-1 h-10 rounded-xl border border-[#E2E8F0] text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center justify-center"
                  >
                    Save Changes
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REJECT WITH REASON DIALOG */}
      <AnimatePresence>
        {rejectReasonVendor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs" 
              onClick={() => setRejectReasonVendor(null)} 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden w-full max-w-md z-10 flex flex-col"
            >
              <div className="px-5 py-4 border-b border-[#E2E8F0] bg-rose-50 flex items-center gap-2 text-rose-700">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-bold">Reject Vendor Application</h3>
              </div>

              <form onSubmit={handleRejectSubmit} className="p-5 space-y-4">
                <p className="text-xs font-semibold text-[#64748B] leading-relaxed">
                  You are rejecting the onboarding application for <span className="font-extrabold text-[#0F172A]">"{rejectReasonVendor.name}"</span>. This will prevent them from shipping or using the wallet. Please provide a brief rejection reason to document inside audit logs:
                </p>

                <div>
                  <label className="block text-[10px] font-bold text-[#475569] uppercase tracking-wider mb-1.5">Rejection Reason *</label>
                  <textarea 
                    rows={3}
                    required
                    placeholder="e.g. Invalid GSTIN certificate or address mismatch on government portal"
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setRejectReasonVendor(null);
                      setRejectionReason('');
                    }}
                    className="flex-1 h-9 rounded-lg border border-[#E2E8F0] text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 h-9 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
                  >
                    Reject Application
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST SYSTEM */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border min-w-[320px] max-w-md ${
              toast.type === 'success' 
                ? 'bg-slate-900 border-white/10 text-white' 
                : toast.type === 'error' 
                  ? 'bg-rose-950 border-rose-800 text-rose-100' 
                  : 'bg-indigo-950 border-indigo-800 text-indigo-100'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              toast.type === 'success' 
                ? 'bg-emerald-500/20 text-[#34D399]' 
                : toast.type === 'error' 
                  ? 'bg-rose-500/20 text-rose-300' 
                  : 'bg-indigo-500/20 text-indigo-300'
            }`}>
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4" />}
              {toast.type === 'info' && <AlertCircle className="w-4 h-4" />}
            </div>
            <p className="text-[12px] font-bold leading-snug flex-1">{toast.message}</p>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </AdminLayout>
  );
}
