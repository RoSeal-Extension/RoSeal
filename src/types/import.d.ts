declare module "bun" {
	interface Env {
		IS_DEV: boolean;
		IS_BETA: boolean;
		TARGET: import("scripts/build/constants").Target;
		TARGET_BASE: import("scripts/build/constants").TargetBase;
		VERSION: string;
		ENV: import("scripts/build/constants").Env;
		VERSION_NAME: string;
		BASE_STORAGE_TYPE: chrome.storage.AreaName;

		TWEMOJI_EMOJI_BASE_URL: string;
		FLUENTUI_EMOJI_BASE_URL: string;

		WORLD_MAPS_DATA_URL: string;
		WORLD_MAPS_LAKES_DATA_URL: string;

		CURRENCY_CONVERSION_DATA_URL: string;

		ROBLOX_OAUTH_CLIENT_ID: string;
		ROBLOX_OAUTH_REDIRECT_URI: string;
	}
}

declare module "#pages/background-listeners" {
	import type { BackgroundMessageListener } from "src/types/dataTypes";

	export const messageListeners: BackgroundMessageListener[];
}

declare module "#pages/background-alarms" {
	import type { BackgroundAlarmListener } from "src/types/dataTypes";

	export const alarmListeners: BackgroundAlarmListener[];
}

// From: https://github.com/lokesh/color-thief/issues/188#issuecomment-1166887824
declare module "colorthief" {
	export type RGBColor = [number, number, number];
	export default class ColorThief {
		getColor: (img: HTMLImageElement | null, quality = 10) => RGBColor | null;
		getPalette: (
			img: HTMLImageElement | null,
			colorCount = 10,
			quality = 10,
		) => RGBColor[] | null;
	}
}

declare module "#pages/main-listeners" {
	export const messageListeners: BackgroundMessageListener[];
}

declare module "#pages/inject" {
	import type { Page } from "src/ts/helpers/pages/handleMainPages";

	export const pages: Page[];
}

declare module "#pages/main" {
	import type { Page } from "src/ts/helpers/pages/handleMainPages";

	export const pages: Page[];
}

declare module "#i18n" {
	import type messages from "src/types/i18n.gen";

	export const supportedLocales: string[];
	export default {} as {
		[key in keyof typeof messages]: Record<string, string>;
	};
}

declare module "*.svg" {
	import type { FunctionComponent, JSX } from "preact";
	const content: FunctionComponent<JSX.SVGAttributes<SVGElement>>;
	export default content;
}
