import { describe, expect, it, vi } from 'vitest';
import {
  configureLogger,
  _createLogger,
  LogLevel,
  logger,
  _shouldLog,
} from '@/lib/logger';

describe(_shouldLog, () => {
  it('logs levels at or above the minimum severity', () => {
    expect(_shouldLog(LogLevel.error, LogLevel.info)).toBe(true);
    expect(_shouldLog(LogLevel.warn, LogLevel.info)).toBe(true);
    expect(_shouldLog(LogLevel.info, LogLevel.info)).toBe(true);
    expect(_shouldLog(LogLevel.debug, LogLevel.info)).toBe(false);
  });

  it('treats error as the strictest minimum', () => {
    expect(_shouldLog(LogLevel.error, LogLevel.error)).toBe(true);
    expect(_shouldLog(LogLevel.warn, LogLevel.error)).toBe(false);
  });
});

describe(_createLogger, () => {
  it('no-ops disabled levels', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    _createLogger(LogLevel.info).debug('hidden');
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
