import { LoggerFunction } from '@/lib/logger';

export interface WithRetriesOptions {
  /**
   * Can be used to only retry for certain errors. Return false and the error
   * will be immediately rethrown
   */
  shouldRetry?: (err: Error) => boolean;
  /**
   * If the `promiseGenerator` runs into an error, run this function. Runs
   * even if the error is on the last try. This can be an async function.
   */
  afterError?: (err: Error) => Promise<any>;
}

/** Execute one promise generator up to n times before calling it quits */
export async function withRetries<T>(
  promiseGenerator: () => PromiseLike<T>,
  maxTries: number,
  /**
   * In general, if we fail and need to retry, we want to at least
   * log to logger.warn. However, if failures are completely expected,
   * we can pass `null` to not log anything at all
   */
  errorLogger: LoggerFunction | null,
  options: WithRetriesOptions = {}
): Promise<T> {
  const { shouldRetry, afterError } = options;

  for (let i = 0; i !== maxTries - 1; i++) {
    try {
      const result = await promiseGenerator();
      return result;
    } catch (errUnknown) {
      const err = errUnknown as Error;
      if (shouldRetry && !shouldRetry(err)) throw err;
      if (errorLogger) {
        logErrorOmittingResponse({
          errorLogger,
          err,
          currentTry: i + 1,
          maxTries,
        });
      }
      if (afterError) await afterError(err);
    }
  }

  // For the last try, just use unwrapped. This is needed so that we typecheck
  // or otherwise it'll think the function can return undefined
  try {
    const result = await promiseGenerator();
    return result;
  } catch (errUnknown) {
    const err = errUnknown as Error;
    if (shouldRetry && !shouldRetry(err)) throw err;
    if (errorLogger) {
      logErrorOmittingResponse({
        errorLogger,
        err,
        currentTry: maxTries,
        maxTries,
      });
    }
    if (afterError) await afterError(err);
    throw err;
  }
}

function logErrorOmittingResponse({
  errorLogger,
  err,
  currentTry,
  maxTries,
}: {
  errorLogger: LoggerFunction;
  err: Error;
  currentTry: number;
  maxTries: number;
}) {
  errorLogger(`withRetries (try ${currentTry} of ${maxTries}): got an error`);
  const errAny = err as any;
  if (errAny.response) {
    errorLogger(err.message);
    errorLogger(err.stack);
    if (errAny.options) {
      errorLogger(errAny.options);
    } else {
      errorLogger(err);
    }
  }
}
