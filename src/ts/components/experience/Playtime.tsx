import { useMemo } from "preact/hooks";
import usePromise from "src/ts/components/hooks/usePromise";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getFormattedDuration } from "../utils/getFormattedDuration";
import { getTopWeeklyScreentimeByUniverse } from "src/ts/helpers/requests/services/account";

export type ExperiencePlaytimeProps = {
	universeId: number;
	placeId: number;
};

export default function ExperiencePlaytime({ universeId }: ExperiencePlaytimeProps) {
	const [data, fetched] = usePromise(() =>
		Promise.all([
			getTopWeeklyScreentimeByUniverse().then((data) =>
				data.universeWeeklyScreentimes.find((item) => item.universeId === universeId),
			),
		]).then(([playtime7d]) => {
			const _7d = (playtime7d?.weeklyMinutes ?? 0) * 60;

			return {
				_7d,
			};
		}),
	);

	const time = useMemo(() => {
		if (!data) {
			return;
		}

		const last7d = data._7d ?? 0;

		if (!last7d) {
			return;
		}
		const end = new Date();

		const is7dAvailable = last7d > 0;

		const start = end.getTime() - last7d * 1000;

		return {
			formatted: getFormattedDuration(new Date(start), end),

			canChange: false,
			availableOptions: {
				7: is7dAvailable,
			},
		};
	}, [data]);

	return (
		<>
			{(time || !fetched) && (
				<div className="universe-playtime">
					{getMessage("experience.playtime.label", {
						textLabel: (contents: string) => <span className="text">{contents}</span>,
						time: <span className="text-emphasis">{time?.formatted || "..."}</span>,
						daysDropdown: (
							<span className="text">
								{getMessage("experience.playtime.times.7")}
							</span>
						),
					})}
				</div>
			)}
		</>
	);
}
