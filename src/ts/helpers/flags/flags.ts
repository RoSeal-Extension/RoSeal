import { initialLaunchDataFetch } from "src/ts/utils/interastral.ts";
import { flagsData, type FlagsData } from "./flagsData.ts";
import { setInvokeListener } from "../communication/dom.ts";

export type FlagUpdateListener = [
	isKeys: true,
	// biome-ignore lint/suspicious/noExplicitAny: The client knows what they're doing
	callback: (namespace: any, key: any, newValue: any) => Promise<void> | void,
	namespace: string,
	// biome-ignore lint/suspicious/noExplicitAny: The client knows what they're doing
	keys: any[],
];

export type FlagNamespaceListener = [
	isKeys: false,
	// biome-ignore lint/suspicious/noExplicitAny: The client knows what they're doing
	callback: (namespace: any, newValue: any) => Promise<void> | void,
	namespace: string,
	keys: undefined,
];

export const flagUpdateListeners = new Set<FlagUpdateListener | FlagNamespaceListener>();

export function onFlagNamespaceUpdate<T extends keyof FlagsData>(
	namespace: T,
	callback: (namespace: T, newValue: FlagsData[T]) => Promise<void> | void,
) {
	const match = [false, callback, namespace, undefined] as FlagNamespaceListener;
	flagUpdateListeners.add(match);

	return () => {
		flagUpdateListeners.delete(match);
	};
}

export function onFlagUpdate<T extends keyof FlagsData, U extends keyof FlagsData[T]>(
	namespace: T,
	keys: U[],
	callback: (namespace: T, key: U, newValue: FlagsData[T][U]) => Promise<void> | void,
) {
	const match = [true, callback, namespace, keys] as FlagUpdateListener;
	flagUpdateListeners.add(match);

	return () => {
		flagUpdateListeners.delete(match);
	};
}

export function _flagCacheSet<T extends keyof FlagsData, U extends keyof FlagsData[T]>(
	namespace: T,
	key: U,
	value: FlagsData[T][U],
) {
	if (
		!(namespace in flagsData && key in flagsData[namespace]) ||
		flagsData[namespace][key] === value
	) {
		return;
	}

	flagsData[namespace][key] = value;

	for (const listener of flagUpdateListeners) {
		if (listener[2] === namespace) {
			if (listener[0]) {
				if (listener[3].includes(key)) listener[1](namespace, key, value);
			} else listener[1](namespace, flagsData[namespace]);
		}
	}
}

const flagsModification = initialLaunchDataFetch.then((data) => {
	if (!data.flags) {
		return;
	}

	for (const [namespaceKey, flags] of Object.entries(data.flags)) {
		for (const key in flags) {
			_flagCacheSet(
				namespaceKey as keyof FlagsData,
				key as keyof FlagsData[keyof FlagsData],
				// @ts-expect-error: Fine
				flags[key],
			);
		}
	}
});

export async function getFlag<T extends keyof FlagsData>(namespace: T, key: keyof FlagsData[T]) {
	await flagsModification;
	return flagsData[namespace]?.[key];
}

setInvokeListener("getFlag", (data) => getFlag(data.namespace, data.key));
setInvokeListener("getFlagNamespace", (data) => getFlagNamespace(data.namespace));

export async function getFlagNamespace<T extends keyof FlagsData>(namespace: T) {
	await flagsModification;
	return flagsData[namespace];
}

export type FlagCall<
	T extends keyof FlagsData = keyof FlagsData,
	U extends keyof FlagsData[T] = keyof FlagsData[T],
> = {
	namespace: T;
	key: U;
	value: FlagsData[T][U];
};

export function flagCallMatch(flag: FlagCall, value: unknown) {
	if (Array.isArray(value)) {
		if (Array.isArray(flag.value)) {
			return (flag.value as unknown[]).some((item) => value.includes(item));
		}
		return value.includes(flag.value);
	}

	if (Array.isArray(flag.value)) {
		return (flag.value as unknown[]).includes(value);
	}

	return flag.value === value;
}
