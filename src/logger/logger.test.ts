import { Logger } from './logger';

describe('Logger', () => {
  let originalConsole: Console;
  let mockConsole: Partial<Console>;
  let logger: Logger;

  beforeEach(() => {
    originalConsole = global.console;
    mockConsole = {
      debug: rs.fn(),
      error: rs.fn(),
      log: rs.fn(),
      warn: rs.fn(),
    };
    global.console = mockConsole as Console;
    logger = new Logger({ prefix: 'TestPrefix' });
  });

  afterEach(() => {
    global.console = originalConsole;
    rs.clearAllMocks();
  });

  it('should create logger instance with prefix', () => {
    expect(logger).toBeInstanceOf(Logger);
  });

  describe('logging methods', () => {
    const testCases = [
      { consoleMethod: 'log', method: 'info' },
      { consoleMethod: 'warn', method: 'warn' },
      { consoleMethod: 'error', method: 'error' },
      { consoleMethod: 'debug', method: 'debug' },
    ] as const;

    testCases.forEach(({ method, consoleMethod }) => {
      it(`should format and log ${method} messages correctly`, () => {
        const message = 'Test message';
        const args = ['arg1', { test: 'arg2' }];

        logger[method](message, ...args);

        expect(mockConsole[consoleMethod]).toHaveBeenCalled();
        const calls = (mockConsole[consoleMethod] as ReturnType<typeof rs.fn>).mock.calls[0];

        expect(calls?.[0]).toMatch(new RegExp(`\\[TestPrefix\\]\\[${method.toUpperCase()}\\]: ${message}`));
        expect(calls?.[1]).toMatch(/color: #[0-9A-F]{6}/i);
        expect(calls?.slice(2)).toEqual(args);
      });
    });
  });

  describe('production mode', () => {
    beforeEach(() => {
      rs.stubEnv('NODE_ENV', 'production');
      logger = new Logger({ prefix: 'TestPrefix' });
    });

    afterEach(() => {
      rs.unstubAllEnvs();
    });

    it('should not log in production mode', () => {
      logger.info('Test message');
      logger.warn('Test message');
      logger.error('Test message');
      logger.debug('Test message');

      expect(mockConsole.log).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).not.toHaveBeenCalled();
      expect(mockConsole.debug).not.toHaveBeenCalled();
    });
  });
});
