import {
	COMMUNITY_SHOUT_NOTIFICATIONS_ALARM_NAME,
	COMMUNITY_SHOUT_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID,
	COMMUNITY_SHOUT_NOTIFICATIONS_NOTIFICATION_PREFIX,
	COMMUNITY_SHOUT_NOTIFICATIONS_STORAGE_KEY,
} from "src/ts/constants/communities";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { backgroundLocalesLoaded } from "src/ts/helpers/i18n/locales";
import { getCurrentAuthenticatedUser } from "src/ts/helpers/requests/services/account";
import { getGroupById, listUserGroupsRoles } from "src/ts/helpers/requests/services/groups";
import { storage } from "src/ts/helpers/storage";
import {
	getRoSealNotificationIcon,
	showRoSealNotification,
} from "src/ts/utils/background/notifications";
import type { BackgroundAlarmListener } from "src/types/dataTypes";

export async function fetchCommunityShoutsAndUpdateData() {
	try {
		await backgroundLocalesLoaded;

		const authenticatedUser = await getCurrentAuthenticatedUser();
		const groups = await listUserGroupsRoles({
			userId: authenticatedUser.id,
			includeNotificationPreferences: true,
		});

		const communityShoutDates: Record<string, number> =
			(await storage.get(COMMUNITY_SHOUT_NOTIFICATIONS_STORAGE_KEY))?.[
				COMMUNITY_SHOUT_NOTIFICATIONS_STORAGE_KEY
			] ?? {};

		const promises: Promise<void>[] = [];
		for (const group of groups.data) {
			if (group.isNotificationsEnabled) {
				promises.push(
					getGroupById({
						groupId: group.group.id,
					}).then(async (data) => {
						const shoutUpdated = data.shout?.updated;

						const oldTime = communityShoutDates[data.id];
						if (shoutUpdated && oldTime) {
							const time = Math.floor(new Date(shoutUpdated).getTime() / 1_000);

							if (time > oldTime) {
								communityShoutDates[group.group.id] = time;

								await showRoSealNotification(
									`${COMMUNITY_SHOUT_NOTIFICATIONS_NOTIFICATION_PREFIX}${group.group.id}`,
									{
										type: "basic" as const,
										iconUrl: await getRoSealNotificationIcon({
											type: "GroupIcon",
											targetId: group.group.id,
											size: "150x150",
										}),
										title: data.name,
										message: data.shout?.body ?? "?",
										contextMessage: getMessage(
											"notifications.communityShout.context",
										),
										eventTime: Date.now() + 1_000 * 10,
									},
								);
							}
						} else {
							communityShoutDates[group.group.id] =
								oldTime ?? Math.floor(Date.now() / 1_000);
						}
					}),
				);
			}
		}

		await Promise.all(promises);
		await storage.set({
			[COMMUNITY_SHOUT_NOTIFICATIONS_STORAGE_KEY]: communityShoutDates,
		});
	} catch {}
}

export default {
	action: COMMUNITY_SHOUT_NOTIFICATIONS_ALARM_NAME,
	featureIds: [COMMUNITY_SHOUT_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID],
	fn: fetchCommunityShoutsAndUpdateData,
} satisfies BackgroundAlarmListener;
