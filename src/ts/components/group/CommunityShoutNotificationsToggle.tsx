import { useCallback } from "preact/hooks";
import Tooltip from "../core/Tooltip";
import Icon from "../core/Icon";
import classNames from "classnames";
import usePromise from "../hooks/usePromise";
import {
	listUserGroupsRoles,
	setGroupNotificationSetting,
} from "src/ts/helpers/requests/services/groups";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type CommunityShoutNotificationsToggleProps = {
	communityId: number;
};

export default function CommunityShoutNotificationsToggle({
	communityId,
}: CommunityShoutNotificationsToggleProps) {
	const [authenticatedUser] = useAuthenticatedUser();
	const [isNotified, , , refreshIsNotified] = usePromise(() => {
		if (!authenticatedUser) return;

		return listUserGroupsRoles({
			userId: authenticatedUser.userId,
			includeNotificationPreferences: true,
		}).then((data) => {
			for (const item of data.data) {
				if (item.group.id === communityId) {
					if (item.notificationPreferences) {
						for (const item2 of item.notificationPreferences) {
							if (item2.type === "AnnouncementCreatedNotification") {
								return item2.enabled;
							}
						}
					}
				}
			}
		});
	}, [communityId, authenticatedUser?.userId]);

	const onClick = useCallback(() => {
		setGroupNotificationSetting({
			type: "AnnouncementCreatedNotification",
			groupId: communityId,
			notificationsEnabled: !isNotified,
		}).then(refreshIsNotified);
	}, [isNotified, communityId]);

	return (
		<Tooltip
			as="div"
			placement="auto"
			button={
				<button
					type="button"
					className="group-announcements-notifications-icon"
					onClick={onClick}
				>
					<Icon
						name="notifications-bell"
						className={classNames({
							followed: isNotified,
						})}
					/>
				</button>
			}
		>
			{getMessage(`group.shoutNotifications.${isNotified ? "disable" : "enable"}`)}
		</Tooltip>
	);
}
