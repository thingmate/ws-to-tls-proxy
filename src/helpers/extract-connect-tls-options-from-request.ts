import * as z from 'zod';

const ZodConnectTlsOptions = z.object({
  secret: z.string(),
  port: z.number(),
  hostname: z.hostname(),
  protocol: z.optional(z.string()),
  caCerts: z.optional(z.array(z.string())),
});

export interface ConnectTlsOptions {
  readonly secret: string;
  readonly port: number;
  readonly hostname: string;
  readonly protocol?: string;
  readonly caCerts?: readonly string[];
}

export function extractConnectTlsOptionsFromRequest(
  request: Request,
): ConnectTlsOptions {
  const url: URL = new URL(request.url);
  if (url.searchParams.has('config')) {
    return ZodConnectTlsOptions.parse(
      JSON.parse(url.searchParams.get('config')!),
    ) as ConnectTlsOptions;
  } else {
    throw new Error("Missing searchParams 'config'");
  }
}
