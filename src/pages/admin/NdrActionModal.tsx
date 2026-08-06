import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X, MapPin, Phone, Calendar } from 'lucide-react';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';

const ACTIONS = [
  { label: 'Reattempt', value: 'RE-ATTEMPT' },
  { label: 'Change Address', value: 'CHANGE_ADDRESS' },
  { label: 'Return to Origin (RTO)', value: 'RTO' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onSubmit: (payload: any) => Promise<void>;
}

export function NdrActionModal({ isOpen, onClose, order, onSubmit }: Props) {
  const [action, setAction] = useState('');
  const [remarks, setRemarks] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [deliverySlot, setDeliverySlot] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState({ line1: '', line2: '', city: '', state: '', pincode: '', customerName: '' });
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { toast, showToast, closeToast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    if (dropdownOpen) window.addEventListener('click', fn);
    return () => window.removeEventListener('click', fn);
  }, [dropdownOpen]);

  if (!isOpen) return null;

  const notify = (msg: string) => showToast('info', msg);

  const provider = order?.provider || '';
  const partner  = order?.partner  || '';

  const isZipyPost      = partner === 'ZipyPost';
  const isBoxdLogistics = partner === 'BoxdLogistics';
  const isAmazon        = provider === 'Amazon Shipping';
  const isEcomExpress   = provider === 'EcomExpress';
  const isSmartship     = provider === 'Smartship';
  const isDtdc          = provider === 'Dtdc';
  const isDelhivery     = provider === 'Delhivery';
  const isEkart         = provider === 'Ekart';
  const isShreeMaruti   = provider === 'Shree Maruti';
  const isLosung360     = partner === 'Losung360' || provider === 'Losung360';

  const isChangeAddress = action === 'CHANGE_ADDRESS';
  const isReattempt     = action === 'RE-ATTEMPT';
  const isRTO           = action === 'RTO';

  const needsScheduledDate    = (isEcomExpress && (isReattempt || isChangeAddress)) || (isSmartship && (isReattempt || isChangeAddress));
  const needsChangeAddressFields = isChangeAddress && !isAmazon;

  const handleSubmit = async () => {
    if (!action) return notify('Please select an action.');
    if (!remarks.trim()) return notify('Please enter remarks.');
    if (isChangeAddress && !isAmazon) {
      if (!address.line1.trim()) return notify('Please enter address line 1.');
      if (!address.customerName.trim()) return notify('Please enter customer name.');
    }

    let payload: any = { awb_number: order.awb_number };

    if (isZipyPost) {
      payload.action  = isChangeAddress ? 'Change Address' : isRTO ? 'RTO' : 'Re-Attempt';
      payload.remarks = remarks;
      if (mobile) payload.phone = mobile;
      if (isChangeAddress) { payload.customer_name = address.customerName; payload.consignee_address = address.line1; payload.consignee_address2 = address.line2; }
    } else if (isAmazon) {
      payload.action   = isRTO ? 'RTO' : 'RE-ATTEMPT';
      payload.comments = remarks;
    } else if (isEcomExpress) {
      payload.action = isChangeAddress ? 'RE-ATTEMPT' : action;
      payload.comments = remarks;
      if (isReattempt || isChangeAddress) {
        payload.scheduled_delivery_date = scheduledDate;
        payload.scheduled_delivery_slot = deliverySlot;
        if (mobile) payload.mobile = mobile;
        if (isChangeAddress) payload.consignee_address = { CA1: address.line1, CA2: address.city + (address.state ? `, ${address.state}` : ''), CA3: address.line2 || '', CA4: address.customerName };
      }
    } else if (isSmartship) {
      payload.action = isChangeAddress ? 'RE-ATTEMPT' : action;
      payload.comments = remarks;
      if (scheduledDate) payload.next_attempt_date = scheduledDate;
      if (mobile) payload.phone = mobile;
      if (isChangeAddress) { payload.new_address = address.line1; payload.new_phone = mobile; payload.customer_name = address.customerName; }
    } else if (isDtdc) {
      payload.action = isChangeAddress ? 'RE-ATTEMPT' : action;
      payload.remarks = remarks;
      payload.customer_code = order.orderId || '';
      payload.rtoAction = isChangeAddress ? 'RE-ATTEMPT' : action;
    } else if (isDelhivery) {
      payload.action = isChangeAddress ? 'RE-ATTEMPT' : action;
      payload.comments = remarks;
      if (isChangeAddress) { payload.new_address = address.line1; payload.new_pincode = address.pincode; payload.customer_name = address.customerName; }
    } else if (isShreeMaruti) {
      payload.action = isChangeAddress ? 'RE-ATTEMPT' : action;
      payload.comments = remarks;
      if (mobile) payload.phone = mobile;
      if (isChangeAddress) payload.consignee_address = address.line1;
    } else if (isEkart) {
      payload.action = isChangeAddress ? 'RE-ATTEMPT' : action;
      payload.comments = remarks;
      if (isChangeAddress) { payload.new_address = address.line1; payload.new_address2 = address.line2; payload.customer_name = address.customerName; payload.new_phone = mobile; payload.new_pincode = address.pincode; }
    } else if (isBoxdLogistics) {
      payload.action = action;
      payload.remarks = remarks;
      if (mobile) payload.new_phone = mobile;
      if (isChangeAddress) { payload.new_address = address.line1; payload.new_address2 = address.line2; payload.updated_city = address.city; payload.updated_state = address.state; payload.new_pincode = address.pincode; payload.customer_name = address.customerName; }
    } else if (isLosung360) {
      payload.action = isChangeAddress ? 'RE-ATTEMPT' : action;
      payload.comments = remarks;
      if (mobile) payload.phone = mobile;
      if (isChangeAddress) { payload.address1 = address.line1; payload.address2 = address.line2; payload.city = address.city; payload.state = address.state; payload.pincode = address.pincode; payload.customer_name = address.customerName; }
    } else {
      payload.action = isChangeAddress ? 'RE-ATTEMPT' : action;
      payload.comments = remarks;
    }

    setLoading(true);
    try { await onSubmit(payload); onClose(); }
    catch { notify('Failed to submit. Please try again.'); }
    finally { setLoading(false); }
  };

  const selectedLabel = ACTIONS.find(a => a.value === action)?.label || 'Select Action';

  const Field = ({ label, ...props }: { label: string; [k: string]: any }) => (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold text-[#475569]">{label}</label>
      <input {...props} className="w-full border border-[#E2E8F0] px-3 py-2 text-[12px] text-[#0F172A] rounded-lg focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]/20 transition-all placeholder:text-[#94A3B8]" />
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-[200] px-3">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] border border-[#E2E8F0] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
          <div>
            <h2 className="text-[14px] font-bold text-[#0F172A]">Take NDR Action</h2>
            <p className="text-[11px] text-[#64748B] mt-0.5">AWB: <span className="text-[#00A86B] font-bold">{order?.awb_number}</span></p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 flex flex-col gap-4">
          {/* Action dropdown */}
          <div className="flex flex-col gap-1" ref={dropdownRef}>
            <label className="text-[11px] font-bold text-[#475569]">Action</label>
            <button type="button" onClick={() => setDropdownOpen(p => !p)} className="w-full border border-[#E2E8F0] px-3 py-2.5 text-[12px] font-semibold text-[#0F172A] rounded-lg text-left flex justify-between items-center hover:border-[#00A86B] transition-all">
              <span className={action ? 'text-[#0F172A]' : 'text-[#94A3B8]'}>{selectedLabel}</span>
              <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
              <ul className="absolute z-30 mt-16 bg-white border border-[#E2E8F0] rounded-xl shadow-lg overflow-hidden text-[12px] w-[calc(100%-2rem)] max-w-[calc(28rem-2rem)]">
                {ACTIONS.map(({ label, value }) => (
                  <li key={value} onClick={() => { setAction(value); setDropdownOpen(false); setRemarks(''); setScheduledDate(''); setAddress({ line1: '', line2: '', city: '', state: '', pincode: '', customerName: '' }); }}
                    className={`px-4 py-2.5 cursor-pointer font-semibold transition-colors ${action === value ? 'bg-[#00A86B]/10 text-[#00A86B]' : 'text-[#475569] hover:bg-[#F8FAFC]'}`}>
                    {label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Remarks */}
          {action && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#475569]">Remarks <span className="text-red-400">*</span></label>
              <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} placeholder="Enter remarks..."
                className="w-full border border-[#E2E8F0] px-3 py-2 text-[12px] text-[#0F172A] rounded-lg focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]/20 transition-all placeholder:text-[#94A3B8] resize-none" />
            </div>
          )}

          {/* Change Address fields */}
          {needsChangeAddressFields && (
            <div className="border border-[#00A86B]/20 rounded-xl p-4 bg-[#00A86B]/5 flex flex-col gap-3">
              <p className="text-[11px] font-bold text-[#00A86B] flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> New Delivery Address</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2"><Field label="Customer Name *" value={address.customerName} onChange={(e: any) => setAddress({ ...address, customerName: e.target.value })} placeholder="Full name" /></div>
                <div className="col-span-2"><Field label="Address Line 1 *" value={address.line1} onChange={(e: any) => setAddress({ ...address, line1: e.target.value })} placeholder="House/Flat, Street" /></div>
                <div className="col-span-2"><Field label="Address Line 2" value={address.line2} onChange={(e: any) => setAddress({ ...address, line2: e.target.value })} placeholder="Area, Landmark (optional)" /></div>
                <Field label="City" value={address.city} onChange={(e: any) => setAddress({ ...address, city: e.target.value })} placeholder="City" />
                <Field label="State" value={address.state} onChange={(e: any) => setAddress({ ...address, state: e.target.value })} placeholder="State" />
                {(isEkart || isDelhivery || isZipyPost || isBoxdLogistics || isLosung360) && (
                  <div className="col-span-2"><Field label="Pincode" value={address.pincode} onChange={(e: any) => setAddress({ ...address, pincode: e.target.value })} placeholder="6-digit pincode" maxLength={6} /></div>
                )}
              </div>
            </div>
          )}

          {/* Mobile */}
          {action && (isChangeAddress || isSmartship || isShreeMaruti || isBoxdLogistics || (isEcomExpress && isReattempt)) && (
            <Field label={isChangeAddress ? 'New Contact Number' : 'Contact Number'} icon={Phone} type="text" value={mobile} onChange={(e: any) => setMobile(e.target.value)} placeholder="10-digit mobile number" maxLength={10} />
          )}

          {/* Scheduled date */}
          {action && needsScheduledDate && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#475569] flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#00A86B]" />{isSmartship ? 'Next Attempt Date' : 'Scheduled Delivery Date'}</label>
              <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
                className="w-full border border-[#E2E8F0] px-3 py-2 rounded-lg text-[12px] text-[#0F172A] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]/20 transition-all" />
            </div>
          )}

          {/* EcomExpress delivery slot */}
          {isEcomExpress && (isReattempt || isChangeAddress) && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#475569]">Delivery Slot</label>
              <select value={deliverySlot} onChange={e => setDeliverySlot(e.target.value)} className="w-full border border-[#E2E8F0] px-3 py-2 rounded-lg text-[12px] text-[#0F172A] focus:outline-none focus:border-[#00A86B] transition-all">
                <option value="">Select Slot</option>
                <option value="1">Morning</option>
                <option value="2">Afternoon</option>
                <option value="3">Evening</option>
              </select>
            </div>
          )}

          {/* Warnings */}
          {isAmazon && isChangeAddress && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-700 font-medium">⚠️ Amazon Shipping does not support address changes. This will be submitted as a Re-Attempt request.</div>
          )}
          {isLosung360 && isChangeAddress && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-700 font-medium">⚠️ Losung360 does not support address changes. This will be submitted as a Re-Attempt request.</div>
          )}
          {isEkart && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[11px] text-blue-700 font-medium">ℹ️ Ekart NDR actions are processed internally and tracked via order history.</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center gap-2 px-5 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#475569] font-bold text-[12px] rounded-lg hover:bg-[#F8FAFC] transition-all">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !action}
            className={`px-4 py-2 text-white font-bold text-[12px] rounded-lg transition-all ${loading || !action ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#00A86B] hover:bg-[#009B63] shadow-sm'}`}>
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>

      <Toast toast={toast} onClose={closeToast} />
    </div>,
    document.body
  );
}
