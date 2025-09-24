import type { AnyBackgroundMessageListener, BackgroundMessageData } from "src/types/dataTypes";
import type { AnyFeature } from "../features/featuresData.ts";
import { multigetFeaturesValues } from "../features/helpers.ts";
import { flagCallMatch, getFlag } from "../flags/flags.ts";

export function handleBackgroundListeners(messageListeners: AnyBackgroundMessageListener[]) {
	const featureIds = new Set<AnyFeature["id"]>();
	for (const listener of messageListeners) {
		for (const featureId of listener.featureIds ?? []) {
			featureIds.add(featureId);
		}
	}

	browser.runtime.onMessage.addListener((message: BackgroundMessageData, sender, respond) => {
		try {
			if (!message || !("action" in message)) {
				return respond({
					success: false,
					reason: "NoData",
				});
			}
		} catch {
			return respond({
				success: false,
				reason: "UnknownError",
			});
		}

		const returnValue = (async () => {
			const features = await multigetFeaturesValues([...featureIds]);
			for (const listener of messageListeners) {
				if (
					listener.action === message.action &&
					(!listener.featureIds ||
						listener.featureIds.some((featureId) => features[featureId] === true))
				) {
					if (listener.flags) {
						let shouldContinue = false;
						for (const flag of listener.flags) {
							if (flagCallMatch(flag, await getFlag(flag.namespace, flag.key))) {
								shouldContinue = true;
								break;
							}
						}

						if (!shouldContinue) {
							continue;
						}
					}
					try {
						const result = await listener.fn(message.args, sender);
						return {
							success: true,
							data: result,
						};
					} catch (err) {
						return {
							success: false,
							reason: typeof err === "string" ? err : "UnknownError",
						};
					}
				}
			}

			return {
				success: false,
				reason: "CallbackNotFound",
			};
		})().catch((err) => ({
			success: false,
			reason: typeof err === "string" ? err : "UnknownError",
		}));

		returnValue.then(respond);
		return true;
	});
}
