import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Home } from './pages/Home';
import { ForgotPassword } from './pages/ForgotPassword';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/layout/ProtectedRoute';



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
import { AdminStubPage } from './pages/admin/AdminStubPage';
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
import { AdminTransferCOD } from './pages/admin/AdminTransferCOD';
import { AdminProfile } from './pages/admin/AdminProfile';
import { AdminOrderTracking } from './pages/admin/AdminOrderTracking';
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

      // Check if text is QP or ORD followed by digits, or a 5-8 digit number
      const isOrderId = /^(QP\d+|ORD\d+|\d{5,8})$/i.test(cleanText);

      if (isOrderId) {
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
          headerText.includes('referral')
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
        navigate(`/admin/order-tracking?id=${cleanText}`);
      }
    };

    document.addEventListener('click', handleGlobalClick, true);
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, [navigate]);

  return null;
}

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <GlobalOrderClickInterceptor />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'user']} />}>
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
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/shipments" element={<AdminShipments />} />
            <Route path="/admin/ndr" element={<AdminNDR />} />
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
            <Route path="/admin/announcement" element={<AdminAnnouncements />} />
            <Route path="/admin/notification" element={<AdminNotification />} />
            <Route path="/admin/rate-calculator" element={<AdminRateCalculator />} />
            <Route path="/admin/add-order" element={<AdminAddOrder />} />
            <Route path="/admin/tracking" element={<AdminTracking />} />
            <Route path="/admin/transfer-cod" element={<AdminTransferCOD />} />
            <Route path="/admin/referral" element={<AdminReferral />} />
            <Route path="/admin/rate-card" element={<AdminRateCard />} />
            <Route path="/admin/order-tracking" element={<AdminOrderTracking />} />
            <Route path="/admin/kyc" element={<AdminKYC />} />
            
            {/* Internal CRM Routes */}
            <Route path="/internal-crm/shipments" element={<CRMShipmentListing />} />
            <Route path="/internal-crm/sellers" element={<CRMSellerAccounts />} />
            <Route path="/internal-crm/leads" element={<CRMLeads />} />
            <Route path="/internal-crm/couriers" element={<CRMCourierPartners />} />
            <Route path="/internal-crm/escalations" element={<CRMEscalations />} />
            <Route path="/internal-crm/metrics" element={<CRMBusinessMetrics />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
