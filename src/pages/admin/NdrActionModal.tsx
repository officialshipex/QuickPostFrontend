import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X, MapPin, Phone, Calendar } from 'lucide-react';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';

const ACTIONS = [
  { label: 'Reattempt',              value: 'RE-ATTEMPT'     },
  { label: 'Change Address',         value: 'CHANGE_ADDRESS' },
  { label: 'Return to Origin (RTO)', value: 'RTO'            },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onSubmit: (payload: any) => Promise<void>;
}

export function NdrActionModal({ isOpen, onClose, order, onSubmit }: Props) {
  const [action,        setAction]        = useState('');
  const [remarks,       setRemarks]       = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [deliverySlot,  setDeliverySlot]  = useState('');
  const [mobile,        setMobile]        = useState('');
  const [address, setAddress] = useState({ line1: '', line2: '', city: '', state: '', pincode: '', customerName: '' });
  const [loading,       setLoading]       = useState(false);
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const [dropdownPos,   setDropdownPos]   = useState({ top: 0, left: 0, width: 0 });
  const { toast, showToast, closeToast }  = useToast();
  const dropdownBtnRef  = useRef<HTMLButtonElement>(null);
  const dropdownListRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close dropdown on outside click — checks both the trigger button and the portaled list
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!dropdownBtnRef.current?.contains(t) && !dropdownListRef.current?.contains(t)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) window.addEventListener('click', fn);
    return () => window.removeEventListener('click', fn);
  }, [dropdownOpen]);

  if (!isOpen) return null;

  const notify = (msg: string, type: 'info' | 'error' | 'success' = 'info') => showToast(type, msg);

  const awb      = order?.awb_number || order?.awb || '';
  const provider = order?.provider   || '';
  const partner  = order?.partner    || '';

  const isZipyPost      = partner  === 'ZipyPost';
  const isBoxdLogistics = partner  === 'BoxdLogistics';
  const isAmazon        = provider === 'Amazon Shipping';
  const isEcomExpress   = provider === 'EcomExpress';
  const isSmartship     = provider === 'Smartship';
  const isDtdc          = provider === 'Dtdc';
  const isDelhivery     = provider === 'Delhivery';
  const isEkart         = provider === 'Ekart';
  const isShreeMaruti   = provider === 'Shree Maruti';
  const isLosung360     = partner  === 'Losung360' || provider === 'Losung360';

  const isChangeAddress = action === 'CHANGE_ADDRESS';
  const isReattempt     = action === 'RE-ATTEMPT';
  const isRTO           = action === 'RTO';

  const needsScheduledDate       = (isEcomExpress && (isReattempt || isChangeAddress)) || (isSmartship && (isReattempt || isChangeAddress));
  const needsChangeAddressFields = isChangeAddress && !isAmazon;
  const needsMobile              = isChangeAddress || isSmartship || isShreeMaruti || isBoxdLogistics || (isEcomExpress && isReattempt);

  const resetActionFields = () => {
    setRemarks(''); setScheduledDate(''); setDeliverySlot(''); setMobile('');
    setAddress({ line1: '', line2: '', city: '', state: '', pincode: '', customerName: '' });
  };

  const handleDropdownToggle = () => {
    if (!dropdownOpen && dropdownBtnRef.current) {
      const rect = dropdownBtnRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setDropdownOpen(p => !p);
  };

  const handleSubmit = async () => {
    if (!action) return notify('Please select an action.');
    if (!remarks.trim()) return notify('Please enter remarks.');
    if (isChangeAddress && !isAmazon) {
      if (!address.line1.trim()) return notify('Please enter address line 1.');
      if (!address.customerName.trim()) return notify('Please enter customer name.');
    }

    let payload: any = { awb_number: awb };

    if (isZipyPost) {
      payload.action  = isChangeAddress ? 'Change Address' : isRTO ? 'RTO' : 'Re-Attempt';
      payload.remarks = remarks;
      if (mobile) payload.phone = mobile;
      if (isChangeAddress) { payload.customer_name = address.customerName; payload.consignee_address = address.line1; payload.consignee_address2 = address.line2; }
    } else if (isAmazon) {
      payload.action   = isRTO ? 'RTO' : 'RE-ATTEMPT';
      payload.comments = remarks;
    } else if (isEcomExpress) {
      payload.action   = isChangeAddress ? 'RE-ATTEMPT' : action;
      payload.comments = remarks;
      if (isReattempt || isChangeAddress) {
        payload.scheduled_delivery_date = scheduledDate;
        payload.scheduled_delivery_slot = deliverySlot;
        if (mobile) payload.mobile = mobile;
        if (isChangeAddress) payload.consignee_address = { CA1: address.line1, CA2: `${address.city}${address.state ? `, ${address.state}` : ''}`, CA3: address.line2 || '', CA4: address.customerName };
      }
    } else if (isSmartship) {
      payload.action   = isChangeAddress ? 'RE-ATTEMPT' : action;
      payload.comments = remarks;
      if (scheduledDate) payload.next_attempt_date = scheduledDate;
      if (mobile) payload.phone = mobile;
      if (isChangeAddress) { payload.new_address = address.line1; payload.new_phone = mobile; payload.customer_name = address.customerName; }
    } else if (isDtdc) {
      payload.action        = isChangeAddress ? 'RE-ATTEMPT' : action;
      payload.remarks       = remarks;
      payload.customer_code = order.orderId || '';
      payload.rtoAction     = isChangeAddress ? 'RE-ATTEMPT' : action;
    } else if (isDelhivery) {
      payload.action   = isChangeAddress ? 'RE-ATTEMPT' : action;
      payload.comments = remarks;
      if (isChangeAddress) { payload.new_address = address.line1; payload.new_pincode = address.pincode; payload.customer_name = address.customerName; }
    } else if (isShreeMaruti) {
      payload.action   = isChangeAddress ? 'RE-ATTEMPT' : action;
      payload.comments = remarks;
      if (mobile) payload.phone = mobile;
      if (isChangeAddress) payload.consignee_address = address.line1;
    } else if (isEkart) {
      payload.action   = isChangeAddress ? 'RE-ATTEMPT' : action;
      payload.comments = remarks;
      if (isChangeAddress) { payload.new_address = address.line1; payload.new_address2 = address.line2; payload.customer_name = address.customerName; payload.new_phone = mobile; payload.new_pincode = address.pincode; }
    } else if (isBoxdLogistics) {
      payload.action  = action;
      payload.remarks = remarks;
      if (mobile) payload.new_phone = mobile;
      if (isChangeAddress) { payload.new_address = address.line1; payload.new_address2 = address.line2; payload.updated_city = address.city; payload.updated_state = address.state; payload.new_pincode = address.pincode; payload.customer_name = address.customerName; }
    } else if (isLosung360) {
      payload.action   = isChangeAddress ? 'RE-ATTEMPT' : action;
      payload.comments = remarks;
      if (mobile) payload.phone = mobile;
      if (isChangeAddress) { payload.address1 = address.line1; payload.address2 = address.line2; payload.city = address.city; payload.state = address.state; payload.pincode = address.pincode; payload.customer_name = address.customerName; }
    } else {
      payload.action   = isChangeAddress ? 'RE-ATTEMPT' : action;
      payload.comments = remarks;
    }

    setLoading(true);
    try {
      await onSubmit(payload);
      notify('NDR action submitted successfully!', 'success');
      onClose();
    } catch {
      notify('Failed to submit. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, ...props }: { label: string; [k: string]: any }) => (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold text-[#475569]">{label}</label>
      <input
        {...props}
        className="w-full border border-[#E2E8F0] px-3 py-2 text-[12px] text-[#0F172A] rounded-lg focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]/20 transition-all placeholder:text-[#94A3B8]"
      />
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 flex items-end sm:items-center justify-center bg-black/50 z-[200] px-0 sm:px-4">
      {/* overflow-hidden clips child backgrounds to border-radius — prevents the square-inside-rounded visual artifact */}
      <div className="bg-white w-full sm:max-w-md shadow-2xl flex flex-col max-h-[94vh] sm:max-h-[88vh] border border-[#E2E8F0] rounded-t-3xl sm:rounded-2xl overflow-hidden">

        {/* Drag handle — mobile only, signals bottom-sheet affordance */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full bg-[#E2E8F0]" />
        </div>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3 sm:py-4 border-b border-[#E2E8F0] shrink-0">
          <div className="min-w-0">
            <h2 className="text-[15px] sm:text-sm font-bold text-[#0F172A]">Take NDR Action</h2>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-[11px] font-semibold text-[#00A86B] bg-[#F0FDF4] px-2 py-0.5 rounded-full">{awb || '—'}</span>
              {order?.customerName && order.customerName !== '—' && (
                <span className="text-[11px] text-[#94A3B8] truncate">{order.customerName}</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] transition-colors focus:outline-none shrink-0 ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Action selector — segmented pills on mobile, dropdown on desktop ── */}
        <div className="px-5 pt-4 pb-0 shrink-0">
          <label className="text-[11px] font-bold text-[#475569] block mb-2">
            Action <span className="text-red-400">*</span>
          </label>

          {/* Mobile: tap-friendly segmented options */}
          <div className="sm:hidden grid grid-cols-1 gap-2">
            {ACTIONS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => { setAction(value); resetActionFields(); }}
                className={`w-full text-left px-3.5 py-3 rounded-xl border-2 text-[13px] font-semibold transition-all flex items-center justify-between ${action === value ? 'border-[#00A86B] bg-[#F0FDF4] text-[#00A86B]' : 'border-[#E2E8F0] bg-white text-[#475569]'}`}
              >
                {label}
                {action === value && <span className="w-2 h-2 rounded-full bg-[#00A86B] shrink-0" />}
              </button>
            ))}
          </div>

          {/* Desktop: dropdown trigger — open list is portaled as position:fixed to document.body */}
          <button
            ref={dropdownBtnRef}
            type="button"
            onClick={handleDropdownToggle}
            className="hidden sm:flex w-full border border-[#E2E8F0] px-3.5 py-2.5 text-[12px] font-semibold rounded-xl text-left justify-between items-center hover:border-[#00A86B] focus:outline-none focus:border-[#00A86B] transition-all bg-[#F8FAFC]"
          >
            <span className={action ? 'text-[#0F172A]' : 'text-[#94A3B8]'}>
              {ACTIONS.find(a => a.value === action)?.label || 'Select action…'}
            </span>
            <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        {action && (
          <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4 min-h-0">

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#475569]">
                Remarks <span className="text-red-400">*</span>
              </label>
              <textarea
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                rows={2}
                placeholder="Enter remarks…"
                className="w-full border border-[#E2E8F0] px-3 py-2 text-[12px] text-[#0F172A] rounded-xl focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]/20 transition-all placeholder:text-[#94A3B8] resize-none"
              />
            </div>

            {needsChangeAddressFields && (
              <div className="border border-[#00A86B]/25 rounded-xl p-4 bg-[#F0FDF4] flex flex-col gap-3">
                <p className="text-[11px] font-bold text-[#00A86B] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> New Delivery Address
                </p>
                <div className="flex flex-col gap-2.5">
                  <InputField label="Customer Name *" value={address.customerName} onChange={(e: any) => setAddress({ ...address, customerName: e.target.value })} placeholder="Full name" />
                  <InputField label="Address Line 1 *" value={address.line1} onChange={(e: any) => setAddress({ ...address, line1: e.target.value })} placeholder="House / Flat, Street" />
                  <InputField label="Address Line 2" value={address.line2} onChange={(e: any) => setAddress({ ...address, line2: e.target.value })} placeholder="Area, Landmark (optional)" />
                  <div className="grid grid-cols-2 gap-2">
                    <InputField label="City" value={address.city} onChange={(e: any) => setAddress({ ...address, city: e.target.value })} placeholder="City" />
                    <InputField label="State" value={address.state} onChange={(e: any) => setAddress({ ...address, state: e.target.value })} placeholder="State" />
                  </div>
                  {(isEkart || isDelhivery || isZipyPost || isBoxdLogistics || isLosung360) && (
                    <InputField label="Pincode" value={address.pincode} onChange={(e: any) => setAddress({ ...address, pincode: e.target.value })} placeholder="6-digit pincode" maxLength={6} />
                  )}
                </div>
              </div>
            )}

            {needsMobile && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-[#475569] flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-[#00A86B]" />
                  {isChangeAddress ? 'New Contact Number' : 'Contact Number'}
                </label>
                <input
                  type="text"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  className="w-full border border-[#E2E8F0] px-3 py-2 text-[12px] text-[#0F172A] rounded-xl focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]/20 transition-all placeholder:text-[#94A3B8]"
                />
              </div>
            )}

            {needsScheduledDate && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-[#475569] flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-[#00A86B]" />
                  {isSmartship ? 'Next Attempt Date' : 'Scheduled Delivery Date'}
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-[#E2E8F0] px-3 py-2 rounded-xl text-[12px] text-[#0F172A] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]/20 transition-all"
                />
              </div>
            )}

            {isEcomExpress && (isReattempt || isChangeAddress) && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-[#475569]">Delivery Slot</label>
                <select
                  value={deliverySlot}
                  onChange={e => setDeliverySlot(e.target.value)}
                  className="w-full border border-[#E2E8F0] px-3 py-2 rounded-xl text-[12px] text-[#0F172A] focus:outline-none focus:border-[#00A86B] transition-all bg-white"
                >
                  <option value="">Select slot…</option>
                  <option value="1">Morning</option>
                  <option value="2">Afternoon</option>
                  <option value="3">Evening</option>
                </select>
              </div>
            )}

            {isAmazon && isChangeAddress && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-700 font-medium leading-relaxed">
                ⚠️ Amazon Shipping does not support address changes. This will be submitted as a Re-Attempt.
              </div>
            )}
            {isLosung360 && isChangeAddress && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-700 font-medium leading-relaxed">
                ⚠️ Losung360 does not support address changes. This will be submitted as a Re-Attempt.
              </div>
            )}
            {isEkart && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-[11px] text-blue-700 font-medium leading-relaxed">
                ℹ️ Ekart NDR actions are processed internally and tracked via order history.
              </div>
            )}
          </div>
        )}

        {!action && <div className="flex-1" />}

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 sm:py-4 border-t border-[#E2E8F0] shrink-0 pb-[calc(0.875rem+env(safe-area-inset-bottom))] sm:pb-4">
          <button
            onClick={onClose}
            className="hidden sm:inline-flex h-9 px-4 bg-white border border-[#E2E8F0] text-[#475569] font-bold text-[12px] rounded-xl hover:bg-[#F8FAFC] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="sm:hidden h-11 px-4 bg-white border border-[#E2E8F0] text-[#475569] font-bold text-[13px] rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !action}
            className={`flex-1 sm:flex-none h-11 sm:h-9 px-5 text-white font-bold text-[13px] sm:text-[12px] rounded-xl transition-all flex items-center justify-center gap-2 ${loading || !action ? 'bg-[#CBD5E1] cursor-not-allowed' : 'bg-[#00A86B] hover:bg-[#009B63] shadow-sm'}`}
          >
            {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {loading ? 'Submitting…' : 'Submit Action'}
          </button>
        </div>
      </div>

      {/* Dropdown list — portaled as position:fixed to body so overflow-hidden on modal doesn't clip it */}
      {dropdownOpen && createPortal(
        <ul
          ref={dropdownListRef}
          className="fixed bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-[500] overflow-hidden"
          style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
        >
          {ACTIONS.map(({ label, value }) => (
            <li
              key={value}
              onClick={() => { setAction(value); setDropdownOpen(false); resetActionFields(); }}
              className={`px-4 py-3 cursor-pointer text-[12px] font-semibold transition-colors ${action === value ? 'bg-[#F0FDF4] text-[#00A86B]' : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'}`}
            >
              {label}
            </li>
          ))}
        </ul>,
        document.body
      )}

      <Toast toast={toast} onClose={closeToast} />
    </div>,
    document.body
  );
}
