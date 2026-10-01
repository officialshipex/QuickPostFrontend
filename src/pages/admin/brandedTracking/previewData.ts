/* ─────────────────────────────────────────────────────────────────────────
   PREVIEW-ONLY sample shipments.
   Used exclusively by the builder's live preview so sellers can see how
   each tracking state looks. Never used by the customer-facing page, which
   always reads real data from the QuickPost tracking API.
   ───────────────────────────────────────────────────────────────────────── */

import { buildMilestoneEvents, formatDateTime } from './trackingService';
import type { BrandedTrackingData, TrackingEvent } from './types';

export type PreviewScenario = 'inTransit' | 'outForDelivery' | 'delivered' | 'exception';

export const PREVIEW_SCENARIOS: { id: PreviewScenario; label: string }[] = [
  { id: 'inTransit', label: 'In Transit' },
  { id: 'outForDelivery', label: 'Out for Delivery' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'exception', label: 'Delivery Attempt Failed' },
];

function ev(status: string, description: string, location: string, timestamp: string): TrackingEvent {
  return { status, description, location, timestamp, ...formatDateTime(timestamp) };
}

const BASE_EVENTS: TrackingEvent[] = [
  ev('In Transit', 'Shipment reached destination hub', 'Bengaluru Hub, Karnataka', '2026-09-24T06:42:00+05:30'),
  ev('In Transit', 'Shipment dispatched from origin hub', 'Bhiwandi Hub, Maharashtra', '2026-09-22T23:15:00+05:30'),
  ev('Picked Up', 'Shipment picked up from seller', 'Andheri East, Mumbai', '2026-09-22T16:30:00+05:30'),
  ev('Booked', 'Order confirmed and shipment manifested', 'Mumbai, Maharashtra', '2026-09-21T19:05:00+05:30'),
];

const OFD_EVENT = ev('Out for Delivery', 'Out for delivery with courier executive', 'Koramangala DC, Bengaluru', '2026-09-25T08:20:00+05:30');
const DELIVERED_EVENT = ev('Delivered', 'Delivered to customer', 'Koramangala, Bengaluru', '2026-09-25T13:47:00+05:30');
const FAILED_EVENT = ev('Undelivered', 'Customer not available — delivery will be re-attempted', 'Koramangala DC, Bengaluru', '2026-09-25T17:10:00+05:30');

const SHARED = {
  awb: 'QP1047825963',
  orderId: '#ORD-58214',
  courierName: 'Delhivery',
  courierLogo: '/brands/delhivery.png',
  origin: 'Mumbai, Maharashtra',
  destination: 'Bengaluru, Karnataka',
  paymentMode: 'Prepaid' as const,
  weight: '0.85 kg',
  dimensions: '30 × 22 × 10 cm',
  items: [
    { name: 'Cotton Oversized T-Shirt — Olive / L', quantity: 1 },
    { name: 'Everyday Canvas Tote Bag', quantity: 2 },
  ],
};

function build(status: string, milestoneIndex: number, events: TrackingEvent[], eddISO: string, extra: Partial<BrandedTrackingData> = {}): BrandedTrackingData {
  return {
    ...SHARED,
    status,
    milestoneIndex,
    isException: false,
    estimatedDelivery: formatDateTime(eddISO).date,
    estimatedDeliveryISO: eddISO,
    events,
    milestoneEvents: buildMilestoneEvents(events),
    ...extra,
  };
}

export function getPreviewShipment(scenario: PreviewScenario): BrandedTrackingData {
  switch (scenario) {
    case 'outForDelivery':
      return build('Out for Delivery', 3, [OFD_EVENT, ...BASE_EVENTS], '2026-09-25T20:00:00+05:30');
    case 'delivered':
      return build('Delivered', 4, [DELIVERED_EVENT, OFD_EVENT, ...BASE_EVENTS], '2026-09-26T20:00:00+05:30', {
        deliveredOn: DELIVERED_EVENT.date,
        deliveredOnISO: DELIVERED_EVENT.timestamp,
      });
    case 'exception':
      return build('Undelivered', 3, [FAILED_EVENT, OFD_EVENT, ...BASE_EVENTS], '2026-09-26T20:00:00+05:30', { isException: true });
    default:
      return build('In Transit', 2, BASE_EVENTS, '2026-09-26T20:00:00+05:30');
  }
}
