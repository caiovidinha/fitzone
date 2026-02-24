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
    ],
    // Modern formats for smaller payloads
    formats: ["image/avif", "image/webp"],
    // Reasonable max image size
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
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
              "script-src 'self' 'unsafe-eval'", // 'unsafe-eval' needed by HLS.js worker
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.b-cdn.net https://*.supabase.co",
              "media-src 'self' blob: https://*.b-cdn.net",
              "connect-src 'self' https://*.b-cdn.net https://*.supabase.co",
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

