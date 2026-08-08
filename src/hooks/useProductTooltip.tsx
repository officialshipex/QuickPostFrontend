import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface ProductTooltipProduct {
  name: string;
  sku?: string;
  qty: number;
  price: number;
  total: number;
}

export interface ProductTooltipOrder {
  qty: number;
  products: ProductTooltipProduct[];
}

interface ProductHoverPos {
  id: string;
  rect: DOMRect;
}

/**
 * Shared product line-item hover/tap card used by Orders, CRM, NDR, etc.
 * Tap (or hover, on desktop) a product name to open; tap anywhere else to close —
 * matches the original click-to-open/tap-anywhere-to-close behavior via a
 * document-level pointerdown listener (no backdrop div needed).
 */
export function useProductTooltip() {
  const [productHoverPos, setProductHoverPos] = useState<ProductHoverPos | null>(null);

  useEffect(() => {
    if (!productHoverPos) return;
    const handler = () => setProductHoverPos(null);
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [productHoverPos]);

  // Click/tap trigger — toggles: tapping the same row's product again closes it.
  const openProductTooltip = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setProductHoverPos(prev => (prev?.id === id ? null : { id, rect }));
  };

  // Hover trigger (desktop tables) — always opens, no toggle-off, since re-entering
  // the same row on mouseenter should simply refresh its position.
  const hoverOpenProductTooltip = (id: string, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setProductHoverPos({ id, rect });
  };

  // Closes only if the currently-open tooltip belongs to this id (guards against a
  // mouseleave on row A clobbering a tooltip that row B's mouseenter just opened).
  const closeProductTooltip = (id?: string) =>
    setProductHoverPos(prev => (id === undefined || prev?.id === id ? null : prev));

  return { productHoverPos, setProductHoverPos, openProductTooltip, hoverOpenProductTooltip, closeProductTooltip };
}

/**
 * Renders the white-card product line-item breakdown, portaled to document.body,
 * clamped to stay fully on-screen (flips above the trigger and shrinks width on mobile).
 * Pass null order to render nothing (e.g. while the matching row can't be found).
 */
export function ProductTooltipCard({
  productHoverPos,
  order,
}: {
  productHoverPos: ProductHoverPos | null;
  order: ProductTooltipOrder | null | undefined;
}) {
  if (!productHoverPos || !order || order.products.length === 0) return null;

  const { rect } = productHoverPos;
  const grandTotal = order.products.reduce((s, p) => s + p.total, 0);
  const tooltipWidth = Math.min(320, window.innerWidth - 16);
  const showAbove = rect.bottom + 220 > window.innerHeight - 8;

  return createPortal(
    <div
      className="fixed z-[999] bg-white border border-[#E2E8F0] rounded-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.15)] p-3 pointer-events-none max-h-[70vh] overflow-y-auto"
      style={{
        width: tooltipWidth,
        top: showAbove ? undefined : rect.bottom + 4,
        bottom: showAbove ? window.innerHeight - rect.top + 4 : undefined,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - tooltipWidth - 8)),
      }}
    >
      <table className="w-full text-[11px] border-collapse">
        <thead>
          <tr className="text-[#64748B] border-b border-[#E2E8F0]">
            <th className="text-left font-semibold pb-1.5 pr-2">Name</th>
            <th className="text-left font-semibold pb-1.5 pr-2">SKU</th>
            <th className="text-left font-semibold pb-1.5 pr-2">Qty</th>
            <th className="text-left font-semibold pb-1.5 pr-2">Price</th>
            <th className="text-left font-semibold pb-1.5">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.products.map((p, i) => (
            <tr key={i} className="text-[#0F172A] border-b border-[#F1F5F9] last:border-0">
              <td className="py-1.5 pr-2 break-words">{p.name}</td>
              <td className="py-1.5 pr-2 text-[#64748B] break-words">{p.sku || '—'}</td>
              <td className="py-1.5 pr-2">{p.qty}</td>
              <td className="py-1.5 pr-2">₹{p.price.toLocaleString('en-IN')}</td>
              <td className="py-1.5 font-semibold">₹{p.total.toLocaleString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-[#E2E8F0] font-bold text-[#0F172A]">
            <td className="pt-1.5" colSpan={2}>Grand Total</td>
            <td className="pt-1.5">{order.qty}</td>
            <td className="pt-1.5"></td>
            <td className="pt-1.5">₹{grandTotal.toLocaleString('en-IN')}</td>
          </tr>
        </tfoot>
      </table>
    </div>,
    document.body
  );
}
