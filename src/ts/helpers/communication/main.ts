import type { MainCommunicationDataTypes } from "src/types/dataTypes.d.ts";

export function invokeMessage<
	T extends keyof MainCommunicationDataTypes = keyof MainCommunicationDataTypes,
>(
	id: number,
	action: T,
	args: MainCommunicationDataTypes[T]["args"],
): Promise<MainCommunicationDataTypes[T]["res"]> {
	return browser.tabs.sendMessage(id, {
		action,
		args,
	});
}
