import { ROSEAL_TRACKING_HEADER_NAME } from "scripts/build/constants.ts";
import { hijackFunction } from "./utils.ts";
import { setupHijackXhr } from "./xhr.ts";

export type HijackRequestFn = (request: Request) => MaybePromise<Request | Response | void | false>;
export type HijackResponseFn = (
	request: Request,
	response?: Response,
) => MaybePromise<Response | void>;

export const _hijackRequests = new Set<HijackRequestFn>();
export const _hijackResponses = new Set<HijackResponseFn>();

function setupHijackFetch() {
	setupHijackXhr();
	hijackFunction(
		globalThis,
		async (target, thisArg, argArray) => {
			let request: Request | false = new Request(...argArray);
			if (request.url.includes(ROSEAL_TRACKING_HEADER_NAME))
				return target.apply(thisArg, [request]);

			for (const fn of _hijackRequests) {
				try {
					const returnValue = await fn(request);
					if (returnValue instanceof Response) {
						return returnValue;
					}
					if (returnValue === false) {
						return Promise.reject(new Error("Request was aborted"));
					}

					request = returnValue ?? request;
				} catch {}
			}

			return target
				.apply(thisArg, [request.clone()])
				.then(async (_res) => {
					let res = _res;
					for (const fn of _hijackResponses) {
						try {
							res = (await fn(request, res)) ?? res;
						} catch {}
					}

					return res;
				})
				.catch(async (err) => {
					let res: Response | undefined;
					try {
						for (const fn of _hijackResponses) {
							res = (await fn(request, res)) ?? res;
						}
					} catch {}
					if (!res) {
						throw err;
					}

					return res;
				});
		},
		"fetch",
	);
}

export function hijackRequest(fn: HijackRequestFn) {
	_hijackRequests.add(fn);
	return () => {
		_hijackRequests.delete(fn);
	};
}

export function hijackResponse(fn: HijackResponseFn) {
	_hijackResponses.add(fn);
	return () => {
		_hijackResponses.delete(fn);
	};
}

if (import.meta.env.ENV === "inject") {
	setupHijackFetch();
}
