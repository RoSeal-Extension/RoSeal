import type {
	BackgroundCommunicationDataTypes,
	CommunicationResponseMessage,
} from "src/types/dataTypes.d.ts";

export function invokeMessage<
	T extends keyof BackgroundCommunicationDataTypes,
	U extends BackgroundCommunicationDataTypes[T]["args"],
	V extends BackgroundCommunicationDataTypes[T]["res"],
>(action: T, args: U): Promise<V["data"]> {
	return browser.runtime
		.sendMessage({
			action,
			args,
		})
		.then((data: CommunicationResponseMessage<V["data"], V["reason"]>) => {
			if (!data.success) {
				throw data.reason;
			}

			return data.data;
		})
		.catch((err) => {
			throw typeof err === "string" ? err : "UnknownError";
		});
}
