import { createPortal } from 'react-dom';
import { MapPin } from 'lucide-react';

export interface AddressHoverPos {
  id?: string;
  rect: DOMRect;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  phone?: string;
}

/**
 * Dark floating address card, portaled to document.body so it isn't clipped by
 * any ancestor's overflow-hidden/overflow-auto. Same visual treatment as the
 * pickup/customer tooltips on the Orders page — flips below the trigger when
 * there isn't enough room above.
 */
export function AddressTooltip({ hover }: { hover: AddressHoverPos | null }) {
  if (!hover) return null;
  const showBelow = hover.rect.top < 260;
  return createPortal(
    <div className="fixed z-[9999] pointer-events-none bg-[#0F172A] text-white text-xs p-3 rounded-xl shadow-xl w-64"
      style={{
        top: showBelow ? hover.rect.bottom + 10 : hover.rect.top - 10,
        left: Math.min(Math.max(hover.rect.left + hover.rect.width / 2, 140), window.innerWidth - 140),
        transform: showBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
      }}>
      <div className="font-bold flex items-center gap-1.5 mb-1.5"><MapPin className="w-3.5 h-3.5 text-[#00A86B] shrink-0" />{hover.name}</div>
      <div className="text-slate-300 font-normal leading-relaxed border-t border-white/10 pt-1.5 break-words whitespace-normal">
        {hover.address || 'No address on file'}
        {(hover.city || hover.state || hover.pinCode) && (
          <div>{[hover.city, hover.state].filter(Boolean).join(', ')}{hover.pinCode ? ` – ${hover.pinCode}` : ''}</div>
        )}
        {hover.phone && <div className="text-slate-400 mt-1">{hover.phone}</div>}
      </div>
      {showBelow ? (
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 border-[6px] border-transparent border-b-[#0F172A]" />
      ) : (
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#0F172A]" />
      )}
    </div>,
    document.body
  );
}
