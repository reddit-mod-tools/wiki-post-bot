import { describe, expect, it } from 'vitest';
import { parsePostMap } from '@/config/parsePostMap';
import { getRemovedPages } from '@/sync/getRemovedPages';

describe(getRemovedPages, () => {
  it.each([
    {
      description: 'returns stored pages no longer in the config',
      config: 'posts:\n  - wikiPage: rules\n    title: Rules',
      expected: ['faq'],
    },
    {
      description: 'keeps a page whose entry has an error',
      config:
        'posts:\n  - wikiPage: rules\n    title: Rules\n  - wikiPage: faq\n    sticky: 3',
      expected: [],
    },
    {
      description: 'removes nothing when an entry has no readable wikiPage',
      config: 'posts:\n  - title: Missing page',
      expected: [],
    },
    {
      description: 'removes nothing when the config has a syntax error',
      config: 'posts:\n  - wikiPage: rules\n   title: bad indent',
      expected: [],
    },
    {
      description: 'removes everything when every entry is gone',
      config: '# posts: []',
      expected: ['rules', 'faq'],
    },
  ])('$description', ({ config, expected }) => {
    expect(
      getRemovedPages({
        storedPages: ['rules', 'faq'],
        postMap: parsePostMap(config),
      })
    ).toEqual(expected);
  });
});
