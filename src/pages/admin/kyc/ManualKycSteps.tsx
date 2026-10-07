import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, FileText, Info, Lock, Pencil, RefreshCcw, UploadCloud, X } from 'lucide-react';
import { ShineButton } from '../../../components/ui/ShineButton';
import { FieldLabel } from './kycUi';
import { cardShadow, IFSC_RE, inputCls, PAN_RE } from './kycStyles';
import {
  formatAadhaar, formatDate, formatFileSize, isAadhaarComplete, isBankAccountLengthOk, isBankComplete, isPanComplete,
  MANUAL_STEPS, maskTail,
  type KycFile, type ManualAadhaar, type ManualBank, type ManualKycData, type ManualPan, type ManualStep,
} from './manualKycData';

type BusinessType = 'INDIVIDUAL' | 'COMPANY';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const todayIso = () => new Date().toISOString().slice(0, 10);

/* ── Document upload — dropzone → file row with preview / replace / remove ── */
export function DocumentUpload({
  label, hint, value, onChange, onError, required = true, maxMb = 5,
}: {
  label: string;
  hint?: string;
  value: KycFile | null;
  onChange: (f: KycFile | null) => void;
  onError: (msg: string) => void;
  required?: boolean;
  maxMb?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const accept = (file?: File | null) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) return onError('Please upload a JPG, PNG or PDF file.');
    if (file.size > maxMb * 1024 * 1024) return onError(`File must be smaller than ${maxMb} MB.`);
    if (value) URL.revokeObjectURL(value.url);
    onChange({ file, url: URL.createObjectURL(file) });
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = () => {
    if (value) URL.revokeObjectURL(value.url);
    onChange(null);
  };

  const isImage = value?.file.type.startsWith('image/');

  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input ref={inputRef} type="file" accept={ACCEPTED_TYPES.join(',')} className="hidden" onChange={(e) => accept(e.target.files?.[0])} />
      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white p-2.5 pr-3">
          <a href={value.url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-lg bg-[#F8FAFC] overflow-hidden flex items-center justify-center shrink-0" title="Open preview">
            {isImage ? <img src={value.url} alt="" className="w-full h-full object-cover" /> : <FileText className="w-5 h-5 text-[#DC2626]" />}
          </a>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold text-[#0F172A] truncate">{value.file.name}</p>
            <p className="text-[11px] text-[#94A3B8] flex items-center gap-1">
              <Check className="w-3 h-3 text-[#00A86B]" strokeWidth={3} /> Uploaded · {formatFileSize(value.file.size)}
            </p>
          </div>
          <button type="button" onClick={() => inputRef.current?.click()} className="text-[12px] font-semibold text-[#00A86B] hover:underline shrink-0">Replace</button>
          <button type="button" onClick={remove} aria-label={`Remove ${label}`} className="w-7 h-7 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-red-500 hover:bg-red-50 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files?.[0]); }}
          className={`w-full h-[104px] rounded-xl border border-dashed flex flex-col items-center justify-center gap-1.5 transition-colors ${dragging ? 'border-[#00A86B] bg-[#F0FDF4]' : 'border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#00A86B]/60 hover:bg-[#F0FDF4]/50'}`}
        >
          <UploadCloud className="w-5 h-5 text-[#64748B]" />
          <span className="text-[12.5px] text-[#475569]">Drag &amp; drop or <span className="font-semibold text-[#00A86B]">browse</span></span>
          <span className="text-[11px] text-[#94A3B8]">{hint || `JPG, PNG or PDF · up to ${maxMb} MB`}</span>
        </button>
      )}
    </div>
  );
}

/* ── Step layout — stepper, main card, guidance panel, footer actions ── */
export function ManualStepper({ current }: { current: ManualStep }) {
  const idx = MANUAL_STEPS.findIndex((s) => s.id === current);
  return (
    <>
      {/* Desktop */}
      <ol className="hidden md:flex items-center gap-2 mb-5" aria-label="KYC progress">
        {MANUAL_STEPS.map((s, i) => {
          const done = i < idx;
          const active = i === idx;
          return (
            <li key={s.id} className="flex items-center gap-2">
              <span className={`flex items-center gap-1.5 text-[12.5px] font-semibold ${done ? 'text-[#00A86B]' : active ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${done ? 'bg-[#00A86B] text-white' : active ? 'bg-[#0F172A] text-white' : 'bg-[#E2E8F0] text-[#64748B]'}`}>
                  {done ? <Check className="w-3 h-3" strokeWidth={3} /> : i + 1}
                </span>
                {s.label}
              </span>
              {i < MANUAL_STEPS.length - 1 && <span className={`w-10 h-px ${done ? 'bg-[#00A86B]' : 'bg-[#E2E8F0]'}`} />}
            </li>
          );
        })}
      </ol>
      {/* Mobile */}
      <div className="md:hidden mb-4">
        <div className="flex items-center justify-between text-[12px] font-semibold mb-1.5">
          <span className="text-[#0F172A]">{MANUAL_STEPS[idx].label}</span>
          <span className="text-[#94A3B8]">Step {idx + 1} of {MANUAL_STEPS.length}</span>
        </div>
        <div className="h-1 rounded-full bg-[#E2E8F0] overflow-hidden">
          <div className="h-full rounded-full bg-[#00A86B] transition-[width] duration-300" style={{ width: `${((idx + 1) / MANUAL_STEPS.length) * 100}%` }} />
        </div>
      </div>
    </>
  );
}

export function ManualStepLayout({
  step, title, subtitle, children, aside, onBack, onNext, nextLabel, nextDisabled, nextLoading,
}: {
  step: ManualStep;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
}) {
  return (
    <div className="max-w-5xl mx-auto">
      <ManualStepper current={step} />
      <div className={`grid grid-cols-1 ${aside ? 'lg:grid-cols-[minmax(0,1fr)_300px]' : ''} gap-5 items-start`}>
        <div className={`bg-white rounded-xl md:rounded-2xl ${cardShadow}`}>
          <div className="px-4 md:px-6 py-4 md:py-5 border-b border-[#F1F5F9]">
            <h2 className="text-[16px] md:text-[18px] font-bold text-[#0F172A]">{title}</h2>
            <p className="text-[12px] md:text-[13px] text-[#64748B] mt-0.5">{subtitle}</p>
          </div>
          <div className="px-4 md:px-6 py-5 md:py-6">{children}</div>
          <div className="px-4 md:px-6 py-4 border-t border-[#F1F5F9] flex items-center justify-between gap-3">
            <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 px-5 h-11 border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] text-[13px] font-bold rounded-full transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <ShineButton
              type="button"
              onClick={onNext}
              disabled={nextDisabled || nextLoading}
              className="min-w-[160px] h-11 px-6 rounded-full bg-[#009D64] hover:bg-[#008856] transition-colors text-white text-[13px] font-bold shadow-sm disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5"
            >
              {nextLoading ? <><RefreshCcw className="w-4 h-4 animate-spin" /> Submitting…</> : <>{nextLabel} <ArrowRight className="w-4 h-4" /></>}
            </ShineButton>
          </div>
        </div>
        {aside && <aside className="space-y-4">{aside}</aside>}
      </div>
    </div>
  );
}

function GuidanceCard({ title, items, note }: { title: string; items: string[]; note?: string }) {
  return (
    <>
      <div className={`bg-white rounded-2xl ${cardShadow} p-5`}>
        <p className="text-[13px] font-bold text-[#0F172A] mb-3">{title}</p>
        <ul className="space-y-2.5">
          {items.map((t) => (
            <li key={t} className="flex items-start gap-2 text-[12.5px] text-[#475569] leading-snug">
              <Check className="w-3.5 h-3.5 text-[#00A86B] mt-0.5 shrink-0" strokeWidth={2.75} />
              {t}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-start gap-2.5 px-1">
        <Lock className="w-4 h-4 text-[#94A3B8] mt-0.5 shrink-0" />
        <p className="text-[11.5px] text-[#64748B] leading-relaxed">{note || 'Your documents are encrypted and used only for KYC verification.'}</p>
      </div>
    </>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-3">{children}</p>;
}

function ErrorText({ show, children }: { show: boolean; children: React.ReactNode }) {
  return show ? <p className="text-[11px] font-medium text-red-500 mt-1.5">{children}</p> : null;
}

/* ── PAN ── */
export function ManualPanStep({
  value, onChange, businessType, onBack, onNext, onError,
}: {
  value: ManualPan;
  onChange: (patch: Partial<ManualPan>) => void;
  businessType: BusinessType;
  onBack: () => void;
  onNext: () => void;
  onError: (msg: string) => void;
}) {
  const isCompany = businessType === 'COMPANY';
  const panInvalid = value.number.length === 10 && !PAN_RE.test(value.number);
  return (
    <ManualStepLayout
      step="pan"
      title="PAN Details"
      subtitle={isCompany ? 'Enter your business PAN exactly as printed on the card' : 'Enter your PAN exactly as printed on the card'}
      onBack={onBack}
      onNext={onNext}
      nextLabel="Continue"
      nextDisabled={!isPanComplete(value)}
      aside={<GuidanceCard title="Before you upload" items={[
        'Upload a clear photo or scan of the original PAN card',
        'All four corners and text must be visible',
        isCompany ? 'Use the PAN issued in your business name' : 'Name must match your bank account',
      ]} />}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel required>PAN Number</FieldLabel>
          <input type="text" maxLength={10} value={value.number} onChange={(e) => onChange({ number: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} placeholder="ABCDE1234F" className={`${inputCls} uppercase tracking-wider ${panInvalid ? '!border-red-300' : ''}`} />
          <ErrorText show={panInvalid}>Enter a valid PAN (e.g. ABCDE1234F)</ErrorText>
        </div>
        <div>
          <FieldLabel required>{isCompany ? 'Business Name as on PAN' : 'Name as on PAN'}</FieldLabel>
          <input type="text" maxLength={100} value={value.name} onChange={(e) => onChange({ name: e.target.value })} placeholder={isCompany ? 'Registered business name' : 'Full name'} className={inputCls} />
        </div>
        <div>
          <FieldLabel required>{isCompany ? 'Date of Incorporation' : 'Date of Birth'}</FieldLabel>
          <input type="date" max={todayIso()} value={value.date} onChange={(e) => onChange({ date: e.target.value })} className={`${inputCls} ${value.date ? '' : 'text-[#94A3B8]'}`} />
        </div>
      </div>
      <div className="mt-6 pt-5 border-t border-[#F1F5F9]">
        <SubHeading>Document</SubHeading>
        <div className="sm:max-w-[420px]">
          <DocumentUpload label="PAN Card" value={value.card} onChange={(card) => onChange({ card })} onError={onError} />
        </div>
      </div>
    </ManualStepLayout>
  );
}

/* ── Aadhaar ── */
export function ManualAadhaarStep({
  value, onChange, onBack, onNext, onError,
}: {
  value: ManualAadhaar;
  onChange: (patch: Partial<ManualAadhaar>) => void;
  onBack: () => void;
  onNext: () => void;
  onError: (msg: string) => void;
}) {
  // Auto-fill city/state from pincode (same public lookup the e-KYC billing form uses).
  useEffect(() => {
    if (!/^\d{6}$/.test(value.pincode)) return;
    let cancelled = false;
    fetch(`https://api.postalpincode.in/pincode/${value.pincode}`)
      .then((r) => r.json())
      .then((data) => {
        const po = data?.[0]?.PostOffice?.[0];
        if (!cancelled && po) onChange({ city: (po.District || po.Name || '').toUpperCase(), state: (po.State || '').toUpperCase() });
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.pincode]);

  const aadhaarIncomplete = value.number.length > 0 && value.number.length < 12;
  return (
    <ManualStepLayout
      step="aadhaar"
      title="Aadhaar Details"
      subtitle="Enter the details exactly as printed on your Aadhaar card"
      onBack={onBack}
      onNext={onNext}
      nextLabel="Continue"
      nextDisabled={!isAadhaarComplete(value)}
      aside={<GuidanceCard title="Before you upload" items={[
        'Upload both the front and back of the Aadhaar card',
        'Masked Aadhaar (first 8 digits hidden) is accepted',
        'Address must be fully readable',
      ]} />}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel required>Aadhaar Number</FieldLabel>
          <input type="text" inputMode="numeric" maxLength={14} value={formatAadhaar(value.number)} onChange={(e) => onChange({ number: e.target.value.replace(/\D/g, '').slice(0, 12) })} placeholder="XXXX XXXX XXXX" className={`${inputCls} tracking-wider`} />
          <ErrorText show={aadhaarIncomplete}>Aadhaar number has 12 digits</ErrorText>
        </div>
        <div>
          <FieldLabel required>Name as on Aadhaar</FieldLabel>
          <input type="text" maxLength={100} value={value.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="Full name" className={inputCls} />
        </div>
        <div>
          <FieldLabel required>Father's / Spouse's Name</FieldLabel>
          <input type="text" maxLength={100} value={value.guardianName} onChange={(e) => onChange({ guardianName: e.target.value })} placeholder="As printed (S/O, D/O, W/O)" className={inputCls} />
        </div>
        <div>
          <FieldLabel required>Date of Birth</FieldLabel>
          <input type="date" max={todayIso()} value={value.dob} onChange={(e) => onChange({ dob: e.target.value })} className={`${inputCls} ${value.dob ? '' : 'text-[#94A3B8]'}`} />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel required>Address as on Aadhaar</FieldLabel>
          <textarea rows={2} maxLength={250} value={value.address} onChange={(e) => onChange({ address: e.target.value })} placeholder="House / building, street, area" className={`${inputCls} !rounded-2xl h-auto py-3 resize-none`} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:col-span-2">
          <div className="col-span-2 sm:col-span-1">
            <FieldLabel required>Pincode</FieldLabel>
            <input type="text" inputMode="numeric" maxLength={6} value={value.pincode} onChange={(e) => onChange({ pincode: e.target.value.replace(/\D/g, '') })} placeholder="6-digit pincode" className={inputCls} />
          </div>
          <div>
            <FieldLabel required>City</FieldLabel>
            <input type="text" maxLength={60} value={value.city} onChange={(e) => onChange({ city: e.target.value.toUpperCase() })} placeholder="Auto-filled" className={`${inputCls} uppercase placeholder:normal-case`} />
          </div>
          <div>
            <FieldLabel required>State</FieldLabel>
            <input type="text" maxLength={60} value={value.state} onChange={(e) => onChange({ state: e.target.value.toUpperCase() })} placeholder="Auto-filled" className={`${inputCls} uppercase placeholder:normal-case`} />
          </div>
        </div>
      </div>
      <div className="mt-6 pt-5 border-t border-[#F1F5F9]">
        <SubHeading>Documents</SubHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DocumentUpload label="Aadhaar Front" value={value.front} onChange={(front) => onChange({ front })} onError={onError} />
          <DocumentUpload label="Aadhaar Back" value={value.back} onChange={(back) => onChange({ back })} onError={onError} />
        </div>
      </div>
    </ManualStepLayout>
  );
}

/* ── Bank ── */
function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="inline-flex p-1 rounded-full bg-[#F1F5F9] gap-1" role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`h-8 px-4 rounded-full text-[12.5px] font-semibold transition-colors ${value === o.value ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ManualBankStep({
  value, onChange, panName, onBack, onNext, onError,
}: {
  value: ManualBank;
  onChange: (patch: Partial<ManualBank>) => void;
  panName?: string;
  onBack: () => void;
  onNext: () => void;
  onError: (msg: string) => void;
}) {
  const [showAccount, setShowAccount] = useState(false);
  const mismatch = !!value.confirmAccountNumber && value.confirmAccountNumber !== value.accountNumber;
  const matched = !!value.confirmAccountNumber && !mismatch;
  const ifscInvalid = value.ifsc.length === 11 && !IFSC_RE.test(value.ifsc);
  return (
    <ManualStepLayout
      step="bank"
      title="Bank Account Details"
      subtitle="Add the account where your COD remittance and payouts will be settled"
      onBack={onBack}
      onNext={onNext}
      nextLabel="Review Details"
      nextDisabled={!isBankComplete(value)}
      aside={<GuidanceCard
        title="Account requirements"
        items={[
          'Current or savings account in your name or your business name',
          'Holder name must match your PAN or GST registration',
          'Wallets, NRE and loan accounts are not supported',
        ]}
        note="Your bank details are encrypted and used only for settling your payouts. They are never shared with buyers or third parties."
      />}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <FieldLabel required>Account Holder Name</FieldLabel>
          <input type="text" maxLength={100} value={value.holderName} onChange={(e) => onChange({ holderName: e.target.value })} placeholder="As per bank records" className={inputCls} />
          {panName && <p className="text-[11px] text-[#94A3B8] mt-1.5">Should match the name on your PAN: <span className="font-semibold text-[#475569]">{panName}</span></p>}
        </div>
        <div>
          <FieldLabel required>Account Number</FieldLabel>
          <div className="relative flex items-center">
            <input type={showAccount ? 'text' : 'password'} inputMode="numeric" autoComplete="off" maxLength={18} value={value.accountNumber} onChange={(e) => onChange({ accountNumber: e.target.value.replace(/\D/g, '') })} placeholder="Enter account number" className={`${inputCls} pr-11 tracking-wide`} />
            <button type="button" onClick={() => setShowAccount((v) => !v)} aria-label={showAccount ? 'Hide account number' : 'Show account number'} className="absolute right-3 text-[#94A3B8] hover:text-[#475569]">
              {showAccount ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {value.accountNumber && !isBankAccountLengthOk(value.accountNumber) && <p className="text-[11px] text-[#94A3B8] mt-1.5">Account numbers are 9–18 digits</p>}
        </div>
        <div>
          <FieldLabel required>Confirm Account Number</FieldLabel>
          <div className="relative flex items-center">
            <input type="text" inputMode="numeric" autoComplete="off" maxLength={18} value={value.confirmAccountNumber} onChange={(e) => onChange({ confirmAccountNumber: e.target.value.replace(/\D/g, '') })} onPaste={(e) => e.preventDefault()} placeholder="Re-enter account number" className={`${inputCls} pr-11 tracking-wide ${mismatch ? '!border-red-300' : ''}`} />
            {matched && <Check className="absolute right-3.5 w-4 h-4 text-[#00A86B]" strokeWidth={3} />}
          </div>
          <ErrorText show={mismatch}>Account numbers do not match</ErrorText>
        </div>
        <div>
          <FieldLabel required>IFSC Code</FieldLabel>
          <input type="text" maxLength={11} autoComplete="off" value={value.ifsc} onChange={(e) => onChange({ ifsc: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} placeholder="e.g. HDFC0001234" className={`${inputCls} uppercase placeholder:normal-case tracking-wide ${ifscInvalid ? '!border-red-300' : ''}`} />
          <ErrorText show={ifscInvalid}>Enter a valid 11-character IFSC</ErrorText>
        </div>
        <div>
          <FieldLabel required>Account Type</FieldLabel>
          <Segmented value={value.accountType} onChange={(accountType) => onChange({ accountType })} options={[{ value: 'current', label: 'Current' }, { value: 'savings', label: 'Savings' }]} />
        </div>
        <div>
          <FieldLabel required>Bank Name</FieldLabel>
          <input type="text" maxLength={80} value={value.bankName} onChange={(e) => onChange({ bankName: e.target.value })} placeholder="e.g. HDFC Bank" className={inputCls} />
        </div>
        <div>
          <FieldLabel required>Branch</FieldLabel>
          <input type="text" maxLength={80} value={value.branch} onChange={(e) => onChange({ branch: e.target.value })} placeholder="e.g. Andheri East" className={inputCls} />
        </div>
      </div>
      <div className="mt-6 pt-5 border-t border-[#F1F5F9]">
        <SubHeading>Document</SubHeading>
        <div className="mb-3">
          <Segmented value={value.proofType} onChange={(proofType) => onChange({ proofType })} options={[{ value: 'cheque', label: 'Cancelled Cheque' }, { value: 'statement', label: 'Bank Statement' }]} />
        </div>
        <div className="sm:max-w-[420px]">
          <DocumentUpload
            label={value.proofType === 'cheque' ? 'Cancelled Cheque' : 'Bank Statement'}
            hint={value.proofType === 'cheque' ? 'Account number, IFSC and name must be visible' : 'Last 3 months · JPG, PNG or PDF up to 5 MB'}
            value={value.proof}
            onChange={(proof) => onChange({ proof })}
            onError={onError}
          />
        </div>
      </div>
    </ManualStepLayout>
  );
}

/* ── Review & submit ── */
function ReviewSection({ title, onEdit, rows, files }: { title: string; onEdit: () => void; rows: [string, React.ReactNode][]; files?: (KycFile | null)[] }) {
  const docs = (files || []).filter(Boolean) as KycFile[];
  return (
    <section className="py-5 border-b border-[#F1F5F9] last:border-b-0 first:pt-0">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[14px] font-bold text-[#0F172A]">{title}</h3>
        <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#00A86B] hover:underline">
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
        {rows.map(([label, val]) => (
          <div key={label} className="flex items-start justify-between sm:block gap-4 py-2">
            <dt className="text-[12px] text-[#64748B]">{label}</dt>
            <dd className="text-[13px] font-semibold text-[#0F172A] text-right sm:text-left sm:mt-0.5 break-words">{val || '—'}</dd>
          </div>
        ))}
      </dl>
      {docs.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {docs.map((d) => (
            <a key={d.url} href={d.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[#F8FAFC] text-[12px] font-medium text-[#475569] hover:text-[#0F172A] max-w-[220px]">
              <FileText className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{d.file.name}</span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

export function ManualReviewStep({
  data, businessType, email, phoneNumber, billing, gstin, goTo, onBack, onSubmit, submitting,
}: {
  data: ManualKycData;
  businessType: BusinessType;
  email: string;
  phoneNumber: string;
  billing: { address: string; pincode: string; city: string; state: string };
  gstin: string;
  goTo: (s: ManualStep) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const [agreed, setAgreed] = useState(false);
  const isCompany = businessType === 'COMPANY';
  const { pan, aadhaar, bank } = data;
  return (
    <ManualStepLayout
      step="review"
      title="Review & Submit"
      subtitle="Check your details before submitting. Verification usually takes 2–3 business days."
      onBack={onBack}
      onNext={onSubmit}
      nextLabel="Submit for Verification"
      nextDisabled={!agreed}
      nextLoading={submitting}
    >
      <ReviewSection
        title="Business Details"
        onEdit={() => goTo('details')}
        rows={[
          ['Business Type', isCompany ? 'Company' : 'Individual'],
          ['Email', email],
          ['Phone Number', phoneNumber ? `+91 ${phoneNumber}` : ''],
          ['Billing Address', [billing.address, billing.city, billing.state, billing.pincode].filter(Boolean).join(', ')],
          ...(isCompany ? [['GSTIN', gstin] as [string, React.ReactNode]] : []),
        ]}
        files={isCompany ? [data.gstCertificate] : []}
      />
      <ReviewSection
        title="PAN Details"
        onEdit={() => goTo('pan')}
        rows={[
          ['PAN Number', pan.number],
          [isCompany ? 'Business Name' : 'Name', pan.name],
          [isCompany ? 'Date of Incorporation' : 'Date of Birth', formatDate(pan.date)],
        ]}
        files={[pan.card]}
      />
      <ReviewSection
        title="Aadhaar Details"
        onEdit={() => goTo('aadhaar')}
        rows={[
          ['Aadhaar Number', maskTail(aadhaar.number)],
          ['Name', aadhaar.name],
          ["Father's / Spouse's Name", aadhaar.guardianName],
          ['Date of Birth', formatDate(aadhaar.dob)],
          ['Address', [aadhaar.address, aadhaar.city, aadhaar.state, aadhaar.pincode].filter(Boolean).join(', ')],
        ]}
        files={[aadhaar.front, aadhaar.back]}
      />
      <ReviewSection
        title="Bank Account"
        onEdit={() => goTo('bank')}
        rows={[
          ['Account Holder', bank.holderName],
          ['Account Number', maskTail(bank.accountNumber)],
          ['IFSC Code', bank.ifsc],
          ['Bank & Branch', [bank.bankName, bank.branch].filter(Boolean).join(', ')],
          ['Account Type', bank.accountType === 'current' ? 'Current' : 'Savings'],
        ]}
        files={[bank.proof]}
      />

      <label className="mt-5 flex items-start gap-3 rounded-xl bg-[#F8FAFC] p-4 cursor-pointer select-none">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#00A86B] shrink-0" />
        <span className="text-[12.5px] text-[#475569] leading-relaxed">
          I confirm that the information and documents provided are accurate and belong to {isCompany ? 'my business' : 'me'}, and I authorise QuickPost to verify them for KYC.
        </span>
      </label>
      <p className="mt-3 flex items-start gap-2 text-[11.5px] text-[#94A3B8]">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" /> You'll be notified by email and SMS once your KYC is verified.
      </p>
    </ManualStepLayout>
  );
}
