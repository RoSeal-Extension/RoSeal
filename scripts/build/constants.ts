import type { DevServersAvailable } from "./utils";

export type BrowserSpecificSettings = {
	id?: string;
	key?: string;
	update_url?: string;
	strict_min_version?: string;
	strict_max_version?: string;
};

export type Manifest = OmitExtend<
	chrome.runtime.ManifestV3,
	{
		$schema?: string;
		beta?: boolean;
		declarative_net_request?: unknown;
		author: string;
		store_version: string;
		browser_specific_settings?: {
			chrome?: BrowserSpecificSettings;
			firefox?: BrowserSpecificSettings & {
				android?: BrowserSpecificSettings;
			};
			safari?: BrowserSpecificSettings;
		};
	}
>;

export type I18nDetail = {
	// @ts-expect-error: We ignore this so JSON schema can succeed
	$types?: I18nEnv[];
	// @ts-expect-error: We ignore this so JSON schema can succeed
	$message?: string;
	// @ts-expect-error: We ignore this so JSON schema can succeed
	$context?: string;
	[key: string]: I18nDetail | string;
};

export type I18nFile = {
	// @ts-expect-error: We ignore this so JSON schema can succeed
	$schema?: string;
	[key: string]: I18nDetail | string;
};

export type Target = "chrome" | "firefox" | "edge" | "safari";
export type TargetBase = "chromium" | "firefox" | "apple";
export type Env = "main" | "inject" | "popup" | "background" | "roseal";
export type I18nEnv = Env | "manifest";

export const TARGETS: Target[] = ["chrome", "firefox", "edge", "safari"];
export const SUPPORTED_TARGETS: Target[] = ["chrome", "firefox", "edge"];
export const TS_ENTRYPOINT = "./src/ts/entry/";
export const SCSS_ENTRYPOINT = "./src/scss/entry/";

// gaia's birthdate :3
export const DEV_SERVER_WS_PORT = 2_9_23;
// mizore's birthdate :3
export const DEV_SERVER_API_PORT = 4_1_21;
// roseal's release date :3
// note that it is not the month/day but the day number due to TCP port limits
export const DEV_SERVER_WWW_PORT = 359_22;

export function getDomains(target?: Target, isDev?: boolean, devServers?: DevServersAvailable) {
	const ROBLOX_DOMAIN = "{service}.roblox.com";
	const ROBLOX_CDN_DOMAIN = "{service}.rbxcdn.com";
	const ROSEAL_DOMAIN = "{service}.roseal.live";
	const ROSEAL_API_DOMAIN =
		isDev && devServers?.IS_DEV_API_ACCESSIBLE
			? `localhost:${DEV_SERVER_API_PORT}`
			: ROSEAL_DOMAIN.replace("{service}", "data");
	const ROSEAL_WEBSITE_DOMAIN =
		isDev && devServers?.IS_DEV_WWW_ACCESSIBLE
			? `localhost:${DEV_SERVER_WWW_PORT}`
			: "www.roseal.live";
	const ROLIMONS_DOMAIN = "{service}.rolimons.com";
	const ROMONITOR_DOMAIN = "romonitorstats.com";
	const MASTODON_DOMAIN = "mastodon.social";
	const X_DOMAIN = "x.com";
	const BLUESKY_DOMAIN = "bsky.app";
	const DISCORD_DOMAIN = "discord.com";
	const CROWDIN_DOMAIN = "crowdin.com";

	const CHROME_LISTING_LINK =
		"https://chromewebstore.google.com/detail/hfjngafpndganmdggnapblamgbfjhnof";
	const FIREFOX_LISTING_LINK = "https://addons.mozilla.org/en-US/firefox/addon/roseal/";
	const EDGE_LISTING_LINK =
		"https://microsoftedge.microsoft.com/addons/detail/emjkdffoonmeappoffiaalofdiflmela";

	const TWEMOJI_EMOJI_BASE_URL = "https://cdn.jsdelivr.net/gh/jdecked/twemoji@16.0.1/assets/";
	const FLUENTUI_EMOJI_BASE_URL =
		"https://cdn.jsdelivr.net/gh/RoSeal-Extension/fluentui-emoji@latest/export/";

	const WORLD_MAPS_LAKES_DATA_URL =
		"https://cdn.jsdelivr.net/gh/martynafford/natural-earth-geojson/110m/physical/ne_110m_lakes.json";
	const WORLD_MAPS_DATA_URL =
		"https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json";

	const CURRENCY_CONVERSION_DATA_URL =
		"https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json";

	const ROBLOX_OAUTH_CLIENT_ID = "5550176950208496010";
	const ROBLOX_OAUTH_REDIRECT_URI = "https://api.roseal.live/v1/auth/providers/roblox/redirect";

	return {
		ROBLOX_DOMAIN,
		ROBLOX_CDN_DOMAIN,
		ROSEAL_DOMAIN,
		ROSEAL_API_DOMAIN,
		ROSEAL_WEBSITE_DOMAIN,
		ROLIMONS_DOMAIN,
		ROMONITOR_DOMAIN,
		MASTODON_DOMAIN,
		X_DOMAIN,
		BLUESKY_DOMAIN,
		DISCORD_DOMAIN,
		CROWDIN_DOMAIN,

		WEB_STORE_LISTING_LINK:
			target === "firefox"
				? FIREFOX_LISTING_LINK
				: target === "edge"
					? EDGE_LISTING_LINK
					: CHROME_LISTING_LINK,
		TWEMOJI_EMOJI_BASE_URL,
		FLUENTUI_EMOJI_BASE_URL,

		WORLD_MAPS_DATA_URL,
		WORLD_MAPS_LAKES_DATA_URL,

		CURRENCY_CONVERSION_DATA_URL,

		ROBLOX_OAUTH_CLIENT_ID,
		ROBLOX_OAUTH_REDIRECT_URI,
	};
}

export type EnvDomain = ReturnType<typeof getDomains>;

export function getUserAgentOverrides(robloxVersion = "0") {
	return [
		{
			userAgent: `Roblox/WinInet RobloxApp/${robloxVersion} (GlobalDist; RobloxDirectDownload)`,
			deviceType: "Desktop",
		},
		{
			userAgent: "Roblox/XboxOne ROBLOX Xbox App 1.0.0",
			deviceType: "Console",
		},
		{
			userAgent: `(0MB; 0x0; 0x0; 0x0; ; 0) ROBLOX Android Tablet RobloxApp/${robloxVersion} (GlobalDist; GooglePlayStore)`,
			deviceType: "Tablet",
		},
		{
			userAgent: `(0MB; 0x0; 0x0; 0x0; ; 0) ROBLOX Android Phone RobloxApp/${robloxVersion} (GlobalDist; GooglePlayStore)`,
			deviceType: "Phone",
		},
		{
			userAgent: `(0MB; 0x0; 0x0; 0x0; oculus Oculus Questseacliff; 0) ROBLOX Android VR OculusQuest3Store RobloxApp/${robloxVersion} (GlobalDist; OculusQuest3Store)`,
			deviceType: "VR",
		},
		/*
		{
			userAgent: "Roblox/WinUWP ROBLOX UWP App 1.0.0",
			deviceType: "DesktopUWP",
		},*/
	] as const;
}

export const ROSEAL_TRACKING_HEADER_NAME = "_rosealRequest";
export const ROSEAL_OVERRIDE_DEVICE_TYPE_HEADER_NAME = "_rosealDeviceType";

export type DeviceType = ReturnType<typeof getUserAgentOverrides>[number]["deviceType"];

export const DEFAULT_OUTDIR = "./dist";
