// Scores address completeness by raw character length as a rough proxy for
// how much detail (house/flat no., street, landmark, etc.) was actually entered —
// short addresses are far more likely to cause missed/delayed deliveries.
export interface AddressAccuracyResult {
  label: string;
  percent: number;
  color: string;     // fill color
  textColor: string; // label text color (readable against the light track)
  bg: string;         // light track background
}

const BANDS: { max: number; label: string; percentRange: [number, number]; color: string; textColor: string; bg: string }[] = [
  { max: 20,  label: 'Poor',      percentRange: [10, 30], color: '#EF4444', textColor: '#B91C1C', bg: '#FEF2F2' },
  { max: 40,  label: 'Low',       percentRange: [31, 50], color: '#F97316', textColor: '#C2410C', bg: '#FFF7ED' },
  { max: 60,  label: 'Fair',      percentRange: [51, 70], color: '#F59E0B', textColor: '#B45309', bg: '#FFFBEB' },
  { max: 80,  label: 'Good',      percentRange: [71, 85], color: '#84CC16', textColor: '#4D7C0F', bg: '#F7FEE7' },
  { max: 100, label: 'Very Good', percentRange: [86, 95], color: '#22C55E', textColor: '#15803D', bg: '#F0FDF4' },
  { max: Infinity, label: 'Excellent', percentRange: [96, 100], color: '#15803D', textColor: '#166534', bg: '#F0FDF4' },
];

/** Maps address text length to a 0-100 accuracy score + band, per the fixed
 *  character-count scale (0-20 Poor … 101+ Excellent). Deterministic within
 *  each band's range using the exact length, so 61 vs 79 chars still differ. */
export function scoreAddressAccuracy(address?: string | null): AddressAccuracyResult {
  const len = (address || '').trim().length;
  if (len === 0) {
    return { label: 'Poor', percent: 0, color: BANDS[0].color, textColor: BANDS[0].textColor, bg: BANDS[0].bg };
  }
  const band = BANDS.find(b => len <= b.max) || BANDS[BANDS.length - 1];
  const bandIndex = BANDS.indexOf(band);
  const bandMin = bandIndex === 0 ? 0 : BANDS[bandIndex - 1].max;
  const bandSpan = band.max === Infinity ? 40 : band.max - bandMin; // treat 101+ as a 40-char-wide tail for interpolation
  const withinBand = Math.min(1, Math.max(0, (len - bandMin) / bandSpan));
  const [pMin, pMax] = band.percentRange;
  const percent = Math.round(pMin + withinBand * (pMax - pMin));
  return { label: band.label, percent, color: band.color, textColor: band.textColor, bg: band.bg };
}

/** Circular ring gauge — a donut that fills clockwise to the accuracy percentage,
 *  with the % printed centered inside. Used next to Pickup and Receiver address
 *  blocks so incomplete addresses are visible at a glance. */
export function AddressAccuracyGauge({ address, size = 'md', showLabel = true }: {
  address?: string | null;
  size?: 'sm' | 'md';
  /** When false, renders only the ring (no "Address" / band-name text) — use in
   *  tight spaces like a dedicated table column where the label is redundant. */
  showLabel?: boolean;
}) {
  const { label, percent, color, textColor, bg } = scoreAddressAccuracy(address);

  const dims = size === 'sm'
    ? { box: 36, stroke: 4, text: 'text-[9px]' }
    : { box: 44, stroke: 5, text: 'text-[10px]' };

  const radius = (dims.box - dims.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  const center = dims.box / 2;

  return (
    <div className="flex items-center gap-2" title={`Address accuracy: ${label} (${percent}%)`}>
      <div className="relative shrink-0" style={{ width: dims.box, height: dims.box }}>
        <svg width={dims.box} height={dims.box} className="-rotate-90">
          <circle cx={center} cy={center} r={radius} fill="none" stroke={bg} strokeWidth={dims.stroke} />
          <circle
            cx={center} cy={center} r={radius} fill="none" stroke={color} strokeWidth={dims.stroke}
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-[stroke-dashoffset] duration-500 ease-out"
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center ${dims.text} font-extrabold`} style={{ color: textColor }}>
          {percent}%
        </div>
      </div>
      {showLabel && (
        <div className="leading-tight">
          <div className="text-[9px] font-semibold uppercase tracking-wider text-[#94A3B8]">Address</div>
          <div className="text-[11px] font-bold" style={{ color: textColor }}>{label}</div>
        </div>
      )}
    </div>
  );
}
