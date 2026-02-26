"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { categoriesApi, subcategoriesApi } from "@/lib/api";
import { SubcategoryCard } from "@/components/SubcategoryCard";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import type { Category, CursorPage, Subcategory } from "@/types";

const PAGE_SIZE = 24;

function SubcategorySkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-zinc-800">
      <div className="h-44 w-full animate-pulse bg-zinc-800" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-800" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-800" />
      </div>
    </div>
  );
}

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: category, isLoading: catLoading } = useQuery({
    queryKey: ["category", id],
    queryFn: () => categoriesApi.get(id).then((r) => r.data as Category),
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: subLoading,
  } = useInfiniteQuery({
    queryKey: ["subcategories", id],
    queryFn: ({ pageParam }) =>
      subcategoriesApi
        .list({ category_id: id, cursor: pageParam as string | undefined, limit: PAGE_SIZE })
        .then((r) => r.data as CursorPage<Subcategory>),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: !!id,
  });

  const subcategories = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.total;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const sentinelRef = useIntersectionObserver(loadMore, !!hasNextPage && !isFetchingNextPage);
  const isLoading = catLoading || subLoading;

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

      {/* Category header */}
      {catLoading ? (
        <div className="mb-10">
          <div className="h-8 w-48 animate-pulse rounded bg-zinc-800" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-zinc-800" />
        </div>
      ) : category ? (
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{category.name}</h1>
          {category.description && (
            <p className="mt-1.5 max-w-xl text-zinc-400">{category.description}</p>
          )}
          {total != null && (
            <p className="mt-2 text-sm text-zinc-500">
              {total} {total === 1 ? "grupo" : "grupos"}
            </p>
          )}
        </div>
      ) : null}

      {/* Subcategories grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <SubcategorySkeleton key={i} />)
          : subcategories.map((sub) => <SubcategoryCard key={sub.id} subcategory={sub} />)}

        {isFetchingNextPage &&
          Array.from({ length: 4 }).map((_, i) => <SubcategorySkeleton key={`more-${i}`} />)}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="mt-4 h-1" aria-hidden />

      {!isLoading && !hasNextPage && subcategories.length > 0 && (
        <p className="mt-8 text-center text-xs text-zinc-600">Todos os grupos carregados</p>
      )}

      {!isLoading && subcategories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
          <p className="text-sm">Nenhum grupo disponível nesta categoria.</p>
        </div>
      )}
    </div>
  );
}
