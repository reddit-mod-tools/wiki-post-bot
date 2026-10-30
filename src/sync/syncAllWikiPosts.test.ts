import { describe, expect, it } from 'vitest';
import { parsePostMap, type PostOptions } from '@/config/parsePostMap';
import {
  _getRemovedPages,
  _getSyncAction,
  SyncAction,
} from '@/sync/syncAllWikiPosts';
import type { WikiPostState } from '@/sync/wikiPostState';

describe(_getSyncAction, () => {
  it.each([
    {
      description: 'creates a post when there is none and no postAt',
      postAt: null,
      state: null,
      expected: SyncAction.create,
    },
    {
      description: 'creates a post once postAt has passed',
      postAt: new Date(nowMs - 1),
      state: null,
      expected: SyncAction.create,
    },
    {
      description: 'waits when postAt is in the future',
      postAt: new Date(nowMs + 60_000),
      state: null,
      expected: SyncAction.wait,
    },
    {
      description: 'ignores a future postAt once posted',
      postAt: new Date(nowMs + 60_000),
      state: makeState({ lastSyncedRevisionId: 'rev-1' }),
      expected: SyncAction.none,
    },
    {
      description: 'updates when the wiki has a new revision',
      postAt: null,
      state: makeState({ lastSyncedRevisionId: 'rev-0' }),
      expected: SyncAction.update,
    },
    {
      description: 'updates when the config post options changed',
      postAt: null,
      state: makeState({
        lastSyncedRevisionId: 'rev-1',
        appliedOptions: { ...postOptions, sticky: null },
      }),
      expected: SyncAction.update,
    },
  ])('$description', ({ postAt, state, expected }) => {
    expect(
      _getSyncAction({
        entry: { postAt, postOptions },
        state,
        wikiRevisionId: 'rev-1',
        nowMs,
      })
    ).toBe(expected);
  });
});

describe(_getRemovedPages, () => {
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
      _getRemovedPages({
        storedPages: ['rules', 'faq'],
        postMap: parsePostMap(config),
      })
    ).toEqual(expected);
  });
});

const nowMs = Date.UTC(2027, 0, 4);

const postOptions: PostOptions = {
  sticky: 1,
  distinguish: true,
  lock: false,
  flair: null,
};

function makeState(
  overrides: Pick<WikiPostState, 'lastSyncedRevisionId'> &
    Partial<Pick<WikiPostState, 'appliedOptions'>>
): WikiPostState {
  return { postId: 't3_abc', appliedOptions: postOptions, ...overrides };
}
