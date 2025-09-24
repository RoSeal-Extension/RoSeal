import DeepLinkParser from "@roseal/roblox-deeplink-parser";
import { lazyLoad } from "./lazyLoad";
import { getRobloxUrl } from "./baseUrls" with { type: "macro" };
import { getPlaceUniverseId } from "../helpers/requests/services/places";
import { multigetUniversesByIds } from "../helpers/requests/services/universes";

export const DISALLOWED_DEEP_LINKS_PARAMS = ["browserTrackerId" as const];

export const deepLinksParser = lazyLoad(() => {
	const parser = new DeepLinkParser({
		urls: {
			robloxUrl: getRobloxUrl("www"),
			robloxApiDomain: getRobloxUrl(""),
		},
		fns: {
			getPlaceUniverseId: (placeId) => getPlaceUniverseId({ placeId }),
			getUniverseRootPlaceId: (universeId) =>
				multigetUniversesByIds({
					universeIds: [universeId],
				}).then((data) => data[0].rootPlaceId ?? null),
		},
		disallowedParams: {
			joinPlace: DISALLOWED_DEEP_LINKS_PARAMS,
			joinUser: DISALLOWED_DEEP_LINKS_PARAMS,
		},
	});

	return parser;
});
