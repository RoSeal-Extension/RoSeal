import { getRobloxUrl } from "src/ts/utils/baseUrls.ts" with { type: "macro" };
import { getOrSetCaches } from "../../cache.ts";
import { httpClient } from "../main.ts";
import type { SortOrder } from "./badges.ts";
import { clamp } from "src/ts/utils/misc.ts";

export type MultigetPlacesByIdsRequest = {
	placeIds: number[];
};

export type PlaceFIATPurchaseData = { localizedFiatPrice: string; basePriceId: string };

export type Place = {
	placeId: number;
	name: string;
	description: string;
	sourceName: string;
	sourceDescription: string;
	url: string;
	builder: string;
	builderId: number;
	hasVerifiedBadge: boolean;
	isPlayable: boolean;
	reasonProhibited: string;
	universeId: number;
	universeRootPlaceId: number;
	price: number;
	imageToken: string;
	fiatPurchaseData?: PlaceFIATPurchaseData;
};

export type ServerType = "Public" | "Friend";

export type ListPlaceServersRequest = {
	placeId: number;
	serverType: ServerType;
	sortOrder?: SortOrder;
	excludeFullGames?: boolean;
	limit?: number;
	cursor?: string;
};

export type PlaceServer = {
	id: string;
	maxPlayers: number;
	playing: number;
	playerTokens: string[];
	players: {
		playerToken: string;
		id: number;
		name: string;
		displayName: string;
	}[];
	fps: number;
	ping: number;
};

export type ListPlaceServersResponse = {
	nextPageCursor?: string | null;
	previousPageCursor?: string | null;
	data: PlaceServer[];
};

export type GetPlaceVotesRequest = {
	placeId: number;
};

export type GetPlaceVotesResponse = {
	totalUpVotes: number;
	totalDownVotes: number;
	hasVoted: boolean;
	vote: boolean | null;
};

export type GetPlaceUniverseIdRequest = {
	placeId: number;
};

export type GetPlaceUniverseInternalResponse = {
	universeId: number | null;
};

export async function multigetPlacesByIds({ placeIds }: MultigetPlacesByIdsRequest) {
	return getOrSetCaches({
		baseKey: ["places", "details"],
		keys: placeIds.map((id) => ({
			id,
		})),
		fn: (placeIds) => {
			const search = new URLSearchParams();
			for (const id of placeIds) {
				search.append("placeIds", id.id.toString());
			}

			return httpClient
				.httpRequest<Place[]>({
					url: getRobloxUrl("games", "/v1/games/multiget-place-details"),
					search,
					credentials: {
						type: "cookies",
						value: true,
					},
				})
				.then((res) => {
					const items: Record<number, Place> = {};
					for (const item of res.body) {
						items[item.placeId] = item;
					}

					return items;
				});
		},
		batchLimit: 50,
	});
}

export async function listPlaceServers({
	placeId,
	serverType,
	...request
}: ListPlaceServersRequest) {
	return (
		await httpClient.httpRequest<ListPlaceServersResponse>({
			url: `${getRobloxUrl("games")}/v1/games/${placeId}/servers/${serverType}`,
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function getPlaceVotesRaw({ placeId }: GetPlaceVotesRequest) {
	const data = (
		await httpClient.httpRequest<string>({
			url: `${getRobloxUrl("www")}/games/votingservice/${placeId}`,
			credentials: {
				type: "cookies",
				value: true,
			},
			expect: "text",
		})
	).body;

	return data;
}

export async function getPlaceVotes({ placeId }: GetPlaceVotesRequest) {
	const parser = new DOMParser();

	const data = parser.parseFromString(await getPlaceVotesRaw({ placeId }), "text/html");

	const section = data.querySelector("#voting-section");
	if (!section) {
		return;
	}

	const upVoted = section.querySelector(".upvote .selected") !== null;
	const downVoted = section.querySelector(".downvote .selected") !== null;

	const totalUpVotes = Number.parseInt(section.getAttribute("data-total-up-votes")!, 10);
	const totalDownVotes = Number.parseInt(section.getAttribute("data-total-down-votes")!, 10);

	return {
		totalUpVotes,
		totalDownVotes,
		upVotesRatio: clamp(totalUpVotes / (totalUpVotes + totalDownVotes), 0, 1) || 0,
		hasVoted: upVoted || downVoted,
		vote: upVoted ? true : upVoted ? false : null,
	};
}

export async function getPlaceUniverseId({ placeId }: GetPlaceUniverseIdRequest) {
	return (
		await httpClient.httpRequest<GetPlaceUniverseInternalResponse>({
			url: `${getRobloxUrl("apis")}/universes/v1/places/${placeId}/universe`,
			credentials: {
				type: "cookies",
				value: true,
			},
			errorHandling: "BEDEV2",
		})
	).body.universeId;
}
