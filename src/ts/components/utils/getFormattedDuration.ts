import { intervalToDuration } from "date-fns";
import { getDurationFormat } from "src/ts/helpers/i18n/intlFormats.main";

export function getFormattedDuration(fromDate: Date, toDate?: Date) {
	const duration = intervalToDuration({
		start: fromDate.getTime(),
		end: (toDate ?? new Date()).getTime(),
	});

	if (duration.days) {
		duration.seconds = 0;
	}

	if (duration.months) {
		duration.minutes = 0;
	}

	if (duration.years) {
		duration.hours = 0;
	}

	return getDurationFormat().format({
		days: Math.trunc(Math.max(duration.days || 0, 0)),
		hours: Math.trunc(Math.max(duration.hours || 0, 0)),
		minutes: Math.trunc(Math.max(duration.minutes || 0, 0)),
		seconds: Math.trunc(Math.max(duration.seconds || 0, 0)),
		months: Math.trunc(Math.max(duration.months || 0, 0)),
		years: Math.trunc(Math.max(duration.years || 0, 0)),
	});
}
