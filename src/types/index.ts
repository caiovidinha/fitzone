// ---------------------------------------------------------------------------
// Platform Settings — admin-configurable branding
// ---------------------------------------------------------------------------
export interface PlatformSettings {
  platform_name: string;
  logo_url: string | null;
  favicon_url: string | null;
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

// ---------------------------------------------------------------------------
// Categories — text-only (name, description, order).
// Images and video grouping live in subcategories.
// ---------------------------------------------------------------------------
export interface Category {
  id: string;
  name: string;
  description?: string | null;
  order: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Subcategories — belong to one or more categories; have cover image.
// ---------------------------------------------------------------------------
export interface Subcategory {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  order: number;
  created_at: string;
  categories: Category[];
}

// ---------------------------------------------------------------------------
// Videos
// ---------------------------------------------------------------------------
export interface Video {
  id: string;
  title: string;
  description?: string | null;
  subcategory_id?: string | null;
  bunny_video_id: string;
  thumbnail_url?: string | null;
  duration?: number | null; // seconds
  is_published: boolean;
  created_at: string;
  upload_url?: string; // only present in POST /videos response
}

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------
export interface Student {
  id: string;
  email: string;
  name: string;
  role: "student";
  is_active: boolean;
  created_at: string;
  /** Present only in invite/resend-invite responses */
  invite_url?: string;
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
// The backend returns a `next_cursor` opaque string instead of page numbers.
// When next_cursor is null, there are no more pages.
// ---------------------------------------------------------------------------
export interface CursorPage<T> {
  items: T[];
  next_cursor: string | null;
  total?: number; // optional — only provided on first page for display
}

export interface PageParams {
  cursor?: string;
  limit?: number;
}
