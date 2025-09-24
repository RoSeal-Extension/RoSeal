import { initialLaunchDataFetch, launchData } from "src/ts/utils/interastral.ts";
import { setInvokeListener } from "../communication/dom.ts";
import { getMessage, hasMessage } from "../i18n/getMessage.ts";
import { hasPermissions } from "../permissions.ts";
import { storage } from "../storage.ts";
import { FEATURE_STORAGE_KEY, I18N_FEATURE_PREFIX } from "./constants.ts";
import {
	disabledFeatureIds,
	featureValueCache,
	handleFeatureValueChange,
	onFeatureValueUpdate,
} from "./features.ts";
import { type AnyFeature, type Feature, type FeatureValue, features } from "./featuresData.ts";

if (import.meta.env.ENV === "main") {
	setInvokeListener("getFeatureValue", (data) => {
		if (!data) {
			return;
		}

		return getFeatureValue(data.featureId, data.uncached);
	});
}

export async function getFeatureValue<
	T extends AnyFeature["id"],
	U extends FeatureValue<(typeof features)[T]> | undefined =
		| FeatureValue<(typeof features)[T]>
		| undefined,
>(featureId: T, uncached?: boolean, display?: boolean): Promise<U | undefined> {
	await initialLaunchDataFetch;
	if (!display && !(await isFeatureValueAccessible(featureId))) {
		return undefined;
	}
	const feature = features[featureId] as Feature;

	if (!uncached && featureValueCache.has(featureId)) {
		return featureValueCache.get(featureId) as U;
	}

	try {
		const syncedValue = (await storage.get([FEATURE_STORAGE_KEY]))?.[FEATURE_STORAGE_KEY] ?? {};

		if (featureId in syncedValue) {
			const featureValue = syncedValue[featureId];
			handleFeatureValueChange(feature, featureValue);

			return featureValueCache.get(featureId) as U;
		}

		return getFeatureDefaultValue(feature) as U;
	} catch {
		return undefined;
	}
}

export function getFeatureInputDefault(featureId: string) {
	const textId = `${I18N_FEATURE_PREFIX}${featureId}.inputPlaceholder`;
	const text =
		import.meta.env.ENV !== "main"
			? "PLACEHOLDER"
			: hasMessage(textId)
				? getMessage(textId)
				: "PLACEHOLDER_INVALID";

	return text;
}

export function canAccessFeature(_feature: Feature | AnyFeature["id"]): boolean {
	const feature = typeof _feature === "string" ? (features[_feature] as Feature) : _feature;

	return (
		!feature.subscriptionTier || feature.subscriptionTier >= (launchData?.subscriptionTier ?? 0)
	);
}

export function isFeatureDisabled(
	_feature: Feature | AnyFeature["id"],
	checkParent = true,
): boolean {
	const feature = typeof _feature === "string" ? (features[_feature] as Feature) : _feature;

	return !!(
		feature.disabled ||
		(checkParent && feature._isSubOf && isFeatureDisabled(feature._isSubOf)) ||
		(feature.supportedTargets && !feature.supportedTargets?.includes(import.meta.env.TARGET)) ||
		disabledFeatureIds.has(feature.id as AnyFeature["id"])
	);
}

export function getFeatureDefaultValue<
	T extends Feature | AnyFeature["id"],
	U extends FeatureValue<T extends AnyFeature["id"] ? (typeof features)[T] : T>,
>(_feature: T): U | undefined {
	const feature = (typeof _feature === "string" ? features[_feature] : _feature) as Feature;
	if (feature.component.type === "DropdownWithToggle") {
		return [feature.component.toggleDefaultValue, feature.component.defaultValue] as U;
	}
	if ("defaultValue" in feature.component) {
		return feature.component.defaultValue as U;
	}

	if (feature.component.type === "InputWithToggle") {
		return [feature.component.toggleDefaultValue, getFeatureInputDefault(feature.id)] as U;
	}
}

export async function isFeatureValueAccessible(featureId: AnyFeature["id"]) {
	await initialLaunchDataFetch;
	if (isFeatureDisabled(featureId) || !canAccessFeature(featureId)) return false;
	const feature = features[featureId] as Feature;

	const isSubOf = feature._isSubOf;
	if (
		isSubOf?.component.type === "Toggle" &&
		(await getFeatureValue(isSubOf.id as AnyFeature["id"])) !== true
	) {
		return false;
	}

	if (
		isSubOf?.component.type === "DropdownWithToggle" ||
		isSubOf?.component.type === "InputWithToggle"
	) {
		const value = await getFeatureValue(isSubOf.id as AnyFeature["id"]);
		if (!value || (Array.isArray(value) && value[0] !== true)) {
			return false;
		}
	}

	if (feature.permissions?.required && !(await hasPermissions(feature.permissions.required))) {
		return false;
	}

	return true;
}

export function setFeatureValue<T extends Feature | AnyFeature["id"]>(
	_feature: T,
	value: FeatureValue<T extends AnyFeature["id"] ? (typeof features)[T] : T>,
): Promise<void> {
	const feature =
		typeof _feature === "string"
			? features[_feature as AnyFeature["id"]]
			: (_feature as AnyFeature);

	if (isFeatureDisabled(feature)) return Promise.resolve();
	handleFeatureValueChange(feature, value as unknown as FeatureValue<AnyFeature>);

	const defaultValue = getFeatureDefaultValue(feature);

	if (!compareFeatureValues(value as FeatureValue<AnyFeature>, defaultValue)) {
		return storage.get(FEATURE_STORAGE_KEY).then((data) => {
			const syncedValue = data?.[FEATURE_STORAGE_KEY] ?? {};
			if (feature.id in syncedValue) {
				delete syncedValue[feature.id];
			}

			return storage.set({
				[FEATURE_STORAGE_KEY]: syncedValue,
			});
		});
	}

	return storage.get(FEATURE_STORAGE_KEY).then((data) => {
		const syncedValue = data?.[FEATURE_STORAGE_KEY] ?? {};

		for (const key in syncedValue) {
			if (!(key in features)) {
				delete syncedValue[key];
			}
		}

		return storage.set({
			[FEATURE_STORAGE_KEY]: {
				...syncedValue,
				[feature.id]: value,
			},
		});
	});
}

export function removeFeaturesValues<T extends AnyFeature["id"]>(
	_featureIds: T | T[],
): Promise<void> {
	const featureIds = typeof _featureIds === "string" ? [_featureIds] : _featureIds;
	for (const featureId of featureIds) {
		const feature = features[featureId];

		handleFeatureValueChange(feature, getFeatureDefaultValue(feature));
	}

	return storage.get(FEATURE_STORAGE_KEY).then((data) => {
		const syncedValue = data?.[FEATURE_STORAGE_KEY] ?? {};
		for (const featureId of featureIds) {
			if (featureId in syncedValue) {
				delete syncedValue[featureId];
			}
		}
	});
}

export async function multigetFeaturesValues<T extends AnyFeature["id"]>(
	featureIds: T[],
	uncached?: boolean,
): Promise<{
	[U in T]: FeatureValue<(typeof features)[U]>;
}> {
	const obj = {} as {
		[U in T]: FeatureValue<(typeof features)[U]>;
	};

	const promises: Promise<void>[] = [];
	for (const featureId of featureIds) {
		promises.push(
			getFeatureValue(featureId, uncached).then((value) => {
				// @ts-expect-error: Fine
				obj[featureId as T] = value;
			}),
		);
	}

	await Promise.all(promises);
	return obj;
}

export function featureValueIs<
	T extends AnyFeature["id"],
	U extends FeatureValue<(typeof features)[T]>,
	V extends boolean,
	X = unknown,
>(
	featureId: T,
	values: U | U[],
	callback: (value: V extends true ? Exclude<FeatureValue<(typeof features)[T]>, U> : U) => X,
	not?: V,
): Promise<X | undefined | void> {
	return getFeatureValue<T, U>(featureId)
		.then((value) => {
			if (value === undefined) return;

			const includes = Array.isArray(values) ? values.includes(value) : values === value;
			if (not ? !includes : includes) {
				return callback(value) as X;
			}
		})
		.catch(() => {});
}

export function featureValueIsLater<
	T extends AnyFeature["id"],
	U extends FeatureValue<(typeof features)[T]>,
	V extends boolean,
	X extends () => void,
	Y extends U extends unknown[] ? [U[0]] : U,
>(
	featureId: T,
	values: Y | Y[],
	callback: (
		value: V extends true ? Exclude<FeatureValue<(typeof features)[T]>, U> : U,
	) => MaybePromise<X>,
	not?: V,
) {
	let prevReturnValue: X | undefined | void;

	const getData = () =>
		getFeatureValue<T, U>(featureId)
			.then(async (value) => {
				if (value === undefined) return;

				const includes =
					Array.isArray(value) && Array.isArray(values)
						? value[0] === values[0]
						: Array.isArray(values)
							? values.includes(value)
							: values === value;
				if (not ? !includes : includes) {
					prevReturnValue = (await callback(value)) as X;
				} else {
					prevReturnValue?.();
				}
			})
			.catch(() => {});
	getData();

	return [onFeatureValueUpdate([featureId], getData), getData];
}

export function featureValuesAre<
	T extends {
		[key in AnyFeature["id"]]?: {
			values: FeatureValue<(typeof features)[key]>[];
			callback: (value: FeatureValue<(typeof features)[key]>) => unknown;
			not?: boolean;
		};
	},
>(features: T) {
	for (const key in features) {
		if (!features[key as AnyFeature["id"]]) continue;

		featureValueIs(
			key as AnyFeature["id"],
			// @ts-expect-error: Fine
			features[key as AnyFeature["id"]]!.values,
			features[key as AnyFeature["id"]]!.callback,
			features[key as AnyFeature["id"]]!.not,
		);
	}
}

export function compareFeatureValues(
	oldValue?: FeatureValue<AnyFeature>,
	newValue?: FeatureValue<AnyFeature>,
) {
	if (Array.isArray(oldValue) && Array.isArray(newValue)) {
		return (
			oldValue[0] !== newValue[0] || oldValue[1] !== newValue[1] || newValue[1] === undefined
		);
	}

	return oldValue !== newValue;
}
