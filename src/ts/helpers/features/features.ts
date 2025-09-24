import { effect } from "@preact/signals";
import { initialLaunchDataFetch } from "src/ts/utils/interastral.ts";
import { currentPermissions, hasPermissions } from "../permissions.ts";
import { storage, storageUpdateListeners } from "../storage.ts";
import { FEATURE_STORAGE_KEY } from "./constants.ts";
import {
	type AnyFeature,
	type Feature,
	type FeatureComponentTypeDropdown,
	type FeatureValue,
	features,
} from "./featuresData.ts";
import {
	compareFeatureValues,
	getFeatureInputDefault,
	getFeatureValue,
	isFeatureDisabled,
} from "./helpers.ts";

export type FeatureUpdateListener = [(featureId: string) => Promise<void> | void, string[]];

const featureUpdateListeners = new Set<FeatureUpdateListener>();
export function onFeatureValueUpdate<T extends AnyFeature["id"]>(
	featureIds: T[],
	callback: (featureId: T) => Promise<void> | void,
) {
	const match = [callback, featureIds as FeatureUpdateListener[1]] as FeatureUpdateListener;
	featureUpdateListeners.add(match);

	return () => {
		featureUpdateListeners.delete(match);
	};
}

export const featureValueCache = new Map<string, unknown>();
export const disabledFeatureIds = new Set<AnyFeature["id"]>();
initialLaunchDataFetch.then((data) => {
	if (!data.disabledFeaturesV2) {
		return;
	}

	for (const disabledFeature of data.disabledFeaturesV2) {
		const feature = features[disabledFeature.id];
		if (!feature) {
			continue;
		}
		const featureVariant = "variant" in feature ? (feature.variant as number) : 0;
		if (
			disabledFeature.variants
				? !disabledFeature.variants.includes(featureVariant)
				: featureVariant !== 0
		) {
			continue;
		}
		if (
			disabledFeature.versions &&
			!disabledFeature.versions?.includes(import.meta.env.VERSION)
		) {
			continue;
		}

		disabledFeatureIds.add(disabledFeature.id);
		_featureCacheSet(feature.id, undefined);
	}
});

export function _featureCacheSet(key: AnyFeature["id"], newValue: unknown, initialFetch?: boolean) {
	const feature = features[key];
	if (!feature) return;

	const oldValue = featureValueCache.get(key);

	if (
		!compareFeatureValues(
			oldValue as FeatureValue<AnyFeature>,
			newValue as FeatureValue<AnyFeature>,
		) &&
		!initialFetch
	) {
		return;
	}

	featureValueCache.set(key, newValue);
	(async () => {
		if (!initialFetch) {
			for (const listener of featureUpdateListeners) {
				if ("subfeatures" in feature) {
					for (const item of feature.subfeatures.items) {
						if (listener[1].includes(item.id)) {
							listener[0](item.id);
						}
					}
				}

				if (listener[1].includes(key)) {
					listener[0](key);
				}
			}
		}

		if (import.meta.env.ENV === "main") {
			getFeatureValue(feature.id).then((newValue) => {
				/*sendMessage("featureValueUpdate", {
					featureId: key,
					newValue,
				});*/
				_handleFeatureCSS(feature, newValue);
			});

			if (!initialFetch && "subfeatures" in feature && feature.component.type === "Toggle") {
				for (const subfeature of feature.subfeatures.items) {
					getFeatureValue(subfeature.id).then((newValue) => {
						/*sendMessage("featureValueUpdate", {
							featureId: subfeature.id,
							newValue,
						});*/
						_handleFeatureCSS(subfeature, newValue);
					});
				}
			}
		}
	})();
}

let previousPermissions: MaybePromise<chrome.permissions.Permissions | undefined>;
effect(() => {
	const permissions = currentPermissions.value;
	if (!previousPermissions) {
		previousPermissions = permissions;
		return;
	}

	(async () => {
		const awaitedPreviousPermissions = await previousPermissions;
		if (awaitedPreviousPermissions && !(permissions instanceof Promise)) {
			for (const featureId in features) {
				const feature = features[featureId as AnyFeature["id"]] as Feature | undefined;
				if (!feature) {
					continue;
				}

				if (
					feature.permissions?.required &&
					(await hasPermissions(feature.permissions.required)) !==
						(await hasPermissions(
							feature.permissions.required,
							await previousPermissions,
						))
				) {
					for (const listener of featureUpdateListeners) {
						if (feature.component.type === "Toggle") {
							if (feature.subfeatures) {
								for (const item of feature.subfeatures.items) {
									if (listener[1].includes(item.id)) {
										listener[0](item.id);
									}
								}
							}
						}

						if (listener[1].includes(featureId)) {
							listener[0](featureId);
						}
					}
				}
			}
		}

		previousPermissions = permissions;
	})();
});

export function _handleFeatureCSS(feature: Feature, value: unknown) {
	if ("document" in globalThis && feature.hasCSS) {
		const attributeName = `data-rosealfe-${feature.id.replaceAll(".", "-")}`;

		if (value && (!Array.isArray(value) || value[0])) {
			document.documentElement?.setAttribute(attributeName, value.toString());
		} else {
			document.documentElement?.removeAttribute(attributeName);
		}
	}
}

export function handleFeatureValueChange<T extends Feature>(
	feature: T,
	newValue?: FeatureValue<T>,
	initialFetch?: boolean,
) {
	if (isFeatureDisabled(feature)) {
		return;
	}

	if (feature.component.type === "Toggle") {
		_featureCacheSet(
			feature.id as AnyFeature["id"],
			typeof newValue === "boolean" ? newValue : feature.component.defaultValue,
			initialFetch,
		);
	} else if (feature.component.type === "Dropdown") {
		let setValue: unknown = feature.component.defaultValue;

		if (newValue !== undefined)
			for (const item of (feature.component as unknown as FeatureComponentTypeDropdown)
				.values) {
				if ("value" in item && item.value === newValue) {
					setValue = item.value;
					break;
				}

				if ("values" in item) {
					for (const item2 of item.values) {
						if (item2.value === newValue) {
							setValue = item2.value;
							break;
						}
					}
				}
			}
		_featureCacheSet(feature.id as AnyFeature["id"], setValue, initialFetch);
	} else if (feature.component.type === "InputWithToggle") {
		let enabled = (newValue as [boolean, string?])?.[0] ?? feature.component.toggleDefaultValue;
		if (typeof enabled !== "boolean") {
			enabled = feature.component.toggleDefaultValue;
		}
		const text = getFeatureInputDefault(feature.id);

		_featureCacheSet(
			feature.id as AnyFeature["id"],
			[enabled, (newValue as [boolean, string])?.[1] ?? text],
			initialFetch,
		);
	} else if (feature.component.type === "DropdownWithToggle") {
		let enabled =
			(newValue as [boolean, string?] | undefined)?.[0] ??
			feature.component.toggleDefaultValue;

		if (typeof enabled !== "boolean") {
			enabled = feature.component.toggleDefaultValue;
		}

		let setValue: unknown = feature.component.defaultValue;
		if (newValue !== undefined)
			for (const item of (feature.component as unknown as FeatureComponentTypeDropdown)
				.values) {
				if ("value" in item && item.value === (newValue as [boolean, string])[1]) {
					setValue = item.value;
					break;
				}
				if ("values" in item) {
					for (const item2 of item.values) {
						if (item2.value === (newValue as [boolean, string])[1]) {
							setValue = item2.value;
							break;
						}
					}
				}
			}

		_featureCacheSet(feature.id as AnyFeature["id"], [enabled, setValue], initialFetch);
	}
}

browser.storage.onChanged.addListener((changes, area) => {
	for (const [key, { newValue }] of Object.entries(changes)) {
		if (key !== FEATURE_STORAGE_KEY) {
			for (const listener of storageUpdateListeners) {
				if (listener[1].includes(key) && listener[2] === area) {
					listener[0](key, newValue);
				}
			}
			continue;
		}

		for (const featureId in features) {
			handleFeatureValueChange(
				features[featureId as keyof typeof features],
				newValue[featureId],
			);
		}
	}
});

storage.get(FEATURE_STORAGE_KEY).then((allValue) => {
	const value = allValue?.[FEATURE_STORAGE_KEY] ?? {};
	for (const featureId in features) {
		const feature = features[featureId as AnyFeature["id"]];
		handleFeatureValueChange(feature, value[featureId], true);
	}
});
