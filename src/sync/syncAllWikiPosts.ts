import moment from 'moment';
import { reddit } from '@devvit/web/server';
import type { AppConfig } from '@/config/loadConfig';
import { parsePostMap, type WikiPostEntry } from '@/config/parsePostMap';
import { logger } from '@/lib/logger';
import { getPostURL } from '@/lib/reddit/getPostURL';
import { getWikiPageURL } from '@/lib/reddit/getWikiPageURL';
import { getUnreachableError } from '@/lib/typescript/getUnreachableError';
import {
  applyPostOptions,
  describePostOptionChanges,
} from '@/sync/applyPostOptions';
import { buildPostBody } from '@/sync/buildPostBody';
import { createWikiPost } from '@/sync/createWikiPost';
import { getRemovedPages } from '@/sync/getRemovedPages';
import { getSyncAction, SyncAction } from '@/sync/getSyncAction';
import {
  readWikiPage,
  readWikiPageIfExists,
  type WikiPageContent,
} from '@/sync/readWikiPage';
import { makeSyncContext, type SyncContext } from '@/sync/syncContext';
import { saveSyncReport, type SyncReport } from '@/sync/syncReport';
import { updateConfigPostLinks } from '@/sync/updateConfigPostLinks';
import {
  deleteWikiPostStates,
  getWikiPostStates,
  setWikiPostState,
  type WikiPostState,
} from '@/sync/wikiPostState';
import { withSyncLock } from '@/sync/withSyncLock';

/**
 * Bring every configured post in line with its wiki page and config entry,
 * and stop syncing pages removed from the config. Returns null when another
 * sync is already running.
 */
export async function syncAllWikiPosts(
  config: AppConfig
): Promise<SyncReport | null> {
  return await withSyncLock(async () => {
    const report: SyncReport = {
      finishedAtMs: Date.now(),
      isDryRun: !config.makeChanges,
      lines: await getSyncLines(config),
    };
    report.lines.forEach((line) => logger.info(line));
    await saveSyncReport(report);
    return report;
  });
}

async function getSyncLines(config: AppConfig): Promise<string[]> {
  const { subredditName, configWikiPage, makeChanges } = config;
  const configURL = getWikiPageURL(subredditName, configWikiPage);
  const configPage = await readWikiPageIfExists(subredditName, configWikiPage);
  if (configPage === null) {
    return [
      `Config page ${configURL} doesn't exist. Reinstall or upgrade the app to create it, or create it yourself.`,
    ];
  }

  const postMap = parsePostMap(configPage.content);
  if (!postMap.isValid) {
    return [
      `Config error in ${configURL}: ${postMap.error}`,
      'Nothing was synced or removed until this is fixed.',
    ];
  }

  const states = await getWikiPostStates();
  const removedPages = getRemovedPages({
    storedPages: [...states.keys()],
    postMap,
  });
  if (makeChanges) await deleteWikiPostStates(removedPages);

  const context = makeSyncContext(config);
  const entryLines: string[] = [];
  // One at a time, so sticky slots get assigned in config order
  for (const entry of postMap.entries) {
    entryLines.push(
      await syncEntry({
        entry,
        state: states.get(entry.wikiPage) ?? null,
        context,
      }).catch((error: unknown) => {
        logger.error(`Failed to sync ${entry.wikiPage}`, error);
        return `${entry.wikiPage}: failed: ${error instanceof Error ? error.message : String(error)}`;
      })
    );
  }

  if (makeChanges) await updateConfigPostLinks({ config, configPage });

  return [
    ...postMap.entryErrors.map((error) => `Config error: ${error.message}`),
    ...removedPages.map(
      (page) =>
        `${page}: ${makeChanges ? 'stopped' : 'would stop'} syncing because it was removed from the config`
    ),
    ...entryLines,
  ];
}

/** Sync one entry and return a status line for it */
async function syncEntry({
  entry,
  state,
  context,
}: {
  entry: WikiPostEntry;
  state: WikiPostState | null;
  context: SyncContext;
}): Promise<string> {
  const { subredditName, makeChanges } = context.config;
  const page = entry.wikiPage;
  const wikiPage = await readWikiPage(subredditName, page).catch(
    (error: unknown) => {
      throw new Error(
        `couldn't read ${getWikiPageURL(subredditName, page)}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  );
  const action = getSyncAction({
    entry,
    state,
    wikiRevisionId: wikiPage.revisionId,
    nowMs: Date.now(),
  });

  switch (action) {
    case SyncAction.none:
      return `${page}: up to date (${getPostURL(subredditName, getStateOrThrow(state).postId)})`;
    case SyncAction.wait:
      return `${page}: waiting to post until ${moment.utc(entry.postAt).format('MMM D, YYYY h:mma [UTC]')}`;
    case SyncAction.create: {
      if (!makeChanges) return `${page}: would make a new post (dry run)`;
      const post = await createWikiPost({ entry, wikiPage, context });
      return `${page}: posted ${getPostURL(subredditName, post.id)}`;
    }
    case SyncAction.update:
      return await updateWikiPost({
        entry,
        state: getStateOrThrow(state),
        wikiPage,
        context,
      });
    default:
      throw getUnreachableError(action);
  }
}

async function updateWikiPost({
  entry,
  state,
  wikiPage,
  context,
}: {
  entry: WikiPostEntry;
  state: WikiPostState;
  wikiPage: WikiPageContent;
  context: SyncContext;
}): Promise<string> {
  const { subredditName, makeChanges } = context.config;
  const page = entry.wikiPage;
  const postURL = getPostURL(subredditName, state.postId);
  const post = await reddit.getPostById(state.postId);

  // Don't fight a mod who removed the post. "Repost from wiki" on the removed
  // post makes a fresh one if they want it back.
  if (post.removed || post.spam) {
    return `${page}: skipped because ${postURL} was removed. Approve it, or use "Repost from wiki" on it to make a new post.`;
  }

  const hasNewRevision = state.lastSyncedRevisionId !== wikiPage.revisionId;
  const changes = [
    hasNewRevision ? 'copy the new wiki revision' : null,
    ...describePostOptionChanges(state.appliedOptions, entry.postOptions),
  ].filter((change) => change !== null);
  if (!makeChanges) {
    return `${page}: would ${changes.join(', ')} on ${postURL} (dry run)`;
  }

  if (hasNewRevision) {
    await post.edit({
      text: buildPostBody({
        wikiMarkdown: wikiPage.content,
        subredditName,
        wikiPage: page,
      }),
    });
  }
  await applyPostOptions({
    post,
    previous: state.appliedOptions,
    desired: entry.postOptions,
    context,
  });
  await setWikiPostState(page, {
    postId: state.postId,
    lastSyncedRevisionId: wikiPage.revisionId,
    appliedOptions: entry.postOptions,
  });
  return `${page}: ${changes.join(', ')} on ${postURL}`;
}

/** `getSyncAction` only returns `none` or `update` when there's a state */
function getStateOrThrow(state: WikiPostState | null): WikiPostState {
  if (state === null) {
    throw new Error('Expected a stored post for this action');
  }
  return state;
}
