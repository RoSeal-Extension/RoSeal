import { getRobloxUrl } from "../utils/baseUrls" with { type: "macro" };

export const ROBLOX_COOKIES: CookieMetadata[] = [
	{
		name: ".ROBLOSECURITY",
		prefix: "_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_",
		required: true,
		httpOnly: true,
		secure: true,
	},
];

export type CookieMetadata = {
	name: string;
	prefix?: string;
	required?: boolean;
	httpOnly?: boolean;
	secure?: boolean;
};
export const ROBLOX_ACCOUNT_LIMIT = 100;
export const ACCOUNTS_FEATURE_ID = "accountsManager";
export const ACCOUNTS_DISCOVERY_FEATURE_ID = "accountsManager.discoverAccounts";
export const ACCOUNTS_SHOW_AGE_BRACKET_FEATURE_ID = "accountsManager.showAgeBracket";
export const ACCOUNTS_SHOW_AUTHENTICATED_USER_PILL_FEATURE_ID =
	"accountsManager.showAuthenticatedUserPill";
export const ACCOUNTS_UPDATE_TABS_FEATURE_ID = "accountsManager.updateTabs";
export const ACCOUNTS_BIGGER_GAP_FEATURE_ID = "accountsManager.biggerGap";

export const UNENCRYPTED_ACCOUNTS_STORAGE_KEY = "robloxAccounts2";
export const ENCRYPTED_ACCOUNTS_STORAGE_KEY = "robloxAccounts";

export const SET_COOKIE_STORE_DOMAIN = getRobloxUrl("");

export const FETCH_COOKIE_STORE_URL = `https://${getRobloxUrl("www")}`;

export const ACCOUNTS_RULES_SESSION_CACHE_STORAGE_KEY = "accountsManager.requestRules";

export type AccountsRulesStorageValue = Record<
	number,
	{
		ruleId: number;
		token: string;
	}
>;

export type AccountCookie = {
	name: string;
	value: string;
	expiration?: number;
};

export const ENCRYPTION_KEY_ALG = {
	name: "AES-GCM",
	length: 256,
} as const;

export type StoredAccountPartial = {
	userId: number;
	token?: string;
};

export type StoredAccount = StoredAccountPartial & {
	cookies: AccountCookie[];
};

export const ENCRYPTION_KEY_NAME = "ENCRYPTION_KEY";
export const LEGACY_MIZORE_ACCOUNTS_STORAGE_KEY = "RobloxAccounts";

export const ROSEAL_ACCOUNT_TOKEN_SEARCH_PARAM_NAME = "_rosealAccountToken";

export type LegacyMizoreAccountComponent = {
	userId: number;
	username: string;
	hasPremium: boolean;
	hasVerifiedBadge: boolean;
	securityCookieExpiration?: number;
	btidCookie?: string;
	btidCookieExpiration?: number;
};

export type LegacyMizoreAccount = LegacyMizoreAccountComponent & {
	securityCookie: string;
};
