// A small progress card (bottom-right) for bulk PDF downloads — labels, invoices, manifests.
//
// The action menu closes as soon as the user clicks, and a 500-order download takes ~30 seconds, so without this
// nothing on screen said the download was running. The card lives outside React (on document.body), so closing a
// menu or a re-render never removes it; it stays until the file is ready, then says how it went.
//
//   const progress = startDownloadProgress('labels', 500);   // total = null -> no count, an animated bar
//   progress.update(150);                                     // orders done so far
//   progress.finish('success', '500 labels downloaded');      // 'success' closes itself; 'error' / 'info' stay
// Same code in ShipexFrontend: src/utils/downloadProgress.js

const CONTAINER_ID = 'bulk-download-progress';
const STYLE_ID = 'bulk-download-progress-style';
const AUTO_CLOSE_MS = 6000;

const ensureStyles = () => {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes bdp-spin { to { transform: rotate(360deg); } }
    @keyframes bdp-slide { 0% { left: -40%; } 100% { left: 100%; } }
    #${CONTAINER_ID} .bdp-spinner { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.25);
      border-top-color: #fff; animation: bdp-spin 0.8s linear infinite; flex-shrink: 0; }
    #${CONTAINER_ID} .bdp-indeterminate { position: absolute; top: 0; width: 40%; height: 100%; border-radius: 999px;
      background: #60A5FA; animation: bdp-slide 1.2s ease-in-out infinite; }
    @media (prefers-reduced-motion: reduce) {
      #${CONTAINER_ID} .bdp-spinner, #${CONTAINER_ID} .bdp-indeterminate { animation-duration: 3s; }
    }`;
  document.head.appendChild(style);
};

const getContainer = () => {
  let el = document.getElementById(CONTAINER_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = CONTAINER_ID;
    Object.assign(el.style, {
      position: 'fixed', right: '16px', bottom: '16px', zIndex: '10000', width: '320px',
      maxWidth: 'calc(100vw - 32px)', display: 'flex', flexDirection: 'column', gap: '8px',
    });
    document.body.appendChild(el);
  }
  return el;
};

type ProgressType = 'success' | 'error' | 'info';
export type DownloadProgress = { update: (done: number) => void; finish: (type: ProgressType, message: string, detail?: string) => void };

const COLORS: Record<ProgressType, string> = { success: '#34D399', error: '#F87171', info: '#60A5FA' };
const SYMBOLS: Record<ProgressType, string> = { success: '✓', error: '!', info: 'i' };

export function startDownloadProgress(what: string, total: number | null): DownloadProgress {
  ensureStyles();
  const card = document.createElement('div');
  card.setAttribute('role', 'status');
  card.setAttribute('aria-live', 'polite');
  Object.assign(card.style, {
    background: '#1E293B', color: '#fff', borderRadius: '12px', padding: '12px 14px',
    boxShadow: '0 10px 30px rgba(15,23,42,0.35)', border: '1px solid rgba(255,255,255,0.1)',
    fontSize: '13px', lineHeight: '18px', fontFamily: 'inherit',
  });

  const head = document.createElement('div');
  Object.assign(head.style, { display: 'flex', alignItems: 'center', gap: '10px' });
  const icon = document.createElement('span');
  icon.className = 'bdp-spinner';
  const title = document.createElement('span');
  Object.assign(title.style, { flex: '1', fontWeight: '600', minWidth: '0' });
  title.textContent = `Preparing ${what}…`;
  const close = document.createElement('button');
  close.type = 'button';
  close.setAttribute('aria-label', 'Close');
  close.textContent = '×';
  Object.assign(close.style, {
    display: 'none', background: 'transparent', border: '0', color: '#94A3B8', fontSize: '18px',
    lineHeight: '18px', cursor: 'pointer', padding: '0 2px',
  });
  head.append(icon, title, close);

  const sub = document.createElement('div');
  Object.assign(sub.style, { color: '#CBD5E1', fontSize: '12px', marginTop: '4px', paddingLeft: '26px' });
  sub.textContent = total ? `0 of ${total} orders · please keep this tab open` : 'Please keep this tab open';

  const track = document.createElement('div');
  Object.assign(track.style, {
    position: 'relative', overflow: 'hidden', height: '4px', borderRadius: '999px',
    background: 'rgba(255,255,255,0.15)', marginTop: '10px',
  });
  const fill = document.createElement('div');
  if (total) {
    Object.assign(fill.style, { width: '0%', height: '100%', borderRadius: '999px', background: '#60A5FA', transition: 'width 0.3s' });
  } else {
    fill.className = 'bdp-indeterminate';
  }
  track.appendChild(fill);

  card.append(head, sub, track);
  getContainer().appendChild(card);

  let closed = false;
  const remove = () => {
    if (closed) return;
    closed = true;
    card.remove();
    const container = document.getElementById(CONTAINER_ID);
    if (container && !container.childElementCount) container.remove();
  };
  close.addEventListener('click', remove);

  return {
    update(done: number) {
      if (closed || !total) return;
      const shown = Math.min(done, total);
      sub.textContent = `${shown} of ${total} orders · please keep this tab open`;
      fill.style.width = `${Math.round((shown / total) * 100)}%`;
    },
    finish(type: ProgressType, message: string, detail?: string) {
      if (closed) return;
      icon.className = '';
      icon.textContent = SYMBOLS[type] || SYMBOLS.info;
      Object.assign(icon.style, {
        width: '16px', height: '16px', borderRadius: '50%', background: COLORS[type] || COLORS.info, color: '#0F172A',
        fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0',
      });
      title.textContent = message;
      sub.textContent = detail || '';
      sub.style.display = detail ? 'block' : 'none';
      fill.className = '';
      Object.assign(fill.style, { width: '100%', height: '100%', borderRadius: '999px', background: COLORS[type] || COLORS.info });
      close.style.display = 'inline-block';
      if (type === 'success') setTimeout(remove, AUTO_CLOSE_MS);
    },
  };
}
