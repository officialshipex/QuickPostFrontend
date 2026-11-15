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
  package_handling?: number;
  appointment_charge?: number;
  cod_charges?: number;
  rov?: number;
  rov_type?: string;
  fsc?: number;
  fsc_percent?: number | null;
  oda?: number;
  oda_label?: string;
  oda_distance_km?: number;
  green_tax?: number;
  min_billing_topup?: number;
  subtotal?: number;
  gst?: number;
  grand_total?: number;
  /** charges billed only if that event happens (appointment, floor delivery, …) — never in the total */
  if_applicable?: string[];
}

const money = (v: unknown) => `₹${Number(v || 0).toFixed(2)}`;

/** Price breakup rows of a B2B rate — shown the same everywhere (Cargo Ship Now and the Cargo rate calculator,
 *  same rows as ShipexFrontend's B2B courier selection). Every charge line is listed, ₹0 included. */
export const b2bBreakupRows = (w: B2BWorking = {}): [string, string][] => [
  ['Zone', w.zone || '—'],
  ['Chargeable Weight', `${w.billable_weight || 0} kg`],
  ['Freight / Kg', money(w.rate ?? 0)],
  ['Freight Charges', money(w.freight)],
  ['Docket (LR) Charges', money(w.docket_charges)],
  ['Pickup (FM) Charges', money(w.pickup_charge)],
  ['Handling Charges', money(w.handling_charge)],
  ['Package Handling', money(w.package_handling)],
  ['Appointment Charges', money(w.appointment_charge)],
  ['COD Charges', money(w.cod_charges)],
  [w.rov_type ? `ROV (${w.rov_type} Risk)` : 'ROV', money(w.rov)],
  [w.fsc_percent != null ? `FSC (${w.fsc_percent}%)` : 'FSC', money(w.fsc)],
  [`${w.oda_label || 'ODA'}${w.oda_distance_km != null ? ` · ${w.oda_distance_km} km` : ''}`, money(w.oda)],
  ['Green Tax', money(w.green_tax)],
  ['Min. Billing Top-up', money(w.min_billing_topup)],
  ['GST', money(w.gst)],
];

/** Charges billed only if that event happens — listed under the breakup, never added to the total. */
export const b2bIfApplicable = (w: B2BWorking = {}): string[] => (Array.isArray(w.if_applicable) ? w.if_applicable : []);
