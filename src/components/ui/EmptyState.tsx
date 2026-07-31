import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface EmptyStateProps {
  /** Optional label under the animation. Omit for a clean, animation-only state. */
  title?: string;
  /** Optional short muted line under the title (a few words, not a sentence) */
  subtitle?: string;
  /** Animation pixel size (square) */
  size?: number;
  /** Extra classes for the outer wrapper */
  className?: string;
}

/**
 * Shared "no data" state for admin table bodies. Renders inside a
 * <tr><td colSpan={N}> slot — the caller owns the <tr>/<td> so column
 * count and any table-specific classes stay with the page.
 */
export function EmptyState({
  title,
  subtitle,
  size = 240,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center w-full py-2 mx-auto ${className}`}>
      <div className="flex items-center justify-center mx-auto" style={{ width: size, height: size }}>
        <DotLottieReact
          src="https://lottie.host/4a3a43dd-6b9e-4d67-a98f-d6230687c4a3/63xmOCCv3R.lottie"
          loop
          autoplay
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      {title && (
        <p className="text-sm font-semibold text-[#64748B] -mt-4">{title}</p>
      )}
      {subtitle && (
        <p className="text-xs font-medium text-[#94A3B8] mt-1">{subtitle}</p>
      )}
    </div>
  );
}
