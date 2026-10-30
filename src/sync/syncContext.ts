import _ from 'lodash';
import { reddit } from '@devvit/web/server';
import type { AppConfig } from '@/config/loadConfig';
import { defaultRedditMaxTries } from '@/config/constants';
import { logger } from '@/lib/logger';
import { withRedditRetries } from '@/lib/reddit/withRedditRetries';

/** Shared by everything one sync or repost run does */
export interface SyncContext {
  config: AppConfig;
  /** Look up a post flair template ID by its text (see `_findFlairTemplateId`) */
  getFlairTemplateId: (flairText: string) => Promise<string>;
}

export function makeSyncContext(config: AppConfig): SyncContext {
  // Fetched at most once per run, and only if some entry needs flair
  const getFlairTemplates = _.once(() =>
    withRedditRetries(
      () => reddit.getPostFlairTemplates(config.subredditName),
      defaultRedditMaxTries,
      logger
    )
  );

  return {
    config,
    getFlairTemplateId: async (flairText) =>
      _findFlairTemplateId(await getFlairTemplates(), flairText),
  };
}

/**
 * Find the post flair template whose display text matches the config's
 * `flair` (ignoring case and surrounding spaces). Throws with the available
 * flair texts so mods can copy the right one.
 */
export function _findFlairTemplateId(
  templates: { id: string; text: string }[],
  flairText: string
): string {
  const wanted = flairText.trim().toLowerCase();
  const match = templates.find(
    (template) => template.text.trim().toLowerCase() === wanted
  );
  if (match !== undefined) return match.id;

  const available = templates.map((template) => `"${template.text}"`);
  throw new Error(
    available.length > 0
      ? `no post flair named "${flairText}". Available flair: ${available.join(', ')}`
      : `no post flair named "${flairText}"; this subreddit has no post flair set up`
  );
}
