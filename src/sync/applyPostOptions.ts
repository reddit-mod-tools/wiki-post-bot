import { reddit, type Post } from '@devvit/web/server';
import type { PostOptions } from '@/config/parsePostMap';
import type { SyncContext } from '@/sync/syncContext';

/** Options of a freshly made post, before we've set anything */
export const newPostOptions: PostOptions = {
  sticky: null,
  distinguish: false,
  lock: false,
  flair: null,
};

/** Set whatever differs between `previous` and `desired` on the post */
export async function applyPostOptions({
  post,
  previous,
  desired,
  context,
}: {
  post: Post;
  previous: PostOptions;
  desired: PostOptions;
  context: SyncContext;
}): Promise<void> {
  const { subredditName } = context.config;

  if (desired.sticky !== previous.sticky) {
    await (desired.sticky !== null
      ? post.sticky(desired.sticky)
      : post.unsticky());
  }
  if (desired.distinguish !== previous.distinguish) {
    await (desired.distinguish ? post.distinguish() : post.undistinguish());
  }
  if (desired.lock !== previous.lock) {
    await (desired.lock ? post.lock() : post.unlock());
  }
  if (desired.flair !== previous.flair) {
    await (desired.flair !== null
      ? reddit.setPostFlair({
          subredditName,
          postId: post.id,
          flairTemplateId: await context.getFlairTemplateId(desired.flair),
        })
      : reddit.removePostFlair(subredditName, post.id));
  }
}

/** Human-readable list of what `applyPostOptions` would change */
export function describePostOptionChanges(
  previous: PostOptions,
  desired: PostOptions
): string[] {
  return [
    desired.sticky !== previous.sticky
      ? desired.sticky !== null
        ? `sticky in slot ${desired.sticky}`
        : 'unsticky'
      : null,
    desired.distinguish !== previous.distinguish
      ? desired.distinguish
        ? 'distinguish'
        : 'undistinguish'
      : null,
    desired.lock !== previous.lock ? (desired.lock ? 'lock' : 'unlock') : null,
    desired.flair !== previous.flair
      ? desired.flair !== null
        ? `set flair "${desired.flair}"`
        : 'remove flair'
      : null,
  ].filter((change) => change !== null);
}
