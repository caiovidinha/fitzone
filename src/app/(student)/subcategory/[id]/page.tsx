"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { subcategoriesApi, videosApi } from "@/lib/api";
import { VideoCard } from "@/components/VideoCard";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import type { CursorPage, Subcategory, Video } from "@/types";
import Image from "next/image";

const PAGE_SIZE = 24;

function VideoSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-zinc-800">
      <div className="aspect-video w-full animate-pulse bg-zinc-800" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 w-3/4 animate-pulse rounded bg-zinc-800" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-800" />
      </div>
    </div>
  );
}

export default function SubcategoryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: subcategory, isLoading: subLoading } = useQuery({
    queryKey: ["subcategory", id],
    queryFn: () => subcategoriesApi.get(id).then((r) => r.data as Subcategory),
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: vidLoading,
  } = useInfiniteQuery({
    queryKey: ["videos", "subcategory", id],
    queryFn: ({ pageParam }) =>
      videosApi
        .list(id, { cursor: pageParam as string | undefined, limit: PAGE_SIZE })
        .then((r) => r.data as CursorPage<Video>),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: !!id,
  });

  const videos = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.total;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const sentinelRef = useIntersectionObserver(loadMore, !!hasNextPage && !isFetchingNextPage);
  const isLoading = subLoading || vidLoading;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1.5 text-sm text-zinc-400 transition hover:text-zinc-100"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Voltar
      </button>

      {/* Subcategory header */}
      {subLoading ? (
        <div className="mb-10">
          <div className="h-7 w-48 animate-pulse rounded bg-zinc-800" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-zinc-800" />
        </div>
      ) : subcategory ? (
        <div className="mb-10 flex items-start gap-5">
          {subcategory.image_url && (
            <div className="relative hidden h-20 w-32 shrink-0 overflow-hidden rounded-xl sm:block">
              <Image
                src={subcategory.image_url}
                alt={subcategory.name}
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
          )}
          <div>
            {subcategory.categories.length > 0 && (
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-brand">
                {subcategory.categories.map((c) => c.name).join(" · ")}
              </p>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{subcategory.name}</h1>
            {subcategory.description && (
              <p className="mt-1.5 max-w-xl text-zinc-400">{subcategory.description}</p>
            )}
            {total != null && (
              <p className="mt-2 text-sm text-zinc-500">
                {total} {total === 1 ? "vídeo" : "vídeos"}
              </p>
            )}
          </div>
        </div>
      ) : null}

      {/* Videos grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <VideoSkeleton key={i} />)
          : videos.map((video) => <VideoCard key={video.id} video={video} />)}

        {isFetchingNextPage &&
          Array.from({ length: 4 }).map((_, i) => <VideoSkeleton key={`more-${i}`} />)}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="mt-4 h-1" aria-hidden />

      {!isLoading && !hasNextPage && videos.length > 0 && (
        <p className="mt-8 text-center text-xs text-zinc-600">Todos os vídeos carregados</p>
      )}

      {!isLoading && videos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
          <svg viewBox="0 0 24 24" fill="none" className="mb-3 h-10 w-10" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
          </svg>
          <p className="text-sm">Nenhum vídeo disponível neste grupo ainda.</p>
        </div>
      )}
    </div>
  );
}
