import {
	OAUTH_ERROR_MESSAGES,
	OAUTH_SCOPE_OBJS,
	OAUTH_SCOPE_STR,
	OAUTH_TOKENS_STORAGE_KEY,
	type OAuthTokensStorageValue,
} from "../constants/oauth";
import { RESTError } from "../helpers/requests/main";
import { authorizeRobloxOAuth, redeemRobloxOAuthToken } from "../helpers/requests/services/account";
import { storage } from "../helpers/storage";

export function generateCodeVerifier() {
	const array = new Uint8Array(32); // 32 bytes for ~43-128 chars after base64url
	window.crypto.getRandomValues(array);

	return btoa(String.fromCharCode(...array))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

// Function to generate the code_challenge from the code_verifier
export async function generateCodeChallenge(codeVerifier: string) {
	const encoder = new TextEncoder();
	const data = encoder.encode(codeVerifier);
	const digest = await window.crypto.subtle.digest("SHA-256", data);

	// Base64url encode the SHA-256 hash
	return btoa(String.fromCharCode(...new Uint8Array(digest)))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

export async function generateOAuthTokenForUser(userId: number) {
	const codeVerifier = generateCodeVerifier();
	const challenge = await generateCodeChallenge(codeVerifier);
	const state = crypto.randomUUID();

	const authorizeData = await authorizeRobloxOAuth({
		clientId: import.meta.env.ROBLOX_OAUTH_CLIENT_ID,
		responseTypes: ["Code"],
		redirectUri: import.meta.env.ROBLOX_OAUTH_REDIRECT_URI,
		scopes: OAUTH_SCOPE_OBJS,
		resourceInfos: [{ owner: { id: userId.toString(), type: "User" }, resources: {} }],
		codeChallengeMethod: "S256",
		codeChallenge: challenge,
		state,
	});

	const redirectUri = new URL(authorizeData.location);
	const code = redirectUri.searchParams.get("code");

	if (!code) return;

	return redeemRobloxOAuthToken({
		clientId: import.meta.env.ROBLOX_OAUTH_CLIENT_ID,
		grantType: "authorization_code",
		code,
		codeVerifier,
	});
}

export async function tryOAuthRequest<T>(
	userId: number,
	fn: (code: string) => Promise<T>,
	forceRefresh?: boolean,
): Promise<T | undefined> {
	const data = ((await storage.get([OAUTH_TOKENS_STORAGE_KEY]))?.[OAUTH_TOKENS_STORAGE_KEY] ??
		{}) as OAuthTokensStorageValue;

	const time = Math.floor(Date.now() / 1_000);

	let userData: OAuthTokensStorageValue[number] | undefined = data[userId];
	const expired = userData && userData.expiresAt <= time;

	if (!userData || forceRefresh || userData.scope !== OAUTH_SCOPE_STR) {
		const tokenData = await generateOAuthTokenForUser(userId);
		if (!tokenData) return;

		data[userId] = {
			accessToken: tokenData.accessToken,
			refreshToken: tokenData.refreshToken,
			expiresAt: time + tokenData.expiresIn,
			scope: tokenData.scope,
		};
		userData = data[userId];
		storage.set({
			[OAUTH_TOKENS_STORAGE_KEY]: data,
		});
	}

	if (expired) {
		try {
			const tokenData = await redeemRobloxOAuthToken({
				clientId: import.meta.env.ROBLOX_OAUTH_CLIENT_ID,
				grantType: "refresh_token",
				refreshToken: userData.refreshToken,
			});

			data[userId] = {
				accessToken: tokenData.accessToken,
				refreshToken: tokenData.refreshToken,
				expiresAt: time + tokenData.expiresIn,
				scope: tokenData.scope,
			};
		} catch {
			const tokenData = await generateOAuthTokenForUser(userId);
			if (!tokenData) return;

			data[userId] = {
				accessToken: tokenData.accessToken,
				refreshToken: tokenData.refreshToken,
				expiresAt: time + tokenData.expiresIn,
				scope: tokenData.scope,
			};
		}

		userData = data[userId];
		storage.set({
			[OAUTH_TOKENS_STORAGE_KEY]: data,
		});
	}

	try {
		return await fn(userData.accessToken);
	} catch (err) {
		const message = err instanceof RESTError && err.errors?.[0].message;
		if (message && OAUTH_ERROR_MESSAGES.includes(message))
			return tryOAuthRequest(userId, fn, true);
	}
}
