import { useState } from 'react';
import { ArrowUpRight, Package, Truck } from 'lucide-react';
import { ShineButton } from '../../ui/ShineButton';
import { useShippingMode, type ShippingMode } from '../../../context/shippingMode';
import { cargoTabUrl } from '../../../utils/shippingMode';
import { employeePanelMode, getToken } from '../../../utils/session';
import { ModeTransition } from './ModeTransition';

/* Admin navbar pill: "Cargo ↗" in B2C admin, "B2C ↗" in Cargo admin.
   - B2C → Cargo: opens Cargo admin in a new tab straight from the click (popup blockers allow it);
     the new tab plays the branded switch animation. If the tab is blocked, this tab switches instead.
   - Cargo → B2C: plays the animation here, then this tab returns to the B2C admin dashboard. */

const ADMIN_HOME = '/admin/dashboard';

export function AdminCargoSwitch({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const { mode, isCargo, setMode } = useShippingMode();
  const [pending, setPending] = useState<ShippingMode | null>(null);
  const target: ShippingMode = isCargo ? 'b2c' : 'cargo';

  const go = () => {
    if (pending) return;
    if (target === 'cargo') {
      const tab = window.open(cargoTabUrl(ADMIN_HOME), '_blank');
      if (tab) { tab.opener = null; return; }
    }
    setPending(target);
  };

  const finish = () => {
    if (!pending) return;
    // Full navigation to the other mode's URL (/cargo/admin/... or the plain B2C path).
    setMode(pending, ADMIN_HOME);
  };

  // Employees work only in the panel they were created in — no switching
  if (employeePanelMode(getToken())) return null;

  const Icon = target === 'cargo' ? Truck : Package;
  const label = target === 'cargo' ? 'Cargo' : 'B2C';
  const dark = variant === 'dark';

  return (
    <>
      <ModeTransition from={mode} to={pending} onDone={finish} />
      <ShineButton
        type="button"
        onClick={go}
        title={target === 'cargo' ? 'Switch to QuickPost Cargo admin (opens in a new tab)' : 'Switch back to QuickPost B2C admin'}
        aria-label={`Switch to ${label} admin`}
        className={`h-10 pl-1.5 pr-1.5 rounded-full border inline-flex items-center gap-2 transition-all shrink-0 ${
          dark
            ? 'bg-white/10 border-white/15 text-white hover:bg-white/15'
            : 'bg-white border-[#E2E8F0] text-[#0F172A] shadow-sm hover:border-[#00A86B]/40 hover:shadow-[0_4px_14px_-6px_rgba(0,168,107,0.45)]'
        }`}
      >
        <span className={`w-7 h-7 rounded-full flex items-center justify-center ${target === 'cargo' ? 'bg-[#00A86B]/10 text-[#00A86B]' : 'bg-[#F1F5F9] text-[#0F172A]'} ${dark ? '!bg-white/15 !text-white' : ''}`}>
          <Icon className="w-4 h-4" />
        </span>
        <span className={`whitespace-nowrap text-[13.5px] font-semibold tracking-[-0.01em] ${dark ? 'text-white' : 'text-[#1E293B]'}`}>{label}</span>
        <span className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
          target === 'cargo' ? 'bg-[#00A86B] text-white' : 'bg-[#0F172A] text-white'
        }`}>
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-px group-hover:-translate-y-px" />
        </span>
      </ShineButton>
    </>
  );
}
