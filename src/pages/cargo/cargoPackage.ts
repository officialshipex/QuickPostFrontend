/* Cargo package summary — boxes + weights, shown as:
     2 Boxes | 20 KG
     Weight: 20 KG
     Vol. Weight: 4.26 KG
   Field names cover the B2C shape today and the likely Cargo shape later (boxes count). */

export interface CargoPackage {
  boxes: number;
  total: number;   // chargeable / applicable weight
  dead: number;
  vol: number;
}

const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
export const kg = (v: number) => `${Number(v.toFixed(2))} KG`;
export const boxesLabel = (n: number) => `${n} ${n === 1 ? 'Box' : 'Boxes'}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toCargoPackage(pkg: any, order?: any): CargoPackage {
  const d = pkg?.volumetricWeight || {};
  const l = num(d.length), w = num(d.width ?? d.breadth), h = num(d.height);
  const vol = l && w && h ? (l * w * h) / 5000 : num(d.calculatedWeight);
  const dead = num(pkg?.deadWeight);
  const boxes = num(pkg?.boxes ?? pkg?.numberOfBoxes ?? pkg?.noOfBoxes ?? pkg?.totalBoxes ?? order?.boxes ?? order?.numberOfBoxes) || 1;
  const total = num(pkg?.applicableWeight) || Math.max(dead, vol);
  return { boxes, total, dead, vol };
}

/** Package summary of a whole order. B2B (Cargo) orders carry their boxes in B2BPackageDetails.packages
    (boxes × weight per box, L×W×H per box); anything else falls back to the B2C packageDetails shape. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function orderCargoPackage(order: any): CargoPackage {
  const b2b = order?.B2BPackageDetails;
  const rows: any[] = Array.isArray(b2b?.packages) ? b2b.packages : []; // eslint-disable-line @typescript-eslint/no-explicit-any
  if (order?.orderType !== 'B2B' && rows.length === 0) return toCargoPackage(order?.packageDetails, order);
  let boxes = 0, dead = 0, vol = 0;
  for (const p of rows) {
    const n = num(p.noOfBox);
    boxes += n;
    dead += n * num(p.weightPerBox);
    vol += n * (num(p.length) * num(p.width) * num(p.height)) / 5000;
  }
  return {
    boxes: boxes || 1,
    total: num(b2b?.applicableWeight) || Math.max(dead, vol),
    dead,
    vol: num(b2b?.volumetricWeight) || vol,
  };
}
