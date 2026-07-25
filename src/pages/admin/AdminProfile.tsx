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
  LayoutGrid,
  Landmark,
  Bell,
  Code2,
  Mail,
  Phone,
  Building2,
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

// ─── Type scale — only these four are allowed anywhere on this page ──────────
// 14px semibold : section/card titles
// 12px semibold : field labels, tags, table headers
// 12px regular  : field values, body content
// 10px semibold : small badges/meta text
const TXT = {
  title: 'text-[14px] font-semibold',
  label: 'text-[12px] font-semibold',
  value: 'text-[12px] font-normal',
  meta: 'text-[10px] font-semibold',
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className={`${TXT.label} text-[#94A3B8]`}>{label}</span>
      <span className={`${TXT.value} text-[#1E293B] break-words`}>{value}</span>
    </div>
  );
}

function SectionCard({ icon: Icon, title, children, action }: { icon: any; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`${TXT.title} text-[#0F172A] flex items-center gap-2`}>
          <Icon className="w-4 h-4 text-[#64748B]" /> {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'kyc', label: 'KYC & Documents', icon: IdCard },
  { id: 'bank', label: 'Bank & Payout', icon: Landmark },
  { id: 'rates', label: 'Rate Cards', icon: CreditCard },
  { id: 'api', label: 'API & Notifications', icon: Settings },
] as const;

type TabId = typeof TABS[number]['id'];

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

  const [activeTab, setActiveTab] = useState<TabId>('overview');

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
          id: String(fresh.userId || fresh._id || prev.id),
          regDate: fmtProfileDate(fresh.createdAt) || prev.regDate,
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
      className={`w-9 h-5 rounded-full transition-colors relative flex items-center shrink-0 ${on ? 'bg-[#00A86B]' : 'bg-[#CBD5E1]'}`}
    >
      <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute transition-transform ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  );

  const isCompany = userData.gstin && userData.gstin !== '—';

  return (
    <AdminLayout>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[200] px-4 py-2.5 rounded-lg text-white ${TXT.label} shadow-lg ${toast.type === 'success' ? 'bg-[#00A86B]' : 'bg-[#EF4444]'}`}>
          {toast.msg}
        </div>
      )}

      <div className="w-full px-4 md:px-8 pt-0 pb-4 h-[calc(100vh-32px)] md:h-[calc(100vh-48px)] flex flex-col min-h-0">

        {/* Back Button */}
        <div className="flex items-center mb-4 shrink-0">
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center gap-2 ${TXT.label} text-[#64748B] hover:text-[#0F172A] transition-colors bg-white px-3.5 py-2 rounded-lg border border-[#E2E8F0] hover:border-[#CBD5E1]`}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Users
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 items-start flex-1 min-h-0">

          {/* ── Left Sidebar — profile summary, stays visible ── */}
          <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 lg:sticky lg:top-0 flex flex-col gap-5 lg:max-h-full lg:overflow-y-auto no-scrollbar">
            {/* Avatar + name */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00A86B] to-[#007A4D] flex items-center justify-center border-4 border-white shadow-sm overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[24px] font-semibold text-white leading-none select-none">
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
                  className="absolute bottom-0 right-0 w-6 h-6 bg-white border border-[#E2E8F0] rounded-full flex items-center justify-center shadow-sm hover:bg-[#F8FAFC] transition-colors"
                  title="Change profile image"
                >
                  <Camera className="w-3 h-3 text-[#64748B]" />
                </button>
              </div>
              <div>
                <h1 className={`${TXT.title} text-[#0F172A]`}>{userData.name}</h1>
                <p className={`${TXT.value} text-[#64748B] mt-0.5`}>{userData.email}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                <span className={`px-2 py-0.5 rounded-full ${TXT.meta} border ${isActive ? 'text-[#00A86B] border-[#A7F3D0] bg-[#ECFDF5]' : 'text-[#EF4444] border-[#FECACA] bg-[#FEF2F2]'}`}>
                  {isActive ? 'ACTIVE' : 'BLOCKED'}
                </span>
                <span className={`px-2 py-0.5 rounded-full ${TXT.meta} border ${isKycVerified ? 'text-[#10B981] border-[#A7F3D0] bg-[#ECFDF5]' : 'text-[#F59E0B] border-[#FDE68A] bg-[#FFFBEB]'}`}>
                  {isKycVerified ? 'KYC VERIFIED' : 'KYC PENDING'}
                </span>
                <span className={`px-2 py-0.5 rounded-full ${TXT.meta} border border-[#E2E8F0] text-[#64748B] bg-[#F8FAFC]`}>
                  {isCompany ? 'BUSINESS' : 'INDIVIDUAL'}
                </span>
              </div>
            </div>

            <div className="h-px bg-[#E2E8F0]" />

            {/* Contact */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <Mail className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                <span className={`${TXT.value} text-[#1E293B] truncate`} title={userData.email}>{userData.email}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 ml-auto" />
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                <span className={`${TXT.value} text-[#1E293B]`}>{userData.phone}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 ml-auto" />
              </div>
              <div className="flex items-center gap-2.5">
                <Building2 className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                <span className={`${TXT.value} text-[#1E293B] truncate`} title={userData.business}>{userData.business}</span>
              </div>
            </div>

            <div className="h-px bg-[#E2E8F0]" />

            {/* Wallet balance */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] p-3.5">
              <p className={`${TXT.label} text-[#94A3B8] mb-1`}>Available balance</p>
              <p className={`text-[14px] font-semibold text-[#0F172A] leading-tight`}>{userData.balance}</p>
              <p className={`${TXT.value} text-[#94A3B8] mt-1`}>Hold: {fmtProfileCurrency(holdAmount)}</p>
            </div>

            <div className="h-px bg-[#E2E8F0]" />

            {/* Quick toggles */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className={`${TXT.label} text-[#475569]`}>Account Active</span>
                <Toggle on={isActive} onClick={handleToggle} />
              </div>
              <div className="flex items-center justify-between">
                <span className={`${TXT.label} text-[#475569]`}>KYC Verified</span>
                <Toggle on={isKycVerified} onClick={handleKycToggle} />
              </div>
            </div>

            <div className="h-px bg-[#E2E8F0]" />

            <Field label="Joined" value={userData.regDate} />
          </div>

          {/* ── Right Content — tabs ── */}
          <div className="flex flex-col gap-4 min-w-0 h-full min-h-0">
            {/* Tab bar — fixed, never scrolls */}
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] ${TXT.label} whitespace-nowrap transition-colors ${
                      active ? 'bg-[#ECFDF5] text-[#00A86B]' : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" /> {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content — only this area scrolls */}
            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pr-0.5">

            {/* ── Overview ── */}
            {activeTab === 'overview' && (
              <div className="flex flex-col gap-4">
                <SectionCard icon={LayoutGrid} title="Account Summary">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
                    <Field label="User ID" value={userData.id} />
                    <Field label="Registration Date" value={userData.regDate} />
                    <Field label="Last Login" value={userData.lastLogin} />
                    <Field
                      label="KYC Status"
                      value={
                        <span className={`flex items-center gap-1 ${isKycVerified ? 'text-[#10B981]' : 'text-[#F59E0B]'}`}>
                          {isKycVerified ? 'Verified' : 'Pending'} {isKycVerified && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </span>
                      }
                    />
                    <Field label="COD Cycle" value={userData.codPlan} />
                    <Field label="B2C Rate Card Plan" value={userData.rateCard} />
                    <Field label="B2B Rate Card Plan" value={userData.b2bRateCard} />
                    <Field label="Credit Limit" value={`₹${userData.creditLimit}`} />
                    <Field label="Referral Code" value={userData.referralCode} />
                    <Field label="Referral Commission" value={userData.referralCommission} />
                    <Field label="Total Orders" value={String(userData.orderCount)} />
                  </div>
                </SectionCard>

                <SectionCard icon={MapPin} title="Address Details">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                    <div className="col-span-2 md:col-span-3"><Field label="Address" value={userData.address} /></div>
                    <Field label="City" value={userData.city} />
                    <Field label="State" value={<span className="uppercase">{userData.state}</span>} />
                    <Field label="Pincode" value={userData.pincode} />
                    <Field label="Country" value={userData.country} />
                    <Field label="GSTIN" value={userData.gstin} />
                  </div>
                </SectionCard>

                <SectionCard icon={ShieldCheck} title="KAM Details">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                    <Field label="Name" value={userData.kamName} />
                    <Field label="Email" value={userData.kamEmail} />
                    <Field label="Phone" value={userData.kamPhone} />
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ── KYC & Documents ── */}
            {activeTab === 'kyc' && (
              <div className="flex flex-col gap-4">
                <SectionCard icon={IdCard} title="Aadhar Details">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <Field label="Name" value={userData.aadharName} />
                    <Field label="Aadhar Number" value={userData.aadhaar} />
                    <Field label="State" value={userData.aadharState} />
                    <Field label="Address" value={userData.aadharAddress} />
                  </div>
                </SectionCard>

                <SectionCard icon={FileText} title="PAN Details">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <Field label="PAN Number" value={userData.panNumber} />
                    <Field label="Name" value={userData.panName} />
                    <Field label="Type" value={userData.panType} />
                    <Field label="PAN Ref ID" value={userData.panRefId} />
                  </div>
                </SectionCard>

                <SectionCard icon={Building2} title="GST Details">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <Field label="GSTIN" value={userData.gstin} />
                    <Field label="Company Name" value={userData.business} />
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ── Bank & Payout ── */}
            {activeTab === 'bank' && (
              <SectionCard icon={Landmark} title="Bank Details">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <Field label="Bank Name" value={userData.bankName} />
                  <Field label="Account Number" value={userData.accountNumber} />
                  <Field label="Account Holder" value={userData.beneficiaryName || userData.name} />
                  <Field label="IFSC" value={userData.ifsc} />
                  <div className="col-span-2"><Field label="Branch Name" value={userData.branchName} /></div>
                </div>
              </SectionCard>
            )}

            {/* ── Rate Cards ── */}
            {activeTab === 'rates' && (
              <SectionCard
                icon={CreditCard}
                title="Rate Card Management"
                action={
                  <button
                    onClick={() => fetchRates(effectiveId)}
                    className={`${TXT.label} text-[#00A86B] px-3 py-1.5 rounded-lg border border-[#00A86B] hover:bg-[#ECFDF5] transition-colors`}
                  >
                    Refresh
                  </button>
                }
              >
                <div className="overflow-x-auto border border-[#E2E8F0] rounded-[10px]">
                  <table className="w-full text-center border-collapse">
                    <thead>
                      <tr className="bg-[#E6F9F2] border-b border-[#E2E8F0]">
                        {['Provider', 'Service', 'Mode', 'Weight', 'Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E', 'COD'].map(h => (
                          <th key={h} className={`px-3 py-2.5 ${TXT.label} text-[#64748B] whitespace-nowrap`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rateLoading ? (
                        <tr>
                          <td colSpan={10} className={`py-10 text-[#94A3B8] ${TXT.value}`}>Loading rate cards…</td>
                        </tr>
                      ) : rates.length > 0 ? (
                        rates.map((card: any, i: number) => (
                          <React.Fragment key={i}>
                            <tr className="border-b border-[#F1F5F9] text-[#374151]">
                              <td className={`px-3 py-2 ${TXT.value}`} rowSpan={2}>{card.courierProviderName}</td>
                              <td className={`px-3 py-2 ${TXT.value}`} rowSpan={2}>{card.courierServiceName}</td>
                              <td className={`px-3 py-2 ${TXT.value}`} rowSpan={2}>{card.mode}</td>
                              <td className={`px-3 py-2 ${TXT.value} text-[#94A3B8]`}>Basic: {card.weightPriceBasic?.[0]?.weight}gm</td>
                              <td className={`px-3 py-2 ${TXT.value}`}>₹{card.weightPriceBasic?.[0]?.zoneA}</td>
                              <td className={`px-3 py-2 ${TXT.value}`}>₹{card.weightPriceBasic?.[0]?.zoneB}</td>
                              <td className={`px-3 py-2 ${TXT.value}`}>₹{card.weightPriceBasic?.[0]?.zoneC}</td>
                              <td className={`px-3 py-2 ${TXT.value}`}>₹{card.weightPriceBasic?.[0]?.zoneD}</td>
                              <td className={`px-3 py-2 ${TXT.value}`}>₹{card.weightPriceBasic?.[0]?.zoneE}</td>
                              <td className={`px-3 py-2 ${TXT.value}`} rowSpan={2}>₹{card.codCharge} / {card.codPercent}%</td>
                            </tr>
                            <tr className="border-b border-[#F1F5F9] text-[#374151]">
                              <td className={`px-3 py-2 ${TXT.value} text-[#94A3B8]`}>Addl: {card.weightPriceAdditional?.[0]?.weight}gm</td>
                              <td className={`px-3 py-2 ${TXT.value}`}>₹{card.weightPriceAdditional?.[0]?.zoneA}</td>
                              <td className={`px-3 py-2 ${TXT.value}`}>₹{card.weightPriceAdditional?.[0]?.zoneB}</td>
                              <td className={`px-3 py-2 ${TXT.value}`}>₹{card.weightPriceAdditional?.[0]?.zoneC}</td>
                              <td className={`px-3 py-2 ${TXT.value}`}>₹{card.weightPriceAdditional?.[0]?.zoneD}</td>
                              <td className={`px-3 py-2 ${TXT.value}`}>₹{card.weightPriceAdditional?.[0]?.zoneE}</td>
                            </tr>
                          </React.Fragment>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={10} className={`py-10 text-[#94A3B8] ${TXT.value}`}>No rate cards found for this user.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            )}

            {/* ── API & Notifications ── */}
            {activeTab === 'api' && (
              <div className="flex flex-col gap-4">
                <SectionCard icon={Code2} title="API Access">
                  <div className="flex flex-col gap-3.5">
                    <div className="flex justify-between items-center">
                      <span className={`${TXT.value} text-[#1E293B]`}>Check latest API documentation</span>
                      <button onClick={() => window.open('https://api-docs.shipexindia.com/', '_blank')} className="text-[#00A86B] hover:opacity-80 transition-opacity">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`${TXT.value} text-[#1E293B]`}>Download Postman Collection <span className={`${TXT.meta} text-[#10B981]`}>(Recommended)</span></span>
                      <button onClick={() => window.open('https://documenter.getpostman.com/view/32361120/2sB3HetiH6', '_blank')} className="text-[#00A86B] hover:opacity-80 transition-opacity">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`${TXT.value} text-[#1E293B]`}>API Access</span>
                      <Toggle on={apiAccess} onClick={handleApiToggle} />
                    </div>
                    {userData.publicKey && userData.publicKey !== '—' && (
                      <div className="flex justify-between items-center">
                        <span className={`${TXT.value} text-[#1E293B]`}>Public Key</span>
                        <span className={`${TXT.value} text-[#64748B] font-mono max-w-[180px] truncate`} title={userData.publicKey}>{userData.publicKey}</span>
                      </div>
                    )}
                  </div>
                </SectionCard>

                <SectionCard icon={Bell} title="Notification Preferences">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: 'WhatsApp Notification', field: 'isAdminWhatsAppEnable' },
                      { label: 'Email Notification', field: 'isAdminEmailEnable' },
                      { label: 'SMS Notification', field: 'isAdminSMSEnable' },
                    ].map(({ label, field }) => (
                      <div key={field} className="flex justify-between items-center">
                        <span className={`${TXT.value} text-[#475569]`}>{label}</span>
                        <Toggle
                          on={!!(notificationSettings as any)[field]}
                          onClick={() => handleNotificationToggle(field, !(notificationSettings as any)[field])}
                        />
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
