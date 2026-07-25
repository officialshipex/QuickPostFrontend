import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import {
  ArrowLeft, Upload, Trash2, Plus, Minus, ChevronDown, Loader2,
  PackagePlus, X
} from 'lucide-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { useAdminTab } from '../../context/AdminUserContext';
import { BulkUploadModal } from '../../components/ui/BulkUploadModal';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  hsn: string;
  unitPrice: number;
  qty: number;
  category: string;
  sku: string;
  discount: number | string;
  tax: number | string;
}

interface PickupAddress {
  _id: string;
  pickupAddress: {
    contactName: string;
    email?: string;
    phoneNumber?: string;
    address: string;
    city: string;
    state: string;
    pinCode: string;
  };
}

interface B2BPackage {
  id: string;
  noOfBox: number | string;
  weightPerBox: number | string;
  length: number | string;
  width: number | string;
  height: number | string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function AdminAddOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAdmin, adminTab } = useAdminTab();
  const isAdminView = isAdmin && adminTab;
  const cloneId = searchParams.get('cloneId');
  const updateId = searchParams.get('updateId');
  const isUpdate = !!updateId;

  // ── Pickup ──
  const [pickupAddresses, setPickupAddresses] = useState<PickupAddress[]>([]);
  const [selectedPickupId, setSelectedPickupId] = useState('');
  const [pickupRefresh, setPickupRefresh] = useState(false);
  const [prefillPickup, setPrefillPickup] = useState<any>(null);

  // ── Add Pickup Modal ──
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [pickupForm, setPickupForm] = useState({
    contactName: '', email: '', phoneNumber: '',
    address: '', pinCode: '', city: '', state: '',
  });
  const [pickupFormErrors, setPickupFormErrors] = useState<Record<string, string>>({});
  const [pickupPincodeLoading, setPickupPincodeLoading] = useState(false);
  const [pickupSubmitting, setPickupSubmitting] = useState(false);

  // ── Receiver ──
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [city, setCity] = useState('');
  const [cityState, setCityState] = useState('');
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [billingSame, setBillingSame] = useState(true);

  // ── Products ──
  const [products, setProducts] = useState<Product[]>([
    { id: '1', name: '', hsn: '', unitPrice: 0, qty: 1, category: '', sku: '', discount: '', tax: '' },
  ]);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // ── Package ──
  const [orderType, setOrderType] = useState('B2C');
  const [rovType, setRovType] = useState('ROV Owner');
  // B2C
  const [deadWeight, setDeadWeight] = useState<number | string>('');
  const [length, setLength] = useState<number | string>('');
  const [width, setWidth] = useState<number | string>('');
  const [height, setHeight] = useState<number | string>('');
  // B2B
  const [b2bPackages, setB2bPackages] = useState<B2BPackage[]>([
    { id: '1', noOfBox: '', weightPerBox: '', length: '', width: '', height: '' },
  ]);

  // ── Payment ──
  const [paymentMode, setPaymentMode] = useState('');
  const [shippingCharges, setShippingCharges] = useState<number | string>('');
  const [giftWrap, setGiftWrap] = useState<number | string>('');
  const [transactionFee, setTransactionFee] = useState<number | string>('');
  const [discounts, setDiscounts] = useState<number | string>('');
  const [showExtraFees, setShowExtraFees] = useState(false);

  // ── Other Details ──
  const [customOrderNumber, setCustomOrderNumber] = useState('');
  const [resellerName, setResellerName] = useState('');
  const [gstin, setGstin] = useState('');
  const [ewaybill, setEwaybill] = useState('');
  const [notes, setNotes] = useState('');

  // ── Bulk Upload ──
  const [showBulkModal, setShowBulkModal] = useState(false);

  // ── UI State ──
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingPrefill, setLoadingPrefill] = useState(false);

  // ── Computations ──
  const subTotal = products.reduce((sum, p) => sum + p.unitPrice * p.qty, 0);
  const extraFees =
    Number(shippingCharges || 0) + Number(giftWrap || 0) + Number(transactionFee || 0) - Number(discounts || 0);
  const totalOrderValue = subTotal + extraFees;

  // B2C weight
  const l = Number(length) || 0;
  const w = Number(width) || 0;
  const h = Number(height) || 0;
  const volWeight = l && w && h ? (l * w * h) / 5000 : 0;
  const dWeight = Number(deadWeight) || 0;
  const applicableWeight = Math.max(dWeight, volWeight, 0.5);

  // B2B weight
  const b2bTotalDead = b2bPackages.reduce(
    (sum, pkg) => sum + Number(pkg.weightPerBox || 0) * Number(pkg.noOfBox || 0), 0
  );
  const b2bTotalVol = b2bPackages.reduce(
    (sum, pkg) =>
      sum +
      ((Number(pkg.length || 0) * Number(pkg.width || 0) * Number(pkg.height || 0)) / 5000) *
        Number(pkg.noOfBox || 0),
    0
  );
  const b2bApplicable = Math.max(b2bTotalDead, b2bTotalVol, 0.5);

  // ── Fetch pickup addresses ──
  useEffect(() => {
    apiClient
      .get('/order/pickupAddress')
      .then(res => {
        const list: PickupAddress[] =
          res.data?.data || res.data?.addresses || (Array.isArray(res.data) ? res.data : []);
        setPickupAddresses(list);
        if (list.length > 0 && !selectedPickupId) setSelectedPickupId(list[0]._id);
      })
      .catch(() => {});
  }, [pickupRefresh]);

  // ── Prefill for clone / update ──
  useEffect(() => {
    const prefillId = cloneId || updateId;
    if (!prefillId) return;
    setLoadingPrefill(true);
    apiClient
      .get(`/order/getOrderById/${prefillId}`)
      .then(res => {
        const order = res.data?.order || res.data?.data || res.data;
        if (!order) return;

        if (order.pickupAddress) setPrefillPickup(order.pickupAddress);

        const r = order.receiverAddress || order.deliveryAddress || {};
        setContactName(r.contactName || '');
        setEmail(r.email || '');
        setPhoneNumber(r.phoneNumber || '');
        setAddress(r.address || '');
        setPinCode(r.pinCode || '');
        setCity(r.city || '');
        setCityState(r.state || '');

        if (Array.isArray(order.productDetails) && order.productDetails.length > 0) {
          setProducts(
            order.productDetails.map((p: any, i: number) => ({
              id: String(i + 1),
              name: p.name || '',
              hsn: p.hsn || '',
              unitPrice: Number(p.unitPrice) || 0,
              qty: Number(p.quantity) || 1,
              category: p.category || '',
              sku: p.sku || '',
              discount: p.discount ?? '',
              tax: p.tax ?? '',
            }))
          );
        }

        setOrderType(order.orderType || 'B2C');
        setRovType(order.rovType || 'ROV Owner');
        setDeadWeight(order.packageDetails?.deadWeight ?? '');
        setLength(order.packageDetails?.volumetricWeight?.length ?? '');
        setWidth(order.packageDetails?.volumetricWeight?.width ?? '');
        setHeight(order.packageDetails?.volumetricWeight?.height ?? '');

        if (Array.isArray(order.B2BPackageDetails?.packages) && order.B2BPackageDetails.packages.length > 0) {
          setB2bPackages(
            order.B2BPackageDetails.packages.map((pkg: any, i: number) => ({
              id: String(i + 1),
              noOfBox: pkg.noOfBox ?? '',
              weightPerBox: pkg.weightPerBox ?? '',
              length: pkg.length ?? '',
              width: pkg.width ?? '',
              height: pkg.height ?? '',
            }))
          );
        }

        setPaymentMode(order.paymentDetails?.method || '');
        setCustomOrderNumber(order.customOrderNumber || '');
        setNotes(order.notes || '');

        const od = order.otherDetails || {};
        setResellerName(od.resellerName || '');
        setGstin(od.gstin || '');
        setEwaybill(od.ewaybill || '');
      })
      .catch(() => {})
      .finally(() => setLoadingPrefill(false));
  }, [cloneId, updateId]);

  // ── Receiver pincode lookup ──
  useEffect(() => {
    if (pinCode.length !== 6) return;
    setPincodeLoading(true);
    apiClient
      .get(`/order/pincode/${pinCode}`)
      .then(res => {
        const data = res.data?.data || res.data;
        if (data?.city) setCity(data.city);
        if (data?.state) setCityState(data.state);
      })
      .catch(() => {})
      .finally(() => setPincodeLoading(false));
  }, [pinCode]);

  // ── Pickup modal pincode lookup ──
  useEffect(() => {
    if (pickupForm.pinCode.length !== 6) return;
    setPickupPincodeLoading(true);
    apiClient
      .get(`/order/pincode/${pickupForm.pinCode}`)
      .then(res => {
        const data = res.data?.data || res.data;
        setPickupForm(prev => ({
          ...prev,
          city: data?.city || prev.city,
          state: data?.state || prev.state,
        }));
      })
      .catch(() => {})
      .finally(() => setPickupPincodeLoading(false));
  }, [pickupForm.pinCode]);

  // ── Match prefill pickup once addresses are loaded ──
  useEffect(() => {
    if (!prefillPickup || pickupAddresses.length === 0) return;
    const match = pickupAddresses.find(addr => {
      const a = addr.pickupAddress;
      return (
        (a.contactName === prefillPickup.contactName && a.pinCode === prefillPickup.pinCode) ||
        (a.email && a.email === prefillPickup.email) ||
        (a.phoneNumber && a.phoneNumber === prefillPickup.phoneNumber)
      );
    });
    if (match) setSelectedPickupId(match._id);
  }, [prefillPickup, pickupAddresses]);

  // ── Product helpers ──
  const handleAddProduct = () =>
    setProducts(prev => [
      ...prev,
      { id: Math.random().toString(), name: '', hsn: '', unitPrice: 0, qty: 1, category: '', sku: '', discount: '', tax: '' },
    ]);

  const handleRemoveProduct = (id: string) => {
    if (products.length > 1) setProducts(prev => prev.filter(p => p.id !== id));
  };

  const updateProduct = (id: string, field: keyof Product, value: any) =>
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, [field]: value } : p)));

  // ── B2B package helpers ──
  const addB2bPackage = () =>
    setB2bPackages(prev => [
      ...prev,
      { id: Math.random().toString(), noOfBox: '', weightPerBox: '', length: '', width: '', height: '' },
    ]);

  const removeB2bPackage = (id: string) => {
    if (b2bPackages.length > 1) setB2bPackages(prev => prev.filter(p => p.id !== id));
  };

  const updateB2bPackage = (id: string, field: keyof B2BPackage, value: any) =>
    setB2bPackages(prev => prev.map(p => (p.id === id ? { ...p, [field]: value } : p)));

  // ── Add Pickup Address submit ──
  const handlePickupSubmit = async () => {
    const e: Record<string, string> = {};
    if (!pickupForm.contactName.trim()) e.contactName = 'Required';
    if (!pickupForm.phoneNumber.trim()) e.phoneNumber = 'Required';
    if (!pickupForm.address.trim()) e.address = 'Required';
    if (!pickupForm.pinCode.trim() || pickupForm.pinCode.length < 6) e.pinCode = 'Valid 6-digit pincode required';
    if (!pickupForm.city.trim()) e.city = 'Required';
    if (!pickupForm.state.trim()) e.state = 'Required';
    setPickupFormErrors(e);
    if (Object.keys(e).length > 0) return;
    setPickupSubmitting(true);
    try {
      await apiClient.post('/order/pickupAddress', pickupForm);
      setShowPickupModal(false);
      setPickupForm({ contactName: '', email: '', phoneNumber: '', address: '', pinCode: '', city: '', state: '' });
      setPickupFormErrors({});
      setPickupRefresh(v => !v);
    } catch {
      setPickupFormErrors({ submit: 'Failed to add pickup address. Please try again.' });
    } finally {
      setPickupSubmitting(false);
    }
  };

  // ── Validation ──
  const validate = () => {
    const e: Record<string, string> = {};
    if (!selectedPickupId) e.pickup = 'Select a pickup address';
    if (!contactName.trim()) e.contactName = 'Required';
    if (!phoneNumber.trim()) e.phoneNumber = 'Required';
    if (!address.trim()) e.address = 'Required';
    if (!pinCode.trim()) e.pinCode = 'Required';
    if (!city.trim()) e.city = 'Required';
    if (!cityState.trim()) e.cityState = 'Required';
    if (products.some(p => !p.name.trim())) e.products = 'All product names are required';
    if (orderType === 'B2C') {
      if (!deadWeight) e.deadWeight = 'Required';
      if (!length) e.length = 'Required';
      if (!width) e.width = 'Required';
      if (!height) e.height = 'Required';
    } else {
      if (b2bPackages.some(p => !p.noOfBox || !p.weightPerBox || !p.length || !p.width || !p.height))
        e.b2bPackages = 'All package fields are required';
    }
    if (!paymentMode) e.paymentMode = 'Select payment mode';
    if (totalOrderValue >= 50000 && !ewaybill.trim()) e.ewaybill = 'E-Waybill is required for orders ≥ ₹50,000';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Build payload ──
  const buildPayload = () => {
    const selectedPickup = pickupAddresses.find(p => p._id === selectedPickupId);
    const base = {
      pickupAddress: selectedPickup
        ? selectedPickup.pickupAddress
        : { _id: selectedPickupId },
      receiverAddress: { contactName, email, phoneNumber, address, pinCode, city, state: cityState },
      productDetails: products.map(p => ({
        name: p.name,
        hsn: p.hsn,
        quantity: p.qty,
        unitPrice: p.unitPrice,
        category: p.category,
        sku: p.sku,
        discount: p.discount,
        tax: p.tax,
      })),
      paymentDetails: { method: paymentMode, amount: totalOrderValue },
      otherDetails: { resellerName, gstin, ewaybill },
      orderType,
      customOrderNumber,
      notes,
    };
    if (orderType === 'B2C') {
      return {
        ...base,
        packageDetails: {
          deadWeight: Number(deadWeight),
          applicableWeight,
          volumetricWeight: { length: Number(length), width: Number(width), height: Number(height) },
        },
      };
    } else {
      return {
        ...base,
        rovType,
        B2BPackageDetails: {
          applicableWeight: b2bApplicable,
          volumetricWeight: b2bTotalVol,
          packages: b2bPackages.map(pkg => ({
            noOfBox: pkg.noOfBox,
            weightPerBox: pkg.weightPerBox,
            length: pkg.length,
            width: pkg.width,
            height: pkg.height,
          })),
        },
      };
    }
  };

  // ── Submit ──
  const handleSaveOrder = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = buildPayload();
      if (isUpdate) {
        await apiClient.put(`/order/updateOrder/${updateId}`, payload);
      } else {
        await apiClient.post('/order/neworder', payload);
      }
      navigate(isAdminView ? '/admin/orders' : '/user/orders');
    } catch (err: any) {
      setErrors({ submit: err?.response?.data?.message || 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const backPath = isAdminView ? '/admin/orders' : '/user/orders';

  // ── Field class helper ──
  const fieldCls = (err?: string) =>
    `w-full h-11 px-4 border rounded-lg text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] ${err ? 'border-red-400' : 'border-[#E2E8F0]'}`;

  if (loadingPrefill) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#00A86B]" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto pb-6 relative">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to={backPath}
            className="flex items-center gap-2 text-[#0F172A] font-bold text-[15px] hover:text-[#00A86B] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {isUpdate ? 'Update Order' : 'Add Order'}
          </Link>
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 h-9 px-4 bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-bold rounded-full transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" /> Bulk Upload
          </button>
        </div>

        {errors.submit && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-600 font-medium">
            {errors.submit}
          </div>
        )}

        <div className="space-y-6">

          {/* ── Pickup Details ── */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-[14px] font-bold text-[#0F172A]">Pickup Details</h2>
            </div>
            <div className="p-6">
              <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">
                Address <span className="text-red-500">*</span>
              </label>
              {errors.pickup && <p className="text-[11px] text-red-500 mb-1">{errors.pickup}</p>}
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 relative">
                  <select
                    value={selectedPickupId}
                    onChange={e => setSelectedPickupId(e.target.value)}
                    className={`w-full h-11 pl-4 pr-10 border rounded-lg text-[13px] text-[#475569] font-medium appearance-none focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] ${errors.pickup ? 'border-red-400' : 'border-[#E2E8F0]'}`}
                  >
                    {pickupAddresses.length === 0 ? (
                      <option value="">No pickup addresses found</option>
                    ) : (
                      pickupAddresses.map(pa => (
                        <option key={pa._id} value={pa._id}>
                          {pa.pickupAddress?.contactName} | {pa.pickupAddress?.address}, {pa.pickupAddress?.city}, {pa.pickupAddress?.pinCode}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#94A3B8] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPickupModal(true)}
                  className="text-[13px] font-bold text-[#2563EB] hover:underline whitespace-nowrap"
                >
                  + Add new pickup address
                </button>
              </div>
            </div>
          </div>

          {/* ── Delivery Details ── */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-[14px] font-bold text-[#0F172A]">Delivery Details</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Contact Name <span className="text-red-500">*</span></label>
                  {errors.contactName && <p className="text-[11px] text-red-500 mb-1">{errors.contactName}</p>}
                  <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Enter Contact Name" className={fieldCls(errors.contactName)} />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter Email" className={fieldCls()} />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                  {errors.phoneNumber && <p className="text-[11px] text-red-500 mb-1">{errors.phoneNumber}</p>}
                  <div className="flex relative">
                    <select className="h-11 w-20 pl-3 pr-6 border border-[#E2E8F0] rounded-l-lg border-r-0 bg-[#F8FAFC] text-[13px] text-[#475569] font-medium appearance-none focus:outline-none">
                      <option>+91</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute left-14 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Enter Phone Number"
                      className={`flex-1 h-11 px-4 border rounded-r-lg text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] ${errors.phoneNumber ? 'border-red-400' : 'border-[#E2E8F0]'}`} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Address <span className="text-red-500">*</span></label>
                  {errors.address && <p className="text-[11px] text-red-500 mb-1">{errors.address}</p>}
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter Address" className={fieldCls(errors.address)} />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Pincode <span className="text-red-500">*</span></label>
                  {errors.pinCode && <p className="text-[11px] text-red-500 mb-1">{errors.pinCode}</p>}
                  <div className="relative">
                    <input type="text" value={pinCode} onChange={e => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter Pincode"
                      className={fieldCls(errors.pinCode)} />
                    {pincodeLoading && <Loader2 className="w-4 h-4 text-[#00A86B] animate-spin absolute right-3 top-1/2 -translate-y-1/2" />}
                  </div>
                </div>
                <div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">City <span className="text-red-500">*</span></label>
                      <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="City" className={fieldCls(errors.city)} />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">State <span className="text-red-500">*</span></label>
                      <input type="text" value={cityState} onChange={e => setCityState(e.target.value)} placeholder="State" className={fieldCls(errors.cityState)} />
                    </div>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input type="checkbox" checked={billingSame} onChange={e => setBillingSame(e.target.checked)} className="w-4 h-4 rounded border-[#CBD5E1] accent-[#00A86B]" />
                <span className="text-[13px] text-[#64748B] font-medium">Billing Details are same as Delivery Details</span>
              </label>
            </div>
          </div>

          {/* ── Product Details ── */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-[14px] font-bold text-[#0F172A]">Product Details</h2>
            </div>
            <div className="p-6 space-y-5">
              {errors.products && <p className="text-[11px] text-red-500">{errors.products}</p>}

              {products.map((product, index) => (
                <div key={product.id} className="space-y-3">
                  {/* Always-visible row */}
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                      {index === 0 && <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Product Name <span className="text-red-500">*</span></label>}
                      <input type="text" value={product.name} onChange={e => updateProduct(product.id, 'name', e.target.value)}
                        placeholder="Enter or search your product name" className={fieldCls()} />
                    </div>
                    <div className="w-[110px]">
                      {index === 0 && <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">HSN</label>}
                      <input type="text" value={product.hsn} onChange={e => updateProduct(product.id, 'hsn', e.target.value)}
                        placeholder="HSN" className={fieldCls()} />
                    </div>
                    <div className="w-[140px]">
                      {index === 0 && <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Unit Price <span className="text-red-500">*</span></label>}
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-medium text-[#94A3B8]">₹</span>
                        <input type="number" value={product.unitPrice || ''} onChange={e => updateProduct(product.id, 'unitPrice', Number(e.target.value))}
                          placeholder="0.00" min={0} className="w-full h-11 pl-8 pr-4 border border-[#E2E8F0] rounded-lg text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" />
                      </div>
                    </div>
                    <div className="w-[120px]">
                      {index === 0 && <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Qty</label>}
                      <div className="flex h-11 border border-[#E2E8F0] rounded-lg">
                        <button
                          type="button"
                          onClick={() => updateProduct(product.id, 'qty', Math.max(1, product.qty - 1))}
                          className="w-10 shrink-0 flex items-center justify-center rounded-l-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#64748B] border-r border-[#E2E8F0] cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input type="text" value={product.qty} readOnly className="flex-1 text-center text-[13px] font-medium text-[#0F172A] focus:outline-none min-w-0" />
                        <button
                          type="button"
                          onClick={() => updateProduct(product.id, 'qty', product.qty + 1)}
                          className="w-10 shrink-0 flex items-center justify-center rounded-r-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#64748B] border-l border-[#E2E8F0] cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="w-[140px]">
                      {index === 0 && <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Total</label>}
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-medium text-[#94A3B8]">₹</span>
                        <input type="text" value={(product.unitPrice * product.qty).toFixed(2)} readOnly
                          className="w-full h-11 pl-8 pr-4 border border-[#E2E8F0] bg-[#F8FAFC] rounded-lg text-[13px] text-[#475569] font-medium focus:outline-none cursor-not-allowed" />
                      </div>
                    </div>
                    <button type="button" onClick={() => handleRemoveProduct(product.id)} disabled={products.length === 1}
                      className="h-11 w-11 flex items-center justify-center rounded-lg text-[#EF4444] bg-[#FEF2F2] border border-[#FEE2E2] hover:bg-red-100 disabled:opacity-30 disabled:cursor-not-allowed shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Optional fields row */}
                  {showOptionalFields && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pl-0">
                      <input type="text" value={product.category} onChange={e => updateProduct(product.id, 'category', e.target.value)}
                        placeholder="Product Category"
                        className="h-10 px-4 border border-[#E2E8F0] rounded-lg text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" />
                      <input type="text" value={product.sku} onChange={e => updateProduct(product.id, 'sku', e.target.value)}
                        placeholder="SKU"
                        className="h-10 px-4 border border-[#E2E8F0] rounded-lg text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" />
                      <input type="number" value={product.discount} onChange={e => updateProduct(product.id, 'discount', e.target.value)}
                        placeholder="Discount" min={0}
                        className="h-10 px-4 border border-[#E2E8F0] rounded-lg text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" />
                      <input type="number" value={product.tax} onChange={e => updateProduct(product.id, 'tax', e.target.value)}
                        placeholder="Tax %" min={0}
                        className="h-10 px-4 border border-[#E2E8F0] rounded-lg text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" />
                    </div>
                  )}
                </div>
              ))}

              <div className="flex items-center gap-4 flex-wrap">
                <button type="button" onClick={handleAddProduct}
                  className="flex items-center gap-1.5 text-[12px] font-bold text-[#00A86B] hover:text-[#009B63] px-3 py-1.5 rounded-full border border-[#00A86B] transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Another Product
                </button>
                <button type="button" onClick={() => setShowOptionalFields(v => !v)}
                  className="flex items-center gap-1.5 text-[12px] font-bold text-[#475569] hover:text-[#0F172A] transition-colors">
                  <Plus className={`w-3.5 h-3.5 transition-transform ${showOptionalFields ? 'rotate-45' : ''}`} />
                  Add Category, SKU, Discount and Tax
                  <span className="font-normal text-[#94A3B8]">(Optional)</span>
                </button>
              </div>

              {/* Charges toggle */}
              <div className="pt-4 border-t border-[#E2E8F0]">
                <button type="button" onClick={() => setShowExtraFees(v => !v)}
                  className="flex items-center gap-2 text-[13px] font-bold text-[#0F172A]">
                  Add Shipping Charges, Gift Wrap, Transaction Fee
                  <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform ${showExtraFees ? 'rotate-180' : ''}`} />
                  <span className="text-[11px] font-normal text-[#94A3B8]">(Optional)</span>
                </button>
                {showExtraFees && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Shipping Charges', value: shippingCharges, setter: setShippingCharges },
                      { label: 'Gift Wrap', value: giftWrap, setter: setGiftWrap },
                      { label: 'Transaction Fee', value: transactionFee, setter: setTransactionFee },
                      { label: 'Discounts', value: discounts, setter: setDiscounts },
                    ].map(({ label, value, setter }) => (
                      <div key={label}>
                        <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">{label}</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-medium text-[#94A3B8]">₹</span>
                          <input type="number" value={value} onChange={e => setter(e.target.value)} placeholder="0.00" min={0}
                            className="w-full h-11 pl-8 pr-4 border border-[#E2E8F0] rounded-lg text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-[#F8FAFC] rounded-xl p-5 border border-[#E2E8F0] space-y-3">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-[#64748B] font-medium">Sub-total for Product</span>
                  <span className="font-bold text-[#0F172A]">₹{subTotal.toFixed(2)}</span>
                </div>
                {showExtraFees && (
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-[#64748B] font-medium">Other Charges / Discounts</span>
                    <span className="font-bold text-[#0F172A]">₹{extraFees.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-[#E2E8F0] text-[14px]">
                  <span className="font-bold text-[#0F172A]">Total Order Value</span>
                  <span className="font-bold text-[#0F172A]">₹{totalOrderValue.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-[11px] text-[#94A3B8]">Note: All the Prices/Charges are inclusive of GST.</p>
            </div>
          </div>

          {/* ── Package Details ── */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-[14px] font-bold text-[#0F172A]">Package Details</h2>
            </div>
            <div className="p-6 space-y-6">

              {/* Type + ROV row */}
              <div className="flex flex-wrap gap-4">
                <div className="w-[160px]">
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Package Type:</label>
                  <div className="relative">
                    <select value={orderType} onChange={e => setOrderType(e.target.value)}
                      className="w-full h-11 pl-4 pr-10 border border-[#E2E8F0] rounded-lg text-[13px] text-[#475569] font-medium appearance-none focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]">
                      <option value="B2C">B2C</option>
                      {/* <option value="B2B">B2B</option> */}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                {orderType === 'B2B' && (
                  <div className="w-[200px]">
                    <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">ROV Type:</label>
                    <div className="relative">
                      <select value={rovType} onChange={e => setRovType(e.target.value)}
                        className="w-full h-11 pl-4 pr-10 border border-[#E2E8F0] rounded-lg text-[13px] text-[#475569] font-medium appearance-none focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]">
                        <option value="ROV Owner">ROV Owner</option>
                        <option value="ROV Carrier">ROV Carrier</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>

              {/* B2C fields */}
              {orderType === 'B2C' && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    {[
                      { label: 'Dead Weight', value: deadWeight, setter: setDeadWeight, unit: 'Kg', err: errors.deadWeight },
                      { label: 'Length', value: length, setter: setLength, unit: 'cm', err: errors.length },
                      { label: 'Width', value: width, setter: setWidth, unit: 'cm', err: errors.width },
                      { label: 'Height', value: height, setter: setHeight, unit: 'cm', err: errors.height },
                    ].map(({ label, value, setter, unit, err }) => (
                      <div key={label}>
                        <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">{label}: <span className="text-red-500">*</span></label>
                        {err && <p className="text-[11px] text-red-500 mb-1">{err}</p>}
                        <div className="relative">
                          <input type="number" value={value} onChange={e => setter(e.target.value)} placeholder="0" min={0}
                            className={`w-full h-11 pl-4 pr-10 border rounded-lg text-[13px] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] ${err ? 'border-red-400' : 'border-[#E2E8F0]'}`} />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[#94A3B8]">{unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-[#F8FAFC] rounded-xl p-5 border border-[#E2E8F0] space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] font-bold text-[#0F172A]">Applicable Weight</span>
                      <span className="font-bold text-[#0F172A] text-[13px]">{applicableWeight.toFixed(2)} kg</span>
                    </div>
                    <p className="text-[11px] text-[#64748B]">Applicable weight is the heavier among Dead Weight vs Volumetric Weight.</p>
                    <div className="h-px bg-[#E2E8F0] w-full" />
                    <div className="flex justify-between items-center py-1">
                      <span className="text-[13px] font-bold text-[#0F172A]">Volumetric Weight</span>
                      <span className="font-bold text-[#0F172A] text-[13px]">{volWeight.toFixed(2)} Kg</span>
                    </div>
                    <div className="h-px bg-[#E2E8F0] w-full" />
                    <div className="flex justify-between items-center py-1">
                      <span className="text-[13px] font-bold text-[#0F172A]">Total Order Value</span>
                      <span className="font-bold text-[#0F172A] text-[13px]">₹{totalOrderValue.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}

              {/* B2B fields */}
              {orderType === 'B2B' && (
                <>
                  {errors.b2bPackages && <p className="text-[11px] text-red-500">{errors.b2bPackages}</p>}
                  <div className="space-y-3">
                    {b2bPackages.map((pkg, index) => (
                      <div key={pkg.id} className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                        {index === 0 && (
                          <>
                            <label className="md:hidden" />
                          </>
                        )}
                        {[
                          { key: 'noOfBox', label: 'No. of Box', placeholder: 'Box Count' },
                          { key: 'weightPerBox', label: 'Weight/Box (kg)', placeholder: 'Weight' },
                          { key: 'length', label: 'Length (cm)', placeholder: 'Length' },
                          { key: 'width', label: 'Width (cm)', placeholder: 'Width' },
                          { key: 'height', label: 'Height (cm)', placeholder: 'Height' },
                        ].map(({ key, label, placeholder }) => (
                          <div key={key}>
                            {index === 0 && <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">{label} <span className="text-red-500">*</span></label>}
                            <input
                              type="number"
                              value={(pkg as any)[key]}
                              onChange={e => updateB2bPackage(pkg.id, key as keyof B2BPackage, e.target.value.replace(/[^0-9.]/g, ''))}
                              placeholder={placeholder}
                              min={0}
                              className="w-full h-11 px-4 border border-[#E2E8F0] rounded-lg text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]"
                            />
                          </div>
                        ))}
                        <button type="button" onClick={() => removeB2bPackage(pkg.id)} disabled={b2bPackages.length === 1}
                          className="h-11 w-11 flex items-center justify-center rounded-lg text-[#EF4444] bg-[#FEF2F2] border border-[#FEE2E2] hover:bg-red-100 disabled:opacity-30 disabled:cursor-not-allowed">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={addB2bPackage}
                      className="flex items-center gap-1.5 text-[12px] font-bold text-[#00A86B] hover:text-[#009B63] px-3 py-1.5 rounded-full border border-[#00A86B] transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add Package
                    </button>
                  </div>
                  <div className="bg-[#F8FAFC] rounded-xl p-5 border border-[#E2E8F0] space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] font-bold text-[#0F172A]">Applicable Weight</span>
                      <span className="font-bold text-[#0F172A] text-[13px]">{b2bApplicable.toFixed(2)} kg</span>
                    </div>
                    <div className="h-px bg-[#E2E8F0] w-full" />
                    <div className="flex justify-between items-center py-1">
                      <span className="text-[13px] font-bold text-[#0F172A]">Total Dead Weight</span>
                      <span className="font-bold text-[#0F172A] text-[13px]">{b2bTotalDead.toFixed(2)} Kg</span>
                    </div>
                    <div className="h-px bg-[#E2E8F0] w-full" />
                    <div className="flex justify-between items-center py-1">
                      <span className="text-[13px] font-bold text-[#0F172A]">Total Volumetric Weight</span>
                      <span className="font-bold text-[#0F172A] text-[13px]">{b2bTotalVol.toFixed(2)} Kg</span>
                    </div>
                    <div className="h-px bg-[#E2E8F0] w-full" />
                    <div className="flex justify-between items-center py-1">
                      <span className="text-[13px] font-bold text-[#0F172A]">Total Order Value</span>
                      <span className="font-bold text-[#0F172A] text-[13px]">₹{totalOrderValue.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}

              <p className="text-[11px] text-[#64748B]">
                <span className="text-red-500 font-bold">Note:</span> The minimum chargeable weight is <span className="font-bold">0.50 Kg.</span> Dimensions should be in <span className="font-bold">centimetres only</span> and value should be greater than <span className="font-bold">0.50 cm.</span>
              </p>
            </div>
          </div>

          {/* ── Payment Details ── */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-[14px] font-bold text-[#0F172A]">Payment Details</h2>
            </div>
            <div className="p-6">
              <p className="text-[11px] text-[#94A3B8] mb-4">Select Mode of Payment that your buyer has chosen for the order</p>
              {errors.paymentMode && <p className="text-[11px] text-red-500 mb-3">{errors.paymentMode}</p>}
              <div className="flex gap-8">
                {['Prepaid', 'COD'].map(mode => (
                  <label key={mode} className="flex items-center gap-2 cursor-pointer group">
                    <div
                      onClick={() => setPaymentMode(mode)}
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer ${paymentMode === mode ? 'border-[#00A86B]' : 'border-[#CBD5E1] group-hover:border-[#94A3B8]'}`}
                    >
                      {paymentMode === mode && <div className="w-2 h-2 rounded-full bg-[#00A86B]" />}
                    </div>
                    <span className="text-[13px] font-bold text-[#0F172A]">
                      {mode} <span className="font-normal text-[#64748B] text-[11px]">{mode === 'Prepaid' ? '(No Additional charges.)' : '(Additional charges may be applicable.)'}</span>
                    </span>
                    <input type="radio" className="hidden" checked={paymentMode === mode} onChange={() => setPaymentMode(mode)} />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* ── Other Details ── */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-[14px] font-bold text-[#0F172A]">Other Details</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Reseller Name</label>
                  <input type="text" value={resellerName} onChange={e => setResellerName(e.target.value)} placeholder="Reseller Name" className={fieldCls()} />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">GSTIN</label>
                  <input type="text" value={gstin} onChange={e => setGstin(e.target.value)} placeholder="GSTIN" className={fieldCls()} />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">
                    GST E-Waybill Number
                    {totalOrderValue >= 50000 && <span className="text-red-500 ml-1">(Required) *</span>}
                  </label>
                  {errors.ewaybill && <p className="text-[11px] text-red-500 mb-1">{errors.ewaybill}</p>}
                  <input type="text" value={ewaybill} onChange={e => setEwaybill(e.target.value)} placeholder="E-Waybill Number"
                    className={fieldCls(errors.ewaybill)} />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Order ID (Custom)</label>
                  <input type="text" value={customOrderNumber} onChange={e => setCustomOrderNumber(e.target.value)} placeholder="e.g. 6543217890" className={fieldCls()} />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Notes</label>
                  <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes" className={fieldCls()} />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="sticky bottom-6 mt-6 bg-white/95 backdrop-blur-md border border-[#E2E8F0] p-4 flex gap-4 z-40 rounded-xl shadow-[0_-4px_24px_-12px_rgba(0,0,0,0.1)]">
          <button onClick={handleSaveOrder} disabled={submitting}
            className="flex items-center gap-2 px-8 h-11 bg-[#00A86B] hover:bg-[#009B63] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[13px] font-bold rounded-full transition-colors shadow-sm">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackagePlus className="w-4 h-4" />}
            {isUpdate ? 'Update Order' : 'Add Order'}
          </button>
          <Link to={backPath} className="px-8 h-11 flex items-center border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] text-[13px] font-bold rounded-full transition-colors">
            Cancel
          </Link>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════
          Add Pickup Address Modal
      ═══════════════════════════════════════════════════════════ */}
      {showPickupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <h3 className="text-[15px] font-bold text-[#0F172A]">Add New Pickup Address</h3>
              <button onClick={() => { setShowPickupModal(false); setPickupFormErrors({}); }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F1F5F9] text-[#64748B]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {pickupFormErrors.submit && (
                <p className="text-[12px] text-red-500">{pickupFormErrors.submit}</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Contact Name <span className="text-red-500">*</span></label>
                  {pickupFormErrors.contactName && <p className="text-[11px] text-red-500 mb-1">{pickupFormErrors.contactName}</p>}
                  <input type="text" value={pickupForm.contactName}
                    onChange={e => setPickupForm(p => ({ ...p, contactName: e.target.value }))}
                    placeholder="Contact Name"
                    className={`w-full h-11 px-4 border rounded-lg text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] ${pickupFormErrors.contactName ? 'border-red-400' : 'border-[#E2E8F0]'}`} />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Email</label>
                  <input type="email" value={pickupForm.email}
                    onChange={e => setPickupForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="Email"
                    className="w-full h-11 px-4 border border-[#E2E8F0] rounded-lg text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                {pickupFormErrors.phoneNumber && <p className="text-[11px] text-red-500 mb-1">{pickupFormErrors.phoneNumber}</p>}
                <input type="text" value={pickupForm.phoneNumber}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                    if (!v || /^[6-9]/.test(v)) setPickupForm(p => ({ ...p, phoneNumber: v }));
                  }}
                  placeholder="Phone Number (10 digits, starts with 6-9)"
                  className={`w-full h-11 px-4 border rounded-lg text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] ${pickupFormErrors.phoneNumber ? 'border-red-400' : 'border-[#E2E8F0]'}`} />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Address <span className="text-red-500">*</span></label>
                {pickupFormErrors.address && <p className="text-[11px] text-red-500 mb-1">{pickupFormErrors.address}</p>}
                <input type="text" value={pickupForm.address}
                  onChange={e => setPickupForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="Street Address"
                  className={`w-full h-11 px-4 border rounded-lg text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] ${pickupFormErrors.address ? 'border-red-400' : 'border-[#E2E8F0]'}`} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Pincode <span className="text-red-500">*</span></label>
                  {pickupFormErrors.pinCode && <p className="text-[11px] text-red-500 mb-1">{pickupFormErrors.pinCode}</p>}
                  <div className="relative">
                    <input type="text" value={pickupForm.pinCode}
                      onChange={e => setPickupForm(p => ({ ...p, pinCode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                      placeholder="Pincode"
                      className={`w-full h-11 px-4 border rounded-lg text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] ${pickupFormErrors.pinCode ? 'border-red-400' : 'border-[#E2E8F0]'}`} />
                    {pickupPincodeLoading && <Loader2 className="w-4 h-4 text-[#00A86B] animate-spin absolute right-3 top-1/2 -translate-y-1/2" />}
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">City <span className="text-red-500">*</span></label>
                  {pickupFormErrors.city && <p className="text-[11px] text-red-500 mb-1">{pickupFormErrors.city}</p>}
                  <input type="text" value={pickupForm.city} readOnly placeholder="Auto-filled"
                    className={`w-full h-11 px-4 border rounded-lg text-[13px] bg-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none ${pickupFormErrors.city ? 'border-red-400' : 'border-[#E2E8F0]'}`} />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">State <span className="text-red-500">*</span></label>
                  {pickupFormErrors.state && <p className="text-[11px] text-red-500 mb-1">{pickupFormErrors.state}</p>}
                  <input type="text" value={pickupForm.state} readOnly placeholder="Auto-filled"
                    className={`w-full h-11 px-4 border rounded-lg text-[13px] bg-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none ${pickupFormErrors.state ? 'border-red-400' : 'border-[#E2E8F0]'}`} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-[#E2E8F0]">
              <button onClick={handlePickupSubmit} disabled={pickupSubmitting}
                className="flex items-center gap-2 px-6 h-10 bg-[#00A86B] hover:bg-[#009B63] disabled:opacity-60 text-white text-[13px] font-bold rounded-full transition-colors">
                {pickupSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save Address
              </button>
              <button onClick={() => { setShowPickupModal(false); setPickupFormErrors({}); }}
                className="px-6 h-10 border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] text-[13px] font-bold rounded-full transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <BulkUploadModal open={showBulkModal} onClose={() => setShowBulkModal(false)} />

    </AdminLayout>
  );
}
