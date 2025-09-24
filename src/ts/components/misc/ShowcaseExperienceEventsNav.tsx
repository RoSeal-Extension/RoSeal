import { useMemo, useState } from "preact/hooks";
import { UPCOMING_FOLLOWED_EVENTS_SESSION_CACHE_STORAGE_KEY } from "src/ts/constants/misc";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { listUserUniverseFollowings } from "src/ts/helpers/requests/services/followings";
import {
	type ExperienceEvent,
	getOmniRecommendations,
	listExperienceEvents,
} from "src/ts/helpers/requests/services/universes";
import { getTimedStorage } from "src/ts/helpers/storage";
import Button from "../core/Button";
import { CONTINUE_SORT_TOPIC_ID } from "../home/layoutCustomization/utils";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import usePromise from "../hooks/usePromise";
import ShowcaseExperienceEvent from "./ShowcaseExperienceEvent";
import { crossSort } from "src/ts/utils/objects";

export default function ShowcaseExperienceEventsNav() {
	const [authenticatedUser] = useAuthenticatedUser();
	const [data] = usePromise(() => {
		if (!authenticatedUser?.userId) {
			return;
		}

		return getTimedStorage(
			UPCOMING_FOLLOWED_EVENTS_SESSION_CACHE_STORAGE_KEY,
			"session",
			600_000,
			async () => {
				const omniRecommendationsPromise = getOmniRecommendations({
					pageType: "Home",
					sessionId: crypto.randomUUID(),
					supportedTreatmentTypes: ["SortlessGrid"],
				});

				return listUserUniverseFollowings({
					userId: authenticatedUser.userId,
				}).then(async (followings) => {
					const events: ExperienceEvent[] = [];
					const promises: Promise<void>[] = [];
					for (const key in followings.followedSources) {
						const universeId = Number.parseInt(key, 10);
						promises.push(
							listExperienceEvents({
								universeId,
								endsAfter: new Date().toISOString(),
								visibility: "public",
								includeCredentials: false,
							}).then((data) => {
								events.push(...data.data);
							}),
						);
					}

					const omniRecommendations = await omniRecommendationsPromise;
					const continueUniverseIds: number[] = [];
					for (const sort of omniRecommendations.sorts) {
						if (sort.topicId === CONTINUE_SORT_TOPIC_ID && sort.recommendationList) {
							for (const item of sort.recommendationList) {
								if (item.contentType === "Game") {
									continueUniverseIds.push(item.contentId);
								}
							}
						}
					}

					await Promise.all(promises);
					return crossSort(events, (a, b) => {
						const aContinueIndex = continueUniverseIds.indexOf(a.universeId);
						const bContinueIndex = continueUniverseIds.indexOf(b.universeId);

						// Rank by continue sort, then start time
						if (aContinueIndex !== -1 && bContinueIndex === -1) {
							return -1;
						}

						if (aContinueIndex === -1 && bContinueIndex !== -1) {
							return 1;
						}

						if (aContinueIndex !== -1 && bContinueIndex !== -1) {
							return aContinueIndex - bContinueIndex;
						}

						return (
							new Date(a.eventTime.startUtc).getTime() -
							new Date(b.eventTime.startUtc).getTime()
						);
					});
				});
			},
			authenticatedUser.userId,
		);
	}, [authenticatedUser?.userId]);
	const firstThreeEvents = useMemo(() => {
		return data?.slice(0, 3);
	}, [data]);
	const [showMore, setShowMore] = useState(false);

	return (
		<>
			{data && data.length > 0 && (
				<div className="roseal-events-nav">
					<h5>{getMessage("navigation.events.title")}</h5>
					<ul className="event-list">
						{(showMore ? data : firstThreeEvents)?.map((event) => (
							<ShowcaseExperienceEvent key={event.id} event={event} />
						))}
					</ul>
					{data.length > 3 && (
						<Button
							type="secondary"
							className="show-more-btn"
							onClick={() => setShowMore((s) => !s)}
						>
							{showMore
								? getMessage("navigation.events.showLess")
								: getMessage("navigation.events.showMore")}
						</Button>
					)}
				</div>
			)}
		</>
	);
}
