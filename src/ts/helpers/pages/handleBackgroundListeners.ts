import type { AnyBackgroundMessageListener, BackgroundMessageData } from "src/types/dataTypes";
import type { AnyFeature } from "../features/featuresData.ts";
import { multigetFeaturesValues } from "../features/helpers.ts";
import { flagCallMatch, getFlag } from "../flags/flags.ts";

export function handleBackgroundListeners(messageListeners: AnyBackgroundMessageListener[]) {
	const actionFeatureMap = new Map<string, Set<AnyFeature["id"]>>();
	for (const listener of messageListeners) {
		if (listener.featureIds) {
			let set = actionFeatureMap.get(listener.action);
			if (!set) {
				set = new Set();
				actionFeatureMap.set(listener.action, set);
			}
			for (const featureId of listener.featureIds) {
				set.add(featureId);
			}
		}
	}

	const actionListenerMap = new Map<string, AnyBackgroundMessageListener[]>();
	for (const listener of messageListeners) {
		let list = actionListenerMap.get(listener.action);
		if (!list) {
			list = [];
			actionListenerMap.set(listener.action, list);
		}
		list.push(listener);
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
			const listeners = actionListenerMap.get(message.action);
			if (!listeners) {
				return {
					success: false,
					reason: "CallbackNotFound",
				};
			}

			const featureIds = actionFeatureMap.get(message.action);
			const features = featureIds ? await multigetFeaturesValues([...featureIds]) : undefined;

			for (const listener of listeners) {
				if (
					!listener.featureIds ||
					listener.featureIds.some((featureId) => features?.[featureId] === true)
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
