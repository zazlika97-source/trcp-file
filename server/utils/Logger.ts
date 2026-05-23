type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const COLORS: Record<LogLevel, string> = {
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  debug: '\x1b[35m',
};

const RESET = '\x1b[0m';

class Logger {
  private prefix: string;
  private enabled: boolean = true;

  constructor(prefix: string = 'TRCP') {
    this.prefix = prefix;
  }

  private log(level: LogLevel, message: string, ...args: any[]) {
    if (!this.enabled) return;
    const color = COLORS[level] || '';
    const timestamp = new Date().toISOString().slice(11, 19);
    const output = `${color}[${timestamp}] [${this.prefix}] [${level.toUpperCase()}]${RESET} ${message}`;
    if (args.length > 0) {
      console.log(output, ...args);
    } else {
      console.log(output);
    }
  }

  info(message: string, ...args: any[]) {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.log('error', message, ...args);
  }

  debug(message: string, ...args: any[]) {
    this.log('debug', message, ...args);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

export const logger = new Logger('TRCP');
export { Logger };
