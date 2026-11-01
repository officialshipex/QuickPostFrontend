import { useEffect, useRef, useState } from 'react';
import { ExternalLink, FileText, ImagePlus, RefreshCw, Settings2, Trash2 } from 'lucide-react';
import { TableLoader } from '../../../components/ui/TableLoader';
import { salesApiClient, apiError } from '../../../services/salesApi';
import { card, fieldCls, labelCls, primaryBtn, ghostBtn, fmtDate } from './salesUi';

/* Sales Management > Settings: the admin designs the offer letter. The preview on the right is the real PDF from the
   same code that makes the download, so what is seen here is what a sales person gets, filled with their data. */
export type LetterTemplate = Record<string, string | boolean>;
type Notify = (ok: boolean, msg: string) => void;

const PLACEHOLDERS = ['name', 'firstName', 'email', 'designation', 'company', 'employeeId', 'letterNumber', 'issueDate', 'address', 'joiningDate', 'location', 'ctc', 'kycMethod', 'kycDate', 'incentivePlan'];

type FieldDef = { key: string; label: string; rows?: number };
const SECTIONS: { title: string; fields: FieldDef[] }[] = [
  { title: 'Letterhead', fields: [
    { key: 'companyName', label: 'Company name' },
    { key: 'companyAddress', label: 'Address', rows: 2 },
    { key: 'companyEmail', label: 'Email' },
    { key: 'companyPhone', label: 'Phone' },
    { key: 'companyGstin', label: 'GSTIN' },
  ] },
  { title: 'Top of the letter', fields: [
    { key: 'reference', label: 'Reference line' },
    { key: 'date', label: 'Date line' },
    { key: 'recipient', label: 'Addressed to (one item per line)', rows: 3 },
    { key: 'subject', label: 'Subject' },
    { key: 'greeting', label: 'Greeting' },
  ] },
  { title: 'Letter', fields: [{ key: 'body', label: 'Letter body', rows: 8 }] },
  { title: 'Incentive section', fields: [
    { key: 'incentiveHeading', label: 'Heading' },
    { key: 'incentiveText', label: 'Incentive details', rows: 10 },
  ] },
  { title: 'Terms and signature', fields: [
    { key: 'termsHeading', label: 'Terms heading' },
    { key: 'terms', label: 'Terms', rows: 5 },
    { key: 'closing', label: 'Closing line' },
    { key: 'signatoryName', label: 'Signatory name' },
    { key: 'signatoryDesignation', label: 'Signatory designation' },
    { key: 'footer', label: 'Small print at the bottom', rows: 2 },
  ] },
];

const blobError = async (e: unknown, fallback: string) => {
  const data = (e as { response?: { data?: unknown } })?.response?.data;
  if (data instanceof Blob) {
    try { return JSON.parse(await data.text()).message || fallback; } catch { return fallback; }
  }
  return apiError(e, fallback);
};

export function OfferLetterEditor({ initial, defaults, publishedAt, notify }: { initial: LetterTemplate; defaults: LetterTemplate; publishedAt?: string | null; notify: Notify }) {
  const [t, setT] = useState<LetterTemplate>(initial);
  const [people, setPeople] = useState<{ _id: string; name: string }[]>([]);
  const [personId, setPersonId] = useState('');
  const [url, setUrl] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState(publishedAt);
  const fileRef = useRef<HTMLInputElement>(null);
  const latest = useRef(0);

  useEffect(() => { salesApiClient.get('/admin/team').then(r => setPeople(r.data?.members || [])).catch(() => {}); }, []);

  // Rebuilt shortly after typing stops; an older reply arriving late is ignored.
  useEffect(() => {
    const timer = setTimeout(async () => {
      const id = ++latest.current;
      setPreviewing(true);
      try {
        const res = await salesApiClient.post('/admin/offer-letter/preview', { offerLetter: t, employeeId: personId || undefined }, { responseType: 'blob' });
        if (id !== latest.current) return;
        setPreviewError('');
        setUrl(old => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(res.data as Blob); });
      } catch (e) {
        if (id === latest.current) setPreviewError(await blobError(e, 'Could not build the preview.'));
      } finally {
        if (id === latest.current) setPreviewing(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [t, personId]);

  const set = (key: string, value: string | boolean) => setT(p => ({ ...p, [key]: value }));

  const pickLogo = (file?: File) => {
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    if (!/\.(png|jpe?g)$/i.test(file.name)) { notify(false, 'The logo must be a PNG or JPG image.'); return; }
    if (file.size > 1024 * 1024) { notify(false, 'The logo must be smaller than 1 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => set('logoData', String(reader.result || ''));
    reader.onerror = () => notify(false, 'Could not read this image. Please try another.');
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await salesApiClient.put('/admin/settings', { offerLetter: t });
      setPublished(new Date().toISOString());
      notify(true, res.data?.message || 'Offer letter saved');
    } catch (e) { notify(false, apiError(e)); } finally { setSaving(false); }
  };

  return (
    <div className={`${card} p-5 flex flex-col gap-4`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2"><Settings2 className="w-4 h-4 text-[#00A86B]" /><h3 className="text-[14px] font-bold text-[#0F172A]">Offer letter</h3></div>
          <p className="text-[12px] text-[#64748B] mt-0.5">
            {published ? `Published ${fmtDate(published)}. Sales people download this letter, filled with their own details.` : 'Not published yet. Sales people can download their letter once you save it here.'}
          </p>
        </div>
        <button disabled={saving} onClick={save} className={primaryBtn}>{saving ? 'Saving…' : 'Save & publish letter'}</button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
        <div className="flex flex-col gap-5 min-w-0">
          <section>
            <h4 className="text-[13px] font-bold text-[#0F172A] mb-2">Logo</h4>
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-14 w-40 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-center overflow-hidden px-2">
                <img src={String(t.logoData || '/branded-tracking/quickpost-logo.png')} alt="Letter logo" className="max-h-12 max-w-full object-contain" />
              </div>
              <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg" className="hidden" onChange={e => pickLogo(e.target.files?.[0])} />
              <button type="button" onClick={() => fileRef.current?.click()} className={ghostBtn}><ImagePlus className="w-4 h-4" />Change logo</button>
              {!!t.logoData && <button type="button" onClick={() => set('logoData', '')} className={ghostBtn}><Trash2 className="w-4 h-4" />Use QuickPost logo</button>}
            </div>
          </section>

          {SECTIONS.map(s => (
            <section key={s.title}>
              <h4 className="text-[13px] font-bold text-[#0F172A] mb-2">{s.title}</h4>
              {s.title === 'Incentive section' && (
                <p className="text-[12px] text-[#64748B] mb-3">Filled in from your default commission plan. Edit it freely, or clear the text to leave this section off the letter. To print each person's own plan instead, write {'{{incentivePlan}}'}.</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {s.fields.map(f => (
                  <div key={f.key} className={f.rows ? 'sm:col-span-2' : ''}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={`${labelCls} !mb-0`}>{f.label}</label>
                      {t[f.key] !== defaults[f.key] && !!defaults[f.key] && (
                        <button type="button" onClick={() => set(f.key, defaults[f.key])} className="text-[11.5px] font-semibold text-[#00A86B]">Reset</button>
                      )}
                    </div>
                    {f.rows
                      ? <textarea rows={f.rows} value={String(t[f.key] ?? '')} onChange={e => set(f.key, e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-[13px] focus:outline-none focus:border-[#00A86B] resize-y" />
                      : <input value={String(t[f.key] ?? '')} onChange={e => set(f.key, e.target.value)} className={fieldCls} />}
                  </div>
                ))}
              </div>
            </section>
          ))}

          <p className="text-[12px] text-[#64748B] leading-relaxed">
            <span className="font-semibold">Filled in for each person: </span>
            {PLACEHOLDERS.map(p => <code key={p} className="inline-block mr-1.5 mb-1 px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[11px] text-[#475569]">{`{{${p}}}`}</code>)}
          </p>
        </div>

        <div className="xl:sticky xl:top-4 flex flex-col gap-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <FileText className="w-4 h-4 text-[#64748B]" />
            <span className="text-[12.5px] font-semibold text-[#475569]">Preview for</span>
            <select value={personId} onChange={e => setPersonId(e.target.value)} className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-[12.5px] bg-white min-w-0 max-w-[220px] focus:outline-none focus:border-[#00A86B]">
              <option value="">Sample person</option>
              {people.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
            {previewing && <RefreshCw className="w-4 h-4 text-[#94A3B8] animate-spin" />}
            {url && <a href={url} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 text-[12px] font-semibold text-[#00A86B] hover:underline">Open <ExternalLink className="w-3 h-3" /></a>}
          </div>
          {previewError && <p className="px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-[12.5px] text-red-600">{previewError}</p>}
          <div className="relative h-[70vh] min-h-[420px] rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] overflow-hidden">
            {url ? <iframe key={url} src={`${url}#toolbar=0&navpanes=0`} title="Offer letter preview" className="w-full h-full" /> : <TableLoader />}
          </div>
        </div>
      </div>
    </div>
  );
}
