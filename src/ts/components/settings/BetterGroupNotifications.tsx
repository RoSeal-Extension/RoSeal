import { useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import {
	getGroupGuildedShout,
	listUserGroupsRoles,
	setGroupNotificationSetting,
} from "src/ts/helpers/requests/services/groups";
import { getGroupProfileLink } from "src/ts/utils/links";
import { warning } from "../core/systemFeedback/helpers/globalSystemFeedback";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import usePromise from "../hooks/usePromise";
import BetterNotificationGroup from "./BetterNotificationGroup";

export default function BetterGroupNotifications() {
	const [followedGroupIds, setFollowedGroupIds] = useState<number[]>([]);

	const [authenticatedUser] = useAuthenticatedUser();
	const [groups] = usePromise(() => {
		if (!authenticatedUser) {
			return;
		}

		return listUserGroupsRoles({
			userId: authenticatedUser.userId,
			includeNotificationPreferences: true,
		}).then(({ data }) => {
			if (!data.length) {
				return [];
			}

			const newGroupIds: number[] = [];
			for (const group of data) {
				if (group.isNotificationsEnabled) {
					newGroupIds.push(group.group.id);
				}
			}

			setFollowedGroupIds(newGroupIds);

			return Promise.all(
				data.map((item) =>
					getGroupGuildedShout({
						groupId: item.group.id,
					}).then((shout) => ({
						creator: item.group.owner && {
							targetId: item.group.owner.userId,
							targetType: "User" as const,
							name: item.group.owner.username,
							hasVerifiedBadge: item.group.owner.hasVerifiedBadge,
						},
						hasVerifiedBadge: item.group.hasVerifiedBadge,
						name: item.group.name,
						id: item.group.id,
						thumbnailType: "GroupIcon" as const,
						link: getGroupProfileLink(item.group.id),
						lastUpdated: shout?.updatedAt,
					})),
				),
			);
		});
	}, [authenticatedUser?.userId]);

	return (
		<BetterNotificationGroup
			title={getMessage("robloxSettings.notifications.groups.title")}
			iconName="menu-groups"
			description={getMessage("robloxSettings.notifications.groups.description")}
			offDescription={getMessage("robloxSettings.notifications.groups.descriptionOff")}
			toggleFollowing={(id) => {
				const shouldEnable = !followedGroupIds.includes(id);
				setGroupNotificationSetting({
					groupId: id,
					notificationsEnabled: shouldEnable,
				})
					.then(() => {
						if (!shouldEnable) {
							setFollowedGroupIds(followedGroupIds.filter((item) => item !== id));
						} else {
							setFollowedGroupIds([...followedGroupIds, id]);
						}
					})
					.catch(() => warning(getMessage("robloxSettings.notifications.groups.error")));
			}}
			items={groups?.map((group) => ({
				...group,
				isFollowing: followedGroupIds.includes(group.id),
			}))}
		/>
	);
}
