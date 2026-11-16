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

/** Price breakup rows of a B2B rate — shown the same everywhere (Cargo Ship Now, the rate calculators, the order
 *  page; same rows as ShipexFrontend's utils/b2bPriceBreakup.js). Every charged line is listed, so the rows add up
 *  to the total. Core rows always show; optional charges (handling, package handling, appointment, COD, green tax,
 *  min. LR billing top-up) only when they are charged, so ₹0 lines don't look like double charges. */
export const b2bBreakupRows = (w: B2BWorking = {}): [string, string][] => {
  const rows: [string, string, boolean][] = [
    // [label, value, always shown]
    ['Zone', w.zone || '—', true],
    ['Chargeable Weight', `${w.billable_weight || 0} kg`, true],
    ['Freight / Kg', money(w.rate ?? 0), true],
    ['Freight Charges', money(w.freight), true],
    [w.fsc_percent != null ? `Fuel Surcharge (FSC ${w.fsc_percent}%)` : 'Fuel Surcharge (FSC)', money(w.fsc), true],
    ['Docket (LR) Charges', money(w.docket_charges), true],
    ['Pickup (FM) Charges', money(w.pickup_charge), true],
    [w.rov_type ? `ROV (${w.rov_type} Risk)` : 'ROV', money(w.rov), true],
    [`${w.oda_label || 'ODA'}${w.oda_distance_km != null ? ` · ${w.oda_distance_km} km` : ''}`, money(w.oda), true],
    ['Handling Charges (per shipment)', money(w.handling_charge), false],
    ['Package Handling (per box)', money(w.package_handling), false],
    ['Appointment Charges', money(w.appointment_charge), false],
    ['COD Charges', money(w.cod_charges), false],
    ['Green Tax', money(w.green_tax), false],
    ['Min. LR Billing Top-up', money(w.min_billing_topup), false],
    ['GST', money(w.gst), true],
  ];
  const amountOf: Record<string, unknown> = {
    'Handling Charges (per shipment)': w.handling_charge,
    'Package Handling (per box)': w.package_handling,
    'Appointment Charges': w.appointment_charge,
    'COD Charges': w.cod_charges,
    'Green Tax': w.green_tax,
    'Min. LR Billing Top-up': w.min_billing_topup,
  };
  return rows.filter(([label, , always]) => always || Number(amountOf[label] || 0) !== 0).map(([l, v]) => [l, v]);
};

/** Charges billed only if that event happens — listed under the breakup, never added to the total. */
export const b2bIfApplicable = (w: B2BWorking = {}): string[] => (Array.isArray(w.if_applicable) ? w.if_applicable : []);
