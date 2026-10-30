import moment from 'moment';
import type { AppConfig } from '@/config/loadConfig';
import { getWikiPageURL } from '@/lib/reddit/getWikiPageURL';
import { getLastSyncReport } from '@/sync/syncReport';

/** Text for the "View wiki post status" form */
export async function getStatusDetails(config: AppConfig): Promise<string> {
  const report = await getLastSyncReport();
  const reportLines =
    report !== null
      ? [
          `Last sync: ${moment.utc(report.finishedAtMs).format('MMM D, YYYY h:mma [UTC]')}${report.isDryRun ? ' (dry run)' : ''}`,
          ...(report.lines.length > 0
            ? report.lines.map((line) => `- ${line}`)
            : ['- No entries in the config yet']),
        ]
      : ['No sync has run yet. Use "Sync wiki posts now" to run one.'];

  return [
    `Config page: ${getWikiPageURL(config.subredditName, config.configWikiPage)}`,
    `Make live changes: ${config.makeChanges ? 'on' : 'off (dry run)'}`,
    '',
    ...reportLines,
  ].join('\n');
}
