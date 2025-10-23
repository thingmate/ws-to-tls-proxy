import { load, stringify } from "@std/dotenv";

const env = await load({
  envPath: ".env",
});

if (env.SECRET === undefined) {
  env.SECRET = crypto.getRandomValues(new Uint8Array(32)).toHex();

  Deno.writeTextFileSync(".env", stringify(env));
}

console.log('secret', env.SECRET);
