import _ from 'lodash';
import { reddit } from '@devvit/web/server';
import type { AppConfig } from '@/config/loadConfig';
import { defaultRedditMaxTries } from '@/config/constants';
import { logger } from '@/lib/logger';
import { withRedditRetries } from '@/lib/reddit/withRedditRetries';
import { findFlairTemplateId } from '@/sync/findFlairTemplateId';

/** Shared by everything one sync or repost run does */
export interface SyncContext {
  config: AppConfig;
  /** Look up a post flair template ID by its text (see `findFlairTemplateId`) */
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
      findFlairTemplateId(await getFlairTemplates(), flairText),
  };
}
