import type { TimeFormatType, timeTargets, timeTypes } from "src/ts/helpers/features/featuresData";
import { _getTimeFunction } from "../../helpers/i18n/intlFormats";
import useFeatureValue from "./useFeatureValue";

export default function useTime(
	target: (typeof timeTargets)[number],
	type: (typeof timeTypes)[number] = "time",
	useShort?: boolean,
) {
	const [timeData, setTimeData] = useFeatureValue(`times.${target}.${type}`, [false, "regular"]);
	const timeType = timeData?.[0] ? timeData?.[1] : undefined;

	return [
		_getTimeFunction(timeType, useShort),
		timeType,
		(value: TimeFormatType["value"]) => setTimeData([timeData?.[0] ?? false, value]),
	] as const;
}
