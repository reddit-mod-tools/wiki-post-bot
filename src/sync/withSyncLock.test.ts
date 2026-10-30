import { beforeEach, describe, expect, it, vi } from 'vitest';
import { redis } from '@devvit/web/server';
import { JobName } from '@/config/constants';
import { _acquireBatchLock, _releaseBatchLock } from '@/sync/withSyncLock';

vi.mock('@devvit/web/server', () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    expire: vi.fn(),
  },
}));

describe(_acquireBatchLock, () => {
  beforeEach(() => {
    vi.mocked(redis.set).mockReset();
  });

  it('acquires a batch lock with SET NX and expiration', async () => {
    vi.mocked(redis.set).mockResolvedValue('OK');

    const acquired = await _acquireBatchLock(jobName, batchLockId);

    expect(acquired).toBe(true);
    expect(redis.set).toHaveBeenCalledWith(
      `run:${jobName}:batchLock`,
      batchLockId,
      { nx: true, expiration: expect.any(Date) }
    );
  });

  it('fails to acquire when another invocation holds the batch lock', async () => {
    vi.mocked(redis.set).mockResolvedValue('');

    const acquired = await _acquireBatchLock(jobName, batchLockId);

    expect(acquired).toBe(false);
  });
});

describe(_releaseBatchLock, () => {
  beforeEach(() => {
    vi.mocked(redis.get).mockReset();
    vi.mocked(redis.del).mockReset();
  });

  it('deletes the lock only when the batchLockId matches', async () => {
    vi.mocked(redis.get).mockResolvedValue(batchLockId);

    await _releaseBatchLock(jobName, batchLockId);

    expect(redis.del).toHaveBeenCalledWith(`run:${jobName}:batchLock`);
  });

  it('does not delete the lock when the batchLockId does not match', async () => {
    vi.mocked(redis.get).mockResolvedValue(otherBatchLockId);

    await _releaseBatchLock(jobName, batchLockId);

    expect(redis.del).not.toHaveBeenCalled();
  });
});

const jobName = JobName.syncWikiPosts;
const batchLockId = 'batch-lock-1';
const otherBatchLockId = 'batch-lock-2';
