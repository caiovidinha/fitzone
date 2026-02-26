import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { UserRole } from "@/types";

/** How many milliseconds before expiry we proactively refresh (1 min buffer). */
const REFRESH_BUFFER_MS = 60 * 1000;

/** Decode a JWT's payload without verifying the signature (server-side only). */
function decodeJwtPayload(token: string): Record<string, unknown> {
  return JSON.parse(
    Buffer.from(token.split(".")[1], "base64url").toString("utf8")
  );
}

/** Call the backend refresh endpoint and return updated token fields, or null on failure. */
async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string; accessTokenExpires: number } | null> {
  try {
    const res = await fetch(`${process.env.BACKEND_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      console.error("[auth] refresh failed:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const payload = decodeJwtPayload(data.access_token);

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken, // re-use old if not rotated
      accessTokenExpires: (payload.exp as number) * 1000,
    };
  } catch (err) {
    console.error("[auth] refresh exception:", err);
    return null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${process.env.BACKEND_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            console.error("[auth] backend status:", res.status, await res.text());
            return null;
          }

          const data = await res.json();
          // Backend returns { access_token, refresh_token, token_type }
          const payload = decodeJwtPayload(data.access_token);

          return {
            id: payload.sub as string,
            name: payload.name as string,
            email: payload.email as string,
            role: payload.role as UserRole,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            accessTokenExpires: (payload.exp as number) * 1000,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // First sign-in: seed from the user object returned by authorize()
      if (user) {
        token.role = (user as any).role;
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.accessTokenExpires = (user as any).accessTokenExpires;
        token.id = user.id;
        token.error = undefined;
        return token;
      }

      // Access token still valid — nothing to do
      const expires = token.accessTokenExpires as number | undefined;
      if (expires && Date.now() < expires - REFRESH_BUFFER_MS) {
        return token;
      }

      // Token expired (or no expiry stored) — try to refresh
      const refreshToken = token.refreshToken as string | undefined;
      if (!refreshToken) {
        return { ...token, error: "RefreshTokenExpired" };
      }

      const refreshed = await refreshAccessToken(refreshToken);
      if (!refreshed) {
        return { ...token, error: "RefreshTokenExpired" };
      }

      return {
        ...token,
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        accessTokenExpires: refreshed.accessTokenExpires,
        error: undefined,
      };
    },
    async session({ session, token }) {
      session.user.role = token.role as UserRole;
      session.user.id = token.id as string;
      session.accessToken = token.accessToken as string;
      session.error = token.error as string | undefined;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 dias
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
    };
    accessToken: string;
    /** Set to "RefreshTokenExpired" when the refresh token is no longer valid. */
    error?: string;
  }
}
