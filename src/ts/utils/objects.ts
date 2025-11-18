export type FilterObject<T extends Record<string, unknown>> = {
	[key in keyof T]: T[key] extends null | undefined ? never : T[key];
};

export function filterObject<T extends Record<string, unknown>>(obj: T): FilterObject<T> {
	const newObj = {} as FilterObject<T>;
	for (const key in obj) {
		if (obj[key] !== null && obj[key] !== undefined) {
			// @ts-expect-error: fine
			newObj[key] = obj[key];
		}
	}

	return newObj;
}

export function chunk<T>(arr: T[], len?: number): T[][] {
	if (!len) {
		return [arr];
	}
	const chunks = [];

	let i = 0;
	const n = arr.length;
	while (i < n) {
		// biome-ignore lint/suspicious/noAssignInExpressions: Don't want another line.
		chunks.push(arr.slice(i, (i += len)));
	}
	return chunks;
}

export function shuffleArray<T>(array: T[]): T[] {
	const shuffledArray = [...array]; // Create a copy to avoid modifying the original array
	for (let i = shuffledArray.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]]; // Swap elements
	}

	return shuffledArray;
}

function camelCaseString(str: string): string {
	let newStr = "";
	for (let index = 0; index < str.length; index++) {
		const character = str[index];

		if (character === " " || (character === "_" && index !== 0) || character === "-") continue;
		if (index === 0) {
			newStr += character.toLowerCase();
			continue;
		}

		const previousCharacter = str[index - 1];
		if (previousCharacter === " " || previousCharacter === "_" || previousCharacter === "-") {
			newStr += character.toUpperCase();
			continue;
		}

		newStr += character;
	}

	return newStr;
}

// Ported from "https://github.com/sindresorhus/camelcase-keys/blob/main/index.js"
function isObject(value: unknown): value is object {
	return (
		typeof value === "object" &&
		value !== null &&
		!(value instanceof RegExp) &&
		!(value instanceof Error) &&
		!(value instanceof Date)
	);
}

const cache = new Map<string, string>();

export function snakeizeObject<T>(input: T, options?: { deep: boolean }): T {
	if (typeof input !== "object" || !input) return input;

	const newObj: Record<string | number, unknown> = {};

	if (Array.isArray(input)) {
		if (options?.deep) {
			return input.map((item) => snakeizeObject(item, options)) as T;
		}

		return input;
	}

	for (const key in input) {
		const newKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
		const value = input[key as keyof typeof input];
		const newValue = options?.deep ? snakeizeObject(value, options) : value;

		newObj[newKey] = newValue;
	}

	return newObj as T;
}

export function camelizeObject(
	input: unknown,
	options: {
		deep: boolean;
		pascalCase: boolean;
		exclude?: string[];
		stopPaths?: string[];
	} = { deep: false, pascalCase: false },
) {
	if (!isObject(input)) {
		return input;
	}

	const { exclude, pascalCase, stopPaths, deep } = options;

	const stopPathsSet = new Set(stopPaths);

	const makeMapper = (parentPath?: string) => (_key: string | number, _value: unknown) => {
		let value = _value;
		let key = _key;

		if (deep && isObject(value)) {
			const path = parentPath === undefined ? key.toString() : `${parentPath}.${key}`;

			if (Array.isArray(value)) {
				const valueToSet: unknown[] = [];
				for (const index in value) {
					const [newIndex, newValue] = makeMapper(path)(index, value[index]);
					valueToSet[newIndex as number] = newValue;
				}

				value = valueToSet;
			} else if (!stopPathsSet.has(path)) {
				// biome-ignore lint/suspicious/noExplicitAny: compatibility, previously used Object.fromEntries
				const obj: any = {};
				for (const key in value) {
					const [newIndex, newValue] = makeMapper(path)(
						key,
						value[key as keyof typeof input],
					);

					const oldValue = obj[newIndex as string];
					if (newValue === null && oldValue !== null && oldValue !== undefined) {
						continue;
					}

					obj[newIndex as string] = newValue;
				}

				value = obj;
			}
		}

		if (!Number.isInteger(key) && !exclude?.includes(key as string)) {
			const cacheKey = pascalCase ? `${key}_` : key;

			if (cache.has(cacheKey as string)) {
				key = cache.get(cacheKey as string)!;
			} else {
				const returnValue = camelCaseString(key as string);

				if ((key as string).length < 100) {
					// Prevent abuse
					cache.set(cacheKey as string, returnValue);
				}

				key = returnValue;
			}
		}

		return [key, value];
	};

	if (Array.isArray(input)) {
		const output: unknown[] = [];
		for (const index in input) {
			const [newIndex, newValue] = makeMapper(undefined)(index, input[index]);
			output[newIndex as number] = newValue;
		}

		return output;
	}

	// biome-ignore lint/suspicious/noExplicitAny: compatibility, previously used Object.fromEntries
	const obj: any = {};
	for (const key in input) {
		const [index, value] = makeMapper(undefined)(key, input[key as keyof typeof input]);
		obj[index as string] = value;
	}

	return obj;
}

export function getByTarget(targetLocation: string[]) {
	// biome-ignore lint/suspicious/noExplicitAny: No.
	let target: any = window;
	for (const index of targetLocation) {
		target = target?.[index];
		if (!target) return;
	}
	return target;
}

export function crossSort<T>(array: T[], sortFunc: (a: T, b: T) => number) {
	if (import.meta.env.TARGET_BASE !== "firefox") {
		return array.sort(sortFunc);
	}

	// @ts-expect-error: This is fine. Need this on Firefox ONLY.
	return array.sort((a, b) => {
		const result = sortFunc(a, b);

		return result >= 1;
	});
}

export function compareArrays<T>(a: T[], b: T[]) {
	return a.length === b.length && a.every((v) => b.includes(v));
}
