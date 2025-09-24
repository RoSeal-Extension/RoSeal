import {
	profileProcessor,
	type UserProfileRequest,
	type UserProfileResponse,
} from "../../helpers/processors/profileProcessor.ts";
import { type Inputs, useState, useEffect } from "preact/hooks";

export type { UserProfileResponse };

export default function useProfileData(
	request?: UserProfileRequest,
	inputs: Inputs = [],
): UserProfileResponse | undefined | null {
	const [data, setData] = useState(request && profileProcessor.getIfCached(request));

	useEffect(() => {
		setData(request && profileProcessor.getIfCached(request));

		if (!request) return;
		let cancelled = false;
		profileProcessor.request(request).then((data) => !cancelled && setData(data));

		return () => {
			cancelled = true;
		};
	}, [request?.userId, ...inputs]);

	return data;
}
