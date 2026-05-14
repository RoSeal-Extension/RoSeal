import { DefaultHttpClient, HttpTransportType, HubConnectionBuilder } from "@microsoft/signalr";
import storageSignal from "src/ts/components/hooks/storageSignal";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { getRobloxUrl } from "src/ts/utils/baseUrls" with { type: "macro" };

export default {
	id: "dev/all",
	isAllPages: true,
	fn: () => {
		const client = new HubConnectionBuilder()
			.withUrl(`https://${getRobloxUrl("realtime-signalr", "/userhub")}`, {
				transport: HttpTransportType.WebSockets,
				httpClient: new DefaultHttpClient({
					log: () => {},
				}),
				skipNegotiation: true,
			})
			.withAutomaticReconnect()
			.build();

		const [storage, setStorage] = storageSignal<Record<string, Record<string, unknown>>>(
			"testingNotifications",
			{},
		);
		client.on("notification", (type, str) => {
			// biome-ignore lint/suspicious/noExplicitAny: fine
			const data = JSON.parse(str) as any;
			for (const item of Array.isArray(data) ? data : [data]) {
				const subType = item.type ?? item.Type ?? "default";
				if (!storage.value[type]?.[subType]) {
					storage.value[type] ??= {};
					storage.value[type][subType] = data;

					setStorage(storage.value);
				}
			}
		});

		client.start();
	},
} satisfies Page;
