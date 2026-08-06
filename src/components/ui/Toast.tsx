import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import type { ToastState } from '../../hooks/useToast';

interface ToastProps {
  toast: ToastState | null;
  onClose: () => void;
}

const ICON = {
  success: <CheckCircle2 className="w-4 h-4 text-[#34D399]" />,
  error:   <AlertCircle  className="w-4 h-4 text-[#F87171]" />,
  info:    <Info         className="w-4 h-4 text-[#60A5FA]" />,
};

const ICON_BG = {
  success: 'bg-emerald-500/20',
  error:   'bg-red-500/20',
  info:    'bg-blue-500/20',
};

export function Toast({ toast, onClose }: ToastProps) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-[9999] bg-[#1E293B] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-white/10 sm:min-w-[320px]"
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${ICON_BG[toast.type]}`}>
            {ICON[toast.type]}
          </div>
          <p className="text-[13px] font-medium flex-1">{toast.text}</p>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-md ml-auto text-[#94A3B8] hover:text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
