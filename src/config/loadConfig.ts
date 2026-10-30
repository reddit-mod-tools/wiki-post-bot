import { z } from 'zod';
import { reddit, settings } from '@devvit/web/server';
import { defaultRedditMaxTries } from '@/config/constants';
import { normalizeWikiPage } from '@/config/normalizeWikiPage';
import { DEFAULT_MIN_LOG_LEVEL, LogLevel } from '@/lib/logger';
import { withRedditRetries } from '@/lib/reddit/withRedditRetries';

/**
 * Resolved app settings for the current subreddit.
 * Field labels and help text live in `devvit.json` under `settings.subreddit`.
 * The wiki page → post map itself lives in the `configWikiPage` wiki page.
 */
export interface AppConfig {
  /** When false, we log what we'd do on Reddit without doing it */
  makeChanges: boolean;
  minLogLevel: LogLevel;
  /** Wiki page holding the YAML page map, e.g. `wiki-post-bot/config` */
  configWikiPage: string;
  subredditName: string;
}

/** Load and validate app config from Devvit settings plus the current subreddit. */
export async function loadConfig(): Promise<AppConfig> {
  const [rawSettings, subreddit] = await Promise.all([
    settings.getAll(),
    withRedditRetries(
      () => reddit.getCurrentSubreddit(),
      defaultRedditMaxTries,
      null
    ),
  ]);

  return {
    ..._parseConfigFromSettings(rawSettings),
    subredditName: subreddit.name,
  };
}

/** Pure helper for tests and validation endpoints. */
export function _parseConfigFromSettings(
  rawSettings: Record<string, unknown>
): Omit<AppConfig, 'subredditName'> {
  const parsed = rawSettingsSchema.safeParse(rawSettings);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(
      `Invalid app settings: ${message}. Raw settings: ${JSON.stringify(rawSettings)}`
    );
  }

  const raw = parsed.data;
  const configWikiPage = normalizeWikiPage(raw.configWikiPage ?? '');
  return {
    makeChanges: raw.makeChanges ?? false,
    minLogLevel: raw.minLogLevel?.[0] ?? DEFAULT_MIN_LOG_LEVEL,
    configWikiPage: configWikiPage || 'wiki-post-bot/config',
  };
}

const rawSettingsSchema = z.object({
  makeChanges: z.boolean().optional(),
  // Devvit returns `select` settings as string arrays (same wire format as multi-select).
  minLogLevel: z
    .array(z.enum(Object.values(LogLevel) as [LogLevel, ...LogLevel[]]))
    .optional(),
  configWikiPage: z.string().optional(),
});
