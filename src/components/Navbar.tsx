"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn, getInitials } from "@/lib/utils";
import { usePlatform } from "@/context/PlatformContext";
import { useState } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { platform_name, logo_url } = usePlatform();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/browse" className="flex items-center gap-2.5 font-bold text-zinc-100">
          {logo_url ? (
            <Image src={logo_url} alt={platform_name} width={32} height={32} unoptimized className="h-8 w-8 rounded-lg object-cover" onError={(e) => console.error('[Navbar] Logo failed to load:', logo_url, e)} />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
          )}
          <span className="text-lg">{platform_name}</span>
        </Link>

        {/* Right side */}
        <div className="relative flex items-center gap-3">
          {session?.user.role === "admin" && (
            <Link
              href="/admin"
              className={cn(
                "hidden rounded-lg px-3 py-1.5 text-sm font-medium transition sm:block",
                pathname.startsWith("/admin")
                  ? "bg-brand/15 text-brand"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              )}
            >
              Admin
            </Link>
          )}

          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/20 text-sm font-semibold text-brand ring-1 ring-brand/30 transition hover:bg-brand/30"
          >
            {session?.user.name ? getInitials(session.user.name) : "?"}
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-12 z-50 min-w-45 rounded-xl border border-zinc-800 bg-zinc-900 p-1 shadow-2xl">
                <div className="border-b border-zinc-800 px-3 py-2.5">
                  <p className="text-sm font-medium text-zinc-100">{session?.user.name}</p>
                  <p className="text-xs text-zinc-500">{session?.user.email}</p>
                </div>
                {session?.user.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100 sm:hidden"
                  >
                    Painel Admin
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-red-400"
                >
                  Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
