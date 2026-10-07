import { useCallback, useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';
import { TableLoader } from '../../components/ui/TableLoader';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, FileText, Search, X, XCircle } from 'lucide-react';

type ReviewStatus = 'pending' | 'approved' | 'rejected';

interface ReviewRow {
  _id: string;
  status: ReviewStatus;
  businessType: 'individual' | 'company';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  panName?: string;
  user: { _id: string; fullname?: string; email?: string; phoneNumber?: string; userId?: number } | null;
}

interface ReviewDetail {
  _id: string;
  status: ReviewStatus;
  businessType: 'individual' | 'company';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  user: { fullname?: string; email?: string; phoneNumber?: string; userId?: number } | null;
  email?: string;
  phoneNumber?: string;
  billing?: { address?: string; pincode?: string; city?: string; state?: string };
  gst: { number?: string } | null;
  pan: { number?: string; name?: string; date?: string };
  aadhaar: { number?: string; name?: string; guardianName?: string; dob?: string; address?: string; pincode?: string; city?: string; state?: string };
  bank: { holderName?: string; accountNumber?: string; ifsc?: string; bankName?: string; branch?: string; accountType?: string; proofType?: string };
  documents: Record<'gstCertificate' | 'panCard' | 'aadhaarFront' | 'aadhaarBack' | 'bankProof', string | null>;
  documentLinksExpireInMinutes: number;
}

const TABS: { id: ReviewStatus; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];
const PAGE_SIZE = 20;

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
const isImageUrl = (url: string) => /\.(png|jpe?g)(\?|$)/i.test(url);

function Field({ label, value, wide }: { label: string; value?: string | null; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide">{label}</p>
      <p className="text-[13px] font-medium text-[#0F172A] break-words">{value || '—'}</p>
    </div>
  );
}

function Doc({ label, url }: { label: string; url: string | null }) {
  if (!url) return null;
  return (
    <div className="rounded-xl border border-[#E2E8F0] p-2.5">
      <p className="text-[11px] font-semibold text-[#64748B] mb-1.5">{label}</p>
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        {isImageUrl(url) ? (
          <img src={url} alt={label} className="w-full h-36 object-contain rounded-lg bg-[#F8FAFC]" />
        ) : (
          <div className="w-full h-36 rounded-lg bg-[#F8FAFC] flex flex-col items-center justify-center gap-1.5 text-[#64748B]">
            <FileText className="w-7 h-7 text-[#DC2626]" />
            <span className="text-[12px] font-semibold">Open PDF</span>
          </div>
        )}
      </a>
      <a href={url} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#00A86B] hover:underline">
        Open full size <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[#E2E8F0] p-4">
      <h3 className="text-[13px] font-bold text-[#0F172A] mb-3">{title}</h3>
      {children}
    </section>
  );
}

export function AdminKycReview() {
  const { toast, showToast, closeToast } = useToast();
  const [status, setStatus] = useState<ReviewStatus>('pending');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ReviewDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/kyc-review', { params: { status, search: appliedSearch, page, limit: PAGE_SIZE } });
      setRows(res.data.items || []);
      setTotal(res.data.total || 0);
      setCounts(res.data.counts || { pending: 0, approved: 0, rejected: 0 });
    } catch (err) {
      setRows([]);
      showToast('error', errorMessage(err, 'Could not load KYC requests'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, appliedSearch, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!openId) { setDetail(null); return; }
    let cancelled = false;
    setDetailLoading(true);
    setRejecting(false);
    setReason('');
    apiClient.get(`/kyc-review/${openId}`)
      .then((res) => { if (!cancelled) setDetail(res.data.data); })
      .catch((err) => { if (!cancelled) { showToast('error', errorMessage(err, 'Could not open this request')); setOpenId(null); } })
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId]);

  const closeDetail = () => { if (!acting) setOpenId(null); };

  const decide = async (action: 'approve' | 'reject') => {
    if (!detail || acting) return;
    if (action === 'reject' && reason.trim().length < 3) {
      showToast('error', 'Enter the reason for rejecting, so the seller knows what to fix.');
      return;
    }
    setActing(true);
    try {
      const res = await apiClient.post(`/kyc-review/${detail._id}/${action}`, action === 'reject' ? { reason: reason.trim() } : {});
      showToast('success', res.data?.message || (action === 'approve' ? 'KYC approved.' : 'KYC rejected.'));
      setOpenId(null);
      load();
    } catch (err) {
      showToast('error', errorMessage(err, 'Could not save your decision. Please try again.'));
      // A 409 means someone else decided first: refresh the list so it shows the current state.
      if ((err as { response?: { status?: number } })?.response?.status === 409) { setOpenId(null); load(); }
    } finally {
      setActing(false);
    }
  };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminLayout>
      <div className="mx-2 text-[#0F172A] pb-16">
        <h1 className="text-lg md:text-xl font-bold mb-1">KYC Review</h1>
        <p className="text-[12.5px] text-[#64748B] mb-4 md:mb-5">Manual KYC requests uploaded by sellers. Open one to check the documents against the details, then approve or reject it.</p>

        <div className="bg-white rounded-xl md:rounded-2xl shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)]">
          <div className="px-4 md:px-6 pt-3 border-b border-[#F1F5F9] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex gap-1 overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setStatus(t.id); setPage(1); }}
                  className={`px-3.5 py-2.5 text-[13px] font-bold whitespace-nowrap border-b-2 transition-colors ${status === t.id ? 'border-[#00A86B] text-[#00A86B]' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'}`}
                >
                  {t.label} <span className="ml-1 text-[11px] font-semibold text-[#94A3B8]">{counts[t.id]}</span>
                </button>
              ))}
            </div>
            <form
              className="relative mb-2 md:mb-0 md:w-72"
              onSubmit={(e) => { e.preventDefault(); setPage(1); setAppliedSearch(search.trim()); }}
            >
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); if (!e.target.value.trim() && appliedSearch) { setPage(1); setAppliedSearch(''); } }}
                placeholder="Search name, email, phone or user ID"
                className="w-full h-9 pl-9 pr-3 rounded-full border border-[#E2E8F0] text-[12.5px] focus:outline-none focus:border-[#00A86B]"
              />
            </form>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center"><TableLoader /></div>
          ) : rows.length === 0 ? (
            <p className="py-16 text-center text-[13px] text-[#94A3B8]">
              {appliedSearch ? 'No requests match your search.' : `No ${status} KYC requests.`}
            </p>
          ) : (
            <ul className="divide-y divide-[#F1F5F9]">
              {rows.map((r) => (
                <li key={r._id}>
                  <button type="button" onClick={() => setOpenId(r._id)} className="w-full text-left px-4 md:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 hover:bg-[#F8FAFC] transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-bold truncate">{r.user?.fullname || 'Unknown seller'} <span className="text-[11px] font-semibold text-[#94A3B8]">{r.user?.userId ? `#${r.user.userId}` : ''}</span></p>
                      <p className="text-[12px] text-[#64748B] truncate">{r.user?.email} · {r.user?.phoneNumber}</p>
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wide text-[#475569] bg-[#F1F5F9] px-2 py-0.5 rounded self-start sm:self-auto">{r.businessType}</span>
                    <div className="text-[12px] text-[#64748B] sm:text-right sm:w-40">
                      <p>Submitted {fmtDate(r.submittedAt)}</p>
                      {r.status !== 'pending' && <p className="text-[11px]">{r.status === 'approved' ? 'Approved' : 'Rejected'} {fmtDate(r.reviewedAt)}</p>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {total > PAGE_SIZE && (
            <div className="px-4 md:px-6 py-3 border-t border-[#F1F5F9] flex items-center justify-between text-[12px] text-[#64748B]">
              <span>Page {page} of {pages}</span>
              <div className="flex gap-2">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-8 w-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                <button type="button" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="h-8 w-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {openId && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={closeDetail} />
          <div className="relative w-full max-w-3xl bg-white h-full overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 bg-white border-b border-[#F1F5F9] px-4 md:px-6 py-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[15px] font-bold truncate">{detail?.user?.fullname || 'KYC request'}</h2>
                {detail && <p className="text-[12px] text-[#64748B] truncate">{detail.user?.email} · {detail.user?.phoneNumber}</p>}
              </div>
              <button type="button" onClick={closeDetail} aria-label="Close" className="h-8 w-8 rounded-lg hover:bg-[#F1F5F9] flex items-center justify-center shrink-0"><X className="w-4 h-4" /></button>
            </div>

            {detailLoading || !detail ? (
              <div className="py-24 flex justify-center"><TableLoader /></div>
            ) : (
              <div className="p-4 md:p-6 space-y-4">
                {detail.status === 'rejected' && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] text-red-700">
                    <p className="font-bold">Rejected {fmtDate(detail.reviewedAt)}{detail.reviewedBy ? ` by ${detail.reviewedBy}` : ''}</p>
                    <p className="mt-0.5 break-words">Reason: {detail.rejectionReason}</p>
                  </div>
                )}
                {detail.status === 'approved' && (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-[12.5px] text-green-700 font-bold">
                    Approved {fmtDate(detail.reviewedAt)}{detail.reviewedBy ? ` by ${detail.reviewedBy}` : ''}
                  </div>
                )}

                <Section title="Business">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Type" value={detail.businessType === 'company' ? 'Company' : 'Individual'} />
                    <Field label="Submitted" value={fmtDate(detail.submittedAt)} />
                    <Field label="Email" value={detail.email} />
                    <Field label="Phone" value={detail.phoneNumber} />
                    {detail.gst?.number && <Field label="GSTIN" value={detail.gst.number} />}
                    <Field label="Billing address" value={[detail.billing?.address, detail.billing?.city, detail.billing?.state, detail.billing?.pincode].filter(Boolean).join(', ')} wide />
                  </div>
                  {detail.documents.gstCertificate && <div className="mt-3 max-w-xs"><Doc label="GST certificate" url={detail.documents.gstCertificate} /></div>}
                </Section>

                <Section title="PAN">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="PAN number" value={detail.pan.number} />
                    <Field label="Name on PAN" value={detail.pan.name} />
                    <Field label={detail.businessType === 'company' ? 'Date of incorporation' : 'Date of birth'} value={fmtDate(detail.pan.date)} />
                  </div>
                  <div className="mt-3 max-w-xs"><Doc label="PAN card" url={detail.documents.panCard} /></div>
                </Section>

                <Section title="Aadhaar">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Aadhaar number" value={detail.aadhaar.number} />
                    <Field label="Name" value={detail.aadhaar.name} />
                    <Field label="Guardian name" value={detail.aadhaar.guardianName} />
                    <Field label="Date of birth" value={fmtDate(detail.aadhaar.dob)} />
                    <Field label="Address" value={[detail.aadhaar.address, detail.aadhaar.city, detail.aadhaar.state, detail.aadhaar.pincode].filter(Boolean).join(', ')} wide />
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Doc label="Aadhaar front" url={detail.documents.aadhaarFront} />
                    <Doc label="Aadhaar back" url={detail.documents.aadhaarBack} />
                  </div>
                </Section>

                <Section title="Bank account">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Account holder" value={detail.bank.holderName} />
                    <Field label="Account number" value={detail.bank.accountNumber} />
                    <Field label="IFSC" value={detail.bank.ifsc} />
                    <Field label="Bank / branch" value={[detail.bank.bankName, detail.bank.branch].filter(Boolean).join(' · ')} />
                    <Field label="Account type" value={detail.bank.accountType} />
                    <Field label="Proof" value={detail.bank.proofType === 'cheque' ? 'Cancelled cheque' : 'Bank statement'} />
                  </div>
                  <div className="mt-3 max-w-xs"><Doc label="Bank proof" url={detail.documents.bankProof} /></div>
                </Section>

                <p className="text-[11px] text-[#94A3B8]">Document links open for {detail.documentLinksExpireInMinutes} minutes. Reopen this request for fresh links.</p>

                {detail.status === 'pending' && (
                  <div className="sticky bottom-0 -mx-4 md:-mx-6 px-4 md:px-6 py-3.5 bg-white border-t border-[#F1F5F9]">
                    {rejecting ? (
                      <div className="space-y-2.5">
                        <label className="block text-[12.5px] font-semibold">Reason for rejecting (the seller will see this)</label>
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          maxLength={500}
                          rows={3}
                          autoFocus
                          placeholder="e.g. PAN card photo is blurry, please upload a clear copy"
                          className="w-full rounded-xl border border-[#E2E8F0] p-3 text-[13px] focus:outline-none focus:border-[#DC2626]"
                        />
                        <div className="flex justify-end gap-2">
                          <button type="button" disabled={acting} onClick={() => { setRejecting(false); setReason(''); }} className="h-10 px-4 rounded-full border border-[#E2E8F0] text-[13px] font-bold text-[#475569] disabled:opacity-50">Cancel</button>
                          <button type="button" disabled={acting || reason.trim().length < 3} onClick={() => decide('reject')} className="h-10 px-5 rounded-full bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[13px] font-bold disabled:opacity-50 inline-flex items-center gap-1.5">
                            <XCircle className="w-4 h-4" /> {acting ? 'Rejecting…' : 'Confirm reject'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button type="button" disabled={acting} onClick={() => setRejecting(true)} className="h-10 px-5 rounded-full border border-[#FCA5A5] text-[#DC2626] hover:bg-red-50 text-[13px] font-bold disabled:opacity-50">Reject</button>
                        <button type="button" disabled={acting} onClick={() => decide('approve')} className="h-10 px-5 rounded-full bg-[#009D64] hover:bg-[#008856] text-white text-[13px] font-bold disabled:opacity-50 inline-flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> {acting ? 'Approving…' : 'Approve KYC'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      <Toast toast={toast} onClose={closeToast} />
    </AdminLayout>
  );
}
