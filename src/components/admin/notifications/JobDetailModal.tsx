import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, CheckCircle2, XCircle, Circle } from 'lucide-react';
import {
  getNotificationDetail,
  type NotificationDetailResponse,
  type BulkShipJobDetail,
  type BulkShipResult,
  type BulkOrderFilesDetail,
  type BulkUploadRowResult,
} from '../../../services/notificationService';

const POLL_INTERVAL_MS = 2500;

const statusIcon = (status: string) => {
  switch (status) {
    case 'processing':
      return <Loader2 className="w-4 h-4 text-[#00A86B] animate-spin flex-shrink-0" />;
    case 'success':
      return <CheckCircle2 className="w-4 h-4 text-[#00A86B] flex-shrink-0" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
    default:
      return <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />;
  }
};

interface JobDetailModalProps {
  notificationId: string | null;
  onClose: () => void;
}

// Big centered detail view for a single Bulk Ship job or Bulk Upload file,
// reached from a notification click. Must render a BulkShipJob correctly
// even though nothing in this app creates one yet — this account may also
// use the sibling ShipexFrontend against the same backend.
export function JobDetailModal({ notificationId, onClose }: JobDetailModalProps) {
  const [data, setData] = useState<NotificationDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!notificationId) return;
    try {
      const response = await getNotificationDetail(notificationId);
      if (response.data?.success) setData(response.data);
    } catch (error) {
      // keep whatever we last had; next poll tick (if any) will retry
    } finally {
      setLoading(false);
    }
  }, [notificationId]);

  useEffect(() => {
    if (!notificationId) return;
    setData(null);
    setLoading(true);
    fetchDetail();
  }, [notificationId, fetchDetail]);

  // Live-poll while a bulk-ship job is still running so the modal updates
  // in front of the user instead of showing a stale snapshot.
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (data?.refModel === 'BulkShipJob' && data?.job?.status === 'running') {
      intervalRef.current = setInterval(fetchDetail, POLL_INTERVAL_MS);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [data, fetchDetail]);

  if (!notificationId) return null;

  const isBulkShip = data?.refModel === 'BulkShipJob';

  return createPortal(
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[600px] max-w-[92vw] max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-[14px] font-bold text-gray-800 truncate pr-3">
            {data?.title || 'Bulk Job Details'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading && !data ? (
          <div className="flex-1 p-10 text-center text-gray-400 text-[12px]">Loading details…</div>
        ) : !data ? (
          <div className="flex-1 p-10 text-center text-gray-400 text-[12px]">Could not load this notification.</div>
        ) : isBulkShip ? (
          <BulkShipDetail job={data.job} />
        ) : (
          <BulkUploadDetail file={data.file} />
        )}
      </div>
    </div>,
    document.body
  );
}

interface SummaryItem {
  label: string;
  className?: string;
}

const SummaryBar = ({ items }: { items: SummaryItem[] }) => (
  <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50 text-[12px] font-semibold">
    {items.map((it, idx) => (
      <span key={idx} className={`px-2.5 py-1 rounded-lg ${it.className || 'bg-white text-gray-600 border border-gray-200'}`}>
        {it.label}
      </span>
    ))}
  </div>
);

const BulkShipDetail = ({ job }: { job?: BulkShipJobDetail }) => {
  if (!job) return null;
  const isRunning = job.status === 'running';
  const doneCount = (job.successCount || 0) + (job.failureCount || 0);

  return (
    <>
      <SummaryBar
        items={[
          isRunning
            ? { label: `Processing… ${doneCount}/${job.totalOrders}`, className: 'bg-green-50 text-[#00A86B] border border-green-200' }
            : { label: 'Completed', className: 'bg-green-50 text-[#00A86B] border border-green-200' },
          { label: `${job.successCount || 0} succeeded`, className: 'bg-green-50 text-green-700 border border-green-200' },
          { label: `${job.failureCount || 0} failed`, className: job.failureCount ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-white text-gray-500 border border-gray-200' },
        ]}
      />
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {job.results && job.results.length > 0 ? (
          job.results.map((r: BulkShipResult, idx: number) => (
            <div key={idx} className="flex items-start gap-3 px-5 py-3">
              {statusIcon(r.status)}
              <div className="flex-1 min-w-0 text-[12px]">
                <div className="text-gray-700 font-semibold">Order {r.displayOrderId ?? '—'}</div>
                {r.status === 'success' && r.courierServiceName && (
                  <div className="text-[11px] text-[#00A86B] mt-0.5">Shipped via {r.courierServiceName}</div>
                )}
                {r.status === 'failed' && r.failureReason && (
                  <div className="text-[11px] text-red-500 mt-0.5 whitespace-pre-wrap break-words">{r.failureReason}</div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-10 text-center text-gray-400 text-[12px]">No orders in this batch.</div>
        )}
      </div>
    </>
  );
};

const formatDateTime = (value?: string | null) => {
  if (!value) return null;
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const BulkUploadDetail = ({ file }: { file?: BulkOrderFilesDetail }) => {
  if (!file) return null;
  const rowResults = file.rowResults || [];
  const uploadedAt = formatDateTime(file.createdAt);

  return (
    <>
      <SummaryBar
        items={[
          { label: file.status, className: 'bg-green-50 text-[#00A86B] border border-green-200' },
          { label: `${file.noOfOrders || 0} total`, className: 'bg-white text-gray-600 border border-gray-200' },
          { label: `${file.successfullyUploaded || 0} succeeded`, className: 'bg-green-50 text-green-700 border border-green-200' },
          { label: `${file.errorOrders || 0} failed`, className: file.errorOrders ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-white text-gray-500 border border-gray-200' },
          ...(uploadedAt ? [{ label: `Uploaded ${uploadedAt}`, className: 'bg-white text-gray-500 border border-gray-200' }] : []),
        ]}
      />
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {rowResults.length > 0 ? (
          rowResults.map((r: BulkUploadRowResult, idx: number) => {
            const isSuccess = r.status === 'success';
            return (
              <div key={idx} className="flex items-start gap-3 px-5 py-3">
                {isSuccess ? (
                  <CheckCircle2 className="w-4 h-4 text-[#00A86B] flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0 text-[12px]">
                  <div className="text-gray-700 font-semibold">
                    Row {r.row}
                    {isSuccess && r.orderId != null && (
                      <span className="text-[#00A86B]"> — Order #{r.orderId}</span>
                    )}
                  </div>
                  {isSuccess ? (
                    <div className="text-[11px] text-gray-400 mt-0.5">Uploaded successfully</div>
                  ) : (
                    <div className="text-[11px] text-red-500 mt-0.5 whitespace-pre-wrap break-words">{r.message}</div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-10 text-center text-[#00A86B] text-[12px] flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8" />
            All rows uploaded successfully.
          </div>
        )}
      </div>
    </>
  );
};
