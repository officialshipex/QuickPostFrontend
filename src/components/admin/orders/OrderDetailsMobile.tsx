import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle, ArrowLeft, Check, ChevronDown, ChevronRight, Copy, Headset, History, Loader2, MapPin, MoreHorizontal, Phone, X,
  FileText, Tag, ClipboardList, CopyPlus, PencilLine, Trash2, XCircle, LifeBuoy, Scale, CircleDot,
} from 'lucide-react';
import { AddressAccuracyGauge } from '../../ui/AddressAccuracy';
import { copyToClipboard } from '../../../utils/clipboard';
import type { DiscrepancyData, OrderData, TrackingEntry } from '../../../pages/admin/AdminOrderTracking';

/* Mobile order-details layout. Pure presentation: all data, handlers and modals
   stay in AdminOrderTracking (shared with the desktop layout). */

type Addr = { contactName?: string; email?: string; phoneNumber?: string; address?: string; pinCode?: string; city?: string; state?: string } | undefined;
type Milestone = { name: string; date: string; status: string; icon: string };
type ActionOpt = { label: string; action: () => void; isDanger?: boolean };

export interface OrderDetailsMobileProps {
  order: OrderData | null;
  discrepancy: DiscrepancyData | null;
  displayOrderId: string;
  displayStatus: string;
  statusBadgeClass: string;
  milestones: Milestone[];
  courierName: string;
  awbNumber: string;
  primaryText: string;
  primaryAction: () => void;
  actions: ActionOpt[];
  cancelling: boolean;
  formatDate: (d?: string, withTime?: boolean) => string;
  formatTrackingDate: (d?: string) => { date: string; time: string };
  courierLogo: (name: string) => React.ReactNode;
  onToast: (type: 'success' | 'error', msg: string) => void;
  onShowNdrHistory: () => void;
  onNdrReattempt: () => void;
  onNdrRto: () => void;
  onNdrUpdateInfo: () => void;
  onRaiseDispute: () => void;
}

const card = 'bg-white rounded-2xl shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)]';
const money = (n?: number | null) => (n == null ? '—' : `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return createPortal(
    <div className="md:hidden fixed inset-0 z-[300] flex items-end" onClick={onClose}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F172A]/40" />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
        className="relative w-full max-h-[80vh] overflow-y-auto bg-white rounded-t-2xl px-5 pt-2 pb-[max(16px,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-[#E2E8F0] mx-auto mb-2" />
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-[14px] font-bold text-[#0F172A]">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] active:bg-[#F1F5F9]">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>,
    document.body,
  );
}

const actionIcon = (label: string) => {
  const l = label.toLowerCase();
  if (l.includes('invoice')) return FileText;
  if (l.includes('label')) return Tag;
  if (l.includes('manifest')) return ClipboardList;
  if (l.includes('clone')) return CopyPlus;
  if (l.includes('update')) return PencilLine;
  if (l.includes('delete')) return Trash2;
  if (l.includes('cancel')) return XCircle;
  if (l.includes('dispute')) return Scale;
  if (l.includes('ticket') || l.includes('support')) return LifeBuoy;
  return CircleDot;
};

function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h3 className="text-[15px] font-bold text-[#0F172A]">{children}</h3>
      {right}
    </div>
  );
}

function KV({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-[13px]">
      <span className="text-[#64748B]">{label}</span>
      <span className={`${strong ? 'font-bold' : 'font-medium'} text-[#0F172A] text-right tabular-nums`}>{value}</span>
    </div>
  );
}

const joinAddr = (a: Addr) => [a?.address, a?.city, a?.state, a?.pinCode].filter(Boolean).join(', ');

export function OrderDetailsMobile(p: OrderDetailsMobileProps) {
  const navigate = useNavigate();
  const { order } = p;
  const [sheet, setSheet] = useState<null | 'pickup' | 'tracking' | 'actions' | 'price'>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const isUserSide = window.location.pathname.startsWith('/user/');
  // Get Help: open Create Ticket straight away (Support shows a top progress bar), prefilled with the AWB (or the order ID).
  const goToHelp = () => {
    if (!isUserSide) { navigate('/admin/support'); return; }
    const awb = order?.awb_number ? String(order.awb_number) : '';
    navigate('/user/support', {
      state: { openCreateTicket: true, showProgress: true, ticketPrefill: awb ? { awb } : { orderId: p.displayOrderId } },
    });
  };

  const copy = async (key: string, value: string, label: string) => {
    if (!value) return;
    if (await copyToClipboard(value)) {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } else {
      p.onToast('error', `Couldn't copy ${label}`);
    }
  };
  const copyBtn = (k: string, value: string, label: string) => (
    <button type="button" onClick={() => copy(k, value, label)} aria-label={`Copy ${label}`} className="shrink-0 text-[#94A3B8] active:text-[#00A86B]">
      {copied === k ? <Check className="w-4 h-4 text-[#00A86B]" /> : <Copy className="w-4 h-4" />}
    </button>
  );

  const pickup: Addr = order?.pickupAddress;
  const receiver: Addr = order?.receiverAddress;
  const products: (NonNullable<OrderData['productDetails']>[number] & { sku?: string; tax?: number | string; discount?: number | string })[] = order?.productDetails || [];
  const itemCount = products.reduce((s, x) => s + (Number(x.quantity) || 1), 0);
  const productTotal = products.reduce((s, x) => s + (Number(x.unitPrice) || 0) * (Number(x.quantity) || 1), 0);
  const orderTotal = order?.paymentDetails?.amount ?? productTotal;
  const method = (order?.paymentDetails?.method || '').toUpperCase() === 'COD' ? 'COD' : order?.paymentDetails?.method ? 'Prepaid' : '';
  const pkg = order?.packageDetails;
  const vw = pkg?.volumetricWeight;
  const volKg = vw?.length && vw?.width && vw?.height ? ((vw.length * vw.width * vw.height) / 5000).toFixed(2) : vw?.calculatedWeight;
  const hasAwb = !!order?.awb_number;
  const tracking: TrackingEntry[] = [...(order?.tracking || [])].filter((t) => t.Instructions && t.StatusDateTime).reverse();
  const createdTime = order?.createdAt ? new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase() : '';
  const customerCopyText = [receiver?.contactName, receiver?.phoneNumber, receiver?.email, joinAddr(receiver)].filter(Boolean).join('\n');
  const isDisputeAccepted = p.discrepancy?.status === 'Accepted';
  const isDisputeRaised = p.discrepancy?.status === 'Discrepancy Raised';
  const ndrEnabled = order?.ndrStatus === 'Undelivered' && order?.reattempt === true;

  return (
    <div className="md:hidden -m-4 min-h-screen bg-[#F8FAFC] pb-24 text-[#0F172A]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-[#E2E8F0] px-4 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button type="button" onClick={() => window.history.back()} aria-label="Back" className="w-9 h-9 -ml-2 rounded-full flex items-center justify-center text-[#0F172A] active:bg-[#F1F5F9]">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[17px] font-bold">Order Details</h1>
        </div>
        <button
          type="button"
          onClick={goToHelp}
          className="h-9 px-3.5 rounded-full border border-[#00A86B] text-[#00A86B] text-[12.5px] font-semibold inline-flex items-center gap-1.5 active:bg-[#F0FDF4]"
        >
          <Headset className="w-4 h-4" /> Get Help
        </button>
      </div>

      <div className="px-3 pt-3 space-y-3">
        {/* Order summary */}
        <div className={`${card} p-4`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[15px] font-bold truncate">#{p.displayOrderId}</span>
              {copyBtn("order", p.displayOrderId, "Order ID")}
            </div>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${p.statusBadgeClass}`}>{p.displayStatus.replace(/(^|\s)\S/g, (c) => c.toUpperCase())}</span>
          </div>
          <p className="text-[12px] text-[#94A3B8] mt-1">{p.formatDate(order?.createdAt)}{createdTime ? ` ${createdTime}` : ''}</p>
          <p className="text-[14px] font-semibold mt-3">
            {itemCount} {itemCount === 1 ? 'Product' : 'Products'}
            <span className="text-[#CBD5E1] mx-1.5">•</span>
            {money(orderTotal)}
            {method && <span className="ml-1.5 text-[#00A86B]">({method})</span>}
          </p>
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <span className="inline-flex items-center h-6 px-2.5 rounded-md bg-[#F0FDF4] text-[#009B63] text-[11.5px] font-semibold">
              {(order?.channel || 'CUSTOM').toUpperCase()}{(order?.channelOrderName || order?.channelId) ? ` · ${order.channelOrderName || order.channelId}` : ''}
            </span>
            {hasAwb && (
              <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-md bg-[#F8FAFC] text-[#475569] text-[11.5px] font-medium">
                AWB <span className="font-semibold text-[#0F172A]">{p.awbNumber}</span>
              </span>
            )}
          </div>
          <div className="mt-3.5 pt-3 border-t border-dashed border-[#E2E8F0]">
            <button type="button" onClick={() => setSheet('pickup')} className="w-full flex items-center gap-1.5 text-left text-[13px] min-w-0">
              <span className="text-[#64748B] shrink-0">Pickup Address :</span>
              <span className="text-[12.5px] font-medium text-[#334155] truncate border-b border-dotted border-[#94A3B8]">{[pickup?.contactName, pickup?.address].filter(Boolean).join(', ') || '—'}</span>
            </button>
          </div>
        </div>

        {/* Shipment */}
        {hasAwb && (
          <div className={`${card} p-4`}>
            <SectionTitle>Shipment</SectionTitle>
            <div className="flex items-center gap-3">
              {p.courierLogo(p.courierName)}
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold truncate">{p.courierName}</p>
                <p className="text-[12px] text-[#64748B] flex items-center gap-1.5">
                  AWB <span className="font-semibold text-[#00A86B] tabular-nums">{p.awbNumber}</span>
                  {copyBtn("awb", p.awbNumber, "AWB")}
                </p>
              </div>
            </div>
            {order?.estimatedDeliveryDate && (
              <div className="mt-3 rounded-xl bg-[#F8FAFC] px-3.5 py-2.5 flex items-center justify-between text-[13px]">
                <span className="text-[#64748B]">Estimated Delivery</span>
                <span className="font-semibold">{p.formatDate(order.estimatedDeliveryDate)}</span>
              </div>
            )}
            {/* Steps */}
            <div className="flex items-start mt-4">
              {p.milestones.map((m, i) => {
                const done = m.status === 'completed';
                const active = m.status === 'active';
                const last = i === p.milestones.length - 1;
                return (
                  <div key={i} className="flex-1 min-w-0 flex flex-col items-center text-center">
                    <div className="flex items-center w-full">
                      <span className="flex-1 h-[2px]" style={{ background: i === 0 ? 'transparent' : p.milestones[i - 1].status === 'completed' ? '#00A86B' : '#E2E8F0' }} />
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${done || active ? 'bg-[#00A86B] text-white' : 'bg-white border-2 border-[#E2E8F0]'}`}>
                        {done && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                        {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      <span className="flex-1 h-[2px]" style={{ background: last ? 'transparent' : done ? '#00A86B' : '#E2E8F0' }} />
                    </div>
                    <span className={`text-[10.5px] leading-tight mt-1.5 px-0.5 ${active ? 'font-bold text-[#00A86B]' : done ? 'font-medium text-[#0F172A]' : 'text-[#94A3B8]'}`}>{m.name}</span>
                  </div>
                );
              })}
            </div>
            {tracking.length > 0 && (
              <button type="button" onClick={() => setSheet('tracking')} className="mt-4 w-full flex items-center gap-3 rounded-xl border border-[#EEF2F6] px-3.5 py-3 text-left active:bg-[#F8FAFC]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00A86B] shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold truncate">{tracking[0].Instructions}</span>
                  <span className="block text-[11.5px] text-[#64748B]">
                    {(() => { const t = p.formatTrackingDate(tracking[0].StatusDateTime); return `${t.date}, ${t.time}`; })()}
                    {tracking[0].StatusLocation ? ` · ${tracking[0].StatusLocation}` : ''}
                  </span>
                </span>
                <span className="text-[12px] font-semibold text-[#00A86B] shrink-0 flex items-center">History <ChevronRight className="w-4 h-4" /></span>
              </button>
            )}
          </div>
        )}

        {/* Customer */}
        <div className={`${card} p-4`}>
          <SectionTitle right={
            <button type="button" onClick={() => copy('customer', customerCopyText, 'customer details')} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#00A86B]">
              {copied === 'customer' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Copy Details
            </button>
          }>Customer Details</SectionTitle>
          <p className="text-[14px] font-semibold">{receiver?.contactName || '—'}</p>
          <div className="flex items-center gap-2.5 mt-1.5 min-w-0 text-[13px]">
            {receiver?.phoneNumber && (
              <>
                <span className="text-[#64748B] tabular-nums shrink-0">+91-{String(receiver.phoneNumber).replace(/\D/g, '').slice(-10)}</span>
                <a href={`tel:+91${String(receiver.phoneNumber).replace(/\D/g, '').slice(-10)}`} aria-label="Call customer" className="w-7 h-7 rounded-full bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center shrink-0 active:bg-[#DCFCE7]">
                  <Phone className="w-3.5 h-3.5" />
                </a>
              </>
            )}
            {receiver?.email && (
              <>
                {receiver?.phoneNumber && <span className="w-px h-4 bg-[#E2E8F0] shrink-0" />}
                <span className="text-[#64748B] truncate">{receiver.email}</span>
              </>
            )}
          </div>
          <div className="flex items-start justify-between gap-3 mt-2.5">
            <p className="text-[13px] leading-relaxed text-[#334155]">{joinAddr(receiver) || '—'}</p>
            <div className="shrink-0"><AddressAccuracyGauge address={receiver?.address} size="sm" showLabel={false} /></div>
          </div>
        </div>

        {/* Products */}
        <div className={`${card} p-4`}>
          <SectionTitle>Product Details</SectionTitle>
          {products.length === 0 && <p className="text-[13px] text-[#94A3B8]">No products found</p>}
          <div className="space-y-3">
            {products.map((x, i) => (
              <div key={i}>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[14px] font-medium min-w-0">{x.name || '—'}</span>
                  <span className="text-[13px] text-[#64748B] shrink-0">Qty: {x.quantity ?? 1}</span>
                </div>
                <div className="flex items-center justify-between gap-3 mt-1">
                  <span className="flex items-center gap-1.5 text-[12.5px] text-[#64748B] min-w-0">
                    SKU: <span className="font-semibold text-[#0F172A] truncate">{x.sku || '—'}</span>
                    {x.sku ? copyBtn(`sku-${i}`, String(x.sku), "SKU") : null}
                  </span>
                  <span className="text-[14px] font-bold tabular-nums shrink-0">{money(x.unitPrice)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3.5 pt-3 border-t border-dashed border-[#E2E8F0]">
            <button type="button" onClick={() => setSheet('price')} className="w-full flex items-center justify-between gap-3 py-1.5 text-[13px] text-left">
              <span className="flex items-center gap-1 text-[#64748B] min-w-0">
                Product Total Price ({itemCount} {itemCount === 1 ? 'Item' : 'Items'})
                <ChevronDown className="w-4 h-4 shrink-0" />
              </span>
              <span className="font-medium text-[#0F172A] tabular-nums shrink-0">{money(productTotal)}</span>
            </button>
            <div className="flex items-center justify-between pt-1.5">
              <span className="text-[15px] font-bold">Order Total:</span>
              <span className="text-[15px] font-bold tabular-nums">{money(orderTotal)}</span>
            </div>
          </div>
        </div>

        {/* Package */}
        <div className={`${card} p-4`}>
          <SectionTitle>Package Details</SectionTitle>
          <div className="space-y-2 text-[13px]">
            <p><span className="text-[#64748B]">Dead Weight : </span><span className="font-semibold">{pkg?.deadWeight != null ? `${pkg.deadWeight} kg` : '—'}</span></p>
            <p className="flex items-center flex-wrap gap-x-2 gap-y-1">
              <span><span className="text-[#64748B]">Volumetric Weight : </span><span className="font-semibold">{volKg != null ? `${volKg} kg` : '—'}</span></span>
              {vw?.length && (
                <>
                  <span className="w-1 h-1 rounded-full bg-[#CBD5E1]" />
                  <span className="font-medium text-[#334155]">{vw.length} x {vw.width} x {vw.height} cm</span>
                </>
              )}
            </p>
          </div>
          <div className="mt-3 rounded-xl bg-[#F8FAFC] px-3.5 py-3 text-[13px]">
            <span className="text-[#64748B]">Applicable Weight : </span>
            <span className="font-bold">{pkg?.applicableWeight != null ? `${pkg.applicableWeight} kg` : '—'}</span>
          </div>
        </div>

        {/* Charges */}
        {order?.priceBreakup?.total != null && (
          <div className={`${card} p-4`}>
            <SectionTitle>Shipping Charges</SectionTitle>
            <KV label="Base Freight" value={money(order.priceBreakup.freight)} />
            <KV label="COD Handling" value={money(order.priceBreakup.cod)} />
            {p.discrepancy && <KV label="Weight Discrepancy" value={p.discrepancy.excessWeightCharges?.excessCharges != null ? money(Number(p.discrepancy.excessWeightCharges.excessCharges)) : '—'} />}
            <KV label="GST (18%)" value={money(order.priceBreakup.gst)} />
            {!!order.priceBreakup.liability && <KV label="Liability Credit" value={<span className="text-[#00A86B]">+{money(order.priceBreakup.liability)}</span>} />}
            <div className="flex items-center justify-between pt-2 mt-1.5 border-t border-dashed border-[#E2E8F0]">
              <span className="text-[14px] font-bold">Total Billed</span>
              <span className="text-[14px] font-bold text-[#00A86B] tabular-nums">{money(order.priceBreakup.total)}</span>
            </div>
            {p.discrepancy && (
              <div className={`mt-3 rounded-xl px-3.5 py-3 flex items-center justify-between gap-3 ${isDisputeAccepted ? 'bg-[#F0FDF4]' : 'bg-[#FFFBEB]'}`}>
                <span className={`text-[12.5px] flex items-center gap-2 ${isDisputeAccepted ? 'text-emerald-800' : 'text-amber-800'}`}>
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {isDisputeAccepted ? 'Discrepancy accepted' : isDisputeRaised ? 'Dispute raised' : 'Weight discrepancy detected'}
                </span>
                {!isDisputeAccepted && !isDisputeRaised && (
                  <button type="button" onClick={p.onRaiseDispute} className="h-8 px-3 rounded-full bg-white border border-amber-300 text-amber-800 text-[12px] font-semibold shrink-0">Raise Dispute</button>
                )}
              </div>
            )}
          </div>
        )}

        {/* NDR */}
        {order?.ndrStatus && (
          <div className={`${card} p-4`}>
            <SectionTitle right={order.ndrHistory?.length ? (
              <button type="button" onClick={p.onShowNdrHistory} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#00A86B]"><History className="w-3.5 h-3.5" /> History</button>
            ) : undefined}>NDR</SectionTitle>
            <KV label="Status" value={<span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{order.ndrStatus}</span>} />
            {order.ndrReason && <KV label="Reason" value={typeof order.ndrReason === 'string' ? order.ndrReason : (order.ndrReason?.reason || '—')} />}
            {!!order.ndrHistory?.length && <KV label="Attempts" value={`${order.ndrHistory.length} / 3`} />}
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { label: 'Re-attempt', fn: p.onNdrReattempt, cls: 'bg-[#00A86B] text-white' },
                { label: 'RTO', fn: p.onNdrRto, cls: 'border border-red-200 text-red-700' },
                { label: 'Update Info', fn: p.onNdrUpdateInfo, cls: 'border border-[#E2E8F0] text-[#475569]' },
              ].map((b) => (
                <button key={b.label} type="button" disabled={!ndrEnabled} onClick={b.fn}
                  className={`h-9 rounded-full text-[12px] font-semibold ${ndrEnabled ? b.cls : 'bg-[#F1F5F9] text-[#94A3B8]'}`}>{b.label}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[#E2E8F0] px-4 py-2.5 pb-[max(10px,env(safe-area-inset-bottom))] flex items-center gap-2.5">
        <button type="button" onClick={p.primaryAction} disabled={p.cancelling}
          className="flex-1 h-10 rounded-full bg-[#00A86B] active:bg-[#009B63] text-white text-[13.5px] font-semibold shadow-sm disabled:opacity-60">
          {p.primaryText}
        </button>
        {p.actions.length > 0 && (
          <button type="button" onClick={() => setSheet('actions')} disabled={p.cancelling} aria-label="More actions"
            className="w-10 h-10 rounded-full bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center shrink-0 active:bg-[#DCFCE7]">
            {p.cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreHorizontal className="w-5 h-5" />}
          </button>
        )}
      </div>

      <AnimatePresence>
        {sheet === 'pickup' && (
          <Sheet title="Pickup Address" onClose={() => setSheet(null)}>
            <div className="rounded-xl bg-[#F8FAFC] px-3.5 py-3 flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#00A86B] mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1 text-[12.5px] leading-[1.55] text-[#475569]">
                {pickup?.contactName && <p className="font-semibold text-[#0F172A]">{pickup.contactName}</p>}
                <p>{joinAddr(pickup) || '—'}</p>
                {pickup?.phoneNumber && <p className="mt-1">{pickup.phoneNumber}</p>}
                {pickup?.email && <p>{pickup.email}</p>}
              </div>
              <AddressAccuracyGauge address={pickup?.address} size="sm" showLabel={false} />
            </div>
          </Sheet>
        )}
        {sheet === 'tracking' && (
          <Sheet title="Tracking History" onClose={() => setSheet(null)}>
            <ol className="relative pl-5">
              <span className="absolute left-[5px] top-2 bottom-2 w-px bg-[#E2E8F0]" />
              {tracking.map((t, i) => {
                const d = p.formatTrackingDate(t.StatusDateTime);
                return (
                  <li key={i} className="relative pb-3.5 last:pb-0">
                    <span className={`absolute -left-5 top-1 w-[11px] h-[11px] rounded-full border-2 border-white ${i === 0 ? 'bg-[#00A86B]' : 'bg-[#CBD5E1]'}`} />
                    <p className={`text-[13px] ${i === 0 ? 'font-bold' : 'font-medium'}`}>{t.Instructions}</p>
                    <p className="text-[11.5px] text-[#64748B]">{d.date}, {d.time}{t.StatusLocation ? ` · ${t.StatusLocation}` : ''}</p>
                  </li>
                );
              })}
            </ol>
          </Sheet>
        )}
        {sheet === 'price' && (
          <Sheet title="Price Information" onClose={() => setSheet(null)}>
            <div className="space-y-3">
              {products.map((x, i) => {
                const qty = Number(x.quantity) || 1;
                const line = (Number(x.unitPrice) || 0) * qty;
                const taxPct = Number(x.tax) || 0;
                return (
                  <div key={i} className={i > 0 ? 'pt-3 border-t border-[#F1F5F9]' : ''}>
                    <KV label={`Unit Price (Qty: ${qty} | ${x.name || 'Product'})`} value={money(x.unitPrice)} />
                    <KV label={taxPct ? `Tax (${taxPct}%)` : 'Tax'} value={money((line * taxPct) / 100)} />
                    <KV label="Discount" value={money(Number(x.discount) || 0)} />
                  </div>
                );
              })}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-dashed border-[#E2E8F0]">
                <span className="text-[14px] font-semibold text-[#64748B]">Product Total Price</span>
                <span className="text-[15px] font-bold tabular-nums">{money(productTotal)}</span>
              </div>
            </div>
          </Sheet>
        )}
        {sheet === 'actions' && (
          <Sheet title="Actions" onClose={() => setSheet(null)}>
            <div className="-mx-2">
              {p.actions.map((a, i) => {
                const Icon = actionIcon(a.label);
                return (
                  <React.Fragment key={i}>
                    {a.isDanger && i > 0 && <div className="h-px bg-[#F1F5F9] my-1 mx-2" />}
                    <button type="button" onClick={() => { setSheet(null); a.action(); }}
                      className={`w-full flex items-center gap-3 text-left px-2 h-10 rounded-lg text-[13px] active:bg-[#F8FAFC] ${a.isDanger ? 'font-medium text-red-600' : 'font-medium text-[#334155]'}`}>
                      <Icon className={`w-4 h-4 shrink-0 ${a.isDanger ? 'text-red-500' : 'text-[#64748B]'}`} />
                      {a.label}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </Sheet>
        )}
      </AnimatePresence>
    </div>
  );
}
