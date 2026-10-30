import { loadConfig, type AppConfig } from '@/config/loadConfig';
import { configureLogger } from '@/lib/logger';

/** Load settings and apply their log level; every handler starts with this */
export async function loadConfigAndLogger(): Promise<AppConfig> {
  const config = await loadConfig();
  configureLogger(config.minLogLevel);
  return config;
}
