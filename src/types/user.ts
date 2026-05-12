export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  isVerified: boolean;
  role?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  avatar?: string;
}

export interface RequestEmailChangeRequest {
  newEmail: string;
}

export interface ConfirmEmailChangeRequest {
  newEmail: string;
  otp: string;
}

