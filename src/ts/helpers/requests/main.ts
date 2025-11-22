import { HBAClient } from "roblox-bat";
import { ROSEAL_ACCOUNT_TOKEN_SEARCH_PARAM_NAME } from "src/ts/constants/accountsManager.ts";
import { camelizeObject } from "src/ts/utils/objects.ts";
import { HTTPClient, RESTError } from "../../../../node_modules/@roseal/http-client/src/index.ts";
import {
	type PlatformType,
	ROSEAL_OVERRIDE_PLATFORM_TYPE_HEADER_NAME,
	ROSEAL_TRACKING_HEADER_NAME,
} from "../../../../scripts/build/constants.ts";
import { getRobloxCDNUrl, getRobloxUrl } from "../../utils/baseUrls.ts" with { type: "macro" };
import { bypassCORSFetch } from "./utils/bypassCORSFetch.ts";

export const BYPASS_CORS_ENVS = ["popup", "background"];
export const HBA_ENVS = ["main", "inject"];

export const ROBLOX_PLACE_ID_HEADER_NAME = "roblox-place-id";
export const CHANNEL_TOKEN_HEADER_NAME = "roblox-channel-token";
export const ROBLOX_BROWSER_ASSET_REQUEST_HEADER_NAME = "roblox-browser-asset-request";

export let hbaClient: HBAClient | undefined;
if (HBA_ENVS.includes(import.meta.env.ENV)) {
	hbaClient = new HBAClient({
		onSite: true,
		urls: {
			fetchTokenMetadataUrl: `https://${getRobloxUrl("www", "/charts")}`,
			matchRobloxBaseUrl: getRobloxUrl(""),
		},
	});
}

export const httpClient = new HTTPClient<PlatformType>({
	domains: {
		main: getRobloxUrl(""),
		cdn: getRobloxCDNUrl(""),
	},

	hbaClient,
	onWebsite: true,

	fetch:
		import.meta.env.TARGET_BASE === "firefox" &&
		import.meta.env.ENV === "main" &&
		"content" in globalThis
			? // @ts-expect-error: fine tbh
				globalThis.content.fetch
			: undefined,
	bypassCORSFetch: !BYPASS_CORS_ENVS.includes(import.meta.env.ENV)
		? (bypassCORSFetch as typeof fetch)
		: undefined,
	camelizeObject,

	overridePlatformTypeSearchParam: ROSEAL_OVERRIDE_PLATFORM_TYPE_HEADER_NAME,
	trackingSearchParam: ROSEAL_TRACKING_HEADER_NAME,
	accountTokenSearchParam: ROSEAL_ACCOUNT_TOKEN_SEARCH_PARAM_NAME,

	isDev: import.meta.env.IS_DEV,
});

export { RESTError };
