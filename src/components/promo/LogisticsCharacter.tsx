/* Reusable 2D logistics associate (viewBox 90×170, facing right, holding a flag pole at x=78 in the front hand).
   Standing pose — the banner animates only the flag. Mirror with `flip` for the opposite side. */

export type CharacterVariant = 'a' | 'b';

interface Palette { skin: string; skinShade: string; hair: string; shirt: string; shirtShade: string; accent: string; trousers: string; trousersFar: string }
const PALETTES: Record<CharacterVariant, Palette> = {
  a: { skin: '#C99272', skinShade: '#B07A5A', hair: '#1B2430', shirt: '#00A86B', shirtShade: '#0B8A57', accent: '#FFFFFF', trousers: '#22304F', trousersFar: '#18223A' },
  b: { skin: '#E2B394', skinShade: '#CC9877', hair: '#2F1E14', shirt: '#FFFFFF', shirtShade: '#E7ECEF', accent: '#00A86B', trousers: '#22304F', trousersFar: '#18223A' },
};

const OUT = '#0B1F2A';
const DARK_GREEN = '#0F6B38';
const SW = 1.1;

interface Props {
  variant: CharacterVariant;
  /** Mirror horizontally (character faces left). */
  flip?: boolean;
  className?: string;
}

export function LogisticsCharacter({ variant, flip = false, className }: Props) {
  const p = PALETTES[variant];

  // Leg from the hip at (hx, 92); the top tucks under the trousers seat. `lean` angles it for a natural stance.
  const leg = (hx: number, lean: number, far: boolean) => {
    const cloth = far ? p.trousersFar : p.trousers;
    return (
      <g transform={`rotate(${lean} ${hx} 92)`}>
        <path d={`M${hx - 5.6} 86 L${hx + 5.6} 86 L${hx + 5} 127 L${hx + 4.4} 154 L${hx - 4.4} 154 L${hx - 5} 127 Z`} fill={cloth} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
        {!far && <path d={`M${hx + 2.4} 94 L${hx + 2} 150`} stroke="#FFFFFF" strokeOpacity="0.12" strokeWidth="1.4" strokeLinecap="round" />}
        <path d={`M${hx - 4.4} 126 Q${hx} 127.6 ${hx + 4.4} 126`} fill="none" stroke={OUT} strokeOpacity="0.25" strokeWidth="0.8" />
        {/* Sneaker */}
        <path d={`M${hx - 5.5} 152.5 L${hx + 5} 152.5 Q${hx + 13} 153 ${hx + 13.5} 159 L${hx + 13.5} 160.5 L${hx - 6} 160.5 Q${hx - 7} 156 ${hx - 5.5} 152.5 Z`}
          fill={far ? '#E2E8F0' : '#FFFFFF'} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
        <path d={`M${hx - 6} 160.5 L${hx + 13.5} 160.5`} stroke={OUT} strokeWidth="2.2" strokeLinecap="round" />
        <path d={`M${hx - 2} 156.6 Q${hx + 4} 155 ${hx + 9} 157`} fill="none" stroke="#00A86B" strokeWidth="1.4" strokeLinecap="round" />
      </g>
    );
  };

  return (
    <svg viewBox="0 0 90 170" className={className} style={flip ? { transform: 'scaleX(-1)' } : undefined} aria-hidden>
      <defs>
        <linearGradient id={`qp-shirt-${variant}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={p.shirt} />
          <stop offset="0.7" stopColor={p.shirt} />
          <stop offset="1" stopColor={p.shirtShade} />
        </linearGradient>
        <radialGradient id={`qp-face-${variant}`} cx="0.6" cy="0.4" r="0.7">
          <stop offset="0" stopColor={p.skin} />
          <stop offset="1" stopColor={p.skinShade} />
        </radialGradient>
      </defs>

      <ellipse cx="47" cy="163" rx="24" ry="3.2" fill={OUT} opacity="0.12" />

      {/* Pole */}
      <rect x="76.6" y="5" width="2.8" height="157" rx="1.4" fill="#64748B" stroke={OUT} strokeWidth="0.8" />
      <circle cx="78" cy="4.5" r="3.2" fill="#00A86B" stroke={OUT} strokeWidth="0.8" />

      {/* Legs — relaxed stance, weight slightly on the back foot */}
      {leg(41.5, 4, true)}
      {leg(49, -3, false)}

      {/* Hips / trousers seat — covers both hip joints */}
      <path d="M32 84 Q45 82 58 84 L59.5 97 Q52 100 45 99 Q38 100 30.5 97 Z" fill={p.trousers} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M32 84 Q45 82 58 84 L58.3 88 Q45 86.5 31.7 88 Z" fill={OUT} opacity="0.85" />
      <rect x="42.5" y="83.6" width="5" height="3.8" rx="1" fill="#CBD5E1" />

      {/* Torso — tucked shirt */}
      <path d="M34 50 Q35 44 45 43 Q55 44 56.5 50 L58 85 Q45 87.5 32 85 Z" fill={`url(#qp-shirt-${variant})`} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
      {variant === 'a' ? (
        <>
          <path d="M39 44.2 L45 52 L51 44.2 L48.4 43.4 L45 47.6 L41.6 43.4 Z" fill={p.accent} stroke={OUT} strokeWidth="0.8" strokeLinejoin="round" />
          <path d="M45 52 L45 62" stroke={DARK_GREEN} strokeWidth="1" />
          <circle cx="45" cy="55" r="0.7" fill="#FFFFFF" /><circle cx="45" cy="58.6" r="0.7" fill="#FFFFFF" />
          <path d="M33.2 66 L57.2 66 L57.4 70 L33 70 Z" fill={p.accent} opacity="0.95" />
          <path d="M33.2 67.6 L57.3 67.6" stroke="#CBD5E1" strokeWidth="0.6" />
          <circle cx="51.5" cy="58" r="2.4" fill="#FFFFFF" stroke={DARK_GREEN} strokeWidth="0.7" />
          <path d="M50.4 58 l0.9 0.9 l1.6-1.8" fill="none" stroke="#00A86B" strokeWidth="0.8" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M35.5 51 Q36.5 46 40.5 44.6 L45 55 L49.5 44.6 Q53.5 46 54.5 51 L56.5 84.6 Q45 87 33.5 84.6 Z" fill={p.accent} stroke={OUT} strokeWidth="0.9" strokeLinejoin="round" />
          <path d="M40.5 44.6 L45 55 L49.5 44.6 L47.4 43.6 L45 48.2 L42.6 43.6 Z" fill="#FFFFFF" stroke={OUT} strokeWidth="0.8" strokeLinejoin="round" />
          <path d="M34.4 72 L56 72" stroke="#FFFFFF" strokeWidth="2.2" opacity="0.9" />
          <rect x="48" y="57.5" width="5.4" height="7.4" rx="1" fill="#FFFFFF" stroke={OUT} strokeWidth="0.7" />
          <rect x="49.2" y="59.2" width="3" height="1.6" rx="0.5" fill="#00A86B" />
          <path d="M50.7 57.5 L48.6 47" stroke={OUT} strokeWidth="0.5" opacity="0.6" />
        </>
      )}
      <path d="M52 46 Q56 48 56.5 52 L58 85 Q55 85.8 53 86 Z" fill="#000" opacity="0.06" />

      {/* Neck + head */}
      <path d="M41.6 36 L48.4 36 L48.8 45 Q45 47 41.2 45 Z" fill={p.skinShade} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M36 25.5 Q36 14 46 14 Q56 14 56 26 Q56 33 52.6 37 Q49.6 39.6 46 39.6 Q41.4 39.6 38.6 36.2 Q36 32.6 36 25.5 Z"
        fill={`url(#qp-face-${variant})`} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M37.4 25 Q34.6 25.6 35 28.8 Q35.6 31.6 38.2 31" fill={p.skinShade} stroke={OUT} strokeWidth="0.9" />
      {variant === 'a' ? (
        <>
          <path d="M36.6 27 Q36 18.6 45.6 18 Q53.6 18 55.6 23.4 Q50 21.6 43.6 22.6 Q39.6 23.6 38.8 29 Z" fill={p.hair} />
          <path d="M35.6 22.6 Q36 12.4 46 12.4 Q55.8 12.6 56.2 21.6 Z" fill="#00A86B" stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
          <path d="M52.4 20.8 L64.2 22.6 Q59.6 24.8 52.6 24 Z" fill={DARK_GREEN} stroke={OUT} strokeWidth="0.9" strokeLinejoin="round" />
          <path d="M40 16.6 Q46 14.8 52 16.6" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.75" />
          <path d="M37.4 29.6 Q37.6 33.6 39.6 35.4" fill="none" stroke={p.hair} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
        </>
      ) : (
        <>
          <path d="M35.4 30 Q33.6 13.6 46.6 13.4 Q57.4 13.6 56.4 25 Q50 18.8 42.4 21.4 Q38.2 23.4 38 32.6 Z" fill={p.hair} stroke={OUT} strokeWidth="0.9" strokeLinejoin="round" />
          <path d="M36 25 Q29 30 31.4 41.4 Q34.6 36.6 37 32.4 Z" fill={p.hair} stroke={OUT} strokeWidth="0.9" strokeLinejoin="round" />
          <rect x="34.6" y="23.4" width="3.6" height="2.8" rx="1.2" fill="#00A86B" />
          <circle cx="37.2" cy="31.8" r="0.9" fill="#00A86B" />
        </>
      )}
      {/* Face */}
      <path d="M47.4 24.2 l3.2 -0.6 M52.6 23.8 l2.4 0.2" stroke={OUT} strokeWidth="0.9" strokeLinecap="round" />
      <ellipse cx="49.2" cy="27.6" rx="1" ry="1.25" fill={OUT} />
      <ellipse cx="53.6" cy="27.6" rx="0.9" ry="1.15" fill={OUT} />
      <path d="M55 28.6 Q57.4 31.6 54.8 32.6" fill="none" stroke={p.skinShade} strokeWidth="1" strokeLinecap="round" />
      <path d="M49.6 35 Q52 36.6 54.4 35" fill="none" stroke={OUT} strokeWidth="0.9" strokeLinecap="round" />

      {/* Second arm — lower grip on the pole at waist height (two-handed hold) */}
      <path d="M50.5 54 Q55 52.6 57.4 56 L62.6 70.4 Q60 73.4 56.6 72 Z" fill={p.shirtShade} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
      {variant === 'b' && <path d="M50.5 54 Q55 52.6 57.4 56 L62.6 70.4 Q60 73.4 56.6 72 Z" fill="none" stroke="#CBD5E1" strokeWidth="0.6" />}
      <path d="M57.2 69 L62.8 68.6 L75.6 72.2 L75 77.6 L60.6 75.4 Q57 74 57.2 69 Z" fill={p.skinShade} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
      <rect x="73.6" y="70.2" width="8.8" height="9" rx="3.8" fill={p.skin} stroke={OUT} strokeWidth={SW} />
      <path d="M73.8 73.2 h8.4 M73.8 76 h8.4" stroke={p.skinShade} strokeWidth="0.7" />

      {/* Near arm raised to the pole: shoulder → elbow → hand gripping the pole */}
      <path d="M52 49.6 Q57 47 60.4 50.6 L67.4 49.8 L68.6 55.4 L58 58 Q53 57.6 52 53 Z" fill={p.shirt} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
      {variant === 'b' && <path d="M52 49.6 Q57 47 60.4 50.6 L67.4 49.8 L68.6 55.4 L58 58 Q53 57.6 52 53 Z" fill="none" stroke="#CBD5E1" strokeWidth="0.6" />}
      <path d="M66.4 50 L74.6 41.4 L78.4 44.6 L70.2 54.6 Z" fill={p.skin} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
      <rect x="73.6" y="36.4" width="8.8" height="9" rx="3.8" fill={p.skin} stroke={OUT} strokeWidth={SW} />
      <path d="M73.8 39.4 h8.4 M73.8 42.2 h8.4" stroke={p.skinShade} strokeWidth="0.7" />
    </svg>
  );
}
