/**
 * How this particular instance is being served.
 *
 * The app runs in two shapes: behind HTTPS (Vercel, or an AWS load balancer with
 * a certificate) and on a bare EC2 public IP over plain http. Three things that
 * are correct under HTTPS actively break the site over http, so they are turned
 * off by one flag rather than hand-edited on every box:
 *
 *   INSECURE_ORIGIN=true
 *
 *   1. `Secure` cookies. A browser will not store or return a Secure cookie on
 *      an http origin, so the case_id cookie vanishes and every dashboard page
 *      bounces to /login. This is the single most confusing symptom of the lot,
 *      because signing in appears to work.
 *   2. CSP `upgrade-insecure-requests`, which rewrites every /_next/static
 *      request to https on a server with no TLS listener - the page arrives with
 *      no CSS and no JavaScript.
 *   3. HSTS, which asks the browser to remember "https only" for this host for
 *      two years. Harmless on an IP today, unpleasant if that IP is reused.
 *
 * Leave it unset anywhere TLS terminates in front of the app. Set it to true
 * only while serving a naked http origin.
 */
export const INSECURE_ORIGIN = process.env.INSECURE_ORIGIN === 'true';

/**
 * Whether session cookies should carry the Secure attribute.
 *
 * Production over HTTPS: yes. Production over a plain http EC2 IP: no, or the
 * browser silently drops the cookie. Development: no, localhost is http.
 */
export const SECURE_COOKIE = process.env.NODE_ENV === 'production' && !INSECURE_ORIGIN;
