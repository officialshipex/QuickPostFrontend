import { Info, MoveHorizontal, MoveVertical } from 'lucide-react';
import { ColorField, Field, Group, Segmented, ToggleRow } from './controls';
import type { PanelProps } from './panelTypes';

export function TrackingPanel({ config, update }: PanelProps) {
  const tr = config.tracking;
  const set = (patch: Partial<typeof tr>) => update('tracking', patch);
  const setColor = (k: keyof typeof tr.statusColors, v: string) => set({ statusColors: { ...tr.statusColors, [k]: v } });

  return (
    <div>
      <div className="mt-4 mb-1 flex items-start gap-2.5 p-3 rounded-lg bg-[#F0F9FF] border border-[#BAE6FD]">
        <Info className="w-4 h-4 text-[#0369A1] shrink-0 mt-0.5" />
        <p className="text-[11.5px] text-[#0C4A6E] leading-relaxed">
          These settings change how tracking looks. Shipment status, dates and scans always come from live QuickPost courier data.
        </p>
      </div>

      <Group title="Timeline">
        <Field label="Timeline Style" hint="“With Milestones” adds a 5-step progress stepper above the tracking history.">
          <Segmented value={tr.timelineStyle} onChange={(timelineStyle) => set({ timelineStyle })} options={[{ value: 'vertical', label: 'Activity Only', icon: MoveVertical }, { value: 'horizontal', label: 'With Milestones', icon: MoveHorizontal }]} />
        </Field>
        <ToggleRow label="Status Icons" description="Icons in the milestone stepper instead of plain dots." checked={tr.showStatusIcons} onChange={(showStatusIcons) => set({ showStatusIcons })} />
        <ToggleRow label="Progress Bar" checked={tr.showProgressBar} onChange={(showProgressBar) => set({ showProgressBar })} />
        <ToggleRow label="Timestamps" checked={tr.showTimestamps} onChange={(showTimestamps) => set({ showTimestamps })} />
        <ToggleRow label="Scan Location" checked={tr.showLocation} onChange={(showLocation) => set({ showLocation })} />
        <ToggleRow label="Delivered Animation" description="Plays a short celebration when the order is delivered." checked={tr.showDeliveredAnimation} onChange={(showDeliveredAnimation) => set({ showDeliveredAnimation })} />
      </Group>

      <Group title="Shipment Information">
        <ToggleRow label="Estimated Delivery Date" checked={tr.showEstimatedDelivery} onChange={(showEstimatedDelivery) => set({ showEstimatedDelivery })} />
        <ToggleRow label="AWB Number" checked={tr.showAwb} onChange={(showAwb) => set({ showAwb })} />
        <ToggleRow label="Courier Name" checked={tr.showCourier} onChange={(showCourier) => set({ showCourier })} />
        <ToggleRow label="Shipment Details" description="Order ID, route and payment mode." checked={tr.showShipmentDetails} onChange={(showShipmentDetails) => set({ showShipmentDetails })} />
        <ToggleRow label="Package Details" description="Weight, dimensions and items." checked={tr.showPackageDetails} onChange={(showPackageDetails) => set({ showPackageDetails })} />
      </Group>

      <Group title="Status Colors">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ColorField label="Completed" value={tr.statusColors.completed} onChange={(v) => setColor('completed', v)} swatches={['#00A86B', '#16A34A', '#059669', config.branding.primaryColor.toUpperCase()]} />
          <ColorField label="Current" value={tr.statusColors.current} onChange={(v) => setColor('current', v)} swatches={['#2563EB', '#7C3AED', '#0891B2', config.branding.primaryColor.toUpperCase()]} />
          <ColorField label="Pending" value={tr.statusColors.pending} onChange={(v) => setColor('pending', v)} swatches={['#CBD5E1', '#E2E8F0', '#94A3B8', '#475569']} />
          <ColorField label="Exception" value={tr.statusColors.exception} onChange={(v) => setColor('exception', v)} swatches={['#D97706', '#EA580C', '#DC2626', '#CA8A04']} />
        </div>
      </Group>
    </div>
  );
}
