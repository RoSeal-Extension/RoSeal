import {
	ACCOUNT_TRACKING_PREVENTION_FEATURE_ID,
	ACCOUNT_TRACKING_PREVENTION_PRESENCE_UPDATE_ALARM_NAME,
	ACCOUNT_TRACKING_PREVENTION_STORAGE_KEY,
	type AccountTrackingPreventionStorageValue,
} from "src/ts/constants/accountTrackingPrevention";
import {
	getCurrentAuthenticatedUser,
	userHeartbeatPulse,
} from "src/ts/helpers/requests/services/account";
import { storage } from "src/ts/helpers/storage";
import { randomArrItem } from "src/ts/utils/random";
import type { BackgroundAlarmListener } from "src/types/dataTypes";

export default {
	action: ACCOUNT_TRACKING_PREVENTION_PRESENCE_UPDATE_ALARM_NAME,
	featureIds: [ACCOUNT_TRACKING_PREVENTION_FEATURE_ID],
	fn: async () => {
		try {
			const authenticatedUser = await getCurrentAuthenticatedUser();
			const data = (
				(await storage.get(ACCOUNT_TRACKING_PREVENTION_STORAGE_KEY))?.[
					ACCOUNT_TRACKING_PREVENTION_STORAGE_KEY
				] as AccountTrackingPreventionStorageValue
			)?.accounts?.[authenticatedUser.id] ?? {
				rapidAvatarUpdate: {
					enabled: false,
				},
				onlineStatus: {
					type: "online",
					enabled: false,
				},
			};

			if (!data.onlineStatus.enabled) return;

			const studioPlaceId = data.onlineStatus.studioPlaceIds
				? randomArrItem(data.onlineStatus.studioPlaceIds)
				: 0;

			await userHeartbeatPulse({
				clientSideTimestampEpochMs: Date.now(),
				locationInfo:
					data.onlineStatus.type === "studio"
						? {
								studioLocationInfo: {
									placeId: studioPlaceId,
								},
							}
						: {
								universalAppLocationInfo: {
									activeState: 1,
									pageName: "home",
								},
							},
				sessionInfo: {
					sessionId: `roseal_${crypto.randomUUID()}`,
				},
			});
		} catch {}
	},
} satisfies BackgroundAlarmListener;
