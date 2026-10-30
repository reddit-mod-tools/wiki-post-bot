/**
 * Both winston and console loggers ultimately accept any type as their
 * first argument, despite having stricter typings.
 *
 * This is obviously true for the browser `console.log`. This is true for
 * Winston as well: see https://github.com/winstonjs/winston/blob/68ea786/lib/winston/logger.js#L216
 *
 * To allow for logging arbitrary types, we make this just accept `any` args.
 */
export type LoggerFunction = (...args: any[]) => unknown;

/** A basic interface involving the 2 main logging functions we use */
export interface BasicLogger {
  info: LoggerFunction;
  error: LoggerFunction;
  warn: LoggerFunction;
  debug: LoggerFunction;
}

export enum LogLevel {
  error = 'error',
  warn = 'warn',
  info = 'info',
  debug = 'debug',
}

export const DEFAULT_MIN_LOG_LEVEL = LogLevel.info;

const LOG_LEVEL_RANK: Record<LogLevel, number> = {
  [LogLevel.error]: 0,
  [LogLevel.warn]: 1,
  [LogLevel.info]: 2,
  [LogLevel.debug]: 3,
};

export function parseLogLevel(value: string | undefined): LogLevel {
  if (value && Object.values(LogLevel).includes(value as LogLevel)) {
    return value as LogLevel;
  }
  return DEFAULT_MIN_LOG_LEVEL;
}

export function shouldLog(level: LogLevel, minLogLevel: LogLevel): boolean {
  return LOG_LEVEL_RANK[level] <= LOG_LEVEL_RANK[minLogLevel];
}

export function createLogger(
  minLogLevel: LogLevel = DEFAULT_MIN_LOG_LEVEL
): BasicLogger {
  const noop = () => {};

  return {
    error: shouldLog(LogLevel.error, minLogLevel)
      ? // eslint-disable-next-line no-console
        console.error.bind(console)
      : noop,
    warn: shouldLog(LogLevel.warn, minLogLevel)
      ? // eslint-disable-next-line no-console
        console.warn.bind(console)
      : noop,
    info: shouldLog(LogLevel.info, minLogLevel)
      ? // eslint-disable-next-line no-console
        console.info.bind(console)
      : noop,
    debug: shouldLog(LogLevel.debug, minLogLevel)
      ? // eslint-disable-next-line no-console
        console.debug.bind(console)
      : noop,
  };
}

let loggerInstance = createLogger(DEFAULT_MIN_LOG_LEVEL);

/** Updates the shared logger used outside job batches (routes, helpers). */
export function configureLogger(minLogLevel: LogLevel): void {
  loggerInstance = createLogger(minLogLevel);
}

export const logger: BasicLogger = {
  error: (...args) => loggerInstance.error(...args),
  warn: (...args) => loggerInstance.warn(...args),
  info: (...args) => loggerInstance.info(...args),
  debug: (...args) => loggerInstance.debug(...args),
};
