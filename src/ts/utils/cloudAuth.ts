import type { HTTPRequestCredentials } from "@roseal/http-client";
import { tryAPIKeyRequest } from "./apiKey";
import { tryOAuthRequest } from "./oauth";

export function tryOpenCloudAuthRequest<T>(
	userId: number,
	isUserOver13: boolean,
	fn: (data: HTTPRequestCredentials) => Promise<T>,
): Promise<T> {
	if (isUserOver13) {
		return tryOAuthRequest(userId, (code) =>
			fn({
				type: "bearerToken",
				value: code,
			}),
		);
	}

	return tryAPIKeyRequest(userId, (apiKey) =>
		fn({
			type: "openCloudApiKey",
			value: apiKey,
		}),
	);
}
