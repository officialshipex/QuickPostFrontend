// ─── App Notifications (Bulk Ship / Bulk Order Upload) ─────────────────────
// Thin wrappers over apiClient — no manual auth headers needed, apiClient's
// own interceptor already attaches the Bearer token. This app shares the
// same backend/accounts as its sibling ShipexFrontend, so a notification
// created there (e.g. a BulkShipJob) can appear here too — every shape below
// must stay renderable even for a refModel this app itself never creates.

import { apiClient } from './apiClient';

export type NotificationRefModel = 'BulkShipJob' | 'BulkOrderFiles';

export interface BulkShipJobSummary {
  status: 'running' | 'completed';
  totalOrders: number;
  successCount: number;
  failureCount: number;
}

export interface BulkOrderFilesSummary {
  status: string;
  noOfOrders: number;
  successfullyUploaded: number;
  errorOrders: number;
}

export interface AppNotification {
  _id: string;
  refModel: NotificationRefModel;
  refId: (BulkShipJobSummary | BulkOrderFilesSummary) | null;
  title: string;
  dismissed: boolean;
  createdAt: string;
}

export interface BulkShipResult {
  orderId: string;
  displayOrderId: number | null;
  status: 'pending' | 'processing' | 'success' | 'failed';
  courierServiceName: string | null;
  failureReason: string | null;
}

export interface BulkShipJobDetail extends BulkShipJobSummary {
  results: BulkShipResult[];
}

export interface BulkUploadRowResult {
  row: number;
  status: 'success' | 'failed';
  orderId: number | null;
  message: string | null;
}

export interface BulkOrderFilesDetail extends BulkOrderFilesSummary {
  rowResults: BulkUploadRowResult[];
  createdAt: string;
}

export interface NotificationDetailResponse {
  success: boolean;
  refModel: NotificationRefModel;
  title: string;
  job?: BulkShipJobDetail;
  file?: BulkOrderFilesDetail;
}

export interface NotificationHistoryParams {
  refModel?: NotificationRefModel;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export const getActiveNotifications = () =>
  apiClient.get<{ success: boolean; notifications: AppNotification[] }>('/app-notifications');

export const getNotificationHistory = (params: NotificationHistoryParams) =>
  apiClient.get<{ success: boolean; total: number; page: number; limit: number; notifications: AppNotification[] }>(
    '/app-notifications/history',
    { params }
  );

export const getNotificationDetail = (id: string) =>
  apiClient.get<NotificationDetailResponse>(`/app-notifications/${id}/detail`);

export const dismissNotification = (id: string) =>
  apiClient.post(`/app-notifications/${id}/dismiss`);
