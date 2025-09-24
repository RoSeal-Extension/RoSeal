import { useSignal } from "@preact/signals";
import { type Inputs, useCallback, useEffect } from "preact/hooks";

// biome-ignore lint/suspicious/noExplicitAny: No u
export default function useCallbackSignal<T extends (...args: any[]) => any>(
	callback: T,
	inputs: Inputs,
) {
	const signal = useSignal<T>(callback);

	useEffect(() => {
		signal.value = callback;
	}, inputs);

	return useCallback((...args: Parameters<T>) => {
		return signal.value(...args);
	}, []);
}
