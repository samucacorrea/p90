import axios from "axios";
import { getToken } from "./auth";

const defaultApiBaseUrl =
  process.env.NODE_ENV === "production"
    ? "https://back.p90.pro/api"
    : "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || defaultApiBaseUrl,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
