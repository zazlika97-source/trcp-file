const PREFIX = '[TRCP]';

export const logger = {
  info: (...args: any[]) => console.log(PREFIX, ...args),
  warn: (...args: any[]) => console.warn(PREFIX, ...args),
  error: (...args: any[]) => console.error(PREFIX, ...args),
  debug: (...args: any[]) => console.debug(PREFIX, ...args),
};
