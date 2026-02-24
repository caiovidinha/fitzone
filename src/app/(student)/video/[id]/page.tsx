"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { videosApi } from "@/lib/api";
import { VideoPlayer } from "@/components/VideoPlayer";
import { STREAM_URL_STALE_MS, STREAM_URL_GC_MS } from "@/app/providers";
import { formatDuration, formatDate } from "@/lib/utils";
import type { Video } from "@/types";
import Link from "next/link";

export default function VideoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: video, isLoading } = useQuery({
    queryKey: ["video", id],
    queryFn: () => videosApi.get(id).then((r) => r.data as Video),
  });

  const { data: streamData, isLoading: streamLoading } = useQuery({
    queryKey: ["stream", id],
    queryFn: () => videosApi.getStream(id).then((r) => r.data as { url: string }),
    enabled: !!id,
    staleTime: STREAM_URL_STALE_MS,
    gcTime: STREAM_URL_GC_MS,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="mb-5 flex items-center gap-1.5 text-sm text-zinc-400 transition hover:text-zinc-100"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Voltar
      </button>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Main column */}
        <div>
          {/* Player */}
          {isLoading || streamLoading ? (
            <div className="aspect-video w-full animate-pulse rounded-xl bg-zinc-900" />
          ) : streamData?.url ? (
            <VideoPlayer
              src={streamData.url}
              poster={video?.thumbnail}
              title={video?.title}
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-zinc-900 text-zinc-500">
              <p className="text-sm">Vídeo não disponível.</p>
            </div>
          )}

          {/* Video info */}
          {isLoading ? (
            <div className="mt-5 space-y-3">
              <div className="h-7 w-3/4 animate-pulse rounded bg-zinc-800" />
              <div className="h-4 w-1/4 animate-pulse rounded bg-zinc-800" />
              <div className="h-4 w-full animate-pulse rounded bg-zinc-800" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-800" />
            </div>
          ) : video ? (
            <div className="mt-5">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-100">{video.title}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
                {video.categoryName && (
                  <Link href={`/category/${video.categoryId}`} className="hover:text-brand transition">
                    {video.categoryName}
                  </Link>
                )}
                <span>•</span>
                <span>{formatDuration(video.duration)}</span>
                <span>•</span>
                <span>{formatDate(video.createdAt)}</span>
              </div>
              {video.description && (
                <p className="mt-4 whitespace-pre-line leading-relaxed text-zinc-300">{video.description}</p>
              )}
            </div>
          ) : null}
        </div>

        {/* Sidebar: more videos from category */}
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Mais desta categoria
          </h2>
          <RelatedVideos currentVideoId={id} categoryId={video?.categoryId} />
        </div>
      </div>
    </div>
  );
}

function RelatedVideos({ currentVideoId, categoryId }: { currentVideoId: string; categoryId?: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["videos", categoryId],
    queryFn: () => videosApi.list(categoryId).then((r) => r.data as Video[]),
    enabled: !!categoryId,
  });

  const videos = data?.filter((v) => v.id !== currentVideoId) ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-16 w-28 flex-shrink-0 animate-pulse rounded-lg bg-zinc-800" />
            <div className="flex flex-col gap-2 pt-1">
              <div className="h-3.5 w-28 animate-pulse rounded bg-zinc-800" />
              <div className="h-3 w-16 animate-pulse rounded bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return <p className="text-sm text-zinc-500">Nenhum outro vídeo nesta categoria.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {videos.map((v) => (
        <Link
          key={v.id}
          href={`/video/${v.id}`}
          className="group flex gap-3 rounded-xl p-2 transition hover:bg-zinc-900"
        >
          <div className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-800">
            {v.thumbnail ? (
              <img src={v.thumbnail} alt={v.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-zinc-600" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                </svg>
              </div>
            )}
            <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-xs text-white">
              {formatDuration(v.duration)}
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="line-clamp-2 text-sm font-medium text-zinc-200 transition group-hover:text-brand">
              {v.title}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
