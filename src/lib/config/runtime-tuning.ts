import runtimeTuningJson from '@/config/runtime-tuning.json';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type RuntimeTuning = typeof runtimeTuningJson;

export const runtimeTuning = runtimeTuningJson as RuntimeTuning;

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export function shouldLog(level: LogLevel) {
  const configuredLevel = runtimeTuning.logging.level as LogLevel;
  return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[configuredLevel];
}

export function getCacheTtl(namespace: keyof RuntimeTuning['performance']['caching']['memory']) {
  return runtimeTuning.performance.caching.memory[namespace];
}
