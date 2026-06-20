export async function retry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  delayMs = 1000
): Promise<T | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed. Retrying...`, error);
      if (i < attempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }
  return null;
}
