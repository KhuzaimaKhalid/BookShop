import axios from "axios";

// Check if running inside Electron environment
const isElectron = typeof window !== "undefined" && window.localApi === true;

// Define Remote and Local Endpoints
const REMOTE_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const LOCAL_BASE_URL = "http://127.0.0.1:4321/api";

const api = axios.create({
  baseURL: REMOTE_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    // Routes that MUST fetch live data from the main/remote database in real time
    const bypassLocalCache =
      config.url?.includes("/sales") ||
      config.url?.includes("/invoice") ||
      config.url?.includes("/expenses") ||
      config.url?.includes("/user") ||
      config.url?.includes("/business") ||
      config.url?.includes("/report");

    // Force local SQLite base URL ONLY for non-realtime GET calls in Electron (e.g. static products/categories)
    if (isElectron && config.method === "get" && !bypassLocalCache) {
      config.baseURL = LOCAL_BASE_URL;
    } else {
      config.baseURL = REMOTE_BASE_URL;
    }

    // Attach Bearer Token if available
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;