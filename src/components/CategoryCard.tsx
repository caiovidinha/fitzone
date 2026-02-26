import Link from "next/link";
import type { Category } from "@/types";

interface CategoryCardProps {
  category: Category;
}

/**
 * Text-only category card used in student browse view.
 * Student-facing subcategory cards use SubcategoryCard.
 */
export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/category/${category.id}`}
      className="group flex flex-col gap-1 rounded-2xl bg-zinc-900 p-5 ring-1 ring-zinc-800 transition hover:ring-brand/50"
    >
      <h3 className="font-semibold text-zinc-100 transition group-hover:text-brand">
        {category.name}
      </h3>
      {category.description && (
        <p className="line-clamp-2 text-sm text-zinc-400">{category.description}</p>
      )}
      <div className="mt-auto pt-3 flex items-center gap-1.5 text-xs text-brand opacity-0 transition group-hover:opacity-100">
        <span>Ver subcategorias</span>
        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </div>
    </Link>
  );
}

