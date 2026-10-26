import { useState } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Link2, Check } from 'lucide-react';
import { copyToClipboard } from '../../utils/clipboard';

/* Wraps a desktop-only page. On phones (< md) it shows a short notice to open it on desktop, with a
   "Copy link" action; the page itself renders only from md up. */
export function DesktopPreferred({ title, children }: { title: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (await copyToClipboard(window.location.href)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <>
      <div className="md:hidden flex items-start justify-center pt-6 pb-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[420px] bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)] overflow-hidden">
            {/* Illustration: phone → desktop */}
            <div className="relative bg-[#F8FAFC] border-b border-[#F1F5F9] h-[150px] flex items-center justify-center overflow-hidden">
              <span aria-hidden className="absolute inset-0 opacity-60 [background-image:radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:14px_14px] [mask-image:radial-gradient(circle_at_center,black,transparent_70%)]" />
              <div className="relative flex items-end gap-5">
                {/* Phone */}
                <div className="w-[34px] h-[60px] rounded-[8px] border-2 border-[#94A3B8] bg-white flex flex-col items-center justify-between py-1">
                  <span className="w-3 h-[2px] rounded-full bg-[#CBD5E1]" />
                  <span className="w-2/3 space-y-1">
                    <span className="block h-[3px] rounded bg-[#E2E8F0]" />
                    <span className="block h-[3px] rounded bg-[#E2E8F0]" />
                  </span>
                  <span className="w-2 h-2 rounded-full border border-[#CBD5E1]" />
                </div>
                {/* Transfer dots */}
                <div className="flex gap-1.5 mb-7" aria-hidden>
                  {[0, 1, 2].map(i => (
                    <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-[#00A86B]"
                      animate={{ opacity: [0.25, 1, 0.25] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                  ))}
                </div>
                {/* Desktop */}
                <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="flex flex-col items-center">
                  <div className="w-[104px] h-[66px] rounded-lg border-2 border-[#0F172A] bg-white p-1.5 flex gap-1.5">
                    <span className="w-4 rounded-sm bg-[#0F172A]/90" />
                    <span className="flex-1 flex flex-col gap-1">
                      <span className="h-2.5 rounded-sm bg-[#00A86B]/85" />
                      <span className="flex-1 grid grid-cols-3 gap-1">
                        <span className="rounded-sm bg-[#F1F5F9]" /><span className="rounded-sm bg-[#F1F5F9]" /><span className="rounded-sm bg-[#F1F5F9]" />
                      </span>
                    </span>
                  </div>
                  <span className="w-4 h-2.5 bg-[#0F172A]" />
                  <span className="w-12 h-1 rounded-full bg-[#0F172A]" />
                </motion.div>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-[#00A86B]">
                <Monitor className="w-3.5 h-3.5" /> Best on desktop
              </div>
              <h2 className="mt-1.5 text-[17px] font-bold text-[#0F172A] leading-snug">Open {title} on desktop</h2>
              <p className="mt-1 text-[13px] text-[#64748B]">Switch to a laptop or desktop for a better experience.</p>

              <div className="mt-4">
                <button type="button" onClick={copy}
                  className="w-full h-11 rounded-xl bg-[#00A86B] hover:bg-[#00965F] text-white text-[13.5px] font-bold inline-flex items-center justify-center gap-2 transition-colors">
                  {copied ? <><Check className="w-4 h-4" /> Link copied</> : <><Link2 className="w-4 h-4" /> Copy link for desktop</>}
                </button>
              </div>
            </div>
          </motion.div>
      </div>
      <div className="hidden md:block">{children}</div>
    </>
  );
}
