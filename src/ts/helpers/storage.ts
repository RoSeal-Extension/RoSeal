import { error } from "../utils/console";
import { invokeMessage } from "./communication/background";

export const storage = browser?.storage?.[import.meta.env.BASE_STORAGE_TYPE];
export const LOCALSTORAGE_PREFIX = "roseal.";

export function getLocalStorageKey(key: string) {
	return `${LOCALSTORAGE_PREFIX}${key}`;
}

export function setLocalStorage(key: string, value: unknown) {
	const prefixedKey = getLocalStorageKey(key);
	if (value) {
		globalThis.localStorage.setItem(
			prefixedKey,
			typeof value === "string" ? value : JSON.stringify(value),
		);
	} else {
		globalThis.localStorage.removeItem(prefixedKey);
	}
}

export function getLocalStorage<T>(key: string): T | undefined {
	const prefixedKey = getLocalStorageKey(key);
	const value = globalThis.localStorage.getItem(prefixedKey);
	if (value) {
		try {
			return JSON.parse(value) as T;
		} catch {
			return value as T;
		}
	}

	return undefined;
}

export function removeLocalStorage(key: string) {
	globalThis.localStorage.removeItem(getLocalStorageKey(key));
}

export function setLocalSessionStorage(key: string, value: unknown) {
	const prefixedKey = getLocalStorageKey(key);
	if (value) {
		globalThis.sessionStorage?.setItem(
			prefixedKey,
			typeof value === "string" ? value : JSON.stringify(value),
		);
	} else {
		globalThis.localStorage.removeItem(prefixedKey);
	}
}

export function getLocalSessionStorage<T>(key: string): T | undefined {
	const prefixedKey = getLocalStorageKey(key);
	const value = globalThis.sessionStorage?.getItem(prefixedKey);
	if (value) {
		try {
			return JSON.parse(value) as T;
		} catch {
			return value as T;
		}
	}
}

export function removeLocalSessionStorage(key: string) {
	sessionStorage.removeItem(getLocalStorageKey(key));
}

// When getting a storage value is urgent, this will use localStorage and if it doesn't exist then it will fetch from storage.
export function getUrgentStorage<T>(key: string): [T | undefined, (value: T) => void] {
	storage
		.get(key)
		.then((data) => {
			setLocalStorage(key, data[key]);
		})
		.catch((err) => {
			error(`Failed to get local storage key ${key}`, err);
		});

	onStorageValueUpdate([key], (_key, newValue) => {
		setLocalStorage(key, newValue);
	});

	const updateValue = (value: unknown) => {
		if (!value) {
			storage.remove(key);
			removeLocalStorage(key);
		} else {
			setLocalStorage(key, value);
			storage.set({
				[key]: value,
			});
		}
	};

	return [getLocalStorage<T>(key), updateValue];
}

export type StorageUpdateListener = [
	// biome-ignore lint/suspicious/noExplicitAny: We already know
	(storageKey: string, newValue: any) => Promise<void> | void,
	string[],
	chrome.storage.AreaName,
];

export const storageUpdateListeners = new Set<StorageUpdateListener>();

export function onStorageValueUpdate<T = unknown>(
	storageKeys: string[],
	callback: (storageKey: string, newValue: T) => Promise<void> | void,
	storageType: chrome.storage.AreaName = "local",
) {
	const match = [callback, storageKeys, storageType] as StorageUpdateListener;
	storageUpdateListeners.add(match);

	return () => {
		storageUpdateListeners.delete(match);
	};
}

export function getExtensionSessionStorage<T>(key: string): Promise<T | undefined> {
	if (import.meta.env.TARGET_BASE !== "firefox" || import.meta.env.ENV === "background") {
		return browser.storage.session.get(key).then((data) => data[key] as T);
	}

	return invokeMessage("getSessionStorage", key).then((data) => data[key] as T | undefined);
}

export function setExtensionSessionStorage(values: Record<string, unknown>) {
	if (import.meta.env.TARGET_BASE !== "firefox" || import.meta.env.ENV === "background") {
		return browser.storage.session.set(values);
	}

	return invokeMessage("setSessionStorage", values);
}

export function removeExtensionSessionStorage(keys: string | string[]) {
	if (import.meta.env.TARGET_BASE !== "firefox") {
		return browser.storage.session.remove(keys);
	}

	return invokeMessage("removeSessionStorage", keys);
}

export async function setTimedStorage(
	key: string,
	type: chrome.storage.AreaName,
	value: unknown,
	subkey?: string | number,
) {
	if (subkey) {
		const allData =
			(await (type === "session"
				? // biome-ignore lint/suspicious/noExplicitAny: Fine
					getExtensionSessionStorage<any>(key)
				: browser.storage[type].get(key))) ?? {};

		await (type === "session" ? setExtensionSessionStorage : storage.set)({
			[key]: {
				...allData,
				[subkey]: {
					timestamp: Date.now(),
					value,
				},
			},
		});
	}
	await (type === "session" ? setExtensionSessionStorage : storage.set)({
		[key]: {
			timestamp: Date.now(),
			value,
		},
	});
}

export async function getTimedStorage<T>(
	key: string,
	type: chrome.storage.AreaName,
	timeInMs: number,
	fetch: () => Promise<T>,
	subkey?: string | number,
): Promise<T> {
	const allData = await (type === "session"
		? // biome-ignore lint/suspicious/noExplicitAny: Fine
			getExtensionSessionStorage<any>(key)
		: browser.storage[type].get(key));
	const currentValue = subkey ? allData?.[subkey] : allData;

	const data = currentValue ?? {
		timestamp: Date.now(),
		value: await fetch(),
	};

	if (Date.now() - data.timestamp > timeInMs) {
		data.value = await fetch();
		data.timestamp = Date.now();

		await (type === "session" ? setExtensionSessionStorage : storage.set)({
			[key]: subkey ? { ...allData, [subkey]: data } : data.value,
		});
	}

	if (!currentValue) {
		await (type === "session" ? setExtensionSessionStorage : storage.set)({
			[key]: subkey ? { ...allData, [subkey]: data } : data.value,
		});
	}

	return data.value;
}
