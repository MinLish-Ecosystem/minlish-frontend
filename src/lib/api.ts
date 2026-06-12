import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

let refreshPromise: Promise<string> | null = null;

const getRefreshToken = () => localStorage.getItem("minlish_refresh_token");

const clearAuthStorage = () => {
  localStorage.removeItem("minlish_user");
  localStorage.removeItem("minlish_token");
  localStorage.removeItem("minlish_refresh_token");
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("minlish_token");
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    } as typeof config.headers;
  }
  return config;
});

const shouldRefresh = (status?: number, errorCode?: string) => {
  const authErrorCodes = new Set([
    "ERR_TOKEN_EXPIRED",
    "ERR_TOKEN_REVOKED",
    "ERR_TOKEN_INVALID",
    "ERR_TOKEN_MISSING",
    "ERR_UNAUTHORIZED",
  ]);
  return status === 401 || (errorCode && authErrorCodes.has(errorCode));
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const errorCode = error?.response?.data?.errorCode as string | undefined;
    const status = error?.response?.status as number | undefined;
    const originalRequest = error?.config as any;

    if (!shouldRefresh(status, errorCode) || originalRequest?._retry) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearAuthStorage();
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
      return Promise.reject(error);
    }

    try {
      originalRequest._retry = true;
      if (!refreshPromise) {
        refreshPromise = refreshClient
          .post("/api/v1/auth/refresh-token", { refreshToken })
          .then((response) => {
            const newAccessToken = response?.data?.data?.accessToken as
              | string
              | undefined;
            const newRefreshToken = response?.data?.data?.refreshToken as
              | string
              | undefined;
            if (!newAccessToken || !newRefreshToken) {
              throw new Error("Missing refreshed tokens");
            }
            localStorage.setItem("minlish_token", newAccessToken);
            localStorage.setItem("minlish_refresh_token", newRefreshToken);
            return newAccessToken;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newToken = await refreshPromise;
      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${newToken}`,
      };
      return api(originalRequest);
    } catch (refreshError) {
      clearAuthStorage();
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
      return Promise.reject(refreshError);
    }
  },
);

export default api;
