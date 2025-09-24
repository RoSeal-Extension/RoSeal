import { useMemo } from "preact/hooks";
import type { CreatorBan } from "src/ts/helpers/requests/services/join";
import useCountdown from "../hooks/useCountdown";
import Icon from "../core/Icon";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import Tooltip from "../core/Tooltip";

export default function BannedPlayButton({
	durationSeconds,
	startTime,
	displayReason,
}: CreatorBan) {
	const toDate = useMemo(
		() =>
			durationSeconds ? new Date(Date.parse(startTime) + durationSeconds * 1000) : undefined,
		[durationSeconds],
	);
	const countdown = useCountdown(toDate);

	return (
		<>
			{!countdown?.[1] && (
				<Tooltip
					containerId="experience-banned-play-button"
					containerClassName="experience-red-play-button"
					id="experience-banned-tooltip-container"
					includeContainerClassName={false}
					as="div"
					placement="top"
					trigger={["hover", "focus"]}
					button={
						<button
							type="button"
							className="btn-common-play-game-lg btn-alert-md btn-full-width"
							data-testid="play-button"
						>
							<Icon as="div" name="status-unavailable" />
							<span className="btn-text">
								{getMessage("experience.playButton.banned")}
							</span>
						</button>
					}
				>
					<div className="experience-banned-tooltip">
						<div className="ban-text text">
							{getMessage("experience.bannedPopup.text", {
								hasDuration: !!durationSeconds,
								hasReason: !!displayReason,
								duration: countdown?.[0],
							})}
						</div>
						{displayReason && (
							<div className="creator-ban-text text">{displayReason}</div>
						)}
					</div>
				</Tooltip>
			)}
		</>
	);
}
