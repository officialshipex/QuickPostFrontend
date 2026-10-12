import { boxesLabel, kg, type CargoPackage } from './cargoPackage';

/* Table-cell package block for Cargo listings (Orders / NDR / Weight Discrepancy). */
export function CargoPackageInfo({ pkg, className = 'text-[12px] leading-[18px] font-normal text-[#1E293B]' }: { pkg: CargoPackage; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 whitespace-nowrap ${className}`}>
      <div>{boxesLabel(pkg.boxes)} | {kg(pkg.total)}</div>
      <div>Weight: {kg(pkg.dead)}</div>
      <div>Vol. Weight: {kg(pkg.vol)}</div>
    </div>
  );
}
