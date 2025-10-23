import { ansiEscapeGraphicModeString } from '../ansi/ansi.ts';
import { RawLogger } from './raw-logger.ts';

export function ansiRawLogger(...parameters: string[]): RawLogger {
  return (name: string, args: any[]): void => {
    console.log(
      ansiEscapeGraphicModeString(`[${name}]`, ...parameters),
      ...args,
    );
  };
}
