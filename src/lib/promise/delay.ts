/** Get a promise that resolves in a certain number of milliseconds */
export async function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}
