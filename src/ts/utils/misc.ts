import { storage } from "../helpers/storage";

export function sleep(timeInMs: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, timeInMs);
	});
}

export function replaceAll(str: string, search: string | RegExp, replace: string) {
	if (str.match(search)) {
		return replaceAll(str.replaceAll(search, replace), search, replace);
	}

	return str;
}

export function stripHTML(str: string) {
	return replaceAll(str, /<(\w+)([^>]*)>(.*?)<\/\1>/g, "$3");
}

const DELAY_PREFIX = "delay.";

export function getDelayKey(name: string) {
	return `${DELAY_PREFIX}${name}`;
}

export function delay(
	name: string,
	delayInMs: number,
	handleValue: (
		handle: boolean,
	) => undefined | void | boolean | Promise<boolean | void | undefined>,
) {
	const key = getDelayKey(name);
	storage.get(key).then((data) => {
		if (!data[key] || delayInMs <= Date.now() - data[key]) {
			const returnValue = handleValue(true);

			if (returnValue instanceof Promise) {
				returnValue.then((value) => {
					if (value !== false) {
						storage.set({
							[key]: Date.now(),
						});
					} else {
						storage.remove(key);
					}
				});
			} else if (returnValue !== false) {
				storage.set({
					[key]: Date.now(),
				});
			} else {
				storage.remove(key);
			}
		} else {
			handleValue(false);
		}
	});
}

export function clamp(num: number, min: number, max: number) {
	return Math.min(Math.max(num, min), max);
}

export function getInBetweenNumber(one: number, two: number) {
	return (one + two) / 2;
}

export function toFixedNumber(num: number, digits: number, base = 10) {
	const pow = base ** digits;
	return Math.round(num * pow) / pow;
}

export function getProgress(num: number, min: number, max: number) {
	return (num - min) / (max - min);
}

export const INT32_MAX = 0x7fffffff; // 2147483647
export const INT32_MIN = -0x80000000; // -2147483648
