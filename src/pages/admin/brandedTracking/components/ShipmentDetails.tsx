import { ArrowRight, Package, Receipt } from 'lucide-react';
import type { BrandedTrackingData, TrackingAppearanceConfig } from '../types';
import { cardStyle, type ThemeTokens } from '../theme';

function Row({ label, value, t }: { label: string; value?: React.ReactNode; t: ThemeTokens }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-[13px] border-b last:border-b-0" style={{ borderColor: t.border }}>
      <span style={{ color: t.muted }}>{label}</span>
      <span className="font-semibold text-right min-w-0 break-words" style={{ color: t.text }}>{value}</span>
    </div>
  );
}

function CardTitle({ icon: Icon, title, t }: { icon: React.ElementType; title: string; t: ThemeTokens }) {
  return (
    <div className="flex items-center gap-2.5 mb-2">
      <span className="w-8 h-8 flex items-center justify-center" style={{ background: `color-mix(in srgb, ${t.primary} 12%, transparent)`, color: t.primary, borderRadius: t.radiusSm }}>
        <Icon className="w-4 h-4" />
      </span>
      <h3 className="text-[15px] font-bold" style={{ color: t.text }}>{title}</h3>
    </div>
  );
}

export function ShipmentDetails({ data, cfg, t }: { data: BrandedTrackingData; cfg: TrackingAppearanceConfig; t: ThemeTokens }) {
  const showShipment = cfg.showShipmentDetails;
  const showPackage = cfg.showPackageDetails && (data.weight || data.dimensions || data.items.length > 0);
  if (!showShipment && !showPackage) return null;

  return (
    <div className={`grid grid-cols-1 gap-4 ${showShipment && showPackage ? '@2xl:grid-cols-2' : ''}`}>
      {showShipment && (
        <div className="p-5 @2xl:p-6" style={cardStyle(t)}>
          <CardTitle icon={Receipt} title="Shipment Details" t={t} />
          {data.origin && data.destination && (
            <div className="flex items-center gap-2 px-3 py-2.5 mb-1 text-[13.5px] font-semibold" style={{ color: t.text, background: t.surfaceMuted, borderRadius: t.radiusSm }}>
              <span className="truncate">{data.origin}</span>
              <ArrowRight className="w-4 h-4 shrink-0" style={{ color: t.primary }} />
              <span className="truncate">{data.destination}</span>
            </div>
          )}
          <Row label="Order ID" value={data.orderId} t={t} />
          {cfg.showAwb && <Row label="AWB Number" value={data.awb} t={t} />}
          {cfg.showCourier && <Row label="Courier Partner" value={data.courierName} t={t} />}
          <Row label="Payment" value={data.paymentMode === 'COD' && data.codAmount ? `Cash on Delivery · ₹${data.codAmount.toLocaleString('en-IN')}` : data.paymentMode === 'COD' ? 'Cash on Delivery' : 'Prepaid'} t={t} />
        </div>
      )}
      {showPackage && (
        <div className="p-5 @2xl:p-6" style={cardStyle(t)}>
          <CardTitle icon={Package} title="Package Details" t={t} />
          <Row label="Weight" value={data.weight} t={t} />
          <Row label="Dimensions" value={data.dimensions} t={t} />
          {data.items.length > 0 && (
            <div className="pt-3">
              <p className="text-[12px] font-bold uppercase tracking-[0.06em] mb-2" style={{ color: t.muted }}>Items in this package</p>
              <ul className="space-y-2">
                {data.items.map((item, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="min-w-0 truncate" style={{ color: t.text }}>{item.name}</span>
                    <span className="shrink-0 font-semibold px-2 py-0.5 text-[12px]" style={{ background: t.surfaceMuted, color: t.muted, borderRadius: 999 }}>Qty {item.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
