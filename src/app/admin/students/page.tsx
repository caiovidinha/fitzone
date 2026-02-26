"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentsApi, extractItems } from "@/lib/api";
import type { Student } from "@/types";
import { getInitials, formatDate } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// LinkModal — mostra o link gerado e permite copiar
// ---------------------------------------------------------------------------
function LinkModal({ inviteUrl, onClose }: { inviteUrl: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const url = inviteUrl;

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-emerald-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
        </div>
        <h2 className="mb-1 text-lg font-semibold text-zinc-100">Link de convite gerado!</h2>
        <p className="mb-5 text-sm text-zinc-400">
          Compartilhe este link com o aluno. Ele poderá criar email e senha para acessar a plataforma.
        </p>

        <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3">
          <span className="min-w-0 flex-1 truncate text-sm text-zinc-300">{url}</span>
          <button
            onClick={copy}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              copied
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-zinc-700 text-zinc-200 hover:bg-zinc-600"
            }`}
          >
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>

        <p className="mt-3 text-xs text-zinc-500">
          O link expira após o primeiro uso.
        </p>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// InviteModal — dois passos: formulário → link gerado
// ---------------------------------------------------------------------------
function InviteModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => studentsApi.invite({ name, email }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["students"] });
      setInviteUrl(res.data.invite_url);
    },
    onError: () => setError("Erro ao gerar convite. Verifique o email e tente novamente."),
  });

  // Step 2: link display
  if (inviteUrl) {
    return <LinkModal inviteUrl={inviteUrl} onClose={onClose} />;
  }

  // Step 1: form
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <h2 className="mb-1 text-lg font-semibold text-zinc-100">Convidar aluno</h2>
        <p className="mb-5 text-sm text-zinc-400">
          Preencha os dados e um link de acesso será gerado para você compartilhar.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !email.trim()) { setError("Preencha todos os campos."); return; }
            mutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Nome completo</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="João Silva"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none ring-brand focus:border-transparent focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="joao@email.com"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none ring-brand focus:border-transparent focus:ring-2"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-zinc-400 transition hover:text-zinc-100">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
              {mutation.isPending ? "Gerando..." : "Gerar link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default function StudentsPage() {
  const qc = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [search, setSearch] = useState("");
  const [linkUrl, setLinkUrl] = useState<string | null>(null);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () => studentsApi.list(),
    select: (r) => extractItems<Student>(r),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => studentsApi.revoke(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });

  const genLinkMutation = useMutation({
    mutationFn: (id: string) => studentsApi.resendInvite(id),
    onSuccess: (res) => setLinkUrl(res.data.invite_url),
  });

  const filtered = students?.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Alunos</h1>
          <p className="mt-0.5 text-sm text-zinc-400">Gerencie o acesso dos alunos à plataforma</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Convidar aluno
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative w-full max-w-xs">
          <svg viewBox="0 0 24 24" fill="none" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2 pl-9 pr-4 text-sm text-zinc-300 outline-none focus:border-brand"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/80">
            <tr>
              <th className="px-4 py-3 font-medium text-zinc-400">Aluno</th>
              <th className="hidden px-4 py-3 font-medium text-zinc-400 md:table-cell">Convidado em</th>
              <th className="px-4 py-3 font-medium text-zinc-400">Status</th>
              <th className="px-4 py-3 font-medium text-zinc-400">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-800" />
                        <div>
                          <div className="h-4 w-28 animate-pulse rounded bg-zinc-800" />
                          <div className="mt-1 h-3 w-36 animate-pulse rounded bg-zinc-800" />
                        </div>
                      </div>
                    </td>
                    <td colSpan={4} />
                  </tr>
                ))
              : (filtered ?? []).map((student) => (
                  <tr key={student.id} className="transition hover:bg-zinc-900/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/20 text-xs font-semibold text-brand">
                          {getInitials(student.name)}
                        </div>
                        <div>
                          <p className="font-medium text-zinc-100">{student.name}</p>
                          <p className="text-xs text-zinc-500">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-zinc-400 md:table-cell">
                      {formatDate(student.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          student.is_active
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-zinc-800 text-zinc-500"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${student.is_active ? "bg-emerald-400" : "bg-zinc-500"}`} />
                        {student.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => genLinkMutation.mutate(student.id)}
                          disabled={genLinkMutation.isPending}
                          title="Gerar link de acesso"
                          className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-brand disabled:opacity-40"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Revogar acesso de ${student.name}?`)) {
                              revokeMutation.mutate(student.id);
                            }
                          }}
                          title="Revogar acesso"
                          className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-red-400"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {!isLoading && filtered?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
            <p className="text-sm">{search ? "Nenhum aluno encontrado." : "Nenhum aluno cadastrado ainda."}</p>
          </div>
        )}
      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
      {linkUrl && <LinkModal inviteUrl={linkUrl} onClose={() => setLinkUrl(null)} />}
    </div>
  );
}
