"use client";

import Image from "next/image";
import Link from "next/link";
import { formatDuration } from "@/lib/utils";
import type { Video } from "@/types";

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <Link href={`/video/${video.id}`} className="group flex flex-col overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-zinc-800 transition hover:ring-brand/40">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-zinc-800">
        {video.thumbnail_url ? (
          <Image
            src={video.thumbnail_url}
            alt={video.title}
            fill
            unoptimized
            className="object-cover transition duration-500 group-hover:scale-105 group-hover:opacity-80"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={(e) => console.error('[VideoCard] Image failed to load:', video.thumbnail_url, e)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-zinc-800 to-zinc-900">
            <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10 text-zinc-600" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
            </svg>
          </div>
        )}
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/90 shadow-lg backdrop-blur-sm">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 translate-x-0.5 text-white">
              <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
            </svg>
          </div>
        </div>
        {/* Duration badge */}
        {video.duration != null && (
          <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            {formatDuration(video.duration)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-zinc-100 transition group-hover:text-brand">
          {video.title}
        </h3>
        {video.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400">{video.description}</p>
        )}
      </div>
    </Link>
  );
}
