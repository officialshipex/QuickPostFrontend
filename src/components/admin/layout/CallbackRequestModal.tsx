import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Check, CheckCircle2, Loader2, PhoneCall, X } from 'lucide-react';
import { apiClient } from '../../../services/apiClient';

/* Seller → "Get a callback" (Quick Actions). Name + mobile prefilled when known, a topic, a time slot and a note.
   Saved by the backend (POST /contact-requests/seller, the seller account is taken from the login) and listed for
   the team in Admin → System → Callback Requests ("Seller panel"). The topics and slots must match the backend's
   list (contactRequest/contactRequest.controller.js). */

const TOPICS = ['Orders & shipping', 'Pickup', 'NDR / RTO', 'COD remittance', 'Wallet & billing', 'Other'];
const SLOTS = ['As soon as possible', 'Morning (9–12)', 'Afternoon (12–4)', 'Evening (4–7)'];

export function CallbackRequestModal({ open, onClose, defaultName = '', defaultPhone = '' }: {
  open: boolean; onClose: () => void; defaultName?: string; defaultPhone?: string;
}) {
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(String(defaultPhone || '').replace(/\D/g, '').slice(-10));
  const [topic, setTopic] = useState(TOPICS[0]);
  const [slot, setSlot] = useState(SLOTS[0]);
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  // The caller passes a new inline onClose on every render (and the header re-renders on a timer). The reset used to
  // depend on onClose, so it wiped whatever the seller was typing every few seconds. Keep onClose in a ref instead.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  // Reset only when the form opens (defaults are plain strings, stable across re-renders).
  useEffect(() => {
    if (!open) return;
    setName(defaultName); setPhone(String(defaultPhone || '').replace(/\D/g, '').slice(-10));
    setTopic(TOPICS[0]); setSlot(SLOTS[0]); setNote(''); setTouched(false); setDone(false); setError(''); setSending(false);
  }, [open, defaultName, defaultPhone]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const nameErr = touched && name.trim().length < 2 ? 'Please enter your name' : '';
  const phoneErr = touched && !/^[6-9]\d{9}$/.test(phone) ? 'Enter a valid 10-digit mobile number' : '';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (sending || name.trim().length < 2 || !/^[6-9]\d{9}$/.test(phone)) return;
    setSending(true);
    setError('');
    try {
      await apiClient.post('/contact-requests/seller', { name: name.trim(), phone, topic, slot, note: note.trim() });
      setDone(true);
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(err?.response?.data?.message || 'Could not send your request right now. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const field = (err: string) =>
    `w-full h-11 px-4 rounded-full border bg-white text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-4 transition-all ${
      err ? 'border-red-300 focus:ring-red-100' : 'border-[#E2E8F0] focus:border-[#00A86B] focus:ring-[#00A86B]/10'}`;
  const chip = (on: boolean) =>
    `h-8 px-3.5 rounded-full border text-[12.5px] font-medium transition-all ${on ? 'border-[#00A86B] bg-[#ECFDF5] text-[#047857]' : 'border-[#E2E8F0] text-[#475569] hover:border-[#CBD5E1]'}`;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center sm:p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
          <motion.div role="dialog" aria-modal="true" aria-label="Get a callback"
            initial={{ y: 24, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 16, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="relative w-full sm:max-w-[460px] max-h-[92vh] overflow-y-auto bg-white rounded-t-[24px] sm:rounded-[24px] shadow-[0_30px_80px_-20px_rgba(15,23,42,0.45)]">
            <button type="button" onClick={onClose} aria-label="Close"
              className="absolute right-3 top-3 w-8 h-8 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors">
              <X className="w-4 h-4" />
            </button>

            {done ? (
              <div className="px-6 py-10 text-center">
                <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                  className="mx-auto w-14 h-14 rounded-full bg-[#ECFDF5] flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-[#00A86B]" />
                </motion.span>
                <h3 className="mt-4 text-[19px] font-bold text-[#0F172A]">Callback requested</h3>
                <p className="mt-1.5 text-[13.5px] text-[#64748B] leading-relaxed">
                  Our team will call you on <b className="text-[#0F172A]">+91 {phone}</b>{slot !== SLOTS[0] ? <> in the {slot.split(' (')[0].toLowerCase()}</> : ' shortly'}.
                </p>
                <button type="button" onClick={onClose} className="mt-6 h-10 px-6 rounded-full bg-[#00A86B] hover:bg-[#00965F] text-white text-[13.5px] font-bold transition-colors">Done</button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="p-5 sm:p-6">
                <div className="flex items-center gap-3 pr-8">
                  <span className="w-11 h-11 rounded-2xl bg-[#ECFDF5] flex items-center justify-center shrink-0"><PhoneCall className="w-5 h-5 text-[#00A86B]" /></span>
                  <div>
                    <h3 className="text-[17px] font-bold text-[#0F172A] leading-tight">Get a callback</h3>
                    <p className="text-[12.5px] text-[#64748B]">Our support team will call you back.</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="block mb-1.5 pl-1 text-[12.5px] font-semibold text-[#334155]">Name</span>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className={field(nameErr)} />
                    {nameErr && <span className="block mt-1 pl-1 text-[11.5px] text-red-500">{nameErr}</span>}
                  </label>
                  <label className="block">
                    <span className="block mb-1.5 pl-1 text-[12.5px] font-semibold text-[#334155]">Mobile number</span>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] text-[#64748B]">+91</span>
                      <input value={phone} inputMode="numeric" placeholder="10-digit number"
                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} className={`${field(phoneErr)} pl-12`} />
                    </div>
                    {phoneErr && <span className="block mt-1 pl-1 text-[11.5px] text-red-500">{phoneErr}</span>}
                  </label>
                </div>

                <div className="mt-4">
                  <span className="block mb-2 pl-1 text-[12.5px] font-semibold text-[#334155]">What is it about?</span>
                  <div className="flex flex-wrap gap-1.5">
                    {TOPICS.map(t => (
                      <button key={t} type="button" onClick={() => setTopic(t)} aria-pressed={topic === t} className={chip(topic === t)}>
                        {topic === t && <Check className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />}{t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <span className="block mb-2 pl-1 text-[12.5px] font-semibold text-[#334155]">When should we call?</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {SLOTS.map(s => <button key={s} type="button" onClick={() => setSlot(s)} aria-pressed={slot === s} className={chip(slot === s)}>{s}</button>)}
                  </div>
                </div>

                <label className="block mt-4">
                  <span className="block mb-1.5 pl-1 text-[12.5px] font-semibold text-[#334155]">Note <span className="font-normal text-[#94A3B8]">(optional)</span></span>
                  <textarea value={note} onChange={e => setNote(e.target.value.slice(0, 300))} rows={3} placeholder="AWB / order number or a short description"
                    className="w-full px-4 py-2.5 rounded-[18px] border border-[#E2E8F0] text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] resize-none focus:outline-none focus:border-[#00A86B] focus:ring-4 focus:ring-[#00A86B]/10 transition-all" />
                </label>

                {error && (
                  <div role="alert" className="mt-4 flex items-start gap-2 px-3.5 py-2.5 rounded-2xl bg-red-50 border border-red-100 text-[12.5px] font-medium text-red-600">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-px" />{error}
                  </div>
                )}
                <button type="submit" disabled={sending}
                  className="mt-4 w-full h-11 rounded-full bg-[#00A86B] hover:bg-[#00965F] disabled:opacity-70 text-white text-[14px] font-bold inline-flex items-center justify-center gap-2 transition-colors">
                  {sending ? <><Loader2 className="w-4 h-4 animate-spin" />Requesting…</> : <><PhoneCall className="w-4 h-4" />Request callback</>}
                </button>
                <p className="mt-2.5 text-center text-[11.5px] text-[#94A3B8]">Support hours: Mon–Sat, 9am–7pm IST</p>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
