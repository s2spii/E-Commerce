/**
 * URL-safe slug generation: lowercase, strip diacritics, collapse to hyphens.
 * "Écharpe en Cachemire" → "echarpe-en-cachemire".
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Appends a short random suffix to guarantee uniqueness when needed. */
export function uniqueSlug(base: string): string {
  return `${slugify(base)}-${Math.random().toString(36).slice(2, 7)}`;
}
