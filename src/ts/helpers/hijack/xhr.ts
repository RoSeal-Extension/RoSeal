import { _hijackRequests, _hijackResponses } from "./fetch.ts";
import { hijackFunction, hijackedSymbol } from "./utils.ts";

export type HijackedXHR = XMLHttpRequest & {
	[hijackedSymbol]?: {
		url?: string;
		method?: string;
		async: boolean;
		request?: Request;
		requestHeaders: Headers;
		responseHeaders: Headers;
		setDone: (type?: string) => void;
		responseDone?: boolean;
	};
};

export function setupHijackXhr() {
	const open = hijackFunction(
		globalThis.XMLHttpRequest.prototype as HijackedXHR,
		(target, xhr, argArray) => {
			if (!(hijackedSymbol in xhr)) {
				return target.apply(xhr, argArray);
			}

			const [method, url, async] = argArray;
			xhr[hijackedSymbol]!.method = method;
			xhr[hijackedSymbol]!.url = url.toString();
			xhr[hijackedSymbol]!.async = async;
			xhr[hijackedSymbol]!.responseDone = false;
		},
		"open",
	);

	const setRequestHeader = hijackFunction(
		globalThis.XMLHttpRequest.prototype as HijackedXHR,
		(target, xhr, argArray) => {
			if (!(hijackedSymbol in xhr)) {
				return target.apply(xhr, argArray);
			}

			xhr[hijackedSymbol]!.requestHeaders.set(argArray[0], argArray[1]);
		},
		"setRequestHeader",
	);

	const getAllResponseHeaders = hijackFunction(
		globalThis.XMLHttpRequest.prototype as HijackedXHR,
		(target, xhr) => {
			if (!(hijackedSymbol in xhr)) {
				return target.apply(xhr);
			}

			let str = "";
			for (const [name, value] of xhr[hijackedSymbol]!.responseHeaders) {
				str += `${name}: ${value}\n`;
			}

			return str;
		},
		"getAllResponseHeaders",
	);

	hijackFunction(
		globalThis.XMLHttpRequest.prototype as HijackedXHR,
		(target, xhr, argArray) => {
			if (!(hijackedSymbol in xhr)) {
				return target.apply(xhr, argArray);
			}

			const data = xhr[hijackedSymbol]!;
			data.responseDone = false;

			if (!data.url || !data.method) return;

			const [body] = argArray;

			const requestData: RequestInit = {
				method: data.method,
				headers: data.requestHeaders,
				credentials: xhr.withCredentials ? "include" : "same-origin",
			};

			if (body && !(body instanceof Document)) {
				requestData.body = body;
			}

			(async () => {
				data.request = new Request(data.url!, requestData);
				for (const fn of _hijackRequests) {
					try {
						const returnValue = await fn(data.request);
						if (returnValue instanceof Response) {
							const response = returnValue;

							for (const [name, value] of response.headers) {
								data.responseHeaders.set(name, value);
							}

							const newResponseText = await response.clone().text();
							const newResponseBody = await (xhr.responseType === "arraybuffer"
								? response.arrayBuffer()
								: xhr.responseType === "blob"
									? response.clone().blob()
									: xhr.responseType === "json"
										? response.clone().json()
										: response.clone().text());

							const { status, statusText } = response;

							// do not use Object.defineProperties because the defineProperty hijack does not supprot it and never will.
							Object.defineProperty(xhr, "status", {
								get: () => status,
								configurable: true,
							});
							Object.defineProperty(xhr, "statusText", {
								get: () => statusText,
								configurable: true,
							});
							Object.defineProperty(xhr, "responseText", {
								get: () => newResponseText,
								configurable: true,
							});
							Object.defineProperty(xhr, "response", {
								get: () => newResponseBody,
								configurable: true,
							});
							Object.defineProperty(xhr, "readyState", {
								get: () => xhr.DONE,
								configurable: true,
							});

							data.setDone("load");
							return;
						}

						if (returnValue === false) {
							Object.defineProperty(xhr, "readyState", {
								get: () => xhr.UNSENT,
								configurable: true,
							});
							data.setDone("error");

							return;
						}

						data.request = returnValue ?? data.request;
					} catch {}
				}

				// @ts-expect-error: Fine
				delete xhr.readyState;
				open.apply(xhr, [data.request.method, data.request.url, data.async]);
				for (const [name, value] of data.request.headers) {
					if (name === "content-type" && value.includes("form-data")) continue;

					setRequestHeader.apply(xhr, [name, value]);
				}

				const contentType = data.request.headers.get("content-type");

				const clonedRequest = data.request.clone();
				if (!contentType || contentType.includes("json") || contentType.includes("text")) {
					clonedRequest.text().then((data) => {
						target.apply(xhr, body ? [data] : []);
					});
					return;
				}

				if (contentType.includes("form-data")) {
					clonedRequest.formData().then((data) => {
						target.apply(xhr, [data]);
					});
					return;
				}

				clonedRequest.arrayBuffer().then((data) => {
					target.apply(xhr, body ? [data] : []);
				});
			})();

			for (const name of data.responseHeaders.keys()) {
				data.responseHeaders.delete(name);
			}
		},
		"send",
	);

	globalThis.XMLHttpRequest = new Proxy(globalThis.XMLHttpRequest, {
		construct: (target) => {
			const xhr: HijackedXHR = new target();
			const data: HijackedXHR[typeof hijackedSymbol] = {
				requestHeaders: new Headers(),
				responseHeaders: new Headers(),
				async: true,
				setDone: (type) => {
					const stateChangeEvent = new CustomEvent("readystatechange", {
						bubbles: true,
						cancelable: false,
					});
					data!.responseDone = true;
					xhr.dispatchEvent(stateChangeEvent);

					if (type) {
						const loadEvent = new CustomEvent(type, {
							bubbles: true,
							cancelable: false,
						});
						xhr.dispatchEvent(loadEvent);
					}
				},
				responseDone: false,
			};
			xhr[hijackedSymbol] = data;

			xhr.addEventListener(
				"readystatechange",
				(e) => {
					if (
						xhr.readyState === xhr.UNSENT ||
						xhr.readyState === xhr.OPENED ||
						data.responseDone
					) {
						return;
					}

					e.stopImmediatePropagation();
					if (xhr.readyState !== xhr.DONE) {
						return;
					}

					if (xhr.responseType === "document") {
						// Do not handle document
						return data.setDone(xhr.status === 0 ? "error" : "load");
					}

					const parsedHeaders = getAllResponseHeaders
						.apply(xhr)
						?.trim()
						.split(/[\r\n]+/);
					const resHeaders = new Headers();
					if (parsedHeaders) {
						for (const header of parsedHeaders) {
							const parsedHeaderValue = header.split(": ");
							const parsedHeaderName = parsedHeaderValue.shift();

							if (parsedHeaderName) {
								resHeaders.set(parsedHeaderName, parsedHeaderValue.join(": "));
							}
						}
					}

					(async () => {
						let response =
							xhr.status !== 0
								? new Response(
										xhr.responseType === "json"
											? JSON.stringify(xhr.response)
											: xhr.response === ""
												? undefined
												: xhr.response,
										{
											headers: resHeaders,
											status: xhr.status,
											statusText: xhr.statusText,
										},
									)
								: undefined;
						for (const fn of _hijackResponses) {
							try {
								response = (await fn(data.request!, response)) ?? response;
							} catch {}
						}

						if (!response) {
							return data.setDone("error");
						}

						for (const [name, value] of response.headers) {
							data.responseHeaders.set(name, value);
						}

						const newResponseText = await response.clone().text();
						const newResponseBody = await (xhr.responseType === "arraybuffer"
							? response.arrayBuffer()
							: xhr.responseType === "blob"
								? response.clone().blob()
								: xhr.responseType === "json"
									? response.clone().json()
									: response.clone().text());

						const { status, statusText } = response;

						// do not use Object.defineProperties because the defineProperty hijack does not supprot it and never will.
						Object.defineProperty(xhr, "status", {
							get: () => status,
							configurable: true,
						});
						Object.defineProperty(xhr, "statusText", {
							get: () => statusText,
							configurable: true,
						});
						Object.defineProperty(xhr, "responseText", {
							get: () => newResponseText,
							configurable: true,
						});
						Object.defineProperty(xhr, "response", {
							get: () => newResponseBody,
							configurable: true,
						});
						data.setDone("load");
					})();
				},
				{
					capture: true,
				},
			);

			for (const type of ["load", "error"]) {
				xhr.addEventListener(
					type,
					(e) => {
						if (data.responseDone) {
							return;
						}

						e.stopImmediatePropagation();
					},
					{
						capture: true,
					},
				);
			}

			return xhr;
		},
	});
}
