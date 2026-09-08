import axios from "axios";

const isElectron = typeof window !== "undefined" && window.localApi === true;

const LOCAL_BASE_URL = "http://127.0.0.1:4321/api";
const BROWSER_DEV_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: isElectron ? LOCAL_BASE_URL : BROWSER_DEV_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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

export const getImageUrl = (filename, type) => {
  if (!filename) return null;
  if (filename.startsWith("http")) return filename;
  const base = api.defaults.baseURL.replace(/\/api\/?$/, "");
  return `${base}/images/${type}/${filename}`;
};

export default api;