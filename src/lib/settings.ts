import type { PlatformSettings } from "@/types";

export const PLATFORM_DEFAULTS: PlatformSettings = {
  platform_name: "FitZone",
  logo_url: null,
  primary_color: "#f97316",
  accent_color: "#ea580c",
};

/**
 * Server-side helper: fetches platform settings from the backend.
 * Used only in Server Components (root layout, generateMetadata).
 *
 * Falls back to PLATFORM_DEFAULTS when:
 *  - BACKEND_URL is not set (local dev without a backend)
 *  - The backend is unreachable
 *  - NEXT_PUBLIC_USE_MOCK_API=true (mock/test mode)
 */
export async function getPlatformSettings(): Promise<PlatformSettings> {
  // Mock mode: return defaults immediately (mock state lives in localStorage, client-side only)
  if (process.env.NEXT_PUBLIC_USE_MOCK_API === "true") {
    return PLATFORM_DEFAULTS;
  }

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) return PLATFORM_DEFAULTS;

  try {
    const res = await fetch(`${backendUrl}/settings`, {
      next: { revalidate: 60 }, // ISR: re-fetch once per minute at most
    });
    if (!res.ok) return PLATFORM_DEFAULTS;
    return res.json();
  } catch {
    return PLATFORM_DEFAULTS;
  }
}
