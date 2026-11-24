import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight, Check, CheckCircle2, Clock, Copy, Headphones, Loader2, Mail, MapPin, PhoneCall, Search, Calculator,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { copyToClipboard } from '../utils/clipboard';
import { apiClient } from '../services/apiClient';

/* Contact Us — public page (desktop + mobile).
   Support email + hours, and a "Request a callback" form: saved by the backend (POST /contact-requests) and
   listed for the team in Admin → Callback Requests. */

const EASE = [0.16, 1, 0.3, 1] as const;
const SUPPORT_EMAIL = 'support@quickpost.in';

type Form = { name: string; phone: string; note: string };
const EMPTY: Form = { name: '', phone: '', note: '' };

function validate(f: Form) {
  const e: Partial<Record<keyof Form, string>> = {};
  if (f.name.trim().length < 2) e.name = 'Please enter your name';
  if (!/^[6-9]\d{9}$/.test(f.phone)) e.phone = 'Enter a valid 10-digit mobile number';
  return e;
}

const inputCls = (err?: string) =>
  `w-full h-12 px-4 rounded-full border bg-white text-[14.5px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-4 transition-all ${
    err ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-[#E2E8F0] focus:border-[#00A86B] focus:ring-[#00A86B]/10'}`;

function Field({ label, optional, error, children }: { label: string; optional?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block mb-1.5 pl-1 text-[13px] font-semibold text-[#334155]">
        {label}{optional && <span className="ml-1 font-normal text-[#94A3B8]">(optional)</span>}
      </span>
      {children}
      <AnimatePresence>
        {error && (
          <motion.span initial={{ opacity: 0, y: -2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="block mt-1.5 pl-1 text-[12px] font-medium text-red-500">{error}</motion.span>
        )}
      </AnimatePresence>
    </label>
  );
}

function CallbackForm() {
  const [f, setF] = useState<Form>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<Form | null>(null);
  const [sendError, setSendError] = useState('');
  // hidden from people; bots that fill every field fill this one too (the backend then saves nothing)
  const [website, setWebsite] = useState('');
  const errors = touched ? validate(f) : {};
  const set = <K extends keyof Form>(k: K, v: Form[K]) => { setSendError(''); setF(p => ({ ...p, [k]: v })); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (Object.keys(validate(f)).length) return;
    setSending(true);
    setSendError('');
    try {
      await apiClient.post('/contact-requests', { name: f.name.trim(), phone: f.phone, note: f.note.trim(), website });
      setDone(f);
    } catch (err: any) {
      setSendError(err?.response?.data?.message || 'Could not send your request. Please check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative bg-white rounded-[28px] border border-[#EEF2F6] shadow-[0_24px_60px_-28px_rgba(15,23,42,0.28)] p-6 sm:p-8">
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: EASE }}
            className="py-10 text-center">
            <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
              className="mx-auto w-16 h-16 rounded-full bg-[#ECFDF5] flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-[#00A86B]" />
            </motion.span>
            <h3 className="mt-5 text-[22px] font-bold text-[#0F172A]">Callback requested</h3>
            <p className="mt-2 text-[14.5px] text-[#475569] max-w-[380px] mx-auto leading-relaxed">
              Thanks, {done.name.split(' ')[0]}. We will call you on <b className="text-[#0F172A]">+91 {done.phone}</b> soon.
            </p>
            <button type="button" onClick={() => { setDone(null); setF(EMPTY); setTouched(false); }}
              className="mt-7 h-11 px-6 rounded-full border border-[#E2E8F0] text-[14px] font-semibold text-[#334155] hover:border-[#00A86B] hover:text-[#00A86B] transition-colors">
              Request another callback
            </button>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={submit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-2xl bg-[#ECFDF5] flex items-center justify-center shrink-0"><PhoneCall className="w-5 h-5 text-[#00A86B]" /></span>
              <div>
                <h2 className="text-[20px] sm:text-[22px] font-bold text-[#0F172A] leading-tight">Request a callback</h2>
                <p className="text-[13.5px] text-[#64748B]">Share your details and we’ll call you back.</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <Field label="Name" error={errors.name}>
                <input value={f.name} onChange={e => set('name', e.target.value)} placeholder="Your name" autoComplete="name" className={inputCls(errors.name)} />
              </Field>
              <Field label="Mobile number" error={errors.phone}>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14.5px] font-medium text-[#64748B]">+91</span>
                  <input value={f.phone} inputMode="numeric" autoComplete="tel-national" placeholder="10-digit number"
                    onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} className={`${inputCls(errors.phone)} pl-[52px]`} />
                </div>
              </Field>
              <Field label="Note" optional>
                <textarea value={f.note} onChange={e => set('note', e.target.value.slice(0, 300))} rows={3} placeholder="Tell us briefly what you need"
                  className="w-full px-4 py-3 rounded-[20px] border border-[#E2E8F0] bg-white text-[14.5px] text-[#0F172A] placeholder:text-[#94A3B8] resize-none focus:outline-none focus:border-[#00A86B] focus:ring-4 focus:ring-[#00A86B]/10 transition-all" />
              </Field>
              {/* honeypot: off-screen, not reachable by keyboard, ignored by autofill */}
              <input type="text" name="website" value={website} onChange={e => setWebsite(e.target.value)}
                tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] w-px h-px opacity-0" />
            </div>

            {sendError && (
              <p role="alert" className="mt-4 rounded-2xl bg-red-50 border border-red-100 px-4 py-2.5 text-[13px] font-medium text-red-600">{sendError}</p>
            )}

            <button type="submit" disabled={sending}
              className="mt-4 w-full h-12 rounded-full bg-[#00A86B] hover:bg-[#00965F] disabled:opacity-70 text-white text-[15px] font-bold inline-flex items-center justify-center gap-2 shadow-[0_12px_24px_-12px_rgba(0,168,107,0.7)] transition-colors">
              {sending ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</> : <>Request callback <ArrowRight className="w-4 h-4" /></>}
            </button>
            <p className="mt-3 text-center text-[12px] text-[#94A3B8]">We only use your number to call you back about this request.</p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Contact() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (await copyToClipboard(SUPPORT_EMAIL)) { setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0F172A] selection:bg-[#00A86B]/20 selection:text-[#00A86B]" style={{ fontFamily: 'Roboto, sans-serif' }}>
      <Navbar alwaysFloating />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-[#F8FAFC] pt-[110px] pb-16 md:pt-[150px] md:pb-24">
          <div aria-hidden className="absolute inset-0 opacity-[0.5] [background-image:radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
          <div aria-hidden className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-[#00A86B]/[0.07] blur-3xl" />

          <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] gap-10 lg:gap-14 items-start">
            {/* Left: copy + contact channels */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
              <span className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full bg-white border border-[#E2E8F0] text-[12.5px] font-semibold text-[#047857]">
                <Headphones className="w-4 h-4" /> Contact Us
              </span>
              <h1 className="mt-5 text-[34px] sm:text-[44px] lg:text-[52px] font-bold leading-[1.08] tracking-[-0.02em]">
                Talk to the <span className="text-[#00A86B]">QuickPost</span> team
              </h1>
              <p className="mt-4 text-[16px] md:text-[17px] text-[#475569] leading-relaxed max-w-[520px]">
                Questions about shipping, pricing or an order? Write to us or request a callback. We will get back to you soon.
              </p>

              <div className="mt-8 space-y-3 max-w-[520px]">
                <div className="group flex items-center gap-4 rounded-[22px] bg-white border border-[#EEF2F6] p-4 sm:p-5 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.25)]">
                  <span className="w-12 h-12 rounded-2xl bg-[#ECFDF5] flex items-center justify-center shrink-0"><Mail className="w-5 h-5 text-[#00A86B]" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-medium text-[#64748B]">Email us</div>
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="block text-[16px] sm:text-[17px] font-bold text-[#0F172A] hover:text-[#00A86B] truncate transition-colors">{SUPPORT_EMAIL}</a>
                    <div className="text-[12.5px] text-[#94A3B8]">We will get back to you soon.</div>
                  </div>
                  <button type="button" onClick={copy} aria-label="Copy email address"
                    className="shrink-0 h-9 px-3.5 rounded-full border border-[#E2E8F0] text-[12.5px] font-semibold text-[#475569] hover:border-[#00A86B] hover:text-[#00A86B] inline-flex items-center gap-1.5 transition-colors">
                    {copied ? <><Check className="w-3.5 h-3.5" />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 rounded-[22px] bg-white border border-[#EEF2F6] p-4">
                    <span className="w-10 h-10 rounded-xl bg-[#FFF7ED] flex items-center justify-center shrink-0"><Clock className="w-5 h-5 text-[#EA580C]" /></span>
                    <div><div className="text-[12.5px] text-[#64748B]">Support hours</div><div className="text-[14px] font-semibold text-[#0F172A]">Mon–Sat, 9am–7pm IST</div></div>
                  </div>
                  <div className="flex items-center gap-3 rounded-[22px] bg-white border border-[#EEF2F6] p-4">
                    <span className="w-10 h-10 rounded-xl bg-[#EEF4FF] flex items-center justify-center shrink-0"><MapPin className="w-5 h-5 text-[#2F80ED]" /></span>
                    <div><div className="text-[12.5px] text-[#64748B]">Serving sellers</div><div className="text-[14px] font-semibold text-[#0F172A]">Across India</div></div>
                  </div>
                </div>
              </div>

              {/* Self-serve shortcuts */}
              <div className="mt-8 max-w-[520px]">
                <div className="text-[13px] font-semibold text-[#334155]">Looking for something quick?</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link to="/track" className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-white border border-[#E2E8F0] text-[13.5px] font-medium text-[#334155] hover:border-[#00A86B] hover:text-[#00A86B] transition-colors">
                    <Search className="w-4 h-4" /> Track a shipment
                  </Link>
                  <Link to="/rate-calculator" className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-white border border-[#E2E8F0] text-[13.5px] font-medium text-[#334155] hover:border-[#00A86B] hover:text-[#00A86B] transition-colors">
                    <Calculator className="w-4 h-4" /> Check shipping rates
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Right: callback form */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}>
              <CallbackForm />
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
