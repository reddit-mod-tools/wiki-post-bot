/**
 * This can be used at the end of a series of if statements
 * or switches to make sure we've handled all cases
 */
export function getUnreachableError(value: never) {
  const jsonValue = JSON.stringify(value);
  const error = new Error(
    `We should never get here; you may have forgotten to cover a case in an if statement or switch. Got unexpected value ${
      jsonValue === undefined ? 'undefined' : jsonValue.slice(0, 1024)
    }`
  );
  // Add this so that it gets logged in Sentry, Bugsnag, and logs
  (error as any).value = jsonValue;
  return error;
}
