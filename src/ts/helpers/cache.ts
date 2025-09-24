/*
    For complicated cache handling per session
    for regular GET cache that shouldn't be fetched constantly,
    please just use `cache` property.
*/

import { chunk } from "../utils/objects.ts";

const KEY_ITEM_SEPARATOR = ":";

export type SubKey<T, U extends Record<string, unknown>> = U & {
	id: T;
};

export const requestCache: Record<string, unknown> = {};

export function getCacheKey(key: unknown[], id?: unknown) {
	return `${key.join(KEY_ITEM_SEPARATOR)}${id !== undefined ? `${KEY_ITEM_SEPARATOR}${id}` : ""}`;
}

export function isCacheRequestPending(key: unknown[], id?: unknown) {
	const value = getCacheRaw(key, id);

	return value instanceof Promise;
}

export function getCacheRaw<T>(key: unknown[], id?: unknown): T | undefined {
	return requestCache[getCacheKey(key, id)] as T | undefined;
}

export function getCache<T>(key: unknown[], id?: unknown): Promise<T | undefined> {
	const value = getCacheRaw<T>(key, id);

	if (value instanceof Promise) return value;
	return Promise.resolve(value as T);
}

export function removeCache(key: unknown[], id?: unknown) {
	delete requestCache[getCacheKey(key, id)];
}

export function getCaches<T>(baseKey: unknown[], ids: unknown[]) {
	const newObj: Record<string, Promise<T | undefined>> = {};
	for (const id of ids) {
		newObj[String(id)] = getCache(baseKey, id);
	}

	return newObj;
}

export function isCached(key: unknown[], id?: unknown): boolean {
	return getCacheKey(key, id) in requestCache;
}

export function setCache(key: unknown[], value: unknown, id?: unknown) {
	const setKey = getCacheKey(key, id);
	requestCache[setKey] = value;

	if (value instanceof Promise) {
		value.then((newValue) => setCache(key, newValue));
	}
}

export type GetOrSetCachesProps<T, U, V extends Record<string, unknown>> = {
	baseKey: unknown[];
	keys: SubKey<U, V>[];
	fn: (keys: SubKey<U, V>[]) => Promise<Record<string, T>>;
	overrideCache?: boolean;
	batchLimit?: number;
	doNotCache?: boolean;
};

export function getOrSetCaches<T, U, V extends Record<string, unknown>>({
	baseKey,
	keys,
	fn,
	overrideCache,
	batchLimit,
	doNotCache,
}: GetOrSetCachesProps<T, U, V>): Promise<T[]> {
	const oldValue: Record<string, Promise<T | undefined>> = overrideCache
		? {}
		: getCaches(
				baseKey,
				keys.map((key) => key.id),
			);

	const resolves: Record<string, ((value: T) => void) | undefined> = {};
	const nonDuplicateKeys = keys.filter(
		(key, index, arr) => arr.findIndex((key2) => key2.id === key.id) === index,
	);

	if (!doNotCache) {
		for (const key of nonDuplicateKeys) {
			if (!isCached(baseKey, key.id)) {
				setCache(
					baseKey,
					new Promise<T>((resolve) => {
						resolves[key.id as string] = resolve;
					}),
					key.id,
				);
			}
		}
	}

	return (async () => {
		let newValue: Record<string, T> = {};
		for (const key in oldValue) {
			const value = await oldValue[key];
			if (value !== undefined) {
				newValue[key] = value;
			}
		}

		const keysToGet = nonDuplicateKeys.filter(
			(key) => newValue[key.id as string] === undefined,
		);

		if (keysToGet.length > 0) {
			for (const items of chunk(keysToGet, batchLimit)) {
				const response = await fn(items).catch(() => {});

				if (response) {
					newValue = {
						...newValue,
						...response,
					};
				}

				if (!doNotCache) {
					for (const key of items) {
						const value = newValue[key.id as string];
						const resolve = resolves[key.id as string];
						if (resolve) {
							resolve(value);
						} else {
							setCache(baseKey, value, key.id);
						}
					}
				}
			}
		}

		const returnedValue = [] as T[];
		for (const key of keys) {
			const value = newValue[key.id as string];
			if (value !== undefined) {
				returnedValue.push(value);
			}
		}

		return returnedValue;
	})();
}

export type GetOrSetCacheProps<T, U extends boolean = false> = {
	key: unknown[];
	fn: () => Promise<T>;
	overrideCache?: boolean;
	id?: unknown;
	supressError?: U;
	requireSuccessful?: boolean;
};

export function getOrSetCache<T, U extends boolean = false>({
	key,
	fn,
	overrideCache,
	id,
	supressError,
	requireSuccessful,
}: GetOrSetCacheProps<T, U>): Promise<U extends true ? T | undefined : T> {
	if (!overrideCache || isCacheRequestPending(key, id)) {
		return getCache<T>(key, id).then((value) => {
			if (
				value !== undefined &&
				(!requireSuccessful ||
					(typeof value === "object" &&
						value &&
						"success" in value &&
						value.success === true))
			) {
				return value as U extends true ? T | undefined : T;
			}

			return getOrSetCache({
				key,
				fn,
				overrideCache: true,
				id,
				supressError,
			});
		});
	}

	const value = fn();
	const valueNoThrow = value.catch(() => undefined as U extends true ? T | undefined : T);
	setCache(key, valueNoThrow, id);

	return supressError ? valueNoThrow : value;
}
