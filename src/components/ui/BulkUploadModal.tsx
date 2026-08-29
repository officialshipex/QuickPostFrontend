import { apiClient } from '../../services/apiClient';
import { SharedUploadModal } from './SharedUploadModal';
import { refreshNotifications } from '../../context/NotificationListContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function BulkUploadModal({ open, onClose }: Props) {
  const handleDownloadSample = async () => {
    const res = await apiClient.get('/bulkOrderUpload/download-excel', { responseType: 'blob' });
    const blob = new Blob([res.data], { type: String(res.headers['content-type'] ?? 'application/octet-stream') });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Bulk_Order_Sample_Format.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/bulkOrderUpload/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      validateStatus: (s: number) => s < 500,
    });
    const { message, successCount = 0, failedCount = 0 } = res.data || {};
    refreshNotifications();
    if (res.status === 207) {
      throw new Error(`${message} | ✅ ${successCount} success, ❌ ${failedCount} failed`);
    }
    return message || `✅ ${successCount} orders imported successfully!`;
  };

  return (
    <SharedUploadModal
      open={open}
      onClose={onClose}
      title="Bulk B2C Upload"
      subtitle="Import your orders using an excel file"
      chooseFileLabel="Choose Excel File"
      onDownloadSample={handleDownloadSample}
      onUpload={handleUpload}
    />
  );
}
