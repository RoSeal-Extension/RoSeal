import { getRobloxUrl, getRolimonsUrl } from "src/ts/utils/baseUrls.ts";
import { getRoSealAPIUrl } from "src/ts/utils/baseUrls.ts" with { type: "macro" };
import * as background from "../../communication/background.ts";
import * as dom from "../../communication/dom.ts";

const allowedUrlsFromDOM = [
	{
		type: "roblox",
		service: "games",
		regex: /^\/v1\/games\/multiget-playability-status$/,
	},
	{
		type: "roseal",
		regex: /^\/v2\/alerts\.json$/,
	},
	{
		type: "roseal",
		regex: /^\/v2\/launch-data\.json$/,
	},
	{
		type: "roseal",
		regex: /^\/v2\/experience-links\.json$/,
	},
	{
		type: "roseal",
		regex: /^\/v2\/experience-countdowns\.json$/,
	},
	{
		type: "roseal",
		regex: /^\/v2\/roblox-experiments\.json$/,
	},
	{
		type: "rolimons",
		regex: /^\/game\/\d+$/,
	},
];

export type CrossFetchResponse = {
	body: number[];
	headers: Record<string, string>;
	status: number;
	statusText: string;
};

export type CrossFetchArgs<T extends boolean> = {
	input: string;
	init?: Parameters<typeof fetch>[1];
	fromDOM?: T;
};

export async function bypassCORSFetch<T extends boolean>(
	input: CrossFetchArgs<T>["input"],
	init?: CrossFetchArgs<T>["init"],
	fromDOM?: CrossFetchArgs<T>["fromDOM"],
): Promise<T extends true ? CrossFetchResponse : Response> {
	const url = new URL(input);
	if (fromDOM) {
		let isAllowed = false;

		for (const target of allowedUrlsFromDOM) {
			if (
				((target.type === "roblox" &&
					target.service &&
					getRobloxUrl(target.service) === url.hostname) ||
					(target.type === "roseal" && getRoSealAPIUrl("") === url.hostname) ||
					(target.type === "rolimons" && getRolimonsUrl("") === url.hostname)) &&
				target.regex.test(url.pathname)
			) {
				isAllowed = true;
				break;
			}
		}

		if (import.meta.env.IS_DEV && url.hostname === "localhost") {
			isAllowed = true;
		}

		if (!isAllowed) {
			throw "NotAllowed";
		}

		// @ts-expect-error: Fine, this returns CrossFetchResponse
		return dom.invokeMessage("bypassCORSFetch", {
			input,
			init,
		});
	}

	const headers = init?.headers && init.headers instanceof Headers ? {} : init?.headers;
	if (init?.headers instanceof Headers) {
		for (const [key, value] of init.headers) {
			// @ts-expect-error: fine
			headers[key] = value;
		}
	}

	const sendData = {
		input,
		init: {
			...init,
			headers,
			body:
				init && "body" in init
					? Array.isArray(init.body)
						? init.body
						: ([
								...new Uint8Array(
									await new Response(init.body).arrayBuffer(),
								).values(),
							] as unknown as BodyInit)
					: undefined,
		},
	};

	const data =
		import.meta.env.ENV === "main"
			? await background.invokeMessage("fetch", sendData)
			: await dom.invokeMessage("bypassCORSFetch", sendData);

	// @ts-expect-error: Fine, this returns Response
	return new Response(data.body && new Uint8Array(data.body), {
		headers: data.headers,
		status: data.status,
		statusText: data.statusText,
	});
}
if (import.meta.env.ENV === "main") {
	dom.setInvokeListener("bypassCORSFetch", ({ input, init }) =>
		bypassCORSFetch(input, init, true),
	);
}
