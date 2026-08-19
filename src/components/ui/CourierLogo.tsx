import { useState } from 'react';
import { getCourierLogo } from '../../utils/courierLogo';

export type CourierLogoSize = 'xs' | 'sm' | 'md' | 'lg';

// Fixed box + padding + object-contain + object-center keeps every courier logo
// visually consistent regardless of its native aspect ratio (some are square,
// some — like Ekart — are very wide wordmarks) instead of stretching/hugging
// one edge and looking bigger or smaller than the rest.
const SIZE_CLASSES: Record<CourierLogoSize, { box: string; padding: string; text: string }> = {
  xs: { box: 'w-12 h-9',  padding: 'p-1',   text: 'text-[11px]' },
  sm: { box: 'w-16 h-11', padding: 'p-1.5', text: 'text-[12px]' },
  md: { box: 'w-20 h-14', padding: 'p-2',   text: 'text-[13px]' },
  lg: { box: 'w-28 h-16', padding: 'p-2.5', text: 'text-[15px]' },
};

export function CourierLogo({ name, size = 'sm', className = '' }: {
  name: string; size?: CourierLogoSize; className?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const { box, padding, text } = SIZE_CLASSES[size];
  const logoUrl = getCourierLogo(name);
  const isFallbackAvatar = logoUrl.startsWith('https://ui-avatars.com');

  if (imgError || (!name && !logoUrl)) {
    return (
      <div className={`${box} flex items-center justify-center rounded bg-slate-100 border border-slate-200 text-[#94A3B8] font-bold shrink-0 uppercase shadow-sm ${text} ${className}`}>
        {(name || '?').charAt(0)}
      </div>
    );
  }

  return (
    <div className={`${box} bg-white border border-[#E2E8F0] rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${isFallbackAvatar ? '' : padding} ${className}`}>
      <img
        key={logoUrl}
        src={logoUrl}
        alt={name || 'Courier'}
        className="max-w-full max-h-full w-auto h-auto object-contain object-center"
        onError={() => setImgError(true)}
      />
    </div>
  );
}
