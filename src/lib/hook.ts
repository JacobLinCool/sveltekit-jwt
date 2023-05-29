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
	secret: string,
): Promise<T | undefined> {
	const authorization = event.request.headers.get("authorization");
	const cookie = event.cookies.get("token");

	if (authorization) {
		const [type, token] = authorization.split(" ");
		if (type === "Bearer") {
			const ok = await JWT.verify(token, secret);
			if (ok) {
				return JWT.decode(token).payload as T;
			}
		}
	} else if (cookie) {
		const ok = await JWT.verify(cookie, secret);
		if (ok) {
			return JWT.decode(cookie).payload as T;
		}
	}

	return undefined;
}
