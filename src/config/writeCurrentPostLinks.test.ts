import { describe, expect, it } from 'vitest';
import { writeCurrentPostLinks } from '@/config/writeCurrentPostLinks';

describe(writeCurrentPostLinks, () => {
  it('adds and replaces links while keeping mod comments', () => {
    const result = writeCurrentPostLinks(
      configText,
      new Map([
        ['rules', 'https://www.reddit.com/r/example/comments/new1/'],
        ['faq', 'https://www.reddit.com/r/example/comments/new2/'],
      ])
    );

    expect(result).toMatchInlineSnapshot(`
      "# Top comment
      timezone: America/New_York

      posts:
        # Our rules
        # Current post: https://www.reddit.com/r/example/comments/new1/ (set by wiki-post-bot)
        - wikiPage: rules # the rules page
          title: "r/example rules: a very long title that goes well past eighty characters so we can check folding"
          sticky: 1

        # Current post: https://www.reddit.com/r/example/comments/new2/ (set by wiki-post-bot)
        # FAQ comment
        - wikiPage: faq
          title: 'FAQ'
        - wikiPage: weekly
          title: Weekly
          postAt: 2027-01-04 9:00am
      "
    `);
  });

  it('removes links for pages with no post and replaces the first entry link', () => {
    const withLinks = writeCurrentPostLinks(
      configText,
      new Map([['rules', 'https://www.reddit.com/r/example/comments/new1/']])
    );

    const result = writeCurrentPostLinks(
      withLinks,
      new Map([['rules', 'https://www.reddit.com/r/example/comments/new3/']])
    );

    expect(result).toContain(
      '# Our rules\n  # Current post: https://www.reddit.com/r/example/comments/new3/'
    );
    expect(result.match(/Current post:/g)).toHaveLength(1);
  });

  it('returns the same text when the links already match', () => {
    const links = new Map([
      ['rules', 'https://www.reddit.com/r/example/comments/new1/'],
    ]);
    const withLinks = writeCurrentPostLinks(configText, links);

    expect(writeCurrentPostLinks(withLinks, links)).toBe(withLinks);
  });
});

const configText = `# Top comment
timezone: America/New_York

posts:
  # Our rules
  - wikiPage: rules   # the rules page
    title: "r/example rules: a very long title that goes well past eighty characters so we can check folding"
    sticky: 1

  # Current post: https://www.reddit.com/r/example/comments/old/ (set by wiki-post-bot)
  # FAQ comment
  - wikiPage: faq
    title: 'FAQ'
  - wikiPage: weekly
    title: Weekly
    postAt: 2027-01-04 9:00am
`;
