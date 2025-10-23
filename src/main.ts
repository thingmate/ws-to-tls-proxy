import * as z from 'zod';
import { DEFAULT_LOG_LEVEL } from './log/log-level/defaults/default-log-level.ts';
import { Logger } from './log/logger.ts';
import { noLog } from './log/raw/no-log.ts';
import { wsToTlsProxyServer } from './ws-to-tls-proxy.ts';

const logger = new Logger('MAIN', {
  logLevel: [
    ...DEFAULT_LOG_LEVEL,
    ['debug', noLog],
  ],
});

const ZodEnvOptions = z.object({
  secret: z.string(),
  port: z.coerce.number(),
});

async function main(): Promise<void> {
  await wsToTlsProxyServer({
    logger,
    ...ZodEnvOptions.parse({
      secret: Deno.env.get('SECRET'),
      port: Deno.env.get('PORT'),
    }),
  });
}

main()
  .catch((error: unknown) => {
    logger.fatal(error);
  });
