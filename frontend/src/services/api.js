import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fpis_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("fpis_token");
      localStorage.removeItem("fpis_user");
      if (window.location.pathname !== "/login") window.location.assign("/login");
    }
    return Promise.reject(error);
  },
);

export const getErrorMessage = (error) => {
  if (!error.response && error.request) {
    return `Cannot reach the FPIS API at ${api.defaults.baseURL}. Start the backend and try again. The demo profile uses an in-memory database; PostgreSQL is only needed for the local profile.`;
  }
  return error.response?.data?.message || error.response?.data?.error || error.message || "Request failed.";
};

export default api;
