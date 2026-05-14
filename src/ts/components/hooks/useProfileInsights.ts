import { type Inputs, useEffect, useState } from "preact/hooks";
import {
	profileInsightsProcessor,
	type UserProfileInsightsRequest,
	type UserProfileInsightsResponse,
} from "../../helpers/processors/profileInsightsProcessor";

export default function useProfileInsights(
	request?: UserProfileInsightsRequest,
	inputs: Inputs = [],
): UserProfileInsightsResponse | undefined | null {
	const [data, setData] = useState(request && profileInsightsProcessor.getIfCached(request));

	useEffect(() => {
		setData(request && profileInsightsProcessor.getIfCached(request));

		if (!request) return;
		let cancelled = false;
		profileInsightsProcessor.request(request).then((data) => !cancelled && setData(data));

		return () => {
			cancelled = true;
		};
	}, [request?.userId, ...inputs]);

	return data;
}
