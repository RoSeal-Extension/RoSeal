import { getRobloxUrl } from "src/ts/utils/baseUrls.ts" with { type: "macro" };
import { getOrSetCaches } from "../../cache.ts";
import { httpClient } from "../main.ts";

export type ListUserFollowingsRequest = {
	userId: number;
};

export type ListUserFollowingsResponse = {
	followerType: "User";
	followerId: number;
	sourceType: "Universe";
	followedSources: Record<string, string>;
};

export type RemoveUserFollowingsRequest = {
	universeId: number;
	userId: number;
};

export type ListLastUniversesUpdatesRequest = {
	universeIds: number[];
	sinceDateTime?: string;
};

export type UniverseUpdate = {
	universeId: number;
	rootPlaceId: number;
	createdOn: string;
	createdOnKey: string;
	content: string;
	universeName: string;
};

export async function listUserUniverseFollowings({ userId }: ListUserFollowingsRequest) {
	return (
		await httpClient.httpRequest<ListUserFollowingsResponse>({
			url: `${getRobloxUrl("followings")}/v2/users/${userId}/universes`,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function removeUserUniverseFollowing({
	userId,
	universeId,
}: RemoveUserFollowingsRequest): Promise<void> {
	await httpClient.httpRequest<void>({
		method: "DELETE",
		url: `${getRobloxUrl("followings")}/v1/users/${userId}/universes/${universeId}`,
		credentials: {
			type: "cookies",
			value: true,
		},
		expect: "none",
	});
}

export async function addUserUniverseFollowing({
	userId,
	universeId,
}: RemoveUserFollowingsRequest): Promise<void> {
	await httpClient.httpRequest<void>({
		method: "POST",
		url: `${getRobloxUrl("followings")}/v1/users/${userId}/universes/${universeId}`,
		credentials: {
			type: "cookies",
			value: true,
		},
		expect: "none",
	});
}

export async function listLastUniversesUpdates({
	universeIds,
	sinceDateTime,
}: ListLastUniversesUpdatesRequest) {
	return getOrSetCaches({
		baseKey: ["universeUpdates", sinceDateTime],
		keys: universeIds.map((id) => ({
			id,
		})),
		fn: (universeIds) => {
			const search = new URLSearchParams();
			if (sinceDateTime) {
				search.set("sinceDateTime", sinceDateTime);
			}
			for (const universeId of universeIds) {
				search.append("universeIds", universeId.id.toString());
			}

			return httpClient
				.httpRequest<UniverseUpdate[]>({
					url: `${getRobloxUrl(
						"notifications",
					)}/v2/stream-notifications/get-latest-game-updates`,
					search,
					credentials: {
						type: "cookies",
						value: true,
					},
				})
				.then((data) => {
					const items: Record<number, UniverseUpdate> = {};
					for (const item of data.body) {
						items[item.universeId] = item;
					}

					return items;
				});
		},
		batchLimit: 50,
	});
}
