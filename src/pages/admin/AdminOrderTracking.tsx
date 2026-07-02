import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';

// Tabler-style custom SVG icons to guarantee rendering without external CDNs
interface TablerIconProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
}

function TablerIcon({ name, size = 16, color = 'currentColor', className = '' }: TablerIconProps) {
  const getSvgPath = () => {
    switch (name) {
      case 'arrow-left':
        return <path d="M5 12l14 0M5 12l6 6M5 12l6 -6" />;
      case 'history':
        return (
          <>
            <path d="M12 8l0 4l2 2" />
            <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
          </>
        );
      case 'x':
        return <path d="M18 6l-12 12m0 -12l12 12" />;
      case 'copy':
        return (
          <>
            <path d="M8 8m0 2a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z" />
            <path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2" />
          </>
        );
      case 'check':
        return <path d="M5 12l5 5l10 -10" />;
      case 'truck':
        return (
          <>
            <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
            <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
            <path d="M5 17h-2v-11a1 1 0 0 1 1 -1h9v12m-4 0h6m4 0h2v-6h-8m0 -5h5l3 5" />
          </>
        );
      case 'clipboard-list':
        return (
          <>
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" />
            <path d="M9 12l.01 0M13 12l2 0M9 16l.01 0M13 16l2 0" />
          </>
        );
      case 'map-pin-up':
        return (
          <>
            <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
            <path d="M12 21c-4 -4 -7 -7.5 -7 -11a7 7 0 1 1 14 0c0 1.5 -.5 3 -1.5 4.5" />
            <path d="M19 22v-6M19 16l3 3M19 16l-3 3" />
          </>
        );
      case 'map-pin':
        return (
          <>
            <path d="M9 11a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
            <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z" />
          </>
        );
      case 'package':
        return (
          <>
            <path d="M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9l8 -4.5" />
            <path d="M12 12l8 -4.5" />
            <path d="M12 12l0 9" />
            <path d="M12 12l-8 -4.5" />
            <path d="M16 5.25l-8 4.5" />
          </>
        );
      case 'box':
        return (
          <>
            <path d="M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9l8 -4.5" />
            <path d="M12 12l8 -4.5" />
            <path d="M12 12l0 9" />
            <path d="M12 12l-8 -4.5" />
          </>
        );
      case 'receipt':
        return (
          <>
            <path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16l-3 -2l-2 2l-3 -2l-2 2l-3 -2l-3 2" />
            <path d="M9 7l6 0M9 11l6 0M9 15l4 0" />
          </>
        );
      case 'alert-triangle':
        return (
          <>
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75" />
          </>
        );
      case 'map-2':
        return (
          <>
            <path d="M12 18.5l-3 -1.5l-6 3v-13l6 -3l6 3l6 -3v7.5" />
            <path d="M9 4v13" />
            <path d="M15 7v5.5" />
            <path d="M18 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
            <path d="M20.2 20.2l1.8 1.8" />
          </>
        );
      case 'calendar-check':
        return (
          <>
            <path d="M11.5 21h-5.5a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v6" />
            <path d="M16 3v4" />
            <path d="M8 3v4" />
            <path d="M4 11h16" />
            <path d="M15 19l2 2l4 -4" />
          </>
        );
      case 'download':
        return (
          <>
            <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
            <path d="M7 11l5 5l5 -5" />
            <path d="M12 4l0 12" />
          </>
        );
      case 'file-text':
        return (
          <>
            <path d="M14 3v4a1 1 0 0 0 1 1h4" />
            <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
            <path d="M9 9l1 0M9 13l6 0M9 17l6 0" />
          </>
        );
      case 'phone':
        return <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" />;
      case 'info-circle':
        return (
          <>
            <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
            <path d="M12 9h.01" />
            <path d="M11 12h1v4h1" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`ti ti-${name} ${className}`}
    >
      {getSvgPath()}
    </svg>
  );
}

// Derive status from orderId
const getStatusFromId = (id: string): 'placed' | 'ready' | 'transit' | 'delivered' | 'cancelled' => {
  // Default tracking ID is transit
  if (id === '572294' || id.includes('090000')) return 'transit';
  
  // Custom parsing for ORD prefixed IDs (e.g. from Internal CRM)
  if (id.startsWith('ORD')) {
    const numPart = parseInt(id.replace(/\D/g, ''), 10);
    if (isNaN(numPart)) return 'transit';
    const rem = numPart % 4;
    if (rem === 0) return 'transit';
    if (rem === 1) return 'ready';
    if (rem === 2) return 'delivered';
    return 'cancelled';
  }

  // Parse trailing digit to determine status dynamically
  const lastChar = id.slice(-1);
  if (/\d/.test(lastChar)) {
    const digit = parseInt(lastChar, 10);
    if (digit === 0 || digit === 5) return 'delivered';
    if (digit === 1 || digit === 6) return 'placed';
    if (digit === 3 || digit === 8) return 'cancelled';
    if (digit === 4 || digit === 9) return 'ready';
  }
  return 'transit';
};

// Config for header actions per status
interface HeaderActionConfig {
  primaryText: string;
  primaryAction: (orderId: string) => void;
  badgeText: string;
  badgeClass: string;
  dropdownOptions: Array<{
    label: string;
    action: (setChargesTab: (tab: 'billed' | 'dispute') => void) => void;
    isDanger?: boolean;
  }>;
}

const getHeaderActions = (status: 'placed' | 'ready' | 'transit' | 'delivered' | 'cancelled'): HeaderActionConfig => {
  switch (status) {
    case 'placed':
      return {
        primaryText: 'Ship Now',
        primaryAction: (orderId) => alert(`Order ${orderId} is being scheduled for shipment!`),
        badgeText: 'Order Placed',
        badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
        dropdownOptions: [
          { label: 'Download Label (Draft)', action: () => alert('Downloading Draft Label...') },
          { label: 'Download Invoice', action: () => alert('Downloading Invoice...') },
          { label: 'Edit Order Details', action: () => alert('Opening Edit Dialog...') },
          { label: 'Cancel Order', action: () => alert('Cancelling Order...'), isDanger: true },
        ]
      };
    case 'ready':
      return {
        primaryText: 'Assign Courier',
        primaryAction: (orderId) => alert(`Assigning Courier for Shipment ${orderId}...`),
        badgeText: 'Ready to Ship',
        badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
        dropdownOptions: [
          { label: 'Change Courier Partner', action: () => alert('Opening Courier Selection...') },
          { label: 'Download Invoice', action: () => alert('Downloading Invoice...') },
          { label: 'Edit Pickup Address', action: () => alert('Editing Pickup Address...') },
          { label: 'Cancel Order', action: () => alert('Cancelling Order...'), isDanger: true },
        ]
      };
    case 'delivered':
      return {
        primaryText: 'Download Invoice',
        primaryAction: (orderId) => alert(`Downloading Invoice PDF for Order ${orderId}...`),
        badgeText: 'Delivered',
        badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        dropdownOptions: [
          { label: 'Download Shipping Label', action: () => alert('Downloading Shipping Label...') },
          { label: 'Raise Weight Dispute', action: (setChargesTab) => setChargesTab('dispute') },
          { label: 'Create Reverse Shipment (RTO)', action: () => alert('Initializing reverse pickup...') },
          { label: 'Raise Support Ticket', action: () => alert('Contacting Helpdesk...') },
        ]
      };
    case 'cancelled':
      return {
        primaryText: 'Clone Order',
        primaryAction: (orderId) => alert(`Cloning order ${orderId} details to a new draft...`),
        badgeText: 'Cancelled',
        badgeClass: 'bg-red-50 text-red-700 border border-red-200',
        dropdownOptions: [
          { label: 'View Cancellation Reason', action: () => alert('Cancelled by: Merchant request') },
          { label: 'Download Invoice', action: () => alert('Downloading Invoice...') },
          { label: 'Contact Support', action: () => alert('Contacting Helpdesk...') },
        ]
      };
    case 'transit':
    default:
      return {
        primaryText: 'Share Tracking Link',
        primaryAction: (orderId) => {
          navigator.clipboard.writeText(`https://quickpost.in/track/${orderId}`);
          alert('Tracking link copied to clipboard!');
        },
        badgeText: 'In Transit',
        badgeClass: 'bg-[#E1F5EE] text-[#0F6E56] border border-[#BCE8D8]',
        dropdownOptions: [
          { label: 'Download Shipping Label', action: () => alert('Downloading Shipping Label...') },
          { label: 'Download Commercial Invoice', action: () => alert('Downloading Invoice...') },
          { label: 'Raise Weight Dispute', action: (setChargesTab) => setChargesTab('dispute') },
          { label: 'Report Courier Delay', action: () => alert('Opening Delay Ticket...') },
          { label: 'Request Return to Origin (RTO)', action: () => alert('Requesting Return to Origin...'), isDanger: true },
        ]
      };
  }
};

const getMilestones = (status: 'placed' | 'ready' | 'transit' | 'delivered' | 'cancelled') => {
  switch (status) {
    case 'placed':
      return [
        { name: 'Order Placed', date: '24 Jun, 6:50 PM', status: 'active', icon: 'check' },
        { name: 'Parcel Prepared', date: '(pending)', status: 'pending', icon: 'check' },
        { name: 'Pickup Confirmed', date: '(pending)', status: 'pending', icon: 'check' },
        { name: 'In Transit', date: '(pending)', status: 'pending', icon: 'truck' },
        { name: 'Out for Delivery', date: '(pending)', status: 'pending', icon: 'truck' },
        { name: 'Delivered', date: '(pending)', status: 'pending', icon: 'package' },
      ];
    case 'ready':
      return [
        { name: 'Order Placed', date: '24 Jun, 6:50 PM', status: 'completed', icon: 'check' },
        { name: 'Parcel Prepared', date: '24 Jun, 8:15 PM', status: 'active', icon: 'check' },
        { name: 'Pickup Confirmed', date: '(pending)', status: 'pending', icon: 'check' },
        { name: 'In Transit', date: '(pending)', status: 'pending', icon: 'truck' },
        { name: 'Out for Delivery', date: '(pending)', status: 'pending', icon: 'truck' },
        { name: 'Delivered', date: '(pending)', status: 'pending', icon: 'package' },
      ];
    case 'delivered':
      return [
        { name: 'Order Placed', date: '17 Sept, 2:00 PM', status: 'completed', icon: 'check' },
        { name: 'Parcel Prepared', date: '17 Sept, 4:30 PM', status: 'completed', icon: 'check' },
        { name: 'Pickup Confirmed', date: '18 Sept, 3:15 PM', status: 'completed', icon: 'check' },
        { name: 'In Transit', date: '19 Sept, 11:30 PM', status: 'completed', icon: 'check' },
        { name: 'Out for Delivery', date: '21 Sept, 10:23 AM', status: 'completed', icon: 'check' },
        { name: 'Delivered', date: '21 Sept, 4:50 PM', status: 'active', icon: 'package' },
      ];
    case 'cancelled':
      return [
        { name: 'Order Placed', date: '24 Jun, 6:50 PM', status: 'completed', icon: 'check' },
        { name: 'Order Cancelled', date: '25 Jun, 10:00 AM', status: 'active', icon: 'alert-triangle' },
        { name: 'Pickup Confirmed', date: '(cancelled)', status: 'pending', icon: 'check' },
        { name: 'In Transit', date: '(cancelled)', status: 'pending', icon: 'truck' },
        { name: 'Out for Delivery', date: '(cancelled)', status: 'pending', icon: 'truck' },
        { name: 'Delivered', date: '(cancelled)', status: 'pending', icon: 'package' },
      ];
    case 'transit':
    default:
      return [
        { name: 'Order Placed', date: '17 Sept, 2:00 PM', status: 'completed', icon: 'check' },
        { name: 'Parcel Prepared', date: '17 Sept, 4:30 PM', status: 'completed', icon: 'check' },
        { name: 'Pickup Confirmed', date: '18 Sept, 3:15 PM', status: 'completed', icon: 'check' },
        { name: 'In Transit', date: '19 Sept, 11:30 PM', status: 'active', icon: 'truck' },
        { name: 'Out for Delivery', date: '(pending)', status: 'pending', icon: 'truck' },
        { name: 'Delivered', date: '(pending)', status: 'pending', icon: 'package' },
      ];
  }
};

const getShippingDetails = (status: 'placed' | 'ready' | 'transit' | 'delivered' | 'cancelled') => {
  switch (status) {
    case 'placed':
      return {
        pickupId: '—',
        scheduledOn: '—',
        pickedOn: '—',
        estimatedDeliveryDate: '—',
        deliveredOn: '—',
        codStatus: 'Pending',
        codBadgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        isPaid: false,
      };
    case 'ready':
      return {
        pickupId: 'PKP20485910',
        scheduledOn: '24 Jun 2026, 8:15 PM',
        pickedOn: '—',
        estimatedDeliveryDate: '28 Jun 2026',
        deliveredOn: '—',
        codStatus: 'Pending',
        codBadgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        isPaid: false,
      };
    case 'delivered':
      return {
        pickupId: 'PKP93018247',
        scheduledOn: '18 Sept 2026, 3:15 PM',
        pickedOn: '19 Sept 2026, 11:30 AM',
        estimatedDeliveryDate: '21 Sept 2026',
        deliveredOn: '21 Sept 2026, 4:50 PM',
        codStatus: 'Paid',
        codBadgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        isPaid: true,
        paymentDate: '23 Sept 2026',
        remittanceId: 'REM-849201-QP',
      };
    case 'cancelled':
      return {
        pickupId: '—',
        scheduledOn: '—',
        pickedOn: '—',
        estimatedDeliveryDate: '—',
        deliveredOn: '—',
        codStatus: 'Cancelled',
        codBadgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        isPaid: false,
      };
    case 'transit':
    default:
      return {
        pickupId: 'PKP82947291',
        scheduledOn: '18 Sept 2026, 3:15 PM',
        pickedOn: '19 Sept 2026, 11:30 AM',
        estimatedDeliveryDate: '27 Jun 2026',
        deliveredOn: '—',
        codStatus: 'Pending',
        codBadgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        isPaid: false,
      };
  }
};

const getNDRDetails = (status: 'placed' | 'ready' | 'transit' | 'delivered' | 'cancelled') => {
  switch (status) {
    case 'delivered':
      return {
        showCard: true,
        reason: 'Customer Refused Delivery (Cash not ready on 1st attempt)',
        statusText: 'Resolved (Delivered)',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        attempts: '2 / 3 attempts',
        lastAction: 'Delivered successfully on 21 Sept 2026',
        isActionable: false,
      };
    case 'cancelled':
      return {
        showCard: true,
        reason: 'Incorrect Address / Customer Not Reachable',
        statusText: 'RTO Initiated',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        attempts: '3 / 3 attempts',
        lastAction: 'Returned to Origin on 25 Jun 2026',
        isActionable: false,
      };
    case 'placed':
    case 'ready':
      return {
        showCard: false,
      };
    case 'transit':
    default:
      return {
        showCard: true,
        reason: 'Customer Unavailable (Unanswered Phone)',
        statusText: 'Action Required',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse',
        attempts: '1 / 3 attempts',
        lastAction: 'Courier reported delivery attempt failed',
        isActionable: true,
      };
  }
};

const getCourierForOrder = (orderId: string) => {
  const COURIERS = [
    'Ekart',
    'Delhivery',
    'DTDC',
    'Amazon Shipping',
    'Shadowfax',
    'Shiprocket',
    'Shree Maruti',
    'XpressBees',
    'Lousung360'
  ];
  
  let hash = 0;
  for (let i = 0; i < orderId.length; i++) {
    hash = orderId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COURIERS.length;
  return COURIERS[index];
};

const getCourierLogo = (courierName: string) => {
  const name = courierName.toLowerCase();
  if (name.includes('amazon')) return '/brands/amazon.png';
  if (name.includes('delhivery')) return '/brands/delhivery.png';
  if (name.includes('dtdc')) return '/brands/dtdc.png';
  if (name.includes('ekart')) return '/brands/ekart.png';
  if (name.includes('losung') || name.includes('lousung')) return '/brands/losung.jpg';
  if (name.includes('shadowfax')) return '/brands/shadowfax.png';
  if (name.includes('shiprocket')) return '/brands/shiprocket.jpg';
  if (name.includes('maruti')) return '/brands/shree_maruti.jpg';
  if (name.includes('xpressbees')) return '/brands/xpressbees.png';
  return '';
};

interface CourierLogoProps {
  name: string;
  size?: 'sm' | 'md';
}

const CourierLogo: React.FC<CourierLogoProps> = ({ name, size = 'sm' }) => {
  const logoUrl = getCourierLogo(name);
  const sizeClass = size === 'sm' ? 'w-12 h-12 text-[18px]' : 'w-20 h-14 text-[24px]';
  const imgSizeClass = size === 'sm' ? 'w-12 h-12' : 'w-20 h-14';
  const [error, setError] = useState(!logoUrl);

  if (error) {
    return (
      <div className={`${sizeClass} flex items-center justify-center rounded bg-slate-100 border border-slate-200 text-[#94A3B8] font-bold shrink-0 uppercase shadow-sm`}>
        {name.charAt(0)}
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={name}
      className={`${imgSizeClass} object-contain rounded shrink-0 animate-fade-in bg-transparent`}
      onError={() => setError(true)}
    />
  );
};

export function AdminOrderTracking() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id') || '572294';

  const [copiedId, setCopiedId] = useState(false);
  const [copiedAwb, setCopiedAwb] = useState(false);
  const [isHeaderDropdownOpen, setIsHeaderDropdownOpen] = useState(false);
  const [chargesTab, setChargesTab] = useState<'billed' | 'dispute'>('billed');
  const [showNdrHistory, setShowNdrHistory] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showUpdateInfoModal, setShowUpdateInfoModal] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('7988589102');

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // References for GSAP
  const containerRef = useRef<HTMLDivElement>(null);

  // Copy click handlers
  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(orderId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  };

  const handleCopyAwb = () => {
    navigator.clipboard.writeText('QP0900004821');
    setCopiedAwb(true);
    setTimeout(() => setCopiedAwb(false), 1500);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = () => setIsHeaderDropdownOpen(false);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // GSAP Animations
  useEffect(() => {
    const gsap = (window as any).gsap;
    if (!gsap) return;

    // 1. Milestone elements animation
    gsap.fromTo('.milestone-circle-container', 
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, stagger: 0.12, ease: 'back.out(1.4)', delay: 0.05 }
    );

    // 2. Connecting lines path drawing
    gsap.fromTo('.timeline-line-segment',
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 0.6, stagger: 0.15, ease: 'power2.out', delay: 0.3 }
    );

    // 3. Left column cards transition
    gsap.fromTo('.left-col-card',
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out', delay: 0.1 }
    );

    // 4. Right column widgets transition
    gsap.fromTo('.right-col-widget',
      { opacity: 0, x: 16 },
      { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out', delay: 0.2 }
    );

    // 5. Estimated delivery progress bar
    gsap.fromTo('.delivery-progress-fill',
      { width: '0%' },
      { width: '65%', duration: 1.0, ease: 'power2.out', delay: 0.6 }
    );

    // 6. Right column timeline entries stagger
    gsap.fromTo('.tracking-timeline-entry',
      { opacity: 0, x: 10 },
      { opacity: 1, x: 0, duration: 0.35, stagger: 0.12, ease: 'power2.out', delay: 0.4 }
    );
  }, []);

  const orderStatus = getStatusFromId(orderId);
  const headerActions = getHeaderActions(orderStatus);
  const milestones = getMilestones(orderStatus);
  const shippingDetails = getShippingDetails(orderStatus);
  const ndrDetails = getNDRDetails(orderStatus);
  const courierName = getCourierForOrder(orderId);

  return (
    <AdminLayout>
      <style>{`
        @keyframes pulseRing {
          0% {
            box-shadow: 0 0 0 4px rgba(29, 158, 117, 0.25);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(29, 158, 117, 0);
          }
          100% {
            box-shadow: 0 0 0 4px rgba(29, 158, 117, 0.25);
          }
        }
        .pulse-active {
          animation: pulseRing 2s ease-in-out infinite;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .thin-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .thin-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .thin-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 9999px;
        }
        .thin-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #1D9E75;
        }
        .thin-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #E2E8F0 transparent;
        }
      `}</style>

      <div ref={containerRef} className="bg-[#F8F9FA] text-[#1A1A1A] min-h-screen pb-10" style={{ fontFamily: 'Roboto, sans-serif' }}>
        
        {/* =================================================================
           PAGE HEADER ROW
           ================================================================= */}
        <div className="w-full bg-white border-b border-[#E5E5E5] px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          
          {/* Left Header Group */}
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => window.history.back()} 
              className="flex items-center justify-center p-1 rounded-md text-[#5F5E5A] hover:text-[#1D9E75] hover:bg-slate-50 transition-colors"
              title="Back"
            >
              <TablerIcon name="arrow-left" size={18} />
            </button>
            <div className="flex items-baseline">
              <span className="text-[13px] font-normal text-[#5F5E5A]">Order ID</span>
              <span className="text-[16px] font-bold text-[#1A1A1A] ml-1.5">{orderId}</span>
            </div>
            <div className={`text-[12px] font-medium px-3 py-1 rounded-full ${headerActions.badgeClass}`}>
              {headerActions.badgeText}
            </div>
            <button 
              onClick={handleCopyOrderId}
              className={`p-1.5 rounded-md transition-colors ${copiedId ? 'text-[#1D9E75] bg-emerald-50' : 'text-[#9FB5AB] hover:text-[#1D9E75] hover:bg-slate-50'}`}
              title="Copy Order ID"
            >
              <TablerIcon name="copy" size={14} color={copiedId ? '#1D9E75' : '#9FB5AB'} />
            </button>
          </div>

          {/* Right Header Group */}
          <div className="flex items-center gap-3 w-full sm:w-auto relative">
            <button 
              onClick={() => headerActions.primaryAction(orderId)}
              className="flex-1 sm:flex-none bg-[#1D9E75] hover:bg-[#0F6E56] text-white text-[14px] font-bold py-2.5 px-6 rounded-lg shadow-sm transition-all"
            >
              {headerActions.primaryText}
            </button>
            <div className="relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsHeaderDropdownOpen(!isHeaderDropdownOpen);
                }}
                className="border border-[#E5E5E5] hover:bg-[#F4F6F5] rounded-lg w-9 h-9 flex items-center justify-center text-slate-600 transition-all focus:outline-none"
                title="More Actions"
              >
                <span className="font-bold text-[14px] leading-[8px] -mt-1.5">...</span>
              </button>

              {isHeaderDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E5E5E5] rounded-xl shadow-lg overflow-hidden z-[105] py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                  {headerActions.dropdownOptions.map((opt, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && (opt.label === 'Cancel Order' || opt.label === 'Request Return to Origin (RTO)' || opt.label === 'Create Reverse Shipment (RTO)' || opt.label === 'Raise Support Ticket') && (
                        <div className="border-t border-[#E5E5E5] my-1" />
                      )}
                      <button 
                        onClick={() => {
                          opt.action(setChargesTab);
                          setIsHeaderDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-[#F8F9FA] transition-colors ${opt.isDanger ? 'font-medium text-[#E24B4A] hover:bg-red-50/50' : 'font-normal text-[#1A1A1A]'}`}
                      >
                        {opt.label}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =================================================================
           MILESTONE TIMELINE STRIP
           ================================================================= */}
        <div className="w-full bg-white border-b border-[#E5E5E5] px-8 py-6 mb-6">
          
          {/* Desktop horizontal layout */}
          <div className="hidden md:block relative w-full px-6">
            
            {/* Connecting lines container */}
            <div className="absolute top-[16px] left-[4%] right-[4%] h-[2px] flex items-center z-0">
              {milestones.slice(0, -1).map((m, i) => {
                const isCompleted = i < 3;
                return (
                  <div key={i} className="flex-1 relative h-full">
                    <svg className="w-full h-[2px] overflow-visible" preserveAspectRatio="none">
                      <line 
                        x1="0" 
                        y1="1" 
                        x2="100%" 
                        y2="1" 
                        stroke={isCompleted ? "#1D9E75" : "#D4E4DC"} 
                        strokeWidth="2" 
                        strokeDasharray={isCompleted ? "1" : "4 4"}
                        pathLength="1"
                        className="timeline-line-segment" 
                      />
                    </svg>
                  </div>
                );
              })}
            </div>

            {/* Milestones row */}
            <div className="flex justify-between items-start relative z-10 w-full">
              {milestones.map((m, i) => {
                const isCompleted = m.status === 'completed';
                const isActive = m.status === 'active';
                const isPending = m.status === 'pending';

                return (
                  <div key={i} className="flex flex-col items-center text-center w-[12%] milestone-circle-container">
                    
                    {/* Circle */}
                    <div className="h-8 flex items-center justify-center">
                      {isCompleted && (
                        <div className="w-7 h-7 rounded-full bg-[#1D9E75] flex items-center justify-center text-white shadow-sm">
                          <TablerIcon name="check" size={14} color="#ffffff" />
                        </div>
                      )}
                      {isActive && (
                        <div className="w-8 h-8 rounded-full bg-[#1D9E75] flex items-center justify-center text-white pulse-active relative z-10">
                          <TablerIcon name="truck" size={14} color="#ffffff" />
                        </div>
                      )}
                      {isPending && (
                        <div className="w-7 h-7 rounded-full bg-white border-2 border-[#D4E4DC] flex items-center justify-center text-[#C5D5D0]">
                          <TablerIcon name={m.icon} size={14} color="#C5D5D0" />
                        </div>
                      )}
                    </div>

                    {/* Labels */}
                    <div className="mt-3">
                      <div className={`text-[12px] ${isCompleted ? 'font-medium text-[#1A1A1A]' : isActive ? 'font-bold text-[#1D9E75]' : 'font-normal text-[#9FB5AB]'}`}>
                        {m.name}
                      </div>
                      <div className="text-[11px] font-normal text-[#5F5E5A] mt-0.5">
                        {m.date}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

          {/* Mobile vertical layout */}
          <div className="block md:hidden relative pl-8 py-2">
            
            {/* Vertical dashed line */}
            <div className="absolute left-[15px] top-4 bottom-4 w-[2px] border-l border-dashed border-[#D4E4DC] z-0" />
            <div className="absolute left-[15px] top-4 h-[60%] w-[2px] border-l border-solid border-[#1D9E75] z-0" />

            {/* Vertical milestone items */}
            <div className="flex flex-col gap-6">
              {milestones.map((m, i) => {
                const isCompleted = m.status === 'completed';
                const isActive = m.status === 'active';
                const isPending = m.status === 'pending';

                return (
                  <div key={i} className="flex items-start gap-4 relative z-10 milestone-circle-container">
                    
                    {/* Circle */}
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                      {isCompleted && (
                        <div className="w-7 h-7 rounded-full bg-[#1D9E75] flex items-center justify-center text-white shadow-sm">
                          <TablerIcon name="check" size={14} color="#ffffff" />
                        </div>
                      )}
                      {isActive && (
                        <div className="w-8 h-8 rounded-full bg-[#1D9E75] flex items-center justify-center text-white pulse-active relative z-10">
                          <TablerIcon name="truck" size={14} color="#ffffff" />
                        </div>
                      )}
                      {isPending && (
                        <div className="w-7 h-7 rounded-full bg-white border-2 border-[#D4E4DC] flex items-center justify-center text-[#C5D5D0]">
                          <TablerIcon name={m.icon} size={14} color="#C5D5D0" />
                        </div>
                      )}
                    </div>

                    {/* Labels */}
                    <div className="pt-0.5">
                      <div className={`text-[13px] ${isCompleted ? 'font-medium text-[#1A1A1A]' : isActive ? 'font-bold text-[#1D9E75]' : 'font-normal text-[#9FB5AB]'}`}>
                        {m.name}
                      </div>
                      <div className="text-[11px] font-normal text-[#5F5E5A] mt-0.5">
                        {m.date}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

        </div>

        {/* =================================================================
           MAIN CONTENT — 2 COLUMN LAYOUT
           ================================================================= */}
        <div className="w-full max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-[65%_35%] gap-5 items-start">
          
          {/* =================================================================
             LEFT COLUMN — DETAIL SECTIONS
             ================================================================= */}
          <div className="flex flex-col gap-5 min-w-0">
            
            {/* --- SECTION 1: ORDER DETAILS --- */}
            <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm left-col-card">
              <div className="flex items-center gap-2.5 border-b border-[#F0F0F0] pb-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#E1F5EE] text-[#1D9E75] flex items-center justify-center shrink-0">
                  <TablerIcon name="clipboard-list" size={16} color="#1D9E75" />
                </div>
                <h3 className="text-[14px] font-semibold text-[#1A1A1A]">Order Details</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-normal text-[#9FB5AB] uppercase tracking-wider">Creation Date</label>
                  <div className="text-[13px] font-medium text-[#1A1A1A] mt-0.5">
                    <div>24 Jun 2026</div>
                    <div className="text-[11px] text-[#5F5E5A] font-normal mt-0.5">6:50 PM</div>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-normal text-[#9FB5AB] uppercase tracking-wider">Channel</label>
                  <div className="mt-1">
                    <span className="bg-[#E1F5EE] text-[#0F6E56] text-[11px] font-medium px-2.5 py-0.5 rounded">CUSTOM</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-normal text-[#9FB5AB] uppercase tracking-wider">Payment Amount</label>
                  <div className="text-[13px] font-medium text-[#1A1A1A] mt-0.5">₹1,100</div>
                </div>
                <div>
                  <label className="block text-[11px] font-normal text-[#9FB5AB] uppercase tracking-wider">Payment Method</label>
                  <div className="text-[13px] font-medium text-[#1A1A1A] mt-0.5">COD</div>
                </div>
              </div>
            </div>

            {/* Sub-grid 1: Pickup and Receiver Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* --- SECTION 2: PICKUP DETAILS --- */}
              <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm left-col-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 border-b border-[#F0F0F0] pb-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-[#E1F5EE] text-[#1D9E75] flex items-center justify-center shrink-0">
                      <TablerIcon name="map-pin-up" size={16} color="#1D9E75" />
                    </div>
                    <h3 className="text-[14px] font-semibold text-[#1A1A1A]">Pickup Details</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-normal text-[#9FB5AB] uppercase tracking-wider">Name</label>
                        <div className="text-[13px] font-medium text-[#1A1A1A] mt-0.5">Vishal</div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-normal text-[#9FB5AB] uppercase tracking-wider">Mobile No</label>
                        <div className="text-[13px] font-medium text-[#1A1A1A] mt-0.5">7988589102</div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-normal text-[#9FB5AB] uppercase tracking-wider">Email</label>
                        <div className="text-[13px] font-medium text-[#1A1A1A] mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap" title="bajrangi@gmail.com">bajrangi@gmail.com</div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-normal text-[#9FB5AB] uppercase tracking-wider">Pincode</label>
                        <div className="text-[13px] font-medium text-[#1A1A1A] mt-0.5">127021</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-t border-[#F5F5F5] pt-3">
                      <div>
                        <label className="block text-[11px] font-normal text-[#9FB5AB] uppercase tracking-wider">State</label>
                        <div className="text-[13px] font-medium text-[#1A1A1A] mt-0.5">HARYANA</div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-normal text-[#9FB5AB] uppercase tracking-wider">City</label>
                        <div className="text-[13px] font-medium text-[#1A1A1A] mt-0.5">Bhiwani</div>
                      </div>
                    </div>
                    <div className="border-t border-[#F5F5F5] pt-3">
                      <label className="block text-[11px] font-normal text-[#9FB5AB] uppercase tracking-wider">Address</label>
                      <div className="text-[13px] font-medium text-[#1A1A1A] mt-0.5 leading-relaxed">
                        Near Sheoran Hospital, Bank Colony, Mini Bypass Road, Bajrangi Nutritions
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- SECTION 3: RECEIVER DETAILS --- */}
              <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm left-col-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 border-b border-[#F0F0F0] pb-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-[#E1F5EE] text-[#1D9E75] flex items-center justify-center shrink-0">
                      <TablerIcon name="map-pin" size={16} color="#1D9E75" />
                    </div>
                    <h3 className="text-[14px] font-semibold text-[#1A1A1A]">Receiver Details</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-normal text-[#9FB5AB] uppercase tracking-wider">Name</label>
                        <div className="text-[13px] font-medium text-[#1A1A1A] mt-0.5">Deepak</div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-normal text-[#9FB5AB] uppercase tracking-wider">Mobile No</label>
                        <div className="text-[13px] font-medium text-[#1A1A1A] mt-0.5">7404152100</div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-normal text-[#9FB5AB] uppercase tracking-wider">Email</label>
                        <div className="text-[13px] font-medium text-[#C5D5D0] mt-0.5">—</div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-normal text-[#9FB5AB] uppercase tracking-wider">Pincode</label>
                        <div className="text-[13px] font-medium text-[#1A1A1A] mt-0.5">126116</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-t border-[#F5F5F5] pt-3">
                      <div>
                        <label className="block text-[11px] font-normal text-[#9FB5AB] uppercase tracking-wider">State</label>
                        <div className="text-[13px] font-medium text-[#1A1A1A] mt-0.5">HARYANA</div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-normal text-[#9FB5AB] uppercase tracking-wider">City</label>
                        <div className="text-[13px] font-medium text-[#1A1A1A] mt-0.5">Jind</div>
                      </div>
                    </div>
                    <div className="border-t border-[#F5F5F5] pt-3">
                      <label className="block text-[11px] font-normal text-[#9FB5AB] uppercase tracking-wider">Address</label>
                      <div className="text-[13px] font-medium text-[#1A1A1A] mt-0.5 leading-relaxed">
                        Add-Chahal Pati, Ujhana, Jind
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-grid 2: Package and Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* --- SECTION 4: PACKAGE DETAILS --- */}
              <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm left-col-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 border-b border-[#F0F0F0] pb-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-[#E1F5EE] text-[#1D9E75] flex items-center justify-center shrink-0">
                      <TablerIcon name="package" size={16} color="#1D9E75" />
                    </div>
                    <h3 className="text-[14px] font-semibold text-[#1A1A1A]">Package Details</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-normal text-[#9FB5AB] uppercase tracking-wider">Order Type</label>
                        <div className="text-[13px] font-medium text-[#1A1A1A] mt-0.5">B2C</div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-normal text-[#9FB5AB] uppercase tracking-wider">Dead Weight</label>
                        <div className="text-[13px] font-medium text-[#1A1A1A] mt-0.5">1 KG</div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-normal text-[#9FB5AB] uppercase tracking-wider">Dimensions (L×W×H)</label>
                        <div className="text-[13px] font-medium text-[#1A1A1A] mt-0.5">10 × 10 × 10 cm</div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-normal text-[#9FB5AB] uppercase tracking-wider">Volumetric Weight</label>
                        <div className="text-[13px] font-medium text-[#1A1A1A] mt-0.5">0.20 KG</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-t border-[#F5F5F5] pt-3">
                      <div>
                        <label className="text-[11px] font-normal text-[#9FB5AB] uppercase tracking-wider flex items-center gap-1.5">
                          Applicable Weight
                          <div className="relative group cursor-pointer inline-flex items-center">
                            <span className="text-[#9FB5AB] hover:text-[#1A1A1A]"><TablerIcon name="info-circle" size={12} /></span>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-[#1A1A1A] text-white text-[12px] font-normal rounded-lg py-1.5 px-3 whitespace-nowrap shadow-md z-30 pointer-events-none">
                              Higher of dead weight and volumetric weight
                            </div>
                          </div>
                        </label>
                        <div className="text-[13px] font-medium text-[#1A1A1A] mt-0.5">1 KG</div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-normal text-[#9FB5AB] uppercase tracking-wider">Charged Weight</label>
                        <div className="text-[13px] font-medium text-[#1A1A1A] mt-0.5">1 KG</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- SECTION 5: PRODUCT DETAILS --- */}
              <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm left-col-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 border-b border-[#F0F0F0] pb-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-[#E1F5EE] text-[#1D9E75] flex items-center justify-center shrink-0">
                      <TablerIcon name="box" size={16} color="#1D9E75" />
                    </div>
                    <h3 className="text-[14px] font-semibold text-[#1A1A1A]">Product Details</h3>
                  </div>
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[300px]">
                      <thead>
                        <tr className="border-b border-[#F0F0F0] text-[11px] uppercase tracking-wider font-semibold text-[#9FB5AB]">
                          <th className="pb-3">Product Name</th>
                          <th className="pb-3 text-center">Qty</th>
                          <th className="pb-3 text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody className="text-[13px] font-normal text-[#1A1A1A]">
                        <tr className="border-b last:border-0 border-[#F5F5F5]">
                          <td className="py-3 font-medium">liver amrit</td>
                          <td className="py-3 text-center">1</td>
                          <td className="py-3 text-right">₹1,100</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex justify-end items-center gap-2.5 border-t border-[#F0F0F0] pt-4 mt-2">
                  <span className="text-[13px] font-medium text-[#1A1A1A]">Total Amount:</span>
                  <span className="text-[14px] font-bold text-[#1D9E75]">₹1,100.00</span>
                </div>
              </div>
            </div>

            {/* --- SECTION 6: CHARGES BREAKDOWN --- */}
            <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm left-col-card">
              <div className="flex items-center gap-2.5 border-b border-[#F0F0F0] pb-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#E1F5EE] text-[#1D9E75] flex items-center justify-center shrink-0">
                  <TablerIcon name="receipt" size={16} color="#1D9E75" />
                </div>
                <h3 className="text-[14px] font-semibold text-[#1A1A1A]">Charges Breakdown</h3>
              </div>

              {/* Tab selector */}
              <div className="bg-[#F4F6F5] p-1 rounded-xl flex gap-1 mb-5">
                <button 
                  onClick={() => setChargesTab('billed')}
                  className={`flex-1 py-2 text-center text-[13px] font-medium transition-all ${chargesTab === 'billed' ? 'bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] text-[#1A1A1A]' : 'text-[#9FB5AB] hover:text-[#1A1A1A]'}`}
                >
                  Billed Charges
                </button>
                <button 
                  onClick={() => setChargesTab('dispute')}
                  className={`flex-1 py-2 text-center text-[13px] font-medium transition-all ${chargesTab === 'dispute' ? 'bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] text-[#1A1A1A]' : 'text-[#9FB5AB] hover:text-[#1A1A1A]'}`}
                >
                  Weight Dispute
                </button>
              </div>

              {/* TAB 1: Billed Charges */}
              {chargesTab === 'billed' && (
                <div className="space-y-0.5">
                  <div className="flex justify-between items-center py-2.5 border-b border-[#F4F6F5]">
                    <span className="text-[13px] font-normal text-[#5F5E5A]">Base Freight Charge</span>
                    <span className="text-[13px] font-medium text-[#1A1A1A]">₹45.00</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-[#F4F6F5]">
                    <span className="text-[13px] font-normal text-[#5F5E5A]">COD Handling Charge</span>
                    <span className="text-[13px] font-medium text-[#1A1A1A]">₹18.00</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-[#F4F6F5]">
                    <span className="text-[13px] font-normal text-[#5F5E5A]">Reverse Pickup Charge</span>
                    <span className="text-[13px] font-medium text-[#C5D5D0]">—</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-[#F4F6F5]">
                    <div className="flex items-center">
                      <span className="text-[13px] font-normal text-[#5F5E5A]">Weight Discrepancy Charge</span>
                      <span className="bg-[#FFF3E0] text-[#E65100] text-[10px] font-medium px-2 py-0.5 rounded ml-2">Disputed</span>
                    </div>
                    <span className="text-[13px] font-medium text-[#1A1A1A]">₹12.00</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-[#F4F6F5]">
                    <span className="text-[13px] font-normal text-[#5F5E5A]">GST (18%)</span>
                    <span className="text-[13px] font-medium text-[#1A1A1A]">₹13.50</span>
                  </div>

                  <div className="border-t border-dashed border-[#E5E5E5] pt-3 mt-3 flex justify-between items-center">
                    <span className="text-[14px] font-bold text-[#1A1A1A]">Total Billed</span>
                    <span className="text-[14px] font-bold text-[#1D9E75]">₹88.50</span>
                  </div>
                </div>
              )}

              {/* TAB 2: Weight Dispute */}
              {chargesTab === 'dispute' && (
                <div className="space-y-5">
                  {/* Alert strip */}
                  <div className="bg-[#FFF8E8] border border-[#FAC775] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="text-[#854F0B] shrink-0"><TablerIcon name="alert-triangle" size={18} color="#854F0B" /></div>
                      <span className="text-[13px] font-normal text-[#633806] leading-relaxed">
                        Weight discrepancy of 0.5 KG detected on this shipment.
                      </span>
                    </div>
                    <button className="border border-[#EF9F27] bg-[#FAEEDA] hover:bg-[#F5E2C4] text-[#633806] text-[12px] font-medium py-1.5 px-3.5 rounded-lg transition-colors shrink-0">
                      Raise Dispute
                    </button>
                  </div>

                  {/* Comparison Table */}
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[450px]">
                      <thead>
                        <tr className="border-b border-[#F4F6F5] text-[11px] uppercase tracking-wider font-semibold text-[#9FB5AB]">
                          <th className="pb-3">Metric</th>
                          <th className="pb-3">Seller Declared</th>
                          <th className="pb-3">Courier Claimed</th>
                        </tr>
                      </thead>
                      <tbody className="text-[13px] font-normal text-[#1A1A1A]">
                        <tr className="border-b border-[#F4F6F5]">
                          <td className="py-3">Dead Weight</td>
                          <td className="py-3">1.00 KG</td>
                          <td className="py-3 text-[#E24B4A]">1.50 KG</td>
                        </tr>
                        <tr className="border-b border-[#F4F6F5]">
                          <td className="py-3">Dimensions</td>
                          <td className="py-3">10×10×10cm</td>
                          <td className="py-3 text-[#E24B4A]">12×10×10cm</td>
                        </tr>
                        <tr className="border-b border-[#F4F6F5]">
                          <td className="py-3">Vol. Weight</td>
                          <td className="py-3">0.20 KG</td>
                          <td className="py-3 text-[#E24B4A]">0.24 KG</td>
                        </tr>
                        <tr className="border-b border-[#F4F6F5]">
                          <td className="py-3">Charged Weight</td>
                          <td className="py-3">1.00 KG</td>
                          <td className="py-3 text-[#E24B4A]">1.50 KG</td>
                        </tr>
                        <tr className="border-b last:border-0 border-[#F4F6F5]">
                          <td className="py-3 font-semibold text-[#1A1A1A]">Charges</td>
                          <td className="py-3 font-semibold text-[#1A1A1A]">₹45.00</td>
                          <td className="py-3 font-semibold text-[#E24B4A]">₹57.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="text-[12px] font-normal text-[#9FB5AB] leading-relaxed mt-2">
                    Dispute resolution typically takes 5–7 working days.
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* =================================================================
             RIGHT COLUMN — TRACKING & INFO SIDEBAR
             ================================================================= */}
          <div className="flex flex-col lg:sticky lg:top-5 gap-4 min-w-0">
            
            {/* --- WIDGET 1: SHIPPING DETAILS --- */}
            <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm right-col-widget">
              <div className="flex items-center gap-2.5 border-b border-[#F0F0F0] pb-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#E1F5EE] text-[#1D9E75] flex items-center justify-center shrink-0">
                  <TablerIcon name="truck" size={16} color="#1D9E75" />
                </div>
                <h3 className="text-[14px] font-semibold text-[#1A1A1A]">Shipping Details</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="font-normal text-[#5F5E5A]">Pickup ID</span>
                  <span className="font-semibold text-[#1A1A1A] font-mono">{shippingDetails.pickupId}</span>
                </div>
                <div className="flex justify-between items-center text-[13px] border-t border-[#F5F5F5] pt-3">
                  <span className="font-normal text-[#5F5E5A]">Courier Partner</span>
                  <div className="flex items-center gap-2">
                    <CourierLogo name={courierName} size="md" />
                    <span className="font-semibold text-[#1A1A1A]">{courierName}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[13px] border-t border-[#F5F5F5] pt-3">
                  <span className="font-normal text-[#5F5E5A]">Scheduled On</span>
                  <span className="font-medium text-[#1A1A1A]">{shippingDetails.scheduledOn}</span>
                </div>
                <div className="flex justify-between items-center text-[13px] border-t border-[#F5F5F5] pt-3">
                  <span className="font-normal text-[#5F5E5A]">Picked On</span>
                  <span className="font-medium text-[#1A1A1A]">{shippingDetails.pickedOn}</span>
                </div>
                <div className="flex justify-between items-center text-[13px] border-t border-[#F5F5F5] pt-3">
                  <span className="font-normal text-[#5F5E5A]">Estimated Delivery Date</span>
                  <span className="font-medium text-[#1A1A1A]">{shippingDetails.estimatedDeliveryDate}</span>
                </div>
                <div className="flex justify-between items-center text-[13px] border-t border-[#F5F5F5] pt-3">
                  <span className="font-normal text-[#5F5E5A]">Delivered On</span>
                  <span className="font-medium text-[#1A1A1A]">{shippingDetails.deliveredOn}</span>
                </div>
                <div className="flex justify-between items-center text-[13px] border-t border-[#F5F5F5] pt-3">
                  <span className="font-normal text-[#5F5E5A]">COD Status</span>
                  <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${shippingDetails.codBadgeClass}`}>
                    {shippingDetails.codStatus}
                  </span>
                </div>
                {shippingDetails.isPaid && (
                  <>
                    <div className="flex justify-between items-center text-[13px] border-t border-[#F5F5F5] pt-3">
                      <span className="font-normal text-[#5F5E5A]">Date of Payment</span>
                      <span className="font-medium text-[#1A1A1A]">{shippingDetails.paymentDate}</span>
                    </div>
                    <div className="flex justify-between items-center text-[13px] border-t border-[#F5F5F5] pt-3">
                      <span className="font-normal text-[#5F5E5A]">Remittance ID</span>
                      <span className="font-semibold text-[#00A86B] font-mono hover:underline cursor-pointer">{shippingDetails.remittanceId}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* --- WIDGET 2: TRACKING DETAILS --- */}
            <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm right-col-widget">
              <div className="flex items-center gap-2.5 border-b border-[#F0F0F0] pb-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#E1F5EE] text-[#1D9E75] flex items-center justify-center shrink-0">
                  <TablerIcon name="map-2" size={16} color="#1D9E75" />
                </div>
                <h3 className="text-[14px] font-semibold text-[#1A1A1A]">Tracking Details</h3>
              </div>

              {/* AWB info block */}
              <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 mb-5">
                <div>
                  <div className="text-[9px] font-bold text-[#9FB5AB] uppercase tracking-wider">AWB Number</div>
                  <div className="text-[13px] font-bold text-[#1A1A1A] mt-0.5 tracking-wide font-mono">QP0900004821</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#1A1A1A] text-[11px] font-semibold px-2.5 py-1 rounded-md shrink-0 flex items-center gap-1.5 bg-transparent">
                    <CourierLogo name={courierName} size="sm" />
                    {courierName}
                  </span>
                  <button 
                    onClick={handleCopyAwb}
                    className={`p-1.5 rounded-md transition-colors ${copiedAwb ? 'text-[#1D9E75] bg-emerald-50' : 'text-[#9FB5AB] hover:text-[#1D9E75] hover:bg-slate-100'}`}
                    title="Copy AWB Number"
                  >
                    <TablerIcon name="copy" size={13} color={copiedAwb ? '#1D9E75' : '#9FB5AB'} />
                  </button>
                </div>
              </div>

              {/* Vertical timeline details container (Scrollable - set height to 190px) */}
              <div className="relative pl-8 py-1 overflow-y-auto pr-2 thin-scrollbar" style={{ maxHeight: '190px' }}>
                
                {/* Vertical timeline line */}
                <div className="absolute left-[15px] top-3 bottom-3 w-[2px] bg-[#E1F5EE] z-0" />

                {/* Tracking entries */}
                <div className="space-y-6 relative z-10">
                  
                  {/* Entry 1 - Active */}
                  <div className="relative flex items-start gap-4 tracking-timeline-entry">
                    <div className="absolute -left-[22px] top-1">
                      <div className="w-3 h-3 rounded-full bg-[#1D9E75] pulse-active border-2 border-white relative z-10" />
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-[#1A1A1A]">Out for Delivery</div>
                      <div className="text-[11px] font-normal text-[#5F5E5A] mt-0.5">Today, 10:23 AM</div>
                      <div className="text-[11px] font-normal text-[#9FB5AB] mt-0.5">{courierName.split(' ')[0]} Agent: Ravi Kumar</div>
                      <div className="mt-1.5">
                        <span className="bg-[#E1F5EE] text-[#0F6E56] text-[10px] font-medium px-2 py-0.5 rounded">
                          Andheri, Mumbai
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Entry 2 */}
                  <div className="relative flex items-start gap-4 tracking-timeline-entry">
                    <div className="absolute -left-[21px] top-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#1D9E75] border-2 border-white relative z-10" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-[#1A1A1A]">Reached Delivery Hub</div>
                      <div className="text-[11px] font-normal text-[#5F5E5A] mt-0.5">Today, 7:45 AM</div>
                      <div className="text-[11px] font-normal text-[#9FB5AB] mt-0.5">Andheri Sort Facility, Mumbai</div>
                    </div>
                  </div>

                  {/* Entry 3 */}
                  <div className="relative flex items-start gap-4 tracking-timeline-entry">
                    <div className="absolute -left-[21px] top-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#1D9E75] border-2 border-white relative z-10" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-[#1A1A1A]">In Transit</div>
                      <div className="text-[11px] font-normal text-[#5F5E5A] mt-0.5">Yesterday, 11:30 PM</div>
                      <div className="text-[11px] font-normal text-[#9FB5AB] mt-0.5">Mumbai Hub</div>
                    </div>
                  </div>

                  {/* Entry 4 */}
                  <div className="relative flex items-start gap-4 tracking-timeline-entry">
                    <div className="absolute -left-[21px] top-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#1D9E75] border-2 border-white relative z-10" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-[#1A1A1A]">Picked Up from Seller</div>
                      <div className="text-[11px] font-normal text-[#5F5E5A] mt-0.5">Yesterday, 3:15 PM</div>
                      <div className="text-[11px] font-normal text-[#9FB5AB] mt-0.5">Bhiwani Warehouse</div>
                    </div>
                  </div>

                  {/* Entry 5 */}
                  <div className="relative flex items-start gap-4 tracking-timeline-entry">
                    <div className="absolute -left-[21px] top-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#1D9E75] border-2 border-white relative z-10" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-[#1A1A1A]">Order Booked</div>
                      <div className="text-[11px] font-normal text-[#5F5E5A] mt-0.5">23 Jun 2026, 2:00 PM</div>
                      <div className="text-[11px] font-normal text-[#9FB5AB] mt-0.5">Bhiwani, Haryana</div>
                    </div>
                  </div>

                </div>

              </div>

            </div>

            {/* --- WIDGET 4: NDR ACTIONS & HISTORY --- */}
            {ndrDetails.showCard && (
              <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm right-col-widget">
                <div className="flex items-center gap-2.5 border-b border-[#F0F0F0] pb-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-amber-50 text-[#EF9F27] flex items-center justify-center shrink-0">
                    <TablerIcon name="alert-triangle" size={16} color="#EF9F27" />
                  </div>
                  <h3 className="text-[14px] font-semibold text-[#1A1A1A]">NDR Actions & History</h3>
                </div>
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="font-normal text-[#5F5E5A]">NDR Status</span>
                    <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${ndrDetails.badgeClass}`}>
                      {ndrDetails.statusText}
                    </span>
                  </div>
                  <div className="text-[13px] border-t border-[#F5F5F5] pt-3">
                    <div className="font-normal text-[#5F5E5A]">Reason for Non-Delivery</div>
                    <div className="font-medium text-[#1A1A1A] mt-1 bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-[12px] leading-relaxed">
                      {ndrDetails.reason}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[13px] border-t border-[#F5F5F5] pt-3">
                    <span className="font-normal text-[#5F5E5A]">Attempt Count</span>
                    <span className="font-medium text-[#1A1A1A]">{ndrDetails.attempts}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] border-t border-[#F5F5F5] pt-3 flex-wrap">
                    <span className="font-normal text-[#5F5E5A] shrink-0">Last Update:</span>
                    <span className="font-medium text-[#1A1A1A]">{ndrDetails.lastAction}</span>
                    <button 
                      onClick={() => setShowNdrHistory(true)}
                      className="text-[11px] font-bold text-[#1D9E75] hover:text-[#0F6E56] hover:underline flex items-center gap-1 shrink-0 ml-1.5 bg-[#E1F5EE] px-2 py-0.5 rounded transition-colors"
                      title="View Full NDR History"
                    >
                      <TablerIcon name="history" size={11} color="#1D9E75" />
                      <span>History</span>
                    </button>
                  </div>
                  {ndrDetails.isActionable && (
                    <div className="border-t border-[#F5F5F5] pt-3.5 mt-2 space-y-2">
                      <button 
                        onClick={() => setToastMessage(`Re-attempt instruction submitted to ${courierName}!`)}
                        className="w-full bg-[#1D9E75] hover:bg-[#0F6E56] text-white text-[12px] font-bold py-2 rounded-lg transition-colors focus:outline-none"
                      >
                        Request Re-attempt
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setToastMessage(`RTO instruction submitted to ${courierName}!`)}
                          className="border border-red-200 bg-red-50/50 hover:bg-red-50 text-red-700 text-[12px] font-semibold py-2 rounded-lg transition-colors focus:outline-none"
                        >
                          Initiate RTO
                        </button>
                        <button 
                          onClick={() => setShowUpdateInfoModal(true)}
                          className="border border-[#E5E5E5] hover:bg-[#F8F9FA] text-[#5F5E5A] text-[12px] font-semibold py-2 rounded-lg transition-colors focus:outline-none"
                        >
                          Update Info
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}



          </div>

        </div>

      </div>
      
      {/* NDR History Modal */}
      {showNdrHistory && (
        <div className="fixed inset-0 bg-[#000000]/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E5E5] w-full max-w-md shadow-2xl overflow-hidden animate-fade-in">
            <div className="px-5 py-4 border-b border-[#F0F0F0] flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <TablerIcon name="history" size={16} color="#1D9E75" />
                <h3 className="text-[15px] font-bold text-[#1A1A1A]">NDR Lifecycle History</h3>
              </div>
              <button 
                onClick={() => setShowNdrHistory(false)}
                className="text-[#9FB5AB] hover:text-[#1A1A1A] p-1.5 rounded-md hover:bg-slate-200 transition-colors focus:outline-none"
              >
                <TablerIcon name="x" size={14} />
              </button>
            </div>
            <div className="p-5 max-h-[300px] overflow-y-auto pr-1 space-y-5">
              {/* Timeline entries */}
              <div className="relative pl-6 space-y-5 border-l-2 border-[#E1F5EE]">
                <div className="relative">
                  <div className="absolute -left-[31px] top-1.5 w-2 h-2 rounded-full bg-[#1D9E75] border border-white" />
                  <div className="text-[13px] font-bold text-[#1A1A1A]">NDR Attempt #1 Failed</div>
                  <div className="text-[11px] text-[#5F5E5A] mt-0.5">26 Jun 2026, 4:10 PM</div>
                  <div className="text-[11px] text-[#9FB5AB] mt-0.5">Reason: Customer Unavailable (Unanswered Phone)</div>
                </div>
                <div className="relative">
                  <div className="absolute -left-[31px] top-1.5 w-2 h-2 rounded-full bg-[#9FB5AB] border border-white" />
                  <div className="text-[13px] font-semibold text-[#1A1A1A]">NDR Case Generated</div>
                  <div className="text-[11px] text-[#5F5E5A] mt-0.5">26 Jun 2026, 2:30 PM</div>
                  <div className="text-[11px] text-[#9FB5AB] mt-0.5">Automatically flagged by system</div>
                </div>
                <div className="relative">
                  <div className="absolute -left-[31px] top-1.5 w-2 h-2 rounded-full bg-[#9FB5AB] border border-white" />
                  <div className="text-[13px] font-semibold text-[#1A1A1A]">Out for Delivery</div>
                  <div className="text-[11px] text-[#5F5E5A] mt-0.5">26 Jun 2026, 10:15 AM</div>
                  <div className="text-[11px] text-[#9FB5AB] mt-0.5">Agent: Ravi Kumar ({courierName})</div>
                </div>
              </div>
            </div>
            <div className="px-5 py-3.5 bg-slate-50 border-t border-[#F0F0F0] flex justify-end">
              <button 
                onClick={() => setShowNdrHistory(false)}
                className="bg-[#1D9E75] hover:bg-[#0F6E56] text-white text-[12px] font-bold py-1.5 px-4 rounded-lg transition-colors shadow-sm focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Info Modal */}
      {showUpdateInfoModal && (
        <div className="fixed inset-0 bg-[#000000]/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E5E5] w-full max-w-sm shadow-2xl overflow-hidden animate-fade-in">
            <div className="px-5 py-4 border-b border-[#F0F0F0] flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <TablerIcon name="phone" size={16} color="#1D9E75" />
                <h3 className="text-[15px] font-bold text-[#1A1A1A]">Update Alternate Contact</h3>
              </div>
              <button 
                onClick={() => setShowUpdateInfoModal(false)}
                className="text-[#9FB5AB] hover:text-[#1A1A1A] p-1.5 rounded-md hover:bg-slate-200 transition-colors focus:outline-none"
              >
                <TablerIcon name="x" size={14} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-[#5F5E5A] uppercase tracking-wider">Alternate Phone Number</label>
                <input 
                  type="tel" 
                  value={newPhoneNumber} 
                  onChange={(e) => setNewPhoneNumber(e.target.value)} 
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E5E5E5] text-[13px] bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 focus:border-[#1D9E75] transition-all font-mono" 
                  placeholder="Enter 10-digit mobile number"
                />
              </div>
            </div>
            <div className="px-5 py-3.5 bg-slate-50 border-t border-[#F0F0F0] flex justify-end gap-2">
              <button 
                onClick={() => setShowUpdateInfoModal(false)}
                className="border border-[#E5E5E5] bg-white hover:bg-slate-50 text-[#5F5E5A] text-[12px] font-bold py-1.5 px-4 rounded-lg transition-colors focus:outline-none"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowUpdateInfoModal(false);
                  setToastMessage(`Alternate number updated to ${newPhoneNumber}. Instructions sent to ${courierName}!`);
                }}
                className="bg-[#1D9E75] hover:bg-[#0F6E56] text-white text-[12px] font-bold py-1.5 px-4 rounded-lg transition-colors shadow-sm focus:outline-none"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[210] bg-[#1A1A1A] text-white text-[13px] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-fade-in">
          <div className="w-5 h-5 rounded-full bg-[#1D9E75] flex items-center justify-center shrink-0">
            <TablerIcon name="check" size={10} color="#FFFFFF" />
          </div>
          <span className="font-medium">{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-white/50 hover:text-white ml-2 focus:outline-none"
          >
            <TablerIcon name="x" size={10} />
          </button>
        </div>
      )}
    </AdminLayout>
  );
}
