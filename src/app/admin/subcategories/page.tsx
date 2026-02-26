"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { subcategoriesApi, categoriesApi, extractItems } from "@/lib/api";
import type { Category, Subcategory } from "@/types";
import Image from "next/image";

function SubcategoryFormModal({
  subcategory,
  onClose,
}: {
  subcategory?: Subcategory;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = !!subcategory;

  const [name, setName] = useState(subcategory?.name ?? "");
  const [description, setDescription] = useState(subcategory?.description ?? "");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    subcategory?.categories.map((c) => c.id) ?? []
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(subcategory?.image_url ?? "");
  const [removeImage, setRemoveImage] = useState(false);
  const [error, setError] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list({ limit: 100 }),
    select: (r) => extractItems<Category>(r),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("name", name);
      if (description) fd.append("description", description);
      // category_ids — send each one separately (multipart array)
      selectedCategoryIds.forEach((id) => fd.append("category_ids", id));
      if (imageFile) {
        fd.append("cover_image", imageFile);
      } else if (isEdit && removeImage) {
        fd.append("remove_cover", "true");
      }
      if (isEdit) return subcategoriesApi.update(subcategory!.id, fd);
      return subcategoriesApi.create(fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subcategories"] });
      onClose();
    },
    onError: () => setError("Erro ao salvar. Tente novamente."),
  });

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setPreview(URL.createObjectURL(f));
    setRemoveImage(false);
  }

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <h2 className="mb-5 text-lg font-semibold text-zinc-100">
          {isEdit ? "Editar subcategoria" : "Nova subcategoria"}
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) { setError("Nome é obrigatório."); return; }
            if (selectedCategoryIds.length === 0) { setError("Selecione ao menos uma categoria."); return; }
            mutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          {/* Image upload */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Foto de capa</label>
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-32 overflow-hidden rounded-xl bg-zinc-800">
                {preview && !removeImage ? (
                  <Image src={preview} alt="Preview" fill unoptimized className="object-cover" sizes="128px" onError={(e) => console.error('[Subcategories] Preview blob failed:', preview, e)} />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-600">
                    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-brand hover:text-brand">
                  {imageFile ? imageFile.name : "Escolher imagem"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
                </label>
                {(preview || subcategory?.image_url) && !removeImage && (
                  <button
                    type="button"
                    onClick={() => { setPreview(""); setImageFile(null); setRemoveImage(true); }}
                    className="text-xs text-zinc-500 hover:text-red-400 transition"
                  >
                    Remover imagem
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Nome *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Abdômen"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none ring-brand focus:border-transparent focus:ring-2"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional..."
              rows={2}
              className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none ring-brand focus:border-transparent focus:ring-2"
            />
          </div>

          {/* Category selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Categorias * <span className="text-zinc-500 font-normal">(pode selecionar mais de uma)</span>
            </label>
            {categories.length === 0 ? (
              <p className="text-sm text-zinc-500">Nenhuma categoria cadastrada ainda.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const selected = selectedCategoryIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`rounded-full px-3 py-1 text-sm transition ${
                        selected
                          ? "bg-brand text-white"
                          : "border border-zinc-700 text-zinc-400 hover:border-brand hover:text-brand"
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

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

export default function SubcategoriesPage() {
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const [modal, setModal] = useState<null | "new" | Subcategory>(null);
  const [filterCategory, setFilterCategory] = useState(searchParams.get("category_id") ?? "");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list({ limit: 100 }),
    select: (r) => extractItems<Category>(r),
  });

  const { data: subcategories = [], isLoading } = useQuery({
    queryKey: ["subcategories", filterCategory],
    queryFn: () =>
      subcategoriesApi.list({ category_id: filterCategory || undefined, limit: 100 }),
    select: (r) => extractItems<Subcategory>(r),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => subcategoriesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subcategories"] }),
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Subcategorias</h1>
          <p className="mt-0.5 text-sm text-zinc-400">Grupos com foto de capa dentro de cada categoria</p>
        </div>
        <button
          onClick={() => setModal("new")}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nova subcategoria
        </button>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 outline-none"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-50 animate-pulse rounded-2xl bg-zinc-900" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subcategories.map((sub) => (
            <div
              key={sub.id}
              className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"
            >
              <div className="relative h-32 w-full bg-zinc-800">
                {sub.image_url ? (
                  <Image
                    src={sub.image_url}
                    alt={sub.name}
                    fill
                    unoptimized
                    className="object-cover opacity-70"
                    sizes="(max-width: 1024px) 50vw, 33vw"
                    onError={(e) => console.error('[Subcategories] Image failed to load:', sub.image_url, e)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-700">
                    <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-zinc-900/80 to-transparent" />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-zinc-100">{sub.name}</h3>
                {sub.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{sub.description}</p>
                )}
                {sub.categories.length > 0 && (
                  <p className="mt-1.5 text-xs text-zinc-600">
                    {sub.categories.map((c) => c.name).join(" · ")}
                  </p>
                )}
                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setModal(sub)}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-brand hover:text-brand"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Excluir "${sub.name}"?`)) deleteMutation.mutate(sub.id);
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
            </div>
          ))}

          {subcategories.length === 0 && (
            <div className="col-span-3 flex flex-col items-center justify-center py-16 text-zinc-500">
              <p className="text-sm">Nenhuma subcategoria ainda.</p>
            </div>
          )}
        </div>
      )}

      {modal && (
        <SubcategoryFormModal
          subcategory={modal !== "new" ? (modal as Subcategory) : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
