import api from '../lib/api';
import { ApiResponse } from '../types/api';
import {
  UpdateProfileRequest,
  RequestEmailChangeRequest,
  ConfirmEmailChangeRequest,
  User,
} from '../types/user';

export const getProfile = () => api.get<ApiResponse<User>>('/api/v1/user/profile');

export const updateProfile = (payload: UpdateProfileRequest) =>
  api.put<ApiResponse<User>>('/api/v1/user/profile', payload);

export const requestEmailChange = (payload: RequestEmailChangeRequest) =>
  api.post<ApiResponse<null>>('/api/v1/user/request-email-change', payload);

export const confirmEmailChange = (payload: ConfirmEmailChangeRequest) =>
  api.post<ApiResponse<null>>('/api/v1/user/confirm-email-change', payload);

export interface LearningProfile {
  learningGoal: "ielts" | "toeic" | "business" | "travel" | "general" | "other";
  targetLevel?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  currentLevel?: "beginner" | "intermediate" | "advanced";
  dailyGoal: number;
  reviewPerDay: number;
  reminderTime?: string;
  timezone?: string;
  preferences?: {
    pushNotification?: boolean;
    emailNotification?: boolean;
    soundEffect?: boolean;
  };
}

export const getLearningProfile = () =>
  api.get<ApiResponse<LearningProfile>>('/api/v1/user/learning-profile');

export const updateLearningProfile = (payload: Partial<LearningProfile>) =>
  api.put<ApiResponse<LearningProfile>>('/api/v1/user/learning-profile', payload);

export const changePassword = (payload: { oldPassword: string; newPassword: string }) =>
  api.post<ApiResponse<{ mfaRequired: boolean; message?: string }>>('/api/v1/user/change-password', payload);

export const verifyChangePassword = (payload: { oldPassword: string; newPassword: string; otp: string }) =>
  api.post<ApiResponse<{ message: string }>>('/api/v1/user/change-password/verify', payload);

