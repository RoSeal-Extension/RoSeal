import { type TimeFormatType, timeFormatTypes } from "src/ts/helpers/features/featuresData";

export function handleTimeSwitch(
	timeType: TimeFormatType["value"] | undefined,
	setTimeType: (timeType: TimeFormatType["value"]) => void,
) {
	const index = timeFormatTypes.findIndex((item) => item.value === timeType);

	setTimeType(timeFormatTypes.at((index + 1) % timeFormatTypes.length)!.value);
}
