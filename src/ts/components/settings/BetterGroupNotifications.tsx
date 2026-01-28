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
import BetterNotificationGroup, { type BetterNotificationItem } from "./BetterNotificationGroup";

export default function BetterGroupNotifications() {
	const [authenticatedUser] = useAuthenticatedUser();
	const [groups, , , , setGroups] = usePromise(() => {
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
						preferences: item.notificationPreferences,
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
			toggleFollowing={(enabled, id, type) =>
				setGroupNotificationSetting({
					groupId: id,
					type: type!,
					notificationsEnabled: enabled,
				}).catch((err) => {
					warning(getMessage("robloxSettings.notifications.groups.error"));
					throw err;
				})
			}
			items={groups}
			setItems={setGroups as (data: BetterNotificationItem[]) => void}
		/>
	);
}
