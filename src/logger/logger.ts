type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const COLORS = {
  debug: '#9E9E9E',
  error: '#F44336',
  info: '#2196F3',
  warn: '#FF9800',
} as const;

export class Logger {
  private prefix: string | undefined;
  private console: Console;
  private isEnabled: boolean = process.env.NODE_ENV !== 'production';

  constructor(options: { prefix?: string; isEnabled?: boolean } = {}) {
    this.prefix = options.prefix;
    this.isEnabled = Object.hasOwn(options, 'isEnabled') ? (options.isEnabled as boolean) : this.isEnabled;
    this.console = new Proxy(console, {
      get: (target, prop: keyof Console) => {
        if (['log', 'warn', 'error', 'debug'].includes(prop)) {
          return (...args: unknown[]) => {
            if (this.isEnabled) {
              (target[prop] as (...args: unknown[]) => void).call(target, ...args);
            }
          };
        }
        return target[prop];
      },
    });
  }

  private formatMessage(level: LogLevel, message: string, ...args: unknown[]) {
    // const timestamp = new Date().toISOString();
    const prefix = this.prefix ? `[${this.prefix}]` : '';

    return [`%c ${prefix}[${level.toUpperCase()}]: ${message}`, `color: ${COLORS[level]}; font-weight: bold`, ...args];
  }

  info(message: string, ...args: unknown[]) {
    this.console.log(...this.formatMessage('info', message, ...args));
  }

  warn(message: string, ...args: unknown[]) {
    this.console.warn(...this.formatMessage('warn', message, ...args));
  }

  error(message: string, ...args: unknown[]) {
    this.console.error(...this.formatMessage('error', message, ...args));
  }

  debug(message: string, ...args: unknown[]) {
    this.console.debug(...this.formatMessage('debug', message, ...args));
  }
}
