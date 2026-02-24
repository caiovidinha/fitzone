/**
 * Mock settings store backed by localStorage.
 *
 * Activated when NEXT_PUBLIC_USE_MOCK_API=true in .env.local.
 * This lets you test the admin settings page without a running backend.
 *
 * Add to .env.local:
 *   NEXT_PUBLIC_USE_MOCK_API=true
 *
 * Remove (or set to false) when connecting to a real backend.
 */
import type { PlatformSettings } from "@/types";
import { PLATFORM_DEFAULTS } from "./settings";

const STORAGE_KEY = "mock_platform_settings";

export const isMockApi = () =>
  process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

export function getMockSettings(): PlatformSettings {
  if (typeof window === "undefined") return PLATFORM_DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...PLATFORM_DEFAULTS, ...JSON.parse(raw) } : PLATFORM_DEFAULTS;
  } catch {
    return PLATFORM_DEFAULTS;
  }
}

export function saveMockSettings(data: Partial<PlatformSettings>): PlatformSettings {
  const next = { ...getMockSettings(), ...data };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota errors in constrained environments
  }
  return next;
}

export function resetMockSettings(): PlatformSettings {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return PLATFORM_DEFAULTS;
}
