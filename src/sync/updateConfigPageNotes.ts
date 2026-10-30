import { isMap, isSeq, parseDocument } from 'yaml';
import { reddit } from '@devvit/web/server';
import type { AppConfig } from '@/config/loadConfig';
import { normalizeWikiPage } from '@/config/normalizeWikiPage';
import {
  getConfigErrorStatusLines,
  writeConfigStatusSection,
} from '@/config/writeConfigStatusSection';
import { logger } from '@/lib/logger';
import { getPostURL } from '@/lib/reddit/getPostURL';
import { readWikiPage, type WikiPageContent } from '@/sync/readWikiPage';
import { getWikiPostStates } from '@/sync/wikiPostState';

interface UpdateConfigPageNotesOptions {
  config: AppConfig;
  /** The config page as the caller read and parsed it */
  configPage: WikiPageContent;
  /**
   * Why the whole config can't be parsed, or null when it parses (even if
   * some entries have errors)
   */
  configError: string | null;
}

/**
 * Update what the bot writes into the config page:
 * 1. A status section at the end while the config can't be parsed, with the
 *    error. It's removed once the config is fixed.
 * 2. A `# Current post:` link above each entry that has a post. This only
 *    happens with "Make live changes" on, since that's when posts exist.
 *
 * Our edit fires the wiki edit trigger again, but that sync finds the notes
 * already right and doesn't write, so it doesn't loop.
 *
 * The notes are a convenience, so errors are logged rather than thrown. That
 * way a failed write doesn't hide the sync report or fail a finished repost.
 */
export async function updateConfigPageNotes(
  options: UpdateConfigPageNotesOptions
): Promise<void> {
  try {
    await writeConfigPageNotes(options);
  } catch (error) {
    logger.error('Failed to update config page notes', error);
  }
}

async function writeConfigPageNotes({
  config,
  configPage,
  configError,
}: UpdateConfigPageNotesOptions): Promise<void> {
  const { subredditName, configWikiPage } = config;
  const withStatus = writeConfigStatusSection(
    configPage.content,
    configError !== null ? getConfigErrorStatusLines(configError) : null
  );
  const newContent =
    configError === null && config.makeChanges
      ? _writeCurrentPostLinks(
          withStatus,
          new Map(
            [...(await getWikiPostStates())].map(([wikiPage, state]) => [
              wikiPage,
              getPostURL(subredditName, state.postId),
            ])
          )
        )
      : withStatus;
  if (newContent === configPage.content) return;

  // If a mod edited the config since we read it, leave their edit alone. The
  // next sync reads their version and updates the notes then.
  const latest = await readWikiPage(subredditName, configWikiPage);
  if (latest.revisionId !== configPage.revisionId) {
    logger.info('Config page changed during sync; updating notes next time');
    return;
  }

  await reddit.updateWikiPage({
    subredditName,
    page: configWikiPage,
    content: newContent,
    reason: configNotesReason,
  });
}

/**
 * Add or update the `# Current post: <link>` comment above each entry in the
 * config YAML, and drop it from entries with no post yet.
 *
 * Mods' own comments stay where they are. Returns `configText` unchanged
 * (same string) when no link changed, so callers can skip the wiki edit.
 */
export function _writeCurrentPostLinks(
  configText: string,
  /** Post URL for each wiki page that currently has a post */
  postURLByWikiPage: Map<string, string>
): string {
  const doc = parseDocument(configText);
  if (doc.errors.length > 0) return configText;

  const posts = doc.get('posts', true);
  if (!isSeq(posts)) return configText;

  let hasChanges = false;
  posts.items.forEach((item, index) => {
    if (!isMap(item)) return;
    const rawWikiPage = item.get('wikiPage');
    const postURL =
      typeof rawWikiPage === 'string'
        ? (postURLByWikiPage.get(normalizeWikiPage(rawWikiPage)) ?? null)
        : null;

    // The yaml library attaches comments above the first list item to the
    // list itself, so an old link for the first entry can live there
    if (index === 0) {
      const listComment = withoutLinkLines(posts.commentBefore);
      if (listComment !== (posts.commentBefore ?? null)) {
        posts.commentBefore = listComment;
        hasChanges = true;
      }
    }

    const keptLines = withoutLinkLines(item.commentBefore);
    const newComment = [
      postURL !== null
        ? ` ${currentPostPrefix} ${postURL} (set by wiki-post-bot)`
        : null,
      keptLines,
    ]
      .filter((part) => part !== null)
      .join('\n');
    const newCommentOrNull = newComment !== '' ? newComment : null;
    if (newCommentOrNull !== (item.commentBefore ?? null)) {
      item.commentBefore = newCommentOrNull;
      hasChanges = true;
    }
  });

  // Re-serializing can normalize a little whitespace, so only do it when a
  // link actually changed. lineWidth 0 keeps long titles from being folded.
  return hasChanges ? doc.toString({ lineWidth: 0 }) : configText;
}

/** Remove our link lines from a comment; null when nothing is left */
function withoutLinkLines(comment: string | null | undefined): string | null {
  if (comment == null) return null;
  const kept = comment
    .split('\n')
    .filter((line) => !line.trim().startsWith(currentPostPrefix));
  return kept.length > 0 ? kept.join('\n') : null;
}

/** Shows up in the config page's revision history */
const configNotesReason = 'wiki-post-bot: update post links and status';

/** Comment text after `#` that marks our link lines */
const currentPostPrefix = 'Current post:';
