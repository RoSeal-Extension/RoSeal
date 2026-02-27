import type { GetOmniRecommendationsResponse } from "../helpers/requests/services/universes";
import { isExperienceBlocked } from "../utils/blockedItems";
import { blockedItemsData, allowedItemsData as allowedItemsData } from "../constants/misc";
import { invokeMessage } from "../helpers/communication/dom";

export async function handleOmniRecommendationsResponse(res: Response) {
	const blockedData = blockedItemsData.value;

	const _hasCreatorConfig =
		blockedData?.creators.length || allowedItemsData.value?.creators.length;
	const hasCreatorConfig = _hasCreatorConfig !== undefined && _hasCreatorConfig !== 0;
	const _hasExperienceConfig =
		blockedData?.experiences.ids.length ||
		blockedData?.experiences.names.length ||
		blockedData?.experiences.descriptions.length ||
		allowedItemsData.value?.experiences.ids.length ||
		hasCreatorConfig;
	const hasExperienceConfig =
		_hasExperienceConfig !== undefined &&
		_hasExperienceConfig !== 0 &&
		_hasExperienceConfig !== false;
	const _shouldExperienceRequest =
		hasCreatorConfig || blockedData?.experiences.descriptions.length;
	const shouldExperienceRequest =
		_shouldExperienceRequest !== undefined && _shouldExperienceRequest !== 0;

	if (!hasExperienceConfig) return res;

	const data = (await res.clone().json()) as GetOmniRecommendationsResponse;

	const checkUniverseIds: number[] = [];
	if (shouldExperienceRequest)
		for (const sort of data.sorts) {
			if (sort.recommendationList) {
				for (const item of sort.recommendationList) {
					if (item.contentType === "Game") {
						checkUniverseIds.push(item.contentId);
					}
				}
			}
		}
	const checkUniverseData = shouldExperienceRequest
		? await invokeMessage("checkBlockedUniverses", {
				ids: checkUniverseIds,
			})
		: undefined;

	for (const sort of data.sorts) {
		if (sort.recommendationList) {
			for (let i = 0; i < sort.recommendationList.length; i++) {
				const item = sort.recommendationList[i];
				if (item.contentType === "Game") {
					const universe = data.contentMetadata?.Game?.[item.contentId];

					if (
						isExperienceBlocked(
							item.contentId,
							undefined,
							undefined,
							universe?.name,
							undefined,
							checkUniverseData,
						)
					) {
						sort.recommendationList.splice(i, 1);
						i--;
					}
				}
			}
		}
	}

	return new Response(JSON.stringify(data), res);
}
