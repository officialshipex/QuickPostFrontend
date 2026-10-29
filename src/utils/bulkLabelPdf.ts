import { PDFDocument } from 'pdf-lib';
import { startDownloadProgress } from './downloadProgress';

// Bulk label / invoice download: combine many orders' PDFs into one file.
//
// The layout follows each LABEL, not the person downloading: the backend draws a thermal label on a 4"×6" page
// (288 × 432 pt) and an A4 label on an A4 page, according to the order owner's printer setting. So:
//   4"×6" label  -> one label per 4"×6" page (a thermal printer prints one label per sheet)
//   A4 label     -> a full A4 page when only 1–2 labels are downloaded, otherwise four per A4 page (2×2)
// This stays right when an admin downloads a seller's labels, and when one selection mixes sellers with different
// printers. Cargo (B2B) label PDFs are already laid out by the backend: pass `asIs` to append their pages unchanged.
//
// The PDFs come from the backend's bulk endpoints in batches (POST { orderIds }, one merged PDF per batch).
// Fetching one PDF per order fired 400–1000 requests for a 200–500 order selection, hit the backend's
// per-minute rate limit and failed the download; 50 per request keeps any selection to a few requests.

const A4_W = 595;
const A4_H = 842;
const BULK_PDF_BATCH = 50;

export const BULK_PDF_PATHS = {
  labels: '/printlabel/bulk-pdf',
  invoices: '/printinvoice/bulk-pdf',
  b2bLabels: '/b2b/bulk-label-pdf',
} as const;

/** A page no bigger than a 4"×6" label (with a little tolerance) is a thermal label. */
export const isThermalLabelPage = (width: number, height: number) => width <= 320 && height <= 480;

type CopiedPages = Awaited<ReturnType<PDFDocument['copyPages']>>;

/** The merged PDF and how many of the requested orders could not be generated (skipped). */
export type BulkPdfResult = { bytes: Uint8Array; failed: number };

// Fetch every order's PDF pages from a bulk endpoint, BULK_PDF_BATCH orders per request.
async function fetchBulkPages(
  merged: PDFDocument,
  backendBase: string,
  path: string,
  orderIds: string[],
  headers: Record<string, string>,
  onProgress?: (done: number) => void,
): Promise<{ pages: CopiedPages; failed: number }> {
  const pages: CopiedPages = [];
  let failed = 0;
  for (let i = 0; i < orderIds.length; i += BULK_PDF_BATCH) {
    onProgress?.(i);
    const batch = orderIds.slice(i, i + BULK_PDF_BATCH);
    try {
      const res = await fetch(`${backendBase}${path}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: batch }),
      });
      if (!res.ok) { failed += batch.length; continue; }
      failed += Number(res.headers.get('X-Failed-Count')) || 0;
      const src = await PDFDocument.load(await res.arrayBuffer());
      pages.push(...(await merged.copyPages(src, src.getPageIndices())));
    } catch (e) {
      console.error(`Bulk PDF batch failed (${path})`, e);
      failed += batch.length;
    }
  }
  onProgress?.(orderIds.length);
  return { pages, failed };
}

// Lay label pages out (thermal: own page; A4: full page for 1–2, else 2×2) — or append as-is
async function layoutLabels(merged: PDFDocument, pages: CopiedPages, asIs: boolean) {
  if (asIs) {
    pages.forEach((p) => merged.addPage(p));
    return;
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
}

/** Labels for these orders as one PDF: B2C labels laid out as above, Cargo (`b2b`) box labels as generated. */
export async function buildBulkLabelPdf(
  backendBase: string,
  orderIds: string[],
  headers: Record<string, string>,
  opts: { b2b?: boolean; onProgress?: (done: number) => void } = {},
): Promise<BulkPdfResult> {
  const merged = await PDFDocument.create();
  const path = opts.b2b ? BULK_PDF_PATHS.b2bLabels : BULK_PDF_PATHS.labels;
  const { pages, failed } = await fetchBulkPages(merged, backendBase, path, orderIds, headers, opts.onProgress);
  if (pages.length === 0) throw new Error('No labels available');
  await layoutLabels(merged, pages, !!opts.b2b);
  return { bytes: await merged.save(), failed };
}

/** Save a built PDF as a download. */
export function downloadPdf(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  window.URL.revokeObjectURL(url);
}

/** "N of M <what> downloaded…" when some orders were skipped, else null. */
export const bulkSkippedMessage = (what: string, requested: number, failed: number) =>
  failed > 0 ? `${requested - failed} of ${requested} ${what} downloaded; ${failed} order(s) could not be generated.` : null;

/**
 * A bulk label / invoice download with the on-screen progress card (utils/downloadProgress.ts), which stays
 * until the file is ready — the action menu that started it closes right away.
 */
export async function downloadBulkPdfWithProgress(
  what: 'labels' | 'invoices',
  build: (onProgress: (done: number) => void) => Promise<BulkPdfResult>,
  requested: number,
  filename: string,
) {
  const progress = startDownloadProgress(what, requested);
  try {
    const { bytes, failed } = await build(progress.update);
    downloadPdf(bytes, filename);
    if (failed > 0) {
      progress.finish('info', `${requested - failed} of ${requested} ${what} downloaded`, `${failed} order(s) could not be generated.`);
    } else {
      progress.finish('success', `${requested} ${what} downloaded`);
    }
  } catch (e) {
    console.error(`Bulk ${what} download failed`, e);
    progress.finish('error', `Failed to download ${what}`, 'Please try again.');
  }
}

/** Invoices for these orders as one PDF, one after another. */
export async function buildBulkInvoicePdf(
  backendBase: string,
  orderIds: string[],
  headers: Record<string, string>,
  opts: { onProgress?: (done: number) => void } = {},
): Promise<BulkPdfResult> {
  const merged = await PDFDocument.create();
  const { pages, failed } = await fetchBulkPages(merged, backendBase, BULK_PDF_PATHS.invoices, orderIds, headers, opts.onProgress);
  if (pages.length === 0) throw new Error('No invoices available');
  pages.forEach((p) => merged.addPage(p));
  return { bytes: await merged.save(), failed };
}
