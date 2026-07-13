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

/** Normalize a `location`-like pathname to a site-root-relative page path. */
export function normalizeGashaponPagePath(pathname) {
  const raw = String(pathname ?? '').split('?')[0].split('#')[0];
  const trimmed = raw.replace(/^\/+/, '');
  return trimmed === '' ? 'index.html' : trimmed;
}
