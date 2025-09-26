import {
	FRIENDS_LAST_SEEN_BACKGROUND_CHECKS_FEATURE_ID,
	FRIENDS_LAST_SEEN_FEATURE_ID,
	FRIENDS_LAST_SEEN_STORAGE_KEY,
	FRIENDS_PRESENCE_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID,
	FRIENDS_PRESENCE_NOTIFICATIONS_DATA_STORAGE_DEFAULT_VALUE,
	FRIENDS_PRESENCE_NOTIFICATIONS_DATA_STORAGE_KEY,
	FRIENDS_PRESENCE_NOTIFICATIONS_FEATURE_ID,
	FRIENDS_PRESENCE_NOTIFICATIONS_NOTIFICATION_PREFIX,
	FRIENDS_PRESENCE_NOTIFICATIONS_SESSION_CACHE_STORAGE_DEFAULT_VALUE,
	FRIENDS_PRESENCE_NOTIFICATIONS_SESSION_CACHE_STORAGE_KEY,
	FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_INEXPERIENCE_FEATURE_ID,
	FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_INSTUDIO_FEATURE_ID,
	FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_ONLINE_FEATURE_ID,
	type FriendsPresenceNotificationsDataStorageValue,
	type FriendsPresenceNotificationsSessionCacheStorageValue,
	USER_ONLINE_FRIENDS_FETCH_ALARM_NAME,
} from "src/ts/constants/friends";
import { presenceTypes } from "src/ts/constants/presence";
import { invokeMessage } from "src/ts/helpers/communication/background";
import { multigetFeaturesValues } from "src/ts/helpers/features/helpers";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { backgroundLocalesLoaded } from "src/ts/helpers/i18n/locales";
import { profileProcessor } from "src/ts/helpers/processors/profileProcessor";
import { getCurrentAuthenticatedUser } from "src/ts/helpers/requests/services/account";
import { listUserOnlineFriends, type UserPresence } from "src/ts/helpers/requests/services/users";
import {
	getExtensionSessionStorage,
	setExtensionSessionStorage,
	storage,
} from "src/ts/helpers/storage";
import { getRoSealNotificationIcon } from "src/ts/utils/background/notifications";
import type { BackgroundAlarmListener } from "src/types/dataTypes";

export async function handleFriendsPresenceNotifications(
	data: UserPresence[],
	_trackingData?: FriendsPresenceNotificationsDataStorageValue,
	_curr?: FriendsPresenceNotificationsSessionCacheStorageValue,
	inExperienceEnabled?: boolean,
	inStudioEnabled?: boolean,
	onlineEnabled?: boolean,
) {
	const trackingData =
		_trackingData ??
		(await storage.get(FRIENDS_PRESENCE_NOTIFICATIONS_DATA_STORAGE_KEY))?.[
			FRIENDS_PRESENCE_NOTIFICATIONS_DATA_STORAGE_KEY
		] ??
		FRIENDS_PRESENCE_NOTIFICATIONS_DATA_STORAGE_DEFAULT_VALUE;
	if ("users" in trackingData) {
		storage.set({
			[FRIENDS_PRESENCE_NOTIFICATIONS_DATA_STORAGE_KEY]: {
				...trackingData,
				users: undefined,
			},
		});
	}
	const curr =
		_curr ??
		(await getExtensionSessionStorage<FriendsPresenceNotificationsSessionCacheStorageValue>(
			FRIENDS_PRESENCE_NOTIFICATIONS_SESSION_CACHE_STORAGE_KEY,
		)) ??
		FRIENDS_PRESENCE_NOTIFICATIONS_SESSION_CACHE_STORAGE_DEFAULT_VALUE;
	const notifications: [string, chrome.notifications.NotificationCreateOptions][] = [];

	await backgroundLocalesLoaded;
	for (const item of data) {
		if (!trackingData.userIds.includes(item.userId)) {
			continue;
		}

		const oldItem = curr.users[item.userId];

		let newPresence: (typeof presenceTypes)[number] | undefined;
		let oldPresence: (typeof presenceTypes)[number] | undefined;

		for (const presence of presenceTypes) {
			if (presence.typeId === item.userPresenceType) {
				newPresence = presence;
			}
			if (oldItem?.type === presence.typeId) {
				oldPresence = presence;
			}

			if ((oldPresence || !oldItem) && newPresence) {
				break;
			}
		}

		curr.users[item.userId] = {
			type: item.userPresenceType,
			experienceId: item.universeId ?? undefined,
		};

		// ignore studio <-> game presence changes
		// ignore Offline
		// ignore in game -> online <- studio
		// ignore non-game changes

		if (
			(oldPresence?.locationType === "Game" && newPresence?.locationType === "Studio") ||
			(oldPresence?.locationType === "Studio" && newPresence?.locationType === "Game") ||
			newPresence?.locationType === "Offline" ||
			(oldPresence?.type === newPresence?.type &&
				(newPresence?.type !== "InGame" || item.universeId === oldItem?.experienceId)) ||
			(oldPresence?.type !== "Offline" && newPresence?.type === "Online")
		) {
			continue;
		}

		if (
			!newPresence ||
			(newPresence.type === "InGame" && !inExperienceEnabled) ||
			(newPresence.type === "InStudio" && !inStudioEnabled) ||
			(newPresence.type === "Online" && !onlineEnabled)
		)
			continue;

		const [profileData, iconUrl] = await Promise.all([
			profileProcessor.request({
				userId: item.userId,
			}),
			getRoSealNotificationIcon({
				type: "AvatarHeadShot",
				targetId: item.userId,
				size: "420x420",
			}),
		]);

		notifications.push([
			`${FRIENDS_PRESENCE_NOTIFICATIONS_NOTIFICATION_PREFIX}${item.userId}`,
			{
				type: "basic",
				iconUrl,
				title: profileData.names.combinedName,
				message: getMessage(
					`notifications.connnectionActivity.message.${newPresence.type}`,
					{
						displayName: profileData.names.combinedName,
						hasExperienceName: !!item.universeId,
						experienceName: item.lastLocation,
					},
				),
				contextMessage: getMessage("notifications.connnectionActivity.context"),
				buttons:
					newPresence.type === "InGame" && item.universeId
						? [
								{
									title: getMessage(
										"notifications.connnectionActivity.buttons.join",
									),
								},
							]
						: [],
				eventTime: Date.now() + 1_000 * 10,
			},
		]);
	}

	await setExtensionSessionStorage({
		[FRIENDS_PRESENCE_NOTIFICATIONS_SESSION_CACHE_STORAGE_KEY]: curr,
	});

	for (const notification of notifications) {
		if (import.meta.env.ENV === "background") {
			await browser.notifications.create(notification[0], notification[1]);
		} else {
			await invokeMessage("createNotification", {
				id: notification[0],
				notification: notification[1],
			});
		}
	}
}

export async function fetchOnlineFriendsAndUpdateData() {
	try {
		const [authenticatedUser, features] = await Promise.all([
			getCurrentAuthenticatedUser(),
			multigetFeaturesValues([
				FRIENDS_LAST_SEEN_FEATURE_ID,
				FRIENDS_PRESENCE_NOTIFICATIONS_FEATURE_ID,
				FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_INEXPERIENCE_FEATURE_ID,
				FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_INSTUDIO_FEATURE_ID,
				FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_ONLINE_FEATURE_ID,
			]),
		]);
		const onlineFriends = await listUserOnlineFriends({
			userId: authenticatedUser.id,
		});

		if (features[FRIENDS_LAST_SEEN_FEATURE_ID]) {
			const data: Record<number, number> =
				(await storage.get(FRIENDS_LAST_SEEN_STORAGE_KEY))?.[
					FRIENDS_LAST_SEEN_STORAGE_KEY
				] ?? {};

			const currentDate = Math.floor(Date.now() / 1_000);
			for (const item of onlineFriends.data) {
				// just in case
				if (item.userPresence.userPresenceType === "Offline") continue;

				data[item.id] = currentDate;
			}

			await storage.set({
				[FRIENDS_LAST_SEEN_STORAGE_KEY]: data,
			});
		}

		if (features[FRIENDS_PRESENCE_NOTIFICATIONS_FEATURE_ID]) {
			await handleFriendsPresenceNotifications(
				onlineFriends.data.map((item) => ({
					userPresenceType: presenceTypes.find(
						(type) => type.type === item.userPresence.userPresenceType,
					)!.typeId,
					gameId: item.userPresence.gameInstanceId,
					placeId: item.userPresence.placeId,
					rootPlaceId: item.userPresence.rootPlaceId,
					universeId: item.userPresence.universeId,
					userId: item.id,
					lastLocation: item.userPresence.lastLocation,
				})),
				undefined,
				undefined,
				features[FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_INEXPERIENCE_FEATURE_ID],
				features[FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_INSTUDIO_FEATURE_ID],
				features[FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_ONLINE_FEATURE_ID],
			);
		}

		return onlineFriends;
	} catch {}
}

export default {
	action: USER_ONLINE_FRIENDS_FETCH_ALARM_NAME,
	featureIds: [
		FRIENDS_LAST_SEEN_BACKGROUND_CHECKS_FEATURE_ID,
		FRIENDS_PRESENCE_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID,
	],
	fn: fetchOnlineFriendsAndUpdateData,
} satisfies BackgroundAlarmListener;
