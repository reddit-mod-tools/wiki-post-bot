import { Hono } from 'hono';
import type {
  OnAppInstallRequest,
  OnAppUpgradeRequest,
  OnModActionRequest,
  TriggerResponse,
} from '@devvit/web/shared';
import { logger } from '@/lib/logger';
import { loadConfigAndLogger } from '@/routes/loadConfigAndLogger';
import { ensureConfigPage } from '@/sync/ensureConfigPage';
import { syncAllWikiPosts } from '@/sync/syncAllWikiPosts';

export const triggers = new Hono();

triggers.post('/on-app-install', async (c) => {
  const input = await c.req.json<OnAppInstallRequest>();
  logger.info('App installed to subreddit: r/' + input.subreddit?.name);
  return await setUpAndSync(c.json.bind(c));
});

triggers.post('/on-app-upgrade', async (c) => {
  await c.req.json<OnAppUpgradeRequest>();
  return await setUpAndSync(c.json.bind(c));
});

// Mod actions include wiki edits by anyone, logged as `wikirevise`. The event
// doesn't say which page changed, so we sync everything. A sync with nothing
// to do is one wiki read per config entry.
triggers.post('/on-mod-action', async (c) => {
  const input = await c.req.json<OnModActionRequest>();
  if (input.action !== 'wikirevise') {
    return c.json<TriggerResponse>({ status: 'success' }, 200);
  }

  try {
    const config = await loadConfigAndLogger();
    await syncAllWikiPosts(config);
    return c.json<TriggerResponse>({ status: 'success' }, 200);
  } catch (error) {
    logger.error('on-mod-action sync failed', error);
    return c.json<TriggerResponse>({ status: 'success' }, 200);
  }
});

async function setUpAndSync(
  json: (body: TriggerResponse, status: 200) => Response
): Promise<Response> {
  try {
    const config = await loadConfigAndLogger();
    await ensureConfigPage(config);
    await syncAllWikiPosts(config);
  } catch (error) {
    logger.error('Install/upgrade setup failed', error);
  }
  return json({ status: 'success' }, 200);
}
