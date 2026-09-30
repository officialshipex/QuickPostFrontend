import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, AlertTriangle, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

interface CourierDeleteRejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  courier: any;
  services: any[];
}

export function CourierDeleteRejectionModal({
  isOpen,
  onClose,
  courier,
  services = [],
}: CourierDeleteRejectionModalProps) {
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-[#E2E8F0] flex flex-col pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 mb-0.5">
                      Deletion Blocked
                    </span>
                    <h3 className="text-base font-bold text-[#0F172A] leading-tight">
                      Cannot Delete Courier
                    </h3>
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
              <div className="p-5 space-y-4 text-xs">
                {/* Target Courier Card */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white border border-[#E2E8F0] rounded-xl p-1.5 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                      {logo ? (
                        <img src={logo} alt={courierName} className="max-w-full max-h-full object-contain" />
                      ) : (
                        <span className="text-xs font-bold text-[#94A3B8]">{courierName.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-[#0F172A]">{courierName}</div>
                      <div className="text-[11px] text-[#64748B]">Provider: {providerName}</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700 border border-red-200">
                    {services.length} Linked {services.length === 1 ? 'Service' : 'Services'}
                  </span>
                </div>

                {/* Explanation Alert */}
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    This courier cannot be deleted because <strong className="font-semibold text-amber-950">{services.length} active service(s)</strong> are currently configured and linked to it.
                    <br />
                    <span className="font-medium text-amber-800 mt-1 inline-block">
                      Please delete or reassign all linked services below before deleting this courier.
                    </span>
                  </div>
                </div>

                {/* Linked Services List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                      Active Linked Services ({services.length})
                    </span>
                    <span className="text-[10px] text-[#94A3B8]">Must be deleted first</span>
                  </div>

                  <div className="border border-[#E2E8F0] rounded-xl overflow-hidden max-h-52 overflow-y-auto divide-y divide-[#F1F5F9] bg-white">
                    {services.map((svc: any, idx: number) => {
                      const isEnabled = svc.status === 'Enable';
                      return (
                        <div key={svc._id || idx} className="p-3 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors">
                          <div className="min-w-0 flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-[#F1F5F9] text-[#64748B] text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="truncate">
                              <div className="text-[12px] font-semibold text-[#0F172A] truncate">
                                {svc.name || 'Unnamed Service'}
                              </div>
                              <div className="text-[10px] text-[#94A3B8]">
                                {svc.courierType || 'Standard'} {svc.courier_id ? `• ID: ${svc.courier_id}` : ''}
                              </div>
                            </div>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              isEnabled
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-[#F1F5F9] text-[#64748B]'
                            }`}
                          >
                            {isEnabled ? (
                              <>
                                <CheckCircle2 className="w-2.5 h-2.5" /> Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-2.5 h-2.5" /> Disabled
                              </>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#0F172A] bg-white border border-[#E2E8F0] hover:bg-[#F1F5F9] transition-colors"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
