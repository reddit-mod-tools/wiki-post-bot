import { BasicLogger } from '@/lib/logger';
import { withRetries } from '@/lib/promise/withRetries';

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
        const retryAfterMs = _getRedditRetryAfterMs(err);
        if (retryAfterMs != null) {
          logger?.warn(
            `Reddit rate limit; waiting ${retryAfterMs}ms before retry`
          );
          await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
        }
      },
    }
  );
}

/** Parse Reddit gRPC rate-limit errors, e.g. RatelimitError(TimeString="5 seconds"). */
export function _getRedditRetryAfterMs(err: unknown): number | null {
  const message = err instanceof Error ? err.message : String(err);

  if (
    !message.includes('RESOURCE_EXHAUSTED') &&
    !message.includes('RatelimitError')
  ) {
    return null;
  }

  const timeMatch = message.match(/TimeString="(\d+)\s*seconds?"/i);
  if (timeMatch && timeMatch[1]) {
    const seconds = parseInt(timeMatch[1], 10);
    if (!Number.isNaN(seconds)) {
      return seconds * 1000;
    }
  }

  return DEFAULT_REDDIT_RATE_LIMIT_WAIT_MS;
}

export const DEFAULT_REDDIT_RATE_LIMIT_WAIT_MS = 5000;
