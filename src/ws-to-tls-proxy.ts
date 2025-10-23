import {
  ConnectTlsOptions,
  extractConnectTlsOptionsFromRequest,
} from './helpers/extract-connect-tls-options-from-request.ts';
import { Logger } from './log/logger.ts';

function websocketDownValueToUint8Array(data: string | ArrayBuffer): Uint8Array {
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  } else if (typeof data === 'string') {
    return new TextEncoder().encode(data);
  } else {
    throw new Error('Expected string or ArrayBuffer');
  }
}

function unknownToString(input: unknown): string {
  if (typeof input == 'string') {
    return input;
  } else if (input instanceof Error) {
    return input.message;
  } else {
    return JSON.stringify(input);
  }
}

export interface wsToTlsProxyServerOptions {
  readonly logger: Logger;
  readonly secret: string;
  readonly port: number;
}

export async function wsToTlsProxyServer(
  {
    logger,
    secret,
    port,
  }: wsToTlsProxyServerOptions,
): Promise<void> {
  logger.info('starting server on port', port, '...');

  try {
    await Deno.serve({ port }, async (request: Request): Promise<Response> => {
      if (request.headers.get('upgrade') != 'websocket') {
        return new Response(null, { status: 426 });
      }

      logger.info('new connection');

      try {
        // read config from request
        const config: ConnectTlsOptions = extractConnectTlsOptionsFromRequest(
          request,
        );

        if (config.secret !== secret) {
          logger.warn('invalid secret');
          return new Response('Unauthorized', { status: 401 });
        }

        // CONNECT TO TSL SERVER

        const host: string = `${config.hostname}:${config.port}`;

        logger.info(`attempting to connect to ${JSON.stringify(host)}...`);

        const connection: Deno.TlsConn = await Deno.connectTls(config as Deno.ConnectTlsOptions);

        return await logger.spawn(`TLS - ${host}`, async (logger: Logger): Promise<Response> => {
          logger.info('connected');

          // CLOSE
          let closed: boolean = false;
          const closeConnection = (): void => {
            if (!closed) {
              closed = true;
              logger.info('closed');
              try {
                connection.close();
              } catch (error: unknown) {
                logger.warn('failed to close connection', error);
              }
            }
          };

          try {
            const { socket, response }: Deno.WebSocketUpgrade = Deno.upgradeWebSocket(request, {
              protocol: config.protocol,
            });

            const closeWebsocketController: AbortController = new AbortController();
            const closeWebsocket = (code: number, reason: unknown): void => {
              if (!closeWebsocketController.signal.aborted) {
                closeWebsocketController.abort();

                const message: string = unknownToString(reason);

                // https://github.com/Luka967/websocket-close-codes
                logger.info(`close websocket: ${code} - ${message}`);

                if (
                  socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN
                ) {
                  socket.close(code, message.slice(0, 123));
                }

                closeConnection();
              }
            };

            socket.addEventListener('close', (event: CloseEvent): void => {
              closeWebsocket(event.code, event.reason);
            }, closeWebsocketController);

            socket.addEventListener('error', (): void => {
              closeWebsocket(1006, 'errored');
            }, closeWebsocketController);

            const writer: WritableStreamDefaultWriter<Uint8Array> = connection.writable.getWriter();

            socket.addEventListener(
              'message',
              async (event: MessageEvent<ArrayBuffer | string>): Promise<void> => {
                try {
                  const data: Uint8Array = websocketDownValueToUint8Array(event.data);
                  logger.debug('client -> server', data);
                  await writer.write(data);
                } catch (error: unknown) {
                  closeWebsocket(1006, error);
                }
              },
              closeWebsocketController,
            );

            void (async (): Promise<void> => {
              try {
                for await (
                  const data of connection.readable as unknown as AsyncIterable<Uint8Array>
                ) {
                  logger.debug('server -> client', data);
                  socket.send(data);
                }
              } catch (error: unknown) {
                closeWebsocket(1006, error);
              }
            })();

            return response;
          } catch (error: unknown) {
            closeConnection();
            throw error;
          }
        });
      } catch (error: unknown) {
        logger.error('connection failed', error);

        return new Response('Connection failed', { status: 400 });
      }
    }).finished;
  } finally {
    logger.info('server closed');
  }
}
