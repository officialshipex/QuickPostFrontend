/* Pickup & Manifest — shared "has this manifest been picked up?" rule and ageing count.
   Ageing only means something while orders are still waiting for the courier, so once every
   live (non-cancelled) order is picked the pages show "Picked" instead of "Nd pending/overdue". */

/** Order statuses that mean the courier has not picked the shipment up yet. */
export const NOT_PICKED_STATUSES = ['new', 'New', 'Ready To Ship', 'Cancelled'];

export const isOrderPicked = (status?: string) => !NOT_PICKED_STATUSES.includes(status || 'new');

export type ManifestPickupState = 'picked' | 'cancelled' | 'waiting';

/** picked = every non-cancelled order is picked; cancelled = every order cancelled; else waiting. */
export const manifestPickupState = (orders: Array<{ status?: string }>): ManifestPickupState => {
  const live = (orders || []).filter(o => o && o.status !== 'Cancelled');
  if (!orders?.length) return 'waiting';
  if (!live.length) return 'cancelled';
  return live.every(o => isOrderPicked(o.status)) ? 'picked' : 'waiting';
};

/** Days since the manifest was created, Sundays not counted. */
export const calcAgeingDays = (dateStr: string) => {
  const start = new Date(dateStr); start.setHours(0, 0, 0, 0);
  const end   = new Date();        end.setHours(0, 0, 0, 0);
  let count = 0; const cur = new Date(start);
  while (cur < end) { if (cur.getDay() !== 0) count++; cur.setDate(cur.getDate() + 1); }
  return count;
};
