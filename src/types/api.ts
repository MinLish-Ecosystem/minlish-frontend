export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ApiFieldError[];
  errorCode?: string;
}

