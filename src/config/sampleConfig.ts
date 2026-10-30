/**
 * Example page map. Keep in sync with the Configuration section of README.md:
 * `sampleConfig.test.ts` checks that the README contains this text exactly.
 */
export const sampleConfig = `# Timezone for postAt times that don't include one. Leave out to use UTC.
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
`;

/**
 * What we put in a brand-new config page: the sample, commented out, so mods
 * see the docs right where they edit and nothing posts until they opt in.
 */
export const commentedOutSampleConfig = [
  '# wiki-post-bot config',
  '#',
  '# Each entry under `posts` copies a wiki page into a post, then edits the',
  '# post whenever the wiki page changes. Remove an entry to stop syncing it.',
  '# wiki-post-bot adds a "# Current post:" link above each entry it has posted.',
  '#',
  '# Docs and every option: https://github.com/reddit-mod-tools/wiki-post-bot#configuration',
  '#',
  "# In the subreddit's mod menu on new Reddit or the app:",
  '# - "View wiki post status" shows what the last sync did and any config',
  '#   errors.',
  '# - "Sync wiki posts now" syncs right away. Otherwise wiki-post-bot syncs',
  '#   whenever a wiki page is edited, and every 5 minutes.',
  '#',
  '# To start, uncomment the example below (remove the leading "# ") and edit it.',
  '',
  ...sampleConfig
    .trimEnd()
    .split('\n')
    .map((line) => (line === '' ? '' : `# ${line}`)),
  '',
].join('\n');
