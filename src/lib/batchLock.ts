import { redis } from '@devvit/web/server';
import { JobName, JOB_STALE_SECONDS } from '@/config/constants';

export function createBatchLockId(): string {
  return crypto.randomUUID();
}

/**
 * Ensures only one scheduler delivery runs a batched job at a time.
 *
 * Each invocation acquires a batch lock with `SET NX`. This prevents duplicate
 * work when Devvit delivers a chained job more than once (at-least-once
 * semantics). The lock is released at the end of the invocation so the next
 * chained call can acquire a fresh lock.
 */
export async function acquireBatchLock(
  jobName: JobName,
  batchLockId: string
): Promise<boolean> {
  const acquired = await redis.set(batchLockKey(jobName), batchLockId, {
    nx: true,
    expiration: new Date(Date.now() + JOB_STALE_SECONDS * 1000),
  });
  return acquired != null && acquired !== '';
}

export async function releaseBatchLock(
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
