export const STORE_KEYS = {
  isMockEnabled: 'dp:mock.enabled',
} as const;

const memoryStore = new Map<string, string>();

const storage: Pick<Storage, 'getItem' | 'setItem'> = (
  globalThis as { localStorage?: Storage }
).localStorage ?? {
  getItem: (key: string) => memoryStore.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memoryStore.set(key, value);
  },
};

export const isMockEnabled = () => {
  if (process.env.NODE_ENV === 'test') {
    return true;
  }
  return storage.getItem(STORE_KEYS.isMockEnabled) === 'true';
};

export const enableMock = () => {
  storage.setItem(STORE_KEYS.isMockEnabled, 'true');
};

export const disableMock = () => {
  storage.setItem(STORE_KEYS.isMockEnabled, 'false');
};

export const delay = <T>(
  fn: () => T,
  {
    signal,
    delayMs,
  }: { signal?: AbortController['signal']; delayMs?: number } = {},
) => {
  return new Promise<T>((resolve, reject) => {
    // Early exit if already aborted
    if (signal?.aborted) {
      return reject(new DOMException('Aborted', 'AbortError'));
    }

    const timeoutId = setTimeout(() => {
      resolve(fn());
    }, delayMs);

    // Listen for abort signal
    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId); // Clear the delay
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
};
