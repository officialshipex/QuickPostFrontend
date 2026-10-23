import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { getToken, isTokenExpired, getRoleFromToken, isEmployeeToken } from './utils/session';
import { isLandingDomain } from './utils/domainUrl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Home } from './pages/Home';
import { Track } from './pages/Track';
import { Terms } from './pages/Terms';
import { RefundPolicy } from './pages/RefundPolicy';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { RateCalculator } from './pages/RateCalculator';
import { ForgotPassword } from './pages/ForgotPassword';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { EmployeeLogin } from './pages/EmployeeLogin';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AdminUserProvider } from './context/AdminUserContext';
import { ThemeProvider } from './context/ThemeContext';
import { DashboardFilterProvider } from './context/DashboardFilterContext';
import { NotificationListProvider } from './context/NotificationListContext';
import { OfflineOverlay } from './components/ui/OfflineOverlay';
import { EmailPreview } from './pages/dev/EmailPreview';



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
import { AdminReportsHub } from './pages/admin/AdminReportsHub';
import { AdminPerformance } from './pages/admin/AdminPerformance';
import { AdminCOD } from './pages/admin/AdminCOD';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminAccounts } from './pages/admin/AdminAccounts';
import { AdminCompanies } from './pages/admin/companies/AdminCompanies';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';
import { AdminWeightDiscrepancy } from './pages/admin/AdminWeightDiscrepancy';
import { AdminAnnouncements } from './pages/admin/AdminAnnouncements';
import { AdminManageVas } from './pages/admin/AdminManageVas';
import { AdminNotification } from './pages/admin/AdminNotification';
import { AdminRoles } from './pages/admin/AdminRoles';
import { AdminAllocateSellers } from './pages/admin/AdminAllocateSellers';
import { AdminStatusMap } from './pages/admin/AdminStatusMap';
import { AdminEDDMapping } from './pages/admin/AdminEDDMapping';
import { AdminEPDMapping } from './pages/admin/AdminEPDMapping';
import { AdminReferral } from './pages/admin/AdminReferral';
import { UserReferral } from './pages/admin/UserReferral';
import { AdminRateCard } from './pages/admin/AdminRateCard';
import { AdminRateCalculator } from './pages/admin/AdminRateCalculator';
import { AdminAddOrder } from './pages/admin/AdminAddOrder';
import { AdminTracking } from './pages/admin/AdminTracking';
import { AdminProfile } from './pages/admin/AdminProfile';
import { AdminOrderTracking } from './pages/admin/AdminOrderTracking';
import { CARGO_BASE, appPathname, isCargoUrl } from './utils/shippingMode';
import { BookSession } from './pages/BookSession';
import { SalesDashboard } from './pages/admin/sales/SalesDashboard';
import { SalesTasks } from './pages/admin/sales/SalesTasks';
import { SalesManagement } from './pages/admin/sales/SalesManagement';
import { VasHub } from './pages/admin/vas/VasHub';
import { NdrFollowups } from './pages/admin/vas/NdrFollowups';
import { ModeRoute } from './pages/cargo/ModeRoute';
import { CargoHome } from './pages/cargo/CargoHome';
import { CargoRateCalculator } from './pages/cargo/CargoRateCalculator';
import { CargoAnnouncements } from './pages/cargo/CargoAnnouncements';
import { CargoCRMBusinessMetrics } from './pages/cargo/CargoCRMBusinessMetrics';
import { CargoCRMCourierPartners } from './pages/cargo/CargoCRMCourierPartners';
import { CargoCRMEscalations } from './pages/cargo/CargoCRMEscalations';
import { CargoCRMLeads } from './pages/cargo/CargoCRMLeads';
import { CargoCRMSellerAccounts } from './pages/cargo/CargoCRMSellerAccounts';
import { CargoCRMShipmentListing } from './pages/cargo/CargoCRMShipmentListing';
import { CargoCouriers } from './pages/cargo/CargoCouriers';
import { CargoPickupAddress } from './pages/cargo/CargoPickupAddress';
import { CargoRateCard } from './pages/cargo/CargoRateCard';
import { CargoDashboard } from './pages/cargo/CargoDashboard';
import { CargoOrders } from './pages/cargo/CargoOrders';
import { CargoNDR } from './pages/cargo/CargoNDR';
import { CargoWeightDiscrepancy } from './pages/cargo/CargoWeightDiscrepancy';
import { CargoLabelSettings } from './pages/cargo/CargoLabelSettings';
import { AdminSettingsHub } from './pages/admin/AdminSettingsHub';
import { AdminChannels } from './pages/admin/AdminChannels';
import { AdminEarlyCodRemittance } from './pages/admin/AdminSellerRemittance';
import {
  AdminAutoSecure,
  AdminRtoScore,
  AdminDeliveryBoost,
  // AdminSecureX, // commented out for now — re-enable when Secure X ships
  // AdminBrandBoost, // commented out for now — re-enable when Brand Boost ships
  AdminNotify,
  AdminShipsure,
} from './pages/admin/AdminValueAddedServices';
import { AdminCourierSetup } from './pages/admin/AdminCourierSetup';
import { AdminSettingsPlaceholder } from './pages/admin/AdminSettingsPlaceholder';
import { AdminWebhookSettings } from './pages/admin/AdminWebhookSettings';
import { AdminLabelSettings } from './pages/admin/AdminLabelSettings';
import { AdminChangePassword } from './pages/admin/AdminChangePassword';
import { AdminKYC } from './pages/admin/AdminKYC';
import { AdminKycReview } from './pages/admin/AdminKycReview';
import { AdminAgreement } from './pages/admin/AdminAgreement';
import { AdminAgreementSettings } from './pages/admin/AdminAgreementSettings';
import { AdminPickupAddress } from './pages/admin/AdminPickupAddress';
import { AdminPickupManifestDetails } from './pages/admin/AdminPickupManifestDetails';
import { AdminShell } from './components/admin/layout/AdminShell';
import { UserHome } from './pages/admin/UserHome';
import { BrandedTrackingBuilder } from './pages/admin/brandedTracking/builder/BrandedTrackingBuilder';
import { BrandedTrackingPublicPage } from './pages/admin/brandedTracking/BrandedTrackingPublicPage';

function GlobalOrderClickInterceptor() {
  const navigate = useNavigate();

  useEffect(() => {
    const getColumnHeader = (element: HTMLElement): string => {
      // Table: find the header cell for the clicked column
      const cell = element.closest('td, th') as HTMLTableCellElement | null;
      if (cell) {
        const row = cell.closest('tr');
        if (!row) return "";
        const table = row.closest('table');
        if (!table) return "";
        const cellIndex = cell.cellIndex;
        const headerRow = table.querySelector('thead tr') || table.querySelector('tr');
        if (!headerRow) return "";
        const headerCell = headerRow.children[cellIndex];
        return headerCell?.textContent?.trim().toLowerCase() || "";
      }
      // Card/div layout (mobile cards): check the previous sibling element for a label
      // e.g. <span>Mobile</span><span>9876543210</span> — prev sibling is the label
      const prev = element.previousElementSibling;
      if (prev) {
        const t = prev.textContent?.trim().toLowerCase() || "";
        if (t) return t;
      }
      // Also try parent's previous sibling for wrapper-per-field patterns
      const parentPrev = element.parentElement?.previousElementSibling;
      if (parentPrev) return parentPrev.textContent?.trim().toLowerCase() || "";
      return "";
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

      // For AWBs, skip phone/mobile/pin/contact/tel columns to avoid false positives
      if (isAwb && (
        headerText.includes('phone') || headerText.includes('mobile') ||
        headerText.includes('pin') || headerText.includes('contact') ||
        headerText.includes('tel')
      )) return;
      // Indian mobile numbers (10 digits, starts with 6–9) are never AWBs on this platform
      if (isAwb && /^[6-9]\d{9}$/.test(cleanText)) return;

      event.preventDefault();
      event.stopPropagation();
      const panel = appPathname().startsWith('/user/') ? '/user' : '/admin';
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
      return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/user/home'} replace />;
    }
    return <Navigate to="/login" replace />;
  }
  // The app domain has no public homepage; elsewhere (localhost, previews) logged-out users still see it.
  if (window.location.hostname === 'app.quickpost.in') return <Navigate to="/login" replace />;
  return <Home />;
}

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const token = getToken();
  const isValid = token && !isTokenExpired(token);
  if (!isValid) return <>{children}</>;
  const role = getRoleFromToken(token!);
  return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/user/home'} replace />;
}

// The employee login page only skips ahead when an EMPLOYEE is already signed in. An owner's
// token (same browser storage, other tab) must not bounce them away: they are here to log in
// as an employee.
function EmployeeAuthRedirect({ children }: { children: React.ReactNode }) {
  const token = getToken();
  const isValid = token && !isTokenExpired(token);
  if (!isValid || !isEmployeeToken(token!)) return <>{children}</>;
  const role = getRoleFromToken(token!);
  return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} replace />;
}

const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <OfflineOverlay />
      <Router basename={isCargoUrl() ? CARGO_BASE : undefined}>
        <GlobalOrderClickInterceptor />
        <Routes>
          {/* Dev-only: preview every transactional email template with sample data.
              import.meta.env.DEV is statically replaced by Vite at build time, so this
              route (and the EmailPreview import) is dropped entirely from prod bundles. */}
          {import.meta.env.DEV && <Route path="/dev/email-preview" element={<EmailPreview />} />}
          <Route path="/" element={<AppRootHandler />} />
          <Route path="/track" element={<Track />} />
          <Route path="/track/:storeSlug" element={<BrandedTrackingPublicPage />} />
          <Route path="/terms-and-conditions" element={<Terms />} />
          <Route path="/refund-and-cancellation-policy" element={<RefundPolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/rate-calculator" element={<RateCalculator />} />
          <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />
          <Route path="/register" element={<AuthRedirect><Register /></AuthRedirect>} />
          <Route path="/employee-login" element={<EmployeeAuthRedirect><EmployeeLogin /></EmployeeAuthRedirect>} />
          <Route path="/forgot-password" element={<AuthRedirect><ForgotPassword /></AuthRedirect>} />

          {/* Protected Routes — auth check + context providers */}
          <Route element={<AdminUserProvider><DashboardFilterProvider><NotificationListProvider><ProtectedRoute /></NotificationListProvider></DashboardFilterProvider></AdminUserProvider>}>

            {/* Standalone (no sidebar/header) — opens in its own tab from Home */}
            <Route path="/user/book-session" element={<BookSession />} />

            {/* Persistent shell — sidebar + header mount once, only content area animates */}
            <Route element={<AdminShell />}>

            {/* ── Admin-only routes (/admin/*, /internal-crm/*) ── */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<ModeRoute b2c={<AdminDashboard />} cargo={<CargoDashboard />} />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/roles" element={<AdminRoles />} />
              <Route path="/admin/allocate-sellers" element={<AdminAllocateSellers />} />
              <Route path="/admin/status-map" element={<AdminStatusMap />} />
              <Route path="/admin/edd-mapping" element={<AdminEDDMapping />} />
              <Route path="/admin/epd-mapping" element={<AdminEPDMapping />} />
              <Route path="/admin/vendors" element={<AdminVendors />} />
              <Route path="/admin/couriers" element={<ModeRoute b2c={<AdminCouriers />} cargo={<CargoCouriers />} />} />
              <Route path="/admin/couriers/:tabSlug" element={<ModeRoute b2c={<AdminCouriers />} cargo={<CargoCouriers />} />} />
              <Route path="/admin/orders" element={<ModeRoute b2c={<AdminOrders />} cargo={<CargoOrders />} />} />
              <Route path="/admin/orders/:tabSlug" element={<ModeRoute b2c={<AdminOrders />} cargo={<CargoOrders />} />} />
              <Route path="/admin/shipments" element={<AdminShipments />} />
              <Route path="/admin/ndr" element={<ModeRoute b2c={<AdminNDR />} cargo={<CargoNDR />} />} />
              <Route path="/admin/ndr/:tabSlug" element={<ModeRoute b2c={<AdminNDR />} cargo={<CargoNDR />} />} />
              <Route path="/admin/cod" element={<AdminCOD />} />
              <Route path="/admin/cod/:tabSlug" element={<AdminCOD />} />
              <Route path="/admin/wallet" element={<AdminWallet />} />
              <Route path="/admin/reports" element={<AdminReportsHub />} />
              <Route path="/admin/performance" element={<AdminPerformance />} />
              <Route path="/admin/support" element={<AdminSupport />} />
              <Route path="/admin/support/:tabSlug" element={<AdminSupport />} />
              {/* <Route path="/admin/settings" element={<AdminSettings />} /> */}
              <Route path="/admin/accounts" element={<AdminAccounts />} />
              <Route path="/admin/companies" element={<AdminCompanies />} />
              <Route path="/admin/sales" element={<SalesDashboard />} />
              <Route path="/admin/tasks" element={<SalesTasks />} />
              <Route path="/admin/sales-management" element={<SalesManagement />} />
              <Route path="/admin/audit" element={<AdminAuditLogs />} />
              <Route path="/admin/profile" element={<AdminProfile />} />
              <Route path="/admin/company" element={<AdminSettings />} />
              <Route path="/admin/weight-discrepancy" element={<ModeRoute b2c={<AdminWeightDiscrepancy />} cargo={<CargoWeightDiscrepancy />} />} />
              <Route path="/admin/weight-discrepancy/:tabSlug" element={<ModeRoute b2c={<AdminWeightDiscrepancy />} cargo={<CargoWeightDiscrepancy />} />} />
              <Route path="/admin/announcement" element={<ModeRoute b2c={<AdminAnnouncements />} cargo={<CargoAnnouncements />} />} />
              <Route path="/admin/vas" element={<AdminManageVas />} />
              <Route path="/admin/notification" element={<AdminNotification />} />
              <Route path="/admin/notification/:tabSlug" element={<AdminNotification />} />
              <Route path="/admin/rate-calculator" element={<AdminRateCalculator />} />
              <Route path="/admin/add-order" element={<AdminAddOrder />} />
              <Route path="/admin/tracking" element={<AdminTracking />} />
              <Route path="/admin/referral" element={<AdminReferral />} />
              <Route path="/admin/rate-card" element={<ModeRoute b2c={<AdminRateCard />} cargo={<CargoRateCard />} />} />
              <Route path="/admin/order-tracking" element={<AdminOrderTracking />} />
              <Route path="/admin/kyc" element={<AdminKYC />} />
              <Route path="/admin/kyc-review" element={<AdminKycReview />} />
              <Route path="/admin/agreement" element={<AdminAgreement />} />
              <Route path="/admin/settings/pickup-address" element={<ModeRoute b2c={<AdminPickupAddress />} cargo={<CargoPickupAddress />} />} />
              <Route path="/admin/pickup-manifest/:pickupId" element={<AdminPickupManifestDetails />} />
              <Route path="/internal-crm/shipments" element={<ModeRoute b2c={<CRMShipmentListing />} cargo={<CargoCRMShipmentListing />} />} />
              <Route path="/internal-crm/sellers" element={<ModeRoute b2c={<CRMSellerAccounts />} cargo={<CargoCRMSellerAccounts />} />} />
              <Route path="/internal-crm/leads" element={<ModeRoute b2c={<CRMLeads />} cargo={<CargoCRMLeads />} />} />
              <Route path="/internal-crm/couriers" element={<ModeRoute b2c={<CRMCourierPartners />} cargo={<CargoCRMCourierPartners />} />} />
              <Route path="/internal-crm/escalations" element={<ModeRoute b2c={<CRMEscalations />} cargo={<CargoCRMEscalations />} />} />
              <Route path="/internal-crm/metrics" element={<ModeRoute b2c={<CRMBusinessMetrics />} cargo={<CargoCRMBusinessMetrics />} />} />
            </Route>

            {/* ── User-only routes (/user/*) ── */}
            <Route element={<ProtectedRoute allowedRoles={['user']} />}>
              <Route path="/user/home" element={<ModeRoute b2c={<UserHome />} cargo={<CargoHome />} />} />
              <Route path="/user/dashboard" element={<ModeRoute b2c={<AdminDashboard />} cargo={<CargoDashboard />} />} />
              <Route path="/user/orders" element={<ModeRoute b2c={<AdminOrders />} cargo={<CargoOrders />} />} />
              <Route path="/user/orders/:tabSlug" element={<ModeRoute b2c={<AdminOrders />} cargo={<CargoOrders />} />} />
              <Route path="/user/ndr" element={<ModeRoute b2c={<AdminNDR />} cargo={<CargoNDR />} />} />
              <Route path="/user/ndr/:tabSlug" element={<ModeRoute b2c={<AdminNDR />} cargo={<CargoNDR />} />} />
              <Route path="/user/wallet" element={<AdminWallet />} />
              <Route path="/user/cod" element={<AdminCOD />} />
              <Route path="/user/reports" element={<AdminReportsHub />} />
              <Route path="/user/weight-discrepancy" element={<ModeRoute b2c={<AdminWeightDiscrepancy />} cargo={<CargoWeightDiscrepancy />} />} />
              <Route path="/user/weight-discrepancy/:tabSlug" element={<ModeRoute b2c={<AdminWeightDiscrepancy />} cargo={<CargoWeightDiscrepancy />} />} />
              <Route path="/user/notification" element={<AdminNotification />} />
              <Route path="/user/notification/:tabSlug" element={<AdminNotification />} />
              <Route path="/user/kyc" element={<Navigate to="/user/profile?tab=kyc" replace />} />
              <Route path="/user/referral" element={<UserReferral />} />
              <Route path="/user/support" element={<AdminSupport />} />
              <Route path="/user/support/:tabSlug" element={<AdminSupport />} />
              <Route path="/user/rate-calculator" element={<ModeRoute b2c={<AdminRateCalculator />} cargo={<CargoRateCalculator />} />} />
              <Route path="/user/add-order" element={<AdminAddOrder />} />
              <Route path="/user/tracking" element={<AdminTracking />} />
              <Route path="/user/profile" element={<AdminProfile />} />
              <Route path="/user/order-tracking" element={<AdminOrderTracking />} />
              <Route path="/user/settings" element={<AdminSettingsHub />} />
              <Route path="/user/settings/change-password" element={<AdminChangePassword />} />
              <Route path="/user/settings/label" element={<ModeRoute b2c={<AdminLabelSettings />} cargo={<CargoLabelSettings />} />} />
              <Route path="/user/settings/invoice" element={<AdminSettingsPlaceholder title="Invoice" description="Manage your invoice preferences and billing settings." />} />
              <Route path="/user/settings/webhook" element={<AdminWebhookSettings />} />
              <Route path="/user/settings/agreement" element={<AdminAgreementSettings />} />
              <Route path="/user/settings/pickup-address" element={<ModeRoute b2c={<AdminPickupAddress />} cargo={<CargoPickupAddress />} />} />
              <Route path="/user/pickup-manifest/:pickupId" element={<AdminPickupManifestDetails />} />
              <Route path="/user/employees" element={<AdminRoles />} />
              <Route path="/user/channels" element={<AdminChannels />} />
              <Route path="/user/courier-setup" element={<AdminCourierSetup />} />
              <Route path="/user/seller-remittance/early-cod" element={<AdminEarlyCodRemittance />} />
              <Route path="/user/vas" element={<VasHub />} />
              <Route path="/user/vas/ndr-followups" element={<NdrFollowups />} />
              <Route path="/user/vas/auto-secure" element={<AdminAutoSecure />} />
              <Route path="/user/vas/rto-score" element={<AdminRtoScore />} />
              <Route path="/user/vas/delivery-boost" element={<AdminDeliveryBoost />} />
              {/* <Route path="/user/vas/secure-x" element={<AdminSecureX />} /> */}
              {/* <Route path="/user/vas/brand-boost" element={<AdminBrandBoost />} /> */}
              <Route path="/user/vas/notify" element={<AdminNotify />} />
              <Route path="/user/vas/shipsure" element={<AdminShipsure />} />
              <Route path="/user/vas/branded-tracking" element={<BrandedTrackingBuilder />} />
            </Route>

            </Route>{/* /AdminShell */}
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
