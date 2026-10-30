import { redis } from '@devvit/web/server';
import type { PostOptions } from '@/config/parsePostMap';

/** What we last did for one wiki page */
export interface WikiPostState {
  /** The post we keep in sync, made by the app account */
  postId: `t3_${string}`;
  /** Wiki revision the post body was last copied from */
  lastSyncedRevisionId: string;
  /** Post options as they are on the post now, to diff against the config */
  appliedOptions: PostOptions;
}

export async function getWikiPostStates(): Promise<Map<string, WikiPostState>> {
  const raw = await redis.hGetAll(wikiPostStatesKey);
  return new Map(
    Object.entries(raw).map(([wikiPage, json]): [string, WikiPostState] => [
      wikiPage,
      JSON.parse(json),
    ])
  );
}

export async function setWikiPostState(
  wikiPage: string,
  state: WikiPostState
): Promise<void> {
  await redis.hSet(wikiPostStatesKey, { [wikiPage]: JSON.stringify(state) });
}

export async function deleteWikiPostStates(wikiPages: string[]): Promise<void> {
  if (wikiPages.length === 0) return;
  await redis.hDel(wikiPostStatesKey, wikiPages);
}

/**
 * Redis hash of wiki page name → JSON `WikiPostState`. A hash (rather than one
 * key per page) lets us list every synced page, which we need to notice
 * entries that were removed from the config.
 */
const wikiPostStatesKey = 'wikiPostStates';
