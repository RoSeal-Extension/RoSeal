import type { DeviceType, PlatformType } from "scripts/build/constants";
import { watchOnce } from "../helpers/elements";

export const isIframe = window.self !== window.top;
//export const isMobile = /\bMobile\b/.test(navigator.userAgent) || globalThis.matchMedia?.("(hover: none)").matches;

export function onStringTyped(
	element: Element,
	string: string,
	fn: (lastEvent: KeyboardEvent) => void,
) {
	let matched = 0;
	const listener = ((e: KeyboardEvent) => {
		if (string[matched] === e.key) {
			matched++;
		} else {
			matched = 0;

			return;
		}

		if (matched === string.length) {
			matched = 0;

			fn(e);
		}
	}) as EventListenerOrEventListenerObject;

	element.addEventListener("keydown", listener);
	return () => document.removeEventListener("keydown", listener);
}

export type DeviceMeta = {
	appType: AppType;
	viewType: string;
	deviceType: DeviceType;
	platformType: PlatformType;
	isAmazonApp: boolean;
	isAndroidApp: boolean;
	isAndroidDevice: boolean;
	isChromeOS: boolean;
	isConsole: boolean;
	isDesktop: boolean;
	isGameClientBrowser: boolean;
	isInApp: boolean;
	isIOSApp: boolean;
	isIOSDevice: boolean;
	isPhone: boolean;
	isStudio: boolean;
	isTablet: boolean;
	isUniversalApp: boolean;
	isUWPApp: boolean;
	isWin32App: boolean;
	isXboxApp: boolean;
	isSamsungGalaxyStoreApp: boolean;
	isPCGDKApp: boolean;
};

export type AppType =
	| "android"
	| "ios"
	| "xbox"
	| "uwp"
	| "amazon"
	| "win32"
	| "universalapp"
	| "unknown";

const LOCALE_META_SELECTOR = 'meta[name="locale-data"]';
const DEVICE_META_SELECTOR = 'meta[name="device-meta"]';

// dependent on key order
const viewTypeMap = {
	isStudio: "studiobrowser",
	isAmazonApp: "amazonapp",
	isIOSApp: "iosapp",
	isIOSDevice: "ioswebsite",
	isChromeOS: "chromeos",
	isWin32App: "win32app",
	isXboxApp: "xboxapp",
	isConsole: "otherconsoleapp",
	isAndroidApp: "androidapp",
	isAndroidDevice: "androidwebsite",
	isUWPApp: "uwpapp",
	isUniversalApp: "universalapp",
	isGameClientBrowser: "clientbrowser",
};

export type SiteLocaleData = {
	languageCode?: string;
};

export function getSiteLocaleDataSync(el?: HTMLMetaElement): SiteLocaleData | undefined {
	const dataset =
		el?.dataset ?? document.querySelector<HTMLMetaElement>(LOCALE_META_SELECTOR)?.dataset;
	if (!dataset) return;

	return {
		languageCode: dataset.languageCode,
	};
}

export function getDeviceMetaSync(el?: HTMLMetaElement): DeviceMeta | undefined {
	const dataset =
		el?.dataset ?? document.querySelector<HTMLMetaElement>(DEVICE_META_SELECTOR)?.dataset;
	if (!dataset) return;

	const data = {
		appType: (dataset.appType as AppType) ?? "unknown",
		isAmazonApp: dataset.isAmazonApp === "true",
		isAndroidApp: dataset.isAndroidApp === "true",
		isAndroidDevice: dataset.isAndroidDevice === "true",
		isChromeOS: dataset.isChromeOs === "true",
		isConsole: dataset.isConsole === "true",
		isDesktop: dataset.isDesktop === "true",
		isGameClientBrowser: dataset.isGameClientBrowser === "true",
		isInApp: dataset.isInApp === "true",
		isIOSApp: dataset.isIosApp === "true",
		isIOSDevice: dataset.isIosDevice === "true",
		isPhone: dataset.isPhone === "true",
		isStudio: dataset.isStudio === "true",
		isTablet: dataset.isTablet === "true",
		isUniversalApp: dataset.isUniversalApp === "true",
		isUWPApp: dataset.isUwpApp === "true",
		isWin32App: dataset.isWin32App === "true",
		isXboxApp: dataset.isXboxApp === "true",
		isSamsungGalaxyStoreApp: dataset.isSamsungGalaxyStoreApp === "true",
		isPCGDKApp: dataset.isPcgdkApp === "true",
	};

	let deviceType: DeviceType;

	switch (dataset.deviceType) {
		case "phone": {
			deviceType = "Phone";
			break;
		}
		case "tablet": {
			deviceType = "Tablet";
			break;
		}
		case "vr": {
			deviceType = "VR";
			break;
		}

		default: {
			deviceType = "Desktop";
			break;
		}
	}

	let viewType = "web";
	for (const key in viewTypeMap) {
		if (data[key as keyof typeof viewTypeMap]) {
			viewType = viewTypeMap[key as keyof typeof viewTypeMap];
			break;
		}
	}

	if (data.isTablet) {
		viewType = `${viewType}tablet`;
	} else if (data.isPhone) {
		viewType = `${viewType}phone`;
	}

	return {
		...data,
		deviceType,
		platformType: deviceType,
		viewType,
	};
}

export const ROBLOX_ROUTING_DATA_SELECTOR = "#routing";

export type RobloxRoutingDataStaticComponent = {
	componentName: string;
	jsBundleTags: string[];
	cssBundleTags: string[];
	localizationBundleTags: string[];
};

export type RobloxRoutingData = {
	pathToComponent: Record<string, string>;
	pathRegexToComponent: Record<string, string>;
	componentData: Record<string, RobloxRoutingDataStaticComponent[]>;
	el: HTMLDivElement;
};

export async function injectRobloxRoutingData(
	name: string,
	path: RegExp | string,
	data: RobloxRoutingDataStaticComponent[],
) {
	const routingData = await getRobloxRoutingData();
	if (!routingData) return;

	if (typeof path === "string") {
		routingData.pathToComponent[path] = name;
		routingData.el.setAttribute(
			"data-pathtocomponent",
			JSON.stringify(routingData.pathToComponent),
		);
	} else {
		routingData.pathRegexToComponent[String(path)] = name;
		routingData.el.setAttribute(
			"data-pathregextocomponent",
			JSON.stringify(routingData.pathRegexToComponent),
		);
	}

	routingData.componentData[name] = data;
	routingData.el.setAttribute(
		"data-staticcomponentdata",
		JSON.stringify(routingData.componentData),
	);
}

export function getRobloxRoutingDataSync(el?: HTMLDivElement): RobloxRoutingData | undefined {
	const dataset =
		el?.dataset ??
		document.querySelector<HTMLDivElement>(ROBLOX_ROUTING_DATA_SELECTOR)?.dataset;
	if (!dataset) return;

	const pathToComponent = JSON.parse(dataset.pathtocomponent ?? "{}") as Record<string, string>;
	const pathRegexToComponent = JSON.parse(dataset.pathregextocomponent ?? "{}") as Record<
		string,
		string
	>;
	const componentData = JSON.parse(dataset.staticcomponentdata ?? "{}") as Record<
		string,
		RobloxRoutingDataStaticComponent[]
	>;

	return {
		pathToComponent,
		pathRegexToComponent,
		componentData,
		el: el!,
	};
}

export type PlatformOSName =
	| "Windows"
	| "Unknown"
	| "XboxOne"
	| "iOS"
	| "Android"
	| "OSX"
	| "PlayStation";

export type PlaceLauncherData = {
	playerProtocolName?: string | null;
	studioProtocolName?: string | null;
	isLoggedIn: boolean;
	osName?: PlatformOSName | null;
	robloxLocale?: string | null;
	gameLocale?: string | null;
	accountChannelName?: string | null;
	studioChannelName?: string | null;
	playerChannelName?: string;
};

const PLACE_LAUNCHER_STATUS_SELECTOR = "#PlaceLauncherStatusPanel";

export function getPlaceLauncherDataSync(el?: HTMLDivElement): PlaceLauncherData | undefined {
	const dataset =
		el?.dataset ??
		document.querySelector<HTMLDivElement>(PLACE_LAUNCHER_STATUS_SELECTOR)?.dataset;
	if (!dataset) return;

	return {
		playerProtocolName: dataset.protocolNameForClient,
		studioProtocolName: dataset.protocolNameForStudio,
		isLoggedIn: dataset.isUserLoggedIn?.toLowerCase() === "true",
		osName: dataset.osName as PlatformOSName | null,
		robloxLocale: dataset.protocolRobloxLocale,
		gameLocale: dataset.protocolGameLocale,
		accountChannelName: dataset.protocolChannelName,
		studioChannelName: dataset.protocolStudioChannelName,
		playerChannelName: dataset.protocolPlayerChannelName,
	};
}

export async function getPlaceLauncherData() {
	return watchOnce<HTMLDivElement>(PLACE_LAUNCHER_STATUS_SELECTOR).then(getPlaceLauncherDataSync);
}

export function getRobloxRoutingData() {
	return watchOnce<HTMLDivElement>(ROBLOX_ROUTING_DATA_SELECTOR).then(getRobloxRoutingDataSync);
}

export function getDeviceMeta() {
	return watchOnce<HTMLMetaElement>(DEVICE_META_SELECTOR).then(getDeviceMetaSync);
}

export function getSiteLocaleData() {
	return watchOnce<HTMLMetaElement>(LOCALE_META_SELECTOR).then(getSiteLocaleDataSync);
}

export function getOSType() {
	const placeLauncherData = getPlaceLauncherDataSync();

	switch (placeLauncherData?.osName) {
		case "OSX": {
			return "macos";
		}
		case "Windows": {
			return "windows";
		}

		default: {
			return "linux";
		}
	}
}

export function robloxNavigateTo(_url: string) {
	if (!getRobloxRoutingDataSync()) {
		location.href = _url;
		return;
	}

	const url = new URL(_url, location.href).toString();

	window.dispatchEvent(
		new CustomEvent("externalNavigation", {
			detail: { url },
		}),
	);
}
