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
