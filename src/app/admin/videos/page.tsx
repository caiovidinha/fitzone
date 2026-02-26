"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { videosApi, subcategoriesApi, extractItems } from "@/lib/api";
import type { Video, Subcategory } from "@/types";
import { formatDuration, formatDate } from "@/lib/utils";

function UploadModal({ onClose, subcategories }: { onClose: () => void; subcategories: import("@/types").Subcategory[] }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);   // 0-100, only during Bunny PUT
  const [step, setStep] = useState<"idle" | "creating" | "uploading" | "thumbnail" | "done">("idle");

  const isPending = step !== "idle" && step !== "done";

  const stepLabel: Record<typeof step, string> = {
    idle: "Fazer upload",
    creating: "Criando registro...",
    uploading: `Enviando para Bunny... ${progress}%`,
    thumbnail: "Enviando thumbnail...",
    done: "Concluído!",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Título obrigatório."); return; }
    if (!videoFile) { setError("Selecione um arquivo de vídeo."); return; }
    setError("");

    try {
      // Step 1 — create record + get Bunny upload URL
      setStep("creating");
      const { data } = await videosApi.create({
        title,
        description: description || undefined,
        subcategory_id: subcategoryId || undefined,
      });

      // Step 2 — upload video directly to Bunny
      setStep("uploading");
      setProgress(0);
      await videosApi.uploadToBunny(data.upload_url, videoFile, setProgress);

      // Step 3 (optional) — upload thumbnail via backend
      if (thumbFile) {
        setStep("thumbnail");
        await videosApi.updateThumbnail(data.id, thumbFile);
      }

      setStep("done");
      qc.invalidateQueries({ queryKey: ["videos"] });
      onClose();
    } catch {
      setError("Erro durante o upload. Tente novamente.");
      setStep("idle");
      setProgress(0);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <h2 className="mb-5 text-lg font-semibold text-zinc-100">Upload de vídeo</h2>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          {/* Video file */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Arquivo de vídeo *</label>
            <label className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition ${videoFile ? "border-brand/50 bg-brand/5" : "border-zinc-700 hover:border-zinc-600"}`}>
              <svg viewBox="0 0 24 24" fill="none" className={`h-8 w-8 ${videoFile ? "text-brand" : "text-zinc-500"}`} stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              {videoFile ? (
                <span className="text-sm text-brand">{videoFile.name}</span>
              ) : (
                <span className="text-sm text-zinc-400">Clique para selecionar um vídeo</span>
              )}
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Título *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Supino Reto — Série 4x12"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none ring-brand focus:border-transparent focus:ring-2"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Subcategoria</label>
            <select
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 outline-none ring-brand focus:border-transparent focus:ring-2"
            >
              <option value="">Sem subcategoria</option>
              {subcategories?.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Instruções, dicas, carga sugerida..."
              className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none ring-brand focus:border-transparent focus:ring-2"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Thumbnail (opcional)</label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm transition hover:border-zinc-600">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-zinc-400" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <span className="text-zinc-400">{thumbFile ? thumbFile.name : "Escolher imagem"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setThumbFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          {step === "uploading" && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Enviando para Bunny CDN...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-brand transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {(step === "creating" || step === "thumbnail") && (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" className="opacity-75" />
              </svg>
              {stepLabel[step]}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={isPending} className="rounded-lg px-4 py-2 text-sm text-zinc-400 transition hover:text-zinc-100 disabled:opacity-40">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex min-w-32.5 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent disabled:opacity-60"
            >
              {stepLabel[step]}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VideosPage() {
  const qc = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [filterSubcategory, setFilterSubcategory] = useState("");

  const { data: subcategories = [] } = useQuery({
    queryKey: ["subcategories"],
    queryFn: () => subcategoriesApi.list({ limit: 100 }),
    select: (r) => extractItems<Subcategory>(r),
  });

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["videos", filterSubcategory],
    queryFn: () => videosApi.list(filterSubcategory || undefined),
    select: (r) => extractItems<Video>(r),
  });

  const togglePublish = useMutation({
    mutationFn: ({ id, is_published }: { id: string; is_published: boolean }) =>
      videosApi.update(id, { is_published }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["videos"] }),
  });

  const deleteVideo = useMutation({
    mutationFn: (id: string) => videosApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["videos"] }),
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Vídeos</h1>
          <p className="mt-0.5 text-sm text-zinc-400">Faça upload e gerencie os vídeos de treino</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Upload de vídeo
        </button>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <select
          value={filterSubcategory}
          onChange={(e) => setFilterSubcategory(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 outline-none"
        >
          <option value="">Todas as subcategorias</option>
          {subcategories?.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/80">
            <tr>
              <th className="px-4 py-3 font-medium text-zinc-400">Vídeo</th>
              <th className="hidden px-4 py-3 font-medium text-zinc-400 sm:table-cell">Subcategoria</th>
              <th className="hidden px-4 py-3 font-medium text-zinc-400 md:table-cell">Duração</th>
              <th className="hidden px-4 py-3 font-medium text-zinc-400 lg:table-cell">Data</th>
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
                        <div className="h-10 w-16 animate-pulse rounded bg-zinc-800" />
                        <div className="h-4 w-32 animate-pulse rounded bg-zinc-800" />
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <div className="h-4 w-24 animate-pulse rounded bg-zinc-800" />
                    </td>
                    <td colSpan={3} className="px-4 py-3" />
                  </tr>
                ))
              : videos?.map((video) => (
                  <tr key={video.id} className="transition hover:bg-zinc-900/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded bg-zinc-800">
                          {video.thumbnail_url ? (
                            <img src={video.thumbnail_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-zinc-600">
                              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <span className="line-clamp-2 font-medium text-zinc-100">{video.title}</span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-zinc-400 sm:table-cell">
                      {subcategories.find((s) => s.id === video.subcategory_id)?.name ?? "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-zinc-400 md:table-cell">
                      {video.duration != null ? formatDuration(video.duration) : "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-zinc-500 lg:table-cell">
                      {formatDate(video.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => togglePublish.mutate({ id: video.id, is_published: !video.is_published })}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition ${
                          video.is_published
                            ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                            : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${video.is_published ? "bg-emerald-400" : "bg-zinc-500"}`} />
                        {video.is_published ? "Publicado" : "Rascunho"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          if (confirm(`Excluir "${video.title}"?`)) deleteVideo.mutate(video.id);
                        }}
                        className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-red-400"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {!isLoading && videos?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
            <p className="text-sm">Nenhum vídeo ainda. Faça o primeiro upload!</p>
          </div>
        )}
      </div>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} subcategories={subcategories} />}
    </div>
  );
}
