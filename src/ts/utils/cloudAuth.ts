import { tryAPIKeyRequest } from "./apiKey";
import { tryOAuthRequest } from "./oauth";

export function tryOpenCloudAuthRequest<T>(
	userId: number,
	isUserOver13: boolean,
	fn: (type: "apiKey" | "bearer", code: string) => Promise<T>,
): Promise<T | undefined> {
	if (isUserOver13) {
		return tryOAuthRequest(userId, (code) => fn("bearer", code));
	}

	return tryAPIKeyRequest(userId, (apiKey) => fn("apiKey", apiKey));
}
