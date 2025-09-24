import { invokeMessage } from "../communication/dom";
import type { AnyFeature, FeatureValue, features } from "./featuresData";

export function getFeatureValueInject<
	T extends AnyFeature["id"],
	U extends FeatureValue<(typeof features)[T]> | undefined =
		| FeatureValue<(typeof features)[T]>
		| undefined,
>(featureId: T, uncached?: boolean) {
	return invokeMessage("getFeatureValue", {
		featureId,
		uncached,
	}) as Promise<U>;
}

export function featureValueIsInject<
	T extends AnyFeature["id"],
	U extends FeatureValue<(typeof features)[T]>,
	V extends boolean,
	W = unknown,
>(
	featureId: T,
	values: U | U[],
	callback: (value: V extends true ? Exclude<FeatureValue<(typeof features)[T]>, U> : U) => W,
	not?: V,
): Promise<W | undefined> {
	return getFeatureValueInject<T, U>(featureId).then((value) => {
		if (value === undefined) return;

		const includes = Array.isArray(values) ? values.includes(value) : values === value;
		if (not ? !includes : includes) {
			return callback(value) as W;
		}
	});
}
