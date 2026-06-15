import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

export const authApi = axios.create({
  baseURL: import.meta.env.VITE_AUTH_URL ?? "",
  withCredentials: true,
});

export const setupInterceptors = (
  getToken: () => string | null,
  refreshToken: () => Promise<void>,
) => {
  // Single-flight: if many requests 401 at once (e.g. on tab refocus), they
  // all await the same refresh instead of firing one each.
  let refreshPromise: Promise<void> | null = null;

  api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      const url = originalRequest?.url ?? "";
      const isAuthRefresh = url.includes("/auth/refresh");
      const isAuthLogout = url.includes("/auth/logout");

      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !isAuthRefresh &&
        !isAuthLogout
      ) {
        originalRequest._retry = true;
        try {
          if (!refreshPromise) {
            refreshPromise = refreshToken().finally(() => {
              refreshPromise = null;
            });
          }
          await refreshPromise;
        } catch {
          return Promise.reject(error);
        }
        const token = getToken();
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return api(originalRequest);
      }
      return Promise.reject(error);
    },
  );
};

export default api;
