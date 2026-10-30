/**
 * Reddit's wiki API returns page markdown with `&`, `<`, and `>` HTML-escaped
 * (`content_md` in https://www.reddit.com/dev/api/#GET_wiki_{page}), and
 * Devvit passes it through as-is. Undo that so posts and config write-backs
 * don't end up double-escaped. `&amp;` goes last so `&amp;lt;` becomes `&lt;`.
 */
export function unescapeWikiMarkdown(markdown: string): string {
  return markdown
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}
