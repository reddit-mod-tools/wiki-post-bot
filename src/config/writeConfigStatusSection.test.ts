import { describe, expect, it } from 'vitest';
import { parsePostMap } from '@/config/parsePostMap';
import {
  getConfigErrorStatusLines,
  writeConfigStatusSection,
} from '@/config/writeConfigStatusSection';

describe(writeConfigStatusSection, () => {
  it('appends the full config error after the config', () => {
    expect(
      writeConfigStatusSection(
        brokenConfig,
        getConfigErrorStatusLines(getParseError())
      )
    ).toMatchInlineSnapshot(`
      "posts:
        - wikiPage: faq
         title: "FAQ"
          postAt: "2027-01-04"

      # ---- wiki-post-bot status (written by the bot; edits here get replaced) ----
      # The config above has an error, so wiki-post-bot isn't syncing or removing
      # anything until it's fixed:
      #
      # YAML syntax error: Sequence item without - indicator at line 3, column 1:
      #
      #   - wikiPage: faq
      #    title: "FAQ"
      # ^
      # ---- end of wiki-post-bot status ----
      "
    `);
  });

  it("doesn't change the parse error, so the section stays the same each sync", () => {
    const withSection = writeConfigStatusSection(
      brokenConfig,
      getConfigErrorStatusLines(getParseError())
    );

    const result = parsePostMap(withSection);

    expect(result).toEqual({ isValid: false, error: getParseError() });
  });

  it('replaces an existing section instead of adding another', () => {
    const withSection = writeConfigStatusSection(brokenConfig, ['Old status']);

    const result = writeConfigStatusSection(withSection, ['New status']);

    expect(result.match(/wiki-post-bot status \(/g)).toHaveLength(1);
    expect(result).not.toContain('Old status');
  });

  it('removes the section once there is no status, keeping text after it', () => {
    const withSection = `${writeConfigStatusSection(brokenConfig, ['Old status'])}# mod note\n`;

    expect(writeConfigStatusSection(withSection, null)).toBe(
      `${brokenConfig}\n# mod note\n`
    );
  });

  it('returns the same text when the section already matches', () => {
    const lines = getConfigErrorStatusLines(getParseError());
    const withSection = writeConfigStatusSection(brokenConfig, lines);

    expect(writeConfigStatusSection(withSection, lines)).toBe(withSection);
    expect(writeConfigStatusSection(brokenConfig, null)).toBe(brokenConfig);
  });
});

const brokenConfig =
  'posts:\n  - wikiPage: faq\n   title: "FAQ"\n    postAt: "2027-01-04"\n';

function getParseError(): string {
  const result = parsePostMap(brokenConfig);
  if (result.isValid) throw new Error('Expected brokenConfig not to parse');
  return result.error;
}
