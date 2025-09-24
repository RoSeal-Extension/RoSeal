export const OAUTH_TOKENS_STORAGE_KEY = "oauthTokens";

export type OAuthTokensStorageValue = {
	[userId: number]: {
		accessToken: string;
		refreshToken: string;
		expiresAt: number;
		scope: string;
	};
};

export const OAUTH_SCOPE_OBJS = [
	{ scopeType: "openid", operations: ["read"] },
	{
		scopeType: "user.inventory-item",
		operations: ["read"],
	},
];

export const OAUTH_SCOPE_STR = "openid user.inventory-item:read";

export const OAUTH_ERROR_MESSAGES = [
	"Failed to read token.",
	"Invalid authentication data provided",
];
