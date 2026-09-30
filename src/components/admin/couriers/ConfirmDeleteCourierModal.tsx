import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Loader2 } from 'lucide-react';

interface ConfirmDeleteCourierModalProps {
  isOpen: boolean;
  onClose: () => void;
  courier: any;
  onConfirm: () => Promise<void>;
  deleting: boolean;
}

export function ConfirmDeleteCourierModal({
  isOpen,
  onClose,
  courier,
  onConfirm,
  deleting,
}: ConfirmDeleteCourierModalProps) {
  if (!isOpen || !courier) return null;

  const courierName = courier.courierName || courier.courierProvider || courier.name || 'Courier';
  const providerName = courier.courierProvider || courier.courierName || courier.name || '';
  const logo = courier.logo || '';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[1000]"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[#E2E8F0] flex flex-col pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 bg-red-50/80 border-b border-red-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0F172A] leading-tight">
                      Delete Courier
                    </h3>
                    <p className="text-[11px] text-[#64748B]">Permanent action</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#0F172A] hover:bg-white/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-3 text-xs">
                <p className="text-[#334155] leading-relaxed text-[13px]">
                  Are you sure you want to delete courier{' '}
                  <strong className="text-[#0F172A] font-bold">"{courierName}"</strong>?
                </p>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <div className="w-9 h-9 bg-white border border-[#E2E8F0] rounded-xl p-1.5 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                    {logo ? (
                      <img src={logo} alt={courierName} className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-xs font-bold text-[#94A3B8]">{courierName.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-[#0F172A]">{courierName}</div>
                    <div className="text-[11px] text-[#64748B]">Provider: {providerName}</div>
                  </div>
                </div>

                <div className="p-3 bg-red-50/60 border border-red-100 rounded-xl text-red-700 text-[11px] leading-relaxed">
                  This courier has no linked services and can be safely removed. All configured credentials will be permanently erased.
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={deleting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#0F172A] bg-white border border-[#E2E8F0] hover:bg-[#F1F5F9] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={deleting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Courier</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
