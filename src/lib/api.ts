import axios from "axios";
import { getSession } from "next-auth/react";
import type { PageParams, PlatformSettings } from "@/types";
import { isMockApi, getMockSettings, saveMockSettings } from "./mock-settings";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000",
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export const categoriesApi = {
  list: (params?: PageParams) =>
    api.get("/categories", { params }),
  get: (id: string) =>
    api.get(`/categories/${id}`),
  create: (data: FormData) =>
    api.post("/categories", data, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id: string, data: FormData) =>
    api.patch(`/categories/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } }),
  remove: (id: string) =>
    api.delete(`/categories/${id}`),
  reorder: (ids: string[]) =>
    api.post("/categories/reorder", { ids }),
};

// ---------------------------------------------------------------------------
// Videos
// ---------------------------------------------------------------------------
export const videosApi = {
  /**
   * List videos. Supports cursor-based pagination for large catalogs.
   * When categoryId is omitted, returns all published videos (admin).
   */
  list: (categoryId?: string, params?: PageParams) =>
    api.get("/videos", { params: { category_id: categoryId, ...params } }),
  get: (id: string) =>
    api.get(`/videos/${id}`),
  /**
   * Returns a short-lived signed HLS URL from Bunny.net.
   * Never cached long-term — the token expires.
   */
  getStream: (id: string) =>
    api.get(`/videos/${id}/stream`),
  create: (data: FormData) =>
    api.post("/videos", data, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id: string, data: object) =>
    api.patch(`/videos/${id}`, data),
  remove: (id: string) =>
    api.delete(`/videos/${id}`),
  reorder: (categoryId: string, ids: string[]) =>
    api.post(`/categories/${categoryId}/reorder-videos`, { ids }),
};

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------
export const studentsApi = {
  list: (params?: PageParams) =>
    api.get("/students", { params }),
  invite: (data: { email: string; name: string }) =>
    api.post("/students/invite", data),
  revoke: (id: string) =>
    api.delete(`/students/${id}`),
  resendInvite: (id: string) =>
    api.post(`/students/${id}/resend-invite`),
};

// ---------------------------------------------------------------------------
// Platform Settings
// Mock mode (NEXT_PUBLIC_USE_MOCK_API=true) stores values in localStorage
// so you can test the admin settings page without a running backend.
// ---------------------------------------------------------------------------
export const settingsApi = {
  get: (): Promise<{ data: PlatformSettings }> => {
    if (isMockApi()) return Promise.resolve({ data: getMockSettings() });
    return api.get<PlatformSettings>("/settings");
  },
  update: (data: Partial<PlatformSettings>): Promise<{ data: PlatformSettings }> => {
    if (isMockApi()) return Promise.resolve({ data: saveMockSettings(data) });
    return api.patch<PlatformSettings>("/settings", data);
  },
};

