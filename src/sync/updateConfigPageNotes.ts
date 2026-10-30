import { reddit } from '@devvit/web/server';
import type { AppConfig } from '@/config/loadConfig';
import {
  getConfigErrorStatusLines,
  writeConfigStatusSection,
} from '@/config/writeConfigStatusSection';
import { writeCurrentPostLinks } from '@/config/writeCurrentPostLinks';
import { logger } from '@/lib/logger';
import { getPostURL } from '@/lib/reddit/getPostURL';
import { readWikiPage, type WikiPageContent } from '@/sync/readWikiPage';
import { getWikiPostStates } from '@/sync/wikiPostState';

/** Shows up in the config page's revision history */
const configNotesReason = 'wiki-post-bot: update post links and status';

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
      ? writeCurrentPostLinks(
          withStatus,
          await getPostURLByWikiPage(subredditName)
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

async function getPostURLByWikiPage(
  subredditName: string
): Promise<Map<string, string>> {
  const states = await getWikiPostStates();
  return new Map(
    [...states].map(([wikiPage, state]) => [
      wikiPage,
      getPostURL(subredditName, state.postId),
    ])
  );
}
