import type { BackgroundMessageListener } from "src/types/dataTypes";

export default {
	action: "fetch",
	fn: async (data: {
		input: string;
		init: Parameters<typeof fetch>[1] & {
			headers: Record<string, string>;
			body?: number[] | Uint8Array;
		};
	}) => {
		const init = { ...data.init };
		if (init.body) {
			init.body = new Uint8Array(init.body);
		}

		const res = await fetch(data.input, init);
		const headers: Record<string, string> = {};
		for (const [key, value] of res.headers) {
			headers[key] = value;
		}

		return {
			body: [...new Uint8Array(await res.arrayBuffer()).values()],
			headers,
			status: res.status,
			statusText: res.statusText,
		};
	},
} satisfies BackgroundMessageListener<"fetch">;
