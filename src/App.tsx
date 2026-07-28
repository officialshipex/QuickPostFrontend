import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { getToken, isTokenExpired, getRoleFromToken } from './utils/session';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Home } from './pages/Home';
import { ForgotPassword } from './pages/ForgotPassword';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AdminUserProvider } from './context/AdminUserContext';
import { DashboardFilterProvider } from './context/DashboardFilterContext';



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

      const text = target.textContent?.trim() || "";
      const cleanText = text.replace(/,/g, '');

      // Check if text is QP or ORD followed by digits, or a 5-8 digit number (order ID)
      const isOrderId = /^(QP\d+|ORD\d+|\d{5,8})$/i.test(cleanText);
      // AWB: 9+ digit number OR alphanumeric courier code (letter prefix + 6+ digits)
      const isAwb = !isOrderId && /^(\d{9,}|[A-Z]{1,6}\d{6,})$/i.test(cleanText);

      if (isOrderId || isAwb) {
        // Exclude inputs, selects, textareas
        if (target.closest('input, select, textarea')) {
          return;
        }

        // Avoid false positives like Pincodes, Mobile numbers, quantity, etc.
        const headerText = getColumnHeader(target);
        if (
          headerText.includes('pin') ||
          headerText.includes('phone') ||
          headerText.includes('mobile') ||
          headerText.includes('qty') ||
          headerText.includes('page') ||
          headerText.includes('user') ||
          headerText.includes('seller') ||
          headerText.includes('customer') ||
          headerText.includes('recipient') ||
          headerText.includes('partner') ||
          headerText.includes('account') ||
          headerText.includes('lead') ||
          headerText.includes('member') ||
          headerText.includes('admin') ||
          headerText.includes('manager') ||
          headerText.includes('ticket') ||
          headerText.includes('referral') ||
          headerText.includes('remittance') ||
          headerText.includes('transaction') ||
          headerText.includes('refer') ||
          headerText.includes('contact')
        ) {
          return;
        }

        // Exclude prices/currency amounts
        if (text.includes('₹') || text.includes('Rs') || text.includes('$')) {
          return;
        }

        // Trigger redirection
        event.preventDefault();
        event.stopPropagation();
        if (isAwb) {
          navigate(`/admin/tracking?awb=${cleanText}`);
        } else {
          navigate(`/admin/order-tracking?id=${cleanText}`);
        }
      }
    };

    document.addEventListener('click', handleGlobalClick, true);
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, [navigate]);

  return null;
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
      <Router>
        <GlobalOrderClickInterceptor />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />
          <Route path="/forgot-password" element={<AuthRedirect><ForgotPassword /></AuthRedirect>} />
          
          {/* Protected Routes — auth check + context providers */}
          <Route element={<AdminUserProvider><DashboardFilterProvider><ProtectedRoute /></DashboardFilterProvider></AdminUserProvider>}>

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
              <Route path="/admin/wallet" element={<AdminWallet />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/support" element={<AdminSupport />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/accounts" element={<AdminAccounts />} />
              <Route path="/admin/audit" element={<AdminAuditLogs />} />
              <Route path="/admin/profile" element={<AdminProfile />} />
              <Route path="/admin/company" element={<AdminSettings />} />
              <Route path="/admin/weight-discrepancy" element={<AdminWeightDiscrepancy />} />
              <Route path="/admin/weight-discrepancy/:tabSlug" element={<AdminWeightDiscrepancy />} />
              <Route path="/admin/announcement" element={<AdminAnnouncements />} />
              <Route path="/admin/notification" element={<AdminNotification />} />
              <Route path="/admin/rate-calculator" element={<AdminRateCalculator />} />
              <Route path="/admin/add-order" element={<AdminAddOrder />} />
              <Route path="/admin/tracking" element={<AdminTracking />} />
              <Route path="/admin/referral" element={<AdminReferral />} />
              <Route path="/admin/rate-card" element={<AdminRateCard />} />
              <Route path="/admin/order-tracking" element={<AdminOrderTracking />} />
              <Route path="/admin/kyc" element={<AdminKYC />} />
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
              <Route path="/user/kyc" element={<AdminKYC />} />
              <Route path="/user/referral" element={<AdminReferral />} />
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
            </Route>

          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
