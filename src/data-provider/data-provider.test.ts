import { createProvider, createSafeProvider } from './data-provider';

describe('createSafeProvider', () => {
  const mockApiResult = { data: 'test' };
  const mockResult = { data: 'mock' };
  const mockError = new Error('mock error');
  rs.mock('../mock', () => ({
    isMockEnabled: rs.fn().mockReturnValue(false),
  }));

  const apiFunction = rs.fn().mockResolvedValue(mockApiResult);
  const mockFunction = rs.fn().mockResolvedValue(mockResult);
  const _errorFunction = rs.fn().mockRejectedValue(mockError);

  beforeEach(() => {
    rs.clearAllMocks();
  });

  it('should execute api function and return result', async () => {
    const provider = createSafeProvider(apiFunction, [Error] as const);
    const [_error, data] = await provider();

    expect(apiFunction).toHaveBeenCalled();
    expect(data).toEqual(mockApiResult);
  });

  it('should execute mock function when provided', async () => {
    rs.mock('../mock', () => ({
      isMockEnabled: rs.fn().mockReturnValue(true),
    }));
    const provider = createSafeProvider(apiFunction).andThen((res) => res);

    provider.andMock(mockFunction);
    const [_error, data] = await provider();

    expect(mockFunction).toHaveBeenCalled();
    expect(apiFunction).not.toHaveBeenCalled();
    expect(data).toEqual(mockResult);
  });

  it('should handle then callback', async () => {
    const thenCallback = rs.fn();
    const provider = createSafeProvider(apiFunction).andThen(thenCallback);
    await provider();
    expect(thenCallback).toHaveBeenCalledWith(mockApiResult);
  });

  it('should handle catch callback', async () => {
    const catchCallback = rs.fn().mockImplementation(() => {
      throw mockError;
    });

    const testError = new Error('test error');

    const provider = createSafeProvider(() => Promise.resolve(1))
      .andThen((_res) => {
        throw testError;
        // biome-ignore lint/correctness/noUnreachable: <for typechecking>
        return _res;
      })
      .andCatch(catchCallback);

    const [error] = await provider();
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).equal('mock error');
    expect(catchCallback).toHaveBeenCalledExactlyOnceWith(testError);
  });

  it('should handle catch callback and pass the same data type as transformed in andThen', async () => {
    const catchCallback = rs.fn().mockImplementation(() => 'catch mock');

    const testError = new Error('test error');

    const provider = createSafeProvider(() => Promise.resolve(1))
      .andThen((res) => {
        throw testError;
        // biome-ignore lint/correctness/noUnreachable: suppress unreachable code for correctly checking typing
        return res;
      })
      // inferred type of catchCallback is not acceptable
      .andCatch(catchCallback);
    const [_error, data] = await provider();
    expect(data).toBe('catch mock');
    expect(catchCallback).toHaveBeenCalledExactlyOnceWith(testError);
  });

  it('should not handle catch callback', async () => {
    const catchCallback = rs.fn().mockImplementation(() => {
      throw mockError;
    });

    const provider = createSafeProvider(() => Promise.resolve(1))
      .andThen((res) => res)
      .andCatch(catchCallback);

    try {
      await provider();
    } catch (e) {
      catchCallback(e);
    }
    expect(catchCallback).not.toBeCalled();
  });

  it('should handle finally callback', async () => {
    const finallyCallback = rs.fn();

    const provider =
      createSafeProvider(apiFunction).andFinally(finallyCallback);
    await provider();
    expect(finallyCallback).toHaveBeenCalledOnce();
  });

  it('should chain callbacks', async () => {
    const thenCallback = rs.fn();
    const catchCallback = rs.fn();
    const finallyCallback = rs.fn();

    const provider = createSafeProvider(apiFunction)
      .andThen(thenCallback)
      .andCatch(catchCallback)
      .andFinally(finallyCallback);
    await provider();

    expect(thenCallback).toHaveBeenCalledExactlyOnceWith(mockApiResult);
    expect(catchCallback).not.toHaveBeenCalled();
    expect(finallyCallback).toHaveBeenCalled();
  });

  it('should abort fetch and not call then callback', async () => {
    const thenCallback = rs.fn();
    const finallyCallback = rs.fn();
    const controller = new AbortController();

    const fetchData = (signal: AbortController['signal']) =>
      new Promise<number>((resolve, reject) => {
        // Simulate a fetch operation with a timeout
        const timeoutId = setTimeout(() => {
          console.log('Data fetched');
          resolve(12);
        }, 2000); // Simulate a 2-second fetch operation

        // Listen for abort signal and reject the promise if the signal is triggered
        signal.addEventListener('abort', () => {
          clearTimeout(timeoutId); // Clear the timeout to stop the operation
          reject(new Error('AbortError'));
        });
      });

    // const controller = new AbortController();
    const provider = createSafeProvider(fetchData)
      .andThen(thenCallback)
      .andFinally(finallyCallback);
    const promise = provider(controller.signal);
    controller.abort();
    const [error, data] = await promise;
    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);

    expect(error?.message).toBe('AbortError');

    expect(thenCallback).not.toHaveBeenCalled();
    expect(finallyCallback).toHaveBeenCalled();
  });
});

describe('createSafeProvider type tests', () => {
  it('should properly type basic promise function', () => {
    const mockFn = async (id: number) => ({ data: id });
    const provider = createSafeProvider(mockFn);

    // const [error, data] = ;
    type Result = typeof provider extends (
      ...args: [number]
    ) => Promise<[Error | null, { data: number } | null]>
      ? true
      : false;
    // biome-ignore lint/correctness/noUnusedVariables: for test type checking
    type TestCase = Expect<Equal<Result, true>>;
  });

  it('should properly type chained methods', () => {
    const mockFn = async (id: number) => ({ data: id });
    const provider = createSafeProvider(mockFn);

    // Test andThen types
    const withThen = provider.andThen((result) => result.data);

    type ThenResult = typeof withThen extends (
      ...args: [number]
    ) => Promise<[Error | null, number | null]>
      ? true
      : false;
    type _TestThen = Expect<Equal<ThenResult, true>>;

    // Test andCatch types
    const withCatch = provider.andCatch((error: Error) => {
      throw error;
    });
    type CatchResult = typeof withCatch extends (
      ...args: [number]
    ) => Promise<[Error | null, { data: number } | null]>
      ? true
      : false;
    type _TestCatch = Expect<Equal<CatchResult, true>>;

    // Test andFinally types
    const withFinally = provider.andFinally(() => console.log('done'));
    type FinallyResult = typeof withFinally extends (
      ...args: [number]
    ) => Promise<[Error | null, { data: number } | null]>
      ? true
      : false;
    type _TestFinally = Expect<Equal<FinallyResult, true>>;

    // Test andMock types
    const withMock = provider.andMock(async (id: number) => ({ data: id * 2 }));
    type MockResult = typeof withMock extends (
      ...args: [number]
    ) => Promise<[Error | null, { data: number } | null]>
      ? true
      : false;
    type _TestMock = Expect<Equal<MockResult, true>>;
  });

  it('should properly type chain combinations', () => {
    const mockFn = async (id: number) => ({ data: id });
    const provider = createSafeProvider(mockFn);

    const chainedProvider = provider
      .andThen((result) => result.data)
      .andCatch((_error: Error) => {
        throw _error;
      })
      .andFinally(() => console.log('done'));

    type ChainedResult = typeof chainedProvider extends (
      ...args: [number]
    ) => Promise<[Error | null, number | null]>
      ? true
      : false;
    type _TestChained = Expect<Equal<ChainedResult, true>>;
  });

  it('should properly handle different argument types', () => {
    const mockFn = async (id: number, name: string) => ({ id, name });
    const provider = createSafeProvider(mockFn);

    type ArgsResult = typeof provider extends (
      ...args: [number, string]
    ) => Promise<[Error | null, { id: number; name: string } | null]>
      ? true
      : false;
    type _TestArgs = Expect<Equal<ArgsResult, true>>;
  });
});

describe('createProvider', () => {
  const mockApiResult = { data: 'test' };
  const mockResult = { data: 'mock' };
  const mockError = new Error('mock error');
  rs.mock('../mock', () => ({
    isMockEnabled: rs.fn().mockReturnValue(false),
  }));

  const apiFunction = rs.fn().mockResolvedValue(mockApiResult);
  const mockFunction = rs.fn().mockResolvedValue(mockResult);
  const errorFunction = rs.fn().mockRejectedValue(mockError);

  beforeEach(() => {
    rs.clearAllMocks();
  });

  it('should execute api function and return result', async () => {
    const provider = createProvider(apiFunction);
    const result = await provider();

    expect(apiFunction).toHaveBeenCalled();
    expect(result).toEqual(mockApiResult);
  });

  it('should execute mock function when provided', async () => {
    rs.mock('../mock', () => ({
      isMockEnabled: rs.fn().mockReturnValue(true),
    }));
    const provider = createProvider(apiFunction).andMock(mockFunction);
    const result = await provider();

    expect(mockFunction).toHaveBeenCalled();
    expect(apiFunction).not.toHaveBeenCalled();
    expect(result).toEqual(mockResult);
  });

  it('should handle then callback', async () => {
    const thenCallback = rs.fn();
    const provider = createProvider(apiFunction);

    await provider().then(thenCallback);

    expect(thenCallback).toHaveBeenCalledWith(mockApiResult);
  });

  it('should handle catch callback', async () => {
    const catchCallback = rs.fn();
    const provider = createProvider(errorFunction)
      .andThen((res) => {
        throw new Error();
        // biome-ignore lint/correctness/noUnreachable: <for type checking>
        return res;
      })
      .andCatch(catchCallback);
    await provider();

    expect(catchCallback).toHaveBeenCalledWith(mockError);
  });

  it('should handle finally callback', async () => {
    const finallyCallback = rs.fn();
    const provider = createProvider(apiFunction);

    await provider().finally(finallyCallback);

    expect(finallyCallback).toHaveBeenCalled();
  });

  it('should chain callbacks', async () => {
    const thenCallback = rs.fn();
    const catchCallback = rs.fn();
    const finallyCallback = rs.fn();

    const provider = createProvider(apiFunction);

    await provider()
      .then(thenCallback)
      .catch(catchCallback)
      .finally(finallyCallback);

    expect(thenCallback).toHaveBeenCalledWith(mockApiResult);
    expect(catchCallback).not.toHaveBeenCalled();
    expect(finallyCallback).toHaveBeenCalled();
  });

  it('should abort fetch and not call then callback', async () => {
    const thenCallback = rs.fn();
    const finallyCallback = rs.fn();
    const catchCallback = rs.fn();
    const controller = new AbortController();

    const fetchData = (signal: AbortController['signal']) =>
      new Promise<void>((resolve, reject) => {
        // Simulate a fetch operation with a timeout
        const timeoutId = setTimeout(() => {
          console.log('Data fetched');
          resolve();
        }, 5000); // Simulate a 5-second fetch operation

        // Listen for abort signal and reject the promise if the signal is triggered
        signal.addEventListener('abort', () => {
          clearTimeout(timeoutId); // Clear the timeout to stop the operation
          reject(new Error('AbortError'));
        });
      });

    // const controller = new AbortController();
    const provider = createProvider(fetchData);
    const promise = provider(controller.signal)
      .then(thenCallback)
      .catch(catchCallback)
      .finally(finallyCallback);
    controller.abort();
    await promise;
    // await expect(promise).rejects.toThrow('AbortError');
    expect(catchCallback).toHaveBeenCalledWith(new Error('AbortError'));
    expect(thenCallback).not.toHaveBeenCalled();
    expect(finallyCallback).toHaveBeenCalled();
  });
});

describe('createProvider type tests', () => {
  it('should properly type basic promise function', () => {
    const mockFn = async (id: number) => ({ data: id });
    const provider = createProvider(mockFn);

    type Result = typeof provider extends (
      ...args: [number]
    ) => Promise<{ data: number }>
      ? true
      : false;
    // biome-ignore lint/correctness/noUnusedVariables: for test type checking
    type TestCase = Expect<Equal<Result, true>>;
  });

  it('should properly type chained methods', () => {
    const mockFn = async (id: number) => ({ data: id });
    const provider = createProvider(mockFn);

    // Test andThen types
    const withThen = provider.andThen((result) => result.data);
    type ThenResult = typeof withThen extends (
      ...args: [number]
    ) => Promise<number>
      ? true
      : false;
    // biome-ignore lint/correctness/noUnusedVariables: for test type checking
    type TestThen = Expect<Equal<ThenResult, true>>;

    // Test andCatch types
    const withCatch = provider.andCatch((_error: Error) => ({ data: 0 }));
    type CatchResult = typeof withCatch extends (
      ...args: [number]
    ) => Promise<{ data: number }>
      ? true
      : false;
    // biome-ignore lint/correctness/noUnusedVariables: for test type checking
    type TestCatch = Expect<Equal<CatchResult, true>>;

    // Test andFinally types
    const withFinally = provider.andFinally(() => console.log('done'));
    type FinallyResult = typeof withFinally extends (
      ...args: [number]
    ) => Promise<{ data: number }>
      ? true
      : false;
    // biome-ignore lint/correctness/noUnusedVariables: for test type checking
    type TestFinally = Expect<Equal<FinallyResult, true>>;

    // Test andMock types
    const withMock = provider.andMock(async (id: number) => ({ data: id * 2 }));
    type MockResult = typeof withMock extends (
      ...args: [number]
    ) => Promise<{ data: number }>
      ? true
      : false;
    // biome-ignore lint/correctness/noUnusedVariables: for test type checking
    type TestMock = Expect<Equal<MockResult, true>>;
  });

  it('should properly type chain combinations', () => {
    const mockFn = async (id: number) => ({ data: id });
    const provider = createProvider(mockFn);

    const chainedProvider = provider
      .andThen((result) => result.data)
      .andCatch((_error: Error) => 0)
      .andFinally(() => console.log('done'));

    type ChainedResult = typeof chainedProvider extends (
      ...args: [number]
    ) => Promise<number>
      ? true
      : false;
    // biome-ignore lint/correctness/noUnusedVariables: for test type checking
    type TestChained = Expect<Equal<ChainedResult, true>>;
  });

  it('should properly handle different argument types', () => {
    const mockFn = async (id: number, name: string) => ({ id, name });
    const provider = createProvider(mockFn);

    type ArgsResult = typeof provider extends (
      ...args: [number, string]
    ) => Promise<{ id: number; name: string }>
      ? true
      : false;
    // biome-ignore lint/correctness/noUnusedVariables: for test type checking
    type TestArgs = Expect<Equal<ArgsResult, true>>;
  });
});
