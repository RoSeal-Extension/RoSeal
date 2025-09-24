import { getFeatureValue } from "../helpers/features/helpers";
import { _getTimeFunction } from "../helpers/i18n/intlFormats";
import type { timeTargets, timeTypes } from "src/ts/helpers/features/featuresData";

export function getTimeFunction(
	target: (typeof timeTargets)[number],
	type: (typeof timeTypes)[number] = "time",
	useShort?: boolean,
) {
	return getFeatureValue(`times.${target}.${type}`).then((value) => {
		if (!value?.[0]) {
			return;
		}

		return _getTimeFunction(value[1], useShort);
	});
}

export function getSecondsSinceMidnight() {
	const now = new Date();
	const hours = now.getHours();
	const minutes = now.getMinutes();
	const seconds = now.getSeconds();

	return hours * 3600 + minutes * 60 + seconds;
}
