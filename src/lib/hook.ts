import type { RequestEvent } from "@sveltejs/kit";
import * as JWT from "@tsndr/cloudflare-worker-jwt";

/**
 * Authenticates and retrieves the payload from a JWT token in the authorization header or cookie.
 * @param event The request event containing the headers and cookies.
 * @param secret The secret used to verify the JWT token.
 * @returns The payload of the verified JWT token, or undefined if authentication fails.
 */
export async function checkout<T extends JWT.JwtPayload>(
	event: RequestEvent,
	secret?: string,
): Promise<T | undefined> {
	const authorization = event.request.headers.get("authorization");
	const cookie = event.cookies.get("token");

	if (authorization) {
		const [type, token] = authorization.split(" ");
		if (type === "Bearer") {
			const ok = secret ? await JWT.verify(token, secret) : await verify(token);
			if (ok) {
				return JWT.decode(token).payload as T;
			}
		}
	} else if (cookie) {
		const ok = secret ? await JWT.verify(cookie, secret) : await verify(cookie);
		if (ok) {
			return JWT.decode(cookie).payload as T;
		}
	}

	return undefined;
}

const jwks_cache = new Map<
	string,
	[
		{
			keys: {
				kty: string;
				alg: string;
				use: string;
				kid: string;
				crv?: string;
				x?: string;
				y?: string;
				n?: string;
				e?: string;
			}[];
		},
		number,
	]
>();

/**
 * Verify the asymmetric signed JWT token.
 * @param token The JWT token to verify.
 * @param no_cache Whether to skip the cache.
 */
export async function verify(token: string, no_cache = false): Promise<boolean> {
	const { header } = JWT.decode(token);

	if (!header.kid || !header.jku) {
		return false;
	}

	const cached = no_cache ? undefined : jwks_cache.get(header.jku);

	const jwks: {
		keys: {
			kty: string;
			alg: string;
			use: string;
			kid: string;
			crv?: string;
			x?: string;
			y?: string;
			n?: string;
			e?: string;
		}[];
	} =
		(cached && cached[1] > Date.now() ? cached[0] : undefined) ||
		(await fetch(header.jku)
			.then((res) => res.json())
			.then((json) => {
				jwks_cache.set(header.jku, [json, Date.now() + 1000 * 60 * 60 * 12]);
				return json;
			}));

	const key = jwks.keys.find((key) => key.kid === header.kid);
	if (!key) {
		return false;
	}

	const ok = await JWT.verify(
		token,
		{
			kty: key.kty,
			alg: key.alg,
			key_ops: ["verify"],
			crv: key.crv,
			x: key.x,
			y: key.y,
			n: key.n,
			e: key.e,
		},
		{ algorithm: key.alg },
	);

	return ok;
}
