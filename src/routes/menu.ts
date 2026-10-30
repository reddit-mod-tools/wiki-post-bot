import { Hono } from 'hono';
import type { Context } from 'hono';
import type { MenuItemRequest, UiResponse } from '@devvit/web/shared';
import { logger } from '@/lib/logger';
import { buildDetailsParagraphForm } from '@/routes/detailForm';
import { loadConfigAndLogger } from '@/routes/loadConfigAndLogger';
import { getStatusDetails } from '@/sync/getStatusDetails';
import { repostWikiPost } from '@/sync/repostWikiPost';
import { syncAllWikiPosts } from '@/sync/syncAllWikiPosts';

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
        form: buildDetailsParagraphForm(
          'Wiki post status',
          await getStatusDetails(config),
          'Status'
        ),
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
