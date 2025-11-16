import { getRobloxUrl } from "src/ts/utils/baseUrls.ts" with { type: "macro" };
import { httpClient } from "../main.ts";
import type { SortOrder } from "./badges.ts";
import type { AvatarBundle, AvatarItem } from "./marketplace.ts";
import type { ListedAgentUniverse } from "./universes.ts";

export type ListUserFavoritedExperiencesRequest = {
	userId: number;
	limit?: number;
	sortOrder?: SortOrder;
	cursor?: string;
};

export type ListUserFavoritedExperiencesResponse = {
	data: ListedAgentUniverse[];
	nextPageCursor?: string | null;
	previousPageCursor?: string | null;
};

export type AssetFavoritesRequest = {
	assetId: number;
};

export type AssetFavoritesWithUserRequest = AssetFavoritesRequest & {
	userId: number;
};

export type GetUserAssetFavoriteResponse = {
	assetId: number;
	userId: number;
	created: string;
};

export type BundleFavoritesRequest = {
	bundleId: number;
};

export type BundleFavoritesWithUserRequest = BundleFavoritesRequest & {
	userId: number;
};

export type GetUserBundleFavoriteResponse = {
	bundleId: number;
	userId: number;
	created: string;
};

export type ListUserFavoritedAvatarBundlesRequest = {
	userId: number;
	bundleTypeId: number;
	itemsPerPage?: number;
	cursor?: string;
	isPrevious?: boolean;
};

export type ListUserFavoritedAvatarBundlesResponse = {
	favorites: AvatarBundle[];
	moreFavorites: boolean;
	nextCursor?: string | null;
	previousCursor?: string | null;
};

export type ListUserFavoritedAvatarAssetsRequest = {
	userId: number;
	assetTypeId: number;
	limit?: number;
	cursor?: string;
	sortOrder?: SortOrder;
};

export type ListUserFavoritedAvatarAssetsResponse = {
	previousPageCursor?: string | null;
	nextPageCursor?: string | null;
	data: AvatarItem<"Asset">[];
};

export async function listUserFavoritedExperiences({
	userId,
	...request
}: ListUserFavoritedExperiencesRequest): Promise<ListUserFavoritedExperiencesResponse> {
	return (
		await httpClient.httpRequest<ListUserFavoritedExperiencesResponse>({
			url: `${getRobloxUrl("games")}/v2/users/${userId}/favorite/games`,
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function getAssetFavoritesCount({ assetId }: AssetFavoritesRequest): Promise<number> {
	return (
		await httpClient.httpRequest<number>({
			url: `${getRobloxUrl("catalog")}/v1/favorites/assets/${assetId}/count`,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function getUserAssetFavorite({
	assetId,
	userId,
}: AssetFavoritesWithUserRequest): Promise<GetUserAssetFavoriteResponse | null> {
	return (
		await httpClient.httpRequest<GetUserAssetFavoriteResponse | null>({
			url: `${getRobloxUrl(
				"catalog",
			)}/v1/favorites/users/${userId}/assets/${assetId}/favorite`,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function addUserAssetFavorite({
	assetId,
	userId,
}: AssetFavoritesWithUserRequest): Promise<void> {
	await httpClient.httpRequest<void>({
		method: "POST",
		url: `${getRobloxUrl("catalog")}/v1/favorites/users/${userId}/assets/${assetId}/favorite`,
		credentials: {
			type: "cookies",
			value: true,
		},
	});
}

export async function removeUserAssetFavorite({
	assetId,
	userId,
}: AssetFavoritesWithUserRequest): Promise<void> {
	await httpClient.httpRequest<void>({
		method: "DELETE",
		url: `${getRobloxUrl("catalog")}/v1/favorites/users/${userId}/assets/${assetId}/favorite`,
		credentials: {
			type: "cookies",
			value: true,
		},
	});
}

export async function getBundleFavoritesCount({
	bundleId,
}: BundleFavoritesRequest): Promise<number> {
	return (
		await httpClient.httpRequest<number>({
			url: `${getRobloxUrl("catalog")}/v1/favorites/bundles/${bundleId}/count`,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function getUserBundleFavorite({
	bundleId,
	userId,
}: BundleFavoritesWithUserRequest): Promise<GetUserBundleFavoriteResponse | null> {
	return (
		await httpClient.httpRequest<GetUserBundleFavoriteResponse | null>({
			url: `${getRobloxUrl("catalog")}/v1/favorites/users/${userId}/bundles/${bundleId}/favorite`,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}
export async function addUserBundleFavorite({
	bundleId,
	userId,
}: BundleFavoritesWithUserRequest): Promise<void> {
	await httpClient.httpRequest<void>({
		method: "POST",
		url: `${getRobloxUrl("catalog")}/v1/favorites/users/${userId}/bundles/${bundleId}/favorite`,
		credentials: {
			type: "cookies",
			value: true,
		},
	});
}

export async function removeUserBundleFavorite({
	bundleId,
	userId,
}: BundleFavoritesWithUserRequest): Promise<void> {
	await httpClient.httpRequest<void>({
		method: "DELETE",
		url: `${getRobloxUrl("catalog")}/v1/favorites/users/${userId}/bundles/${bundleId}/favorite`,
		credentials: {
			type: "cookies",
			value: true,
		},
	});
}

export async function listUserFavoritedAvatarBundles({
	userId,
	bundleTypeId,
}: ListUserFavoritedAvatarBundlesRequest): Promise<ListUserFavoritedAvatarBundlesResponse> {
	return (
		await httpClient.httpRequest<ListUserFavoritedAvatarBundlesResponse>({
			url: `${getRobloxUrl("catalog")}/v1/favorites/users/${userId}/favorites/${bundleTypeId}/bundles`,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function listUserFavoritedAvatarAssets({
	userId,
	assetTypeId,
}: ListUserFavoritedAvatarAssetsRequest): Promise<ListUserFavoritedAvatarAssetsResponse> {
	return (
		await httpClient.httpRequest<ListUserFavoritedAvatarAssetsResponse>({
			url: `${getRobloxUrl("catalog")}/v1/favorites/users/${userId}/favorites/${assetTypeId}/assets`,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}
