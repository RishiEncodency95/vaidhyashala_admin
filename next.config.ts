import type { NextConfig } from "next";

/** Origin of an env URL, or the local fallback when it is missing or malformed */
const originOf = (value: string | undefined, fallback: string) => {
  try {
    return value?.startsWith("http") ? new URL(value).origin : fallback;
  } catch {
    return fallback;
  }
};

const apiOrigin = originOf(process.env.NEXT_PUBLIC_API_URL, "http://localhost:5001");
const siteOrigin = originOf(process.env.NEXT_PUBLIC_SITE_URL, "http://localhost:3000");

const isProd = process.env.NODE_ENV === "production";
const scriptSrcEval = isProd ? "" : " 'unsafe-eval'";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${scriptSrcEval} 'wasm-unsafe-eval'`,
  "worker-src 'self' blob: data:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: blob: http:",
  `media-src 'self' ${apiOrigin} https://res.cloudinary.com blob: data:`,
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin} https://res.cloudinary.com https://lottie.host https://cdn.jsdelivr.net blob: data:`,
  `frame-src 'self' ${siteOrigin} https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://www.instagram.com https://instagram.com`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), usb=()" },
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/testimonial_videos",
        destination: "/testimonial-videos",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${apiOrigin}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
