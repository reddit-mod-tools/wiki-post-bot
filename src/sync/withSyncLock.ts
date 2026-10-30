import { redis } from '@devvit/web/server';
import { JobName } from '@/config/constants';

/**
 * Run `fn` unless another sync or repost is already running, in which case
 * return null. The cron poll, the wiki edit trigger, and mod menu actions can
 * all fire at once, and we don't want two of them making the same post.
 */
export async function withSyncLock<T>(fn: () => Promise<T>): Promise<T | null> {
  const lockId = crypto.randomUUID();
  if (!(await _acquireBatchLock(JobName.syncWikiPosts, lockId))) return null;
  try {
    return await fn();
  } finally {
    await _releaseBatchLock(JobName.syncWikiPosts, lockId);
  }
}

/**
 * Ensures only one scheduler delivery runs a batched job at a time.
 *
 * Each invocation acquires a batch lock with `SET NX`. This prevents duplicate
 * work when Devvit delivers a chained job more than once (at-least-once
 * semantics). The lock is released at the end of the invocation so the next
 * chained call can acquire a fresh lock.
 */
export async function _acquireBatchLock(
  jobName: JobName,
  batchLockId: string
): Promise<boolean> {
  const acquired = await redis.set(batchLockKey(jobName), batchLockId, {
    nx: true,
    expiration: new Date(Date.now() + JOB_STALE_SECONDS * 1000),
  });
  return acquired != null && acquired !== '';
}

export async function _releaseBatchLock(
  jobName: JobName,
  batchLockId: string
): Promise<void> {
  const lockKey = batchLockKey(jobName);
  const current = await redis.get(lockKey);
  if (current === batchLockId) {
    await redis.del(lockKey);
  }
}

function batchLockKey(jobName: JobName): string {
  return `run:${jobName}:batchLock`;
}

/**
 * Devvit handler execution limit we plan for. aitomoderator3 measured this
 * with a test job that wrote elapsed seconds to Redis.
 *
 * See https://www.reddit.com/r/Devvit/comments/1v8b951/psa_devvit_scheduled_jobs_have_a_time_limit_of/
 */
const JOB_RUNTIME_LIMIT_SECONDS = 20;

/** We hold the lock a bit longer than the theoretical limit of how long a job can run to avoid duplicate runs */
const JOB_STALE_SECONDS = JOB_RUNTIME_LIMIT_SECONDS * 1.5;
