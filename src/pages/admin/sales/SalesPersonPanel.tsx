import React, { useCallback, useEffect, useState } from 'react';
import { Copy, Check, ShieldCheck, Download, PhoneCall, Link2, Receipt, Save, Pencil, RotateCcw, Upload } from 'lucide-react';
import { TableLoader } from '../../../components/ui/TableLoader';
import { copyToClipboard } from '../../../utils/clipboard';
import { salesApiClient, apiError, referralLinkFor, downloadOfferLetter } from '../../../services/salesApi';
import { Modal, ErrorLine, KycChip, KycReviewDialog } from './SalesManagementTabs';
import { card, fieldCls, labelCls, primaryBtn, ghostBtn, fmtDate, loadPerson, type PersonDetail } from './salesUi';

/* Sales Management > one sales person: who they are, KYC, offer letter details, targets, and the admin's actions
   for them (assign a lead, link an existing seller, pay out). Their own dashboard is shown below this panel. */

type Notify = (ok: boolean, msg: string) => void;

const LEAD_COLUMNS: [string, string][] = [['Contact name', 'leadName'], ['Phone', 'phone'], ['Business name', 'businessName'], ['Email', 'email'], ['City', 'city'], ['Category', 'category'], ['Priority', 'priority'], ['Note', 'note']];
const MAX_LEAD_ROWS = 500;
type LeadRow = Record<string, string | number>;

async function downloadLeadTemplate() {
  const XLSX = await import('xlsx');
  const sheet = XLSX.utils.aoa_to_sheet([LEAD_COLUMNS.map(c => c[0]), ['Asha Verma', '9876543210', 'Asha Traders', 'asha@example.com', 'Delhi', 'Fashion', 'high', 'Interested in COD']]);
  sheet['!cols'] = LEAD_COLUMNS.map(() => ({ wch: 20 }));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Leads');
  XLSX.writeFile(book, 'lead-upload-template.xlsx');
}

// Reads the file in the browser. "row" is the row number in the file, so a problem can be found and fixed there.
async function readLeadFile(file: File): Promise<LeadRow[]> {
  const XLSX = await import('xlsx');
  const book = XLSX.read(await file.arrayBuffer());
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(book.Sheets[book.SheetNames[0]], { raw: false, defval: '' });
  const byHeader = new Map(LEAD_COLUMNS.map(([label, key]) => [label.toLowerCase(), key]));
  return rows.map((r, i) => {
    const lead: LeadRow = { row: i + 2 };
    for (const [header, value] of Object.entries(r)) {
      const key = byHeader.get(header.trim().toLowerCase());
      if (key) lead[key] = key === 'priority' ? String(value).trim().toLowerCase() : String(value).trim();
    }
    return lead;
  }).filter(l => Object.keys(l).some(k => k !== 'row' && l[k] !== ''));
}

function AssignLeadDialog({ employeeId, name, onClose, notify }: { employeeId: string; name: string; onClose: () => void; notify: Notify }) {
  const [mode, setMode] = useState<'one' | 'file'>('one');
  const [f, setF] = useState({ leadName: '', phone: '', businessName: '', city: '', category: '', priority: 'medium', note: '' });
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [details, setDetails] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const set = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }));
  const save = async () => {
    setBusy(true); setError('');
    try { const res = await salesApiClient.post('/admin/leads', { employeeId, ...f }); notify(true, res.data?.message || 'Lead assigned'); onClose(); }
    catch (e) { setError(apiError(e)); } finally { setBusy(false); }
  };
  const pickFile = async (file?: File) => {
    setError(''); setDetails([]); setRows([]); setFileName(''); setDone(false);
    if (!file) return;
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) { setError('Please upload an Excel (.xlsx) or CSV file.'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('This file is larger than 2 MB. Please split it into smaller files.'); return; }
    try {
      const read = await readLeadFile(file);
      if (!read.length) { setError('No leads found. Check that the first row has the column names from the template.'); return; }
      if (read.length > MAX_LEAD_ROWS) { setError(`This file has ${read.length} leads. Upload up to ${MAX_LEAD_ROWS} at a time.`); return; }
      setRows(read); setFileName(file.name);
    } catch {
      setError('This file could not be read. Please use the template.');
    }
  };
  const upload = async () => {
    setBusy(true); setError(''); setDetails([]);
    try {
      const res = await salesApiClient.post('/admin/leads', { employeeId, leads: rows });
      const skipped: string[] = res.data?.skipped || [];
      notify(true, res.data?.message || 'Leads assigned');
      if (!skipped.length) { onClose(); return; }
      setError(''); setDetails(skipped); setDone(true); setRows([]);
    } catch (e) {
      setError(apiError(e));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = (e as any)?.response?.data;
      setDetails(d?.errors || d?.skipped || []);
    } finally { setBusy(false); }
  };
  const input = (k: keyof typeof f, label: string) => <div><label className={labelCls}>{label}</label><input value={f[k]} onChange={e => set(k, e.target.value)} className={fieldCls} /></div>;
  const tab = (key: 'one' | 'file', label: string) => (
    <button type="button" onClick={() => { setMode(key); setError(''); }} className={`h-8 px-4 rounded-full text-[12.5px] font-semibold transition-colors ${mode === key ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}>{label}</button>
  );
  return (
    <Modal title={`Assign leads to ${name}`} onClose={onClose}
      footer={<><button onClick={onClose} className={ghostBtn}>{done ? 'Close' : 'Cancel'}</button>
        {mode === 'one'
          ? <button disabled={busy} onClick={save} className={primaryBtn}>{busy ? 'Assigning…' : 'Assign lead'}</button>
          : !done && <button disabled={busy || !rows.length} onClick={upload} className={primaryBtn}>{busy ? 'Assigning…' : rows.length ? `Assign ${rows.length} lead${rows.length === 1 ? '' : 's'}` : 'Assign leads'}</button>}</>}>
      <div className="p-5 flex flex-col gap-3">
        <div className="inline-flex self-start p-1 rounded-full bg-[#F1F5F9] gap-1">{tab('one', 'One lead')}{tab('file', 'Upload file')}</div>
        <ErrorLine text={error} />
        {mode === 'one' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {input('leadName', 'Contact name *')}{input('phone', 'Phone *')}{input('businessName', 'Business name')}{input('city', 'City')}{input('category', 'Category')}
            <div><label className={labelCls}>Priority</label><select value={f.priority} onChange={e => set('priority', e.target.value)} className={fieldCls}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
            <div className="sm:col-span-2">{input('note', 'Note for the sales person')}</div>
          </div>
        ) : (
          <>
            <p className="text-[12.5px] text-[#64748B]">Upload an Excel or CSV file with up to {MAX_LEAD_ROWS} leads. Contact name and Phone are required. A number already given to a sales person is skipped.</p>
            <div className="flex flex-wrap items-center gap-2">
              <label className={`${primaryBtn} cursor-pointer`}>
                <Upload className="w-4 h-4" />Choose file
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; pickFile(file); }} />
              </label>
              <button type="button" onClick={() => downloadLeadTemplate().catch(() => setError('Could not prepare the template. Please try again.'))} className={ghostBtn}><Download className="w-4 h-4" />Download template</button>
            </div>
            {fileName && <p className="text-[12.5px] font-semibold text-[#0F172A]">{fileName}: {rows.length} lead{rows.length === 1 ? '' : 's'} ready</p>}
            {rows.length > 0 && (
              <div className="max-h-44 overflow-auto rounded-xl border border-[#E2E8F0]">
                <table className="w-full text-[12px]">
                  <thead className="bg-[#F8FAFC] text-[#64748B] sticky top-0"><tr><th className="text-left font-semibold px-3 py-1.5">Row</th><th className="text-left font-semibold px-3 py-1.5">Contact</th><th className="text-left font-semibold px-3 py-1.5">Phone</th><th className="text-left font-semibold px-3 py-1.5">Business</th></tr></thead>
                  <tbody>{rows.slice(0, 50).map(r => <tr key={r.row} className="border-t border-[#F1F5F9]"><td className="px-3 py-1.5 text-[#94A3B8]">{r.row}</td><td className="px-3 py-1.5">{r.leadName}</td><td className="px-3 py-1.5 tabular-nums">{r.phone}</td><td className="px-3 py-1.5">{r.businessName}</td></tr>)}</tbody>
                </table>
              </div>
            )}
            {details.length > 0 && (
              <ul className="max-h-40 overflow-auto rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-[12px] text-amber-800 space-y-0.5">
                {details.map(d => <li key={d}>{d}</li>)}
              </ul>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

// The admin's correction of a sales person's details. Each section saves on its own; nothing else changes.
function EditDetailsDialog({ d, employeeId, onClose, onSaved }: { d: PersonDetail; employeeId: string; onClose: () => void; onSaved: (msg: string) => void }) {
  const k = d.kyc;
  const [v, setV] = useState({
    pan: { number: k.pan.number || '', name: k.pan.name || '' },
    aadhaar: { number: k.aadhaar.number || '', name: k.aadhaar.name || '', dob: k.aadhaar.dob || '', address: k.aadhaar.address || '' },
    bank: { accountNumber: k.bank.accountNumber || '', ifsc: k.bank.ifsc || '', holderName: k.bank.holderName || '', bankName: k.bank.bankName || '', branch: k.bank.branch || '' },
    contact: { email: d.person.email || '', contactNumber: d.person.contactNumber || '' },
  });
  const [busy, setBusy] = useState(''); const [error, setError] = useState('');
  const save = async (section: keyof typeof v) => {
    setBusy(section); setError('');
    try {
      const res = await salesApiClient.put(`/admin/people/${employeeId}/details`, { [section]: v[section] });
      onSaved(res.data?.message || 'Details updated.');
    } catch (e) { setError(apiError(e)); } finally { setBusy(''); }
  };
  const field = <S extends keyof typeof v>(section: S, key: keyof (typeof v)[S] & string, label: string, upper = false) => (
    <div key={key}><label className={labelCls}>{label}</label>
      <input value={String(v[section][key])} onChange={e => setV(p => ({ ...p, [section]: { ...p[section], [key]: upper ? e.target.value.toUpperCase() : e.target.value } }))} className={fieldCls} />
    </div>
  );
  const block = (section: keyof typeof v, title: string, fields: React.ReactNode) => (
    <section className="border-b border-[#F1F5F9] pb-4 last:border-b-0 last:pb-0">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[13px] font-bold text-[#0F172A]">{title}</h4>
        <button disabled={!!busy} onClick={() => save(section)} className={`${ghostBtn} h-8`}>{busy === section ? 'Saving…' : 'Save'}</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{fields}</div>
    </section>
  );
  return (
    <Modal title={`Edit details of ${d.person.fullName}`} onClose={onClose} footer={<button onClick={onClose} className={ghostBtn}>Close</button>}>
      <div className="p-5 flex flex-col gap-4">
        <ErrorLine text={error} />
        <p className="text-[12.5px] text-[#64748B]">These are saved as you enter them, without an online check, and the change is recorded against your account.</p>
        {block('contact', 'Email and mobile', <>{field('contact', 'email', 'Email')}{field('contact', 'contactNumber', 'Mobile number')}</>)}
        {block('pan', 'PAN', <>{field('pan', 'number', 'PAN number', true)}{field('pan', 'name', 'Name as on PAN')}</>)}
        {block('aadhaar', 'Aadhaar', <>{field('aadhaar', 'number', 'Aadhaar number')}{field('aadhaar', 'name', 'Name as on Aadhaar')}{field('aadhaar', 'dob', 'Date of birth')}{field('aadhaar', 'address', 'Address')}</>)}
        {block('bank', 'Bank account', <>{field('bank', 'accountNumber', 'Account number')}{field('bank', 'ifsc', 'IFSC', true)}{field('bank', 'holderName', 'Account holder')}{field('bank', 'bankName', 'Bank name')}{field('bank', 'branch', 'Branch')}</>)}
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
  const [dialog, setDialog] = useState<'kyc' | 'lead' | 'seller' | 'details' | null>(null);

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
        <button onClick={() => setDialog('details')} className={ghostBtn}><Pencil className="w-4 h-4" />Edit details</button>
        {d.offer.issuedAt && <button onClick={() => downloadOfferLetter(employeeId).catch((e) => notify(false, e.message))} className={ghostBtn}><Download className="w-4 h-4" />Offer letter {d.offer.letterNumber}</button>}
        {d.offer.downloadedAt && (
          <button
            title={`Downloaded by the sales person on ${fmtDate(d.offer.downloadedAt)}`}
            onClick={async () => {
              try { const res = await salesApiClient.post(`/admin/people/${employeeId}/offer-letter/allow-download`); notify(true, res.data?.message || 'Done'); load(); }
              catch (e) { notify(false, apiError(e)); }
            }}
            className={ghostBtn}
          ><RotateCcw className="w-4 h-4" />Allow download again</button>
        )}
        <button onClick={() => setDialog('lead')} className={ghostBtn}><PhoneCall className="w-4 h-4" />Assign leads</button>
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
      {dialog === 'details' && <EditDetailsDialog d={d} employeeId={employeeId} onClose={() => setDialog(null)} onSaved={(msg) => { notify(true, msg); load(); onChanged(); }} />}
      {dialog === 'lead' && <AssignLeadDialog employeeId={employeeId} name={d.person.fullName} onClose={() => setDialog(null)} notify={(ok, msg) => { notify(ok, msg); onChanged(); }} />}
      {dialog === 'seller' && <AttachSellerDialog employeeId={employeeId} name={d.person.fullName} onClose={() => setDialog(null)} notify={(ok, msg) => { notify(ok, msg); onChanged(); }} />}
    </div>
  );
}
