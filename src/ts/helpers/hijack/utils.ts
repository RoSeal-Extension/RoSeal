export const hijackedSymbol = Symbol("hijacked");

// Better ProxyHandler
export type ProxyHandler<T extends AnyFunction, U = ThisParameterType<T>> = {
	apply: (target: T, thisArg: U, args: Parameters<T>) => ReturnType<T>;
};

function checkFn<
	T extends (() => void) & {
		__hijacked?: (typeof hijackedSymbol)[];
		__sentry_original__?: T;
	},
>(value: T): boolean {
	if ("__hijacked" in value && value.__hijacked?.includes(hijackedSymbol)) {
		return true;
	}

	if ("__sentry_original__" in value) {
		return checkFn(value.__sentry_original__!);
	}

	return false;
}

export function hijackFunction<T extends AnyFunction>(
	fnOrObject: T,
	apply: ProxyHandler<Exclude<T, undefined>>["apply"],
	key: void,
): Exclude<T, undefined>;
/* copy of the initial signature because frick typescript */
export function hijackFunction<
	// biome-ignore lint/suspicious/noExplicitAny: Need to have `any` here
	T extends Record<string | number | symbol, any>,
	U extends keyof T,
>(
	fnOrObject: T,
	apply: ProxyHandler<Exclude<T[U], undefined>, T>["apply"],
	key: U,
	onlyOnce?: boolean,
): Exclude<T[U], undefined>;
/* end of copy of the initial signature because frick typescript */
export function hijackFunction<
	// biome-ignore lint/suspicious/noExplicitAny: Need to have `any` here
	T extends Record<string | number | symbol, any>,
	U extends keyof T,
>(
	fnOrObject: T,
	apply: ProxyHandler<Exclude<T[U], undefined>, T>["apply"],
	key: U,
	always?: boolean,
): Exclude<T[U], undefined> {
	if (typeof fnOrObject === "function" && !key) {
		return new Proxy(fnOrObject, {
			apply,
		}) as Exclude<T[U], undefined>;
	}

	const _original = fnOrObject[key];
	let setValue = new Proxy(fnOrObject[key], {
		apply,
	});

	if (always) {
		Object.defineProperty(fnOrObject, key, {
			configurable: true,
			set: (set) => {
				setValue = new Proxy(set, {
					apply,
				});
			},
			get: () => setValue,
		});
	} else {
		fnOrObject[key] = setValue;
	}

	return _original;
}

let isHijacking = false;

// We actually define the .set property before/after extensions like BTRoblox
// so we need to hijack defineProperty so BTRoblox, RoSeal and other extensions respect the old value
if (String(Object.defineProperty).includes("[native code]")) {
	hijackFunction(
		Object,
		(target, thisArg, args) => {
			const [o, p, attributes] = args as [object, PropertyKey, PropertyDescriptor];

			// 1. Prevent re-entrancy loops and self-referential defineProperty hijacking
			if (isHijacking || !attributes || p === "defineProperty") {
				return target.apply(thisArg, args);
			}

			isHijacking = true;

			try {
				const oldDescriptor = Object.getOwnPropertyDescriptor(o, p);
				const newAttributes: PropertyDescriptor = { ...attributes };

				const shouldRespectOld = p !== "onClick" && p !== "onClickCapture";

				if (shouldRespectOld && oldDescriptor) {
					// Handle Getters: Preserve return value of new getter while safely invoking old getter
					if (
						typeof attributes.get === "function" &&
						typeof oldDescriptor.get === "function"
					) {
						const oldGet = oldDescriptor.get;
						const newGet = attributes.get;

						newAttributes.get = function (this: unknown) {
							try {
								oldGet.apply(this);
							} catch {
								/* empty */
							}
							return newGet.apply(this);
						};
					}

					// Handle Setters: Call old setter then new setter
					if (
						typeof attributes.set === "function" &&
						typeof oldDescriptor.set === "function"
					) {
						const oldSet = oldDescriptor.set;
						const newSet = attributes.set;

						newAttributes.set = function (this: unknown, value: unknown) {
							try {
								oldSet.call(this, value);
							} catch {
								/* empty */
							}
							try {
								return newSet.call(this, value);
							} catch {
								/* empty */
							}
						};
					}
				}

				return target.apply(thisArg, [o, p, newAttributes]);
			} finally {
				isHijacking = false;
			}
		},
		"defineProperty",
	);
}

/*
if (String(Object.defineProperties).includes("[native code]")) {
	hijackFunction(
		Object,
		(_, __, [o, properties]) => {
			for (const property in properties) {
				Object.defineProperty(o, property, properties[property]);
			}

			return o;
		},
		"defineProperties",
	);
}*/

export function onSetCb<
	ObjectType extends Record<never, unknown> = Record<string | number | symbol, unknown>,
	PropertyType extends keyof ObjectType = keyof ObjectType,
>(object: ObjectType, property: PropertyType, callback: (value: ObjectType[PropertyType]) => void) {
	let value = object[property];

	Object.defineProperty(object, property, {
		configurable: true,
		set(newValue: ObjectType[PropertyType]) {
			value = newValue;
			callback(value);
		},
		get: () => value,
	});
}

export function onSet<
	ObjectType extends Record<never, unknown> = Record<string | number | symbol, unknown>,
	PropertyType extends keyof ObjectType = keyof ObjectType,
>(
	object: ObjectType,
	property: PropertyType,
	nextSet?: boolean,
	doNotSet?: boolean,
): Promise<ObjectType[PropertyType]> {
	return new Promise((resolve) => {
		if (!nextSet && object[property] !== undefined) return resolve(object[property]);

		const properties: Record<string, unknown> = {
			enumerable: false,
			configurable: true,
			set(value: ObjectType[PropertyType]) {
				delete object[property];
				if (!doNotSet) object[property] = value;

				resolve(value);
			},
		};

		if (nextSet) {
			const oldValue = object[property];
			properties.get = () => oldValue;
		}

		Object.defineProperty(object, property, properties);
	});
}

export function multiOnSet<
	ObjectType extends Record<never, unknown> = Record<string | number | symbol, unknown>,
	PropertyType extends keyof ObjectType = keyof ObjectType,
>(object: ObjectType, properties: PropertyType[]): Promise<Pick<ObjectType, PropertyType>> {
	const promises = properties.map((property) =>
		onSet(object, property).then((value) => [property, value] as const),
	);

	return Promise.all(promises).then((values) => {
		const result: Pick<ObjectType, PropertyType> = {} as Pick<ObjectType, PropertyType>;
		for (const [property, value] of values) {
			result[property] = value;
		}

		return result;
	});
}
