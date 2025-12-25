/**
 * Terminal/site themes registry + selection parsing.
 * Pure module: safe to import from browser code and Node tests.
 */
export const TERMINAL_THEME_STORAGE_KEY = 'rg_terminal_theme_v1';

// Default theme is the current site palette (i.e. no data-theme attribute set).
export const DEFAULT_THEME_ID = 'rgos-dark';

export const THEMES = [
  { id: DEFAULT_THEME_ID, label: 'RG/OS Dark' },
  { id: 'dracula', label: 'Dracula' },
  { id: 'nord', label: 'Nord' },
  { id: 'gruvbox-dark', label: 'Gruvbox Dark' },
  { id: 'solarized-dark', label: 'Solarized Dark' },
  { id: 'solarized-light', label: 'Solarized Light' },
  { id: 'tokyo-night', label: 'Tokyo Night' },
  { id: 'catppuccin-mocha', label: 'Catppuccin Mocha' },
  { id: 'one-dark', label: 'One Dark' },
  { id: 'monokai', label: 'Monokai' },
  { id: 'night-owl', label: 'Night Owl' },
  { id: 'github-light', label: 'GitHub Light' },
];

const canon = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

export function getThemeById(id) {
  const cid = canon(id);
  return THEMES.find((t) => canon(t.id) === cid) || null;
}

/**
 * Resolve a user selection token into a theme:
 * - "1" .. "12" (1-based)
 * - id ("gruvbox-dark")
 * - label ("Gruvbox Dark")
 */
export function resolveThemeSelection(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return null;

  if (/^\d+$/.test(raw)) {
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    const idx = n - 1;
    return THEMES[idx] || null;
  }

  const c = canon(raw);
  for (const t of THEMES) {
    if (canon(t.id) === c) return t;
    if (canon(t.label) === c) return t;
  }
  return null;
}


