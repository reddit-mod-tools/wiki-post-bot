import { describe, expect, it, vi } from 'vitest';

vi.mock('@devvit/web/server', () => ({ reddit: {}, settings: {} }));

import { _parseConfigFromSettings } from '@/config/loadConfig';

describe(_parseConfigFromSettings, () => {
  it('uses defaults when settings are unset', () => {
    expect(_parseConfigFromSettings({})).toEqual({
      makeChanges: true,
      minLogLevel: 'info',
      configWikiPage: 'wiki-post-bot/config',
    });
  });

  it('normalizes the config wiki page', () => {
    expect(
      _parseConfigFromSettings({ configWikiPage: '/wiki/Mods/Wiki-Posts' })
        .configWikiPage
    ).toBe('mods/wiki-posts');
  });
});
