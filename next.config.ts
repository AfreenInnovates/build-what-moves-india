import type { NextConfig } from 'next';

/**
 * Security headers.
 *
 * `unsafe-inline` and `unsafe-eval` on script-src are what Next's App Router
 * needs for its inline bootstrap and dev refresh. Everything else is locked
 * down: no framing, no third-party connections, and `media-src data:` only
 * because spoken replies arrive as base64 WAV data URIs.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

const nextConfig: NextConfig = {
  /**
   * The honesty page used to live at /whats-mocked. It is now a sourced
   * comparison with what EPFO actually does, at /compare. Kept as a permanent
   * redirect because the old address was linked from every page footer, and
   * anyone who bookmarked it should still land somewhere useful.
   */
  async redirects() {
    return [{ source: '/whats-mocked', destination: '/compare', permanent: true }];
  },
  // the dev badge sits over the UI; off so screen recordings are clean
  devIndicators: false,

  // never leak the framework version to a scanner
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            // microphone is ours to use; nothing else is
            value: 'camera=(), geolocation=(), payment=(), usb=(), microphone=(self)',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
        ],
      },
      {
        // a case is personal and must never be cached by a proxy or CDN
        source: '/dashboard/:path*',
        headers: [{ key: 'Cache-Control', value: 'private, no-store, max-age=0' }],
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ];
  },
};

export default nextConfig;
