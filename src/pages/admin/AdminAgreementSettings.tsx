import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';
import { ArrowLeft, FileText, Download, BookOpen, CheckCircle2, X } from 'lucide-react';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';

interface Agreement {
  _id: string;
  versionName: string;
  createdAt: string;
  isRead: boolean;
  readAt?: string;
  isAccepted: boolean;
  acceptedAt?: string;
}

const fmtDate = (d?: string) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export function AdminAgreementSettings() {
  const navigate = useNavigate();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  // The agreement shown inside the page (html null = still loading). It used to open in a new tab after the request
  // came back — browsers block a tab opened that late (always on phones), so the seller saw nothing at all.
  const [viewer, setViewer] = useState<{ ag: Agreement; html: string | null } | null>(null);
  const [accepting, setAccepting] = useState(false);
  const { toast, showToast: _showToast, closeToast } = useToast();
  const showToast = (msg: string, ok = true) => _showToast(ok ? 'success' : 'error', msg);

  const fetchAgreements = async () => {
    try {
      const res = await apiClient.get('/agreement/user/list');
      if (res.data.success) setAgreements(res.data.agreements || []);
    } catch {
      setAgreements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAgreements(); }, []);

  const handleRead = async (ag: Agreement) => {
    setViewer({ ag, html: null });
    let html: string;
    try {
      const res = await apiClient.get(`/agreement/user/preview/${ag._id}`, { responseType: 'text' });
      html = String(res.data);
    } catch {
      setViewer(null);
      showToast('Failed to load agreement', false);
      return;
    }
    // marked read BEFORE it is shown: the server accepts only an agreement marked read, so the Accept button
    // under the agreement can never be refused for being too quick
    try {
      const res = await apiClient.get(`/agreement/user/read/${ag._id}`);
      if (res.data.success) {
        setAgreements(prev =>
          prev.map(a => a._id === ag._id ? { ...a, isRead: true, readAt: new Date().toISOString() } : a)
        );
      }
    } catch { /* ignore read-mark failure */ }
    setViewer(v => (v && v.ag._id === ag._id ? { ag, html } : v));
  };

  const handleAccept = async (agreementId: string) => {
    try {
      const res = await apiClient.get(`/agreement/user/accept/${agreementId}`);
      if (res.data.success) {
        setAgreements(prev =>
          prev.map(a => a._id === agreementId ? { ...a, isAccepted: true, acceptedAt: new Date().toISOString() } : a)
        );
        showToast('Agreement accepted');
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to accept agreement', false);
    }
  };

  const acceptFromViewer = async () => {
    if (!viewer) return;
    setAccepting(true);
    await handleAccept(viewer.ag._id);
    setAccepting(false);
    setViewer(null);
  };

  const handleDownload = async (ag: Agreement) => {
    if (!ag.isAccepted) {
      showToast('Please read and accept the agreement before downloading', false);
      return;
    }
    try {
      const res = await apiClient.get(`/agreement/user/download/${ag._id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Agreement_${ag.versionName.replace(/\s+/g, '_')}.html`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showToast('Failed to download agreement', false);
    }
  };

  return (
    <AdminLayout>
      <Toast toast={toast} onClose={closeToast} />

      <div className="max-w-[1400px] mx-auto pb-10">
        <button
          onClick={() => navigate('/user/settings')}
          className="flex items-center gap-2 text-[12px] font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors bg-white px-3.5 py-2 rounded-lg border border-[#E2E8F0] hover:border-[#CBD5E1] mb-5"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Settings
        </button>

        <div className="mb-6">
          <h1 className="text-[20px] font-bold text-[#0F172A]">Agreement</h1>
          <p className="text-[12px] text-[#64748B] mt-0.5">Read and accept platform agreements</p>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                {['S.No', 'Version Name', 'Created At', 'Read', 'Accept', 'Download'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <div className="w-7 h-7 border-[3px] border-[#E2E8F0] border-t-[#00A86B] rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : agreements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <FileText className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2" />
                    <p className="text-[13px] font-semibold text-[#94A3B8]">No agreements available</p>
                  </td>
                </tr>
              ) : (
                agreements.map((ag, i) => (
                  <tr key={ag._id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3.5 text-[13px] text-[#64748B]">{i + 1}</td>
                    <td className="px-5 py-3.5 text-[13px] font-semibold text-[#0F172A]">{ag.versionName}</td>
                    <td className="px-5 py-3.5 text-[12px] text-[#64748B]">{fmtDate(ag.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      {ag.isRead ? (
                        <button onClick={() => handleRead(ag)} title="Read the agreement again"
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F0FDF4] text-[#00A86B] hover:bg-[#DCFCE7] transition-colors">
                          <CheckCircle2 className="w-3 h-3" /> Read · View again
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRead(ag)}
                          className="flex items-center gap-1.5 bg-[#00A86B] text-white px-3 py-1.5 rounded-lg text-[11px] font-bold hover:bg-[#009B63] transition-colors shadow-sm"
                        >
                          <BookOpen className="w-3 h-3" /> Click to Read
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {ag.isAccepted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F0FDF4] text-[#00A86B]">
                          <CheckCircle2 className="w-3 h-3" /> Accepted
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAccept(ag._id)}
                          disabled={!ag.isRead}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors shadow-sm ${
                            ag.isRead
                              ? 'bg-[#00A86B] text-white hover:bg-[#009B63]'
                              : 'bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed'
                          }`}
                        >
                          Accept
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {ag.isAccepted ? (
                        <button
                          onClick={() => handleDownload(ag)}
                          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#00A86B] hover:underline"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
                      ) : (
                        <span className="text-[12px] font-semibold text-[#CBD5E1] cursor-not-allowed flex items-center gap-1.5">
                          <Download className="w-3.5 h-3.5" /> Download
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-7 h-7 border-[3px] border-[#E2E8F0] border-t-[#00A86B] rounded-full animate-spin" />
            </div>
          ) : agreements.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-10 text-center">
              <FileText className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2" />
              <p className="text-[13px] font-semibold text-[#94A3B8]">No agreements available</p>
            </div>
          ) : (
            agreements.map((ag, i) => (
              <div key={ag._id} className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-4 py-3 bg-[#F0FDF4] border-b border-[#D1FAE5]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#00A86B] text-white text-[10px] font-bold flex items-center justify-center">
                      {i + 1}
                    </div>
                    <span className="text-[13px] font-bold text-[#0F172A]">{ag.versionName}</span>
                  </div>
                  {ag.isAccepted ? (
                    <button
                      onClick={() => handleDownload(ag)}
                      className="flex items-center gap-1 text-[11px] font-bold text-[#00A86B] bg-white border border-[#D1FAE5] rounded-full px-2.5 py-0.5"
                    >
                      <Download className="w-3 h-3" /> Download
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-[#94A3B8]">Locked</span>
                  )}
                </div>
                <div className="px-4 py-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#94A3B8]">Created At</span>
                    <span className="text-[11px] text-[#64748B]">{fmtDate(ag.createdAt)}</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    {ag.isRead ? (
                      <button onClick={() => handleRead(ag)}
                        className="flex-1 text-center py-1.5 rounded-xl text-[11px] font-bold bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Read · View again
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRead(ag)}
                        className="flex-1 bg-[#00A86B] text-white py-1.5 rounded-xl text-[11px] font-bold hover:bg-[#009B63] transition-colors flex items-center justify-center gap-1"
                      >
                        <BookOpen className="w-3 h-3" /> Click to Read
                      </button>
                    )}
                    {ag.isAccepted ? (
                      <span className="flex-1 text-center py-1.5 rounded-xl text-[11px] font-bold bg-[#F0FDF4] text-[#00A86B] flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Accepted
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAccept(ag._id)}
                        disabled={!ag.isRead}
                        className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-colors ${
                          ag.isRead
                            ? 'bg-[#00A86B] text-white hover:bg-[#009B63]'
                            : 'bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed'
                        }`}
                      >
                        Accept
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Agreement viewer: the contract inside the page (no new tab), with Accept right under it */}
      <AnimatePresence>
        {viewer && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewer(null)} className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} role="dialog" aria-modal="true" aria-label={`Agreement ${viewer.ag.versionName}`}
              className="relative w-full max-w-4xl h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-[#E2E8F0]">
                <div className="min-w-0">
                  <h2 className="text-[15px] font-bold text-[#0F172A] truncate">Merchant Agreement · {viewer.ag.versionName}</h2>
                  <p className="text-[11.5px] text-[#64748B]">{viewer.ag.isAccepted ? `Accepted on ${fmtDate(viewer.ag.acceptedAt)}` : 'Please read the agreement, then accept it below.'}</p>
                </div>
                <button onClick={() => setViewer(null)} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9] shrink-0"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 min-h-0 bg-[#F8FAFC]">
                {viewer.html === null ? (
                  <div className="h-full flex items-center justify-center"><div className="w-7 h-7 border-[3px] border-[#E2E8F0] border-t-[#00A86B] rounded-full animate-spin" /></div>
                ) : (
                  <iframe title="Agreement" srcDoc={viewer.html} sandbox="" className="w-full h-full bg-white border-0" />
                )}
              </div>
              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[#E2E8F0]">
                <button onClick={() => setViewer(null)} className="h-9 px-4 rounded-lg border border-[#E2E8F0] text-[12px] font-semibold text-[#475569] hover:bg-[#F8FAFC]">Close</button>
                {!viewer.ag.isAccepted && (
                  <button onClick={acceptFromViewer} disabled={viewer.html === null || accepting}
                    className="h-9 px-4 rounded-lg bg-[#00A86B] text-white text-[12px] font-bold hover:bg-[#009B63] disabled:opacity-50 inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />{accepting ? 'Accepting…' : 'I accept this agreement'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
