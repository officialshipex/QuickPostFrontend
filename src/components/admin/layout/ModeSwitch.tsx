import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useShippingMode, type ShippingMode } from '../../../context/shippingMode';
import { cargoTabUrl } from '../../../utils/shippingMode';
import { ModeTransition } from './ModeTransition';

/* Segmented B2C | Cargo switch. `light` for the white navbar, `dark` for the mobile drawer.
   - B2C → Cargo: opens Cargo in a new tab straight from the click (so popup blockers allow it);
     the new tab plays the branded switch animation, then shows Cargo. This tab stays B2C.
     If the browser blocks the tab, the animation plays here and this tab switches instead.
   - Cargo → B2C: plays the animation here, then switches this tab back to B2C Home. */

const OPTIONS: { mode: ShippingMode; label: string; icon: typeof Package }[] = [
  { mode: 'b2c', label: 'B2C', icon: Package },
  { mode: 'cargo', label: 'Cargo', icon: Truck },
];

export function ModeSwitch({ variant = 'light', layoutId = 'mode-switch-pill' }: { variant?: 'light' | 'dark'; layoutId?: string }) {
  const { mode, setMode } = useShippingMode();
  const navigate = useNavigate();
  const dark = variant === 'dark';

  const [pending, setPending] = useState<ShippingMode | null>(null);

  const choose = (next: ShippingMode) => {
    if (next === mode || pending) return;
    if (next === 'cargo') {
      const tab = window.open(cargoTabUrl(), '_blank');
      if (tab) { tab.opener = null; return; }
    }
    setPending(next);
  };

  const finish = () => {
    if (!pending) return;
    setMode(pending);
    navigate('/user/home');
    window.scrollTo({ top: 0 });
    // Let the new page paint under the overlay before fading it out.
    setTimeout(() => setPending(null), 150);
  };

  const transition = <ModeTransition from={mode} to={pending} onDone={finish} />;

  return (
    <>
    {transition}
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
    </>
  );
}
