import api from "../lib/api";
import { ApiResponse } from "../types/api";
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  VerifyEmailRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "../types/auth";

export const login = (payload: LoginRequest) =>
  api.post<ApiResponse<LoginResponse>>("/api/v1/auth/login", payload);

export const register = (payload: RegisterRequest) =>
  api.post<ApiResponse<{ message: string }>>("/api/v1/auth/register", payload);

export const verifyEmail = (payload: VerifyEmailRequest) =>
  api.post<ApiResponse<null>>("/api/v1/auth/verify-email", payload);

export const forgotPassword = (payload: ForgotPasswordRequest) =>
  api.post<ApiResponse<{ message: string }>>(
    "/api/v1/auth/forgot-password",
    payload,
  );

export const resetPassword = (payload: ResetPasswordRequest) =>
  api.post<ApiResponse<{ message: string }>>(
    "/api/v1/auth/reset-password",
    payload,
  );

export const refreshToken = (refreshToken: string) =>
  api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
    "/api/v1/auth/refresh-token",
    { refreshToken },
  );

export const verifyMfaLoginApi = (payload: { email: string; otp: string }) =>
  api.post<ApiResponse<LoginResponse>>("/api/v1/auth/verify-mfa", payload);
