import type { PostMapParseResult } from '@/config/parsePostMap';

/**
 * Pages we've been syncing that are no longer in the config, so we should
 * stop syncing them.
 *
 * To avoid wiping mappings by accident, this returns nothing when:
 * 1. The config couldn't be parsed at all (e.g. a YAML typo)
 * 2. Some bad entry doesn't name a wiki page we can read, since it might be
 *    one of the stored pages
 *
 * A bad entry that does name its page keeps that page's state.
 */
export function getRemovedPages({
  storedPages,
  postMap,
}: {
  storedPages: string[];
  postMap: PostMapParseResult;
}): string[] {
  if (!postMap.isValid) return [];
  if (postMap.entryErrors.some((error) => error.wikiPage === null)) return [];

  const configuredPages = new Set([
    ...postMap.entries.map((entry) => entry.wikiPage),
    ...postMap.entryErrors.map((error) => error.wikiPage),
  ]);
  return storedPages.filter((page) => !configuredPages.has(page));
}
