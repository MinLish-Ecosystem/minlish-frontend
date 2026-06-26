import api from '../lib/api';
import { ApiResponse } from '../types/api';
import { GetNotificationsResponse } from '../types/notification';

export const getNotifications = (page = 1, limit = 20, type?: string) => {
  const params: Record<string, any> = { page, limit };
  if (type) params.type = type;
  return api.get<ApiResponse<GetNotificationsResponse>>('/api/v1/notifications', { params });
};

export const getUnreadCount = () =>
  api.get<ApiResponse<{ unreadCount: number }>>('/api/v1/notifications/unread-count');

export const markAsRead = (id: string) =>
  api.put<ApiResponse<null>>(`/api/v1/notifications/${id}/read`);

export const markAllAsRead = () =>
  api.put<ApiResponse<null>>('/api/v1/notifications/read-all');

export const deleteNotification = (id: string) =>
  api.delete<ApiResponse<null>>(`/api/v1/notifications/${id}`);
