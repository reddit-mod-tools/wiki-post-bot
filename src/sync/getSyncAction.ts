import _ from 'lodash';
import type { WikiPostEntry } from '@/config/parsePostMap';
import type { WikiPostState } from '@/sync/wikiPostState';

export enum SyncAction {
  /** No post yet: make one */
  create = 'create',
  /** No post yet, but `postAt` hasn't come */
  wait = 'wait',
  /** The wiki has a new revision, or the config's post options changed */
  update = 'update',
  /** The post already matches the wiki and config */
  none = 'none',
}

interface GetSyncActionOptions {
  entry: Pick<WikiPostEntry, 'postAt' | 'postOptions'>;
  /** Null when we haven't posted this page yet (or it was re-added) */
  state: WikiPostState | null;
  wikiRevisionId: string;
  nowMs: number;
}

/** Decide what a sync should do for one config entry */
export function getSyncAction({
  entry,
  state,
  wikiRevisionId,
  nowMs,
}: GetSyncActionOptions): SyncAction {
  if (state === null) {
    const isBeforePostAt =
      entry.postAt !== null && entry.postAt.getTime() > nowMs;
    return isBeforePostAt ? SyncAction.wait : SyncAction.create;
  }

  const hasNewRevision = state.lastSyncedRevisionId !== wikiRevisionId;
  const hasOptionChanges = !_.isEqual(state.appliedOptions, entry.postOptions);
  return hasNewRevision || hasOptionChanges
    ? SyncAction.update
    : SyncAction.none;
}
