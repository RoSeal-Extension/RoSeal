import { useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import {
	addUserUniverseFollowing,
	listLastUniversesUpdates,
	listUserUniverseFollowings,
	removeUserUniverseFollowing,
} from "src/ts/helpers/requests/services/followings";
import { multigetUniversesByIds } from "src/ts/helpers/requests/services/universes";
import { getExperienceLink } from "src/ts/utils/links";
import { warning } from "../core/systemFeedback/helpers/globalSystemFeedback";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import usePromise from "../hooks/usePromise";
import BetterNotificationGroup from "./BetterNotificationGroup";

export default function BetterExperienceNotifications() {
	const [authenticatedUser] = useAuthenticatedUser();
	const [followedUniverseIds, setFollowedUniverseIds] = useState<number[]>([]);
	const [universes] = usePromise(() => {
		if (!authenticatedUser) {
			return;
		}

		return listUserUniverseFollowings({
			userId: authenticatedUser.userId,
		}).then((data) => {
			if (Object.keys(data.followedSources).length === 0) {
				return [];
			}

			const universeIds = Object.keys(data.followedSources).map((item) =>
				Number.parseInt(item, 10),
			);
			setFollowedUniverseIds(universeIds);
			return multigetUniversesByIds({
				universeIds,
			})
				.then((data2) =>
					data2.map((universe) => ({
						creator: {
							targetId: universe.creator.id,
							targetType: universe.creator.type,
							name: universe.creator.name,
							hasVerifiedBadge: universe.creator.hasVerifiedBadge,
						},
						name: universe.name,
						id: universe.id,
						thumbnailType: "GameIcon" as const,
						link: getExperienceLink(universe.rootPlaceId, universe.name),
						followingSince: data.followedSources[universe.id]!,
					})),
				)
				.then((data) =>
					listLastUniversesUpdates({
						universeIds: data.map((item) => item.id),
					}).then((data2) =>
						data.map((universe) => ({
							...universe,
							lastUpdated: data2.find(
								(universe2) => universe2.universeId === universe.id,
							)?.createdOn,
						})),
					),
				);
		});
	}, [authenticatedUser?.userId]);

	return (
		<BetterNotificationGroup
			title={getMessage("robloxSettings.notifications.experiences.title")}
			iconName="play"
			description={getMessage("robloxSettings.notifications.experiences.description")}
			offDescription={getMessage("robloxSettings.notifications.experiences.descriptionOff")}
			toggleFollowing={(id) => {
				const shouldEnable = !followedUniverseIds.includes(id);
				(shouldEnable ? addUserUniverseFollowing : removeUserUniverseFollowing)({
					userId: authenticatedUser!.userId,
					universeId: id,
				})
					.then(() => {
						if (shouldEnable) {
							setFollowedUniverseIds([...followedUniverseIds, id]);
						} else {
							setFollowedUniverseIds(
								followedUniverseIds.filter((universeId) => universeId !== id),
							);
						}
					})
					.catch(() => {
						warning(getMessage("robloxSettings.notifications.experiences.error"));
					});
			}}
			items={universes?.map((universe) => ({
				...universe,
				isFollowing: followedUniverseIds.includes(universe.id),
			}))}
		/>
	);
}
