export function lazyLoad<T>(
	fn: () => T,
): () => T extends Promise<unknown> ? Awaited<T> | undefined : T {
	let variable: T | undefined;

	// @ts-expect-error: Ok.
	return () => {
		if (!variable) {
			variable = fn();
			if (variable instanceof Promise) {
				variable
					.then((newValue) => {
						variable = newValue;
					})
					.catch(() => {
						variable = undefined;
					});
			}
		}

		return variable;
	};
}

import { signal } from "@preact/signals";
export function lazyLoadSignal<T>(fn: (update: (value: Awaited<T>) => void) => T) {
	const state = signal<{
		value: Awaited<T> | undefined | null;
		fetched: boolean;
		loaded: boolean;
	}>({
		value: null,
		fetched: false,
		loaded: false,
	});

	const load = () => {
		if (!state.value.fetched) {
			state.value = {
				...state.value,
				fetched: true,
			};
			const result = fn((data) => {
				state.value = {
					...state.value,
					value: data,
				};
			});
			if (result instanceof Promise) {
				result
					.then((newValue) => {
						state.value = {
							...state.value,
							loaded: true,
							value: newValue,
						};
					})
					.catch(() => {
						state.value = {
							...state.value,
							loaded: true,
							value: undefined,
						};
					});
			} else {
				state.value = {
					...state.value,
					loaded: true,
					value: result as Awaited<T>,
				};
			}
		}
	};

	const clear = () => {
		state.value = {
			value: null,
			fetched: false,
			loaded: false,
		};
	};

	return {
		clear,
		load,
		state,
	};
}
