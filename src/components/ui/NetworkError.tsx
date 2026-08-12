import { useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface NetworkErrorProps {
  /** Message shown under the animation — keep it short, non-technical. */
  message?: string;
  /** Called once after the auto-dismiss timer elapses (default 5000ms). */
  onDone: () => void;
  /** Auto-dismiss delay in ms. */
  duration?: number;
  /** Animation pixel size (square) */
  size?: number;
}

/**
 * Full-panel "courier network issue" overlay. Shown in place of a raw error
 * trace when a courier partner's API fails during shipment creation, so the
 * customer understands the courier is having an issue rather than seeing a
 * stack trace. Auto-dismisses after `duration` and calls `onDone` so the
 * caller can return to the courier list.
 */
export function NetworkError({
  message = "We couldn't connect to the courier's network. Please try again or pick another courier.",
  onDone,
  duration = 5000,
  size = 200,
}: NetworkErrorProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, duration);
    return () => clearTimeout(timer);
  }, [onDone, duration]);

  return (
    <div className="absolute inset-0 z-30 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center gap-1 px-6 text-center">
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <DotLottieReact
          src="https://lottie.host/00af739b-281c-48ea-8230-1cb7a42e6baa/FPnI6vO3ZY.lottie"
          loop
          autoplay
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <p className="text-sm font-semibold text-[#64748B] -mt-4">Courier Network Issue</p>
      <p className="text-xs font-medium text-[#94A3B8] max-w-[280px] mt-1">{message}</p>
    </div>
  );
}
