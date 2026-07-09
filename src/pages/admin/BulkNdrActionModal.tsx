import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

const ACTIONS = [
  { label: 'Re-attempt', value: 'RE-ATTEMPT' },
  { label: 'Change Address', value: 'CHANGE_ADDRESS' },
  { label: 'Return to Origin (RTO)', value: 'RTO' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedOrders: string[];
  onRefresh: () => void;
}

export function BulkNdrActionModal({ isOpen, onClose, selectedOrders, onRefresh }: Props) {
  const [action, setAction] = useState('');
  const [remarks, setRemarks] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [deliverySlot, setDeliverySlot] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState({ address1: '', address2: '', customer_name: '', city: '', state: '', pincode: '' });
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [toast, setToast] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false); };
    if (dropdownOpen) window.addEventListener('click', fn);
    return () => window.removeEventListener('click', fn);
  }, [dropdownOpen]);

  if (!isOpen) return null;

  const notify = (msg: string, type = 'info') => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const validate = () => {
    if (!action) { notify('Please select an action.'); return false; }
    if (!remarks.trim()) { notify('Please enter remarks.'); return false; }
    if (action === 'CHANGE_ADDRESS') {
      if (!address.customer_name.trim()) { notify('Customer name required.'); return false; }
      if (!address.address1.trim()) { notify('Address Line 1 required.'); return false; }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!selectedOrders.length) { notify('No shipments selected.'); return; }
    if (!validate()) return;

    const payloads = selectedOrders.map(orderId => {
      const p: any = { orderId, action, remarks };
      if (action === 'CHANGE_ADDRESS') { Object.assign(p, { ...address, phone: mobile }); }
      if (action === 'RE-ATTEMPT') { p.scheduled_delivery_date = scheduledDate; p.deliverySlot = deliverySlot; p.phone = mobile; }
      return p;
    });

    setLoading(true);
    try {
      const res = await apiClient.post('/ndr/bulk', { payloads });
      notify(res.data?.message || 'Bulk NDR completed');
      onClose();
      onRefresh();
    } catch (err: any) {
      notify(err?.response?.data?.message || 'Bulk NDR failed');
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[92vh] overflow-hidden border border-[#E2E8F0] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
          <div>
            <h2 className="text-[14px] font-bold text-[#0F172A]">Bulk NDR Action</h2>
            <p className="text-[11px] text-[#64748B] mt-0.5">Selected Shipments: <span className="font-bold text-[#0F172A]">{selectedOrders.length}</span></p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* Action dropdown */}
          <div className="relative" ref={dropdownRef}>
            <label className="text-[11px] font-bold text-[#475569] block mb-1">Instruction</label>
            <button onClick={() => setDropdownOpen(p => !p)}
              className="w-full border border-[#E2E8F0] px-3 py-2.5 rounded-lg flex justify-between items-center text-[12px] font-semibold text-[#0F172A] bg-[#F8FAFC] hover:bg-white transition-all">
              <span className={action ? 'text-[#0F172A]' : 'text-[#94A3B8]'}>{ACTIONS.find(a => a.value === action)?.label || 'Select Instruction'}</span>
              <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
              <ul className="absolute left-0 right-0 border border-[#E2E8F0] rounded-xl shadow-lg bg-white mt-1 text-[12px] z-20 overflow-hidden">
                {ACTIONS.map(opt => (
                  <li key={opt.value} className="px-4 py-2.5 hover:bg-[#F8FAFC] cursor-pointer font-semibold text-[#475569] hover:text-[#00A86B] transition-colors"
                    onClick={() => { setAction(opt.value); setDropdownOpen(false); }}>
                    {opt.label}
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

          {/* Re-attempt date */}
          {action === 'RE-ATTEMPT' && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#475569]">Scheduled Delivery Date <span className="text-[#94A3B8]">(Optional)</span></label>
              <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
                className="w-full border border-[#E2E8F0] px-3 py-2 rounded-lg text-[12px] text-[#0F172A] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]/20 transition-all" />
            </div>
          )}

          {/* Change address */}
          {action === 'CHANGE_ADDRESS' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Customer Name *" value={address.customer_name} onChange={(e: any) => setAddress({ ...address, customer_name: e.target.value })} placeholder="Full Name" />
                <Field label="Contact Number" value={mobile} onChange={(e: any) => setMobile(e.target.value)} placeholder="New Phone" />
              </div>
              <Field label="Address Line 1 *" value={address.address1} onChange={(e: any) => setAddress({ ...address, address1: e.target.value })} placeholder="House/Flat, Street" />
              <Field label="Address Line 2" value={address.address2} onChange={(e: any) => setAddress({ ...address, address2: e.target.value })} placeholder="Area, Landmark" />
              <div className="grid grid-cols-3 gap-2">
                <Field label="City" value={address.city} onChange={(e: any) => setAddress({ ...address, city: e.target.value })} placeholder="City" />
                <Field label="State" value={address.state} onChange={(e: any) => setAddress({ ...address, state: e.target.value })} placeholder="State" />
                <Field label="Pincode" value={address.pincode} onChange={(e: any) => setAddress({ ...address, pincode: e.target.value })} placeholder="Pincode" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#475569] font-bold text-[12px] rounded-lg hover:bg-[#F8FAFC] transition-all">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="px-4 py-2 bg-[#00A86B] text-white font-bold text-[12px] rounded-lg hover:bg-[#009B63] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[300] bg-[#1E293B] text-white px-5 py-3 rounded-xl shadow-2xl text-[13px] font-medium">{toast}</div>
      )}
    </div>,
    document.body
  );
}
