import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import offerImg from '../../assets/offer.webp';

/* Landing-page offer banner: appears 5s after every visit to the landing page. Clicking it opens sign-up. */
const DELAY_MS = 5000;

export function OfferPopup() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setOpen(true), DELAY_MS);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="offer" className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-[#0F172A]/60 backdrop-blur-sm" onClick={close} />
          <motion.div role="dialog" aria-modal="true" aria-label="Wallet recharge offer"
            initial={{ opacity: 0, scale: 0.92, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[760px]">
            <button type="button" onClick={() => { close(); navigate('/register'); }}
              className="block w-full rounded-2xl overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#00A86B]/50">
              <img src={offerImg} alt="Recharge your wallet for ₹5,000 and get up to ₹10,000 cashback" className="w-full h-auto block" draggable={false} />
            </button>
            <button type="button" onClick={close} aria-label="Close offer"
              className="absolute -top-3 -right-3 md:-top-4 md:-right-4 w-9 h-9 md:w-10 md:h-10 rounded-full bg-white text-[#0F172A] shadow-lg ring-1 ring-black/10 flex items-center justify-center hover:bg-[#F1F5F9] hover:rotate-90 transition-all duration-200">
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
