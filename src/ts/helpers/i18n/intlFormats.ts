import type { timeFormatTypes } from "../features/featuresData";
import { locales } from "./locales";

export const languageNamesFormat = new Intl.DisplayNames(locales, {
	type: "language",
});
export const regionNamesFormat = new Intl.DisplayNames(locales, {
	type: "region",
});
export const relativeTimeFormat = new Intl.RelativeTimeFormat(locales, {
	style: "long",
});
export const ordinalsFormat = new Intl.PluralRules(locales, {
	type: "ordinal",
});
export const currencyNamesFormat = new Intl.DisplayNames(locales, { type: "currency" });

export const unitListFormat = new Intl.ListFormat(locales, { style: "short", type: "unit" });

export const distanceFormat = new Intl.NumberFormat(locales, {
	style: "unit",
	unit: "kilometer",
	unitDisplay: "short",
});

const units: [Intl.RelativeTimeFormatUnit, number][] = [
	["year", 31536000000],
	["month", 2628000000],
	["day", 86400000],
	["hour", 3600000],
	["minute", 60000],
	["second", 1000],
];

export function getShortRelativeTime(date: Date | string | number): string {
	const elapsed = (date instanceof Date ? date : new Date(date)).getTime() - Date.now();

	const unit = units.find(([unit, amount]) => Math.abs(elapsed) >= amount || unit === "second");
	if (!unit) return "NaN";

	return relativeTimeFormat.format(Math.trunc(elapsed / unit[1]), unit[0]);
}

export function getShortTime(date: Date | string | number): string {
	return (date instanceof Date ? date : new Date(date)).toLocaleDateString(locales, {
		year: "numeric",
		month: "numeric",
		day: "numeric",
	});
}

export function getAbsoluteTime(date: Date | string | number): string {
	return (date instanceof Date ? date : new Date(date)).toLocaleDateString(locales, {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		second: "2-digit",
	});
}

export function getRegularTime(date: Date | string | number): string {
	return (date instanceof Date ? date : new Date(date)).toLocaleDateString(locales, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

export function getHourAndMinute(date: Date | string | number): string {
	return (date instanceof Date ? date : new Date(date)).toLocaleTimeString(locales, {
		hour: "numeric",
		minute: "2-digit",
		second: "2-digit",
	});
}

export function _getTimeFunction(
	timeType?: (typeof timeFormatTypes)[number]["value"],
	useShort?: boolean,
): (time: Date | string | number) => string {
	if (timeType === "absolute") {
		return getAbsoluteTime;
	}
	if (timeType === "relative") {
		return getShortRelativeTime;
	}

	if (useShort) {
		return getShortTime;
	}

	return getRegularTime;
}

export function asLocaleString<T extends string | number | Date | boolean>(
	value?: T,
	options?: T extends number ? Intl.NumberFormatOptions : Intl.DateTimeFormatOptions,
) {
	if (import.meta.env.ENV === "background") {
		return value?.toString() ?? "";
	}

	return value?.toLocaleString(locales, options) ?? "";
}

export function localeCompare(a: string, b: string) {
	return a.localeCompare(b, locales);
}

export function asLocaleUpperCase(value: string) {
	return value.toLocaleUpperCase(locales);
}

export function asLocaleLowerCase(value: string) {
	return value.toLocaleLowerCase(locales);
}

export function abbreviateNumber(number: number, after?: number, maximumFractionDigits = 1) {
	return asLocaleString(
		number,
		!after || number > after
			? {
					notation: "compact",
					roundingMode: "floor",
					maximumFractionDigits,
				}
			: undefined,
	);
}
