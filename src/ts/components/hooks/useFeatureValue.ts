import { type Signal, useSignal } from "@preact/signals";
import { type Inputs, useEffect, useState } from "preact/hooks";
import { onFeatureValueUpdate } from "src/ts/helpers/features/features";
import type { AnyFeature, FeatureValue, features } from "src/ts/helpers/features/featuresData";
import { currentPermissions } from "src/ts/helpers/permissions";
import {
	compareFeatureValues,
	getFeatureValue,
	setFeatureValue,
} from "../../helpers/features/helpers";
import useDidMountEffect from "./useDidMountEffect";

export default function useFeatureValue<
	T extends AnyFeature["id"],
	U extends FeatureValue<(typeof features)[T]> | undefined,
>(
	featureId: T,
	defaultValue: NoInfer<U>,
	dependencies: Inputs = [],
	display?: boolean,
): [value: U, setValue: (newValue: U) => void, signal: Signal<U>, fetched: boolean] {
	const value = useSignal<U>(defaultValue);
	const [fetched, setFetched] = useState(false);

	useDidMountEffect(() => {
		getFeatureValue(featureId, undefined, display).then((newValue) => {
			value.value = newValue as U;
		});
	}, [currentPermissions.value]);

	useEffect(() => {
		if (compareFeatureValues(defaultValue, value.value)) {
			value.value = defaultValue;
		}

		getFeatureValue(featureId, undefined, display).then((newValue) => {
			if (!fetched) {
				setFetched(true);
			}
			value.value = newValue as U;
		});

		return onFeatureValueUpdate([featureId], () => {
			getFeatureValue(featureId, undefined, display).then((newValue) => {
				value.value = newValue as U;
			});
		});
	}, [featureId, defaultValue, ...dependencies].flat());

	return [
		value.value,
		(newValue) => newValue !== undefined && setFeatureValue(featureId, newValue),
		value,
		fetched,
	];
}
