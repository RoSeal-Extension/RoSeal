import { isAfter } from "date-fns";
import { useMemo } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import type { ExperienceEvent } from "src/ts/helpers/requests/services/universes";
import { getEventLink } from "src/ts/utils/links";
import Thumbnail from "../core/Thumbnail";

export type ShowcaseExperienceEventProps = {
	event: ExperienceEvent;
};

export default function ShowcaseExperienceEvent({ event }: ShowcaseExperienceEventProps) {
	const mediaId = useMemo(() => {
		let mediaId: number | undefined;
		let rank: number | undefined;

		if (event.thumbnails)
			for (const thumbnail of event.thumbnails) {
				if (rank === undefined || thumbnail.rank < rank) {
					mediaId = thumbnail.mediaId;
					rank = thumbnail.rank;
				}
			}

		return mediaId;
	}, [event.thumbnails]);

	const displaySubtitle = useMemo(() => {
		const isStarted = isAfter(new Date(), event.eventTime.startUtc);
		if (isStarted) {
			return getMessage("navigation.events.item.subtitle.happeningNow");
		}

		if (event.eventCategories?.[0]) {
			return getMessage(
				`navigation.events.item.subtitle.${event.eventCategories[0].category}`,
			);
		}
	}, [event.eventCategories, event.eventTime.startUtc]);

	return (
		<li key={event.id} className="event-container">
			<a href={getEventLink(event.id)} className="event-item">
				<Thumbnail
					altText={event.displayTitle ?? event.title}
					request={
						mediaId
							? {
									targetId: mediaId,
									type: "Asset",
									size: "768x432",
								}
							: {
									targetId: event.placeId,
									type: "GameThumbnail",
									size: "768x432",
								}
					}
				/>
				{displaySubtitle !== undefined && (
					<div className="event-item-subtitle">{displaySubtitle}</div>
				)}
			</a>
		</li>
	);
}
