import { useCallback, useEffect, useState } from 'react';
import { Copy, Check, ShieldCheck, Download, PhoneCall, Link2, Receipt, Save } from 'lucide-react';
import { TableLoader } from '../../../components/ui/TableLoader';
import { copyToClipboard } from '../../../utils/clipboard';
import { salesApiClient, apiError, referralLinkFor, downloadOfferLetter } from '../../../services/salesApi';
import { Modal, ErrorLine, KycChip, KycReviewDialog } from './SalesManagementTabs';
import { card, fieldCls, labelCls, primaryBtn, ghostBtn, fmtDate, loadPerson, type PersonDetail } from './salesUi';

/* Sales Management > one sales person: who they are, KYC, offer letter details, targets, and the admin's actions
   for them (assign a lead, link an existing seller, pay out). Their own dashboard is shown below this panel. */

type Notify = (ok: boolean, msg: string) => void;

function AssignLeadDialog({ employeeId, name, onClose, notify }: { employeeId: string; name: string; onClose: () => void; notify: Notify }) {
  const [f, setF] = useState({ leadName: '', phone: '', businessName: '', city: '', category: '', priority: 'medium', note: '' });
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const set = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }));
  const save = async () => {
    setBusy(true); setError('');
    try { const res = await salesApiClient.post('/admin/leads', { employeeId, ...f }); notify(true, res.data?.message || 'Lead assigned'); onClose(); }
    catch (e) { setError(apiError(e)); } finally { setBusy(false); }
  };
  const input = (k: keyof typeof f, label: string) => <div><label className={labelCls}>{label}</label><input value={f[k]} onChange={e => set(k, e.target.value)} className={fieldCls} /></div>;
  return (
    <Modal title={`Assign a lead to ${name}`} onClose={onClose}
      footer={<><button onClick={onClose} className={ghostBtn}>Cancel</button><button disabled={busy} onClick={save} className={primaryBtn}>{busy ? 'Assigning…' : 'Assign lead'}</button></>}>
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2"><ErrorLine text={error} /></div>
        {input('leadName', 'Contact name *')}{input('phone', 'Phone *')}{input('businessName', 'Business name')}{input('city', 'City')}{input('category', 'Category')}
        <div><label className={labelCls}>Priority</label><select value={f.priority} onChange={e => set('priority', e.target.value)} className={fieldCls}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
        <div className="sm:col-span-2">{input('note', 'Note for the sales person')}</div>
      </div>
    </Modal>
  );
}

function AttachSellerDialog({ employeeId, name, onClose, notify }: { employeeId: string; name: string; onClose: () => void; notify: Notify }) {
  const [seller, setSeller] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const save = async (force = false) => {
    setBusy(true); setError('');
    try { const res = await salesApiClient.post('/admin/sellers/attach', { employeeId, seller: seller.trim(), force }); notify(true, res.data?.message || 'Seller linked'); onClose(); }
    catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = (e as any)?.response?.data;
      if (d?.needsConfirm) setConfirm(d.message); else setError(apiError(e));
    } finally { setBusy(false); }
  };
  return (
    <Modal title={`Link a seller to ${name}`} onClose={onClose}
      footer={<><button onClick={onClose} className={ghostBtn}>Cancel</button>
        {confirm ? <button disabled={busy} onClick={() => save(true)} className={primaryBtn}>Yes, move</button>
          : <button disabled={busy || !seller.trim()} onClick={() => save()} className={primaryBtn}>{busy ? 'Linking…' : 'Link seller'}</button>}</>}>
      <div className="p-5 space-y-3">
        <ErrorLine text={error} />
        <p className="text-[12.5px] text-[#64748B]">For a seller who registered without the referral code. Their onboarding bonus window still counts from their registration date.</p>
        <div><label className={labelCls}>Seller's user ID, email or phone</label><input value={seller} onChange={e => { setSeller(e.target.value); setConfirm(''); }} className={fieldCls} /></div>
        {confirm && <p className="text-[12.5px] text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">{confirm}</p>}
      </div>
    </Modal>
  );
}

export function SalesPersonPanel({ employeeId, notify, onPayout, onChanged }: { employeeId: string; notify: Notify; onPayout: () => void; onChanged: () => void }) {
  const [d, setD] = useState<PersonDetail | null>(null);
  const [error, setError] = useState('');
  const [offer, setOffer] = useState({ joiningDate: '', monthlyCtc: '', location: '' });
  const [targets, setTargets] = useState({ daily: '', weekly: '', monthly: '' });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState('');
  const [dialog, setDialog] = useState<'kyc' | 'lead' | 'seller' | null>(null);

  const load = useCallback(() => {
    loadPerson(employeeId).then(p => {
      setD(p);
      setOffer({ joiningDate: p.offer.joiningDate ? p.offer.joiningDate.slice(0, 10) : '', monthlyCtc: p.offer.monthlyCtc != null ? String(p.offer.monthlyCtc) : '', location: p.offer.location || '' });
      setTargets({ daily: String(p.targets.daily || ''), weekly: String(p.targets.weekly || ''), monthly: String(p.targets.monthly || '') });
    }).catch(e => setError(apiError(e)));
  }, [employeeId]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await salesApiClient.put(`/admin/people/${employeeId}`, {
        offer: { joiningDate: offer.joiningDate || null, monthlyCtc: offer.monthlyCtc === '' ? null : Number(offer.monthlyCtc), location: offer.location },
        targets: { daily: Number(targets.daily) || 0, weekly: Number(targets.weekly) || 0, monthly: Number(targets.monthly) || 0 },
      });
      notify(true, 'Saved');
      onChanged();
    } catch (e) { notify(false, apiError(e)); } finally { setSaving(false); }
  };
  const copy = async (key: string, v?: string) => { if (v && await copyToClipboard(v)) { setCopied(key); setTimeout(() => setCopied(''), 1500); } };

  if (error) return <div className={`${card} p-5`}><ErrorLine text={error} /></div>;
  if (!d) return <div className={`${card} relative h-48`}><TableLoader /></div>;
  const k = d.kyc;
  const small = 'w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-[12.5px] focus:outline-none focus:border-[#00A86B]';

  return (
    <div className={`${card} p-5 flex flex-col gap-5`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[16px] font-bold text-[#0F172A]">{d.person.fullName}</h2>
            <KycChip status={k.status} method={k.method} />
            {!d.person.isEmpActive && <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[11px] font-semibold">Login deactivated</span>}
          </div>
          <p className="text-[12.5px] text-[#64748B] mt-0.5">{d.person.role} · {d.person.employeeId} · {d.person.email} · {d.person.contactNumber}</p>
          <p className="text-[12px] text-[#94A3B8] mt-0.5">Commission plan: {d.plan.name}{d.plan.isDefault ? ' (default)' : ''}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="h-9 px-3.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center text-[13px] font-mono font-semibold text-[#0F172A]">{d.person.referralCode || '—'}</span>
          <button onClick={() => copy('code', d.person.referralCode)} className={`${ghostBtn} h-9`}>{copied === 'code' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}Code</button>
          <button onClick={() => copy('link', referralLinkFor(d.person.referralCode))} className={`${ghostBtn} h-9`}>{copied === 'link' ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}Sign-up link</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setDialog('kyc')} className={k.status === 'pending' ? primaryBtn : ghostBtn}><ShieldCheck className="w-4 h-4" />{k.status === 'pending' ? 'Review KYC' : 'View KYC'}</button>
        {d.offer.issuedAt && <button onClick={() => downloadOfferLetter(employeeId).catch(() => notify(false, 'Could not download the offer letter.'))} className={ghostBtn}><Download className="w-4 h-4" />Offer letter {d.offer.letterNumber}</button>}
        <button onClick={() => setDialog('lead')} className={ghostBtn}><PhoneCall className="w-4 h-4" />Assign lead</button>
        <button onClick={() => setDialog('seller')} className={ghostBtn}><Link2 className="w-4 h-4" />Link existing seller</button>
        <button onClick={onPayout} className={ghostBtn}><Receipt className="w-4 h-4" />Pay out</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <h3 className="text-[13px] font-bold text-[#0F172A] mb-1">Offer letter details</h3>
          <p className="text-[11.5px] text-[#94A3B8] mb-2">{d.offer.issuedAt ? `Issued ${fmtDate(d.offer.issuedAt)} — changes show in the next download.` : 'The letter is issued when KYC is verified.'}</p>
          <div className="grid grid-cols-3 gap-2">
            <div><label className="block text-[11px] font-semibold text-[#64748B] mb-1">Joining date</label><input type="date" value={offer.joiningDate} onChange={e => setOffer({ ...offer, joiningDate: e.target.value })} className={small} /></div>
            <div><label className="block text-[11px] font-semibold text-[#64748B] mb-1">Monthly CTC (₹)</label><input type="number" min={0} value={offer.monthlyCtc} onChange={e => setOffer({ ...offer, monthlyCtc: e.target.value })} className={small} /></div>
            <div><label className="block text-[11px] font-semibold text-[#64748B] mb-1">Location</label><input value={offer.location} onChange={e => setOffer({ ...offer, location: e.target.value })} className={small} /></div>
          </div>
        </div>
        <div>
          <h3 className="text-[13px] font-bold text-[#0F172A] mb-1">Onboarding targets</h3>
          <p className="text-[11.5px] text-[#94A3B8] mb-2">Sellers registered with their code — shown as progress on their dashboard.</p>
          <div className="grid grid-cols-3 gap-2">
            {(['daily', 'weekly', 'monthly'] as const).map(t => (
              <div key={t}><label className="block text-[11px] font-semibold text-[#64748B] mb-1 capitalize">{t}</label><input type="number" min={0} value={targets[t]} onChange={e => setTargets({ ...targets, [t]: e.target.value })} className={small} /></div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end -mt-1"><button disabled={saving} onClick={save} className={primaryBtn}><Save className="w-4 h-4" />{saving ? 'Saving…' : 'Save details'}</button></div>

      {dialog === 'kyc' && <KycReviewDialog employeeId={employeeId} onClose={() => setDialog(null)} onDone={(ok, msg) => { notify(ok, msg); load(); onChanged(); }} />}
      {dialog === 'lead' && <AssignLeadDialog employeeId={employeeId} name={d.person.fullName} onClose={() => setDialog(null)} notify={(ok, msg) => { notify(ok, msg); onChanged(); }} />}
      {dialog === 'seller' && <AttachSellerDialog employeeId={employeeId} name={d.person.fullName} onClose={() => setDialog(null)} notify={(ok, msg) => { notify(ok, msg); onChanged(); }} />}
    </div>
  );
}
