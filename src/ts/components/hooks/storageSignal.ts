import { signal, type Signal } from "@preact/signals";
import { onStorageValueUpdate } from "../../helpers/storage.ts";

export default function storageSignal<T>(
	key: string,
	defaultValue: T,
	storageType: chrome.storage.AreaName = "local",
): [Signal<T>, (newValue: T) => Promise<void>] {
	const value = signal<T>(defaultValue);

	browser.storage[storageType]
		.get(key)
		.then((newValue) => newValue[key])
		.then((newValue) => {
			value.value = (
				newValue !== null && newValue !== undefined ? newValue : defaultValue
			) as T;
		})

		.catch(() => {
			value.value = defaultValue;
		});
	onStorageValueUpdate(
		[key],
		(_, newValue) => {
			value.value = (
				newValue !== null && newValue !== undefined ? newValue : defaultValue
			) as T;
		},
		storageType,
	);

	return [
		value,
		(newValue) => {
			value.value = newValue;

			return browser.storage[storageType].set({
				[key]: newValue,
			});
		},
	];
}
