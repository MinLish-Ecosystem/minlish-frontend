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

export const resetUserAuthApi = (id: string, email: string) =>
  api.post<ApiResponse<any>>(`/api/v1/admin/users/${id}/reset-auth`, { email });

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

export const getSystemHealth = () =>
  api.get<ApiResponse<{
    mongodb: boolean;
    redis: boolean;
    gemini: boolean;
    mailer: boolean;
    cloudinary: boolean;
    redisConfigured: boolean;
  }>>('/api/v1/admin/health');


// ─── Moderation ───────────────────────────────────────────────────────────────
export const getPendingSets = () =>
  api.get<ApiResponse<any[]>>('/api/v1/admin/moderation/pending');

export const getModerationLogs = (page: number = 1, limit: number = 20) =>
  api.get<ApiResponse<any>>('/api/v1/admin/moderation/logs', { params: { page, limit } });

export const overrideModeration = (payload: { setId: string; status: 'approved' | 'rejected'; reason: string }) =>
  api.put<ApiResponse<any>>('/api/v1/admin/moderation/override', payload);

export const runAutoModeration = () =>
  api.post<ApiResponse<any>>('/api/v1/admin/moderation/run');

// ─── Post Moderation & Management ──────────────────────────────────────────────
export const getPendingPosts = () =>
  api.get<ApiResponse<any[]>>('/api/v1/admin/moderation/posts/pending');

export const overridePostModeration = (payload: { postId: string; status: 'approved' | 'rejected'; reason: string }) =>
  api.put<ApiResponse<any>>('/api/v1/admin/moderation/posts/override', payload);

export const listAllPosts = (page: number = 1, limit: number = 20, tab: 'published' | 'drafts' | 'pending' | 'moderated' = 'published', q?: string, sort?: string, status?: string) =>
  api.get<ApiResponse<any>>('/api/v1/admin/posts', { params: { page, limit, tab, q, sort, status } });
