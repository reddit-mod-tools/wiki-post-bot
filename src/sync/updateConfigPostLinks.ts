import { reddit } from '@devvit/web/server';
import type { AppConfig } from '@/config/loadConfig';
import { writeCurrentPostLinks } from '@/config/writeCurrentPostLinks';
import { logger } from '@/lib/logger';
import { getPostURL } from '@/lib/reddit/getPostURL';
import { readWikiPage, type WikiPageContent } from '@/sync/readWikiPage';
import { getWikiPostStates } from '@/sync/wikiPostState';

/** Shows up in the config page's revision history */
const linkUpdateReason = 'wiki-post-bot: update current post links';

/**
 * Write a `# Current post:` link above each config entry that has a post.
 *
 * Our edit fires the wiki edit trigger again, but that sync finds every link
 * already right and doesn't write, so it doesn't loop.
 */
export async function updateConfigPostLinks({
  config,
  configPage,
}: {
  config: AppConfig;
  /** The config page as the caller read and parsed it */
  configPage: WikiPageContent;
}): Promise<void> {
  const { subredditName, configWikiPage } = config;
  const states = await getWikiPostStates();
  const postURLByWikiPage = new Map(
    [...states].map(([wikiPage, state]) => [
      wikiPage,
      getPostURL(subredditName, state.postId),
    ])
  );
  const newContent = writeCurrentPostLinks(
    configPage.content,
    postURLByWikiPage
  );
  if (newContent === configPage.content) return;

  // If a mod edited the config since we read it, leave their edit alone. The
  // next sync reads their version and adds the links then.
  const latest = await readWikiPage(subredditName, configWikiPage);
  if (latest.revisionId !== configPage.revisionId) {
    logger.info('Config page changed during sync; updating links next time');
    return;
  }

  await reddit.updateWikiPage({
    subredditName,
    page: configWikiPage,
    content: newContent,
    reason: linkUpdateReason,
  });
}
