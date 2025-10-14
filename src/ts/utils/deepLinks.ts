import DeepLinkParser from "@roseal/roblox-deeplink-parser";
import AuthedProtoolParser from "@roseal/roblox-deeplink-parser/authedProtocol";
import { lazyLoad } from "./lazyLoad";
import { getRobloxUrl } from "./baseUrls" with { type: "macro" };
import { getPlaceUniverseId } from "../helpers/requests/services/places";
import { multigetUniversesByIds } from "../helpers/requests/services/universes";
import type { GameJoinAttemptOrigin } from "../helpers/requests/services/join";

export const DISALLOWED_DEEP_LINKS_PARAMS = ["browserTrackerId" as const];

export type AuthedProtocolType = "roblox-player" | "roblox-studio" | "roblox-studio-auth";

export const deepLinksParser = lazyLoad(() => {
	const parser = new DeepLinkParser({
		urls: {
			robloxProtocol: import.meta.env.ROBLOX_PLAYER_DEEPLINK_PROTOCOL,
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

export const authedProtocolParser = lazyLoad(
	() =>
		new AuthedProtoolParser<AuthedProtocolType, GameJoinAttemptOrigin>({
			urls: {
				robloxPlayerProtocol: import.meta.env.ROBLOX_PLAYER_PROTOCOL as AuthedProtocolType,
				robloxStudioProtocol: import.meta.env.ROBLOX_STUDIO_PROTOCOL as AuthedProtocolType,
				robloxStudioAuthProtocol: import.meta.env
					.ROBLOX_STUDIO_AUTH_PROTOCOL as AuthedProtocolType,
				placeLauncherUrl: `https://${getRobloxUrl("www", "/game/PlaceLauncher.ashx")}`,
			},
		}),
);
