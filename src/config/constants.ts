/**
 * Devvit handler execution limit we plan for. aitomoderator3 measured this
 * with a test job that wrote elapsed seconds to Redis.
 *
 * See https://www.reddit.com/r/Devvit/comments/1v8b951/psa_devvit_scheduled_jobs_have_a_time_limit_of/
 */
export const JOB_RUNTIME_LIMIT_SECONDS = 20;

/** We hold the lock a bit longer than the theoretical limit of how long a job can run to avoid duplicate runs */
export const JOB_STALE_SECONDS = JOB_RUNTIME_LIMIT_SECONDS * 1.5;

export enum JobName {
  syncWikiPosts = 'syncWikiPosts',
}

/** Default retries for flaky Reddit API calls. */
export const defaultRedditMaxTries = 3;
