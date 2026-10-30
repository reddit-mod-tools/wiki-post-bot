/**
 * What we write when the config can't be parsed at all: a short explanation,
 * then the full error. YAML errors span several lines (a message, then the
 * bad line with a `^` under the problem), so we keep their line breaks.
 */
export function getConfigErrorStatusLines(error: string): string[] {
  return [
    "The config above has an error, so wiki-post-bot isn't syncing or removing",
    "anything until it's fixed:",
    '',
    ...error
      .trimEnd()
      .split('\n')
      .map((line) => line.trimEnd()),
  ];
}

/**
 * Replace the status section at the end of the config page, or remove it
 * when `statusLines` is null. Works on plain text, since we write this when
 * the YAML itself is broken.
 *
 * Returns `configText` unchanged (same string) when nothing changed.
 */
export function writeConfigStatusSection(
  configText: string,
  statusLines: string[] | null
): string {
  const withoutSection = removeStatusSection(configText);
  const newText =
    statusLines !== null
      ? [
          withoutSection.trimEnd(),
          '',
          startMarker,
          ...statusLines.map((line) => (line !== '' ? `# ${line}` : '#')),
          endMarker,
          '',
        ].join('\n')
      : withoutSection;
  return newText !== configText ? newText : configText;
}

/**
 * The config as the mod wrote it, without our status section. We parse this
 * so the section can't change the error it reports, e.g. by moving the end
 * of the file, which would make each sync rewrite the section.
 */
export function removeStatusSection(configText: string): string {
  const start = configText.indexOf(startMarker);
  if (start === -1) return configText;
  const end = configText.indexOf(endMarker, start);
  const after = end !== -1 ? configText.slice(end + endMarker.length) : '';
  const before = configText.slice(0, start).trimEnd();
  const rest = after.replace(/^\n+/, '');
  return rest !== '' ? `${before}\n\n${rest}` : `${before}\n`;
}

const startMarker =
  '# ---- wiki-post-bot status (written by the bot; edits here get replaced) ----';
const endMarker = '# ---- end of wiki-post-bot status ----';
