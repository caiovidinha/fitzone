import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enables containerized deploys (Railway, Fly.io, etc.) without rebuilding
  output: "standalone",

  images: {
    // Bunny.net CDN pull zone — swap with your actual subdomain
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.b-cdn.net",
      },
      {
        // Bunny.net storage hostname
        protocol: "https",
        hostname: "storage.bunnycdn.com",
      },
      {
        // Supabase Storage (category cover images)
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        // Local backend mock storage (development only)
        protocol: "http",
        hostname: "localhost",
        port: "8000",
      },
    ],
    // Modern formats for smaller payloads
    formats: ["image/avif", "image/webp"],
    // Reasonable max image size
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },

  // Redirect backend-generated invite URLs to the Portuguese route
  async redirects() {
    return [
      {
        source: "/first-access",
        destination: "/primeiro-acesso",
        permanent: false, // 307 — keeps query params (token=...)
      },
    ];
  },

  // Security + caching headers for all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            // Allows HLS streams from Bunny CDN pull zones and wasm (HLS.js)
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // 'unsafe-inline' required by Next.js App Router hydration; 'unsafe-eval' by HLS.js worker
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.b-cdn.net https://*.supabase.co http://localhost:8000",
              "media-src 'self' blob: https://*.b-cdn.net http://localhost:8000",
              `connect-src 'self' http://localhost:8000 ${process.env.NEXT_PUBLIC_BACKEND_URL ?? ""} https://*.b-cdn.net https://*.supabase.co`,
              "worker-src 'self' blob:",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
      {
        // Cache static Next.js assets aggressively on CDN
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

