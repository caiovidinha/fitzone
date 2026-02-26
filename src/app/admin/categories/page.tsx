"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesApi, extractItems } from "@/lib/api";
import type { Category } from "@/types";
import Link from "next/link";

function CategoryFormModal({
  category,
  onClose,
}: {
  category?: Category;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = !!category;
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => {
      const payload = { name, description: description || undefined };
      if (isEdit) return categoriesApi.update(category!.id, payload);
      return categoriesApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      onClose();
    },
    onError: () => setError("Erro ao salvar. Tente novamente."),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <h2 className="mb-5 text-lg font-semibold text-zinc-100">
          {isEdit ? "Editar categoria" : "Nova categoria"}
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) { setError("Nome e obrigatorio."); return; }
            mutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Nome *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Calistenia"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none ring-brand focus:border-transparent focus:ring-2"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Descricao</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional — descreva esta categoria..."
              rows={3}
              className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none ring-brand focus:border-transparent focus:ring-2"
            />
          </div>

          <p className="text-xs text-zinc-500">
            Categorias sao apenas rotulos de texto. As imagens e grupos ficam nas subcategorias.
          </p>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-zinc-400 transition hover:text-zinc-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent disabled:opacity-60"
            >
              {mutation.isPending ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<null | "new" | Category>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list(),
    select: (r) => extractItems<Category>(r),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Categorias</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            Rotulos de texto para agrupar subcategorias
          </p>
        </div>
        <button
          onClick={() => setModal("new")}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nova categoria
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-900" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4"
            >
              <div>
                <p className="font-semibold text-zinc-100">{cat.name}</p>
                {cat.description && (
                  <p className="mt-0.5 text-sm text-zinc-500">{cat.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/subcategories?category_id=${cat.id}`}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-orange-400/60 hover:text-orange-400"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z" />
                  </svg>
                  Subcategorias
                </Link>
                <button
                  onClick={() => setModal(cat)}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-brand hover:text-brand"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  Editar
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Excluir "${cat.name}"?`)) deleteMutation.mutate(cat.id);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-red-500/50 hover:text-red-400"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Excluir
                </button>
              </div>
            </div>
          ))}

          {categories.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
              <p className="text-sm">Nenhuma categoria ainda.</p>
            </div>
          )}
        </div>
      )}

      {modal && (
        <CategoryFormModal
          category={modal !== "new" ? (modal as Category) : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
