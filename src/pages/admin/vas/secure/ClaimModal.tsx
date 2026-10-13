import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Loader2, Paperclip, X } from 'lucide-react';
import { apiMessage, fmtMoney } from '../vasApi';
import { secureApi, type Claim, type ClaimType, type Evidence, type Policy } from './secureApi';

const MAX_FILES = 5;
const inputCls = 'w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10';

type Props =
  | { mode: 'new'; policy: Policy; type: ClaimType; onClose: () => void; onDone: (claim: Claim) => void }
  | { mode: 'respond'; claim: Claim; onClose: () => void; onDone: (claim: Claim) => void };

/** File a new claim, or answer the admin's request for more details on an existing one. */
export function ClaimModal(props: Props) {
  const isNew = props.mode === 'new';
  const policy = isNew ? props.policy : null;
  const type: ClaimType = isNew ? props.type : props.claim.type;
  const [amount, setAmount] = useState(isNew && type === 'lost' ? String(props.policy.coverAmount) : '');
  const [text, setText] = useState('');
  const [files, setFiles] = useState<Evidence[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = async (list: FileList | null) => {
    if (!list?.length) return;
    setError('');
    if (files.length + list.length > MAX_FILES) { setError(`You can attach up to ${MAX_FILES} files.`); return; }
    setUploading(true);
    try {
      const done: Evidence[] = [];
      for (const f of Array.from(list)) done.push(await secureApi.upload(f));
      setFiles((prev) => [...prev, ...done]);
    } catch (err) {
      setError(apiMessage(err, 'Could not upload the file. Please try again.'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const submit = async () => {
    setError('');
    if (isNew && type === 'damaged' && !files.length) { setError('Please attach photos of the damaged shipment.'); return; }
    if (isNew && text.trim().length < 10) { setError('Please describe what happened (at least a few words).'); return; }
    if (!isNew && !text.trim() && !files.length) { setError('Add a note or attach a file.'); return; }
    setBusy(true);
    try {
      const claim = isNew
        ? await secureApi.createClaim({ policyId: props.policy._id, type, amount: amount ? Number(amount) : undefined, description: text.trim(), evidence: files })
        : await secureApi.respond(props.claim._id, { note: text.trim(), evidence: files });
      props.onDone(claim);
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const title = isNew ? `${type === 'lost' ? 'Lost' : 'Damaged'} shipment claim` : `Add details — ${props.claim.claimNo}`;

  return (
    <AnimatePresence>
      <motion.div key="bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !busy && props.onClose()} className="fixed inset-0 bg-[#0F172A]/50 backdrop-blur-sm z-[200]" />
      <div key="box" className="fixed inset-0 flex items-center justify-center z-[201] p-4 pointer-events-none">
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-full max-w-[480px] max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-6 pointer-events-auto border border-[#E2E8F0]" role="dialog" aria-modal="true" aria-label={title}>
          <div className="flex items-start justify-between gap-3 mb-1">
            <h2 className="text-[15px] font-bold text-[#0F172A]">{title}</h2>
            <button type="button" onClick={props.onClose} disabled={busy} className="w-7 h-7 -mt-1 -mr-1 rounded-lg text-[#94A3B8] hover:bg-[#F1F5F9] flex items-center justify-center" aria-label="Close"><X className="w-4 h-4" /></button>
          </div>
          {policy ? (
            <p className="text-[12.5px] text-[#64748B] mb-4">AWB <span className="font-semibold text-[#0F172A]">{policy.awb}</span> · covered up to {fmtMoney(policy.coverAmount)}</p>
          ) : (
            <p className="text-[12.5px] text-[#B45309] bg-[#FFFBEB] border border-[#FDE68A] rounded-lg px-3 py-2 mb-4">{(props as { claim: Claim }).claim.adminNote || 'Please add the details we asked for.'}</p>
          )}

          <div className="space-y-4">
            {isNew && (
              <div>
                <label className="text-[12px] font-bold text-[#475569] block mb-1.5">Amount you are claiming (₹){type === 'lost' && <span className="font-medium text-[#94A3B8]"> — full cover by default</span>}</label>
                <input type="number" min={1} max={policy!.coverAmount} value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} placeholder={type === 'damaged' ? 'Value of the damage' : ''} />
              </div>
            )}
            <div>
              <label className="text-[12px] font-bold text-[#475569] block mb-1.5">{isNew ? 'What happened?' : 'Your reply'}</label>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={2000} className={inputCls} placeholder={isNew ? (type === 'lost' ? 'e.g. The courier marked it lost; the customer never received it.' : 'e.g. The box arrived crushed and the product inside is broken.') : 'Write your answer here'} />
            </div>
            <div>
              <label className="text-[12px] font-bold text-[#475569] block mb-1.5">
                {type === 'damaged' && isNew ? 'Photos of the damage (required)' : 'Photos / documents'} <span className="font-medium text-[#94A3B8]">— JPG, PNG, WebP or PDF, up to 3 MB each</span>
              </label>
              {files.length > 0 && (
                <ul className="space-y-1.5 mb-2">
                  {files.map((f, i) => (
                    <li key={f.url} className="flex items-center gap-2 text-[12.5px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2">
                      <FileText className="w-4 h-4 text-[#64748B] shrink-0" />
                      <span className="truncate flex-1">{f.name || `File ${i + 1}`}</span>
                      <button type="button" onClick={() => setFiles((l) => l.filter((x) => x.url !== f.url))} className="text-[#94A3B8] hover:text-red-600" aria-label="Remove file"><X className="w-3.5 h-3.5" /></button>
                    </li>
                  ))}
                </ul>
              )}
              <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple className="hidden" onChange={(e) => pick(e.target.files)} />
              <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading || files.length >= MAX_FILES} className="h-9 px-4 rounded-lg border border-dashed border-[#CBD5E1] text-[12.5px] font-semibold text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-60 inline-flex items-center gap-2">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />} {uploading ? 'Uploading…' : 'Attach files'}
              </button>
            </div>
          </div>

          {error && <p className="mt-4 text-[12.5px] font-semibold text-red-600">{error}</p>}

          <div className="flex gap-3 mt-5">
            <button type="button" onClick={props.onClose} disabled={busy} className="flex-1 h-10 rounded-full border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] text-[13px] font-bold">Cancel</button>
            <button type="button" onClick={submit} disabled={busy || uploading} className="flex-1 h-10 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-bold disabled:opacity-60 inline-flex items-center justify-center gap-2">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} {isNew ? 'Submit claim' : 'Send'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
