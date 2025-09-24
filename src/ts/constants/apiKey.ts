import type { APIKeyScope } from "../helpers/requests/services/account";

export const API_KEYS_STORAGE_KEY = "apiKeys";

export type APIKeysStorageValue = {
	[userId: number]: {
		cloudAuthId: string;
		key: string;
		scope: string;
		expiresAt: number;
	};
};

export const API_KEY_SCOPE_OBJS = [
	{
		scopeType: "user.inventory-item",
		targetParts: ["*"],
		operations: ["read"],
		allowAllOperations: false,
	},
] as APIKeyScope[];

export const API_KEY_SCOPE_STR = "user.inventory-item:*:read";
export const API_KEY_PREFIX = "RoSeal Extension Key";
export const API_KEY_DESCRIPTION =
	"This API key is used so under 13 users can still use some RoSeal features. If you are now over 13 and reading this message, feel free to delete this key.";

export const API_KEY_ERROR_MESSAGES = ["Invalid API Key", "Invalid authentication data provided"];
