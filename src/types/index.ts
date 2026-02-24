// ---------------------------------------------------------------------------
// Platform Settings — admin-configurable branding
// ---------------------------------------------------------------------------
export interface PlatformSettings {
  platform_name: string;
  logo_url: string | null;
  primary_color: string; // hex, e.g. "#f97316"
  accent_color: string;  // hex, e.g. "#ea580c"
}

export type UserRole = "admin" | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  videoCount: number;
  order: number;
  createdAt: string;
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration: number; // seconds
  categoryId: string;
  categoryName?: string;
  bunnyVideoId: string;
  streamUrl?: string; // signed URL
  published: boolean;
  order: number;
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  invitedAt: string;
  lastSeen?: string;
  active: boolean;
}

export interface InvitePayload {
  email: string;
  name: string;
}

export interface ApiError {
  detail: string;
  status: number;
}

// ---------------------------------------------------------------------------
// Pagination — cursor-based (scales without OFFSET degradation)
// The backend returns a `nextCursor` opaque string instead of page numbers.
// When nextCursor is null, there are no more pages.
// ---------------------------------------------------------------------------
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  total?: number; // optional — only provided on first page for display
}

export interface PageParams {
  cursor?: string;
  limit?: number; // defaults to server-side PAGE_SIZE
}

/** @deprecated use CursorPage instead for new endpoints */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
