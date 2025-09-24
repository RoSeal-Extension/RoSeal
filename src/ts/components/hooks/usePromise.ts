import { useLayoutEffect, useState, type Inputs } from "preact/hooks";
import useDidMountEffect from "./useDidMountEffect.ts";
import { useSignal } from "@preact/signals";

const defaultState = [undefined, false, undefined] as [undefined, false, undefined];
export default function usePromise<
	T extends (increment: number) => Promise<unknown> | unknown | void,
	U = unknown,
>(
	promise: T,
	inputs: Inputs = [],
	resetOnUpdate = true,
): [
	value: Awaited<ReturnType<T>> | null | undefined,
	fetched: boolean,
	error: U | null | undefined,
	update: () => void,
	setValue: (
		data:
			| Awaited<ReturnType<T>>
			| null
			| undefined
			| ((
					value: Awaited<ReturnType<T>> | null | undefined,
			  ) => Awaited<ReturnType<T>> | null | undefined),
	) => void,
] {
	const [state, setState] =
		useState<[Awaited<ReturnType<T>> | null | undefined, boolean, U | null | undefined]>(
			defaultState,
		);
	const increment = useSignal(0);

	useLayoutEffect(() => {
		if (state !== defaultState && resetOnUpdate) {
			setState(defaultState);
		}

		const curIncrement = increment.value;
		const result = promise(curIncrement);
		if (result instanceof Promise) {
			result
				.then((data) => {
					try {
						if (increment.value !== curIncrement) {
							return;
						}
						setState([data, true, undefined]);
					} catch {}
				})

				.catch((error) => {
					try {
						if (increment.value !== curIncrement) {
							return;
						}
						setState([null, true, error ?? null]);
					} catch {}
				});
		} else setState([result as Awaited<ReturnType<T>>, true, undefined]);
	}, [increment.value]);

	useDidMountEffect(() => {
		increment.value += 1;
	}, inputs);

	return [
		...state,
		() => {
			increment.value += 1;
		},
		(value) => {
			if (typeof value === "function") {
				// @ts-expect-error: "Ohhhh wait if it is not a Fucntion? Die."
				return setState((prevValue) => [value(prevValue[0]), true, null]);
			}

			return setState([value, true, null]);
		},
	];
}
