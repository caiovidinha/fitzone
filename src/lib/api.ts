import axios from "axios";
import type { PageParams, PlatformSettings, Student } from "@/types";
import { isMockApi, getMockSettings, saveMockSettings } from "./mock-settings";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000",
  timeout: 15000,
});

/**
 * Public API — no auth interceptors.
 * Use for endpoints that must work without a session (first-access, etc.)
 */
const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000",
  timeout: 15000,
});

// ---------------------------------------------------------------------------
// Token store — kept in sync by <AxiosTokenSync> in providers.tsx.
// Reading from a module variable instead of calling getSession() avoids the
// async race-condition that caused requests to fire without a token during
// client-side navigation.
// ---------------------------------------------------------------------------
let _accessToken: string | null = null;
let _sessionError: string | null = null;

/** Called from <AxiosTokenSync> whenever the NextAuth session changes. */
export function setAxiosToken(token: string | null, error?: string | null) {
  _accessToken = token;
  _sessionError = error ?? null;
}

api.interceptors.request.use((config) => {
  // If the refresh token has expired, bail out immediately.
  if (_sessionError === "RefreshTokenExpired") {
    forceLogout();
    return Promise.reject(new Error("Session expired"));
  }

  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

let redirecting = false;

function forceLogout() {
  if (typeof window !== "undefined" && !redirecting) {
    redirecting = true;
    // signOut from next-auth clears the session cookie before navigating
    import("next-auth/react").then(({ signOut }) =>
      signOut({ callbackUrl: "/login" })
    );
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    // Only force logout if we actually had a token that the server rejected.
    // If _accessToken is null the session hasn't loaded yet — not an auth failure.
    if (error.response?.status === 401 && _accessToken !== null) {
      forceLogout();
    }
    return Promise.reject(error);
  }
);

export default api;

/**
 * Safely extracts an items array from a paginated response or a direct array.
 * Handles both `{ items: T[] }` and `T[]` shapes so callers are
 * resilient to backend shape changes or stale React Query cache entries.
 */
export function extractItems<T>(r: { data: any }): T[] {
  const d = r.data;
  return Array.isArray(d) ? d : (d?.items ?? []);
}

// ---------------------------------------------------------------------------
// Categories — text-only (no images). Create/update use JSON.
// ---------------------------------------------------------------------------
export const categoriesApi = {
  list: (params?: PageParams) =>
    api.get("/categories", { params }),
  get: (id: string) =>
    api.get(`/categories/${id}`),
  create: (data: { name: string; description?: string; order?: number }) =>
    api.post("/categories", data),
  update: (id: string, data: { name?: string; description?: string; order?: number }) =>
    api.patch(`/categories/${id}`, data),
  remove: (id: string) =>
    api.delete(`/categories/${id}`),
};

// ---------------------------------------------------------------------------
// Subcategories — have cover image; belong to one or more categories.
// Create/update use multipart/form-data.
// ---------------------------------------------------------------------------
export const subcategoriesApi = {
  list: (params?: PageParams & { category_id?: string }) =>
    api.get("/subcategories", { params }),
  get: (id: string) =>
    api.get(`/subcategories/${id}`),
  create: (data: FormData) =>
    api.post("/subcategories", data),
  update: (id: string, data: FormData) =>
    api.patch(`/subcategories/${id}`, data),
  remove: (id: string) =>
    api.delete(`/subcategories/${id}`),
};

// ---------------------------------------------------------------------------
// Videos
// ---------------------------------------------------------------------------
export const videosApi = {
  /**
   * List videos. Supports cursor-based pagination for large catalogs.
   * When subcategoryId is omitted, returns all (published for students, all for admin).
   */
  list: (subcategoryId?: string, params?: PageParams) =>
    api.get("/videos", { params: { subcategory_id: subcategoryId, ...params } }),
  get: (id: string) =>
    api.get(`/videos/${id}`),
  /**
   * Returns a short-lived signed HLS URL from Bunny.net.
   * Never cached long-term — the token expires.
   */
  getStream: (id: string) =>
    api.get(`/videos/${id}/stream`),
  /**
   * Step 1 of upload: POST metadata to backend.
   * Backend creates the Bunny video slot and returns the presigned upload URL.
   * Returns { id, bunny_video_id, upload_url }
   */
  create: (data: { title: string; description?: string; subcategory_id?: string }) =>
    api.post<{ id: string; bunny_video_id: string; upload_url: string }>("/videos", data),
  /**
   * Step 2 of upload: PUT the video file to upload_url.
   *
   * • Real Bunny URL (video.bunnycdn.com / b-cdn.net) → raw XHR so we get
   *   upload progress without CORS issues (Bunny allows it).
   * • Backend-local URL (same host as NEXT_PUBLIC_BACKEND_URL, e.g. a mock
   *   endpoint during dev) → Axios PUT so the browser doesn't fire a
   *   cross-origin OPTIONS preflight that the mock handler can't answer.
   */
  uploadToBunny: (
    uploadUrl: string,
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<void> => {
    const backendBase = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000").replace(/\/$/, "");
    const isLocalUpload = uploadUrl.startsWith(backendBase) || uploadUrl.startsWith("/");

    if (isLocalUpload) {
      // Strip the base so Axios uses its own baseURL (avoids double-host)
      const path = uploadUrl.startsWith(backendBase)
        ? uploadUrl.slice(backendBase.length)
        : uploadUrl;
      return api.put(path, file, {
        headers: { "Content-Type": file.type || "application/octet-stream" },
        onUploadProgress: (e) => {
          if (e.total) onProgress?.(Math.round((e.loaded / e.total) * 100));
        },
      }).then(() => undefined);
    }

    // Real Bunny CDN — use XHR for accurate progress reporting
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Bunny upload failed: ${xhr.status}`)));
      xhr.onerror = () => reject(new Error("Bunny upload network error"));
      xhr.send(file);
    });
  },
  update: (id: string, data: object) =>
    api.patch(`/videos/${id}`, data),
  updateThumbnail: (id: string, file: File) => {
    const fd = new FormData();
    fd.append("thumbnail", file);
    return api.post(`/videos/${id}/thumbnail`, fd);
  },
  remove: (id: string) =>
    api.delete(`/videos/${id}`),
  reorder: (categoryId: string, ids: string[]) =>
    api.post(`/categories/${categoryId}/reorder-videos`, { ids }),
};

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------
export const studentsApi = {
  list: (params?: PageParams & { search?: string }) =>
    api.get("/students", { params }),
  invite: (data: { email: string; name: string }) =>
    api.post<Student & { invite_url: string }>("/students/invite", data),
  update: (id: string, data: { name?: string; is_active?: boolean }) =>
    api.patch(`/students/${id}`, data),
  revoke: (id: string) =>
    api.delete(`/students/${id}`),
  resendInvite: (id: string) =>
    api.post<Student & { invite_url: string }>(`/students/${id}/resend-invite`),
};

// ---------------------------------------------------------------------------
// Auth helpers (no session required — uses publicApi to bypass token interceptor)
// ---------------------------------------------------------------------------
export const authApi = {
  firstAccess: (invite_token: string, new_password: string) =>
    publicApi.post("/auth/first-access", { invite_token, new_password }),
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
  uploadLogo: (file: File): Promise<{ data: PlatformSettings }> => {
    if (isMockApi()) {
      const url = URL.createObjectURL(file);
      return Promise.resolve({ data: saveMockSettings({ logo_url: url }) });
    }
    const fd = new FormData();
    fd.append("logo", file);
    return api.post<PlatformSettings>("/settings/logo", fd);
  },
  uploadFavicon: (file: File): Promise<{ data: PlatformSettings }> => {
    if (isMockApi()) {
      const url = URL.createObjectURL(file);
      return Promise.resolve({ data: saveMockSettings({ favicon_url: url }) });
    }
    const fd = new FormData();
    fd.append("favicon", file);
    return api.post<PlatformSettings>("/settings/favicon", fd);
  },
};

