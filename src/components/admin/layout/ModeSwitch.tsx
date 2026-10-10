import { motion } from 'framer-motion';
import { Package, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useShippingMode, type ShippingMode } from '../../../context/shippingMode';

/* Segmented B2C | Cargo switch. `light` for the white navbar, `dark` for the mobile drawer.
   Switching lands on Home so the seller never sits on a page the other mode doesn't have. */

const OPTIONS: { mode: ShippingMode; label: string; icon: typeof Package }[] = [
  { mode: 'b2c', label: 'B2C', icon: Package },
  { mode: 'cargo', label: 'Cargo', icon: Truck },
];

export function ModeSwitch({ variant = 'light', layoutId = 'mode-switch-pill' }: { variant?: 'light' | 'dark'; layoutId?: string }) {
  const { mode, setMode } = useShippingMode();
  const navigate = useNavigate();
  const dark = variant === 'dark';

  const choose = (next: ShippingMode) => {
    if (next === mode) return;
    setMode(next);
    navigate('/user/home');
  };

  return (
    <div
      role="radiogroup"
      aria-label="Shipping mode"
      className={`relative inline-flex items-center p-1 rounded-full shrink-0 ${dark ? 'bg-white/10' : 'bg-[#F1F5F9] border border-[#E2E8F0]'}`}
    >
      {OPTIONS.map(o => {
        const active = o.mode === mode;
        const Icon = o.icon;
        return (
          <button
            key={o.mode}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => choose(o.mode)}
            className={`relative h-8 px-3.5 rounded-full text-[12.5px] font-semibold inline-flex items-center gap-1.5 transition-colors focus:outline-none ${
              active
                ? 'text-[#0F172A]'
                : dark ? 'text-[#94A3B8] hover:text-white' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                className="absolute inset-0 rounded-full bg-white shadow-[0_1px_2px_rgba(16,24,40,0.08),0_1px_6px_rgba(16,24,40,0.08)]"
              />
            )}
            <Icon className={`relative w-3.5 h-3.5 ${active ? 'text-[#00A86B]' : ''}`} />
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
