import { useEffect, useRef } from 'react';
import { apiClient } from '../../../services/apiClient';

/* Unfinished KYC forms are kept on the server (backend kyc/kycDraft.js), so someone can leave and continue later,
   on any device. Seller KYC and sales KYC use the same endpoints under different addresses. */
export const SELLER_DRAFT_URL = '/merchant/verfication/manual-kyc/draft';
export const SALES_DRAFT_URL = '/sales/kyc/draft';

export interface DraftDocument { name: string; size: number; url?: string | null }
export interface KycDraft {
  method: 'ekyc' | 'manual' | null;
  common: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  ekyc: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  manual: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  documents: Record<string, DraftDocument>;
}

export const loadDraft = async (url: string): Promise<KycDraft | null> => {
  try {
    return (await apiClient.get(url)).data?.draft ?? null;
  } catch {
    return null; // the form simply starts empty
  }
};

/** Uploads one document straight away; the final submit then uses it without sending it again. */
export const uploadDraftDocument = async (url: string, field: string, file: File): Promise<DraftDocument> => {
  const fd = new FormData();
  fd.append(field, file);
  const res = await apiClient.post(`${url}/document/${field}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data.document;
};

export const removeDraftDocument = (url: string, field: string) => apiClient.post(`${url}/document/${field}/remove`);

/** Saves `payload` shortly after it stops changing, and on leaving the form. Off until `enabled` (the draft has loaded). */
export function useDraftAutosave(url: string, payload: object, enabled: boolean) {
  const json = JSON.stringify(payload);
  const unsaved = useRef<string | null>(null);
  const lastSaved = useRef<string | null>(null);
  const urlRef = useRef(url);
  urlRef.current = url;

  const flush = () => {
    if (unsaved.current === null) return;
    const body = unsaved.current;
    unsaved.current = null;
    lastSaved.current = body;
    // A refusal (KYC just submitted) or a passing network error only costs the latest keystrokes.
    apiClient.post(urlRef.current, JSON.parse(body)).catch(() => undefined);
  };

  useEffect(() => {
    if (!enabled) { unsaved.current = null; return; }
    if (json === lastSaved.current) return;
    unsaved.current = json;
    const timer = setTimeout(flush, 700);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [json, enabled]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => flush, []);
}
