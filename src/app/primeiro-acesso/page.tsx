"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { usePlatform } from "@/context/PlatformContext";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

function FirstAccessForm() {
  const searchParams = useSearchParams();
  const { platform_name } = usePlatform();

  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Link inválido ou expirado. Solicite um novo ao administrador.");
      return;
    }
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/auth/first-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_token: token, new_password: password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const detail = body?.detail ?? "";
        if (detail === "Invalid or expired invite token") {
          setError("Este link já foi usado ou expirou. Solicite um novo ao administrador.");
        } else {
          setError(detail || `Erro ${res.status}. Tente novamente.`);
        }
        return;
      }
      setDone(true);
      // Sign out any existing session so the new user logs in fresh
      setTimeout(() => signOut({ callbackUrl: "/login" }), 2500);
    } catch (err) {
      console.error("[primeiro-acesso]", err);
      setError("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
        <div className="w-full max-w-sm text-center">
          <p className="text-zinc-400">Link inválido. Solicite um novo convite ao administrador.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-sm">
        {/* Logo / brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand">
            <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-white" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-zinc-100">{platform_name}</h1>
          <p className="mt-1 text-sm text-zinc-400">Crie sua senha para ativar o acesso</p>
        </div>

        {done ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-6 py-8 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="mx-auto mb-3 h-10 w-10 text-emerald-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-semibold text-emerald-400">Conta ativada com sucesso!</p>
            <p className="mt-1 text-sm text-zinc-400">Redirecionando para o login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Nova senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoFocus
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none ring-brand focus:border-transparent focus:ring-2"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Confirmar senha</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repita a senha"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none ring-brand focus:border-transparent focus:ring-2"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white transition hover:bg-accent disabled:opacity-60"
            >
              {loading ? "Ativando..." : "Ativar conta"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function PrimeiroAcessoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-brand" />
        </div>
      }
    >
      <FirstAccessForm />
    </Suspense>
  );
}
