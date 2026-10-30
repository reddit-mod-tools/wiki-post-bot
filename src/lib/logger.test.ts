import { describe, expect, it, vi } from 'vitest';
import {
  configureLogger,
  createLogger,
  LogLevel,
  logger,
  shouldLog,
} from '@/lib/logger';

describe(shouldLog, () => {
  it('logs levels at or above the minimum severity', () => {
    expect(shouldLog(LogLevel.error, LogLevel.info)).toBe(true);
    expect(shouldLog(LogLevel.warn, LogLevel.info)).toBe(true);
    expect(shouldLog(LogLevel.info, LogLevel.info)).toBe(true);
    expect(shouldLog(LogLevel.debug, LogLevel.info)).toBe(false);
  });

  it('treats error as the strictest minimum', () => {
    expect(shouldLog(LogLevel.error, LogLevel.error)).toBe(true);
    expect(shouldLog(LogLevel.warn, LogLevel.error)).toBe(false);
  });
});

describe(createLogger, () => {
  it('no-ops disabled levels', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    createLogger(LogLevel.info).debug('hidden');
    expect(debugSpy).not.toHaveBeenCalled();
    debugSpy.mockRestore();
  });
});

describe(configureLogger, () => {
  it('updates the shared logger', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    configureLogger(LogLevel.debug);
    logger.debug('visible');
    expect(debugSpy).toHaveBeenCalledWith('visible');

    configureLogger(LogLevel.info);
    logger.debug('hidden');
    expect(debugSpy).toHaveBeenCalledTimes(1);

    debugSpy.mockRestore();
  });
});
