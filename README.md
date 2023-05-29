# SvelteKit JWT

impl JsonWebToken for SvelteKit.

```sh
pnpm i -D sveltekit-jwt
```

## Usage

```ts
import { checkout } from "sveltekit-jwt";
import { env } from "$env/dynamic/private";
import type { Handle, RequestEvent } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
    // Check the expiration and signature of the token.
    const token = await checkout(event, env.JWT_SECRET);
    if (token) {
        // You may want to check if the payload is valid.
        event.locals.user = token;
    }

    return resolve(event);
};
```

## Developing

Once you've installed dependencies with `pnpm install`, start a development server:

```bash
pnpm dev
```

Everything inside `src/lib` is part of the library, everything inside `src/routes` is used as a showcase or preview app.

## Building

To build the library:

```bash
pnpm package
```

To create a production version of the showcase app:

```bash
pnpm build
```

You can preview the production build with `pnpm preview`.

> To deploy the app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for the target environment.

## Publishing

To publish the library to [npm](https://www.npmjs.com):

```bash
pnpm publish
```
