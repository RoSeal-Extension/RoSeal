import { DEV_SERVER_WS_PORT } from "scripts/build/constants.ts";

export type DevServerData<T> = {
	type: T;
};

export function waitUntilDevServerOnline() {
	return new Promise<void>((resolve) => {
		const interval = setInterval(() => {
			fetch(`http://localhost:${DEV_SERVER_WS_PORT}`, {
				method: "HEAD",
			})
				.then(() => {
					resolve();
					clearInterval(interval);
				})
				.catch(() => {});
		}, 1_000);
	});
}

export async function connectToDevServer<T>(type: T | T[], call: (type: T) => void) {
	await waitUntilDevServerOnline();
	const websocket = new WebSocket(`ws://localhost:${DEV_SERVER_WS_PORT}`);
	websocket.addEventListener("message", (event: MessageEvent<string>) => {
		const data = JSON.parse(event.data) as DevServerData<T>;

		if (Array.isArray(type) ? type.includes(data.type) : data.type === type) {
			call(data.type);
		}
	});

	const interval = setInterval(() => {
		if (websocket.readyState === WebSocket.OPEN) {
			websocket.send("ping");
		}
	}, 5_000);

	websocket.addEventListener("close", () => {
		clearInterval(interval);
		connectToDevServer(type, call);
	});
}
