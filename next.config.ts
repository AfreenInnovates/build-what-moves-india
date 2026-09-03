import type { NextConfig } from 'next';

/**
 * Security headers.
 *
 * `unsafe-inline` and `unsafe-eval` on script-src are what Next's App Router
 * needs for its inline bootstrap and dev refresh. Everything else is locked
 * down: no framing, no third-party connections, and `media-src data:` only
 * because spoken replies arrive as base64 WAV data URIs.
 */
/**
 * Set INSECURE_ORIGIN=true when this instance is served over plain http - a bare
 * EC2 public IP with no certificate in front of it.
 *
 * Two of the headers below are correct under HTTPS and break the site over http:
 * `upgrade-insecure-requests` rewrites every /_next/static request to https on a
 * server with no TLS listener, so the page loads with no CSS and no JavaScript;
 * and HSTS asks the browser to remember "https only" for this host for two years.
 * The flag turns both off instead of anyone editing this file on each box.
 */
const insecureOrigin = process.env.INSECURE_ORIGIN === 'true';

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
  ...(insecureOrigin ? [] : ['upgrade-insecure-requests']),
].join('; ');

const nextConfig: NextConfig = {
  // Keep local development from creating framework-generated agent files.
  agentRules: false,

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
          // HSTS only where TLS actually terminates; over http it is at best
          // ignored and at worst pins a reused IP to https for two years.
          ...(insecureOrigin
            ? []
            : [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=63072000; includeSubDomains; preload',
                },
              ]),
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
