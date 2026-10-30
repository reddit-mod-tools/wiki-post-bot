import { reddit } from '@devvit/web/server';
import { defaultRedditMaxTries } from '@/config/constants';
import { logger } from '@/lib/logger';
import { unescapeWikiMarkdown } from '@/lib/reddit/unescapeWikiMarkdown';
import { withRedditRetries } from '@/lib/reddit/withRedditRetries';

/** The parts of a wiki page we use */
export interface WikiPageContent {
  /** Markdown, already unescaped */
  content: string;
  revisionId: string;
}

export async function readWikiPage(
  subredditName: string,
  wikiPage: string
): Promise<WikiPageContent> {
  const page = await withRedditRetries(
    () => reddit.getWikiPage(subredditName, wikiPage),
    defaultRedditMaxTries,
    logger
  );
  return {
    content: unescapeWikiMarkdown(page.content),
    revisionId: page.revisionId,
  };
}

/**
 * Like `readWikiPage`, but returns null when the page doesn't exist. We
 * check the page list only after a failed read, since that's the rare case
 * and the read error doesn't reliably say "not found".
 */
export async function readWikiPageIfExists(
  subredditName: string,
  wikiPage: string
): Promise<WikiPageContent | null> {
  try {
    return await readWikiPage(subredditName, wikiPage);
  } catch (error) {
    const pages = await reddit.getWikiPages(subredditName);
    if (!pages.some((page) => page.toLowerCase() === wikiPage)) return null;
    throw error;
  }
}
