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
		});
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

// We actually define the .set property before/after extensions like BTRoblox
// so we need to hijack defineProperty so BTRoblox, RoSeal and other extensions respect the old value
if (String(Object.defineProperty).includes("[native code]")) {
	hijackFunction(
		Object,
		(target, thisArg, [o, p, attributes]) => {
			const oldDescriptor = Object.getOwnPropertyDescriptor(o, p);
			const newAttributes: typeof attributes = {};

			const shouldRespectOld = p !== "onClick" && p !== "onClickCapture";

			for (const [key, fn] of Object.entries(attributes)) {
				if (typeof fn === "function" && shouldRespectOld) {
					const oldFn = oldDescriptor?.[key as keyof PropertyDescriptor];
					if (oldFn && typeof oldFn === "function") {
						newAttributes[key as keyof typeof attributes] = function (
							this: unknown,
							...value: unknown[]
						) {
							try {
								oldFn.apply(this, value);
							} catch {
								/* empty */
							}

							try {
								return fn.apply(this, value);
							} catch {
								/* empty */
							}
						};

						continue;
					}
				}

				newAttributes[key as keyof typeof attributes] = fn;
			}

			return target.apply(thisArg, [o, p, newAttributes]);
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
