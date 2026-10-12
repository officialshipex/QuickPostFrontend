// Static sample renderings of the two shipping-label designs a company can be given
// (backend: label/printLabel.controller.js = classic, label/printLabelCopy1.controller.js = modern).
// Sample data only -- a sketch of the layout, not the real PDF.

export type LabelTemplate = 'classic' | 'modern';

function Bars({ h = 28, w = 120 }: { h?: number; w?: number }) {
  const widths = [2, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 2, 3, 1, 1, 2, 1, 3, 2, 1, 2, 1, 3, 1, 2];
  let x = 0;
  return (
    <svg viewBox={`0 0 ${widths.reduce((a, b) => a + b * 2, 0)} ${h}`} width={w} height={h} preserveAspectRatio="none" className="block">
      {widths.map((bw, i) => {
        const rect = <rect key={i} x={x} y={0} width={bw} height={h} fill="#0F172A" />;
        x += bw * 2;
        return rect;
      })}
    </svg>
  );
}

const SAMPLE_ROW = ['SKU001', 'Sample Product', '6204', '1', '499', '499'];
const HEADERS = ['SKU', 'Item Name', 'HSN', 'Qty.', 'Unit Price', 'Total'];

function Table() {
  return (
    <table className="w-full border-collapse text-[9px]">
      <thead>
        <tr className="bg-[#F1F5F9]">{HEADERS.map((h) => <th key={h} className="border border-[#94A3B8] px-1 py-0.5 text-left">{h}</th>)}</tr>
      </thead>
      <tbody>
        <tr>{SAMPLE_ROW.map((c, i) => <td key={i} className="border border-[#94A3B8] px-1 py-0.5">{c}</td>)}</tr>
      </tbody>
    </table>
  );
}

export function ClassicLabelPreview() {
  return (
    <div className="bg-white border border-[#0F172A] p-3 text-[9px] leading-snug text-[#1E293B]">
      <div className="flex justify-between gap-2">
        <div>
          <p className="font-bold">To:</p>
          <p>narinder kaur</p>
          <p>block c 14/2 new govind pura, near gandhi park</p>
          <p>East Delhi, DELHI, 110051</p>
          <p>MOBILE NO: 9718794406</p>
        </div>
        <div className="w-10 h-8 border border-dashed border-[#94A3B8] text-[7px] text-center text-[#94A3B8] flex items-center justify-center shrink-0">logo</div>
      </div>
      <div className="border-t border-[#0F172A] my-2" />
      <div className="flex justify-between items-center">
        <div>
          <p><b>Order Date:</b> Mar 7, 2025</p>
          <p><b>Invoice No:</b> 843987</p>
          <p><b>GSTIN No:</b> 22XXXXX0000SHI</p>
        </div>
        <div className="text-center"><Bars w={80} /><p className="text-[8px]">1234ABCD</p></div>
      </div>
      <div className="border-t border-[#0F172A] my-2" />
      <div className="flex justify-between items-center">
        <div>
          <p><b>MODE:</b> PREPAID</p>
          <p><b>AMOUNT:</b> 499</p>
          <p>WEIGHT: 0.4</p>
          <p>Dimensions (cm): 10*10*10</p>
        </div>
        <div className="text-center"><p className="font-bold">COURIER</p><Bars w={90} /><p className="text-[8px]">35973710008735</p></div>
      </div>
      <div className="mt-2"><Table /></div>
      <div className="mt-2">
        <p className="font-bold">Pickup Address:</p>
        <p>Ajeet Kumar, Sirsa, HARYANA, 125055</p>
        <p className="font-bold mt-1">Return Address:</p>
        <p>Ajeet Kumar, Sirsa, HARYANA, 125055</p>
      </div>
      <div className="border-t border-[#0F172A] mt-2 pt-1 text-[8px]">This is a computer-generated document, hence does not require a signature.</div>
    </div>
  );
}

export function ModernLabelPreview() {
  return (
    <div className="bg-white border border-[#0F172A] p-3 text-[9px] leading-snug text-[#1E293B]">
      <div className="flex justify-between items-start gap-2">
        <p className="text-[12px] font-bold">Brand Store</p>
        <div className="w-10 h-6 border border-dashed border-[#94A3B8] text-[7px] text-center text-[#94A3B8] flex items-center justify-center shrink-0">logo</div>
      </div>
      <div className="border-t border-[#0F172A] my-2" />
      <div className="flex justify-between items-baseline">
        <p className="text-[12px] font-bold">AWB# 35973710008735</p>
        <p className="text-[8px] font-bold">COURIER</p>
      </div>
      <div className="my-1 flex justify-center"><Bars w={160} h={34} /></div>
      <div className="flex justify-between text-[8px]"><span>110051</span><span>AWB# 35973710008735</span><span>East Delhi</span></div>
      <div className="border-t border-[#0F172A] my-2" />
      <div className="grid grid-cols-[1.5fr_1fr] divide-x divide-[#0F172A]">
        <div className="pr-2">
          <p className="font-bold text-[10px]">Ship to - narinder kaur</p>
          <p>block c 14/2 new govind pura, near gandhi park</p>
          <p className="font-bold">East Delhi (DELHI)</p>
          <p className="font-bold">PIN - 110051</p>
          <p className="text-[8px]">MOBILE NO: 9718794406</p>
        </div>
        <div className="pl-2">
          <p className="text-[12px] font-bold">PREPAID</p>
          <p className="text-[12px] font-bold">INR 499</p>
          <p className="text-[8px] font-bold">Date</p>
          <p className="text-[8px]">Mar 7, 2025 | 3:42 PM</p>
          <p className="text-[8px]">WEIGHT: 0.4 kg</p>
          <p className="text-[8px]">DIMS (cm): 10x10x10</p>
        </div>
      </div>
      <div className="border-t border-[#0F172A] my-2" />
      <div className="grid grid-cols-[1.5fr_1fr] divide-x divide-[#0F172A]">
        <div className="pr-2">
          <p><b>Seller:</b> Brand Store</p>
          <p className="text-[8px]">GSTIN: 22XXXXX0000SHI</p>
        </div>
        <div className="pl-2 text-center"><p className="text-[8px] font-bold">#1234ABCD</p><Bars w={70} h={20} /></div>
      </div>
      <div className="border-t border-[#0F172A] my-2" />
      <Table />
      <div className="mt-2">
        <p className="font-bold">Pickup Address:</p>
        <p>Ajeet Kumar, Sirsa, HARYANA, 125055</p>
        <p className="font-bold mt-1">Return Address:</p>
        <p>Ajeet Kumar, Sirsa, HARYANA, 125055</p>
      </div>
      <div className="border-t border-[#0F172A] mt-2 pt-1 text-[8px]">This is a computer-generated document, hence does not require a signature.</div>
    </div>
  );
}
