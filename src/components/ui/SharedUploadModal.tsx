import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Loader2, Download, FileText } from 'lucide-react';
import { Toast } from './Toast';
import { useToast } from '../../hooks/useToast';

export interface SharedUploadModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  accept?: string;
  fileHint?: string;
  chooseFileLabel?: string;
  onDownloadSample?: () => Promise<void>;
  downloadSampleLabel?: string;
  uploadButtonLabel?: string;
  onUpload: (file: File) => Promise<string | void>;
  extraContent?: React.ReactNode;
}

export function SharedUploadModal({
  open,
  onClose,
  title,
  subtitle,
  accept = '.xlsx,.xls',
  fileHint = 'XLSX or XLS supported',
  chooseFileLabel = 'Choose File',
  onDownloadSample,
  downloadSampleLabel = 'Download Sample',
  uploadButtonLabel = 'Confirm & Upload',
  onUpload,
  extraContent,
}: SharedUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { toast, showToast: _showToast, closeToast } = useToast(4000);
  const showToast = (msg: string, ok: boolean) => _showToast(ok ? 'success' : 'error', msg);

  const handleClose = () => {
    if (uploading) return;
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    closeToast();
    onClose();
  };

  const handleDownload = async () => {
    if (!onDownloadSample) return;
    setDownloading(true);
    try {
      await onDownloadSample();
    } catch {
      showToast('Failed to download template.', false);
    } finally {
      setDownloading(false);
    }
  };

  const handleUpload = async () => {
    if (!file || uploading) return;
    setUploading(true);
    try {
      const msg = await onUpload(file);
      showToast(typeof msg === 'string' ? msg : 'Upload successful!', true);
      setTimeout(handleClose, 1800);
    } catch (err: any) {
      showToast(err?.message || 'Upload failed. Please check your file and try again.', false);
    } finally {
      setUploading(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[200]"
          />
          <div className="fixed inset-0 flex items-center justify-center z-[201] p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="w-full max-w-[460px] bg-white rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.16)] p-6 relative pointer-events-auto border border-slate-100"
            >
              {/* Close */}
              <button
                onClick={handleClose}
                disabled={uploading}
                className="absolute top-4 right-4 w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors focus:outline-none disabled:opacity-50"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-[#F0FDF4] flex items-center justify-center shrink-0">
                  <Upload className="w-5 h-5 text-[#00A86B]" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-[#0F172A]">{title}</h2>
                  {subtitle && <p className="text-[11px] text-[#64748B] font-medium">{subtitle}</p>}
                </div>
              </div>

              <div className="h-[1px] bg-slate-100 mb-4" />

              <Toast toast={toast} onClose={closeToast} />

              {/* Extra content — e.g. version name input, info callout */}
              {extraContent && <div className="mb-4">{extraContent}</div>}

              {/* Sample download */}
              {onDownloadSample && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-[#475569]">Need the template?</span>
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex items-center gap-1.5 text-[12px] font-bold text-[#00A86B] hover:underline transition-all disabled:opacity-50"
                  >
                    {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    {downloadSampleLabel}
                  </button>
                </div>
              )}

              {/* Upload zone */}
              <label className="group cursor-pointer block mb-3">
                <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all duration-200 ${
                  file ? 'border-[#00A86B] bg-[#F0FDF4]' : 'border-[#E2E8F0] hover:border-[#00A86B] hover:bg-slate-50'
                }`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${
                    file ? 'bg-[#00A86B] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-[#DCFCE7] group-hover:text-[#00A86B]'
                  }`}>
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-[13px] font-bold text-[#0F172A]">
                    {file ? 'Change File' : chooseFileLabel}
                  </span>
                  <span className="text-[11px] text-[#94A3B8] mt-1">{fileHint}</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={accept}
                  className="hidden"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
              </label>

              {/* Selected file card */}
              {file && (
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-4">
                  <div className="w-9 h-9 rounded-lg bg-[#F0FDF4] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-[#00A86B]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-[#0F172A] truncate">{file.name}</p>
                    <p className="text-[10px] text-[#94A3B8]">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    onClick={e => { e.preventDefault(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="p-1.5 text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Upload button */}
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full py-3 flex items-center justify-center gap-2 bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-bold rounded-xl transition-colors disabled:opacity-50 disabled:pointer-events-none focus:outline-none"
              >
                {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                {uploading ? 'Uploading…' : uploadButtonLabel}
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
