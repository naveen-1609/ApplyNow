import { runtimeTuning, shouldLog, type LogLevel } from '@/lib/config/runtime-tuning';

function isLoggingEnabled() {
  if (typeof window === 'undefined') {
    return runtimeTuning.logging.enableServer;
  }

  return runtimeTuning.logging.enableClient;
}

function isClientRuntime() {
  return typeof window !== 'undefined';
}

function write(level: LogLevel, message: string, ...args: unknown[]) {
  if (!isLoggingEnabled() || !shouldLog(level)) {
    return;
  }

  const prefix = `[${runtimeTuning.logging.prefix}]`;
  const payload = `${prefix} ${message}`;

  switch (level) {
    case 'debug':
    case 'info':
      console.log(payload, ...args);
      break;
    case 'warn':
      console.warn(payload, ...args);
      break;
    case 'error':
      if (isClientRuntime()) {
        console.warn(payload, ...args);
      } else {
        console.error(payload, ...args);
      }
      break;
  }
}

export const logger = {
  debug: (message: string, ...args: unknown[]) => write('debug', message, ...args),
  info: (message: string, ...args: unknown[]) => write('info', message, ...args),
  warn: (message: string, ...args: unknown[]) => write('warn', message, ...args),
  error: (message: string, ...args: unknown[]) => write('error', message, ...args),
};
