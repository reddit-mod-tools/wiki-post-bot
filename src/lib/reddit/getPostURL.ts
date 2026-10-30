/** Short permalink for a post; we build it from the ID so we don't need to fetch the post */
export function getPostURL(
  subredditName: string,
  postId: `t3_${string}`
): string {
  return `https://www.reddit.com/r/${subredditName}/comments/${postId.replace(/^t3_/, '')}/`;
}
