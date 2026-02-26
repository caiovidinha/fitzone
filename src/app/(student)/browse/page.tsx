"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import Link from "next/link";
import { SubcategoryCard } from "@/components/SubcategoryCard";
import { categoriesApi, subcategoriesApi } from "@/lib/api";
import type { Category, CursorPage, Subcategory } from "@/types";

function SkeletonSection() {
  return (
    <div>
      <div className="mb-5">
        <div className="h-6 w-40 animate-pulse rounded bg-zinc-800" />
        <div className="mt-2 h-3.5 w-60 animate-pulse rounded bg-zinc-800" />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-zinc-800">
            <div className="h-44 w-full animate-pulse bg-zinc-800" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-800" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BrowsePage() {
  const { data: categoriesData, isLoading: catLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      categoriesApi.list({ limit: 100 }).then((r) => r.data as CursorPage<Category>),
  });

  // Fetch ALL subcategory pages automatically (backend max is 100 per page)
  const {
    data: subPages,
    isLoading: subLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["subcategories", "all"],
    queryFn: ({ pageParam }) =>
      subcategoriesApi
        .list({ limit: 100, cursor: pageParam as string | undefined })
        .then((r) => r.data as CursorPage<Subcategory>),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  });

  // Auto-fetch all remaining pages as soon as they become available
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const categories = categoriesData?.items ?? [];
  const allSubcategories = subPages?.pages.flatMap((p) => p.items) ?? [];
  const isLoading = catLoading || subLoading;

  // Group subcategories by category id (a sub can appear in multiple categories)
  function subsForCategory(categoryId: string): Subcategory[] {
    return allSubcategories
      .filter((sub) => sub.categories.some((c) => c.id === categoryId))
      .sort((a, b) => a.order - b.order);
  }

  // Subcategories not assigned to any category
  const unassigned = allSubcategories
    .filter((sub) => sub.categories.length === 0)
    .sort((a, b) => a.order - b.order);

  const hasContent = categories.length > 0 || unassigned.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Seus treinos</h1>
        <p className="mt-1 text-zinc-400">Escolha um grupo e comece agora</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-14">
          <SkeletonSection />
          <SkeletonSection />
        </div>
      ) : !hasContent ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
          <svg viewBox="0 0 24 24" fill="none" className="mb-3 h-10 w-10" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
          </svg>
          <p className="text-sm">Nenhum conteúdo disponível ainda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-14">
          {categories
            .sort((a, b) => a.order - b.order)
            .map((category) => {
              const subs = subsForCategory(category.id);
              if (subs.length === 0) return null;
              return (
                <section key={category.id}>
                  <div className="mb-5">
                    <Link href={`/category/${category.id}`} className="group inline-flex items-center gap-1.5 transition">
                      <h2 className="text-xl font-bold text-zinc-100 group-hover:text-brand">{category.name}</h2>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4 text-zinc-600 transition group-hover:text-brand">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </Link>
                    {category.description && (
                      <p className="mt-1 text-sm text-zinc-500">{category.description}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {subs.map((sub) => (
                      <SubcategoryCard key={sub.id} subcategory={sub} />
                    ))}
                  </div>
                </section>
              );
            })}

          {unassigned.length > 0 && (
            <section>
              <div className="mb-5">
                <h2 className="text-xl font-bold text-zinc-100">Outros</h2>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {unassigned.map((sub) => (
                  <SubcategoryCard key={sub.id} subcategory={sub} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

