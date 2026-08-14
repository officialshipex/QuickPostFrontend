import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { getToken, isTokenExpired, getRoleFromToken } from './utils/session';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Home } from './pages/Home';
import { Track } from './pages/Track';
import { RateCalculator } from './pages/RateCalculator';
import { ForgotPassword } from './pages/ForgotPassword';
import { Login } from './pages/Login';
import { EmployeeLogin } from './pages/EmployeeLogin';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AdminUserProvider } from './context/AdminUserContext';
import { DashboardFilterProvider } from './context/DashboardFilterContext';
import { OfflineOverlay } from './components/ui/OfflineOverlay';



// Internal CRM Pages
import { CRMShipmentListing } from './pages/admin/CRMShipmentListing';
import { CRMSellerAccounts } from './pages/admin/CRMSellerAccounts';
import { CRMLeads } from './pages/admin/CRMLeads';
import { CRMCourierPartners } from './pages/admin/CRMCourierPartners';
import { CRMEscalations } from './pages/admin/CRMEscalations';
import { CRMBusinessMetrics } from './pages/admin/CRMBusinessMetrics';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminShipments } from './pages/admin/AdminShipments';
import { AdminNDR } from './pages/admin/AdminNDR';
import { AdminWallet } from './pages/admin/AdminWallet';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminVendors } from './pages/admin/AdminVendors';
import { AdminCouriers } from './pages/admin/AdminCouriers';
import { AdminSupport } from './pages/admin/AdminSupport';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminCOD } from './pages/admin/AdminCOD';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminAccounts } from './pages/admin/AdminAccounts';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';
import { AdminWeightDiscrepancy } from './pages/admin/AdminWeightDiscrepancy';
import { AdminAnnouncements } from './pages/admin/AdminAnnouncements';
import { AdminNotification } from './pages/admin/AdminNotification';
import { AdminRoles } from './pages/admin/AdminRoles';
import { AdminAllocateSellers } from './pages/admin/AdminAllocateSellers';
import { AdminStatusMap } from './pages/admin/AdminStatusMap';
import { AdminEDDMapping } from './pages/admin/AdminEDDMapping';
import { AdminEPDMapping } from './pages/admin/AdminEPDMapping';
import { AdminReferral } from './pages/admin/AdminReferral';
import { AdminRateCard } from './pages/admin/AdminRateCard';
import { AdminRateCalculator } from './pages/admin/AdminRateCalculator';
import { AdminAddOrder } from './pages/admin/AdminAddOrder';
import { AdminTracking } from './pages/admin/AdminTracking';
import { AdminProfile } from './pages/admin/AdminProfile';
import { AdminOrderTracking } from './pages/admin/AdminOrderTracking';
import { AdminSettingsHub } from './pages/admin/AdminSettingsHub';
import { AdminSettingsPlaceholder } from './pages/admin/AdminSettingsPlaceholder';
import { AdminWebhookSettings } from './pages/admin/AdminWebhookSettings';
import { AdminLabelSettings } from './pages/admin/AdminLabelSettings';
import { AdminChangePassword } from './pages/admin/AdminChangePassword';
import { AdminKYC } from './pages/admin/AdminKYC';
import { AdminAgreement } from './pages/admin/AdminAgreement';
import { AdminAgreementSettings } from './pages/admin/AdminAgreementSettings';
import { AdminPickupAddress } from './pages/admin/AdminPickupAddress';
import { AdminPickupManifestDetails } from './pages/admin/AdminPickupManifestDetails';
import { AdminShell } from './components/admin/layout/AdminShell';

function GlobalOrderClickInterceptor() {
  const navigate = useNavigate();

  useEffect(() => {
    const getColumnHeader = (element: HTMLElement): string => {
      const cell = element.closest('td, th') as HTMLTableCellElement | null;
      if (!cell) return "";
      const row = cell.closest('tr');
      if (!row) return "";
      const table = row.closest('table');
      if (!table) return "";
      const cellIndex = cell.cellIndex;
      
      const headerRow = table.querySelector('thead tr') || table.querySelector('tr');
      if (!headerRow) return "";
      
      const headerCell = headerRow.children[cellIndex];
      return headerCell?.textContent?.trim().toLowerCase() || "";
    };

    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      // Skip on KYC/Support pages — IDs in those pages false-positive as AWB/order IDs
      if (window.location.pathname.includes('/kyc') || window.location.pathname.includes('/support')) return;

      // Skip form elements and currency text early
      if (target.closest('input, select, textarea')) return;
      const text = target.textContent?.trim() || "";
      if (text.includes('₹') || text.includes('Rs') || text.includes('$')) return;

      const cleanText = text.replace(/,/g, '');

      // Prefixed order IDs (QP/ORD) — unambiguous in any context
      const isPrefixedOrderId = /^(QP\d+|ORD\d+)$/i.test(cleanText);
      // AWB: 9+ digit number OR courier code (1–6 letters followed by 6+ digits)
      const isAwb = !isPrefixedOrderId && /^(\d{9,}|[A-Z]{1,6}\d{6,})$/i.test(cleanText);
      // Bare numeric ID: only a candidate — must confirm column header below
      const isNumericCandidate = !isPrefixedOrderId && !isAwb && /^\d{5,8}$/.test(cleanText);

      if (!isPrefixedOrderId && !isAwb && !isNumericCandidate) return;

      const headerText = getColumnHeader(target);

      // Bare numbers are order IDs ONLY when the column is explicitly "order"
      if (isNumericCandidate && headerText !== 'order') return;

      // For AWBs, skip phone/mobile/pin/contact columns to avoid false positives
      if (isAwb && (
        headerText.includes('phone') || headerText.includes('mobile') ||
        headerText.includes('pin') || headerText.includes('contact')
      )) return;

      event.preventDefault();
      event.stopPropagation();
      const panel = window.location.pathname.startsWith('/user/') ? '/user' : '/admin';
      if (isAwb) {
        navigate(`${panel}/tracking?awb=${cleanText}`);
      } else {
        navigate(`${panel}/order-tracking?id=${cleanText}`);
      }
    };

    document.addEventListener('click', handleGlobalClick, true);
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, [navigate]);

  return null;
}

function AppRootHandler() {
  if (window.location.hostname === 'app.quickpost.in') {
    const token = getToken();
    const isValid = token && !isTokenExpired(token);
    if (isValid) {
      const role = getRoleFromToken(token!);
      return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} replace />;
    }
    return <Navigate to="/login" replace />;
  }
  return <Home />;
}

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const token = getToken();
  const isValid = token && !isTokenExpired(token);
  if (!isValid) return <>{children}</>;
  const role = getRoleFromToken(token!);
  return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} replace />;
}

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OfflineOverlay />
      <Router>
        <GlobalOrderClickInterceptor />
        <Routes>
          <Route path="/" element={<AppRootHandler />} />
          <Route path="/track" element={<Track />} />
          <Route path="/rate-calculator" element={<RateCalculator />} />
          <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />
          <Route path="/employee-login" element={<AuthRedirect><EmployeeLogin /></AuthRedirect>} />
          <Route path="/forgot-password" element={<AuthRedirect><ForgotPassword /></AuthRedirect>} />

          {/* Protected Routes — auth check + context providers */}
          <Route element={<AdminUserProvider><DashboardFilterProvider><ProtectedRoute /></DashboardFilterProvider></AdminUserProvider>}>

            {/* Persistent shell — sidebar + header mount once, only content area animates */}
            <Route element={<AdminShell />}>

            {/* ── Admin-only routes (/admin/*, /internal-crm/*) ── */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/roles" element={<AdminRoles />} />
              <Route path="/admin/allocate-sellers" element={<AdminAllocateSellers />} />
              <Route path="/admin/status-map" element={<AdminStatusMap />} />
              <Route path="/admin/edd-mapping" element={<AdminEDDMapping />} />
              <Route path="/admin/epd-mapping" element={<AdminEPDMapping />} />
              <Route path="/admin/vendors" element={<AdminVendors />} />
              <Route path="/admin/couriers" element={<AdminCouriers />} />
              <Route path="/admin/couriers/:tabSlug" element={<AdminCouriers />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/orders/:tabSlug" element={<AdminOrders />} />
              <Route path="/admin/shipments" element={<AdminShipments />} />
              <Route path="/admin/ndr" element={<AdminNDR />} />
              <Route path="/admin/ndr/:tabSlug" element={<AdminNDR />} />
              <Route path="/admin/cod" element={<AdminCOD />} />
              <Route path="/admin/cod/:tabSlug" element={<AdminCOD />} />
              <Route path="/admin/wallet" element={<AdminWallet />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/support" element={<AdminSupport />} />
              <Route path="/admin/support/:tabSlug" element={<AdminSupport />} />
              {/* <Route path="/admin/settings" element={<AdminSettings />} /> */}
              <Route path="/admin/accounts" element={<AdminAccounts />} />
              <Route path="/admin/audit" element={<AdminAuditLogs />} />
              <Route path="/admin/profile" element={<AdminProfile />} />
              <Route path="/admin/company" element={<AdminSettings />} />
              <Route path="/admin/weight-discrepancy" element={<AdminWeightDiscrepancy />} />
              <Route path="/admin/weight-discrepancy/:tabSlug" element={<AdminWeightDiscrepancy />} />
              <Route path="/admin/announcement" element={<AdminAnnouncements />} />
              <Route path="/admin/notification" element={<AdminNotification />} />
              <Route path="/admin/notification/:tabSlug" element={<AdminNotification />} />
              <Route path="/admin/rate-calculator" element={<AdminRateCalculator />} />
              <Route path="/admin/add-order" element={<AdminAddOrder />} />
              <Route path="/admin/tracking" element={<AdminTracking />} />
              <Route path="/admin/referral" element={<AdminReferral />} />
              <Route path="/admin/rate-card" element={<AdminRateCard />} />
              <Route path="/admin/order-tracking" element={<AdminOrderTracking />} />
              <Route path="/admin/kyc" element={<AdminKYC />} />
              <Route path="/admin/agreement" element={<AdminAgreement />} />
              <Route path="/admin/settings/pickup-address" element={<AdminPickupAddress />} />
              <Route path="/admin/pickup-manifest/:pickupId" element={<AdminPickupManifestDetails />} />
              <Route path="/internal-crm/shipments" element={<CRMShipmentListing />} />
              <Route path="/internal-crm/sellers" element={<CRMSellerAccounts />} />
              <Route path="/internal-crm/leads" element={<CRMLeads />} />
              <Route path="/internal-crm/couriers" element={<CRMCourierPartners />} />
              <Route path="/internal-crm/escalations" element={<CRMEscalations />} />
              <Route path="/internal-crm/metrics" element={<CRMBusinessMetrics />} />
            </Route>

            {/* ── User-only routes (/user/*) ── */}
            <Route element={<ProtectedRoute allowedRoles={['user']} />}>
              <Route path="/user/dashboard" element={<AdminDashboard />} />
              <Route path="/user/orders" element={<AdminOrders />} />
              <Route path="/user/orders/:tabSlug" element={<AdminOrders />} />
              <Route path="/user/ndr" element={<AdminNDR />} />
              <Route path="/user/ndr/:tabSlug" element={<AdminNDR />} />
              <Route path="/user/wallet" element={<AdminWallet />} />
              <Route path="/user/cod" element={<AdminCOD />} />
              <Route path="/user/reports" element={<AdminReports />} />
              <Route path="/user/weight-discrepancy" element={<AdminWeightDiscrepancy />} />
              <Route path="/user/weight-discrepancy/:tabSlug" element={<AdminWeightDiscrepancy />} />
              <Route path="/user/notification" element={<AdminNotification />} />
              <Route path="/user/notification/:tabSlug" element={<AdminNotification />} />
              <Route path="/user/kyc" element={<AdminKYC />} />
              <Route path="/user/referral" element={<AdminReferral />} />
              <Route path="/user/support" element={<AdminSupport />} />
              <Route path="/user/support/:tabSlug" element={<AdminSupport />} />
              <Route path="/user/rate-calculator" element={<AdminRateCalculator />} />
              <Route path="/user/add-order" element={<AdminAddOrder />} />
              <Route path="/user/tracking" element={<AdminTracking />} />
              <Route path="/user/profile" element={<AdminProfile />} />
              <Route path="/user/order-tracking" element={<AdminOrderTracking />} />
              <Route path="/user/settings" element={<AdminSettingsHub />} />
              <Route path="/user/settings/change-password" element={<AdminChangePassword />} />
              <Route path="/user/settings/label" element={<AdminLabelSettings />} />
              <Route path="/user/settings/invoice" element={<AdminSettingsPlaceholder title="Invoice" description="Manage your invoice preferences and billing settings." />} />
              <Route path="/user/settings/webhook" element={<AdminWebhookSettings />} />
              <Route path="/user/settings/agreement" element={<AdminAgreementSettings />} />
              <Route path="/user/settings/pickup-address" element={<AdminPickupAddress />} />
              <Route path="/user/pickup-manifest/:pickupId" element={<AdminPickupManifestDetails />} />
              <Route path="/user/employees" element={<AdminRoles />} />
            </Route>

            </Route>{/* /AdminShell */}
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
