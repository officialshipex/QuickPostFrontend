import { useMemo } from 'react';

interface ParcelPreviewProps {
  length: number;
  breadth: number;
  height: number;
}

type Pt = { x: number; y: number };
const poly = (pts: Pt[]) => pts.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

/**
 * Industry-style isometric cardboard box that reshapes live to reflect the
 * entered L×W×H, with realistic per-face shading, crossed packing tape,
 * a shipping label, and a subtle float animation.
 */
export function ParcelPreview({ length, breadth, height }: ParcelPreviewProps) {
  const hasDims = length > 0 && breadth > 0 && height > 0;

  const { fw, fd, fh } = useMemo(() => {
    const l = length > 0 ? length : 22;
    const b = breadth > 0 ? breadth : 16;
    const h = height > 0 ? height : 14;
    const maxDim = Math.max(l, b, h, 1);
    const scale = 78 / maxDim;
    return {
      fw: Math.max(34, l * scale), // front-face width
      fd: Math.max(24, b * scale), // depth (side-face projection)
      fh: Math.max(28, h * scale), // box height
    };
  }, [length, breadth, height]);

  // True 30° isometric projection: depth axis runs up-and-right at 30° from horizontal.
  const dx = fd * Math.cos(Math.PI / 6);
  const dy = fd * Math.sin(Math.PI / 6);

  const cx = 130;
  const baseY = 168; // ground line

  // Front-bottom-left corner
  const flb: Pt = { x: cx - fw / 2, y: baseY };
  const frb: Pt = { x: flb.x + fw, y: baseY };
  const flt: Pt = { x: flb.x, y: baseY - fh };
  const frt: Pt = { x: frb.x, y: baseY - fh };

  // Back corners (offset along the isometric depth axis)
  const blb: Pt = { x: flb.x + dx, y: flb.y - dy };
  const brb: Pt = { x: frb.x + dx, y: frb.y - dy };
  const blt: Pt = { x: flt.x + dx, y: flt.y - dy };
  const brt: Pt = { x: frt.x + dx, y: frt.y - dy };

  const topFace = [flt, blt, brt, frt];
  const frontFace = [flb, frb, frt, flt];
  const sideFace = [frb, brb, brt, frt];

  const gid = `parcel-${Math.round(fw)}-${Math.round(fd)}-${Math.round(fh)}`;

  // Tape strip midpoints across the box
  const topMidFront: Pt = { x: (flt.x + frt.x) / 2, y: (flt.y + frt.y) / 2 };
  const topMidBack: Pt = { x: (blt.x + brt.x) / 2, y: (blt.y + brt.y) / 2 };
  const tapeHalfW = Math.min(8, fw * 0.09);
  const tapeDir = { x: (frt.x - flt.x), y: (frt.y - flt.y) };
  const tapeLen = Math.hypot(tapeDir.x, tapeDir.y) || 1;
  const tapeN = { x: -tapeDir.y / tapeLen, y: tapeDir.x / tapeLen };

  return (
    <svg
      viewBox="0 0 260 210"
      className="w-full max-w-[280px] mx-auto animate-[parcelFloat_3.4s_ease-in-out_infinite] drop-shadow-[0_18px_20px_rgba(15,23,42,0.10)]"
      aria-hidden
    >
      <defs>
        <linearGradient id={`${gid}-top`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F3E4C4" />
          <stop offset="100%" stopColor="#E4CE9E" />
        </linearGradient>
        <linearGradient id={`${gid}-front`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E1C494" />
          <stop offset="100%" stopColor="#CBA96F" />
        </linearGradient>
        <linearGradient id={`${gid}-side`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#C29F66" />
          <stop offset="100%" stopColor="#A9824F" />
        </linearGradient>
        <linearGradient id={`${gid}-tape`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00C27D" />
          <stop offset="100%" stopColor="#00A86B" />
        </linearGradient>
      </defs>

      {/* Ground shadow — scales with footprint */}
      <ellipse
        cx={cx + dx * 0.5}
        cy={baseY + 12}
        rx={fw / 2 + dx * 0.55}
        ry={9}
        fill="#0F172A"
        opacity={0.1}
      />

      {/* SIDE face (right, darkest — away from light) */}
      <polygon points={poly(sideFace)} fill={`url(#${gid}-side)`} stroke="#8A6C3E" strokeWidth={1} strokeLinejoin="round" />
      {/* corrugation lines on side face */}
      {Array.from({ length: 3 }).map((_, i) => {
        const t = (i + 1) / 4;
        const a = { x: frb.x + (brb.x - frb.x) * t, y: frb.y + (brb.y - frb.y) * t };
        const c = { x: frt.x + (brt.x - frt.x) * t, y: frt.y + (brt.y - frt.y) * t };
        return <line key={i} x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke="#8A6C3E" strokeOpacity={0.35} strokeWidth={0.75} />;
      })}

      {/* FRONT face (mid tone, primary light) */}
      <polygon points={poly(frontFace)} fill={`url(#${gid}-front)`} stroke="#8A6C3E" strokeWidth={1} strokeLinejoin="round" />

      {/* TOP face (brightest — receives the most light) */}
      <polygon points={poly(topFace)} fill={`url(#${gid}-top)`} stroke="#8A6C3E" strokeWidth={1} strokeLinejoin="round" />

      {/* Top-face fold crease lines (flap seams) */}
      <line x1={topMidFront.x} y1={topMidFront.y} x2={(topFace[1].x + topFace[2].x) / 2} y2={(topFace[1].y + topFace[2].y) / 2} stroke="#8A6C3E" strokeOpacity={0.3} strokeWidth={0.75} />
      <line x1={(flt.x + blt.x) / 2} y1={(flt.y + blt.y) / 2} x2={(frt.x + brt.x) / 2} y2={(frt.y + brt.y) / 2} stroke="#8A6C3E" strokeOpacity={0.3} strokeWidth={0.75} />

      {/* Crossed packing tape — top face, animates in once */}
      <g className="origin-center animate-[strapFadeIn_0.9s_ease-out]" style={{ transformBox: 'fill-box' }}>
        <polygon
          points={poly([
            { x: topMidFront.x - tapeN.x * tapeHalfW, y: topMidFront.y - tapeN.y * tapeHalfW },
            { x: topMidFront.x + tapeN.x * tapeHalfW, y: topMidFront.y + tapeN.y * tapeHalfW },
            { x: topMidBack.x + tapeN.x * tapeHalfW, y: topMidBack.y + tapeN.y * tapeHalfW },
            { x: topMidBack.x - tapeN.x * tapeHalfW, y: topMidBack.y - tapeN.y * tapeHalfW },
          ])}
          fill={`url(#${gid}-tape)`}
          opacity={0.92}
        />
      </g>

      {/* Corner edge highlights for crispness */}
      <line x1={flt.x} y1={flt.y} x2={flb.x} y2={flb.y} stroke="#8A6C3E" strokeOpacity={0.5} strokeWidth={1} />
      <line x1={frt.x} y1={frt.y} x2={frb.x} y2={frb.y} stroke="#5F4A28" strokeOpacity={0.5} strokeWidth={1} />

      {/* Live dimension caption */}
      {hasDims && (
        <text
          x={cx + dx * 0.25}
          y={baseY + 28}
          textAnchor="middle"
          fontSize="10.5"
          fontWeight="700"
          fill="#64748B"
          fontFamily="Arial, sans-serif"
          className="animate-[strapFadeIn_0.6s_ease-out]"
        >
          {length} × {breadth} × {height} cm
        </text>
      )}
    </svg>
  );
}
