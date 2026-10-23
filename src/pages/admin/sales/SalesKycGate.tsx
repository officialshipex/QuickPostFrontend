import { useCallback, useEffect, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Zap, Upload, Clock, CheckCircle2, AlertCircle, FileText, Download, RefreshCw, CreditCard, Fingerprint, Landmark, X,
  type LucideIcon,
} from 'lucide-react';
import { TableLoader } from '../../../components/ui/TableLoader';
import { useAdminTab } from '../../../context/AdminUserContext';
import { salesApiClient, apiError, downloadOfferLetter, type SalesMe, type SalesKyc } from '../../../services/salesApi';

/* Sales people can do nothing in the Sales panel until their own KYC is verified. This gate loads /sales/me and,
   for a sales person without verified KYC, shows the KYC screen instead of the page:
     e-KYC   PAN -> Aadhaar OTP -> bank, verified live; submit = verified, offer letter issued at once.
     manual  details + documents; a popup says it takes up to 24 hours; the admin approves in Sales Management.
   Everyone else (the owner viewing a sales person) passes straight through. */

const card = 'bg-white rounded-2xl border border-[#EEF2F6] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)]';
const fieldCls = 'w-full h-10 px-3.5 rounded-xl border border-[#E2E8F0] text-[13px] text-[#0F172A] bg-white placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] disabled:bg-[#F8FAFC] disabled:text-[#94A3B8]';
const labelCls = 'block text-[12px] font-semibold text-[#475569] mb-1.5';
const primaryBtn = 'h-10 px-5 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2';
const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }) : '');

function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        role="dialog" aria-modal="true" className="relative w-full max-w-md bg-white rounded-2xl shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] p-6 text-center">
        <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 w-8 h-8 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9]"><X className="w-4 h-4" /></button>
        {children}
      </motion.div>
    </div>,
    document.body,
  );
}

function ErrorLine({ text }: { text: string }) {
  if (!text) return null;
  return <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-[12.5px] text-red-600"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{text}</div>;
}

// ── e-KYC: three verified steps, then submit ─────────────────────────────────
function Step({ n, title, icon: Icon, done, doneText, children }: { n: number; title: string; icon: LucideIcon; done: boolean; doneText: string; children: ReactNode }) {
  return (
    <div className={`${card} p-5`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${done ? 'bg-[#F0FDF4] text-[#00A86B]' : 'bg-[#F1F5F9] text-[#64748B]'}`}><Icon className="w-[18px] h-[18px]" /></span>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Step {n}</div>
            <div className="text-[14px] font-bold text-[#0F172A]">{title}</div>
          </div>
        </div>
        {done && <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#00A86B]"><CheckCircle2 className="w-4 h-4" />Verified</span>}
      </div>
      <div className="mt-4">{done ? <p className="text-[12.5px] text-[#475569]">{doneText}</p> : children}</div>
    </div>
  );
}

function EkycFlow({ kyc, onChange, onVerified }: { kyc: SalesKyc; onChange: (k: SalesKyc) => void; onVerified: () => void }) {
  const [pan, setPan] = useState(''); const [panName, setPanName] = useState('');
  const [aadhaar, setAadhaar] = useState(''); const [otp, setOtp] = useState('');
  const [account, setAccount] = useState(''); const [ifsc, setIfsc] = useState('');
  const [busy, setBusy] = useState(''); const [error, setError] = useState(''); const [info, setInfo] = useState('');

  const run = async (key: string, url: string, body: object) => {
    setBusy(key); setError(''); setInfo('');
    try {
      const res = await salesApiClient.post(url, body);
      if (res.data?.kyc) onChange(res.data.kyc);
      if (key === 'otp') setInfo(res.data?.message || 'OTP sent');
      return true;
    } catch (e) { setError(apiError(e)); return false; } finally { setBusy(''); }
  };

  const allDone = kyc.pan.verified && kyc.aadhaar.verified && kyc.bank.verified;
  return (
    <div className="flex flex-col gap-4">
      <ErrorLine text={error} />
      {info && <div className="px-3 py-2 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] text-[12.5px] text-[#00A86B]">{info}</div>}
      <Step n={1} title="PAN" icon={CreditCard} done={kyc.pan.verified} doneText={`${kyc.pan.number} · ${kyc.pan.name}`}>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div><label className={labelCls}>PAN number</label><input value={pan} onChange={e => setPan(e.target.value.toUpperCase())} maxLength={10} placeholder="ABCDE1234F" className={fieldCls} /></div>
          <div><label className={labelCls}>Name as on PAN</label><input value={panName} onChange={e => setPanName(e.target.value)} placeholder="Full name" className={fieldCls} /></div>
          <button disabled={!!busy || pan.length !== 10 || panName.trim().length < 2} onClick={() => run('pan', '/kyc/ekyc/pan', { pan, name: panName.trim() })} className={primaryBtn}>{busy === 'pan' ? 'Verifying…' : 'Verify PAN'}</button>
        </div>
      </Step>
      <Step n={2} title="Aadhaar" icon={Fingerprint} done={kyc.aadhaar.verified} doneText={`${kyc.aadhaar.number} · ${kyc.aadhaar.name}`}>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
          <div><label className={labelCls}>Aadhaar number</label><input value={aadhaar} onChange={e => setAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))} inputMode="numeric" placeholder="12-digit Aadhaar" className={fieldCls} /></div>
          <button disabled={!!busy || aadhaar.length !== 12} onClick={() => run('otp', '/kyc/ekyc/aadhaar/otp', { aadhaarNo: aadhaar })} className={`${primaryBtn} bg-white !text-[#00A86B] border border-[#00A86B] hover:!bg-[#F0FDF4]`}>{busy === 'otp' ? 'Sending…' : kyc.aadhaar.otpSent ? 'Resend OTP' : 'Send OTP'}</button>
        </div>
        {kyc.aadhaar.otpSent && (
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end mt-3">
            <div><label className={labelCls}>OTP sent to your Aadhaar-linked mobile</label><input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="6-digit OTP" className={fieldCls} /></div>
            <button disabled={!!busy || otp.length !== 6} onClick={() => run('aadhaar', '/kyc/ekyc/aadhaar/verify', { otp })} className={primaryBtn}>{busy === 'aadhaar' ? 'Verifying…' : 'Verify OTP'}</button>
          </div>
        )}
      </Step>
      <Step n={3} title="Bank account (your commission is paid here)" icon={Landmark} done={kyc.bank.verified} doneText={`${kyc.bank.accountNumber} · ${kyc.bank.holderName}${kyc.bank.bankName ? ` · ${kyc.bank.bankName}` : ''}`}>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div><label className={labelCls}>Account number</label><input value={account} onChange={e => setAccount(e.target.value.replace(/\s/g, ''))} placeholder="Account number" className={fieldCls} /></div>
          <div><label className={labelCls}>IFSC</label><input value={ifsc} onChange={e => setIfsc(e.target.value.toUpperCase())} maxLength={11} placeholder="HDFC0001234" className={fieldCls} /></div>
          <button disabled={!!busy || account.length < 9 || ifsc.length !== 11} onClick={() => run('bank', '/kyc/ekyc/bank', { accountNo: account, ifsc })} className={primaryBtn}>{busy === 'bank' ? 'Verifying…' : 'Verify account'}</button>
        </div>
      </Step>
      <div className="flex justify-end">
        <button disabled={!allDone || !!busy} onClick={async () => { if (await run('submit', '/kyc/ekyc/submit', {})) onVerified(); }} className={`${primaryBtn} h-11 px-7`}>
          <ShieldCheck className="w-4 h-4" />{busy === 'submit' ? 'Submitting…' : 'Complete KYC'}
        </button>
      </div>
    </div>
  );
}

// ── Manual KYC: details + documents ──────────────────────────────────────────
const DOCS: { key: string; label: string; required: boolean }[] = [
  { key: 'panCard', label: 'PAN card', required: true },
  { key: 'aadhaarFront', label: 'Aadhaar — front', required: true },
  { key: 'aadhaarBack', label: 'Aadhaar — back', required: true },
  { key: 'bankProof', label: 'Cancelled cheque / bank statement', required: true },
  { key: 'photo', label: 'Your photo (optional)', required: false },
];

function ManualForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [f, setF] = useState({ pan: '', panName: '', aadhaarNumber: '', aadhaarName: '', dob: '', address: '', accountNumber: '', ifsc: '', holderName: '', bankName: '' });
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const set = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }));

  const submit = async () => {
    setError('');
    for (const d of DOCS) {
      const file = files[d.key];
      if (d.required && !file) { setError(`Upload: ${d.label}`); return; }
      if (file && file.size > 5 * 1024 * 1024) { setError(`${d.label} must be smaller than 5 MB.`); return; }
    }
    const fd = new FormData();
    Object.entries(f).forEach(([k, v]) => fd.append(k, v.trim()));
    DOCS.forEach(d => { const file = files[d.key]; if (file) fd.append(d.key, file); });
    setBusy(true);
    try {
      await salesApiClient.post('/kyc/manual', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSubmitted();
    } catch (e) { setError(apiError(e)); } finally { setBusy(false); }
  };

  const input = (k: keyof typeof f, label: string, props: InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div><label className={labelCls}>{label}</label><input value={f[k]} onChange={e => set(k, e.target.value)} className={fieldCls} {...props} /></div>
  );
  return (
    <div className={`${card} p-5 flex flex-col gap-5`}>
      <ErrorLine text={error} />
      <section>
        <h3 className="text-[13px] font-bold text-[#0F172A] mb-3">PAN</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {input('pan', 'PAN number', { maxLength: 10, placeholder: 'ABCDE1234F', onChange: e => set('pan', e.target.value.toUpperCase()) })}
          {input('panName', 'Name as on PAN')}
        </div>
      </section>
      <section>
        <h3 className="text-[13px] font-bold text-[#0F172A] mb-3">Aadhaar</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {input('aadhaarNumber', 'Aadhaar number', { inputMode: 'numeric', placeholder: '12 digits', onChange: e => set('aadhaarNumber', e.target.value.replace(/\D/g, '').slice(0, 12)) })}
          {input('aadhaarName', 'Name as on Aadhaar')}
          {input('dob', 'Date of birth', { type: 'date' })}
          {input('address', 'Address as on Aadhaar')}
        </div>
      </section>
      <section>
        <h3 className="text-[13px] font-bold text-[#0F172A] mb-3">Bank account (your commission is paid here)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {input('holderName', 'Account holder name')}
          {input('bankName', 'Bank name')}
          {input('accountNumber', 'Account number', { onChange: e => set('accountNumber', e.target.value.replace(/\s/g, '')) })}
          {input('ifsc', 'IFSC', { maxLength: 11, onChange: e => set('ifsc', e.target.value.toUpperCase()) })}
        </div>
      </section>
      <section>
        <h3 className="text-[13px] font-bold text-[#0F172A] mb-1">Documents</h3>
        <p className="text-[12px] text-[#94A3B8] mb-3">JPG, PNG or PDF, up to 5 MB each.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DOCS.map(d => (
            <label key={d.key} className={`flex items-center gap-3 rounded-xl border border-dashed px-3.5 py-3 cursor-pointer transition-colors ${files[d.key] ? 'border-[#00A86B] bg-[#F0FDF4]' : 'border-[#CBD5E1] hover:border-[#00A86B]'}`}>
              <Upload className={`w-4 h-4 shrink-0 ${files[d.key] ? 'text-[#00A86B]' : 'text-[#94A3B8]'}`} />
              <span className="min-w-0">
                <span className="block text-[12.5px] font-semibold text-[#0F172A]">{d.label}{d.required && <span className="text-red-500"> *</span>}</span>
                <span className="block text-[11.5px] text-[#64748B] truncate">{files[d.key]?.name || 'Choose file'}</span>
              </span>
              <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="sr-only" onChange={e => setFiles(p => ({ ...p, [d.key]: e.target.files?.[0] || null }))} />
            </label>
          ))}
        </div>
      </section>
      <div className="flex justify-end">
        <button disabled={busy} onClick={submit} className={`${primaryBtn} h-11 px-7`}><Upload className="w-4 h-4" />{busy ? 'Submitting…' : 'Submit for verification'}</button>
      </div>
    </div>
  );
}

// ── The KYC screen ───────────────────────────────────────────────────────────
function KycScreen({ me, reload, onVerified }: { me: SalesMe; reload: () => Promise<void>; onVerified: () => void }) {
  const [kyc, setKyc] = useState<SalesKyc>(me.kyc!);
  const [method, setMethod] = useState<'ekyc' | 'manual' | null>(me.kyc?.method && me.kyc.status !== 'rejected' ? me.kyc.method : null);
  const [submittedPopup, setSubmittedPopup] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  if (kyc.status === 'pending') {
    return (
      <div className="max-w-xl mx-auto mt-6">
        <div className={`${card} p-8 text-center`}>
          <span className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center"><Clock className="w-7 h-7" /></span>
          <h2 className="mt-4 text-[18px] font-bold text-[#0F172A]">Your KYC is under review</h2>
          <p className="mt-1.5 text-[13px] text-[#64748B]">Submitted {fmt(kyc.submittedAt)}. Verification takes up to 24 hours. You'll get an email, and your offer letter will be ready to download here once it's verified.</p>
          <button disabled={refreshing} onClick={async () => { setRefreshing(true); await reload(); setRefreshing(false); }}
            className="mt-5 h-10 px-5 rounded-full border border-[#E2E8F0] text-[13px] font-semibold text-[#475569] hover:border-[#00A86B]/40 hover:text-[#00A86B] inline-flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />Check status
          </button>
        </div>
        {submittedPopup && (
          <Modal onClose={() => setSubmittedPopup(false)}>
            <span className="mx-auto w-12 h-12 rounded-2xl bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center"><CheckCircle2 className="w-6 h-6" /></span>
            <h3 className="mt-3 text-[16px] font-bold text-[#0F172A]">KYC submitted</h3>
            <p className="mt-1 text-[13px] text-[#64748B]">The process will take up to 24 hours. Once the admin verifies your documents you can download your offer letter from your Sales Dashboard.</p>
            <button onClick={() => setSubmittedPopup(false)} className={`${primaryBtn} mt-5 w-full`}>OK</button>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-xl bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center shrink-0"><ShieldCheck className="w-6 h-6" /></span>
        <div>
          <h1 className="text-[18px] font-bold text-[#0F172A]">Complete your KYC</h1>
          <p className="text-[12.5px] text-[#64748B]">Verify your identity and bank account to unlock the Sales panel and receive your offer letter.</p>
        </div>
      </div>
      {kyc.status === 'rejected' && kyc.rejectionReason && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span><b>Your last KYC was not approved:</b> {kyc.rejectionReason}. Please submit again.</span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {([
          { key: 'ekyc', icon: Zap, title: 'Instant e-KYC', body: 'PAN, Aadhaar OTP and bank verified online. Your offer letter is ready immediately.' },
          { key: 'manual', icon: Upload, title: 'Manual KYC', body: 'Upload your documents. The admin verifies them within 24 hours.' },
        ] as const).map(m => (
          <button key={m.key} type="button" onClick={() => setMethod(m.key)}
            className={`text-left rounded-2xl border p-4 transition-colors ${method === m.key ? 'border-[#00A86B] bg-[#F0FDF4]' : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'}`}>
            <div className="flex items-center gap-2"><m.icon className={`w-4 h-4 ${method === m.key ? 'text-[#00A86B]' : 'text-[#64748B]'}`} /><span className={`text-[14px] font-bold ${method === m.key ? 'text-[#00A86B]' : 'text-[#0F172A]'}`}>{m.title}</span></div>
            <p className="text-[12.5px] text-[#64748B] mt-1">{m.body}</p>
          </button>
        ))}
      </div>
      {method === 'ekyc' && <EkycFlow kyc={kyc} onChange={setKyc} onVerified={onVerified} />}
      {method === 'manual' && <ManualForm onSubmitted={() => { setKyc(k => ({ ...k, status: 'pending', submittedAt: new Date().toISOString() })); setSubmittedPopup(true); }} />}
    </div>
  );
}

export function OfferLetterCard({ employeeId, issuedAt, letterNumber }: { employeeId?: string; issuedAt?: string; letterNumber?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <div className={`${card} p-5 flex flex-col sm:flex-row sm:items-center gap-4`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0"><FileText className="w-5 h-5" /></span>
        <div className="min-w-0">
          <div className="text-[14px] font-bold text-[#0F172A]">Offer letter</div>
          <p className="text-[12.5px] text-[#64748B] truncate">{letterNumber ? `${letterNumber} · issued ${issuedAt ? new Date(issuedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}` : 'Issued once KYC is verified.'}</p>
          {error && <p className="text-[12px] text-red-600 mt-0.5">{error}</p>}
        </div>
      </div>
      <button disabled={busy || !letterNumber} onClick={async () => { setBusy(true); setError(''); try { await downloadOfferLetter(employeeId); } catch { setError('Could not download the offer letter.'); } finally { setBusy(false); } }}
        className={primaryBtn}><Download className="w-4 h-4" />{busy ? 'Preparing…' : 'Download'}</button>
    </div>
  );
}

export function SalesKycGate({ children }: { children: ReactNode }) {
  const { isSalesEmployee, loadingAdminTab } = useAdminTab();
  const [me, setMe] = useState<SalesMe | null>(null);
  const [failed, setFailed] = useState(false);
  const [justVerified, setJustVerified] = useState(false);

  const reload = useCallback(async () => {
    try { const res = await salesApiClient.get('/me'); setMe(res.data); setFailed(false); } catch { setFailed(true); }
  }, []);
  useEffect(() => {
    if (loadingAdminTab) return;
    let alive = true;
    salesApiClient.get('/me')
      .then(res => { if (alive) { setMe(res.data); setFailed(false); } })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [loadingAdminTab]);

  if (loadingAdminTab || (!me && !failed)) return <div className="relative h-[60vh]"><TableLoader /></div>;
  if (failed && !me) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <AlertCircle className="w-10 h-10 text-[#CBD5E1] mx-auto" />
        <p className="mt-3 text-[14px] font-semibold text-[#0F172A]">Could not load the Sales panel</p>
        <button onClick={reload} className={`${primaryBtn} mt-4`}>Try again</button>
      </div>
    );
  }
  const locked = isSalesEmployee && me?.viewer === 'self' && me.kyc?.status !== 'verified';
  return (
    <>
      {locked && me ? (
        <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-[#F8FAFC] overflow-y-auto">
          <div className="px-4 md:px-6 pt-6 pb-10"><KycScreen me={me} reload={reload} onVerified={async () => { await reload(); setJustVerified(true); }} /></div>
        </div>
      ) : children}
      {justVerified && (
        <Modal onClose={() => setJustVerified(false)}>
          <span className="mx-auto w-12 h-12 rounded-2xl bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center"><CheckCircle2 className="w-6 h-6" /></span>
          <h3 className="mt-3 text-[16px] font-bold text-[#0F172A]">KYC verified</h3>
          <p className="mt-1 text-[13px] text-[#64748B]">Welcome aboard! Your offer letter has been generated.</p>
          <div className="mt-5 flex gap-2">
            <button onClick={() => setJustVerified(false)} className="flex-1 h-10 rounded-full border border-[#E2E8F0] text-[13px] font-semibold text-[#475569] hover:bg-[#F8FAFC]">Later</button>
            <button onClick={() => downloadOfferLetter().catch(() => {})} className={`${primaryBtn} flex-1`}><Download className="w-4 h-4" />Offer letter</button>
          </div>
        </Modal>
      )}
    </>
  );
}
