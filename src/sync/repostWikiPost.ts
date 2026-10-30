import { reddit } from '@devvit/web/server';
import type { AppConfig } from '@/config/loadConfig';
import { parsePostMap } from '@/config/parsePostMap';
import { getPostURL } from '@/lib/reddit/getPostURL';
import { createWikiPost } from '@/sync/createWikiPost';
import { readWikiPage, readWikiPageIfExists } from '@/sync/readWikiPage';
import { makeSyncContext } from '@/sync/syncContext';
import { updateConfigPageNotes } from '@/sync/updateConfigPageNotes';
import { getWikiPostStates } from '@/sync/wikiPostState';
import { withSyncLock } from '@/sync/withSyncLock';

/**
 * Replace a bot-managed post with a brand-new post of its wiki page:
 * 1. Unsticky the old post, so its sticky slot is free for the new one
 * 2. Make the new post, with the entry's sticky, distinguish, lock, and flair
 * 3. Lock the old post and pin a mod comment on it linking to the new one
 *
 * Returns a message for the mod who asked.
 */
export async function repostWikiPost(
  config: AppConfig,
  oldPostId: `t3_${string}`
): Promise<string> {
  const message = await withSyncLock(async () => {
    const { subredditName, configWikiPage, makeChanges } = config;
    const states = await getWikiPostStates();
    const wikiPage = [...states].find(
      ([, state]) => state.postId === oldPostId
    )?.[0];
    if (wikiPage === undefined) {
      return "This isn't a wiki-post-bot post, so there's nothing to repost.";
    }

    const configPage = await readWikiPageIfExists(
      subredditName,
      configWikiPage
    );
    const postMap =
      configPage !== null ? parsePostMap(configPage.content) : null;
    const entry = postMap?.isValid
      ? postMap.entries.find((candidate) => candidate.wikiPage === wikiPage)
      : undefined;
    if (configPage === null || entry === undefined) {
      return `The config entry for "${wikiPage}" has an error. Fix it (see "View wiki post status") and try again.`;
    }
    if (!makeChanges) {
      return `Dry run: would repost "${wikiPage}". Turn on "Make live changes" in the app settings to do it.`;
    }

    const context = makeSyncContext(config);
    // Check flair first, so a flair typo fails before we touch the old post
    if (entry.postOptions.flair !== null) {
      await context.getFlairTemplateId(entry.postOptions.flair);
    }
    const [wikiContent, oldPost] = await Promise.all([
      readWikiPage(subredditName, wikiPage),
      reddit.getPostById(oldPostId),
    ]);

    if (oldPost.isStickied()) await oldPost.unsticky();
    const newPost = await createWikiPost({
      entry,
      wikiPage: wikiContent,
      context,
    });
    const newPostURL = getPostURL(subredditName, newPost.id);

    if (!oldPost.isLocked()) await oldPost.lock();
    const comment = await reddit.submitComment({
      id: oldPostId,
      text: `This post has been replaced by a newer version: ${newPostURL}`,
      runAs: 'APP',
    });
    await comment.distinguish(true);

    await updateConfigPageNotes({ config, configPage, configError: null });
    return `Reposted "${wikiPage}": ${newPostURL}`;
  });

  return message ?? 'A sync is running right now. Try again in a minute.';
}
