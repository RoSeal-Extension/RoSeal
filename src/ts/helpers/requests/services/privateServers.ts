import { getExperienceLink } from "src/ts/utils/links.ts";
import { httpClient } from "../main.ts";
import type { SortOrder } from "./badges.ts";
import type { PlaceServer } from "./places.ts";
import { getRobloxUrl } from "src/ts/utils/baseUrls.ts" with { type: "macro" };
import { getOrSetCache } from "../../cache.ts";

export type GetPrivateServerStatusByCodeRequest = {
	placeId: number;
	placeName?: string;
	privateServerLinkCode?: string;
};

export type GetPrivateServerStatusByCodeResponse =
	| {
			valid: false;
	  }
	| {
			valid: true;
			accessCode: string;
			linkCode?: string;
	  };

export type ListPlacePrivateServersRequest = {
	placeId: number;
	limit?: number;
	cursor?: string;
	sortOrder?: SortOrder;
};

export type PlacePrivateServerOwner = {
	hasVerifiedBadge: boolean;
	id: number;
	name: string;
	displayName: string;
};

export type PlacePrivateServer = OmitExtend<
	PlaceServer,
	{
		id?: string;
		name: string;
		vipServerId: number;
		accessCode?: string;
		owner: PlacePrivateServerOwner;
		fps?: number;
		ping?: number;
		playing?: number;
	}
>;

export type ListPlacePrivateServersResponse = {
	gameJoinRestricted?: boolean;
	nextPageCursor?: string | null;
	previousPageCursor?: string | null;
	data: PlacePrivateServer[];
};

export type GetPrivateServerOwnerDetailsByIdRequest = {
	privateServerId: number;
};

export type PrivateServerOwnerDetailsRootPlace = {
	id: number;
	name: string;
};

export type PrivateServerOwnerDetailsExperience = {
	id: number;
	name: string;
	rootPlace: PrivateServerOwnerDetailsRootPlace;
};

export type PrivateServerSubscription = {
	active: boolean;
	expired: boolean;
	expirationDate: string;
	price: number;
	canRenew: boolean;
	hasInsufficientFunds: boolean;
	hasRecurringProfile: boolean;
	hasPriceChanged: boolean;
};

export type PrivateServerPermissionsAllowedUser = {
	id: number;
	name: string;
	displayName: string;
};

export type PrivateServerPermissions = {
	friendsAllowed: boolean;
	users: PrivateServerPermissionsAllowedUser[];
};

export type PrivateServerVoiceSettings = {
	enabled: boolean;
};

export type PrivateServerOwnerDetails = {
	id: number;
	name: string;
	game: PrivateServerOwnerDetailsExperience;
	joinCode: string | null;
	active: boolean;
	subscription: PrivateServerSubscription;
	permissions: PrivateServerPermissions;
	voiceSettings: PrivateServerVoiceSettings;
	link: string | null;
};

export type UpdatePrivateServerRequest = {
	privateServerId: number;
	name?: string;
	newJoinCode?: boolean;
	active?: boolean;
};

export type UpdatePrivateServerSubscriptionRequest = {
	privateServerId: number;
	active?: boolean;
	price?: number;
};

export type UpdatePrivateServerPermissionsRequest = {
	privateServerId: number;
} & Partial<PrivateServerPermissions>;

export type CreatePrivateServerRequest = {
	universeId: number;
	name: string;
	expectedPrice: number;
	isPurchaseConfirmed: boolean;
};

export type GetPrivateServersEnabledInUniverseRequest = {
	universeId: number;
};

export type GetPrivateServersEnabledInUniverseResponse = {
	privateServersEnabled: boolean;
};

export type GetUniversePrivateServersSettingsRequest = {
	universeId: number;
};

export type GetUniversePrivateServersSettingsResponse = {
	rootPlaceId: number;
	privateServerData: {
		isAvailable: boolean;
		price: number;
		privateServerProductId: number;
		privateServerLimit: number;
	};
};

export async function getPrivateServerStatusByCode({
	placeId,
	placeName = "unnamed",
	privateServerLinkCode,
}: GetPrivateServerStatusByCodeRequest): Promise<GetPrivateServerStatusByCodeResponse> {
	const data = (
		await httpClient.httpRequest<Document>({
			url: getExperienceLink(placeId, placeName),
			search: {
				privateServerLinkCode,
			},
			credentials: {
				type: "cookies",
				value: true,
			},
			expect: "dom",
		})
	).body;

	const script = Array.from(data.body.querySelectorAll("script")).find((item) =>
		item.innerText.includes("joinPrivateGame"),
	);
	if (!script) {
		return {
			valid: false,
		};
	}

	const accessCode = script.innerText.match(/joinPrivateGame\(\d+?, '(.+?)', '.+?'\)/)?.[1];
	if (!accessCode) return { valid: false };

	return { valid: true, accessCode, linkCode: privateServerLinkCode };
}

export async function listPlacePrivateServers({
	placeId,
	...request
}: ListPlacePrivateServersRequest) {
	return (
		await httpClient.httpRequest<ListPlacePrivateServersResponse>({
			url: `${getRobloxUrl("games")}/v1/games/${placeId}/private-servers`,
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function getPrivateServerOwnerDetailsById({
	privateServerId,
}: GetPrivateServerOwnerDetailsByIdRequest) {
	return (
		await httpClient.httpRequest<PrivateServerOwnerDetails>({
			url: `${getRobloxUrl("games")}/v1/vip-servers/${privateServerId}`,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function updatePrivateServer({
	privateServerId,
	...request
}: UpdatePrivateServerRequest) {
	return (
		await httpClient.httpRequest<PrivateServerOwnerDetails>({
			url: `${getRobloxUrl("games")}/v1/vip-servers/${privateServerId}`,
			method: "PATCH",
			body: {
				type: "json",
				value: request,
			},
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function updatePrivateServerSubscription({
	privateServerId,
	...request
}: UpdatePrivateServerSubscriptionRequest) {
	return (
		await httpClient.httpRequest<PrivateServerSubscription>({
			url: `${getRobloxUrl("games")}/v1/vip-servers/${privateServerId}/subscription`,
			method: "PATCH",
			body: {
				type: "json",
				value: request,
			},
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function updatePrivateServerPermissions({
	privateServerId,
	...request
}: UpdatePrivateServerPermissionsRequest) {
	return (
		await httpClient.httpRequest<PrivateServerPermissions>({
			url: `${getRobloxUrl("games")}/v1/vip-servers/${privateServerId}/permissions`,
			method: "PATCH",
			body: {
				type: "json",
				value: request,
			},
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function createPrivateServer({ universeId, ...request }: CreatePrivateServerRequest) {
	return (
		await httpClient.httpRequest<PlacePrivateServer>({
			url: `${getRobloxUrl("games")}/v1/games/vip-servers/${universeId}`,
			method: "POST",
			body: {
				type: "json",
				value: request,
			},
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function getPrivateServersEnabledInUniverse({
	universeId,
}: GetPrivateServersEnabledInUniverseRequest) {
	return getOrSetCache({
		key: ["universes", universeId, "privateServersEnabled"],
		fn: () =>
			httpClient
				.httpRequest<GetPrivateServersEnabledInUniverseResponse>({
					url: `${getRobloxUrl("games")}/v1/private-servers/enabled-in-universe/${universeId}`,
					credentials: {
						type: "cookies",
						value: true,
					},
				})
				.then((data) => data.body.privateServersEnabled),
	});
}

export async function getUniversePrivateServersSettings(
	request: GetUniversePrivateServersSettingsRequest,
) {
	return (
		await httpClient.httpRequest<GetUniversePrivateServersSettingsResponse>({
			url: getRobloxUrl("apis", "/private-servers-api/Universe-Private-Server-Settings"),
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
			errorHandling: "BEDEV2",
		})
	).body;
}
