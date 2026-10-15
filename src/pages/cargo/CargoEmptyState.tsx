import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Plus } from 'lucide-react';
import cargoEmptyImg from '../../assets/cargo-empty-orders.png';

/* Empty state for Cargo listings — illustration, short headline, one supporting line and
   a single next step. Replaces the shared Lottie EmptyState on Cargo pages. */
export function CargoEmptyState({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full flex flex-col items-center justify-center text-center px-6 py-8 md:py-10"
    >
      <div className="max-w-[360px] w-full flex flex-col items-center">
      <motion.img
        src={cargoEmptyImg}
        alt=""
        aria-hidden="true"
        draggable={false}
        animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
        transition={reduceMotion ? undefined : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        className={`${compact ? 'w-[220px]' : 'w-[240px] md:w-[280px]'} h-auto select-none mx-auto`}
      />
      <h3 className="mt-5 text-[16px] md:text-[17px] font-bold text-[#0F172A]">Ready when you are</h3>
      <p className="mt-1.5 text-[12.5px] md:text-[13px] leading-relaxed text-[#64748B]">
        Your Cargo orders will appear here.
      </p>
      <button
        type="button"
        onClick={() => navigate('/user/add-order')}
        className="mt-4 h-10 px-5 rounded-full bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-semibold inline-flex items-center gap-1.5 shadow-sm transition-colors"
      >
        <Plus className="w-4 h-4" /> Create Order
      </button>
      </div>
    </motion.div>
  );
}
