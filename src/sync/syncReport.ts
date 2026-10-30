import { redis } from '@devvit/web/server';

const lastSyncReportKey = 'lastSyncReport';

/** What the last full sync did, for "View wiki post status" */
export interface SyncReport {
  finishedAtMs: number;
  /** True when "Make live changes" was off, so lines say what we would do */
  isDryRun: boolean;
  lines: string[];
}

export async function saveSyncReport(report: SyncReport): Promise<void> {
  await redis.set(lastSyncReportKey, JSON.stringify(report));
}

/** Null before the first sync after install */
export async function getLastSyncReport(): Promise<SyncReport | null> {
  const json = await redis.get(lastSyncReportKey);
  return json != null ? JSON.parse(json) : null;
}
