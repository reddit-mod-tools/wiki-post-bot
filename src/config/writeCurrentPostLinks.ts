import { isMap, isSeq, parseDocument } from 'yaml';
import { normalizeWikiPage } from '@/config/normalizeWikiPage';

/** Comment text after `#` that marks our link lines */
const currentPostPrefix = 'Current post:';

/**
 * Add or update the `# Current post: <link>` comment above each entry in the
 * config YAML, and drop it from entries with no post yet.
 *
 * Mods' own comments stay where they are. Returns `configText` unchanged
 * (same string) when no link changed, so callers can skip the wiki edit.
 */
export function writeCurrentPostLinks(
  configText: string,
  /** Post URL for each wiki page that currently has a post */
  postURLByWikiPage: Map<string, string>
): string {
  const doc = parseDocument(configText);
  if (doc.errors.length > 0) return configText;

  const posts = doc.get('posts', true);
  if (!isSeq(posts)) return configText;

  let hasChanges = false;
  posts.items.forEach((item, index) => {
    if (!isMap(item)) return;
    const rawWikiPage = item.get('wikiPage');
    const postURL =
      typeof rawWikiPage === 'string'
        ? (postURLByWikiPage.get(normalizeWikiPage(rawWikiPage)) ?? null)
        : null;

    // The yaml library attaches comments above the first list item to the
    // list itself, so an old link for the first entry can live there
    if (index === 0) {
      const listComment = withoutLinkLines(posts.commentBefore);
      if (listComment !== (posts.commentBefore ?? null)) {
        posts.commentBefore = listComment;
        hasChanges = true;
      }
    }

    const keptLines = withoutLinkLines(item.commentBefore);
    const newComment = [
      postURL !== null
        ? ` ${currentPostPrefix} ${postURL} (set by wiki-post-bot)`
        : null,
      keptLines,
    ]
      .filter((part) => part !== null)
      .join('\n');
    const newCommentOrNull = newComment !== '' ? newComment : null;
    if (newCommentOrNull !== (item.commentBefore ?? null)) {
      item.commentBefore = newCommentOrNull;
      hasChanges = true;
    }
  });

  // Re-serializing can normalize a little whitespace, so only do it when a
  // link actually changed. lineWidth 0 keeps long titles from being folded.
  return hasChanges ? doc.toString({ lineWidth: 0 }) : configText;
}

/** Remove our link lines from a comment; null when nothing is left */
function withoutLinkLines(comment: string | null | undefined): string | null {
  if (comment == null) return null;
  const kept = comment
    .split('\n')
    .filter((line) => !line.trim().startsWith(currentPostPrefix));
  return kept.length > 0 ? kept.join('\n') : null;
}
