import { describe, expect, it } from 'vitest';
import { unescapeWikiMarkdown } from '@/lib/reddit/unescapeWikiMarkdown';

describe(unescapeWikiMarkdown, () => {
  it('unescapes the entities Reddit adds, without double-unescaping', () => {
    expect(unescapeWikiMarkdown('&gt; quote &amp; &lt;tag&gt; &amp;lt;')).toBe(
      '> quote & <tag> &lt;'
    );
  });
});
