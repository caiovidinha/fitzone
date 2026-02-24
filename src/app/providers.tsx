"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// Signed stream URLs expire after a few minutes — they must NOT be cached for long.
export const STREAM_URL_STALE_MS = 4 * 60 * 1000; // 4 min
export const STREAM_URL_GC_MS = 5 * 60 * 1000;    // GC at 5 min

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Metadata (categories, video info) — safe to cache for a while
            staleTime: 2 * 60 * 1000,      // 2 min before background refetch
            gcTime: 10 * 60 * 1000,         // keep in memory for 10 min
            retry: 1,                        // don't hammer the API on failure
            refetchOnWindowFocus: false,     // avoid surprise re-fetches in academy wifi
            refetchOnReconnect: "always",    // but do refetch when network comes back
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SessionProvider>
  );
}
