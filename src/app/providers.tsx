"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { setAxiosToken } from "@/lib/api";

// Signed stream URLs expire after a few minutes — they must NOT be cached for long.
export const STREAM_URL_STALE_MS = 4 * 60 * 1000; // 4 min
export const STREAM_URL_GC_MS = 5 * 60 * 1000;    // GC at 5 min

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            retry: (failureCount, error: any) => {
              const status = error?.response?.status;
              if (status && status >= 400 && status < 500) return false;
              return failureCount < 1;
            },
            refetchOnWindowFocus: false,
            refetchOnReconnect: "always",
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {/* Must be inside QueryClientProvider so useQueryClient() works if ever needed */}
        <AxiosTokenSync />
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}

/**
 * Keeps the Axios token store in sync with the NextAuth session.
 * Token is set SYNCHRONOUSLY during render so it is available before any
 * child component's useQuery fires — no useEffect timing gap.
 */
function AxiosTokenSync() {
  const { data: session, status } = useSession();

  // Side-effect during render is intentional here: we need _accessToken set
  // before children mount and fire queries. React Strict Mode double-invokes
  // this but setAxiosToken is pure assignment so that is harmless.
  if (status !== "loading") {
    setAxiosToken(session?.accessToken ?? null, session?.error ?? null);
  }

  return null;
}

/**
 * Renders a loading screen while NextAuth is hydrating,
 * then renders children once the session is confirmed.
 * Use this in protected layouts to prevent queries from firing without a token.
 */
export function SessionGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <svg className="h-8 w-8 animate-spin text-zinc-600" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" className="opacity-75" />
        </svg>
      </div>
    );
  }

  return <>{children}</>;
}

