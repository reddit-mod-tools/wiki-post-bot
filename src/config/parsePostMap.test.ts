import { describe, expect, it } from 'vitest';
import { parsePostMap } from '@/config/parsePostMap';

describe(parsePostMap, () => {
  it('parses entries and fills in defaults', () => {
    const result = parsePostMap(`
timezone: America/New_York
posts:
  - wikiPage: /wiki/Rules
    title: "r/example rules"
    sticky: 2
    distinguish: true
    flair: Announcement
  - wikiPage: weekly
    title: Weekly
    postAt: "2027-01-04 9:00am"
`);

    expect(result).toEqual({
      isValid: true,
      entryErrors: [],
      entries: [
        {
          wikiPage: 'rules',
          title: 'r/example rules',
          postAt: null,
          postOptions: {
            sticky: 2,
            distinguish: true,
            lock: false,
            flair: 'Announcement',
          },
        },
        {
          wikiPage: 'weekly',
          title: 'Weekly',
          postAt: new Date('2027-01-04T14:00:00.000Z'),
          postOptions: {
            sticky: null,
            distinguish: false,
            lock: false,
            flair: null,
          },
        },
      ],
    });
  });

  it('treats an empty or fully commented-out page as having no entries', () => {
    expect(parsePostMap('# posts:\n#   - wikiPage: rules\n')).toEqual({
      isValid: true,
      entries: [],
      entryErrors: [],
    });
  });

  it.each([
    {
      description: 'a YAML syntax error',
      text: 'posts:\n  - wikiPage: rules\n   title: bad indent',
      expectedError: /^YAML syntax error/,
    },
    {
      description: 'an unknown timezone',
      text: 'timezone: Mars/Olympus\nposts: []',
      expectedError: /^timezone: unknown timezone/,
    },
    {
      description: 'a misspelled top-level key',
      text: 'post:\n  - wikiPage: rules',
      expectedError: /Unrecognized key: "post"/,
    },
  ])('rejects the whole config for $description', ({ text, expectedError }) => {
    const result = parsePostMap(text);

    expect(result.isValid).toBe(false);
    if (result.isValid) return;
    expect(result.error).toMatch(expectedError);
  });

  it('reports bad entries by path and keeps the good ones', () => {
    const result = parsePostMap(`
posts:
  - wikiPage: rules
    title: Rules
  - wikiPage: faq
    title: FAQ
    sticky: 3
  - title: No page
  - wikiPage: Rules
    title: Duplicate
  - wikiPage: weekly
    title: Weekly
    postAt: next tuesday
  - wikiPage: links
    title: Links
    stickey: 1
`);

    expect(result).toMatchObject({
      isValid: true,
      entries: [{ wikiPage: 'rules' }],
      entryErrors: [
        {
          wikiPage: 'faq',
          message: 'posts[1].sticky: must be 1 or 2, or left out to not sticky',
        },
        {
          wikiPage: null,
          message: expect.stringMatching(/^posts\[2\]\.wikiPage:/),
        },
        {
          wikiPage: 'rules',
          message: 'posts[3].wikiPage: "rules" is already used by posts[0]',
        },
        {
          wikiPage: 'weekly',
          message: expect.stringMatching(
            /^posts\[4\]\.postAt: couldn't read "next tuesday"; use a date and time like/
          ),
        },
        {
          wikiPage: 'links',
          message: expect.stringMatching(
            /^posts\[5\]: Unrecognized key: "stickey"/
          ),
        },
      ],
    });
  });
});
