/**
 * Curated allowlist of pages eligible to host the hidden gashapon machine.
 *
 * Mirrors the set of top-level/project pages that load `script.js` (mirroring
 * the shape of `setActiveNav()`'s page `map`), explicitly EXCLUDING
 * `projects/*\/privacy-policy.html` — those are legal/compliance subpages and
 * must never surface unadvertised Easter eggs.
 *
 * Paths are site-root-relative, matching the convention already used by
 * `terminal.js`'s `open <page>` command (e.g. `'projects/zozo/index.html'`).
 */
export const GASHAPON_ELIGIBLE_PAGES = [
  'about.html',
  'chat.html',
  'contact.html',
  'donate.html',
  'index.html',
  'links.html',
  'projects.html',
  'projects/citydrive/index.html',
  'projects/legorganizer/index.html',
  'projects/turfwars/index.html',
  'projects/zozo/index.html',
];

/** Defense-in-depth: matches any privacy-policy subpage regardless of allowlist contents. */
const PRIVACY_POLICY_RE = /(^|\/)privacy-policy\.html$/i;

export function isPrivacyPolicyPage(pagePath) {
  return PRIVACY_POLICY_RE.test(String(pagePath ?? ''));
}

/**
 * Normalize a `location`-like pathname to a site-root-relative page path
 * matching `GASHAPON_ELIGIBLE_PAGES`'s file-based entries (e.g. `about.html`,
 * `projects/zozo/index.html`).
 *
 * Production (Cloudflare Pages) serves clean URLs — `/contact` rather than
 * `/contact.html`, and `/projects/zozo` rather than `/projects/zozo/index.html`
 * (redirecting to a trailing slash first) — so a raw pathname won't already
 * match the allowlist the way it does when running against local static files.
 */
export function normalizeGashaponPagePath(pathname) {
  const raw = String(pathname ?? '').split('?')[0].split('#')[0];
  const trimmed = raw.replace(/^\/+/, '').replace(/\/+$/, '');
  if (trimmed === '') return 'index.html';
  if (/\.[a-z0-9]+$/i.test(trimmed)) return trimmed;
  return trimmed.includes('/') ? `${trimmed}/index.html` : `${trimmed}.html`;
}
