import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parsePostMap } from '@/config/parsePostMap';
import { commentedOutSampleConfig, sampleConfig } from '@/config/sampleConfig';

describe('sampleConfig', () => {
  it('is in README.md exactly', () => {
    const readme = readFileSync(
      new URL('../../README.md', import.meta.url),
      'utf8'
    );

    expect(readme).toContain(sampleConfig);
  });

  it('parses with no errors', () => {
    expect(parsePostMap(sampleConfig)).toMatchObject({
      isValid: true,
      entries: [{ wikiPage: 'rules' }, { wikiPage: 'weekly-thread' }],
      entryErrors: [],
    });
  });

  it('has no entries when commented out', () => {
    expect(parsePostMap(commentedOutSampleConfig)).toEqual({
      isValid: true,
      entries: [],
      entryErrors: [],
    });
  });
});
