import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { apiClient } from '../../services/apiClient';
import { FileText, Download, Plus, Hash, Calendar } from 'lucide-react';
import { TableLoader } from '../../components/ui/TableLoader';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { SharedUploadModal } from '../../components/ui/SharedUploadModal';

interface Agreement {
  _id: string;
  versionName: string;
  fileName: string;
  fileUrl: string;
  createdAt: string;
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export function AdminAgreement() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [versionName, setVersionName] = useState('');
  const { toast, showToast: _showToast, closeToast } = useToast();
  const showToast = (msg: string, ok = true) => _showToast(ok ? 'success' : 'error', msg);

  const fetchAgreements = async () => {
    try {
      const res = await apiClient.get('/agreement/admin/list');
      if (res.data.success) setAgreements(res.data.agreements || []);
    } catch {
      setAgreements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAgreements(); }, []);

  const handleAgreementUpload = async (file: File): Promise<string> => {
    if (!versionName.trim()) throw new Error('Please enter a version name');
    const formData = new FormData();
    formData.append('agreementFile', file);
    formData.append('versionName', versionName);
    const res = await apiClient.post('/agreement/admin/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (res.data.success) {
      fetchAgreements();
      return 'Agreement uploaded successfully';
    }
    throw new Error('Upload failed');
  };

  return (
    <AdminLayout>
      <Toast toast={toast} onClose={closeToast} />

      <div className="flex flex-col h-[calc(100vh-72px)] -m-4 md:-m-6 bg-white">
        {/* Header */}
        <div className="bg-white relative z-50 shrink-0">
          <div className="flex items-center justify-between px-4 md:px-6 py-2 border-b border-[#E2E8F0]">
            <div>
              <h1 className="text-[15px] font-bold text-[#0F172A]">Agreement</h1>
              <p className="text-[11px] text-[#64748B]">Upload and manage platform agreements</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 h-9 px-4 rounded-[14px] bg-[#00A86B] text-white text-[12px] font-bold hover:bg-[#009B63] transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Upload Agreement
            </button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:flex bg-white flex-col flex-1 min-h-0 overflow-hidden border-t border-[#E2E8F0]">
          <div className="flex-1 overflow-auto w-full relative">
            {loading && <TableLoader />}
            <table className="w-full text-left border-collapse min-w-full">
              <thead className="sticky top-0 z-40 bg-[#E6F9F2] shadow-sm">
                <tr className="text-xs leading-[18px] font-medium text-[#64748B] uppercase tracking-wider border border-[#B9EFDB]">
                  <th className="py-2 px-4 rounded-l-lg"><div className="flex items-center gap-1"><Hash className="w-3.5 h-3.5 shrink-0" /><span>S.No</span></div></th>
                  <th className="py-2 px-4"><div className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 shrink-0" /><span>Version Name</span></div></th>
                  <th className="py-2 px-4"><div className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 shrink-0" /><span>File Name</span></div></th>
                  <th className="py-2 px-4"><div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 shrink-0" /><span>Created At</span></div></th>
                  <th className="py-2 px-4 rounded-r-lg"><div className="flex items-center gap-1"><Download className="w-3.5 h-3.5 shrink-0" /><span>Download</span></div></th>
                </tr>
              </thead>
              <tbody>
                {!loading && agreements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-20">
                      <FileText className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2" />
                      <p className="text-[13px] font-semibold text-[#94A3B8]">No agreements uploaded yet</p>
                    </td>
                  </tr>
                ) : (
                  agreements.map((ag, i) => (
                    <tr key={ag._id} className={`border-b border-[#E2E8F0] transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[#E6EDF7]/20'}`}>
                      <td className="py-2 px-4 text-xs font-semibold text-[#94A3B8]">{i + 1}</td>
                      <td className="py-2 px-4 text-left text-[13px] font-semibold text-[#0F172A]">{ag.versionName}</td>
                      <td className="py-2 px-4 text-[12px] font-normal text-[#64748B]">
                        <span className="block max-w-[220px] truncate">{ag.fileName}</span>
                      </td>
                      <td className="py-2 px-4 text-[12px] font-normal text-[#64748B]">{fmtDate(ag.createdAt)}</td>
                      <td className="py-2 px-4">
                        <a
                          href={ag.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#00A86B] hover:underline cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden overflow-y-auto flex-1 space-y-3 px-4 py-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-7 h-7 border-[3px] border-[#E2E8F0] border-t-[#00A86B] rounded-full animate-spin" />
            </div>
          ) : agreements.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-10 text-center">
              <FileText className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2" />
              <p className="text-[13px] font-semibold text-[#94A3B8]">No agreements uploaded yet</p>
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
                  <a
                    href={ag.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] font-bold text-[#00A86B] bg-white border border-[#D1FAE5] rounded-full px-2.5 py-0.5"
                  >
                    <Download className="w-3 h-3" /> Download
                  </a>
                </div>
                <div className="px-4 py-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#94A3B8]">File Name</span>
                    <span className="text-[11px] font-medium text-[#0F172A] text-right max-w-[60%] truncate">{ag.fileName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#94A3B8]">Created At</span>
                    <span className="text-[11px] text-[#64748B]">{fmtDate(ag.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <SharedUploadModal
        open={showModal}
        onClose={() => { setShowModal(false); setVersionName(''); }}
        title="Upload Agreement"
        subtitle="Upload and manage platform agreements"
        accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        fileHint=".doc or .docx accepted"
        chooseFileLabel="Choose Word File"
        uploadButtonLabel="Upload"
        onUpload={handleAgreementUpload}
        extraContent={
          <div>
            <label className="block text-[12px] font-semibold text-[#0F172A] mb-1.5">Version Name</label>
            <input
              type="text"
              value={versionName}
              onChange={e => setVersionName(e.target.value)}
              placeholder="e.g. v1.0, June 2026"
              className="w-full border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]/20 transition-colors"
            />
          </div>
        }
      />
    </AdminLayout>
  );
}
