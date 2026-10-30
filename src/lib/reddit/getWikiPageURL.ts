export function getWikiPageURL(
  subredditName: string,
  wikiPage: string
): string {
  return `https://www.reddit.com/r/${subredditName}/wiki/${wikiPage}`;
}
