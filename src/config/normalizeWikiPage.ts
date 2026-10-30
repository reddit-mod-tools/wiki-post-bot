/**
 * Turn what a mod might type for a wiki page into the page name Reddit uses.
 * Accepts `rules`, `/rules`, `wiki/rules`, `/r/example/wiki/rules`, or a full
 * URL. Reddit's v1 wiki page names are case-insensitive and shown lowercase.
 */
export function normalizeWikiPage(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/^\/?(r\/[^/]+\/)?/i, '')
    .replace(/^wiki\//i, '')
    .replace(/\/+$/, '')
    .toLowerCase();
}
