import { JobName } from '@/config/constants';
import {
  acquireBatchLock,
  createBatchLockId,
  releaseBatchLock,
} from '@/lib/batchLock';

/**
 * Run `fn` unless another sync or repost is already running, in which case
 * return null. The cron poll, the wiki edit trigger, and mod menu actions can
 * all fire at once, and we don't want two of them making the same post.
 */
export async function withSyncLock<T>(fn: () => Promise<T>): Promise<T | null> {
  const lockId = createBatchLockId();
  if (!(await acquireBatchLock(JobName.syncWikiPosts, lockId))) return null;
  try {
    return await fn();
  } finally {
    await releaseBatchLock(JobName.syncWikiPosts, lockId);
  }
}
