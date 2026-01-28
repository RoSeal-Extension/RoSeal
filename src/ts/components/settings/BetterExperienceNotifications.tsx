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
import BetterNotificationGroup, { type BetterNotificationItem } from "./BetterNotificationGroup";
import type { GroupNotificationSettingType } from "src/ts/helpers/requests/services/groups";

export default function BetterExperienceNotifications() {
	const [authenticatedUser] = useAuthenticatedUser();
	const [universes, , , , setUniverses] = usePromise(() => {
		if (!authenticatedUser) {
			return;
		}

		return listUserUniverseFollowings({
			userId: authenticatedUser.userId,
		}).then((data) => {
			if (Object.keys(data.followedSources).length === 0) {
				return [];
			}

			const universeIds: number[] = [];
			for (const key in data.followedSources) {
				universeIds.push(Number.parseInt(key, 10));
			}

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
						preferences: [
							{
								name: "",
								description: "",
								type: "" as GroupNotificationSettingType,
								enabled: true,
							},
						],
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
			iconName="regular-circle-play icon size-[var(--icon-size-large)]"
			description={getMessage("robloxSettings.notifications.experiences.description")}
			offDescription={getMessage("robloxSettings.notifications.experiences.descriptionOff")}
			toggleFollowing={(enabled, id) =>
				(enabled ? addUserUniverseFollowing : removeUserUniverseFollowing)({
					userId: authenticatedUser!.userId,
					universeId: id,
				}).catch((err) => {
					warning(getMessage("robloxSettings.notifications.experiences.error"));
					throw err;
				})
			}
			items={universes}
			setItems={setUniverses as (data: BetterNotificationItem[]) => void}
		/>
	);
}
