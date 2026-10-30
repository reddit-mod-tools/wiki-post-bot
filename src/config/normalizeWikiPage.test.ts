import { describe, expect, it } from 'vitest';
import { normalizeWikiPage } from '@/config/normalizeWikiPage';

describe(normalizeWikiPage, () => {
  it.each([
    { raw: 'rules', expected: 'rules' },
    { raw: ' Rules/ ', expected: 'rules' },
    { raw: '/wiki/guides/FAQ', expected: 'guides/faq' },
    { raw: 'r/example/wiki/rules', expected: 'rules' },
    { raw: 'https://www.reddit.com/r/example/wiki/rules', expected: 'rules' },
  ])('turns "$raw" into "$expected"', ({ raw, expected }) => {
    expect(normalizeWikiPage(raw)).toBe(expected);
  });
});
