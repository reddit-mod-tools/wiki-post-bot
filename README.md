# wiki-post-bot

A Reddit Devvit app that keeps posts in sync with your subreddit's wiki pages.
List which wiki pages to post in a config wiki page, and wiki-post-bot:

1. Posts each wiki page as a text post, right away or at a time you pick
2. Edits the post whenever someone edits the wiki page
3. Optionally stickies, distinguishes (marks as from a moderator), locks, and
   flairs the post
4. Makes a fresh post when a mod picks **Repost from wiki** on one of its posts

## Setup

1. Install the app on your subreddit from its page on developers.reddit.com.
2. The app creates the config page at `/wiki/wiki-post-bot/config` with a
   commented-out example, a link to these docs, and how to check status or
   sync right away. Only mods can see or edit it. On subreddits that show the
   newer wiki on new Reddit, edit it on old Reddit:
   `https://old.reddit.com/r/<subreddit>/wiki/edit/wiki-post-bot/config`.
3. Edit the config page (see [Configuration](#configuration)).
4. In the app's install settings, **Make live changes** starts off. While it's
   off, the bot only reports what it would do: open the subreddit's mod menu
   and pick **View wiki post status** to check. Turn it on when the plan looks
   right.

## Configuration

The config page is YAML, like AutoModerator's config. Each entry under
`posts` maps one wiki page to one post:

<!-- prettier-ignore -->
```yaml
# Timezone for postAt times that don't include one. Leave out to use UTC.
# Names come from https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
timezone: America/New_York

posts:
  - wikiPage: rules             # wiki page name: the part after /wiki/
    title: "r/example rules"    # post title (Reddit doesn't allow editing titles)
    sticky: 1                   # 1 or 2 to sticky in that slot; leave out to not sticky
    distinguish: true           # mark the post as from a moderator
    lock: false                 # lock comments on the post
    flair: "Announcement"       # post flair, matched by its display text
  - wikiPage: weekly-thread
    title: "Weekly discussion"
    postAt: "2027-01-04 9:00am" # don't make the first post before this time
```

| Field         | Required | Default    | What it does                                                                                                    |
| ------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `timezone`    | No       | UTC        | Top level. Timezone for `postAt` times without an offset, as a [tz database name][tz] like `America/New_York`.  |
| `wikiPage`    | Yes      |            | Wiki page name: the part of the URL after `/wiki/`, e.g. `rules` or `guides/faq`.                               |
| `title`       | Yes      |            | Post title. Reddit doesn't allow editing titles, so a change only applies to the next repost.                   |
| `sticky`      | No       | not sticky | `1` or `2` to sticky the post in that slot.                                                                     |
| `distinguish` | No       | `false`    | `true` to mark the post as from a moderator.                                                                    |
| `lock`        | No       | `false`    | `true` to lock comments on the post.                                                                            |
| `flair`       | No       | no flair   | Post flair, matched by its display text (not case-sensitive). If it doesn't match, the status lists your flair. |
| `postAt`      | No       | right away | Don't make the first post before this time. See [Scheduling](#scheduling).                                      |

Changes to `sticky`, `distinguish`, `lock`, and `flair` apply to the
existing post on the next sync.

### What the bot writes into the config

After it posts a page, the bot adds a comment above that entry linking to the
post, so you can always find it:

```yaml
posts:
  # Current post: https://www.reddit.com/r/example/comments/abc123/ (set by wiki-post-bot)
  - wikiPage: rules
```

It only changes these `# Current post:` lines. Your own comments stay put.

### Removing an entry

Delete an entry to stop syncing that page. The bot leaves the existing post
alone. If you add the entry back later, the bot makes a new post.

If the config has a YAML error, the bot doesn't sync or stop syncing anything
until it's fixed. It adds a status section with the full error at the end
of the config page, and removes it once the config is fixed. **View wiki post
status** in the mod menu shows the error too.

### Scheduling

`postAt` holds back a page's first post. These formats work:

- `"2027-01-04 9:00am"`, `"2027-01-04 9:00 PM"`, `"2027-01-04 21:00"`
- `"Jan 4, 2027 9:00am"`, `"January 4 2027 9:00 am"`
- `"2027-01-04T09:00"`, or with an offset: `"2027-01-04T09:00-05:00"`
- `"2027-01-04"` for midnight

The bot checks every 5 minutes, so the post goes up within about 5 minutes of
`postAt`. `postAt` has no effect once the page has been posted.

## How syncing works

- When anyone edits a wiki page, the app gets a `wikirevise` mod action
  event and syncs right away.
- Every 5 minutes, it also checks every configured page, in case it missed an
  event and to make scheduled posts.
- **Sync wiki posts now** in the subreddit mod menu runs a sync on demand.
- Pages longer than Reddit's 40,000-character post limit are cut off with a
  link to the full wiki page.
- If a mod removes a bot post, the bot stops editing it. Approve the post, or
  use **Repost from wiki** on it to make a fresh one.

### Repost from wiki

Pick **Repost from wiki** in the mod menu of a post made by wiki-post-bot.
The bot:

1. Unstickies the old post
2. Makes a new post from the current wiki page, with the entry's sticky,
   distinguish, lock, and flair
3. Locks the old post and adds a pinned mod comment linking to the new one
4. Updates the `# Current post:` link in the config

## Development

```sh
npm install
npm run login       # once
npm run dev         # playtest on r/wiki_post_bot_dev
npm test
npm run type-check
npm run lint
npm run deploy      # type-check, lint, and upload
```

See [devvit.md](devvit.md) for what `devvit.json` configures.

[tz]: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
