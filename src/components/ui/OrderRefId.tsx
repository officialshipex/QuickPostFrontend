import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy } from 'lucide-react';
import { copyToClipboard } from '../../utils/clipboard';

/**
 * A Customer Order ID (or channel order name) in a list, card or header. Customer Order IDs can be up to 100
 * characters, so only the first `max` characters are shown; hovering (or tapping, on touch screens) shows the full
 * id, and the copy button copies the full id. Clicks never reach the row underneath (rows open the order).
 * The tooltip is drawn in document.body so a table's scroll container can't cut it off.
 */
interface OrderRefIdProps {
  value?: string | number | null;
  /** characters shown before "…" */
  max?: number;
  /** show it as "(ID)", like next to the channel tag */
  brackets?: boolean;
  /** text before the id inside the tooltip */
  label?: string;
  className?: string;
  /** copy icon size in px */
  iconSize?: number;
}

export function OrderRefId({ value, max = 12, brackets = false, label = 'Customer Order ID', className = '', iconSize = 11 }: OrderRefIdProps) {
  const full = value == null ? '' : String(value).trim();
  const ref = useRef<HTMLSpanElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number; right: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  // a tap outside closes a tooltip opened by tapping; scrolling closes it too (it would float away from the id)
  useEffect(() => {
    if (!tip) return;
    const close = (e: Event) => {
      if (e.type === 'pointerdown' && ref.current?.contains(e.target as Node)) return;
      setTip(null);
    };
    document.addEventListener('pointerdown', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('pointerdown', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [tip]);

  if (!full) return null;
  const short = full.length > max ? `${full.slice(0, max)}…` : full;

  const open = () => {
    const r = ref.current?.getBoundingClientRect();
    // ids near the right edge open their tooltip leftward, so it stays on screen
    if (r) {
      const right = r.left > window.innerWidth / 2;
      setTip({ x: right ? Math.min(r.right, window.innerWidth - 8) : Math.max(r.left, 8), y: r.top, right });
    }
  };

  const onCopy = async (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (await copyToClipboard(full)) setCopied(true);
  };

  return (
    <span
      ref={ref}
      className={`inline-flex items-center gap-1 min-w-0 max-w-full align-middle ${className}`}
      onMouseEnter={open}
      onMouseLeave={() => setTip(null)}
      onClick={(e) => { e.stopPropagation(); if (tip) setTip(null); else open(); }}
    >
      <span className="whitespace-nowrap cursor-default">{brackets ? `(${short})` : short}</span>
      <span
        role="button"
        tabIndex={0}
        onClick={onCopy}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); void copyToClipboard(full).then(ok => ok && setCopied(true)); } }}
        title={copied ? 'Copied' : `Copy ${label}`}
        aria-label={`Copy ${label} ${full}`}
        className="shrink-0 inline-flex items-center justify-center rounded p-0.5 cursor-pointer text-[#94A3B8] hover:text-[#00A86B] hover:bg-[#F0FDF4] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#00A86B]"
      >
        {copied
          ? <Check style={{ width: iconSize, height: iconSize }} className="text-[#00A86B]" />
          : <Copy style={{ width: iconSize, height: iconSize }} />}
      </span>
      {tip && createPortal(
        <div
          role="tooltip"
          className="fixed z-[9999] pointer-events-none"
          style={{ left: tip.x, top: tip.y - 6, transform: tip.right ? 'translate(-100%, -100%)' : 'translateY(-100%)', maxWidth: 'min(420px, calc(100vw - 16px))' }}
        >
          <div className="bg-slate-800 text-white text-[11px] leading-4 font-normal py-1.5 px-2.5 rounded-md shadow-xl break-all">
            <span className="text-slate-300">{label}: </span>{full}
            {copied && <span className="ml-1.5 text-emerald-300">Copied</span>}
          </div>
        </div>,
        document.body,
      )}
    </span>
  );
}

export default OrderRefId;
