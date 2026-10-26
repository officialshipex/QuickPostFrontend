import { PDFDocument } from 'pdf-lib';

// Bulk label download: fetch each order's label PDF and combine them into one file.
//
// The layout follows each LABEL, not the person downloading: the backend draws a thermal label on a 4"×6" page
// (288 × 432 pt) and an A4 label on an A4 page, according to the order owner's printer setting. So:
//   4"×6" label  -> one label per 4"×6" page (a thermal printer prints one label per sheet)
//   A4 label     -> a full A4 page when only 1–2 labels are downloaded, otherwise four per A4 page (2×2)
// This stays right when an admin downloads a seller's labels, and when one selection mixes sellers with different
// printers. Cargo (B2B) label PDFs are already laid out by the backend: pass `asIs` to append their pages unchanged.

const A4_W = 595;
const A4_H = 842;

/** A page no bigger than a 4"×6" label (with a little tolerance) is a thermal label. */
export const isThermalLabelPage = (width: number, height: number) => width <= 320 && height <= 480;

export async function buildBulkLabelPdf(
  urls: string[],
  headers: Record<string, string>,
  opts: { asIs?: boolean } = {},
): Promise<Uint8Array> {
  const merged = await PDFDocument.create();

  // fetch every label first, so the A4 layout knows how many A4 labels there are in total
  const pages: Awaited<ReturnType<typeof merged.copyPages>> = [];
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) continue;
      const src = await PDFDocument.load(await (await res.blob()).arrayBuffer());
      pages.push(...(await merged.copyPages(src, src.getPageIndices())));
    } catch (e) {
      console.error(`Label fetch failed for ${url}`, e);
    }
  }
  if (pages.length === 0) throw new Error('No labels available');

  if (opts.asIs) {
    pages.forEach((p) => merged.addPage(p));
    return merged.save();
  }

  const a4Total = pages.filter((p) => !isThermalLabelPage(p.getWidth(), p.getHeight())).length;
  const cellW = A4_W / 2;
  const cellH = A4_H / 2;
  let a4Count = 0;
  let gridPage: ReturnType<typeof merged.addPage> | null = null;

  for (const page of pages) {
    if (isThermalLabelPage(page.getWidth(), page.getHeight())) {
      merged.addPage(page); // its own 4"×6" page, as generated
      continue;
    }
    const embedded = await merged.embedPage(page);
    if (a4Total <= 2) {
      merged.addPage([A4_W, A4_H]).drawPage(embedded, { x: 0, y: 0, width: A4_W, height: A4_H });
    } else {
      if (a4Count % 4 === 0) gridPage = merged.addPage([A4_W, A4_H]);
      const x = (a4Count % 2) * cellW;
      const y = A4_H - ((Math.floor(a4Count / 2) % 2) + 1) * cellH;
      gridPage!.drawPage(embedded, { x, y, width: cellW, height: cellH });
      a4Count++;
    }
  }
  return merged.save();
}
