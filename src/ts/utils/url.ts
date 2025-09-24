import { getRobloxUrl } from "./baseUrls.ts" with { type: "macro" };

export function canParseURL(url: string) {
	if ("canParse" in URL) {
		return URL.canParse(url);
	}
	try {
		// @ts-expect-error: sometimes it wont exist
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

export function getPathFromMaybeUrl(url: string) {
	if (canParseURL(url)) {
		return getPath(new URL(url).pathname);
	}

	if (canParseURL(`https://${url}`)) {
		return getPath(new URL(`https://${url}`).pathname);
	}

	return getPath(url);
}

export function getPath(url?: string) {
	const path = (url ?? location.pathname).replace(/([^:]\/)\/+/g, "$1").replace(/\/$/, "");

	let locale: string | undefined;
	let realPath: string;

	try {
		const split = path.split("/");
		const localeMaybe = split[1];
		if (localeMaybe && localeRegex.test(localeMaybe) && !["js", "my"].includes(localeMaybe)) {
			split.splice(1, 1);
			locale = localeMaybe;
		}

		realPath = split.join("/");
	} catch {
		/* catch error */
		realPath = path;
	}

	return { locale, realPath, path };
}

export const matchUrlRegex =
	/(((?:http)?s?:\/\/(?:www.|(?!www))[a-zA-Z0-9][a-zA-Z0-9][a-zA-Z0-9].[^\s()[\].]{}|www.[a-zA-Z0-9][a-zA-Z0-9]+[a-zA-Z0-9].[^\s]{2,}|https?:\/\/(?:www.|(?!www))[a-zA-Z0-9]+.[^\s]{2,}|www.[a-zA-Z0-9]+.[^\s]{2,}))/g;

export function formatUrl(url: string): URL | null {
	let newUrl = url.replace(/^http:/, "https:");
	if (!newUrl.startsWith("https://")) {
		newUrl = `https://${newUrl}`;
	}
	try {
		const url = new URL(newUrl);
		if (url.protocol !== "https:") return null;

		return url;
	} catch {
		return null;
	}
}

export type Site = {
	name: string;
	isNextJS?: boolean;
	baseUrl: string;
};

export const sites = [
	{
		name: "www",
		isNextJS: false,
		baseUrl: getRobloxUrl("www"),
	},
	{
		name: "docs",
		isNextJS: true,
		baseUrl: getRobloxUrl("create", "/docs"),
	},
	{
		name: "store",
		isNextJS: true,
		baseUrl: getRobloxUrl("create", "/store"),
	},
	{
		name: "roadmap",
		isNextJS: true,
		baseUrl: getRobloxUrl("create", "/roadmap"),
	},
	{
		name: "talent",
		isNextJS: true,
		baseUrl: getRobloxUrl("create", "/talent"),
	},
	{
		name: "dashboard",
		isNextJS: true,
		baseUrl: getRobloxUrl("create"),
	},
	/*
	{
		name: "authorize",
		isNextJS: true,
		baseUrl: getRobloxUrl("authorize"),
	},
	{
		name: "music",
		isNextJS: true,
		baseUrl: getRobloxUrl("music"),
	},
	*/
] as const satisfies Site[];

export type SiteType = (typeof sites)[number]["name"];

export function getSiteType(url: string | URL): (typeof sites)[number] | null {
	const asURL = url instanceof URL ? url : new URL(url);
	const checkUrl = `${asURL.hostname}${asURL.pathname}`;

	for (const site of sites) {
		if (checkUrl.startsWith(site.baseUrl)) {
			return site;
		}
	}

	return null;
}
export const localeRegex = /^[a-z]{2}(\-[a-z0-9]{2,3})?$/i;
