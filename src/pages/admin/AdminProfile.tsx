import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { useAdminTab } from '../../context/AdminUserContext';
import {
  MapPin,
  CreditCard,
  IdCard,
  FileText,
  Settings,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
  Download,
  Camera,
} from 'lucide-react';

const fmtProfileDate = (iso: string | null | undefined) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const fmtProfileDateTime = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    + ', ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const fmtProfileCurrency = (amount: number | null | undefined) => {
  if (amount == null) return '₹0.00';
  const abs = Math.abs(amount);
  const f = abs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (amount < 0 ? '-₹' : '₹') + f;
};

export function AdminProfile() {
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { currentUserId } = useAdminTab();
  const apiUser = location.state?.user;
  // getAllUsers returns ObjectId as `id` (not `_id`), getUserById does the same
  const mongoId = String(apiUser?.id || '');
  // When navigating from header dropdown (no route state), fall back to own user ID
  const effectiveId = mongoId || currentUserId;
  const isOwnProfile = !mongoId;

  const buildInitialData = () => {
    if (apiUser) {
      return {
        name: apiUser.fullname || '—',
        email: apiUser.email || '—',
        id: String(apiUser.userId || '—'),
        business: apiUser.company || '—',
        regDate: fmtProfileDate(apiUser.createdAt),
        balance: fmtProfileCurrency(apiUser.walletAmount),
        kyc: apiUser.kycStatus ? 'Verified' : 'Pending',
        rateCard: apiUser.rateCard || 'N/A',
        b2bRateCard: apiUser.b2bRateCard || 'N/A',
        codPlan: apiUser.codPlan || 'Standard',
        aadhaar: apiUser.aadharDetails?.aadharNumber || '—',
        aadharName: apiUser.aadharDetails?.nameOnAadhar || '—',
        aadharState: apiUser.aadharDetails?.state || '—',
        aadharAddress: apiUser.aadharDetails?.address || '—',
        phone: apiUser.phoneNumber || '—',
        address: apiUser.gstDetails?.companyAddress || apiUser.billingAddress?.address || '—',
        city: apiUser.gstDetails?.city || apiUser.billingAddress?.city || '—',
        state: apiUser.gstDetails?.state || apiUser.billingAddress?.state || '—',
        country: 'India',
        pincode: apiUser.gstDetails?.pincode || apiUser.billingAddress?.postalCode || '—',
        gstin: apiUser.gstDetails?.gstNumber || '—',
        beneficiaryName: apiUser.accountDetails?.beneficiaryName || '—',
        bankName: apiUser.accountDetails?.bankName || '—',
        accountNumber: apiUser.accountDetails?.accountNumber || '—',
        ifsc: apiUser.accountDetails?.ifscCode || '—',
        branchName: apiUser.accountDetails?.branchName || '—',
        panNumber: apiUser.panDetails?.panNumber || '—',
        panName: apiUser.panDetails?.nameOnPan || apiUser.fullname || '—',
        panType: apiUser.panDetails?.panType || '—',
        panRefId: apiUser.panDetails?.referenceId || '—',
        lastLogin: fmtProfileDateTime(apiUser.lastLogin),
        creditLimit: String(apiUser.creditLimit || 0),
        orderCount: apiUser.orderCount || 0,
        referralCode: apiUser.referralCode || '—',
        referralCommission: apiUser.referralCommissionPercentage ? `${apiUser.referralCommissionPercentage}%` : '—',
        kamName: apiUser.kamDetails?.kamName || '—',
        kamEmail: apiUser.kamDetails?.kamEmail || '—',
        kamPhone: apiUser.kamDetails?.kamPhone || '—',
        publicKey: apiUser.apiKeys?.publicKey || '—',
      };
    }
    return {
      name: '—', email: '—', id: '—', business: '—', regDate: '—',
      balance: '₹0.00', kyc: 'Pending', rateCard: 'N/A', b2bRateCard: 'N/A', codPlan: 'Standard',
      aadhaar: '—', aadharName: '—', aadharState: '—', aadharAddress: '—',
      phone: '—', address: '—', city: '—', state: '—', country: 'India', pincode: '—', gstin: '—',
      beneficiaryName: '—', bankName: '—', accountNumber: '—', ifsc: '—', branchName: '—',
      panNumber: '—', panName: '—', panType: '—', panRefId: '—',
      lastLogin: '—', creditLimit: '0', orderCount: 0, referralCode: '—', referralCommission: '—',
      kamName: '—', kamEmail: '—', kamPhone: '—', publicKey: '—',
    };
  };

  const [userData, setUserData] = useState(buildInitialData());
  const [isActive, setIsActive] = useState(apiUser ? !apiUser.isBlocked : true);
  const [isKycVerified, setIsKycVerified] = useState(apiUser ? !!apiUser.kycStatus : false);
  const [apiAccess, setApiAccess] = useState(apiUser ? !!apiUser.adminApiAccess : false);
  const [holdAmount, setHoldAmount] = useState(0);
  // logo comes from getUserById (profileImage field) — not available in getAllUsers initial state
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [rates, setRates] = useState<any[]>([]);
  const [rateLoading, setRateLoading] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    isAdminWhatsAppEnable: false,
    isAdminSMSEnable: false,
    isAdminEmailEnable: false,
  });
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRates = async (uid: string) => {
    if (!uid) return;
    setRateLoading(true);
    try {
      const res = await apiClient.get('/saveRate/getRateCard', { params: { userId: uid } });
      setRates(res.data.rateCards || []);
    } catch {
      setRates([]);
    } finally {
      setRateLoading(false);
    }
  };

  useEffect(() => {
    if (!effectiveId) return;

    // Fresh user details — getUserById returns the full nested user document
    apiClient.get('/user/getUserById', { params: { id: effectiveId } })
      .then(res => {
        const fresh = res.data.userDetails;
        if (!fresh) return;
        setIsActive(!fresh.isBlocked);
        setIsKycVerified(!!fresh.kycStatus);
        setApiAccess(!!fresh.adminApiAccess);
        setLogoUrl(fresh.logo || null);
        setUserData(prev => ({
          ...prev,
          name: fresh.fullname || prev.name,
          email: fresh.email || prev.email,
          phone: fresh.phoneNumber || prev.phone,
          business: fresh.company || prev.business,
          balance: fmtProfileCurrency(fresh.walletAmount),
          kyc: fresh.kycStatus ? 'Verified' : 'Pending',
          rateCard: fresh.rateCard || prev.rateCard,
          b2bRateCard: fresh.b2bRateCard || prev.b2bRateCard,
          codPlan: fresh.codPlan || prev.codPlan,
          creditLimit: String(fresh.creditLimit ?? prev.creditLimit),
          orderCount: fresh.orderCount ?? prev.orderCount,
          lastLogin: fmtProfileDateTime(fresh.lastLogin) || prev.lastLogin,
          referralCode: fresh.referralCode || prev.referralCode,
          referralCommission: fresh.referralCommissionPercentage ? `${fresh.referralCommissionPercentage}%` : prev.referralCommission,
          publicKey: fresh.apiKeys?.publicKey || prev.publicKey,
          aadhaar: fresh.aadharDetails?.aadharNumber || prev.aadhaar,
          aadharName: fresh.aadharDetails?.nameOnAadhar || prev.aadharName,
          aadharState: fresh.aadharDetails?.state || prev.aadharState,
          aadharAddress: fresh.aadharDetails?.address || prev.aadharAddress,
          address: fresh.gstDetails?.companyAddress || fresh.billingAddress?.address || prev.address,
          city: fresh.gstDetails?.city || fresh.billingAddress?.city || prev.city,
          state: fresh.gstDetails?.state || fresh.billingAddress?.state || prev.state,
          pincode: fresh.gstDetails?.pincode || fresh.billingAddress?.postalCode || prev.pincode,
          gstin: fresh.gstDetails?.gstNumber || prev.gstin,
          beneficiaryName: fresh.accountDetails?.beneficiaryName || prev.beneficiaryName,
          bankName: fresh.accountDetails?.bankName || prev.bankName,
          accountNumber: fresh.accountDetails?.accountNumber || prev.accountNumber,
          ifsc: fresh.accountDetails?.ifscCode || prev.ifsc,
          branchName: fresh.accountDetails?.branchName || prev.branchName,
          panNumber: fresh.panDetails?.panNumber || prev.panNumber,
          panName: fresh.panDetails?.nameOnPan || prev.panName,
          panType: fresh.panDetails?.panType || prev.panType,
          panRefId: fresh.panDetails?.referenceId || prev.panRefId,
          kamName: fresh.kamDetails?.kamName || prev.kamName,
          kamEmail: fresh.kamDetails?.kamEmail || prev.kamEmail,
          kamPhone: fresh.kamDetails?.kamPhone || prev.kamPhone,
        }));
      })
      .catch(() => {});

    // Wallet balance + hold
    apiClient.get('/recharge/getWalletBalanceAndHoldAmount', { params: { id: effectiveId } })
      .then(res => {
        if (res.data.success) {
          setHoldAmount(res.data.holdAmount || 0);
          setUserData(prev => ({
            ...prev,
            balance: fmtProfileCurrency(res.data.balance ?? 0),
            creditLimit: String(res.data.creditLimit ?? prev.creditLimit),
          }));
        }
      })
      .catch(() => {});

    // Notification settings
    apiClient.get('/notification/getNotification', { params: { userId: effectiveId } })
      .then(res => { if (res.data) setNotificationSettings(res.data); })
      .catch(() => {});

    // Rate cards
    fetchRates(effectiveId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveId]);

  const handleToggle = async () => {
    const currentActive = isActive;
    const newBlocked = currentActive; // if currently active, clicking = block
    setIsActive(!currentActive);
    try {
      const res = await apiClient.post('/user/updateBlockStatus', { userId: effectiveId, isBlocked: newBlocked });
      showToast('success', res.data?.message || `User ${newBlocked ? 'blocked' : 'unblocked'} successfully.`);
    } catch (err: any) {
      setIsActive(currentActive);
      showToast('error', err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleKycToggle = async () => {
    const newStatus = !isKycVerified;
    setIsKycVerified(newStatus);
    setUserData(prev => ({ ...prev, kyc: newStatus ? 'Verified' : 'Pending' }));
    try {
      const res = await apiClient.post('/user/updateKycStatus', { userId: effectiveId, kycStatus: newStatus });
      showToast('success', res.data?.message || `KYC ${newStatus ? 'verified' : 'marked pending'} successfully.`);
    } catch (err: any) {
      setIsKycVerified(!newStatus);
      setUserData(prev => ({ ...prev, kyc: !newStatus ? 'Verified' : 'Pending' }));
      showToast('error', err.response?.data?.message || 'Failed to update KYC status.');
    }
  };

  const handleApiToggle = async () => {
    const newValue = !apiAccess;
    setApiAccess(newValue);
    try {
      await apiClient.post('/user/apiAccess', { userId: effectiveId, adminApiAccess: newValue });
      showToast('success', 'API access updated.');
    } catch {
      setApiAccess(!newValue);
      showToast('error', 'Failed to update API access.');
    }
  };

  const handleNotificationToggle = async (field: string, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }));
    try {
      await apiClient.put('/notification/updateNotification', { field, value, userId: effectiveId });
      const name = field === 'isAdminWhatsAppEnable' ? 'WhatsApp' : field === 'isAdminEmailEnable' ? 'Email' : 'SMS';
      showToast('success', `${name} notification ${value ? 'enabled' : 'disabled'}.`);
    } catch {
      setNotificationSettings(prev => ({ ...prev, [field]: !value }));
      showToast('error', 'Failed to update notification.');
    }
  };

  const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`w-11 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${on ? 'bg-[#00A86B]' : 'bg-[#CBD5E1]'}`}
    >
      <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );

  return (
    <AdminLayout>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[200] px-4 py-3 rounded-xl text-white text-[13px] font-bold shadow-lg ${toast.type === 'success' ? 'bg-[#00A86B]' : 'bg-[#EF4444]'}`}>
          {toast.msg}
        </div>
      )}

      <div className="w-full px-4 md:px-8 pt-0 pb-6 space-y-4">

        {/* Back Button */}
        <div className="flex items-center mb-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[13px] font-bold text-[#64748B] hover:text-[#0F172A] transition-colors bg-white px-4 py-2 rounded-xl border border-[#E2E8F0] shadow-sm hover:shadow-md hover:border-[#CBD5E1]"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Users
          </button>
        </div>

        {/* Top Profile Header Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
            <div className="flex items-center gap-5">
              {/* Avatar with logo or initials + upload button */}
              <div className="relative shrink-0">
                <div className="w-[84px] h-[84px] rounded-full bg-gradient-to-br from-[#00A86B] to-[#007A4D] flex items-center justify-center border-4 border-white shadow-md overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[34px] font-bold text-white leading-none select-none">
                      {(userData.name || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) setLogoUrl(URL.createObjectURL(file));
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-white border border-[#E2E8F0] rounded-full flex items-center justify-center shadow-md hover:bg-[#F8FAFC] transition-colors"
                  title="Change profile image"
                >
                  <Camera className="w-3.5 h-3.5 text-[#64748B]" />
                </button>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-[22px] font-bold text-[#0F172A]">{userData.name}</h1>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${isKycVerified ? 'text-[#10B981] border-[#10B981] bg-[#ECFDF5]' : 'text-[#F59E0B] border-[#F59E0B] bg-[#FFFBEB]'}`}>
                    {isKycVerified ? 'KYC Verified' : 'KYC Pending'}
                  </span>
                </div>
                <p className="text-[13px] text-[#64748B]">{userData.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Block/Unblock + KYC toggles — hidden when viewing own profile */}
              {!isOwnProfile && (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-3">
                    <span className={`text-[12px] font-semibold min-w-[90px] ${isActive ? 'text-[#00A86B]' : 'text-[#EF4444]'}`}>
                      {isActive ? 'User Active' : 'User Blocked'}
                    </span>
                    <button
                      onClick={handleToggle}
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${isActive ? 'bg-[#00A86B]' : 'bg-[#EF4444]'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[12px] font-semibold min-w-[90px] ${isKycVerified ? 'text-[#00A86B]' : 'text-[#F59E0B]'}`}>
                      {isKycVerified ? 'KYC Verified' : 'KYC Pending'}
                    </span>
                    <Toggle on={isKycVerified} onClick={handleKycToggle} />
                  </div>
                </div>
              )}

              {/* Wallet balance */}
              <div className="flex items-center gap-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[14px] p-3 shadow-sm min-w-[200px]">
                <div className="w-10 h-10 rounded-full bg-[#E6F5F1] flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-[#00A86B]" />
                </div>
                <div>
                  <p className="text-[18px] font-bold text-[#0F172A] leading-tight">{userData.balance}</p>
                  <p className="text-[11px] font-medium text-[#64748B] mb-0.5">Available balance</p>
                  <p className="text-[11px] font-medium text-[#94A3B8]">Hold: {fmtProfileCurrency(holdAmount)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 pt-5 border-t border-[#E2E8F0]">
            <div>
              <p className="text-[11px] font-semibold text-[#94A3B8] mb-1">Email address:</p>
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-bold text-[#0F172A] truncate w-32" title={userData.email}>{userData.email}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#94A3B8] mb-1">Phone Number:</p>
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-bold text-[#0F172A]">{userData.phone}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#94A3B8] mb-1">User Type:</p>
              <p className="text-[13px] font-bold text-[#0F172A]">{userData.gstin && userData.gstin !== '—' ? 'COMPANY' : 'INDIVIDUAL'}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#94A3B8] mb-1">Company Name:</p>
              <p className="text-[13px] font-bold text-[#0F172A] truncate w-32" title={userData.business}>{userData.business}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#94A3B8] mb-1">Joined:</p>
              <p className="text-[13px] font-bold text-[#0F172A]">{userData.regDate}</p>
            </div>
          </div>
        </div>

        {/* Address + Bank Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-sm">
            <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-[#64748B]" /> Address Details
            </h3>
            <div className="bg-[#F8FAFC] rounded-[12px] p-5 grid grid-cols-2 gap-y-4 gap-x-6">
              <div className="col-span-2">
                <p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Address:</span> <span className="text-[#64748B]">{userData.address}</span></p>
              </div>
              <div><p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">City:</span> <span className="text-[#64748B]">{userData.city}</span></p></div>
              <div><p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Country:</span> <span className="text-[#64748B]">{userData.country}</span></p></div>
              <div><p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">State:</span> <span className="text-[#64748B] uppercase">{userData.state}</span></p></div>
              <div><p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Pincode:</span> <span className="text-[#64748B]">{userData.pincode}</span></p></div>
              <div className="col-span-2"><p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">GSTIN:</span> <span className="text-[#94A3B8]">{userData.gstin}</span></p></div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-sm">
            <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4 text-[#64748B]" /> Bank Details
            </h3>
            <div className="bg-[#F8FAFC] rounded-[12px] p-5 grid grid-cols-2 gap-y-4 gap-x-6">
              <div><p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Bank Name:</span> <span className="text-[#64748B]">{userData.bankName}</span></p></div>
              <div><p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Account Number:</span> <span className="text-[#64748B]">{userData.accountNumber}</span></p></div>
              <div><p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Account Holder:</span> <span className="text-[#64748B]">{userData.beneficiaryName || userData.name}</span></p></div>
              <div><p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">IFSC:</span> <span className="text-[#64748B]">{userData.ifsc}</span></p></div>
              <div className="col-span-2"><p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Branch Name:</span> <span className="text-[#64748B]">{userData.branchName}</span></p></div>
            </div>
          </div>
        </div>

        {/* Aadhar + PAN Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-sm">
            <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2 mb-4">
              <IdCard className="w-4 h-4 text-[#64748B]" /> Aadhar Details
            </h3>
            <div className="bg-[#F8FAFC] rounded-[12px] p-5 grid grid-cols-2 gap-y-4 gap-x-6">
              <div><p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Name:</span> <span className="text-[#64748B]">{userData.aadharName}</span></p></div>
              <div><p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Aadhar Number:</span> <span className="text-[#64748B]">{userData.aadhaar}</span></p></div>
              <div><p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">State:</span> <span className="text-[#64748B]">{userData.aadharState}</span></p></div>
              <div><p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Address:</span> <span className="text-[#64748B]">{userData.aadharAddress}</span></p></div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-sm">
            <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-[#64748B]" /> PAN Details
            </h3>
            <div className="bg-[#F8FAFC] rounded-[12px] p-5 grid grid-cols-2 gap-y-4 gap-x-6">
              <div><p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">PAN Number:</span> <span className="text-[#64748B]">{userData.panNumber}</span></p></div>
              <div><p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Name:</span> <span className="text-[#64748B]">{userData.panName}</span></p></div>
              <div><p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Type:</span> <span className="text-[#64748B]">{userData.panType}</span></p></div>
              <div><p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">PAN Ref ID:</span> <span className="text-[#64748B]">{userData.panRefId}</span></p></div>
            </div>
          </div>
        </div>

        {/* KAM + API Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-sm">
            <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-[#64748B]" /> KAM Details
            </h3>
            <div className="bg-[#F8FAFC] rounded-[12px] p-5 grid grid-cols-2 gap-y-4 gap-x-6">
              <div><p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Name:</span> <span className="text-[#64748B]">{userData.kamName}</span></p></div>
              <div><p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Email:</span> <span className="text-[#64748B]">{userData.kamEmail}</span></p></div>
              <div className="col-span-2"><p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Phone:</span> <span className="text-[#64748B]">{userData.kamPhone}</span></p></div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-sm">
            <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4 text-[#64748B]" /> API Details
            </h3>
            <div className="bg-[#F8FAFC] rounded-[12px] p-5 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-bold text-[#0F172A]">Check latest API documentation</span>
                <button onClick={() => window.open('https://api-docs.shipexindia.com/', '_blank')} className="text-[#00A86B] hover:opacity-80 transition-opacity">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-bold text-[#0F172A]">Download Postman Collection <span className="text-[#10B981] text-[11px]">(Recommended)</span></span>
                <button onClick={() => window.open('https://documenter.getpostman.com/view/32361120/2sB3HetiH6', '_blank')} className="text-[#00A86B] hover:opacity-80 transition-opacity">
                  <Download className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-bold text-[#0F172A]">API Access</span>
                <Toggle on={apiAccess} onClick={handleApiToggle} />
              </div>
              {userData.publicKey && userData.publicKey !== '—' && (
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-bold text-[#0F172A]">Public Key</span>
                  <span className="text-[11px] text-[#64748B] font-mono max-w-[150px] truncate" title={userData.publicKey}>{userData.publicKey}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Details */}
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-sm">
          <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2 mb-5">
            <ShieldCheck className="w-4 h-4 text-[#64748B]" /> System Details
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-5 px-2">
            {[
              { label: 'User ID', value: userData.id },
              { label: 'Registration Date', value: userData.regDate },
              { label: 'Last Login', value: userData.lastLogin },
              {
                label: 'KYC Status',
                value: (
                  <span className={`flex items-center gap-1 ${isKycVerified ? 'text-[#10B981]' : 'text-[#F59E0B]'}`}>
                    {isKycVerified ? 'Verified' : 'Pending'} {isKycVerified && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </span>
                ),
              },
              { label: 'COD Cycle', value: userData.codPlan },
              { label: 'B2C Rate Card Plan', value: userData.rateCard },
              { label: 'B2B Rate Card Plan', value: userData.b2bRateCard },
              { label: 'Credit Limit', value: `₹${userData.creditLimit}` },
              { label: 'Referral Code', value: userData.referralCode },
              { label: 'Referral Commission', value: userData.referralCommission },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="text-[11px] text-[#94A3B8] font-semibold">{label}</span>
                <span className="text-[13px] font-bold text-[#0F172A]">{value}</span>
              </div>
            ))}
          </div>

          {/* Notification toggles */}
          <div className="mt-5 pt-5 border-t border-[#E2E8F0] grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'WhatsApp Notification', field: 'isAdminWhatsAppEnable' },
              { label: 'Email Notification', field: 'isAdminEmailEnable' },
              { label: 'SMS Notification', field: 'isAdminSMSEnable' },
            ].map(({ label, field }) => (
              <div key={field} className="flex justify-between items-center">
                <span className="text-[13px] font-semibold text-[#64748B]">{label}</span>
                <Toggle
                  on={!!(notificationSettings as any)[field]}
                  onClick={() => handleNotificationToggle(field, !(notificationSettings as any)[field])}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Rate Card Management */}
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#64748B]" /> Rate Card Management
            </h3>
            <button
              onClick={() => fetchRates(effectiveId)}
              className="text-[13px] font-bold text-[#00A86B] hover:underline px-3 py-1 rounded-lg border border-[#00A86B] hover:bg-[#ECFDF5] transition-colors"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-[11px]">
              <thead>
                <tr className="bg-[#00A86B] text-white">
                  {['Provider', 'Service', 'Mode', 'Weight', 'Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E', 'COD'].map(h => (
                    <th key={h} className="px-2 py-2 font-bold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rateLoading ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-[#94A3B8] text-[13px]">Loading rate cards…</td>
                  </tr>
                ) : rates.length > 0 ? (
                  rates.map((card: any, i: number) => (
                    <React.Fragment key={i}>
                      <tr className="border-b border-[#F1F5F9] text-[#374151]">
                        <td className="px-2 py-1.5" rowSpan={2}>{card.courierProviderName}</td>
                        <td className="px-2 py-1.5" rowSpan={2}>{card.courierServiceName}</td>
                        <td className="px-2 py-1.5" rowSpan={2}>{card.mode}</td>
                        <td className="px-2 py-1.5 text-[#94A3B8]">Basic: {card.weightPriceBasic?.[0]?.weight}gm</td>
                        <td className="px-2 py-1.5 font-medium">₹{card.weightPriceBasic?.[0]?.zoneA}</td>
                        <td className="px-2 py-1.5 font-medium">₹{card.weightPriceBasic?.[0]?.zoneB}</td>
                        <td className="px-2 py-1.5 font-medium">₹{card.weightPriceBasic?.[0]?.zoneC}</td>
                        <td className="px-2 py-1.5 font-medium">₹{card.weightPriceBasic?.[0]?.zoneD}</td>
                        <td className="px-2 py-1.5 font-medium">₹{card.weightPriceBasic?.[0]?.zoneE}</td>
                        <td className="px-2 py-1.5 font-medium" rowSpan={2}>₹{card.codCharge} / {card.codPercent}%</td>
                      </tr>
                      <tr className="border-b border-[#F1F5F9] text-[#374151]">
                        <td className="px-2 py-1.5 text-[#94A3B8]">Addl: {card.weightPriceAdditional?.[0]?.weight}gm</td>
                        <td className="px-2 py-1.5">₹{card.weightPriceAdditional?.[0]?.zoneA}</td>
                        <td className="px-2 py-1.5">₹{card.weightPriceAdditional?.[0]?.zoneB}</td>
                        <td className="px-2 py-1.5">₹{card.weightPriceAdditional?.[0]?.zoneC}</td>
                        <td className="px-2 py-1.5">₹{card.weightPriceAdditional?.[0]?.zoneD}</td>
                        <td className="px-2 py-1.5">₹{card.weightPriceAdditional?.[0]?.zoneE}</td>
                      </tr>
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="py-10 text-[#94A3B8] text-[13px]">No rate cards found for this user.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
