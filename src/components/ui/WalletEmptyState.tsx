import { useState, useCallback } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import type { DotLottie } from '@lottiefiles/dotlottie-react';
import { Wallet } from 'lucide-react';
import walletAnimation from '../../assets/lottie/empty-wallet.json';

const WALLET_ANIMATION_DATA = JSON.stringify(walletAnimation);

interface WalletEmptyStateProps {
  title?: string;
  subtitle?: string;
  size?: number;
  className?: string;
}

export function WalletEmptyState({ title, subtitle, size = 240, className = '' }: WalletEmptyStateProps) {
  const [lottieError, setLottieError] = useState(false);
  const refCallback = useCallback((instance: DotLottie | null) => {
    if (!instance) return;
    instance.addEventListener('loadError', () => setLottieError(true));
  }, []);
  return (
    <div className={`flex flex-col items-center justify-center w-full py-2 mx-auto ${className}`}>
      <div className="flex items-center justify-center mx-auto" style={{ width: size, height: size }}>
        {lottieError ? (
          <Wallet className="w-16 h-16 text-[#CBD5E1]" />
        ) : (
          <DotLottieReact
            data={WALLET_ANIMATION_DATA}
            loop
            autoplay
            dotLottieRefCallback={refCallback}
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </div>
      {title && <p className="text-sm font-semibold text-[#64748B] -mt-4">{title}</p>}
      {subtitle && <p className="text-xs font-medium text-[#94A3B8] mt-1">{subtitle}</p>}
    </div>
  );
}
