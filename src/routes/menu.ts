import moment from 'moment';
import { Hono } from 'hono';
import type { Context } from 'hono';
import type { MenuItemRequest, UiResponse } from '@devvit/web/shared';
import type { AppConfig } from '@/config/loadConfig';
import { logger } from '@/lib/logger';
import { getWikiPageURL } from '@/lib/reddit/getWikiPageURL';
import { loadConfigAndLogger } from '@/routes/loadConfigAndLogger';
import { repostWikiPost } from '@/sync/repostWikiPost';
import { syncAllWikiPosts } from '@/sync/syncAllWikiPosts';
import { getLastSyncReport } from '@/sync/syncReport';

export const menu = new Hono();

menu.post('/sync-now', async (c) => {
  return await handleMenuAction(c, 'sync-now', async () => {
    const config = await loadConfigAndLogger();
    const report = await syncAllWikiPosts(config);
    return {
      showToast:
        report !== null
          ? {
              text: `Synced${report.isDryRun ? ' (dry run)' : ''}. See "View wiki post status" for details.`,
              appearance: 'success',
            }
          : 'A sync is already running. Try again in a minute.',
    };
  });
});

menu.post('/view-status', async (c) => {
  return await handleMenuAction(c, 'view-status', async () => {
    const config = await loadConfigAndLogger();
    return {
      showForm: {
        name: 'viewStatus',
        form: {
          title: 'Wiki post status',
          acceptLabel: 'Done',
          fields: [
            {
              name: 'details',
              label: 'Status',
              type: 'paragraph',
              lineHeight: 40,
              defaultValue: await getStatusDetails(config),
              disabled: true,
            },
          ],
        },
      },
    };
  });
});

menu.post('/repost', async (c) => {
  return await handleMenuAction(c, 'repost', async () => {
    const { targetId } = await c.req.json<MenuItemRequest>();
    const config = await loadConfigAndLogger();
    // The menu item is only on posts (see devvit.json), so this is a t3_ ID
    const message = await repostWikiPost(config, targetId as `t3_${string}`);
    return { showToast: message };
  });
});

/** Run a menu action and turn any error into a toast */
async function handleMenuAction(
  c: Context,
  name: string,
  run: () => Promise<UiResponse>
): Promise<Response> {
  try {
    return c.json<UiResponse>(await run(), 200);
  } catch (error) {
    logger.error(`${name} failed`, error);
    const message = error instanceof Error ? error.message : String(error);
    return c.json<UiResponse>({ showToast: `Failed: ${message}` }, 200);
  }
}

/** Text for the "View wiki post status" form */
async function getStatusDetails(config: AppConfig): Promise<string> {
  const report = await getLastSyncReport();
  const reportLines =
    report !== null
      ? [
          `Last sync: ${moment.utc(report.finishedAtMs).format('MMM D, YYYY h:mma [UTC]')}${report.isDryRun ? ' (dry run)' : ''}`,
          ...(report.lines.length > 0
            ? report.lines.map((line) => `- ${line}`)
            : ['- No entries in the config yet']),
        ]
      : ['No sync has run yet. Use "Sync wiki posts now" to run one.'];

  return [
    `Config page: ${getWikiPageURL(config.subredditName, config.configWikiPage)}`,
    `Make live changes: ${config.makeChanges ? 'on' : 'off (dry run)'}`,
    '',
    ...reportLines,
  ].join('\n');
}
