import { BasicLogger } from '@/lib/logger';
import { delay } from '@/lib/promise/delay';
import { withRetries } from '@/lib/promise/withRetries';
import { getRedditRetryAfterMs } from '@/lib/reddit/getRedditRetryAfterMs';

export async function withRedditRetries<T>(
  promiseGenerator: () => PromiseLike<T>,
  maxTries: number,
  logger: BasicLogger | null
): Promise<T> {
  return withRetries(
    promiseGenerator,
    maxTries,
    logger?.warn.bind(logger) ?? null,
    {
      shouldRetry: (err) => err.message !== 'not found',
      afterError: async (err) => {
        const retryAfterMs = getRedditRetryAfterMs(err);
        if (retryAfterMs != null) {
          logger?.warn(
            `Reddit rate limit; waiting ${retryAfterMs}ms before retry`
          );
          await delay(retryAfterMs);
        }
      },
    }
  );
}
