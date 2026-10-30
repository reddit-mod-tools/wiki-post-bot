import { getWikiPageURL } from '@/lib/reddit/getWikiPageURL';

/**
 * Post body for a wiki page: the page's markdown as-is. Pages over Reddit's
 * limit are cut off at a line break, with a footer pointing to the full page.
 */
export function buildPostBody({
  wikiMarkdown,
  subredditName,
  wikiPage,
}: {
  wikiMarkdown: string;
  subredditName: string;
  wikiPage: string;
}): string {
  const content = wikiMarkdown.trimEnd();
  if (content.length <= maxPostBodyLength) {
    return content;
  }

  const wikiURL = getWikiPageURL(subredditName, wikiPage);
  const cutOffFooter = `\n\n---\n\n*This page is too long for a Reddit post, so it's cut off here. Read the rest on the [wiki page](${wikiURL}).*`;
  const maxContentLength = maxPostBodyLength - cutOffFooter.length;
  const lastLineBreak = content.lastIndexOf('\n', maxContentLength);
  const cutAt = lastLineBreak > 0 ? lastLineBreak : maxContentLength;
  return content.slice(0, cutAt).trimEnd() + cutOffFooter;
}

/** Reddit's character limit for a text post's body */
export const maxPostBodyLength = 40_000;
