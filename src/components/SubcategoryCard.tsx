"use client";

import Image from "next/image";
import Link from "next/link";
import type { Subcategory } from "@/types";

interface SubcategoryCardProps {
  subcategory: Subcategory;
}

export function SubcategoryCard({ subcategory }: SubcategoryCardProps) {
  return (
    <Link
      href={`/subcategory/${subcategory.id}`}
      className="group relative overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-zinc-800 transition hover:ring-brand/50"
    >
      {/* Cover image */}
      <div className="relative h-44 w-full overflow-hidden bg-zinc-800">
        {subcategory.image_url ? (
          <Image
            src={subcategory.image_url}
            alt={subcategory.name}
            fill
            unoptimized
            className="object-cover transition duration-500 group-hover:scale-105 group-hover:opacity-80"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={(e) => console.error('[SubcategoryCard] Image failed to load:', subcategory.image_url, e)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-zinc-800 to-zinc-900">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-12 w-12 text-zinc-600"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"
              />
            </svg>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-zinc-900/90 via-zinc-900/20 to-transparent" />
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-zinc-100 transition group-hover:text-brand">
          {subcategory.name}
        </h3>
        {subcategory.description && (
          <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{subcategory.description}</p>
        )}
        {subcategory.categories.length > 0 && (
          <p className="mt-1.5 text-xs text-zinc-600">
            {subcategory.categories.map((c) => c.name).join(" · ")}
          </p>
        )}
      </div>

      {/* Arrow indicator */}
      <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950/60 opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-4 w-4 text-brand"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </div>
    </Link>
  );
}
