import { RawLogger } from '../raw/raw-logger.ts';
import { LogLevel } from './log-level.ts';

export type LogLevelSource =
  | Iterable<[level: LogLevel, logger: RawLogger]>
  | Partial<Record<LogLevel, RawLogger>>;
