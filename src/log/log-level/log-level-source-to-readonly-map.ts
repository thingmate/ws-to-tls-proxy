import { RawLogger } from '../raw/raw-logger.ts';
import { LogLevelSource } from './log-level-source.ts';
import { LogLevel } from './log-level.ts';

export function logLevelSourceToReadonlyMap(
  input: LogLevelSource,
): ReadonlyMap<LogLevel, RawLogger> {
  return new Map<LogLevel, RawLogger>(
    Symbol.iterator in input
      ? input as Iterable<[level: LogLevel, logger: RawLogger]>
      : Object.entries(input) as Iterable<[level: LogLevel, logger: RawLogger]>,
  );
}
