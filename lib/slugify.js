/**
 * Convert a string into a URL-friendly slug.
 * - Lowercase
 * - Remove diacritics
 * - Replace non-alphanumeric runs with '-'
 * - Trim leading/trailing '-'
 */
export function slugify(input) {
  const s = String(input ?? '').trim().toLowerCase();
  if (!s) return '';

  // Normalize to split diacritics from letters, then strip them.
  const noMarks = s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

  return noMarks
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}


