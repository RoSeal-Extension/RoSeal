import { type Inputs, useEffect, useState } from "preact/hooks";
import {
	profileProcessor,
	type UserProfileRequest,
	type UserProfileResponse,
} from "../../helpers/processors/profileProcessor.ts";

export type { UserProfileResponse };

export default function useProfilesData(
	request?: UserProfileRequest[],
	inputs: Inputs = [],
): [UserProfileResponse[], boolean] {
	const [dataFetched, setDataFetched] = useState(false);
	const [data, setData] = useState<UserProfileResponse[]>([]);

	useEffect(() => {
		setDataFetched(false);
		const tempNewData: UserProfileResponse[] = [];
		if (request)
			for (const item of request) {
				const data = profileProcessor.getIfCached(item);
				if (data) {
					tempNewData.push(data);
				}
			}
		setData(tempNewData);

		if (!request) return;
		let cancelled = false;
		profileProcessor
			.requestBatch(request)
			.then((data) => !cancelled && setData(data))
			.finally(() => !cancelled && setDataFetched(true));

		return () => {
			cancelled = true;
		};
	}, [...(request || []), ...inputs]);

	return [data, dataFetched];
}
