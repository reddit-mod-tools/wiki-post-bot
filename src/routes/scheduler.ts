import { Hono } from 'hono';
import { JobName } from '@/config/constants';
import { logger } from '@/lib/logger';
import { loadConfigAndLogger } from '@/routes/loadConfigAndLogger';
import { syncAllWikiPosts } from '@/sync/syncAllWikiPosts';

export const scheduler = new Hono();

// Every 5 minutes (see devvit.json). This catches wiki edits the trigger
// missed, and makes posts whose postAt time has come.
scheduler.post('/sync-wiki-posts', async (c) => {
  try {
    const config = await loadConfigAndLogger();
    const report = await syncAllWikiPosts(config);
    if (report === null) {
      logger.info(`${JobName.syncWikiPosts}: skipped; another sync is running`);
    }
    return c.json({}, 200);
  } catch (error) {
    logger.error(`${JobName.syncWikiPosts} scheduler handler failed`, error);
    return c.json({}, 500);
  }
});
