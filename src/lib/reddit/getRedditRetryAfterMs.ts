export const DEFAULT_REDDIT_RATE_LIMIT_WAIT_MS = 5000;

/** Parse Reddit gRPC rate-limit errors, e.g. RatelimitError(TimeString="5 seconds"). */
export function getRedditRetryAfterMs(err: unknown): number | null {
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
