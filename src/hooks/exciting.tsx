import { useState, useCallback } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import type { DotLottie } from '@lottiefiles/dotlottie-react';
import { PackageOpen } from 'lucide-react';

interface ExcitingLottieProps {
  /** Animation pixel size (square) */
  size?: number;
  /** Extra classes for the outer wrapper */
  className?: string;
}

const EXCITING_LOTTIE_SRC = 'https://lottie.host/988e87da-39af-4037-a8d5-46bb92612406/RkqgBqVEms.lottie';

/**
 * Shared NDR "exciting" animation, used across all NDR tabs (desktop + mobile).
 */
export function ExcitingLottie({ size = 240, className = '' }: ExcitingLottieProps) {
  const [lottieError, setLottieError] = useState(false);
  const refCallback = useCallback((instance: DotLottie | null) => {
    if (!instance) return;
    instance.addEventListener('loadError', () => setLottieError(true));
  }, []);

  return (
    <div className={`flex items-center justify-center mx-auto ${className}`} style={{ width: size, height: size }}>
      {lottieError ? (
        <PackageOpen className="w-16 h-16 text-[#CBD5E1]" />
      ) : (
        <DotLottieReact
          src={EXCITING_LOTTIE_SRC}
          loop
          autoplay
          dotLottieRefCallback={refCallback}
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </div>
  );
}

export function useExcitingLottie() {
  return { ExcitingLottie };
}
