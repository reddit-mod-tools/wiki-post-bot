import { describe, expect, it } from 'vitest';
import { buildPostBody, maxPostBodyLength } from '@/sync/buildPostBody';

describe(buildPostBody, () => {
  it('adds a footer linking to the wiki page', () => {
    expect(
      buildPostBody({
        wikiMarkdown: '# Rules\n\n1. Be nice\n\n',
        subredditName: 'example',
        wikiPage: 'rules',
      })
    ).toBe(
      '# Rules\n\n1. Be nice\n\n---\n\n*This post is copied from the [wiki page](https://www.reddit.com/r/example/wiki/rules) and updates when the wiki changes.*'
    );
  });

  it('cuts off long pages at a line break and links to the full page', () => {
    const line = 'x'.repeat(99);
    const wikiMarkdown = Array.from({ length: 500 }, () => line).join('\n');

    const body = buildPostBody({
      wikiMarkdown,
      subredditName: 'example',
      wikiPage: 'rules',
    });

    expect(body.length).toBeLessThanOrEqual(maxPostBodyLength);
    expect(body).toMatch(
      /x\n\n---\n\n\*This page is too long for a Reddit post/
    );
    expect(body).toContain('(https://www.reddit.com/r/example/wiki/rules)');
  });
});
