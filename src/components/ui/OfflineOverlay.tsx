import { useEffect, useRef, useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

// navigator.onLine only reflects the network adapter's link state, not real
// internet reachability — it can stay `true` while the actual connection is
// down. A same-origin ping is also unreliable on a local/LAN dev server: it
// keeps succeeding even when the machine's actual internet/WAN is down,
// since the dev server itself is still reachable on the LAN. Ping external
// hosts instead so this reflects real internet connectivity.
const PING_URLS = [
  'https://www.gstatic.com/generate_204',
  'https://www.google.com/favicon.ico',
  'https://www.cloudflare.com/favicon.ico',
];
const PING_INTERVAL_MS = 4000;
const PING_TIMEOUT_MS = 3000;

function pingOnce(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      resolve(false);
    }, PING_TIMEOUT_MS);

    fetch(`${url}?_=${Date.now()}`, { method: 'GET', cache: 'no-store', mode: 'no-cors', signal: controller.signal })
      .then(() => { clearTimeout(timer); resolve(true); })
      .catch(() => { clearTimeout(timer); resolve(false); });
  });
}

async function checkReachable(): Promise<boolean> {
  if (!navigator.onLine) return false;
  // Race all candidates — first one to succeed wins; only "offline" if every single one fails.
  const results = await Promise.all(PING_URLS.map(pingOnce));
  return results.some(Boolean);
}

export function OfflineOverlay() {
  // Seed from navigator.onLine so an already-offline device shows the
  // overlay instantly instead of waiting for the first async probe.
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    let inFlight = false;

    const runCheck = async () => {
      if (inFlight) return;
      inFlight = true;
      const reachable = await checkReachable();
      inFlight = false;
      if (mounted.current) setIsOnline(reachable);
    };

    runCheck();
    const interval = setInterval(runCheck, PING_INTERVAL_MS);

    // Instant reaction to the adapter dropping, without waiting on the probe.
    const handleOffline = () => setIsOnline(false);
    const handleOnline = () => runCheck();
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      mounted.current = false;
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-[480px] aspect-square">
        <DotLottieReact
          src="https://lottie.host/998ef698-0249-43af-91fb-935760baddf5/mxTvnhXUgk.lottie"
          loop
          autoplay
        />
      </div>
    </div>
  );
}
