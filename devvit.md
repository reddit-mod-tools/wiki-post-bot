# devvit.json

This app is configured via [`devvit.json`](devvit.json), the manifest Reddit Devvit uses at build and install time.

## Official documentation

| Topic                                                          | Link                                                                                              |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **JSON schema** (IDE validation, all supported fields)         | [config-file.v1.json](https://developers.reddit.com/schema/config-file.v1.json)                   |
| **Settings & secrets** (global vs subreddit scope, types, CLI) | [Settings & Secrets](https://developers.reddit.com/docs/capabilities/server/settings-and-secrets) |
| **Menu actions**                                               | [Menu Actions](https://developers.reddit.com/docs/capabilities/server/menu-actions)               |
| **Scheduler**                                                  | [Scheduler](https://developers.reddit.com/docs/capabilities/server/scheduler)                     |
| **Triggers**                                                   | [Triggers](https://developers.reddit.com/docs/capabilities/server/triggers)                       |
| **Redis**                                                      | [Redis](https://developers.reddit.com/docs/capabilities/server/redis)                             |
| **Reddit API client**                                          | [Reddit API](https://developers.reddit.com/docs/capabilities/server/reddit-api)                   |

The schema URL is also set as `"$schema"` at the top of `devvit.json` so editors can autocomplete and validate the file.

## What this app's devvit.json defines

- **`name`** — App slug
- **`server`** — Built server bundle entry (`dist/server/index.cjs`)
- **`permissions`** — Moderator Reddit scope and Redis
- **`settings.subreddit`** — Config wiki page name, the dry-run toggle, and log level. Loaded at runtime via [`src/config/loadConfig.ts`](src/config/loadConfig.ts). The wiki page → post map itself lives in the config wiki page; see the [README](README.md#configuration).
- **`menu`** — Subreddit items "Sync wiki posts now" and "View wiki post status", and the post item "Repost from wiki"
- **`forms`** — The status form's dismiss handler
- **`scheduler`** — `syncWikiPosts`, every 5 minutes
- **`triggers`** — `onAppInstall`/`onAppUpgrade` create the config page and sync; `onModAction` syncs on `wikirevise`
- **`dev.subreddit`** — Default playtest subreddit
