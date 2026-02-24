"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { CategoryCard } from "@/components/CategoryCard";
import { categoriesApi } from "@/lib/api";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import type { CursorPage, Category } from "@/types";

const PAGE_SIZE = 20;

function CategorySkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-zinc-800">
      <div className="h-44 w-full animate-pulse bg-zinc-800" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-800" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-800" />
      </div>
    </div>
  );
}

export default function BrowsePage() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["categories"],
    queryFn: ({ pageParam }) =>
      categoriesApi
        .list({ cursor: pageParam as string | undefined, limit: PAGE_SIZE })
        .then((r) => r.data as CursorPage<Category>),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const categories = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.total;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const sentinelRef = useIntersectionObserver(loadMore, !!hasNextPage && !isFetchingNextPage);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Seus treinos</h1>
        <p className="mt-1 text-zinc-400">
          {total != null ? `${total} categorias disponíveis` : "Escolha uma categoria e comece agora"}
        </p>
      </div>

      {isError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          Erro ao carregar categorias. Tente novamente.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <CategorySkeleton key={i} />)
          : categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}

        {/* Infinite scroll skeleton cards */}
        {isFetchingNextPage &&
          Array.from({ length: 4 }).map((_, i) => <CategorySkeleton key={`more-${i}`} />)}
      </div>

      {/* Sentinel — triggers fetchNextPage when visible */}
      <div ref={sentinelRef} className="mt-4 h-1" aria-hidden />

      {!isLoading && !hasNextPage && categories.length > 0 && (
        <p className="mt-8 text-center text-xs text-zinc-600">Todas as categorias carregadas</p>
      )}

      {!isLoading && categories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
          <svg viewBox="0 0 24 24" fill="none" className="mb-3 h-10 w-10" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375z" />
          </svg>
          <p className="text-sm">Nenhuma categoria disponível ainda.</p>
        </div>
      )}
    </div>
  );
}
