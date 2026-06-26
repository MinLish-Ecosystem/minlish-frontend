import api from '../lib/api';
import { ApiResponse } from '../types/api';

// ─── Stats & Audit Logs ───────────────────────────────────────────────────────
export const getAdminStats = () => 
  api.get<ApiResponse<any>>('/api/v1/admin/stats');

export const getAuditLogs = (page: number = 1, limit: number = 20) =>
  api.get<ApiResponse<any>>('/api/v1/admin/audit-logs', { params: { page, limit } });

export const getReportsCSV = () =>
  api.get('/api/v1/admin/reports', { responseType: 'blob' });

// ─── User Management ──────────────────────────────────────────────────────────
export const listUsers = (page: number = 1, limit: number = 20) =>
  api.get<ApiResponse<any>>('/api/v1/admin/users', { params: { page, limit } });

export const getUserDetail = (id: string) =>
  api.get<ApiResponse<any>>(`/api/v1/admin/users/${id}`);

export const banUser = (id: string, reason: string) =>
  api.put<ApiResponse<any>>(`/api/v1/admin/users/${id}/ban`, { reason });

export const unbanUser = (id: string) =>
  api.put<ApiResponse<any>>(`/api/v1/admin/users/${id}/unban`);

export const deleteUser = (id: string) =>
  api.delete<ApiResponse<any>>(`/api/v1/admin/users/${id}`);

// ─── System Config ────────────────────────────────────────────────────────────
export interface SystemConfigData {
  maintenanceMode: boolean;
  mailerActive: boolean;
  cloudinaryActive: boolean;
  otpLength: number;
  sessionExpiry: string;
  enforceMfaAdmin: boolean;
  srsGlobalRetentionTarget: number;
  srsInitialInterval: number;
  moderationInterval: number;
  aiModerationGuidelines: string;
}

export const getSystemConfig = () =>
  api.get<ApiResponse<SystemConfigData>>('/api/v1/admin/config');

export const updateSystemConfig = (payload: Partial<SystemConfigData>) =>
  api.put<ApiResponse<SystemConfigData>>('/api/v1/admin/config', payload);

// ─── Moderation ───────────────────────────────────────────────────────────────
export const getPendingSets = () =>
  api.get<ApiResponse<any[]>>('/api/v1/admin/moderation/pending');

export const getModerationLogs = (page: number = 1, limit: number = 20) =>
  api.get<ApiResponse<any>>('/api/v1/admin/moderation/logs', { params: { page, limit } });

export const overrideModeration = (payload: { setId: string; status: 'approved' | 'rejected'; reason: string }) =>
  api.put<ApiResponse<any>>('/api/v1/admin/moderation/override', payload);

export const runAutoModeration = () =>
  api.post<ApiResponse<any>>('/api/v1/admin/moderation/run');
