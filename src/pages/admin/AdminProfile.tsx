import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { 
  MapPin, 
  CreditCard, 
  IdCard, 
  FileText, 
  UserCircle, 
  Settings, 
  ShieldCheck, 
  CheckCircle2, 
  Edit, 
  ExternalLink,
  Info,
  Search,
  ChevronDown,
  ArrowLeft,
  X
} from 'lucide-react';

export function AdminProfile() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialData = location.state?.userData || {
    name: 'Bijay Ketan Bhanja',
    email: 'bhanjabijayketan@gmail.com',
    id: '17643',
    business: 'Shipex',
    regDate: '16 Jun 2025',
    balance: '₹376.49',
    kyc: 'Verified',
    rateCard: 'Bronze',
    aadhaar: '9875 9765 9876',
    accountManager: 'Bijay Ketan Bhanja',
    phone: '9876543120',
    state: 'Odisha'
  };

  const [userData, setUserData] = useState({
    ...initialData,
    address: 'Testing, testing, tested, test for',
    city: 'Baleswar',
    country: 'India',
    pincode: '765432',
    gstin: '---',
    bankName: 'State Bank Of India',
    accountNumber: '5678901234509876',
    ifsc: 'SBIN00005467',
    branchName: 'Jaleswar',
    panNumber: 'FYUN6784N',
    panType: 'Individual',
    panRefId: '123487659',
    kamEmail: 'bijay@gmail.com',
    kamPhone: '98765432109',
    authKey: '12345678',
    passKey: '12345678',
    codCycle: 'D+3',
    b2bRateCard: 'Testing',
    creditLimit: '500',
    referralCommission: '2%'
  });

  const [isActive, setIsActive] = useState(true);
  const [apiAccess, setApiAccess] = useState(true);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  const handleEditClick = (section: string) => {
    setEditingSection(section);
    setEditFormData({ ...userData });
  };

  const handleSave = () => {
    setUserData(editFormData);
    setEditingSection(null);
  };
  
  // Provider States
  const [providers, setProviders] = useState({
    dtdc: false,
    shreeMaruti: true,
    amazonShipping: true,
    delhivery: true,
    boxdLogistics: true,
    ekart: true,
    zipypost: true,
    proship: true
  });

  const toggleProvider = (key: keyof typeof providers) => {
    setProviders(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Notification States
  const [notifications, setNotifications] = useState({
    whatsapp: true,
    email: true,
    sms: true
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderEditFields = () => {
    switch (editingSection) {
      case 'Profile':
        return (
          <>
            <div><label className="text-[11px] font-bold text-[#64748B] mb-1 block">Full Name</label><input type="text" value={editFormData.name || ''} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-[13px] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" /></div>
            <div><label className="text-[11px] font-bold text-[#64748B] mb-1 block">Email</label><input type="text" value={editFormData.email || ''} onChange={e => setEditFormData({...editFormData, email: e.target.value})} className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-[13px] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" /></div>
            <div><label className="text-[11px] font-bold text-[#64748B] mb-1 block">Phone</label><input type="text" value={editFormData.phone || ''} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-[13px] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" /></div>
            <div><label className="text-[11px] font-bold text-[#64748B] mb-1 block">Company Name</label><input type="text" value={editFormData.business || ''} onChange={e => setEditFormData({...editFormData, business: e.target.value})} className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-[13px] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" /></div>
          </>
        );
      case 'Address Details':
        return (
          <>
            <div><label className="text-[11px] font-bold text-[#64748B] mb-1 block">Address</label><input type="text" value={editFormData.address || ''} onChange={e => setEditFormData({...editFormData, address: e.target.value})} className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-[13px] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[11px] font-bold text-[#64748B] mb-1 block">City</label><input type="text" value={editFormData.city || ''} onChange={e => setEditFormData({...editFormData, city: e.target.value})} className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-[13px] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" /></div>
              <div><label className="text-[11px] font-bold text-[#64748B] mb-1 block">State</label><input type="text" value={editFormData.state || ''} onChange={e => setEditFormData({...editFormData, state: e.target.value})} className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-[13px] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[11px] font-bold text-[#64748B] mb-1 block">Country</label><input type="text" value={editFormData.country || ''} onChange={e => setEditFormData({...editFormData, country: e.target.value})} className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-[13px] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" /></div>
              <div><label className="text-[11px] font-bold text-[#64748B] mb-1 block">Pincode</label><input type="text" value={editFormData.pincode || ''} onChange={e => setEditFormData({...editFormData, pincode: e.target.value})} className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-[13px] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" /></div>
            </div>
            <div><label className="text-[11px] font-bold text-[#64748B] mb-1 block">GSTIN</label><input type="text" value={editFormData.gstin || ''} onChange={e => setEditFormData({...editFormData, gstin: e.target.value})} className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-[13px] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" /></div>
          </>
        );
      case 'Bank Details':
        return (
          <>
            <div><label className="text-[11px] font-bold text-[#64748B] mb-1 block">Bank Name</label><input type="text" value={editFormData.bankName || ''} onChange={e => setEditFormData({...editFormData, bankName: e.target.value})} className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-[13px] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" /></div>
            <div><label className="text-[11px] font-bold text-[#64748B] mb-1 block">Account Number</label><input type="text" value={editFormData.accountNumber || ''} onChange={e => setEditFormData({...editFormData, accountNumber: e.target.value})} className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-[13px] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[11px] font-bold text-[#64748B] mb-1 block">IFSC</label><input type="text" value={editFormData.ifsc || ''} onChange={e => setEditFormData({...editFormData, ifsc: e.target.value})} className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-[13px] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" /></div>
              <div><label className="text-[11px] font-bold text-[#64748B] mb-1 block">Branch Name</label><input type="text" value={editFormData.branchName || ''} onChange={e => setEditFormData({...editFormData, branchName: e.target.value})} className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-[13px] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" /></div>
            </div>
          </>
        );
      default:
        return (
          <div>
            <label className="text-[11px] font-bold text-[#64748B] mb-1 block capitalize">{editingSection}</label>
            <input type="text" value={editFormData[editingSection as string] || ''} onChange={e => setEditFormData({...editFormData, [editingSection as string]: e.target.value})} className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-[13px] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" placeholder={`Update ${editingSection}`} />
          </div>
        );
    }
  };

  return (
    <AdminLayout>
      {editingSection && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-[#E2E8F0] shrink-0">
              <h3 className="font-bold text-[#0F172A]">Edit {editingSection}</h3>
              <button onClick={() => setEditingSection(null)} className="text-[#94A3B8] hover:text-[#0F172A]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="space-y-3">
                {renderEditFields()}
              </div>
            </div>
            <div className="p-4 border-t border-[#E2E8F0] flex justify-end gap-3 bg-[#F8FAFC] shrink-0">
              <button onClick={() => setEditingSection(null)} className="px-4 py-2 rounded-xl text-[13px] font-bold text-[#64748B] hover:bg-[#E2E8F0] transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 rounded-xl text-[13px] font-bold text-white bg-[#00A86B] hover:bg-[#009B63] shadow-sm transition-colors">Save Changes</button>
            </div>
          </div>
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
              <img 
                src="https://i.pravatar.cc/150?u=bijay" 
                alt="Profile" 
                className="w-[84px] h-[84px] rounded-full object-cover border-4 border-white shadow-md"
              />
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-[22px] font-bold text-[#0F172A]">{userData.name}</h1>
                  <button onClick={() => handleEditClick('Profile')} className="text-[#94A3B8] hover:text-[#0F172A] transition-colors"><Edit className="w-4 h-4" /></button>
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold text-[#10B981] border border-[#10B981] bg-[#ECFDF5]">
                    New Customer
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-semibold text-[#64748B]">Active</span>
                <button 
                  onClick={() => setIsActive(!isActive)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${isActive ? 'bg-[#00A86B]' : 'bg-[#CBD5E1]'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center gap-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[14px] p-3 shadow-sm min-w-[200px]">
                <div className="w-10 h-10 rounded-full bg-[#E6F5F1] flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-[#00A86B]" />
                </div>
                <div>
                  <p className="text-[18px] font-bold text-[#0F172A] leading-tight">{userData.balance}</p>
                  <p className="text-[11px] font-medium text-[#64748B] mb-0.5">Available balance</p>
                  <p className="text-[11px] font-medium text-[#94A3B8]">Hold: ₹1.49</p>
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
              <p className="text-[13px] font-bold text-[#0F172A]">Individual</p>
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

        {/* Details Grid 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Address Details */}
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#64748B]" /> Address Details
              </h3>
              <button onClick={() => handleEditClick('Address Details')} className="text-[#94A3B8] hover:text-[#0F172A] transition-colors"><Edit className="w-4 h-4" /></button>
            </div>
            <div className="bg-[#F8FAFC] rounded-[12px] p-5 grid grid-cols-2 gap-y-4 gap-x-6">
              <div className="col-span-2">
                <p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Address:</span> <span className="text-[#64748B]">{userData.address}</span></p>
              </div>
              <div>
                <p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">City:</span> <span className="text-[#64748B]">{userData.city}</span></p>
              </div>
              <div>
                <p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Country:</span> <span className="text-[#64748B]">{userData.country}</span></p>
              </div>
              <div>
                <p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">State:</span> <span className="text-[#64748B] uppercase">{userData.state}</span></p>
              </div>
              <div>
                <p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Pincode:</span> <span className="text-[#64748B]">{userData.pincode}</span></p>
              </div>
              <div>
                <p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">GSTIN:</span> <span className="text-[#94A3B8]">{userData.gstin}</span></p>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#64748B]" /> Bank Details
              </h3>
              <button onClick={() => handleEditClick('Bank Details')} className="text-[#94A3B8] hover:text-[#0F172A] transition-colors"><Edit className="w-4 h-4" /></button>
            </div>
            <div className="bg-[#F8FAFC] rounded-[12px] p-5 grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Bank Name:</span> <span className="text-[#64748B]">{userData.bankName}</span></p>
              </div>
              <div>
                <p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Account Number:</span> <span className="text-[#64748B]">{userData.accountNumber}</span></p>
              </div>
              <div>
                <p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Account Holder:</span> <span className="text-[#64748B]">{userData.name}</span></p>
              </div>
              <div>
                <p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">IFSC:</span> <span className="text-[#64748B]">{userData.ifsc}</span></p>
              </div>
              <div className="col-span-2">
                <p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Branch Name:</span> <span className="text-[#64748B]">{userData.branchName}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Aadhar Details */}
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2">
                <IdCard className="w-4 h-4 text-[#64748B]" /> Aadhar Details
              </h3>
              <button onClick={() => handleEditClick('Aadhar Details')} className="text-[#94A3B8] hover:text-[#0F172A] transition-colors"><Edit className="w-4 h-4" /></button>
            </div>
            <div className="bg-[#F8FAFC] rounded-[12px] p-5 grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Name:</span> <span className="text-[#64748B]">{userData.name}</span></p>
              </div>
              <div>
                <p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Aadhar Number:</span> <span className="text-[#64748B]">{userData.aadhaar}</span></p>
              </div>
              <div>
                <p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">State:</span> <span className="text-[#64748B]">{userData.state}</span></p>
              </div>
              <div>
                <p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Address:</span> <span className="text-[#64748B]">{userData.address}</span></p>
              </div>
            </div>
          </div>

          {/* PAN Details */}
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#64748B]" /> PAN Details
              </h3>
              <button onClick={() => handleEditClick('PAN Details')} className="text-[#94A3B8] hover:text-[#0F172A] transition-colors"><Edit className="w-4 h-4" /></button>
            </div>
            <div className="bg-[#F8FAFC] rounded-[12px] p-5 grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">PAN Number:</span> <span className="text-[#64748B]">{userData.panNumber}</span></p>
              </div>
              <div>
                <p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Name:</span> <span className="text-[#64748B]">{userData.name}</span></p>
              </div>
              <div>
                <p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Type:</span> <span className="text-[#64748B]">{userData.panType}</span></p>
              </div>
              <div>
                <p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">PAN Ref ID:</span> <span className="text-[#64748B]">{userData.panRefId}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top KAM Details */}
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#64748B]" /> KAM Details
              </h3>
              <button onClick={() => handleEditClick('KAM Details')} className="text-[#94A3B8] hover:text-[#0F172A] transition-colors"><Edit className="w-4 h-4" /></button>
            </div>
            <div className="bg-[#F8FAFC] rounded-[12px] p-5 grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Name:</span> <span className="text-[#64748B]">{userData.accountManager}</span></p>
              </div>
              <div>
                <p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Email:</span> <span className="text-[#64748B]">{userData.kamEmail}</span></p>
              </div>
              <div className="col-span-2">
                <p className="text-[13px] leading-relaxed"><span className="font-bold text-[#0F172A]">Phone:</span> <span className="text-[#64748B]">{userData.kamPhone}</span></p>
              </div>
            </div>
          </div>

          {/* API Details */}
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#64748B]" /> API Details
              </h3>
              <button onClick={() => handleEditClick('API Details')} className="text-[#94A3B8] hover:text-[#0F172A] transition-colors"><Edit className="w-4 h-4" /></button>
            </div>
            <div className="bg-[#F8FAFC] rounded-[12px] p-5 flex flex-col gap-5 h-[104px] justify-center">
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-bold text-[#0F172A]">Check latest version of API documentation</span>
                <button className="text-[#00A86B] hover:opacity-80 transition-opacity"><ExternalLink className="w-4 h-4" /></button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-bold text-[#0F172A]">API Access</span>
                <button 
                  onClick={() => setApiAccess(!apiAccess)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${apiAccess ? 'bg-[#00A86B]' : 'bg-[#CBD5E1]'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute transition-transform ${apiAccess ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid 4 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bottom KAM Details (System Details) */}
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#64748B]" /> System Details
              </h3>
              <button onClick={() => handleEditClick('System Details')} className="text-[#94A3B8] hover:text-[#0F172A] transition-colors"><Edit className="w-4 h-4" /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 px-2">
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#64748B]">User ID</span>
                <span className="text-[13px] font-bold text-[#0F172A]">{userData.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#64748B]">Registration Date</span>
                <span className="text-[13px] font-bold text-[#0F172A]">{userData.regDate}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#64748B]">Last Login</span>
                <span className="text-[13px] font-bold text-[#0F172A]">23 Apr 2026, 07:34 pm</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#64748B]">KYC Status</span>
                <span className="text-[13px] font-bold text-[#10B981] flex items-center gap-1">{userData.kyc} {userData.kyc === 'Verified' && <CheckCircle2 className="w-3.5 h-3.5" />}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#64748B]">COD Cycle</span>
                <span className="text-[13px] font-bold text-[#0F172A] flex items-center gap-1 cursor-pointer hover:text-[#00A86B]" onClick={() => handleEditClick('codCycle')}>{userData.codCycle} <Edit className="w-3.5 h-3.5 text-[#00A86B]" /></span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#64748B]">Change Password</span>
                <span className="text-[13px] font-bold text-[#0F172A] flex items-center gap-1 cursor-pointer hover:text-[#00A86B]" onClick={() => handleEditClick('Password')}>Change <Settings className="w-3.5 h-3.5 text-[#00A86B]" /></span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#64748B]">B2C Rate Card Plan Name</span>
                <span className="text-[13px] font-bold text-[#0F172A] flex items-center gap-1 cursor-pointer hover:text-[#00A86B]" onClick={() => handleEditClick('rateCard')}>{userData.rateCard} <Edit className="w-3.5 h-3.5 text-[#00A86B]" /></span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#64748B]">B2B Rate Card Plan Name</span>
                <span className="text-[13px] font-bold text-[#0F172A] flex items-center gap-1 cursor-pointer hover:text-[#00A86B]" onClick={() => handleEditClick('b2bRateCard')}>{userData.b2bRateCard} <Edit className="w-3.5 h-3.5 text-[#00A86B]" /></span>
              </div>

              <div className="flex justify-between items-center mt-2">
                <span className="text-[13px] text-[#64748B]">Referral Code</span>
                <span className="text-[13px] font-bold text-[#0F172A]">{userData.id}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[13px] text-[#64748B]">WhatsApp Notification</span>
                <button 
                  onClick={() => toggleNotification('whatsapp')}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${notifications.whatsapp ? 'bg-[#00A86B]' : 'bg-[#CBD5E1]'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute transition-transform ${notifications.whatsapp ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#64748B]">Referral Commission</span>
                <span className="text-[13px] font-bold text-[#0F172A] flex items-center gap-1 cursor-pointer hover:text-[#00A86B]" onClick={() => handleEditClick('referralCommission')}>{userData.referralCommission} <Edit className="w-3.5 h-3.5 text-[#00A86B]" /></span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#64748B]">Email Notification</span>
                <button 
                  onClick={() => toggleNotification('email')}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${notifications.email ? 'bg-[#00A86B]' : 'bg-[#CBD5E1]'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute transition-transform ${notifications.email ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#64748B]">Credit Limit</span>
                <span className="text-[13px] font-bold text-[#0F172A] flex items-center gap-1 cursor-pointer hover:text-[#00A86B]" onClick={() => handleEditClick('creditLimit')}>{userData.creditLimit} <Edit className="w-3.5 h-3.5 text-[#00A86B]" /></span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#64748B]">SMS Notification</span>
                <button 
                  onClick={() => toggleNotification('sms')}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${notifications.sms ? 'bg-[#00A86B]' : 'bg-[#CBD5E1]'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute transition-transform ${notifications.sms ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Provider Control */}
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2">
                <Info className="w-4 h-4 text-[#64748B]" /> Provider Control
              </h3>
              <button onClick={() => handleEditClick('Provider Control')} className="text-[#94A3B8] hover:text-[#0F172A] transition-colors"><Edit className="w-4 h-4" /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-5 px-2 flex-1">
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-bold text-[#0F172A]">Dtdc <span className="text-[#94A3B8] font-medium ml-1">(8 Total Services)</span></span>
                <button onClick={() => toggleProvider('dtdc')} className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${providers.dtdc ? 'bg-[#00A86B]' : 'bg-[#E2E8F0]'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute transition-transform ${providers.dtdc ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-bold text-[#0F172A]">Shree Maruti <span className="text-[#94A3B8] font-medium ml-1">(4 Total Services)</span></span>
                <button onClick={() => toggleProvider('shreeMaruti')} className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${providers.shreeMaruti ? 'bg-[#00A86B]' : 'bg-[#E2E8F0]'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute transition-transform ${providers.shreeMaruti ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[13px] font-bold text-[#0F172A]">Amazon Shipping <span className="text-[#94A3B8] font-medium ml-1">(6 Total Services)</span></span>
                <button onClick={() => toggleProvider('amazonShipping')} className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${providers.amazonShipping ? 'bg-[#00A86B]' : 'bg-[#E2E8F0]'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute transition-transform ${providers.amazonShipping ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-bold text-[#0F172A]">Delhivery <span className="text-[#94A3B8] font-medium ml-1">(9 Total Services)</span></span>
                <button onClick={() => toggleProvider('delhivery')} className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${providers.delhivery ? 'bg-[#00A86B]' : 'bg-[#E2E8F0]'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute transition-transform ${providers.delhivery ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[13px] font-bold text-[#0F172A]">BoxdLogistics <span className="text-[#94A3B8] font-medium ml-1">(3 Total Services)</span></span>
                <button onClick={() => toggleProvider('boxdLogistics')} className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${providers.boxdLogistics ? 'bg-[#00A86B]' : 'bg-[#E2E8F0]'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute transition-transform ${providers.boxdLogistics ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-bold text-[#0F172A]">Ekart <span className="text-[#94A3B8] font-medium ml-1">(6 Total Services)</span></span>
                <button onClick={() => toggleProvider('ekart')} className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${providers.ekart ? 'bg-[#00A86B]' : 'bg-[#E2E8F0]'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute transition-transform ${providers.ekart ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[13px] font-bold text-[#0F172A]">Zipypost <span className="text-[#94A3B8] font-medium ml-1">(2 Total Services)</span></span>
                <button onClick={() => toggleProvider('zipypost')} className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${providers.zipypost ? 'bg-[#00A86B]' : 'bg-[#E2E8F0]'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute transition-transform ${providers.zipypost ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-bold text-[#0F172A]">Proship <span className="text-[#94A3B8] font-medium ml-1">(5 Total Services)</span></span>
                <button onClick={() => toggleProvider('proship')} className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${providers.proship ? 'bg-[#00A86B]' : 'bg-[#E2E8F0]'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute transition-transform ${providers.proship ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>

            {/* Warning Banner */}
            <div className="mt-6 bg-[#FFFBEB] border border-[#FEF08A] rounded-xl p-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-[#F59E0B] shrink-0" />
              <span className="text-[13px] font-bold text-[#92400E]">DTDC Is Disabled By Default For All New Users.</span>
            </div>
          </div>
        </div>

        {/* Service Performance & Rate */}
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-[#64748B]" /> Service Performance & Rate
            </h3>
            
            <label className="block text-[13px] font-bold text-[#475569] mb-2">Select Service</label>
            <div className="relative">
              <select className="w-full h-[46px] pl-4 pr-10 rounded-xl border border-[#E2E8F0] text-[13px] bg-white focus:outline-none focus:ring-1 focus:ring-[#00A86B] focus:border-[#00A86B] appearance-none text-[#64748B] shadow-sm">
                <option value="">Select a Courier Service</option>
                <option value="dtdc">DTDC</option>
                <option value="delhivery">Delhivery</option>
                <option value="ekart">Ekart</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
            </div>
          </div>

          <div className="border border-dashed border-[#CBD5E1] rounded-[16px] h-[200px] flex flex-col items-center justify-center bg-[#F8FAFC]/50 text-[#64748B]">
            <Search className="w-6 h-6 mb-3 text-[#94A3B8]" />
            <p className="text-[14px] font-semibold">Select a service to manage its rates</p>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
