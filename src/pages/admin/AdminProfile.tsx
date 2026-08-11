import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
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
  Pencil,
  X,
  Upload,
  Trash2,
  ChevronDown,
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

const TXT = {
  title: 'text-[14px] font-semibold',
  label: 'text-[12px] font-semibold',
  value: 'text-[12px] font-normal',
  meta: 'text-[10px] font-semibold',
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 md:gap-1 py-2.5 md:py-0 border-b border-[#F1F5F9] md:border-0 last:border-b-0">
      <span className={`${TXT.label} text-[#94A3B8]`}>{label}</span>
      <span className={`${TXT.value} text-[#1E293B] break-words`}>{value}</span>
    </div>
  );
}

function SectionCard({ icon: Icon, title, children, action }: { icon: any; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl md:rounded-[12px] px-2 py-3.5 md:p-5 shadow-sm md:shadow-none">
      <div className="flex items-center justify-between mb-3 md:mb-4 gap-2">
        <h3 className="text-[13px] md:text-[14px] font-semibold text-[#0F172A] flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-[#F0FDF4] md:bg-transparent flex items-center justify-center shrink-0">
            <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#00A86B] md:text-[#64748B]" />
          </span>
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Shared modal wrapper — bottom sheet on mobile, centered dialog on desktop ──
function ModalWrap({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 md:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-[20px] md:rounded-[12px] shadow-xl w-full md:max-w-md relative max-h-[88vh] md:max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full bg-[#E2E8F0]" />
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 md:py-4 border-b border-[#E2E8F0] shrink-0">
      <h3 className="text-[15px] md:text-[14px] font-semibold text-[#0F172A]">{title}</h3>
      <button onClick={onClose} className="w-8 h-8 rounded-lg border border-[#E2E8F0] md:border-0 flex items-center justify-center text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function ModalInput({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1">
      <label className={`${TXT.label} text-[#64748B]`}>{label}</label>
      <input
        {...props}
        className={`border border-[#E2E8F0] rounded-[8px] px-3 py-2 ${TXT.value} text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/40 focus:border-[#00A86B] transition-colors disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] ${props.className || ''}`}
      />
    </div>
  );
}

function ModalTextarea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="flex flex-col gap-1">
      <label className={`${TXT.label} text-[#64748B]`}>{label}</label>
      <textarea
        {...props}
        rows={3}
        className={`border border-[#E2E8F0] rounded-[8px] px-3 py-2 ${TXT.value} text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/40 focus:border-[#00A86B] transition-colors resize-none ${props.className || ''}`}
      />
    </div>
  );
}

function ModalActions({ onClose, onSave, saving, saveLabel = 'Save' }: {
  onClose: () => void; onSave?: () => void; saving?: boolean; saveLabel?: string;
}) {
  return (
    <div className="flex justify-end gap-2.5 md:gap-3 px-5 py-3.5 md:py-4 border-t border-[#E2E8F0] shrink-0 pb-[calc(0.875rem+env(safe-area-inset-bottom))] md:pb-4">
      <button onClick={onClose} className={`${TXT.label} text-[#64748B] px-4 h-10 md:h-auto md:py-2 rounded-[8px] border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors`}>
        Cancel
      </button>
      {onSave && (
        <button onClick={onSave} disabled={saving} className={`${TXT.label} text-white px-4 h-10 md:h-auto md:py-2 flex-1 md:flex-none rounded-[8px] bg-[#00A86B] hover:bg-[#008F5C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}>
          {saving ? 'Saving…' : saveLabel}
        </button>
      )}
    </div>
  );
}

// ─── Bank Edit Modal ─────────────────────────────────────────────────────────
function BankEditModal({ userId, onClose, onSuccess }: { userId: string; onClose: () => void; onSuccess: () => void }) {
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [verified, setVerified] = useState<{ bankName: string; branchName: string; nameAtBank: string; city: string } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast: _t, showToast } = useToast();

  useEffect(() => {
    apiClient.get('/getKyc/getBankAccount', { params: { id: userId } })
      .then(res => {
        const d = res.data;
        setAccountNumber(d.accountNumber || '');
        setIfsc(d.ifsc || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const handleVerify = async () => {
    if (!accountNumber || !ifsc) { showToast('error', 'Enter account number and IFSC'); return; }
    setVerifying(true);
    try {
      const res = await apiClient.post('/merchant/verfication/bank-account', { accountNo: accountNumber, ifsc }, { params: { id: userId } });
      if (res.data.success) {
        const d = res.data.data;
        setVerified({ bankName: d.bank, branchName: d.branch, nameAtBank: d.nameAtBank, city: d.city });
        showToast('success', 'Bank account verified successfully!');
        setTimeout(() => { onSuccess(); onClose(); }, 1000);
      } else {
        showToast('error', res.data.message || 'Verification failed');
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Error verifying bank account');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <ModalWrap onClose={onClose}>
      <Toast toast={_t} onClose={() => {}} />
      <ModalHeader title="Edit Bank Details" onClose={onClose} />
      <div className="px-5 py-4 flex flex-col gap-3 overflow-y-auto min-h-0">
        {loading ? (
          <p className={`${TXT.value} text-[#94A3B8]`}>Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <ModalInput label="Account Number" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Enter account number" />
              <ModalInput label="IFSC Code" value={ifsc} onChange={e => setIfsc(e.target.value.toUpperCase())} placeholder="Enter IFSC" />
            </div>
            <button
              onClick={handleVerify}
              disabled={!accountNumber || !ifsc || verifying}
              className={`${TXT.label} text-white px-4 py-2 rounded-[8px] w-full bg-[#00A86B] hover:bg-[#008F5C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {verifying ? 'Verifying…' : 'Verify & Save'}
            </button>
            {verified && (
              <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-[8px] p-3 grid grid-cols-2 gap-2">
                <Field label="Bank" value={verified.bankName} />
                <Field label="Branch" value={verified.branchName} />
                <Field label="Account Holder" value={verified.nameAtBank} />
                <Field label="City" value={verified.city} />
              </div>
            )}
          </>
        )}
      </div>
    </ModalWrap>
  );
}

// ─── Aadhaar Edit Modal ──────────────────────────────────────────────────────
function AadhaarEditModal({ userId, onClose, onSuccess }: { userId: string; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ aadhaarNumber: '', name: '', address: '', city: '', state: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast: _t, showToast } = useToast();

  useEffect(() => {
    apiClient.get('/getKyc/getAadhaar', { params: { id: userId } })
      .then(res => {
        const d = res.data?.data;
        if (d) setForm({ aadhaarNumber: d.aadhaarNumber || '', name: d.name || '', address: d.address || '', city: d.city || '', state: d.state || '' });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSave = async () => {
    if (!form.aadhaarNumber || !form.name) { showToast('error', 'Aadhaar number and name are required'); return; }
    setSaving(true);
    try {
      const res = await apiClient.post('/merchant/verfication/updateAadhaar', form, { params: { id: userId } });
      if (res.data.success) {
        showToast('success', 'Aadhaar details updated successfully!');
        onSuccess();
        onClose();
      } else {
        showToast('error', res.data.message || 'Update failed');
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Error updating Aadhaar details');
    } finally {
      setSaving(false);
    }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <ModalWrap onClose={onClose}>
      <Toast toast={_t} onClose={() => {}} />
      <ModalHeader title="Update Aadhaar Details" onClose={onClose} />
      <div className="px-5 py-4 flex flex-col gap-3 overflow-y-auto min-h-0">
        {loading ? <p className={`${TXT.value} text-[#94A3B8]`}>Loading…</p> : (
          <>
            <ModalInput label="Aadhaar Number" value={form.aadhaarNumber} onChange={set('aadhaarNumber')} placeholder="12-digit Aadhaar number" maxLength={12} />
            <ModalInput label="Name" value={form.name} onChange={set('name')} placeholder="Name on Aadhaar" />
            <ModalTextarea label="Address" value={form.address} onChange={set('address')} placeholder="Full address" />
            <div className="grid grid-cols-2 gap-3">
              <ModalInput label="City" value={form.city} onChange={set('city')} placeholder="City" />
              <ModalInput label="State" value={form.state} onChange={set('state')} placeholder="State" />
            </div>
          </>
        )}
      </div>
      <ModalActions onClose={onClose} onSave={loading ? undefined : handleSave} saving={saving} />
    </ModalWrap>
  );
}

// ─── COD Cycle Modal ─────────────────────────────────────────────────────────
const COD_PLANS = [
  { name: 'D+2', amount: 0.99, label: 'D + 2 Days' },
  { name: 'D+3', amount: 0.69, label: 'D + 3 Days' },
  { name: 'D+4', amount: 0.49, label: 'D + 4 Days' },
];
const COD_CYCLES = ['D+1', 'D+2', 'D+3', 'D+4', 'D+5', 'D+6'];
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function CODModal({ userId, onClose, onSuccess }: { userId: string; onClose: () => void; onSuccess: () => void }) {
  const [currentPlan, setCurrentPlan] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [customPlan, setCustomPlan] = useState({ planName: 'D+1', codCharge: '', remittanceDay: ['Monday'] });
  const [activating, setActivating] = useState('');
  const [saving, setSaving] = useState(false);
  const [existingData, setExistingData] = useState<any>(null);
  const { toast: _t, showToast } = useToast();

  useEffect(() => {
    apiClient.get('/cod/CheckCodplan', { params: { id: userId } })
      .then(res => { setCurrentPlan(String(res.data.codplaneName || '')); setExistingData(res.data); })
      .catch(() => {});
  }, [userId]);

  const handleActivate = async (planName: string, codAmount: number) => {
    setActivating(planName);
    try {
      await apiClient.post('/cod/codPlanUpdate', { planName, codAmount }, { params: { id: userId } });
      showToast('success', `${planName} plan activated!`);
      setCurrentPlan(planName);
      onSuccess();
    } catch {
      showToast('error', 'Failed to activate plan');
    } finally {
      setActivating('');
    }
  };

  const handleCustomSave = async () => {
    if (!customPlan.codCharge) { showToast('error', 'Enter COD charge percentage'); return; }
    if (!customPlan.remittanceDay.length) { showToast('error', 'Select at least one remittance day'); return; }
    setSaving(true);
    try {
      await apiClient.post('/cod/saveCustomCodPlan', {
        planName: customPlan.planName,
        codCharge: Number(customPlan.codCharge),
        remittanceDay: customPlan.remittanceDay,
      }, { params: { id: userId } });
      showToast('success', 'Custom COD plan saved!');
      setCurrentPlan(customPlan.planName);
      onSuccess();
      onClose();
    } catch {
      showToast('error', 'Failed to save custom plan');
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: string) => {
    setCustomPlan(p => ({
      ...p,
      remittanceDay: p.remittanceDay.includes(day)
        ? p.remittanceDay.filter(d => d !== day)
        : [...p.remittanceDay, day],
    }));
  };

  return (
    <ModalWrap onClose={onClose}>
      <Toast toast={_t} onClose={() => {}} />
      <ModalHeader title={showCustom ? 'Custom COD Plan' : 'Update COD Cycle'} onClose={onClose} />
      <div className="px-5 py-4 overflow-y-auto min-h-0">
        {showCustom ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className={`${TXT.label} text-[#64748B]`}>COD Cycle</label>
              <div className="relative">
                <select
                  value={customPlan.planName}
                  onChange={e => setCustomPlan(p => ({ ...p, planName: e.target.value }))}
                  className={`w-full border border-[#E2E8F0] rounded-[8px] px-3 py-2 ${TXT.value} text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/40 focus:border-[#00A86B] appearance-none bg-white`}
                >
                  {COD_CYCLES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
              </div>
            </div>
            <ModalInput label="COD Charge (%)" type="number" min="0" step="0.01" value={customPlan.codCharge} onChange={e => setCustomPlan(p => ({ ...p, codCharge: e.target.value }))} placeholder="e.g. 1.5" />
            <div className="flex flex-col gap-2">
              <label className={`${TXT.label} text-[#64748B]`}>Remittance Days</label>
              <div className="grid grid-cols-2 gap-1.5">
                {DAYS_OF_WEEK.map(day => {
                  const sel = customPlan.remittanceDay.includes(day);
                  return (
                    <button key={day} type="button" onClick={() => toggleDay(day)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-[8px] border ${TXT.value} transition-colors ${sel ? 'border-[#00A86B] bg-[#ECFDF5] text-[#00A86B]' : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'}`}
                    >
                      <span className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center flex-shrink-0 ${sel ? 'border-[#00A86B] bg-[#00A86B]' : 'border-[#CBD5E1]'}`}>
                        {sel && <span className="text-white" style={{ fontSize: 8, lineHeight: 1 }}>✓</span>}
                      </span>
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <button onClick={() => setShowCustom(false)} className={`${TXT.label} text-[#64748B] px-4 py-2 rounded-[8px] border border-[#E2E8F0] hover:bg-[#F8FAFC]`}>Back</button>
              <button onClick={handleCustomSave} disabled={saving} className={`${TXT.label} text-white px-4 py-2 rounded-[8px] bg-[#00A86B] hover:bg-[#008F5C] disabled:opacity-50`}>
                {saving ? 'Saving…' : 'Save Custom Plan'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2">
              {COD_PLANS.map(plan => {
                const isActive = currentPlan === plan.name;
                return (
                  <div key={plan.name} className={`p-3 rounded-[10px] border flex flex-col gap-1.5 ${isActive ? 'border-[#00A86B] bg-[#ECFDF5]' : 'border-[#E2E8F0] bg-white'}`}>
                    {plan.name === 'D+2' && <span className={`${TXT.meta} bg-amber-400 text-white px-1.5 py-0.5 rounded w-fit`}>BEST</span>}
                    <p className={`${TXT.label} text-[#0F172A]`}>{plan.label}</p>
                    <p className={`${TXT.value} text-[#64748B]`}>{plan.amount}% of COD</p>
                    <button
                      onClick={() => !isActive && handleActivate(plan.name, plan.amount)}
                      disabled={isActive || !!activating}
                      className={`w-full py-1.5 rounded-[6px] ${TXT.meta} transition-colors ${isActive ? 'bg-[#E2E8F0] text-[#94A3B8] cursor-default' : 'bg-[#00A86B] text-white hover:bg-[#008F5C] disabled:opacity-50'}`}
                    >
                      {activating === plan.name ? 'Activating…' : isActive ? 'Active' : 'Activate'}
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => {
                if (existingData?.isCustom) {
                  setCustomPlan({ planName: existingData.codplaneName || 'D+1', codCharge: String(existingData.planCharges ?? ''), remittanceDay: Array.isArray(existingData.remittanceDay) ? existingData.remittanceDay : [existingData.remittanceDay || 'Monday'] });
                }
                setShowCustom(true);
              }}
              className={`${TXT.label} w-full py-2 rounded-[8px] border border-[#00A86B] text-[#00A86B] hover:bg-[#ECFDF5] transition-colors`}
            >
              Custom Plan
            </button>
          </div>
        )}
      </div>
    </ModalWrap>
  );
}

// ─── Assign Rate Card Modal ──────────────────────────────────────────────────
function AssignRateCardModal({ userId, userName, rateCardType, onClose, onSuccess }: {
  userId: string; userName: string; rateCardType: 'B2C' | 'B2B'; onClose: () => void; onSuccess: () => void;
}) {
  const [planNames, setPlanNames] = useState<string[]>([]);
  const [rateCards, setRateCards] = useState<any[]>([]);
  const [selected, setSelected] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast: _t, showToast } = useToast();
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const planEndpoint = rateCardType === 'B2C' ? '/saveRate/getPlanNames' : '/b2b/saveRate/getPlanNames';
    const rcEndpoint = rateCardType === 'B2C' ? '/saveRate/getRateCard' : '/b2b/saveRate/getRateCard';
    Promise.all([
      apiClient.get(planEndpoint),
      apiClient.get(rcEndpoint),
    ]).then(([pRes, rcRes]) => {
      setPlanNames(pRes.data.planNames || []);
      setRateCards(rateCardType === 'B2C' ? (rcRes.data.rateCards || []) : (rcRes.data.B2BRateCard || []));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [rateCardType]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAssign = async () => {
    if (!selected) { showToast('error', 'Please select a plan'); return; }
    setSaving(true);
    try {
      const filtered = rateCardType === 'B2C'
        ? rateCards.filter(c => c.plan === selected)
        : rateCards.filter(c => c.planName === selected);

      if (!filtered.length) { showToast('error', 'No rate cards found for selected plan'); setSaving(false); return; }

      if (rateCardType === 'B2C') {
        await apiClient.put('/users/assignPlan', { userId, userName, planName: selected, rateCards: filtered });
      } else {
        await apiClient.put('/users/assign/plan', { userId, userName, planName: selected, B2BRateCard: filtered });
      }
      showToast('success', 'Plan assigned successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Failed to assign plan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalWrap onClose={onClose}>
      <Toast toast={_t} onClose={() => {}} />
      <ModalHeader title={`Assign ${rateCardType} Rate Card Plan`} onClose={onClose} />
      <div className="px-5 py-4 flex flex-col gap-3 overflow-y-auto min-h-0">
        <p className={`${TXT.value} text-[#64748B]`}>User: <span className="font-semibold text-[#0F172A]">{userName}</span></p>
        {loading ? <p className={`${TXT.value} text-[#94A3B8]`}>Loading plans…</p> : (
          <div ref={dropRef} className="relative">
            <button
              onClick={() => setOpen(o => !o)}
              className={`w-full flex items-center justify-between border border-[#E2E8F0] rounded-[8px] px-3 py-2 ${TXT.value} text-[#1E293B] bg-white hover:border-[#00A86B] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/40 transition-colors`}
            >
              <span>{selected || 'Select a plan…'}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#94A3B8] transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
              <div className="absolute z-10 top-full mt-1 w-full bg-white border border-[#E2E8F0] rounded-[8px] shadow-lg max-h-48 overflow-y-auto">
                {planNames.map(p => (
                  <button key={p} type="button" onClick={() => { setSelected(p); setOpen(false); }}
                    className={`w-full text-left px-3 py-2 ${TXT.value} transition-colors ${selected === p ? 'bg-[#ECFDF5] text-[#00A86B] font-semibold' : 'text-[#374151] hover:bg-[#F8FAFC]'}`}
                  >{p}</button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <ModalActions onClose={onClose} onSave={loading ? undefined : handleAssign} saving={saving} saveLabel="Assign" />
    </ModalWrap>
  );
}

// ─── Upload Rate Card Modal ──────────────────────────────────────────────────
function UploadRateCardModal({ userId, planName, onClose, onSuccess }: {
  userId: string; planName: string; onClose: () => void; onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast: _t, showToast } = useToast();

  const handleDownloadSample = async () => {
    try {
      const res = await apiClient.get('/saveRate/download-excel', { params: { hidePlan: 'true' }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'Rate_Card_Sample.xlsx';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch { showToast('error', 'Failed to download sample'); }
  };

  const handleUpload = async () => {
    if (!file) { showToast('error', 'Please select a file'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('plan', planName);
      formData.append('replaceExisting', 'true');
      formData.append('userId', userId);
      const res = await apiClient.post('/saveRate/uploadRatecard', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const { message, errors } = res.data;
      if (errors?.length) {
        showToast('error', `${message} — top error: ${errors[0]}`);
      } else {
        showToast('success', message || 'Upload successful');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.error || err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ModalWrap onClose={onClose}>
      <Toast toast={_t} onClose={() => {}} />
      <ModalHeader title="Upload Rate Card" onClose={onClose} />
      <div className="px-5 py-4 flex flex-col gap-4 overflow-y-auto min-h-0">
        <div className="flex items-center justify-between bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-3 py-2">
          <span className={`${TXT.value} text-[#64748B]`}>Need the template?</span>
          <button onClick={handleDownloadSample} className={`${TXT.label} text-[#00A86B] flex items-center gap-1.5 hover:underline`}>
            <Download className="w-3.5 h-3.5" /> Download Sample
          </button>
        </div>
        <div
          className={`border-2 border-dashed rounded-[10px] p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${file ? 'border-[#00A86B] bg-[#ECFDF5]/30' : 'border-[#E2E8F0] hover:border-[#00A86B] hover:bg-[#F8FAFC]'}`}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className={`w-6 h-6 mb-2 ${file ? 'text-[#00A86B]' : 'text-[#CBD5E1]'}`} />
          <span className={`${TXT.label} text-[#64748B]`}>{file ? 'Change File' : 'Choose Excel File (.xlsx, .xls)'}</span>
          <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
        </div>
        {file && (
          <div className="flex items-center gap-3 bg-white border border-[#E2E8F0] rounded-[8px] p-3">
            <FileText className="w-4 h-4 text-[#00A86B] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className={`${TXT.label} text-[#0F172A] truncate`}>{file.name}</p>
              <p className={`${TXT.meta} text-[#94A3B8]`}>{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button onClick={() => setFile(null)} className="text-[#94A3B8] hover:text-[#EF4444] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      <ModalActions onClose={onClose} onSave={handleUpload} saving={uploading} saveLabel="Confirm & Upload" />
    </ModalWrap>
  );
}

// ─── Credit Limit Modal ──────────────────────────────────────────────────────
function CreditLimitModal({ userId, currentValue, onClose, onSuccess }: {
  userId: string; currentValue: string; onClose: () => void; onSuccess: () => void;
}) {
  const [value, setValue] = useState(currentValue || '0');
  const [saving, setSaving] = useState(false);
  const { toast: _t, showToast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/user/updateCreditLimit', { userId, creditLimit: Number(value) });
      showToast('success', 'Credit limit updated!');
      onSuccess();
      onClose();
    } catch {
      showToast('error', 'Failed to update credit limit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalWrap onClose={onClose}>
      <Toast toast={_t} onClose={() => {}} />
      <ModalHeader title="Update Credit Limit" onClose={onClose} />
      <div className="px-5 py-4 overflow-y-auto min-h-0">
        <ModalInput label="Credit Limit (₹)" type="number" min="0" value={value} onChange={e => setValue(e.target.value)} placeholder="Enter credit limit" />
      </div>
      <ModalActions onClose={onClose} onSave={handleSave} saving={saving} />
    </ModalWrap>
  );
}

// ─── Referral Commission Modal ───────────────────────────────────────────────
function ReferralCommissionModal({ userId, currentValue, onClose, onSuccess }: {
  userId: string; currentValue: string; onClose: () => void; onSuccess: () => void;
}) {
  const [value, setValue] = useState(currentValue?.replace('%', '') || '0');
  const [saving, setSaving] = useState(false);
  const { toast: _t, showToast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.post('/user/updateReferralCommission', { userId, referralCommissionPercentage: Number(value) });
      showToast('success', 'Referral commission updated!');
      onSuccess();
      onClose();
    } catch {
      showToast('error', 'Failed to update referral commission');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalWrap onClose={onClose}>
      <Toast toast={_t} onClose={() => {}} />
      <ModalHeader title="Update Referral Commission" onClose={onClose} />
      <div className="px-5 py-4 overflow-y-auto min-h-0">
        <ModalInput label="Commission (%)" type="number" min="0" max="100" step="0.1" value={value} onChange={e => setValue(e.target.value)} placeholder="Enter commission %" />
      </div>
      <ModalActions onClose={onClose} onSave={handleSave} saving={saving} />
    </ModalWrap>
  );
}

// ─── KAM Details Modal ───────────────────────────────────────────────────────
function KAMModal({ userId, onClose, onSuccess }: { userId: string; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ kamName: '', kamEmail: '', kamPhone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast: _t, showToast } = useToast();

  useEffect(() => {
    apiClient.get(`/user/getKamDetails/${userId}`)
      .then(res => { const d = res.data; setForm({ kamName: d.kamName || '', kamEmail: d.kamEmail || '', kamPhone: d.kamPhone || '' }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put(`/user/updateKamDetails/${userId}`, form);
      showToast('success', 'KAM details updated!');
      onSuccess();
      onClose();
    } catch {
      showToast('error', 'Failed to update KAM details');
    } finally {
      setSaving(false);
    }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <ModalWrap onClose={onClose}>
      <Toast toast={_t} onClose={() => {}} />
      <ModalHeader title="Update KAM Details" onClose={onClose} />
      <div className="px-5 py-4 flex flex-col gap-3 overflow-y-auto min-h-0">
        {loading ? <p className={`${TXT.value} text-[#94A3B8]`}>Loading…</p> : (
          <>
            <ModalInput label="KAM Name" value={form.kamName} onChange={set('kamName')} placeholder="Account manager name" />
            <ModalInput label="KAM Email" type="email" value={form.kamEmail} onChange={set('kamEmail')} placeholder="Account manager email" />
            <ModalInput label="KAM Phone" value={form.kamPhone} onChange={set('kamPhone')} placeholder="Account manager phone" />
          </>
        )}
      </div>
      <ModalActions onClose={onClose} onSave={loading ? undefined : handleSave} saving={saving} />
    </ModalWrap>
  );
}

// ─── Change Password Modal ───────────────────────────────────────────────────
function ChangePasswordModal({ email, onClose, onSuccess }: { email: string; onClose: () => void; onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast: _t, showToast } = useToast();

  const handleSave = async () => {
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      await apiClient.post('/external/changePasswordAdmin', { email, newPassword: password });
      showToast('success', 'Password updated successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalWrap onClose={onClose}>
      <Toast toast={_t} onClose={() => {}} />
      <ModalHeader title="Change Password" onClose={onClose} />
      <div className="px-5 py-4 flex flex-col gap-3 overflow-y-auto min-h-0">
        <p className={`${TXT.value} text-[#64748B]`}>Account: <span className="font-semibold text-[#0F172A]">{email}</span></p>
        <div className="flex flex-col gap-1">
          <label className={`${TXT.label} text-[#64748B]`}>New Password</label>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); if (e.target.value.length >= 8) setError(''); }}
            placeholder="Minimum 8 characters"
            className={`border rounded-[8px] px-3 py-2 ${TXT.value} text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/40 focus:border-[#00A86B] transition-colors ${error ? 'border-[#EF4444]' : 'border-[#E2E8F0]'}`}
          />
          {error && <span className={`${TXT.meta} text-[#EF4444]`}>{error}</span>}
        </div>
      </div>
      <ModalActions onClose={onClose} onSave={handleSave} saving={saving} saveLabel="Update Password" />
    </ModalWrap>
  );
}

// ─── Small edit icon button ──────────────────────────────────────────────────
function EditBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="p-1.5 rounded-[6px] text-[#94A3B8] hover:text-[#00A86B] hover:bg-[#ECFDF5] transition-colors flex-shrink-0">
      <Pencil className="w-3.5 h-3.5" />
    </button>
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

  const { currentUserId, isAdmin, adminTab } = useAdminTab();
  const isAdminView = isAdmin && adminTab;
  const apiUser = location.state?.user;
  const mongoId = String(apiUser?.id || '');
  const effectiveId = mongoId || currentUserId;
  const isImpersonating = !!localStorage.getItem('admin_token_backup');

  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // Modal visibility
  const [showBankModal, setShowBankModal] = useState(false);
  const [showAadhaarModal, setShowAadhaarModal] = useState(false);
  const [showCODModal, setShowCODModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showKAMModal, setShowKAMModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [assignRateCardType, setAssignRateCardType] = useState<'B2C' | 'B2B'>('B2C');

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
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [rates, setRates] = useState<any[]>([]);
  const [rateLoading, setRateLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notificationSettings, setNotificationSettings] = useState({
    isAdminWhatsAppEnable: false,
    isAdminSMSEnable: false,
    isAdminEmailEnable: false,
  });
  const { toast, showToast: _showToast, closeToast } = useToast();
  const showToast = (type: 'success' | 'error', msg: string) => _showToast(type, msg);

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

  const refreshUser = () => {
    if (!effectiveId) return;
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
  };

  useEffect(() => {
    if (!effectiveId) return;
    refreshUser();

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

    apiClient.get('/notification/getNotification', { params: { userId: effectiveId } })
      .then(res => { if (res.data) setNotificationSettings(res.data); })
      .catch(() => {});

    fetchRates(effectiveId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveId]);

  const handleToggle = async () => {
    const currentActive = isActive;
    const newBlocked = currentActive;
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

  const handleDeleteRateCard = async (rateId: string) => {
    if (!window.confirm('Delete this rate card? This cannot be undone.')) return;
    setDeletingId(rateId);
    try {
      await apiClient.delete(`/saveRate/deleteRateCard/${rateId}`, { data: { userId: effectiveId } });
      showToast('success', 'Rate card deleted.');
      fetchRates(effectiveId);
    } catch {
      showToast('error', 'Failed to delete rate card.');
    } finally {
      setDeletingId(null);
    }
  };

  const Toggle = ({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) => (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-9 h-5 rounded-full transition-colors relative flex items-center shrink-0 ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${on ? 'bg-[#00A86B]' : 'bg-[#CBD5E1]'}`}
    >
      <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute transition-transform ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  );

  const isCompany = userData.gstin && userData.gstin !== '—';
  const userPlanName = userData.rateCard !== 'N/A' ? userData.rateCard : `${userData.name.replace(/\s+/g, '_')}_${userData.id}`;

  return (
    <AdminLayout>
      <Toast toast={toast} onClose={closeToast} />

      {/* Modals */}
      {showBankModal && <BankEditModal userId={effectiveId} onClose={() => setShowBankModal(false)} onSuccess={refreshUser} />}
      {showAadhaarModal && <AadhaarEditModal userId={effectiveId} onClose={() => setShowAadhaarModal(false)} onSuccess={refreshUser} />}
      {showCODModal && <CODModal userId={effectiveId} onClose={() => setShowCODModal(false)} onSuccess={refreshUser} />}
      {showAssignModal && <AssignRateCardModal userId={effectiveId} userName={userData.name} rateCardType={assignRateCardType} onClose={() => setShowAssignModal(false)} onSuccess={() => { refreshUser(); fetchRates(effectiveId); }} />}
      {showUploadModal && <UploadRateCardModal userId={effectiveId} planName={userPlanName} onClose={() => setShowUploadModal(false)} onSuccess={() => fetchRates(effectiveId)} />}
      {showCreditModal && <CreditLimitModal userId={effectiveId} currentValue={userData.creditLimit} onClose={() => setShowCreditModal(false)} onSuccess={refreshUser} />}
      {showReferralModal && <ReferralCommissionModal userId={effectiveId} currentValue={userData.referralCommission} onClose={() => setShowReferralModal(false)} onSuccess={refreshUser} />}
      {showKAMModal && <KAMModal userId={effectiveId} onClose={() => setShowKAMModal(false)} onSuccess={refreshUser} />}
      {showPasswordModal && <ChangePasswordModal email={userData.email} onClose={() => setShowPasswordModal(false)} onSuccess={() => {}} />}

      {/* ── Mobile hero header — distinct from desktop sidebar: gradient banner + overlapping avatar ── */}
      <div className="md:hidden -m-4 bg-white border-b border-[#E2E8F0]">
        <div className="flex items-center justify-between px-2 pt-3 pb-2">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#475569] bg-white active:bg-[#F8FAFC]">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-[13px] font-bold text-[#0F172A]">Profile</span>
          <div className="w-9 h-9" />
        </div>

        <div className="h-16 bg-gradient-to-r from-[#00A86B] to-[#007A4D] relative">
          <div className="absolute -bottom-8 left-2">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00A86B] to-[#007A4D] flex items-center justify-center border-4 border-white shadow-md overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[20px] font-semibold text-white leading-none select-none">
                    {(userData.name || '?').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-6 h-6 bg-white border border-[#E2E8F0] rounded-full flex items-center justify-center shadow-sm active:bg-[#F8FAFC]"
                title="Change profile image"
              >
                <Camera className="w-3 h-3 text-[#64748B]" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-9 pb-3 px-2">
          <h1 className="text-[15px] font-bold text-[#0F172A] truncate">{userData.name}</h1>
          <p className="text-[12px] text-[#64748B] truncate">{userData.email}</p>

          <div className="flex items-center gap-1.5 flex-wrap mt-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isActive ? 'text-[#00A86B] border-[#A7F3D0] bg-[#ECFDF5]' : 'text-[#EF4444] border-[#FECACA] bg-[#FEF2F2]'}`}>
              {isActive ? 'ACTIVE' : 'BLOCKED'}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isKycVerified ? 'text-[#10B981] border-[#A7F3D0] bg-[#ECFDF5]' : 'text-[#F59E0B] border-[#FDE68A] bg-[#FFFBEB]'}`}>
              {isKycVerified ? 'KYC VERIFIED' : 'KYC PENDING'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-[#E2E8F0] text-[#64748B] bg-[#F8FAFC]">
              {isCompany ? 'BUSINESS' : 'INDIVIDUAL'}
            </span>
          </div>

          {/* Wallet + quick toggles row */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5">
              <p className="text-[10px] font-semibold text-[#94A3B8]">Balance</p>
              <p className="text-[13px] font-bold text-[#0F172A] mt-0.5 truncate">{userData.balance}</p>
            </div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5">
              <p className="text-[10px] font-semibold text-[#94A3B8]">On Hold</p>
              <p className="text-[13px] font-bold text-[#0F172A] mt-0.5 truncate">{fmtProfileCurrency(holdAmount)}</p>
            </div>
          </div>

          {isAdminView && (
            <div className="flex items-center gap-4 mt-3 px-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-[#475569]">Active</span>
                <Toggle on={isActive} onClick={handleToggle} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-[#475569]">KYC</span>
                <Toggle on={isKycVerified} onClick={handleKycToggle} />
              </div>
            </div>
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
      </div>

      <div className={`w-full -mx-4 px-2 md:-m-6 md:px-2 md:py-2 pt-4 pb-4 ${isImpersonating ? 'md:h-[calc(100vh-120px)]' : 'md:h-[calc(100vh-88px)]'} flex flex-col min-h-0 md:overflow-hidden`}>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 items-start flex-1 min-h-0">

          {/* ── Left Sidebar — desktop only; mobile uses the hero header above ── */}
          <div className="hidden lg:flex bg-white border border-[#E2E8F0] rounded-[12px] p-5 lg:sticky lg:top-0 flex-col gap-5 lg:max-h-full lg:overflow-y-auto no-scrollbar">
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
                <Toggle on={isActive} onClick={handleToggle} disabled={!isAdminView} />
              </div>
              <div className="flex items-center justify-between">
                <span className={`${TXT.label} text-[#475569]`}>KYC Verified</span>
                <Toggle on={isKycVerified} onClick={handleKycToggle} disabled={!isAdminView} />
              </div>
            </div>

            <div className="h-px bg-[#E2E8F0]" />

            <Field label="Joined" value={userData.regDate} />
          </div>

          {/* ── Right Content — tabs ── */}
          <div className="flex flex-col gap-3 md:gap-4 min-w-0 h-full min-h-0">
            {/* Tab bar — sticky segmented pills on mobile, inline row on desktop */}
            <div className="sticky top-0 z-10 md:static bg-[#F8FAFC] md:bg-white -mx-2 px-2 pt-2 pb-1 md:mx-0 md:px-1.5 md:py-1.5 md:border md:border-[#E2E8F0] md:rounded-[12px] shrink-0">
              <div className="flex items-center gap-1.5 md:gap-1 overflow-x-auto no-scrollbar bg-white md:bg-transparent border border-[#E2E8F0] md:border-0 rounded-full md:rounded-none p-1 md:p-0 shadow-sm md:shadow-none">
                {TABS.map(tab => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full md:rounded-[8px] text-[12px] font-semibold whitespace-nowrap transition-colors shrink-0 ${
                        active ? 'bg-[#00A86B] md:bg-[#ECFDF5] text-white md:text-[#00A86B]' : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pr-0.5">

            {/* ── Overview ── */}
            {activeTab === 'overview' && (
              <div className="flex flex-col gap-4">
                <SectionCard icon={LayoutGrid} title="Account Summary">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-0 md:gap-y-4">
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

                    {/* COD Cycle */}
                    <div className="flex flex-col gap-1">
                      <span className={`${TXT.label} text-[#94A3B8]`}>COD Cycle</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`${TXT.value} text-[#1E293B]`}>{userData.codPlan}</span>
                        {isAdminView && <EditBtn onClick={() => setShowCODModal(true)} />}
                      </div>
                    </div>

                    {/* B2C Rate Card */}
                    <div className="flex flex-col gap-1">
                      <span className={`${TXT.label} text-[#94A3B8]`}>B2C Rate Card Plan</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`${TXT.value} text-[#1E293B]`}>{userData.rateCard}</span>
                        {isAdminView && <EditBtn onClick={() => { setAssignRateCardType('B2C'); setShowAssignModal(true); }} />}
                      </div>
                    </div>

                    {/* B2B Rate Card */}
                    <div className="flex flex-col gap-1">
                      <span className={`${TXT.label} text-[#94A3B8]`}>B2B Rate Card Plan</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`${TXT.value} text-[#1E293B]`}>{userData.b2bRateCard}</span>
                        {isAdminView && <EditBtn onClick={() => { setAssignRateCardType('B2B'); setShowAssignModal(true); }} />}
                      </div>
                    </div>

                    {/* Credit Limit */}
                    <div className="flex flex-col gap-1">
                      <span className={`${TXT.label} text-[#94A3B8]`}>Credit Limit</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`${TXT.value} text-[#1E293B]`}>₹{userData.creditLimit}</span>
                        {isAdminView && <EditBtn onClick={() => setShowCreditModal(true)} />}
                      </div>
                    </div>

                    <Field label="Referral Code" value={userData.referralCode} />

                    {/* Referral Commission */}
                    <div className="flex flex-col gap-1">
                      <span className={`${TXT.label} text-[#94A3B8]`}>Referral Commission</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`${TXT.value} text-[#1E293B]`}>{userData.referralCommission}</span>
                        {isAdminView && <EditBtn onClick={() => setShowReferralModal(true)} />}
                      </div>
                    </div>

                    <Field label="Total Orders" value={String(userData.orderCount)} />

                    {/* Change Password */}
                    {isAdminView && (
                      <div className="flex flex-col gap-1">
                        <span className={`${TXT.label} text-[#94A3B8]`}>Password</span>
                        <button
                          onClick={() => setShowPasswordModal(true)}
                          className={`${TXT.value} text-[#00A86B] hover:underline flex items-center gap-1 w-fit`}
                        >
                          <Settings className="w-3.5 h-3.5" /> Change Password
                        </button>
                      </div>
                    )}
                  </div>
                </SectionCard>

                <SectionCard icon={MapPin} title="Address Details">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-0 md:gap-y-4">
                    <div className="col-span-2 md:col-span-3"><Field label="Address" value={userData.address} /></div>
                    <Field label="City" value={userData.city} />
                    <Field label="State" value={<span className="uppercase">{userData.state}</span>} />
                    <Field label="Pincode" value={userData.pincode} />
                    <Field label="Country" value={userData.country} />
                    <Field label="GSTIN" value={userData.gstin} />
                  </div>
                </SectionCard>

                <SectionCard
                  icon={ShieldCheck}
                  title="KAM Details"
                  action={isAdminView ? <EditBtn onClick={() => setShowKAMModal(true)} /> : undefined}
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-0 md:gap-y-4">
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
                <SectionCard
                  icon={IdCard}
                  title="Aadhar Details"
                  action={isAdminView ? <EditBtn onClick={() => setShowAadhaarModal(true)} /> : undefined}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0 md:gap-y-4">
                    <Field label="Name" value={userData.aadharName} />
                    <Field label="Aadhar Number" value={userData.aadhaar} />
                    <Field label="State" value={userData.aadharState} />
                    <Field label="Address" value={userData.aadharAddress} />
                  </div>
                </SectionCard>

                <SectionCard icon={FileText} title="PAN Details">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0 md:gap-y-4">
                    <Field label="PAN Number" value={userData.panNumber} />
                    <Field label="Name" value={userData.panName} />
                    <Field label="Type" value={userData.panType} />
                    <Field label="PAN Ref ID" value={userData.panRefId} />
                  </div>
                </SectionCard>

                <SectionCard icon={Building2} title="GST Details">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0 md:gap-y-4">
                    <Field label="GSTIN" value={userData.gstin} />
                    <Field label="Company Name" value={userData.business} />
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ── Bank & Payout ── */}
            {activeTab === 'bank' && (
              <SectionCard
                icon={Landmark}
                title="Bank Details"
                action={isAdminView ? <EditBtn onClick={() => setShowBankModal(true)} /> : undefined}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0 md:gap-y-4">
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
              <SectionCard icon={CreditCard} title="Rate Card Management">
                {/* Toolbar — wraps cleanly on mobile instead of squeezing into one row */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {isAdminView && (
                    <>
                      <button
                        onClick={() => { setAssignRateCardType('B2C'); setShowAssignModal(true); }}
                        className="flex-1 md:flex-none min-w-[110px] text-[12px] font-semibold text-[#00A86B] px-3 py-2 md:py-1.5 rounded-full md:rounded-lg border border-[#00A86B] hover:bg-[#ECFDF5] transition-colors text-center"
                      >
                        Assign B2C
                      </button>
                      <button
                        onClick={() => { setAssignRateCardType('B2B'); setShowAssignModal(true); }}
                        className="flex-1 md:flex-none min-w-[110px] text-[12px] font-semibold text-[#00A86B] px-3 py-2 md:py-1.5 rounded-full md:rounded-lg border border-[#00A86B] hover:bg-[#ECFDF5] transition-colors text-center"
                      >
                        Assign B2B
                      </button>
                      <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex-1 md:flex-none min-w-[110px] text-[12px] font-semibold text-white px-3 py-2 md:py-1.5 rounded-full md:rounded-lg bg-[#00A86B] hover:bg-[#008F5C] flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => fetchRates(effectiveId)}
                    className="text-[12px] font-semibold text-[#64748B] px-3 py-2 md:py-1.5 rounded-full md:rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors shrink-0 ml-auto md:ml-0"
                  >
                    Refresh
                  </button>
                </div>

                {/* Desktop — table */}
                <div className="hidden md:block overflow-x-auto border border-[#E2E8F0] rounded-[10px]">
                  <table className="w-full text-center border-collapse">
                    <thead>
                      <tr className="bg-[#E6F9F2] border-b border-[#E2E8F0]">
                        {['Provider', 'Service', 'Mode', 'Weight', 'Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E', 'COD', ...(isAdminView ? ['Action'] : [])].map(h => (
                          <th key={h} className={`px-3 py-2.5 ${TXT.label} text-[#64748B] whitespace-nowrap`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rateLoading ? (
                        <tr>
                          <td colSpan={isAdminView ? 11 : 10} className={`py-10 text-[#94A3B8] ${TXT.value}`}>Loading rate cards…</td>
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
                              {isAdminView && (
                                <td className={`px-3 py-2`} rowSpan={2}>
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => handleDeleteRateCard(card._id)}
                                      disabled={deletingId === card._id}
                                      className="text-[#94A3B8] hover:text-[#EF4444] transition-colors disabled:opacity-40"
                                      title="Delete rate card"
                                    >
                                      {deletingId === card._id ? (
                                        <span className={`${TXT.meta} text-[#94A3B8]`}>…</span>
                                      ) : (
                                        <Trash2 className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                </td>
                              )}
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
                          <td colSpan={isAdminView ? 11 : 10} className={`py-10 text-[#94A3B8] ${TXT.value}`}>No rate cards found for this user.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile — stacked rate cards */}
                <div className="md:hidden flex flex-col gap-2.5">
                  {rateLoading ? (
                    <p className="text-center text-[12px] text-[#94A3B8] py-10">Loading rate cards…</p>
                  ) : rates.length > 0 ? (
                    rates.map((card: any, i: number) => {
                      const zones = ['A', 'B', 'C', 'D', 'E'] as const;
                      return (
                        <div key={i} className="border border-[#E2E8F0] rounded-2xl overflow-hidden bg-white">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2 px-3 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                            <div className="min-w-0">
                              <p className="text-[13px] font-bold text-[#0F172A] truncate">{card.courierProviderName}</p>
                              <p className="text-[11px] text-[#64748B] truncate">{card.courierServiceName} · {card.mode}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] font-semibold text-[#00A86B] bg-[#ECFDF5] px-2 py-0.5 rounded-full whitespace-nowrap">
                                COD ₹{card.codCharge} / {card.codPercent}%
                              </span>
                              {isAdminView && (
                                <button
                                  onClick={() => handleDeleteRateCard(card._id)}
                                  disabled={deletingId === card._id}
                                  className="text-[#94A3B8] hover:text-[#EF4444] transition-colors disabled:opacity-40 shrink-0"
                                  title="Delete rate card"
                                >
                                  {deletingId === card._id ? (
                                    <span className="text-[10px] font-semibold text-[#94A3B8]">…</span>
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Basic weight zones */}
                          <div className="px-3 pt-2.5">
                            <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-1.5">
                              Basic · {card.weightPriceBasic?.[0]?.weight}gm
                            </p>
                            <div className="grid grid-cols-5 gap-1.5">
                              {zones.map(z => (
                                <div key={z} className="bg-[#F8FAFC] rounded-lg py-1.5 text-center">
                                  <p className="text-[9px] font-semibold text-[#94A3B8]">Zone {z}</p>
                                  <p className="text-[11px] font-bold text-[#0F172A] mt-0.5">₹{card.weightPriceBasic?.[0]?.[`zone${z}`]}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Additional weight zones */}
                          <div className="px-3 py-2.5">
                            <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-1.5">
                              Additional · {card.weightPriceAdditional?.[0]?.weight}gm
                            </p>
                            <div className="grid grid-cols-5 gap-1.5">
                              {zones.map(z => (
                                <div key={z} className="bg-[#F8FAFC] rounded-lg py-1.5 text-center">
                                  <p className="text-[9px] font-semibold text-[#94A3B8]">Zone {z}</p>
                                  <p className="text-[11px] font-bold text-[#0F172A] mt-0.5">₹{card.weightPriceAdditional?.[0]?.[`zone${z}`]}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-[12px] text-[#94A3B8] py-10">No rate cards found for this user.</p>
                  )}
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
