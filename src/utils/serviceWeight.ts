/**
 * The weight slab written in a courier service's name, in kg — only a number that carries a unit counts:
 *   "Delhivery 250GM" → 0.25   "Delhivery 0.25KG" → 0.25   "Bluedart 2.5 Kg" → 2.5   "Ekart 500 gms" → 0.5
 *   "DelhiveryJF 500" → null (a bare number is part of the name, not a weight)
 * When a name has several, the last one wins ("Ekart 2 Day 1KG" → 1). Display only: charges come from the rate card.
 */
const WEIGHT_IN_NAME = /(\d+(?:\.\d+)?)\s*(kilograms?|kilos?|kgs?|grams?|gms?|g)(?![a-z])/gi;

export function serviceWeightKg(serviceName?: string | null): number | null {
  const matches = [...String(serviceName || '').matchAll(WEIGHT_IN_NAME)];
  const last = matches[matches.length - 1];
  if (!last) return null;
  const value = parseFloat(last[1]);
  const kg = /^k/i.test(last[2]) ? value : value / 1000;
  return kg > 0 ? kg : null;
}

/** Weight the service charges for: its slab from the name, or the parcel's applicable weight if that is higher. */
export function chargeableWeightKg(serviceName: string | null | undefined, applicableWeight: number): number {
  const slab = serviceWeightKg(serviceName);
  const actual = Number(applicableWeight) || 0;
  return slab !== null && slab > actual ? slab : actual;
}

/** 0.25 → "0.25 kg", 1 → "1 kg", 0.333333 → "0.333 kg" */
export const formatKg = (kg: number) => `${Number((Number(kg) || 0).toFixed(3))} kg`;
