interface StatusRibbonProps {
  label: string;
  color: string;
  /** Darker shade for the folded shadow tail. Defaults to a computed darken of `color`. */
  shadowColor?: string;
  /** Override the label's text size/weight classes for a single call site without affecting the shared default. */
  textClassName?: string;
}

function darken(hex: string, amount = 0.45): string {
  const m = hex.replace('#', '');
  if (m.length !== 6) return hex;
  const r = Math.round(parseInt(m.slice(0, 2), 16) * (1 - amount));
  const g = Math.round(parseInt(m.slice(2, 4), 16) * (1 - amount));
  const b = Math.round(parseInt(m.slice(4, 6), 16) * (1 - amount));
  return `rgb(${r},${g},${b})`;
}

/**
 * Flag-style status ribbon (Figma node 734:30391) — a pointed banner that overlaps
 * the card's top-left corner, with a folded shadow tail beneath it.
 * Intended to sit inside a `relative` card as the first child.
 * Width grows to fit the label so longer status text is never clipped.
 */
export function StatusRibbon({ label, color, shadowColor, textClassName }: StatusRibbonProps) {
  const shadow = shadowColor || darken(color);
  return (
    <div className="absolute -left-[5px] -top-[7px] z-10 pointer-events-none inline-flex items-center h-[25px] min-w-[79px] max-w-[150px] pl-[8px] pr-[16px] pb-[2px]">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 25"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path d="M0 20L4 21.0525V25L0 23.9475V20Z" fill={shadow} />
        <path d="M100 11L92.6689 22H4V21.9541L0 24V3.14355L4 0H92.6689L100 11Z" fill={color} />
      </svg>
      <span className={`relative text-white whitespace-nowrap truncate ${textClassName || 'text-[9.5px] font-bold tracking-wide leading-[12px]'}`}>
        {label}
      </span>
    </div>
  );
}
