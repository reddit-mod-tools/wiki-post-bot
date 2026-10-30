import { describe, expect, it } from 'vitest';
import { _unescapeWikiMarkdown } from '@/sync/readWikiPage';

describe(_unescapeWikiMarkdown, () => {
  it('unescapes the entities Reddit adds, without double-unescaping', () => {
    expect(_unescapeWikiMarkdown('&gt; quote &amp; &lt;tag&gt; &amp;lt;')).toBe(
      '> quote & <tag> &lt;'
    );
  });
});
