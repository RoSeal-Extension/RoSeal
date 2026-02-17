import { getFlag, onFlagUpdate } from "../../helpers/flags/flags.ts";
import { useEffect, useState, type Inputs } from "preact/hooks";
import type { FlagsData } from "../../helpers/flags/flagsData";

export default function useFlag<T extends keyof FlagsData, U extends keyof FlagsData[T]>(
	namespace?: T,
	key?: U,
	dependencies: Inputs = [],
) {
	const [flag, setFlag] = useState<FlagsData[T][U] | undefined>(undefined);

	useEffect(() => {
		setFlag(undefined);

		if (!namespace || !key) return;

		// @ts-expect-error: TypeScript fricking sucks. FlagsData[T] is fine.
		getFlag(namespace, key).then(setFlag);
		return onFlagUpdate(namespace, [key], (_, _2, newValue) => setFlag(newValue));
	}, [namespace, key, ...dependencies]);

	return flag;
}
