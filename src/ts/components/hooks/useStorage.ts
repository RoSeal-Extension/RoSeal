import { useState } from "preact/hooks";
import useStateRef from "./useStateRef";
import { onStorageValueUpdate } from "../../helpers/storage.ts";
import { useEffect } from "preact/hooks";

export default function useStorage<T>(
	key: string,
	defaultValue: T,
	storageType: chrome.storage.AreaName = "local",
): [
	value: T,
	setValue: (newValue: T) => Promise<void>,
	valueRef: { current: T },
	valueFetched: boolean,
] {
	const [storageFetched, setStorageFetched] = useState(false);
	const [value, setValue, valueRef] = useStateRef<T>(defaultValue);
	useEffect(() => {
		browser.storage[storageType]
			.get(key)
			.then((value) => value[key])
			.then((value) => {
				if (value === undefined || value === undefined) {
					setValue(defaultValue);
				} else setValue(value);
				setStorageFetched(true);
			})
			.catch(() => setValue(defaultValue));

		return onStorageValueUpdate(
			[key],
			(_, newValue) =>
				setValue(
					(newValue !== null && newValue !== undefined ? newValue : defaultValue) as T,
				),
			storageType,
		);
	}, [key, storageType]);

	return [
		value,
		(newValue) => {
			setValue(newValue);

			return browser.storage[storageType].set({
				[key]: newValue,
			});
		},
		valueRef,
		storageFetched,
	];
}
