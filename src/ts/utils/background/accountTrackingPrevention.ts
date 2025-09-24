import {
	ACCOUNT_TRACKING_PREVENTION_PRESENCE_UPDATE_ALARM_NAME,
	ACCOUNT_TRACKING_PREVENTION_STORAGE_KEY,
	type AccountTrackingPreventionStorageValue,
} from "../../constants/accountTrackingPrevention.ts";
import { THUMBNAIL_CUSTOMIZATION_LIMITS } from "../../constants/avatar.ts";
import { getCurrentAuthenticatedUser } from "../../helpers/requests/services/account.ts";
import {
	getAvatarThumbnailCustomizations,
	setThumbnailCustomization,
} from "../../helpers/requests/services/avatar.ts";
import { onStorageValueUpdate, storage } from "../../helpers/storage.ts";
import { randomFloat } from "../../utils/random.ts";
import { keepAliveServiceWorker } from "./other.ts";

let previousEnabled = false;
let previousUserId: number | undefined;
let accountUpdateListener: (() => void) | void | undefined;

let abortController: AbortController | undefined;

let keepAliveListener: (() => void) | undefined;

async function handleAccountTrackingProtectionStorage() {
	const currentUserId = previousUserId!;
	const data = (
		(await storage.get(ACCOUNT_TRACKING_PREVENTION_STORAGE_KEY))?.[
			ACCOUNT_TRACKING_PREVENTION_STORAGE_KEY
		] as AccountTrackingPreventionStorageValue
	)?.accounts?.[currentUserId] ?? {
		rapidAvatarUpdate: {
			enabled: false,
		},
		onlineStatus: {
			type: "online",
			enabled: false,
		},
	};

	const rapidAvatarUpdateAlarm = await browser.alarms.get(
		ACCOUNT_TRACKING_PREVENTION_PRESENCE_UPDATE_ALARM_NAME,
	);
	if (data.onlineStatus.enabled && !rapidAvatarUpdateAlarm) {
		browser.alarms.create(ACCOUNT_TRACKING_PREVENTION_PRESENCE_UPDATE_ALARM_NAME, {
			periodInMinutes: 0.5,
		});
	} else if (!data.onlineStatus.enabled && rapidAvatarUpdateAlarm) {
		browser.alarms.clear(ACCOUNT_TRACKING_PREVENTION_PRESENCE_UPDATE_ALARM_NAME);
	}

	if (keepAliveListener) {
		keepAliveListener();
		keepAliveListener = undefined;
	}

	if (abortController) {
		abortController.abort();
		abortController = undefined;
	}

	if (data.rapidAvatarUpdate.enabled) {
		keepAliveListener = keepAliveServiceWorker();
		abortController = new AbortController();

		setTimeout(async () => {
			const avatarCustomizations = (await getAvatarThumbnailCustomizations())
				.avatarThumbnailCustomizations;
			const original = avatarCustomizations.find((c) => c.thumbnailType === 1) ?? {
				thumbnailType: 1,
				emoteAssetId: 0,
				camera: {
					distanceScale: -1,
					fieldOfViewDeg: 30,
					yRotDeg: -3,
				},
			};
			const limits = THUMBNAIL_CUSTOMIZATION_LIMITS.AvatarHeadShot;

			const keepAlive = keepAliveServiceWorker();
			while (abortController?.signal.aborted === false) {
				const increment = randomFloat(0.000000003, 0.000003);

				const clone = structuredClone(original);

				clone.camera = {
					distanceScale:
						clone.camera.distanceScale === -1
							? clone.camera.distanceScale
							: clone.camera.distanceScale + increment >
									limits.upperBounds.distanceScale
								? clone.camera.distanceScale - increment
								: clone.camera.distanceScale + increment,

					fieldOfViewDeg:
						clone.camera.fieldOfViewDeg + increment > limits.upperBounds.fieldOfViewDeg
							? clone.camera.fieldOfViewDeg - increment
							: clone.camera.fieldOfViewDeg + increment,
					yRotDeg:
						clone.camera.yRotDeg + increment > limits.upperBounds.yRotDeg
							? clone.camera.yRotDeg - increment
							: clone.camera.yRotDeg + increment,
				};

				await setThumbnailCustomization(clone).catch(() => {});
			}

			keepAlive();
		});
	}
}

export async function handleAccountTrackingProtectionAccount(userId?: number) {
	try {
		if (userId && userId === previousUserId) return;

		if (accountUpdateListener) {
			accountUpdateListener();
			accountUpdateListener = undefined;
		}

		if (abortController) {
			abortController.abort();
			abortController = undefined;
		}

		const accountUserId = userId ?? (await getCurrentAuthenticatedUser()).id;
		if (accountUserId !== previousUserId) {
			previousUserId = accountUserId;

			handleAccountTrackingProtectionStorage();
		}

		return onStorageValueUpdate([ACCOUNT_TRACKING_PREVENTION_STORAGE_KEY], async () => {
			if (abortController) {
				abortController.abort();
				abortController = undefined;
			}

			handleAccountTrackingProtectionStorage();
		});
	} catch {
		return;
	}
}

export async function handleAccountTrackingProtectionEnabled(enabled: boolean) {
	if (enabled === previousEnabled) return;

	previousEnabled = enabled;

	if (accountUpdateListener) {
		accountUpdateListener();
		accountUpdateListener = undefined;
	}

	if (abortController) {
		abortController.abort();
		abortController = undefined;
	}

	const alarm = await browser.alarms.get(ACCOUNT_TRACKING_PREVENTION_PRESENCE_UPDATE_ALARM_NAME);
	if (alarm && !enabled) {
		await browser.alarms.clear(ACCOUNT_TRACKING_PREVENTION_PRESENCE_UPDATE_ALARM_NAME);
	}

	if (enabled) {
		accountUpdateListener = await handleAccountTrackingProtectionAccount();
	}
}
