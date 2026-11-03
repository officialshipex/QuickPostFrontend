import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AlertTriangle, Ban, Trash2 } from 'lucide-react';

// Confirmation popup for Bulk Cancel / Bulk Delete on the orders pages. Call it and wait for the answer:
//   if (!(await confirmBulkAction({ action: 'cancel', count: selectedOrders.length }))) return;
// cancel = cancel the booked shipments with the courier (orders stay, in Cancelled, freight refunded)
// delete = remove not-yet-booked orders from the system for good (booked shipments are never deleted)

type BulkAction = 'cancel' | 'delete';

const COPY: Record<BulkAction, { title: (n: number) => string; points: string[]; confirm: (n: number) => string }> = {
  cancel: {
    title: (n) => `Cancel ${n} shipment${n === 1 ? '' : 's'}?`,
    points: [
      'Only the courier booking is cancelled — the orders are NOT deleted.',
      'The orders move to the Cancelled tab and the freight is refunded to the wallet.',
      'Shipments the courier has already picked up cannot be cancelled and are skipped.',
    ],
    confirm: (n) => `Yes, cancel ${n} shipment${n === 1 ? '' : 's'}`,
  },
  delete: {
    title: (n) => `Delete ${n} order${n === 1 ? '' : 's'} permanently?`,
    points: [
      'The orders are removed completely from the system and cannot be recovered.',
      'Only orders not yet booked with a courier are deleted — booked shipments are never deleted (cancel those instead).',
    ],
    confirm: (n) => `Yes, delete ${n} order${n === 1 ? '' : 's'}`,
  },
};

function Dialog({ action, count, orderNumber, onAnswer }: { action: BulkAction; count: number; orderNumber?: string | number; onAnswer: (yes: boolean) => void }) {
  const copy = COPY[action];
  const Icon = action === 'delete' ? Trash2 : Ban;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onAnswer(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onAnswer]);

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => onAnswer(false)} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-red-600" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold text-[#0F172A]">{copy.title(count)}</h3>
            <p className="text-[12px] text-[#64748B] mt-0.5">
              {orderNumber ? (
                <>Order <span className="font-bold text-[#0F172A]">#{orderNumber}</span></>
              ) : (
                <><span className="font-bold text-[#0F172A]">{count}</span> {action === 'delete' ? 'order' : 'shipment'}{count === 1 ? '' : 's'} selected</>
              )}
            </p>
          </div>
        </div>
        <ul className="mt-4 space-y-2">
          {copy.points.map((p) => (
            <li key={p} className="flex items-start gap-2 text-[13px] text-[#475569] leading-relaxed">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-[3px] shrink-0" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
        <div className="flex gap-3 mt-6">
          <button
            autoFocus
            onClick={() => onAnswer(false)}
            className="flex-1 h-10 rounded-xl border border-[#E2E8F0] text-[#475569] text-[13px] font-semibold hover:bg-[#F8FAFC]"
          >
            No, go back
          </button>
          <button
            onClick={() => onAnswer(true)}
            className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold"
          >
            {copy.confirm(count)}
          </button>
        </div>
      </div>
    </div>
  );
}

// orderNumber (optional): a single order's number, shown instead of "N selected"
export function confirmBulkAction({ action, count = 1, orderNumber }: { action: BulkAction; count?: number; orderNumber?: string | number }): Promise<boolean> {
  return new Promise((resolve) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    let done = false;
    const onAnswer = (yes: boolean) => {
      if (done) return;
      done = true;
      root.unmount();
      host.remove();
      resolve(yes);
    };
    root.render(<Dialog action={action} count={count} orderNumber={orderNumber} onAnswer={onAnswer} />);
  });
}
