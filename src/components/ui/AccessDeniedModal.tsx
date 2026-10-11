import { useEffect } from 'react';
import { Lock } from 'lucide-react';

interface AccessDeniedModalProps {
  message: string;
  onClose: () => void;
}

// "No access" popup shown to employees when they open (or click) something they have no permission for.
export function AccessDeniedModal({ message, onClose }: AccessDeniedModalProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="access-denied-title">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-red-500" />
        </div>
        <h3 id="access-denied-title" className="text-sm font-bold text-[#0F172A] mb-1">Access Restricted</h3>
        <p className="text-xs text-[#64748B] mb-5">{message}</p>
        <button
          autoFocus
          onClick={onClose}
          className="w-full h-9 rounded-full bg-[#0F172A] text-white text-xs font-bold hover:bg-[#1E293B]"
        >
          OK, Got It
        </button>
      </div>
    </div>
  );
}
