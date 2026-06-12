import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

export const setupInterceptors = (
  getToken: () => string | null,
  refreshToken: () => Promise<void>,
) => {
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
        await refreshToken();
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
