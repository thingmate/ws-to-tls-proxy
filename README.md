# Deno TLS proxy

This is a simple TLS proxy using deno: connect to it using a `WebSocket` and
proxy all traffic to the target.

Use it to connect directly to a server from the browser, like:

- a webmail client using IMAP, SMTP, etc.
- an ssh client using SSH
- a web server using HTTP(S)
- etc...

## Usage

### Example - from the browser

```ts
export interface ConnectTLSOptions {
  readonly secret: string;
  readonly hostname: string;
  readonly port: number;
  readonly protocol?: string;
  readonly caCerts?: string[];
}

export function getWebSocketProxyUrl(options: ConnectTLSOptions): URL {
  const url = new URL(`ws://localhost:8081`); // define your own endpoint
  url.searchParams.set('config', JSON.stringify(options));
  return url;
}

const ws = new WebSocket(getWebSocketProxyUrl({
  secret: 'YOUR_SECRET',
  hostname: 'imap.gmail.com',
  port: 993,
}));
```

## Installation

### From Source

```shell
git clone https://github.com/thingmate/ws-to-tls-proxy
cd tls-proxy
cp .env.example .env
deno task generate-secret
# copy/save the secret key to use later
deno task generate-secret
deno task main
```

### From Docker

TODO

```shell
docker run \
  --name=ws-to-tls-proxy \
  --user=1000:1000 \
  --restart=always \
  --publish=80:8081 \
  --env=SECRET="<passphrase>" \
  thingmate/tls-proxy:latest
```
