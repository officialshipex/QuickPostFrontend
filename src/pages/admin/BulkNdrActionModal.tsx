import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, MapPin, Phone } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
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
  selectedOrders: string[];
  onRefresh: () => void;
}

export function BulkNdrActionModal({ isOpen, onClose, selectedOrders, onRefresh }: Props) {
  const [action,        setAction]        = useState('');
  const [remarks,       setRemarks]       = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [deliverySlot,  setDeliverySlot]  = useState('');
  const [mobile,        setMobile]        = useState('');
  const [address, setAddress] = useState({ address1: '', address2: '', customer_name: '', city: '', state: '', pincode: '' });
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

  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'info') => showToast(type, msg);

  const resetActionFields = () => {
    setRemarks(''); setScheduledDate(''); setDeliverySlot(''); setMobile('');
    setAddress({ address1: '', address2: '', customer_name: '', city: '', state: '', pincode: '' });
  };

  const handleDropdownToggle = () => {
    if (!dropdownOpen && dropdownBtnRef.current) {
      const rect = dropdownBtnRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setDropdownOpen(p => !p);
  };

  const validate = () => {
    if (!action) { notify('Please select an action.'); return false; }
    if (!remarks.trim()) { notify('Please enter remarks.'); return false; }
    if (action === 'CHANGE_ADDRESS') {
      if (!address.customer_name.trim()) { notify('Customer name is required.'); return false; }
      if (!address.address1.trim()) { notify('Address Line 1 is required.'); return false; }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!selectedOrders.length) { notify('No shipments selected.', 'error'); return; }
    if (!validate()) return;

    const payloads = selectedOrders.map(orderId => {
      const p: any = { orderId, action, remarks };
      if (action === 'CHANGE_ADDRESS') {
        p.customer_name = address.customer_name;
        p.address1      = address.address1;
        p.address2      = address.address2;
        p.city          = address.city;
        p.state         = address.state;
        p.pincode       = address.pincode;
        p.phone         = mobile;
      }
      if (action === 'RE-ATTEMPT') {
        p.scheduled_delivery_date = scheduledDate;
        p.deliverySlot            = deliverySlot;
        p.phone                   = mobile;
      }
      return p;
    });

    setLoading(true);
    try {
      const res = await apiClient.post('/ndr/bulk', { payloads });
      notify(res.data?.message || 'Bulk NDR action submitted successfully!', 'success');
      onClose();
      onRefresh();
    } catch (err: any) {
      notify(err?.response?.data?.message || 'Bulk NDR action failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, ...props }: { label: string; [k: string]: any }) => (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold text-[#475569]">{label}</label>
      <input {...props} className="w-full border border-[#E2E8F0] px-3 py-2 text-[12px] text-[#0F172A] rounded-lg focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]/20 transition-all placeholder:text-[#94A3B8]" />
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 flex items-end sm:items-center justify-center bg-black/50 z-[200] px-0 sm:px-4">
      {/* overflow-hidden clips child backgrounds to border-radius — prevents the square-inside-rounded visual artifact */}
      <div className="bg-white w-full sm:max-w-lg shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-[#E2E8F0] rounded-t-2xl sm:rounded-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A]">Bulk NDR Action</h2>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              <span className="font-bold text-[#0F172A]">{selectedOrders.length}</span> shipment{selectedOrders.length !== 1 ? 's' : ''} selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-white transition-colors focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Action Dropdown trigger ── */}
        {/* The open list is portaled as position:fixed to document.body — it won't be clipped by overflow-hidden */}
        <div className="px-5 pt-4 pb-0 shrink-0">
          <label className="text-[11px] font-bold text-[#475569] block mb-1.5">
            Action <span className="text-red-400">*</span>
          </label>
          <button
            ref={dropdownBtnRef}
            type="button"
            onClick={handleDropdownToggle}
            className="w-full border border-[#E2E8F0] px-3.5 py-2.5 text-[12px] font-semibold rounded-xl text-left flex justify-between items-center hover:border-[#00A86B] focus:outline-none focus:border-[#00A86B] transition-all bg-[#F8FAFC]"
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

            {action === 'RE-ATTEMPT' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#475569]">
                    Scheduled Delivery Date <span className="text-[#94A3B8] font-medium">(Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-[#E2E8F0] px-3 py-2 rounded-xl text-[12px] text-[#0F172A] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]/20 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#475569]">
                    Delivery Slot <span className="text-[#94A3B8] font-medium">(Optional)</span>
                  </label>
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
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#475569] flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-[#00A86B]" /> Contact Number <span className="text-[#94A3B8] font-medium">(Optional)</span>
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
              </>
            )}

            {action === 'CHANGE_ADDRESS' && (
              <div className="border border-[#00A86B]/25 rounded-xl p-4 bg-[#F0FDF4] flex flex-col gap-3">
                <p className="text-[11px] font-bold text-[#00A86B] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> New Delivery Address
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <Field
                    label="Customer Name *"
                    value={address.customer_name}
                    onChange={(e: any) => setAddress({ ...address, customer_name: e.target.value })}
                    placeholder="Full name"
                  />
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#475569] flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-[#00A86B]" />Contact Number
                    </label>
                    <input
                      type="text"
                      value={mobile}
                      onChange={e => setMobile(e.target.value)}
                      placeholder="New phone"
                      maxLength={10}
                      className="w-full border border-[#E2E8F0] px-3 py-2 text-[12px] text-[#0F172A] rounded-lg focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]/20 transition-all placeholder:text-[#94A3B8]"
                    />
                  </div>
                </div>
                <Field
                  label="Address Line 1 *"
                  value={address.address1}
                  onChange={(e: any) => setAddress({ ...address, address1: e.target.value })}
                  placeholder="House / Flat, Street"
                />
                <Field
                  label="Address Line 2"
                  value={address.address2}
                  onChange={(e: any) => setAddress({ ...address, address2: e.target.value })}
                  placeholder="Area, Landmark (optional)"
                />
                <div className="grid grid-cols-3 gap-2">
                  <Field label="City" value={address.city} onChange={(e: any) => setAddress({ ...address, city: e.target.value })} placeholder="City" />
                  <Field label="State" value={address.state} onChange={(e: any) => setAddress({ ...address, state: e.target.value })} placeholder="State" />
                  <Field label="Pincode" value={address.pincode} onChange={(e: any) => setAddress({ ...address, pincode: e.target.value })} placeholder="Pincode" />
                </div>
              </div>
            )}
          </div>
        )}

        {!action && <div className="flex-1" />}

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
          <button
            onClick={onClose}
            className="h-9 px-4 bg-white border border-[#E2E8F0] text-[#475569] font-bold text-[12px] rounded-xl hover:bg-[#F1F5F9] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !action}
            className={`h-9 px-5 text-white font-bold text-[12px] rounded-xl transition-all flex items-center gap-2 ${loading || !action ? 'bg-[#CBD5E1] cursor-not-allowed' : 'bg-[#00A86B] hover:bg-[#009B63] shadow-sm'}`}
          >
            {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {loading ? 'Submitting…' : `Submit for ${selectedOrders.length}`}
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
