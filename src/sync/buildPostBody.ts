import { getWikiPageURL } from '@/lib/reddit/getWikiPageURL';

/** Reddit's character limit for a text post's body */
export const maxPostBodyLength = 40_000;

/**
 * Post body for a wiki page: the page's markdown plus a footer linking back
 * to the wiki. Pages over Reddit's limit are cut off at a line break, with a
 * note pointing to the full page.
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
  const wikiURL = getWikiPageURL(subredditName, wikiPage);
  const content = wikiMarkdown.trimEnd();
  const footer = `\n\n---\n\n*This post is copied from the [wiki page](${wikiURL}) and updates when the wiki changes.*`;
  if (content.length + footer.length <= maxPostBodyLength) {
    return content + footer;
  }

  const cutOffFooter = `\n\n---\n\n*This page is too long for a Reddit post, so it's cut off here. Read the rest on the [wiki page](${wikiURL}).*`;
  const maxContentLength = maxPostBodyLength - cutOffFooter.length;
  const lastLineBreak = content.lastIndexOf('\n', maxContentLength);
  const cutAt = lastLineBreak > 0 ? lastLineBreak : maxContentLength;
  return content.slice(0, cutAt).trimEnd() + cutOffFooter;
}
