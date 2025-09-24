import { getFeatureAccess } from "src/ts/helpers/requests/services/testService";
import usePromise from "./usePromise";

export default function useAMPFeature(
	featureName: string,
	extraParameters?: Record<string, unknown>[],
	effects?: unknown[],
) {
	const [value] = usePromise(
		() => getFeatureAccess({ featureName, extraParameters }),
		[featureName, ...(effects || [])],
	);

	return value;
}
