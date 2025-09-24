import { invokeMessage } from "../communication/dom";
import type { FlagsData } from "./flagsData";

export async function getFlagInject<T extends keyof FlagsData>(
	namespace: T,
	key: keyof FlagsData[T],
) {
	// @ts-expect-error: TypeScript fricking sucks. FlagsData[T] is fine.
	return invokeMessage("getFlag", { namespace, key });
}

export async function getFlagNamespaceInject<T extends keyof FlagsData>(namespace: T) {
	return invokeMessage("getFlagNamespace", { namespace });
}
