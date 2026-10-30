import { reddit, type Post } from '@devvit/web/server';
import type { WikiPostEntry } from '@/config/parsePostMap';
import { applyPostOptions, newPostOptions } from '@/sync/applyPostOptions';
import { buildPostBody } from '@/sync/buildPostBody';
import type { WikiPageContent } from '@/sync/readWikiPage';
import type { SyncContext } from '@/sync/syncContext';
import { setWikiPostState } from '@/sync/wikiPostState';

/**
 * Make a new post for a wiki page as the app account, set its sticky,
 * distinguish, lock, and flair, and record it as the page's post.
 */
export async function createWikiPost({
  entry,
  wikiPage,
  context,
}: {
  entry: WikiPostEntry;
  wikiPage: WikiPageContent;
  context: SyncContext;
}): Promise<Post> {
  const { subredditName } = context.config;

  // Look up flair first, so a flair typo fails before we post anything
  if (entry.postOptions.flair !== null) {
    await context.getFlairTemplateId(entry.postOptions.flair);
  }

  const post = await reddit.submitPost({
    subredditName,
    title: entry.title,
    text: buildPostBody({
      wikiMarkdown: wikiPage.content,
      subredditName,
      wikiPage: entry.wikiPage,
    }),
    // The app account has to author the post: only a post's author can edit it
    runAs: 'APP',
  });

  // Save right away, before setting options. If setting an option fails, the
  // next sync retries it on this post instead of making a duplicate.
  await setWikiPostState(entry.wikiPage, {
    postId: post.id,
    lastSyncedRevisionId: wikiPage.revisionId,
    appliedOptions: newPostOptions,
  });
  await applyPostOptions({
    post,
    previous: newPostOptions,
    desired: entry.postOptions,
    context,
  });
  await setWikiPostState(entry.wikiPage, {
    postId: post.id,
    lastSyncedRevisionId: wikiPage.revisionId,
    appliedOptions: entry.postOptions,
  });
  return post;
}
