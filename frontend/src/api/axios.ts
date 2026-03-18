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
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        await refreshToken();
        const token = getToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      }
      return Promise.reject(error);
    },
  );
};

export default api;
