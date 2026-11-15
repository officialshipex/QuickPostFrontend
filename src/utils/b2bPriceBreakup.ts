/** One B2B rate's computation, as the backend returns it (rates[].working) — B2B/utils/b2bRateEngine.js
 *  calculateB2BCargoRate, the same numbers the booking charges. */
export interface B2BWorking {
  zone?: string;
  billable_weight?: number;
  rate?: number;
  freight?: number;
  docket_charges?: number;
  pickup_charge?: number;
  handling_charge?: number;
  appointment_charge?: number;
  cod_charges?: number;
  rov?: number;
  fsc?: number;
  fsc_percent?: number | null;
  oda?: number;
  green_tax?: number;
  subtotal?: number;
  gst?: number;
  grand_total?: number;
}

const money = (v: unknown) => `₹${Number(v || 0).toFixed(2)}`;

/** Price breakup rows of a B2B rate — shown the same everywhere (Cargo Ship Now and the Cargo rate calculator,
 *  same rows as ShipexFrontend's B2B courier selection). */
export const b2bBreakupRows = (w: B2BWorking = {}): [string, string][] => [
  ['Zone', w.zone || '—'],
  ['Chargeable Weight', `${w.billable_weight || 0} kg`],
  ['Freight / Kg', money(w.rate ?? 0)],
  ['Freight Charges', money(w.freight)],
  ['Docket Charges', money(w.docket_charges)],
  ['Pickup Charges', money(w.pickup_charge)],
  ['Handling Charges', money(w.handling_charge)],
  ['Appointment Charges', money(w.appointment_charge)],
  ['COD Charges', money(w.cod_charges)],
  ['ROV', money(w.rov)],
  [w.fsc_percent != null ? `FSC (${w.fsc_percent}%)` : 'FSC', money(w.fsc)],
  ['ODA', money(w.oda)],
  ['Green Tax', money(w.green_tax)],
  ['GST', money(w.gst)],
];
