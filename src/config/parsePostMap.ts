import { parseDocument } from 'yaml';
import { z } from 'zod';
import { normalizeWikiPage } from '@/config/normalizeWikiPage';
import {
  isKnownTimezone,
  parsePostAt,
  postAtFormatHelp,
} from '@/config/parsePostAt';

/**
 * Result of reading the config wiki page. When the whole page is unreadable
 * (YAML syntax error, wrong top-level shape), it's invalid and we don't touch
 * anything. Otherwise, bad entries are reported one by one and the rest
 * still sync.
 */
export type PostMapParseResult = ValidPostMap | InvalidPostMap;

export interface ValidPostMap {
  isValid: true;
  entries: WikiPostEntry[];
  entryErrors: EntryError[];
}

export interface InvalidPostMap {
  isValid: false;
  error: string;
}

export interface WikiPostEntry {
  /** Normalized wiki page name, e.g. `rules` or `guides/faq` */
  wikiPage: string;
  title: string;
  /**
   * Earliest time to make the first post. Null when the config doesn't set
   * one, which means "post right away".
   */
  postAt: Date | null;
  postOptions: PostOptions;
}

/** Things we set on the post after making it, and keep in sync with the config */
export interface PostOptions {
  /** Sticky slot, or null to leave the post unstickied */
  sticky: StickyPosition | null;
  /** Mark the post as from a moderator */
  distinguish: boolean;
  lock: boolean;
  /**
   * Display text of a post flair template in the subreddit, or null for no
   * flair. We match by text so mods don't need to look up template IDs.
   */
  flair: string | null;
}

/** Reddit has two sticky slots for posts */
export type StickyPosition = 1 | 2;

export interface EntryError {
  /**
   * Wiki page the bad entry names, or null when we can't tell (for example,
   * `wikiPage` is missing). We keep syncing state for named pages, so a typo
   * elsewhere in an entry doesn't look like the entry was removed.
   */
  wikiPage: string | null;
  message: string;
}

/** Parse the YAML from the config wiki page */
export function parsePostMap(text: string): PostMapParseResult {
  const doc = parseDocument(text);
  const syntaxError = doc.errors[0];
  if (syntaxError !== undefined) {
    return {
      isValid: false,
      error: `YAML syntax error: ${syntaxError.message}`,
    };
  }

  // An empty or fully commented-out page is a valid config with no entries
  const topLevel = topLevelSchema.safeParse(doc.toJSON() ?? {});
  if (!topLevel.success) {
    return {
      isValid: false,
      error: formatIssues(topLevel.error.issues, null),
    };
  }

  const { timezone, posts } = topLevel.data;
  const entries: WikiPostEntry[] = [];
  const entryErrors: EntryError[] = [];
  const indexByWikiPage = new Map<string, number>();

  posts.forEach((rawEntry, index) => {
    const path = `posts[${index}]`;
    const wikiPage = getRawWikiPage(rawEntry);
    const parsed = entrySchema.safeParse(rawEntry);
    if (!parsed.success) {
      entryErrors.push({
        wikiPage,
        message: formatIssues(parsed.error.issues, path),
      });
      return;
    }

    const entry = parsed.data;
    const firstIndex = indexByWikiPage.get(entry.wikiPage);
    if (firstIndex !== undefined) {
      entryErrors.push({
        wikiPage,
        message: `${path}.wikiPage: "${entry.wikiPage}" is already used by posts[${firstIndex}]`,
      });
      return;
    }
    indexByWikiPage.set(entry.wikiPage, index);

    const postAt =
      entry.postAt !== undefined
        ? parsePostAt(entry.postAt, timezone ?? null)
        : null;
    if (entry.postAt !== undefined && postAt === null) {
      entryErrors.push({
        wikiPage,
        message: `${path}.postAt: couldn't read "${entry.postAt}"; ${postAtFormatHelp}`,
      });
      return;
    }

    entries.push({
      wikiPage: entry.wikiPage,
      title: entry.title,
      postAt,
      postOptions: {
        sticky: entry.sticky ?? null,
        distinguish: entry.distinguish ?? false,
        lock: entry.lock ?? false,
        flair: entry.flair ?? null,
      },
    });
  });

  return { isValid: true, entries, entryErrors };
}

const topLevelSchema = z
  .object({
    timezone: z
      .string()
      .refine(isKnownTimezone, {
        error:
          'unknown timezone; use a name like America/New_York from https://en.wikipedia.org/wiki/List_of_tz_database_time_zones',
      })
      .optional(),
    posts: z.array(z.unknown()).default([]),
  })
  .strict();

/** Reddit's limit for post titles */
const maxTitleLength = 300;

const entrySchema = z
  .object({
    wikiPage: z
      .string()
      .transform(normalizeWikiPage)
      .refine((page) => page !== '', { error: 'must name a wiki page' }),
    title: z.string().trim().min(1).max(maxTitleLength),
    sticky: z
      .literal([1, 2], { error: 'must be 1 or 2, or left out to not sticky' })
      .optional(),
    distinguish: z.boolean().optional(),
    lock: z.boolean().optional(),
    flair: z.string().trim().min(1).optional(),
    postAt: z.string().optional(),
  })
  .strict();

function getRawWikiPage(rawEntry: unknown): string | null {
  if (typeof rawEntry !== 'object' || rawEntry === null) return null;
  const wikiPage: unknown = (rawEntry as Record<string, unknown>)['wikiPage'];
  if (typeof wikiPage !== 'string') return null;
  return normalizeWikiPage(wikiPage) || null;
}

function formatIssues(
  issues: z.core.$ZodIssue[],
  prefix: string | null
): string {
  return issues
    .map((issue) => {
      const path = [prefix, ...issue.path.map(String)]
        .filter((part) => part !== null)
        .join('.');
      return path !== '' ? `${path}: ${issue.message}` : issue.message;
    })
    .join('; ');
}
