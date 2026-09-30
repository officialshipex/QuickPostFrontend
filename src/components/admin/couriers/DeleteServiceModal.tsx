import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { apiClient } from '../../../services/apiClient';

interface DeleteServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  servicesToDelete: any[];
  onSuccess: () => void;
}

export function DeleteServiceModal({
  isOpen,
  onClose,
  servicesToDelete,
  onSuccess,
}: DeleteServiceModalProps) {
  const [stats, setStats] = useState<any | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && servicesToDelete && servicesToDelete.length > 0) {
      fetchPreview();
    } else {
      setStats(null);
      setError(null);
    }
  }, [isOpen, servicesToDelete]);

  const fetchPreview = async () => {
    setLoadingPreview(true);
    setError(null);
    try {
      const res = await apiClient.post('/courierServices/previewDelete', {
        serviceIds: servicesToDelete.map((s) => s._id),
      });
      if (res.data?.success) {
        setStats(res.data);
      } else {
        setError(res.data?.message || 'Failed to calculate matching rates');
      }
    } catch (err: any) {
      console.error('Error fetching delete preview:', err);
      setError(err.response?.data?.message || 'Failed to fetch rate match preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      if (servicesToDelete.length === 1) {
        await apiClient.delete(`/courierServices/couriers/${servicesToDelete[0]._id}`);
      } else {
        await apiClient.post('/courierServices/bulkDelete', {
          serviceIds: servicesToDelete.map((s) => s._id),
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error deleting service(s):', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to delete service(s)');
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen || !servicesToDelete || servicesToDelete.length === 0) return null;

  const isBulk = servicesToDelete.length > 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000]"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 bg-red-50/80 border-b border-red-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-600 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">
                      {isBulk ? `Delete ${servicesToDelete.length} Courier Services` : 'Delete Courier Service'}
                    </h2>
                    <p className="text-xs text-red-600 font-medium mt-0.5">
                      Warning: Associated rates in all user plans will be removed
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  disabled={deleting}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {loadingPreview ? (
                  <div className="py-10 flex flex-col items-center justify-center gap-3 text-gray-500">
                    <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                    <p className="text-xs font-semibold">Calculating matching rates across all user plans...</p>
                  </div>
                ) : error ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                    {error}
                  </div>
                ) : (
                  <>
                    {/* Warning Notice */}
                    <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-900 leading-relaxed font-medium">
                          Are you sure you want to permanently delete{' '}
                          <span className="font-bold text-gray-900">
                            {isBulk
                              ? `${servicesToDelete.length} courier services`
                              : `"${servicesToDelete[0].name}" (${servicesToDelete[0].provider})`}
                          </span>
                          ? All matching rate cards will be{' '}
                          <span className="font-bold text-red-600">permanently deleted</span> from all user plans.
                        </div>
                      </div>
                    </div>

                    {/* Stats Metric Cards */}
                    {stats && (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2.5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                          Impact & Rate Match Summary
                        </div>
                        <div className="grid grid-cols-3 gap-2.5 text-center">
                          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
                            <div className="text-xl font-extrabold text-red-600">{stats.totalRates}</div>
                            <div className="text-[10px] font-semibold text-gray-600 mt-0.5">Total Rates</div>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
                            <div className="text-xl font-extrabold text-[#00A86B]">{stats.totalGlobalRates}</div>
                            <div className="text-[10px] font-semibold text-gray-600 mt-0.5">Global Rate Cards</div>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
                            <div className="text-xl font-extrabold text-amber-600">{stats.affectedUserPlans}</div>
                            <div className="text-[10px] font-semibold text-gray-600 mt-0.5">User Plans Affected</div>
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-500 italic text-center pt-1">
                          {stats.totalUserPlanRates} rate entries across {stats.affectedUserPlans} user plans will be removed.
                        </p>
                      </div>
                    )}

                    {/* Services Breakdown List */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                        Service{isBulk ? 's' : ''} to be deleted:
                      </label>
                      <div className="max-h-44 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-xl bg-white">
                        {servicesToDelete.map((svc) => {
                          const svcStat = stats?.services?.find((s: any) => s.id === svc._id);
                          return (
                            <div
                              key={svc._id}
                              className="p-3 flex items-center justify-between text-xs hover:bg-gray-50"
                            >
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900">{svc.name}</span>
                                <span className="text-[11px] text-gray-500">{svc.courierType || 'Surface'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold bg-[#E6F9F2] text-[#00A86B] px-2.5 py-0.5 rounded-full border border-[#00A86B]/20">
                                  {svc.provider}
                                </span>
                                {svcStat && (
                                  <span className="text-[10px] font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-md border border-red-200">
                                    {svcStat.totalRateCount} rates
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2.5">
                <button
                  onClick={onClose}
                  disabled={deleting}
                  className="px-5 h-10 rounded-full font-semibold text-xs text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={loadingPreview || deleting}
                  className="px-6 h-10 rounded-full font-semibold text-xs text-white bg-red-600 hover:bg-red-700 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting Service & Rates...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Confirm & Delete</span>
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
