"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PlatformSettings } from "@/types";
import { PLATFORM_DEFAULTS } from "@/lib/settings";

const PlatformContext = createContext<PlatformSettings>(PLATFORM_DEFAULTS);

export function PlatformProvider({
  value,
  children,
}: {
  value: PlatformSettings;
  children: ReactNode;
}) {
  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  );
}

/** Access platform settings (name, logo, colors) from any client component. */
export function usePlatform(): PlatformSettings {
  return useContext(PlatformContext);
}
