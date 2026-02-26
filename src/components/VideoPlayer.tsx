"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  /** HLS .m3u8 URL (signed) or Bunny iframe embed URL */
  src: string;
  poster?: string;
  title?: string;
  className?: string;
}

/** Returns true when Bunny returns an iframe embed URL instead of a raw HLS manifest */
function isBunnyEmbed(url: string) {
  return url.includes("iframe.mediadelivery.net/embed") || url.includes("iframe.mediadelivery.net/play");
}

export function VideoPlayer({ src, poster, title, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quality, setQuality] = useState<string>("Auto");
  const [availableQualities, setAvailableQualities] = useState<string[]>(["Auto"]);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFSChange);
    return () => document.removeEventListener("fullscreenchange", onFSChange);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setError(false);
    setReady(false);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        // ABR (Adaptive Bitrate) config for low bandwidth
        abrEwmaDefaultEstimate: 500000,
        startLevel: -1, // auto
        capLevelToPlayerSize: true,
      });

      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setReady(true);
        const levels = data.levels.map((l) =>
          l.height ? `${l.height}p` : `${Math.round((l.bitrate ?? 0) / 1000)}kbps`
        );
        setAvailableQualities(["Auto", ...levels]);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error("[HLS error]", data.type, data.details, data.fatal, data);
        if (data.fatal) setError(true);
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS
      video.src = src;
      video.addEventListener("loadedmetadata", () => setReady(true));
      video.addEventListener("error", () => setError(true));
    } else {
      setError(true);
    }
  }, [src]);

  // Quality change
  function changeQuality(q: string) {
    setQuality(q);
    if (!hlsRef.current) return;
    if (q === "Auto") {
      hlsRef.current.currentLevel = -1;
    } else {
      const idx = availableQualities.indexOf(q) - 1;
      hlsRef.current.currentLevel = idx >= 0 ? idx : -1;
    }
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  }

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  function handleMouseMove() {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  // Bunny embed URL → render native iframe player (no HLS.js needed)
  if (src && isBunnyEmbed(src)) {
    return (
      <div className={cn("relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-950", className)}>
        <iframe
          src={src}
          className="h-full w-full"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
          title={title}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex aspect-video w-full items-center justify-center rounded-xl bg-zinc-900 text-zinc-400", className)}>
        <div className="text-center">
          <p className="text-sm">Erro ao carregar o vídeo.</p>
          <p className="text-xs text-zinc-600">Verifique sua conexão e tente novamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("group relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-950 select-none", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Loading skeleton */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-brand" />
        </div>
      )}

      <video
        ref={videoRef}
        poster={poster}
        className="h-full w-full"
        onPlay={() => {
          setIsPlaying(true);
          controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
        }}
        onPause={() => { setIsPlaying(false); setShowControls(true); }}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          setProgress(v.currentTime);
          setDuration(v.duration || 0);
        }}
        onVolumeChange={(e) => setVolume(e.currentTarget.volume)}
        playsInline
      />

      {/* Controls overlay */}
      <div
        className={cn(
          "absolute inset-0 flex cursor-pointer flex-col justify-end bg-linear-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
        onClick={togglePlay}
      >
        {/* Title */}
        {title && (
          <div className="absolute left-4 top-4 text-sm font-medium text-white/90 drop-shadow">
            {title}
          </div>
        )}

        {/* Bottom bar */}
        <div className="p-4 pt-0" onClick={(e) => e.stopPropagation()}>
          {/* Progress bar */}
          <div className="mb-3 flex items-center gap-2 text-xs text-white/70">
            <span>{formatTime(progress)}</span>
            <div className="relative flex-1">
              <input
                type="range"
                min={0}
                max={duration || 1}
                value={progress}
                onChange={(e) => {
                  const v = videoRef.current;
                  if (v) v.currentTime = Number(e.target.value);
                }}
                className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand"
                style={{ background: `linear-gradient(to right, #f97316 ${(progress / (duration || 1)) * 100}%, rgba(255,255,255,0.2) 0)` }}
              />
            </div>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Buttons row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <button onClick={togglePlay} className="transition hover:text-brand">
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-white">
                    <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-white">
                    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Volume */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const v = videoRef.current;
                    if (v) v.muted = !v.muted;
                  }}
                  className="text-white transition hover:text-brand"
                >
                  {volume === 0 ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zm5.084 1.046a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 01-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => {
                    const v = videoRef.current;
                    if (v) v.volume = Number(e.target.value);
                  }}
                  className="hidden w-16 sm:block h-1 cursor-pointer appearance-none rounded-full bg-white/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Quality selector */}
              {availableQualities.length > 1 && (
                <select
                  value={quality}
                  onChange={(e) => changeQuality(e.target.value)}
                  className="cursor-pointer rounded bg-black/40 px-2 py-0.5 text-xs text-white backdrop-blur-sm outline-none"
                >
                  {availableQualities.map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              )}

              {/* Fullscreen */}
              <button onClick={toggleFullscreen} className="text-white transition hover:text-brand">
                {isFullscreen ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path fillRule="evenodd" d="M3.22 3.22a.75.75 0 011.06 0l3.97 3.97V4.5a.75.75 0 011.5 0V9a.75.75 0 01-.75.75H4.5a.75.75 0 010-1.5h2.69L3.22 4.28a.75.75 0 010-1.06zm17.56 0a.75.75 0 010 1.06l-3.97 3.97h2.69a.75.75 0 010 1.5H15a.75.75 0 01-.75-.75V4.5a.75.75 0 011.5 0v2.69l3.97-3.97a.75.75 0 011.06 0zM3.75 15a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-2.69l-3.97 3.97a.75.75 0 01-1.06-1.06l3.97-3.97H4.5a.75.75 0 01-.75-.75zm10.5 0a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-2.69l3.97 3.97a.75.75 0 11-1.06 1.06l-3.97-3.97v2.69a.75.75 0 01-1.5 0V15z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path fillRule="evenodd" d="M15 3.75a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0V5.56l-3.97 3.97a.75.75 0 11-1.06-1.06l3.97-3.97h-2.69a.75.75 0 01-.75-.75zm-12 0A.75.75 0 013.75 3h4.5a.75.75 0 010 1.5H5.56l3.97 3.97a.75.75 0 01-1.06 1.06L4.5 5.56v2.69a.75.75 0 01-1.5 0v-4.5zm11.47 11.78a.75.75 0 111.06-1.06l3.97 3.97v-2.69a.75.75 0 011.5 0v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 010-1.5h2.69l-3.97-3.97zm-4.94-1.06a.75.75 0 010 1.06L5.56 19.5h2.69a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75v-4.5a.75.75 0 011.5 0v2.69l3.97-3.97a.75.75 0 011.06 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
