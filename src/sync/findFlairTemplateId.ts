/**
 * Find the post flair template whose display text matches the config's
 * `flair` (ignoring case and surrounding spaces). Throws with the available
 * flair texts so mods can copy the right one.
 */
export function findFlairTemplateId(
  templates: { id: string; text: string }[],
  flairText: string
): string {
  const wanted = flairText.trim().toLowerCase();
  const match = templates.find(
    (template) => template.text.trim().toLowerCase() === wanted
  );
  if (match !== undefined) return match.id;

  const available = templates.map((template) => `"${template.text}"`);
  throw new Error(
    available.length > 0
      ? `no post flair named "${flairText}". Available flair: ${available.join(', ')}`
      : `no post flair named "${flairText}"; this subreddit has no post flair set up`
  );
}
