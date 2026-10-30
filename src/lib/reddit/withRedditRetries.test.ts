import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REDDIT_RATE_LIMIT_WAIT_MS,
  _getRedditRetryAfterMs,
} from '@/lib/reddit/withRedditRetries';

describe(_getRedditRetryAfterMs, () => {
  it('parses TimeString from a Reddit rate-limit error', () => {
    const err = new Error(
      '8 RESOURCE_EXHAUSTED: grpc invocation failed with status 8; RatelimitError(TimeString="5 seconds")'
    );

    expect(_getRedditRetryAfterMs(err)).toBe(5000);
  });

  it('defaults to 5 seconds when TimeString is missing', () => {
    const err = new Error(
      '8 RESOURCE_EXHAUSTED: grpc invocation failed with status 8; RatelimitError()'
    );

    expect(_getRedditRetryAfterMs(err)).toBe(DEFAULT_REDDIT_RATE_LIMIT_WAIT_MS);
  });

  it('returns null for non-rate-limit errors', () => {
    const err = new Error('Something else went wrong');

    expect(_getRedditRetryAfterMs(err)).toBeNull();
  });
});
