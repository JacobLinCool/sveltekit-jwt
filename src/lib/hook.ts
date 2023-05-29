import type { RequestEvent } from "@sveltejs/kit";
import * as JWT from "@tsndr/cloudflare-worker-jwt";

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
