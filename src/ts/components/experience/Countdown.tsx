import classNames from "classnames";
import { useEffect, useMemo, useState } from "preact/hooks";
import { RESTRICTED_PLAYABILITY_STATUSES } from "src/ts/constants/experiences.ts";
import { sendMessage } from "src/ts/helpers/communication/dom.ts";
import { hideEl, watchOnce } from "src/ts/helpers/elements.ts";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getAbsoluteTime } from "src/ts/helpers/i18n/intlFormats";
import { getRoSealExperienceCountdown } from "src/ts/helpers/requests/services/roseal";
import {
	type ExperienceEvent,
	listExperienceEvents,
	multigetUniversesPlayabilityStatuses,
} from "src/ts/helpers/requests/services/universes";
import { getEventLink } from "src/ts/utils/links";
import { crossSort } from "src/ts/utils/objects.ts";
import Icon from "../core/Icon.tsx";
import Tooltip from "../core/Tooltip.tsx";
import useCountdown from "../hooks/useCountdown";
import usePromise from "../hooks/usePromise";

export type ExperienceCountdownProps = {
	universeId: number;
};

export default function ExperienceCountdown({ universeId }: ExperienceCountdownProps) {
	const [countdown] = usePromise(
		() =>
			getRoSealExperienceCountdown({
				universeId,
			})
				.then(async (data) => {
					if (data) {
						return data;
					}
					const status = (
						await multigetUniversesPlayabilityStatuses({
							universeIds: [universeId],
						})
					)[0];

					if (
						status.isPlayable ||
						RESTRICTED_PLAYABILITY_STATUSES.includes(status.playabilityStatus)
					) {
						return;
					}

					const allEvents: ExperienceEvent[] = [];
					const fromUtc = new Date().toISOString();
					let cursor: string | undefined;

					while (cursor !== "") {
						const data = await listExperienceEvents({
							universeId,
							endsAfter: fromUtc,
							visibility: "public",
						});

						allEvents.push(...data.data);
						cursor = data.nextPageCursor;
					}

					crossSort(
						allEvents,
						(a, b) =>
							new Date(a.eventTime.startUtc).getTime() -
							new Date(b.eventTime.startUtc).getTime(),
					);

					const event = allEvents[0];
					return (
						event &&
						({
							universeId,
							type: "Unknown",
							time: event.eventTime.startUtc,
							name: event.title ?? event.displayTitle,
							nameLink: getEventLink(event.id),
							byPlayable: true,
						} as const)
					);
				})
				.then(async (data) => {
					if (!data) {
						return;
					}

					const promise = watchOnce(
						"#game-details-play-button-container > .error-message",
					).then((el) => {
						hideEl(el);
						sendMessage("experience.unmountPlayButton", undefined);
					});
					if (data.type === "Release" || data.byPlayable) {
						await promise;
					}

					return data;
				}),
		[universeId],
	);

	const currentDate = new Date();
	const date = useMemo(() => countdown && new Date(countdown.time), [countdown?.time]);
	const untilCountdown = useCountdown(date);
	const [released, setReleased] = useState(false);

	const showSoon = useMemo(
		() => date && date.getTime() - currentDate.getTime() < 1000,
		[date, currentDate.getTime()],
	);

	useEffect(() => {
		if (!countdown || !date) {
			return;
		}
		setReleased(false);

		let lastState: undefined | boolean;

		const checkPlayability = () => {
			multigetUniversesPlayabilityStatuses({
				universeIds: [universeId],
				overrideCache: true,
			}).then((data) => {
				const item = data?.[0];
				if (!item) {
					return;
				}

				if (
					(item.isPlayable ||
						RESTRICTED_PLAYABILITY_STATUSES.includes(item.playabilityStatus)) &&
					(countdown.type === "Release" || countdown.byPlayable || new Date() >= date)
				) {
					setReleased(true);
					sendMessage("experience.renderPlayButton", undefined);
					clearInterval(timer);
				} else if (
					!item.isPlayable &&
					countdown.type !== "Release" &&
					!countdown.byPlayable &&
					lastState !== item.isPlayable
				) {
					sendMessage("experience.unmountPlayButton", undefined);
				}

				lastState = item.isPlayable;
			});
		};
		const timer = setInterval(checkPlayability, 1_000);
		checkPlayability();

		return () => clearInterval(timer);
	}, [countdown, date]);

	if (released || !countdown || !date) {
		return <></>;
	}

	return (
		<div id="experience-countdown">
			{countdown.name && (
				<div className="countdown-name">
					{countdown.nameLink ? (
						<a href={countdown.nameLink} className="text-name">
							{countdown.name}
						</a>
					) : (
						countdown.name
					)}
				</div>
			)}
			<div
				className={classNames("countdown-details-container", {
					"no-name": !countdown.name,
				})}
			>
				<Icon name="clock" />
				<div className="countdown-details">
					{getMessage(
						`experience.countdown.${countdown.type.toLowerCase() as "release" | "update" | "unknown"}`,
						{
							isSoon: showSoon,
							timeDuration: untilCountdown,
							label: (contents: string) => (
								<span className="countdown-label text">{contents}</span>
							),
							time: (contents: string) => (
								<Tooltip
									includeContainerClassName={false}
									button={<span>{contents}</span>}
									containerClassName="countdown-time"
								>
									{getAbsoluteTime(date)}
								</Tooltip>
							),
						},
					)}
				</div>
			</div>
		</div>
	);
}
