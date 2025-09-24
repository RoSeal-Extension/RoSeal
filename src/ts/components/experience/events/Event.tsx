import classNames from "classnames";
import { useMemo, useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { abbreviateNumber } from "src/ts/helpers/i18n/intlFormats";
import {
	getExperienceEventRSVPCounters,
	type ExperienceEvent as ExperienceEventProps,
} from "src/ts/helpers/requests/services/universes";
import { getEventLink } from "src/ts/utils/links";
import Thumbnail from "../../core/Thumbnail";
import usePromise from "../../hooks/usePromise";
import { getFormattedDuration } from "../../utils/getFormattedDuration";

export default function ExperienceEvent({
	id,
	title,
	displayTitle,
	subtitle,
	displaySubtitle,
	placeId,
	thumbnails,
	eventTime,
}: ExperienceEventProps) {
	const sinceDuration = useMemo(
		() => getFormattedDuration(new Date(eventTime.endUtc), new Date()),
		[eventTime],
	);

	const [went] = usePromise(
		() =>
			getExperienceEventRSVPCounters({
				eventId: id,
			}).then((data) => data.counters.going),
		[id],
	);
	const [focused, isFocused] = useState(false);

	const mediaId = useMemo(() => {
		let mediaId: number | undefined;
		let rank: number | undefined;

		if (thumbnails)
			for (const thumbnail of thumbnails) {
				if (rank === undefined || thumbnail.rank < rank) {
					mediaId = thumbnail.mediaId;
					rank = thumbnail.rank;
				}
			}

		return mediaId;
	}, [thumbnails]);

	return (
		<li
			className={classNames(
				"list-item hover-game-tile experience-events-tile image-overlay contained-tile",
				{ focused },
			)}
			onMouseEnter={() => isFocused(true)}
			onMouseLeave={() => isFocused(false)}
			id={id}
		>
			<div className="featured-game-container game-card-container">
				<a className="game-card-link" href={getEventLink(id)}>
					<div className="featured-game-icon-container">
						<Thumbnail
							containerClassName="brief-game-icon"
							request={
								mediaId
									? {
											targetId: mediaId,
											type: "Asset",
											size: "768x432",
										}
									: {
											targetId: placeId,
											type: "GameThumbnail",
											size: "768x432",
										}
							}
						/>
						<div className="game-card-text-pill">
							<div className="game-card-info">
								{getMessage("experience.events.past.item.timeAgo", {
									time: sinceDuration,
								})}
							</div>
						</div>
					</div>
					<div className="info-container">
						<div className="info-metadata-container">
							<div
								className="game-card-name game-name-title"
								title={displayTitle ?? title}
							>
								{displayTitle ?? title}
							</div>
							<div className="wide-game-tile-metadata">
								<div className="base-metadata">
									<div className="game-card-info">
										<span className="info-label">
											{displaySubtitle ?? subtitle}
										</span>
									</div>
									{!!went && (
										<div className="info-label rsvps-count">
											{getMessage("experience.events.past.item.signedUp", {
												count: abbreviateNumber(went),
											})}
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</a>
			</div>
		</li>
	);
}
