import { ApiFieldError } from '../types/api';

export type FieldErrors = Record<string, string>;

export const extractFieldErrors = (error: any): FieldErrors => {
  const apiErrors = error?.response?.data?.errors as ApiFieldError[] | undefined;
  if (!Array.isArray(apiErrors)) return {};

  return apiErrors.reduce((acc: FieldErrors, err) => {
    if (err?.field && err?.message && !acc[err.field]) {
      acc[err.field] = err.message;
    }
    return acc;
  }, {} as FieldErrors);
};

export const getErrorMessage = (error: any, fallback: string) => {
  return error?.response?.data?.message || fallback;
};
