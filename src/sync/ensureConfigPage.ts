import { reddit, type WikiPagePermissionLevel } from '@devvit/web/server';
import type { AppConfig } from '@/config/loadConfig';
import { commentedOutSampleConfig } from '@/config/sampleConfig';
import { logger } from '@/lib/logger';

/**
 * `WikiPagePermissionLevel.MODS_ONLY`: only mods can view and edit. Devvit
 * exports the enum as a type only, so we use its value directly.
 */
const modsOnlyPermLevel: WikiPagePermissionLevel = 2;

/**
 * Create the config wiki page with the commented-out sample if it doesn't
 * exist yet. We do this even with "Make live changes" off, since mods need
 * the page to set anything up, and it doesn't post anything.
 *
 * Only mods can view and edit the page, like AutoModerator's config.
 */
export async function ensureConfigPage(config: AppConfig): Promise<void> {
  const { subredditName, configWikiPage } = config;
  const pages = await reddit.getWikiPages(subredditName);
  if (pages.some((page) => page.toLowerCase() === configWikiPage)) return;

  await reddit.createWikiPage({
    subredditName,
    page: configWikiPage,
    content: commentedOutSampleConfig,
    reason: 'wiki-post-bot: create config page',
  });
  await reddit.updateWikiPageSettings({
    subredditName,
    page: configWikiPage,
    listed: true,
    permLevel: modsOnlyPermLevel,
  });
  logger.info(`Created config page ${configWikiPage}`);
}
