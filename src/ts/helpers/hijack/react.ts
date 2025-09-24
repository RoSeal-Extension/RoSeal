import type { ComponentType, JSX, VNode } from "preact";
import { error } from "src/ts/utils/console.ts";
import currentUrl from "src/ts/utils/currentUrl.ts";
import { hijackFunction, hijackedSymbol, onSet } from "./utils.ts";

const globalComponents: [VNode, Element][] = [];
export type MatchesComponentFn = [
	matches: (element: VNode, container: Element) => boolean,
	fn: (element: VNode, container: Element) => void,
];
const matchesComponentFns = new Set<MatchesComponentFn>();

export function setupHijackComponent(reactDom: typeof window.ReactDOM) {
	const newReactDom = {
		...reactDom,
	};
	// @ts-expect-error: fine
	globalThis.ReactDOM = newReactDom;
	return hijackFunction(
		newReactDom,
		(target, thisArg, args) => {
			const [element, container] = args;
			if (
				!globalComponents.some(
					([element2, container2]) => element === element2 && container === container2,
				) &&
				window.React.isValidElement(element)
			) {
				globalComponents.push([element as VNode, container as Element]);
				for (const [matches, fn] of matchesComponentFns) {
					if (matches(element as VNode, container as Element)) {
						fn(element as VNode, container as Element);
					}
				}
			}

			return target.apply(thisArg, args);
		},
		"render",
	);
}

export function hijackComponent(
	matches: (element: VNode, container: Element) => boolean,
	handle: (element: VNode, container: Element) => void,
	initializeOnce = false,
) {
	const match = [matches, handle] as MatchesComponentFn;
	matchesComponentFns.add(match);

	for (const [element, container] of globalComponents.reverse()) {
		if (!matches(element, container)) {
			handle(element, container);
			if (initializeOnce) {
				break;
			}
		}
	}

	return () => {
		matchesComponentFns.delete(match);
	};
}

export type PublicSetState = (
	// biome-ignore lint/suspicious/noExplicitAny: The client knows what they're doing
	value: unknown | ((prevState: any) => unknown),
	excludeMatch?: MatchesStateFn,
	originFromSiteCode?: boolean,
) => void;
export type PrivateSetState = (value: unknown, updateReact?: boolean) => unknown;

export type MatchesStateFn<T = unknown> = [
	matches: (value: unknown) => boolean,
	fn: (data: {
		value: {
			current: T;
		};
		publicSetState: PublicSetState;
		id: number;
		originFromSiteCode?: boolean;
		originFromSetState?: boolean;
	}) => unknown,
	onStateRemoved: ((id: number) => void) | undefined,
	onlyFromSiteUpdate?: boolean,
];

const matchesStateFns = new Set<MatchesStateFn>();
const globalState: Record<
	number,
	[
		state: {
			current: unknown;
		},
		privateSetState: PrivateSetState,
		extPublicSetState: PublicSetState,
		sitePublicSetState: PublicSetState,
		reactState: ReturnType<typeof window.React.useState>,
	]
> = {};

let globalStateId = 0;
export function setupHijackState(react: typeof window.React) {
	// @ts-expect-error: Fine
	return hijackFunction(
		react,
		(target, _, args: [unknown]) => {
			const setValue = args[0];
			let id: number;
			try {
				const idObj = react.useRef({
					[hijackedSymbol]: ++globalStateId,
				});

				if (
					!idObj ||
					typeof idObj !== "object" ||
					idObj.current[hijackedSymbol] === undefined
				) {
					return target(setValue);
				}

				id = idObj.current[hijackedSymbol];
			} catch {
				return target(setValue);
			}

			const useStateRes = target(setValue);

			const newSetValue = {
				current: useStateRes[0],
			};

			const privateSetState =
				globalState[id]?.[1] ??
				((value: unknown) => {
					if (globalState[id]) {
						globalState[id][0].current = value;
						globalState[id][4][1](value);
					}
				});

			const extPublicSetState =
				globalState[id]?.[2] ??
				((value, excludeMatch, originFromSiteCode) => {
					if (!(id in globalState)) {
						return;
					}

					const currentValue = globalState[id][0];
					const newValue =
						typeof value === "function" && value.length === 1
							? value(currentValue.current)
							: value;

					if (Object.is(newValue, currentValue.current)) {
						return;
					}

					currentValue.current = newValue;
					try {
						for (const match of matchesStateFns) {
							if (excludeMatch && match === excludeMatch) {
								continue;
							}

							if (match[3] && !originFromSiteCode) {
								continue;
							}

							if (match[0](currentValue.current)) {
								currentValue.current = match[1]({
									value: currentValue,
									publicSetState: extPublicSetState,
									id,
									originFromSiteCode,
									originFromSetState: true,
								});
							}
						}
					} catch {}

					privateSetState(currentValue.current);
				});

			const sitePublicSetState =
				globalState[id]?.[3] ??
				((value) => {
					return extPublicSetState(value, undefined, true);
				});

			if (!(id in globalState)) {
				globalState[id] = [
					newSetValue,
					privateSetState,
					extPublicSetState,
					sitePublicSetState,
					useStateRes,
				];
				try {
					for (const match of matchesStateFns) {
						if (match[0](newSetValue.current)) {
							newSetValue.current = match[1]({
								value: newSetValue,
								publicSetState: extPublicSetState,
								id,
							});
						}
					}
				} catch {}
			} else {
				if (useStateRes[1] !== globalState[id][4][1]) {
					globalState[id][4] = useStateRes;
				}
			}

			react.useEffect(
				() => () => {
					try {
						const currentValue = globalState[id][0].current;
						delete globalState[id];

						for (const match of matchesStateFns) {
							if (match[2] && match[0](currentValue)) {
								match[2](id);
							}
						}
					} catch {}
				},
				[],
			);

			return [useStateRes[0], sitePublicSetState];
		},
		"useState",
	);
}

export type HijackStateProps<T> = {
	matches: MatchesStateFn<T>[0];
	setState: MatchesStateFn<T>[1];
	onStateRemoved?: MatchesStateFn<T>[2];
	initializeOnce?: boolean;
	stackOthers?: boolean;
	onlyFromSiteUpdate?: boolean;
};

export function hijackState<T>({
	matches,
	setState,
	onStateRemoved,
	initializeOnce,
	stackOthers,
	onlyFromSiteUpdate,
}: HijackStateProps<T>) {
	const match = [
		matches,
		(data) => {
			// @ts-expect-error: Fine
			return setState({
				...data,
				publicSetState: (newData) => {
					return data.publicSetState(newData, stackOthers ? match : undefined);
				},
			});
		},
		onStateRemoved,
		onlyFromSiteUpdate,
	] as MatchesStateFn;
	matchesStateFns.add(match);

	for (const [id, [state, , publicSetState]] of Object.entries(globalState).reverse()) {
		if (matches(state.current)) {
			publicSetState(
				setState({
					value: state as { current: T },
					publicSetState: (data) => {
						return publicSetState(data, stackOthers ? match : undefined);
					},
					id: Number.parseInt(id, 10),
				}),
			);

			if (initializeOnce) break;
		}
	}

	return () => {
		matchesStateFns.delete(match);
	};
}

type CreateElementProps<T extends HTMLElement> = Parameters<
	typeof globalThis.React.createElement<T>
>;

type AnyCreateElementProps = [
	type: string | ComponentType,
	props?: JSX.HTMLAttributes | null,
	...children: unknown[],
];

export type MatchesCreateElementFn<T extends HTMLElement> = [
	(
		type: CreateElementProps<T>[0],
		props: CreateElementProps<T>[1],
		...children: CreateElementProps<T>[2][]
	) => boolean,
	(
		create: typeof globalThis.React.createElement,
		type: AnyCreateElementProps[0],
		props?: AnyCreateElementProps[1],
		...children: AnyCreateElementProps[2][]
	) => void | unknown | null,
];

const matchesCreateElementFns = new Set<MatchesCreateElementFn<HTMLElement>>();

export function setupHijackCreateElement(react: typeof window.React, prop: "createElement") {
	// @ts-expect-error: Frankly, I do not care.
	const createElement: typeof react.createElement = (type, props, ...args) => {
		if (props) {
			props.fromRoSeal = true;
		}

		return _createElement(type, props!, ...args);
	};

	const _createElement = hijackFunction(
		react,
		(target, thisArg, args) => {
			if (args[1] && "fromRoSeal" in args[1]) {
				return target.apply(thisArg, args);
			}

			let finalValue: ReturnType<typeof target> | undefined;
			try {
				for (const match of matchesCreateElementFns) {
					// @ts-expect-error: Fine
					if (match[0](...args)) {
						const returnValue = match[1](createElement, ...args);

						if (returnValue !== undefined) {
							// @ts-expect-error: Fine
							finalValue = returnValue;
						}
					}
				}
			} catch {}

			if (finalValue !== undefined) {
				return finalValue;
			}

			return target.apply(thisArg, args);
		},
		prop,
	);
}

export function hijackCreateElement<T extends HTMLElement>(
	matches: MatchesCreateElementFn<T>[0],
	handle: MatchesCreateElementFn<T>[1],
) {
	const match = [matches, handle] as MatchesCreateElementFn<HTMLElement>;
	matchesCreateElementFns.add(match);

	return () => {
		matchesCreateElementFns.delete(match);
	};
}

if (import.meta.env.ENV === "inject" && !currentUrl.value.siteType?.isNextJS) {
	if (window.React) {
		error(
			"React shouldn't exist yet. RoSeal requires the content script to be run first. This will cause issues.",
		);
	} else {
		onSet(window, "React").then((react) => {
			setupHijackState(react);
			setupHijackCreateElement(react, "createElement");
		});
		onSet(window, "ReactJSX").then((reactJsx) => {
			setupHijackCreateElement(reactJsx, "jsx" as "createElement");
			setupHijackCreateElement(reactJsx, "jsxs" as "createElement");
		});
		onSet(window, "ReactDOM", undefined, true).then((reactDom) => {
			setupHijackComponent(reactDom);
		});
	}
}
