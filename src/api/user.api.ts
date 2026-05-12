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

