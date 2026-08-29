import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Package, UploadCloud, ChevronDown } from 'lucide-react';
import { GlassDateFilter } from '../../ui/GlassDateFilter';
import { JobDetailModal } from './JobDetailModal';
import {
  getNotificationHistory,
  type AppNotification,
  type NotificationRefModel,
  type BulkShipJobSummary,
  type BulkOrderFilesSummary,
} from '../../../services/notificationService';

interface TypeOption {
  value: NotificationRefModel | '';
  label: string;
}

const TYPE_OPTIONS: TypeOption[] = [
  { value: '', label: 'All' },
  { value: 'BulkShipJob', label: 'Bulk Ship' },
  { value: 'BulkOrderFiles', label: 'Bulk Upload' },
];

const summaryFor = (notification: AppNotification): string => {
  const ref = notification.refId;
  if (!ref) return '';
  if (notification.refModel === 'BulkShipJob') {
    const job = ref as BulkShipJobSummary;
    if (job.status === 'running') {
      const done = (job.successCount || 0) + (job.failureCount || 0);
      return `Processing… ${done}/${job.totalOrders}`;
    }
    return `${job.successCount || 0} succeeded, ${job.failureCount || 0} failed`;
  }
  const file = ref as BulkOrderFilesSummary;
  return `${file.successfullyUploaded || 0}/${file.noOfOrders || 0} rows uploaded${file.errorOrders ? `, ${file.errorOrders} failed` : ''}`;
};

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

interface NotificationHistoryModalProps {
  open: boolean;
  onClose: () => void;
}

interface DayGroup {
  dayKey: string;
  label: string;
  types: Map<NotificationRefModel, AppNotification[]>;
}

// "Show All" — recovers dismissed notifications too (that's the whole point:
// a notification the user accidentally closed without reading it is still
// findable here), grouped by date then by Bulk Ship / Bulk Upload.
export function NotificationHistoryModal({ open, onClose }: NotificationHistoryModalProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<NotificationRefModel | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [openNotificationId, setOpenNotificationId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params: { limit: number; refModel?: NotificationRefModel; fromDate?: string; toDate?: string } = { limit: 200 };
      if (typeFilter) params.refModel = typeFilter;
      if (startDate) params.fromDate = new Date(startDate).toISOString();
      if (endDate) params.toDate = new Date(`${endDate}T23:59:59.999`).toISOString();
      const response = await getNotificationHistory(params);
      setNotifications(response.data?.notifications || []);
    } catch (error) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, startDate, endDate]);

  useEffect(() => {
    if (open) fetchHistory();
  }, [open, fetchHistory]);

  if (!open) return null;

  // Group by day, then by refModel within each day.
  const groups: DayGroup[] = [];
  const dayIndex = new Map<string, DayGroup>();
  notifications.forEach((n) => {
    const dayKey = n.createdAt.slice(0, 10);
    let group = dayIndex.get(dayKey);
    if (!group) {
      group = { dayKey, label: formatDay(n.createdAt), types: new Map() };
      dayIndex.set(dayKey, group);
      groups.push(group);
    }
    const list = group.types.get(n.refModel) || [];
    list.push(n);
    group.types.set(n.refModel, list);
  });

  const typeLabel = (refModel: NotificationRefModel) => (refModel === 'BulkShipJob' ? 'Bulk Ship' : 'Bulk Upload');
  const typeIcon = (refModel: NotificationRefModel) =>
    refModel === 'BulkShipJob' ? (
      <Package className="w-3.5 h-3.5 text-[#00A86B]" />
    ) : (
      <UploadCloud className="w-3.5 h-3.5 text-[#00A86B]" />
    );

  return createPortal(
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[700px] max-w-[94vw] max-h-[88vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-[14px] font-bold text-gray-800">All Notifications</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50">
          <div className="relative sm:w-[180px]">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as NotificationRefModel | '')}
              className="w-full appearance-none bg-white py-2 pl-3 pr-8 text-[12px] font-semibold border border-gray-300 rounded-lg focus:outline-none focus:border-[#00A86B] text-gray-600"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <GlassDateFilter
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
            defaultStart=""
            defaultEnd=""
            className="sm:w-[240px]"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-10 text-center text-gray-400 text-[12px]">Loading…</div>
          ) : groups.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-[12px]">No notifications found for this filter.</div>
          ) : (
            groups.map((group) => (
              <div key={group.dayKey} className="px-5 py-3 border-b border-gray-100">
                <div className="text-[12px] font-bold text-gray-700 mb-2">{group.label}</div>
                {[...group.types.entries()].map(([refModel, items]) => (
                  <div key={refModel} className="mb-3 last:mb-0">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 mb-1.5">
                      {typeIcon(refModel)}
                      {typeLabel(refModel)}
                    </div>
                    <div className="space-y-1">
                      {items.map((n) => (
                        <button
                          key={n._id}
                          type="button"
                          onClick={() => setOpenNotificationId(n._id)}
                          className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-green-50 text-left transition-colors"
                        >
                          <span className="text-[12px] text-gray-700 font-semibold truncate">{n.title}</span>
                          <span className="text-[11px] text-gray-400 flex-shrink-0">
                            {formatTime(n.createdAt)} · {summaryFor(n)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      <JobDetailModal notificationId={openNotificationId} onClose={() => setOpenNotificationId(null)} />
    </div>,
    document.body
  );
}
