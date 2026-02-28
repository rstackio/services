import { delay, disableMock, enableMock, isMockEnabled } from './mock';

describe('mock', () => {
  describe('isMockEnabled', () => {
    beforeEach(() => {
      disableMock();
    });

    afterEach(() => {
      rs.unstubAllEnvs();
    });

    it('should return false in production mode', () => {
      rs.stubEnv('NODE_ENV', 'production');
      expect(isMockEnabled()).toBe(false);
    });

    it('should return true when mock is enabled', () => {
      rs.stubEnv('NODE_ENV', 'development');
      enableMock();
      expect(isMockEnabled()).toBe(true);
    });

    it('should return false when mock is disabled', () => {
      rs.stubEnv('NODE_ENV', 'development');
      expect(isMockEnabled()).toBe(false);
    });
  });

  describe('enableMock / disableMock', () => {
    beforeEach(() => {
      disableMock();
      rs.stubEnv('NODE_ENV', 'development');
    });

    afterEach(() => {
      rs.unstubAllEnvs();
    });

    it('should enable mock', () => {
      enableMock();
      expect(isMockEnabled()).toBe(true);
    });

    it('should disable mock', () => {
      enableMock();
      disableMock();
      expect(isMockEnabled()).toBe(false);
    });
  });

  describe('delay', () => {
    beforeEach(() => {
      rs.useFakeTimers();
    });

    afterEach(() => {
      rs.useRealTimers();
    });

    it('should resolve after the specified delay', async () => {
      const mockFn = rs.fn(() => 'result');
      const promise = delay(mockFn, { delayMs: 1000 });

      rs.advanceTimersByTime(1000);
      await expect(promise).resolves.toBe('result');
      expect(mockFn).toHaveBeenCalledOnce();
    });

    it('should reject if aborted before the delay completes', async () => {
      const controller = new AbortController();
      const spy = rs.fn();
      const promise = delay(() => 'result', {
        delayMs: 1000,
        signal: controller.signal,
      });
      controller.abort();
      await promise.catch(spy);
      expect(spy).toHaveBeenCalledOnce();
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Aborted',
          name: 'AbortError',
        }),
      );
    });

    it('should not reject if aborted after resolving', async () => {
      const mockFn = rs.fn(() => 'result');
      const controller = new AbortController();
      const promise = delay(mockFn, {
        delayMs: 1000,
        signal: controller.signal,
      });

      rs.advanceTimersByTime(1000);
      await promise;
      controller.abort();
      expect(mockFn).toHaveBeenCalledOnce();
    });
  });
});
