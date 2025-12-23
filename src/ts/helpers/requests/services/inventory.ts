import { getRobloxUrl } from "src/ts/utils/baseUrls.ts" with { type: "macro" };
import { getOrSetCache } from "../../cache.ts";
import { httpClient } from "../main.ts";
import type { Agent } from "./assets.ts";
import type { SortOrder } from "./badges.ts";
import type { AssetFavoritesRequest } from "./favorites.ts";
import type { AvatarBundleType } from "./marketplace.ts";
import type { HTTPRequestCredentials } from "@roseal/http-client";

export type InventoryItemType = "Asset" | "Bundle" | "Badge" | "GamePass";

export type UserOwnsItemRequest = {
	userId: number;
	itemType: InventoryItemType;
	itemId: number;
};

export type CollectionRequest = {
	itemType: InventoryItemType;
	itemId: number;
};

export type UserItemInstance = {
	type: InventoryItemType;
	id: number;
	name: string;
	instanceId?: number;
};

export type ListUserItemInstancesResponse = {
	previousPageCursor: string | null;
	nextPageCursor: string | null;
	data: UserItemInstance[];
};

export type ListUserInventoryAssetsRequest = {
	userId: number;
	assetTypes: string[];
	cursor?: string;
	limit?: number;
	sortOrder?: SortOrder;
	filterDisapprovedAssets?: boolean;
	showApprovedOnly?: boolean;
};

export type ListedUserInventoryAsset = {
	assetId: number;
	name: string;
	assetType: string;
	created: string;
};

export type ListUserInventoryAssetsResponse = {
	previousPageCursor: string | null;
	nextPageCursor: string | null;
	data: ListedUserInventoryAsset[];
};

export type ListedUserInventoryAssetDetailedOwner = {
	userId: number;
	username: string;
	buildersClubMembershipType: number;
};

export type ListedUserInventoryAssetDetailed = {
	expireAt?: string;
	userAssetId: number;
	assetId: number;
	assetName: string;
	collectibleItemId: string | null;
	collectibleItemInstanceId: string | null;
	serialNumber: number | null;
	owner: ListedUserInventoryAssetDetailedOwner | null;
	created: string;
	updated: string;
};

export type ListUserInventoryAssetsDetailedRequest = {
	userId: number;
	assetTypeId: number;
	cursor?: string;
	limit?: number;
	sortOrder?: SortOrder;
};

export type ListUserInventoryAssetsDetailedResponse = {
	previousPageCursor: string | null;
	nextPageCursor: string | null;
	data: ListedUserInventoryAssetDetailed[];
};

export type ListedUserInventoryBundleCreator = {
	id: number;
	name: string;
	type: Agent;
	hasVerifiedBadge: boolean;
};

export type ListedUserInventoryBundle = {
	id: number;
	name: string;
	bundleType: AvatarBundleType;
	creator: ListedUserInventoryBundleCreator;
};

export type ListUserInventoryBundlesRequest = {
	userId: number;
	sortOrder?: SortOrder;
	cursor?: string;
	limit?: number;
};

export type ListUserInventoryBundlesResponse = {
	previousPageCursor: string | null;
	nextPageCursor: string | null;
	data: ListedUserInventoryBundle[];
};

export type ListUserInventoryBundlesSubtypeRequest = ListUserInventoryBundlesRequest & {
	subtype: AvatarBundleType;
};

export type UserInventoryCategoryItem = {
	name: string;
	displayName: string;
	filter: string | null;
	id: number;
	type: "AssetType" | "Bundle";
	categoryType: string;
};

export type UserInventoryCategory = {
	name: string;
	displayName: string;
	categoryType: string;
	items: UserInventoryCategoryItem[];
};

export type ListUserInventoryCategoriesResponse = {
	categories: UserInventoryCategory[];
};

export type ListOpenCloudUserInventoryItemsRequest = {
	credentials: HTTPRequestCredentials;
	userId: number;
	filter: string;
	maxPageSize?: number;
	pageToken?: string;
};

export type OpenCloudInventoryItemCollectibleState =
	| "COLLECTIBLE_ITEM_INSTANCE_STATE_UNSPECIFIED"
	| "AVAILABLE"
	| "HOLD";

export type OpenCloudInventoryItem = {
	path: string;
	assetDetails?: {
		assetId: string;
		inventoryItemAssetType: string;
		instanceId?: string;
		collectibleDetails?: {
			itemId: string;
			instanceId: string;
			instanceState: OpenCloudInventoryItemCollectibleState;
			serialNumber: number;
		};
	};
	addTime?: string;
};

export type ListOpenCloudUserInventoryItemsResponse = {
	inventoryItems: OpenCloudInventoryItem[];
	nextPageToken?: string;
};

export type ListUserPlacesTab = "Created" | "MyGames" | "OtherGames" | "Purchased";

export type ListUserInventoryPlacesRequest = {
	placesTab: ListUserPlacesTab;
	userId: number;
	itemsPerPage: number;
	cursor?: string;
};

export type ListedUserInventoryPlaceCreator = {
	id: number;
	name: string;
	type: Agent;
};

export type ListedUserInventoryPlace = {
	universeId: number;
	placeId: number;
	name: string;
	creator: ListedUserInventoryPlaceCreator;
	priceInRobux: number | null;
};

export type ListUserInventoryPlacesResponse = {
	previousPageCursor: string | null;
	nextPageCursor: string | null;
	data: ListedUserInventoryPlace[];
};

export type ListUserPrivateServersTab = "MyPrivateServers" | "OtherPrivateServers";

export type ListUserPrivateServersRequest = {
	privateServersTab: ListUserPrivateServersTab;
	itemsPerPage: number;
	cursor?: string;
};

export type PrivateServerInventoryItem = {
	active: boolean;
	universeId: number;
	placeId: number;
	name: string;
	ownerId: number;
	ownerName: string;
	priceInRobux: number | null;
	privateServerId: number;
	expirationDate: string;
	willRenew: boolean;
	universeName: string;
};

export type ListUserPrivateServersResponse = {
	nextPageCursor?: string | null;
	previousPageCursor?: string | null;
	data: PrivateServerInventoryItem[];
};

export type ListUserPassesRequest = {
	userId: number;
	count: number;
	exclusiveStartId: number | undefined;
};

export type ListedUserPassCreator = {
	creatorType: Agent;
	creatorId: number;
	name: string;
};

export type ListedUserPass = {
	gamePassId: number;
	iconAssetId: number;
	name: string;
	description: string;
	isForSale: boolean;
	price: number | null;
	creator: ListedUserPassCreator;
};

export type ListUserPassesResponse = {
	gamePasses: ListedUserPass[];
};

export type DeletePassFromInventoryRequest = {
	passId: number;
};

export type ListUserCollectibleAssetsRequest = {
	userId: number;
	limit?: number;
	assetType?: number;
	cursor?: string;
	sortOrder?: SortOrder;
};

export type ListedUserCollectibleAsset = {
	userAssetId: number;
	serialNumber?: number;
	assetId: number;
	name: string;
	recentAveragePrice: number;
	originalPrice: number;
	assetStock: number;
	buildersClubMembershipType: 0;
	isOnHold: boolean;
};

export type ListUserCollectibleAssetsResponse = {
	previousPageCursor?: string | null;
	nextPageCursor?: string | null;
	data: ListedUserCollectibleAsset[];
};

export async function userOwnsItem({ userId, itemType, itemId }: UserOwnsItemRequest) {
	return getOrSetCache({
		key: ["users", userId, "owns", itemType, itemId],
		fn: async () => {
			return (
				await httpClient.httpRequest<boolean>({
					url: `${getRobloxUrl(
						"inventory",
					)}/v1/users/${userId}/items/${itemType}/${itemId}/is-owned`,
					credentials: {
						type: "cookies",
						value: true,
					},
				})
			).body;
		},
	});
}

export async function listUserItemInstances({
	userId,
	itemType,
	itemId,
}: UserOwnsItemRequest): Promise<ListUserItemInstancesResponse> {
	return (
		await httpClient.httpRequest<ListUserItemInstancesResponse>({
			url: `${getRobloxUrl("inventory")}/v1/users/${userId}/items/${itemType}/${itemId}`,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function addItemToCollection({ itemType, itemId }: CollectionRequest): Promise<void> {
	await httpClient.httpRequest<void>({
		method: "POST",
		url: `${getRobloxUrl("inventory")}/v1/collections/items/${itemType}/${itemId}`,
		expect: "none",
		credentials: {
			type: "cookies",
			value: true,
		},
	});
}

export async function removeItemFromCollection({
	itemType,
	itemId,
}: CollectionRequest): Promise<void> {
	await httpClient.httpRequest<void>({
		method: "DELETE",
		url: `${getRobloxUrl("inventory")}/v1/collections/items/${itemType}/${itemId}`,
		expect: "none",
		credentials: {
			type: "cookies",
			value: true,
		},
	});
}

export async function deleteAssetFromInventory({ assetId }: AssetFavoritesRequest): Promise<void> {
	await httpClient.httpRequest({
		method: "DELETE",
		url: `${getRobloxUrl("inventory")}/v2/inventory/asset/${assetId}`,
		credentials: {
			type: "cookies",
			value: true,
		},
		expect: "none",
	});
}

export async function listUserInventoryAssets({
	userId,
	...request
}: ListUserInventoryAssetsRequest) {
	return (
		await httpClient.httpRequest<ListUserInventoryAssetsResponse>({
			url: `${getRobloxUrl("inventory")}/v2/users/${userId}/inventory`,
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function listUserInventoryAssetsDetailed({
	userId,
	assetTypeId,
	...request
}: ListUserInventoryAssetsDetailedRequest) {
	return (
		await httpClient.httpRequest<ListUserInventoryAssetsDetailedResponse>({
			url: `${getRobloxUrl("inventory")}/v2/users/${userId}/inventory/${assetTypeId}`,
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function listUserInventoryBundles({
	userId,
	...request
}: ListUserInventoryBundlesRequest) {
	return (
		await httpClient.httpRequest<ListUserInventoryBundlesResponse>({
			url: `${getRobloxUrl("catalog")}/v1/users/${userId}/bundles`,
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function listUserInventoryBundlesSubtype({
	userId,
	subtype,
	...request
}: ListUserInventoryBundlesSubtypeRequest) {
	return (
		await httpClient.httpRequest<ListUserInventoryBundlesResponse>({
			url: `${getRobloxUrl("catalog")}/v1/users/${userId}/bundles/${subtype}`,
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function listOpenCloudUserInventoryItems({
	credentials,
	userId,
	...request
}: ListOpenCloudUserInventoryItemsRequest): Promise<ListOpenCloudUserInventoryItemsResponse> {
	return (
		await httpClient.httpRequest<ListOpenCloudUserInventoryItemsResponse>({
			url: `${getRobloxUrl("apis")}/cloud/v2/users/${userId}/inventory-items`,
			search: request,
			credentials,
			errorHandling: "BEDEV2",
		})
	).body;
}

export async function listUserInventoryPlaces({
	userId,
	...request
}: ListUserInventoryPlacesRequest) {
	return (
		await httpClient.httpRequest<ListUserInventoryPlacesResponse>({
			url: `${getRobloxUrl("inventory")}/v1/users/${userId}/places/inventory`,
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function listUserPrivateServers(request: ListUserPrivateServersRequest) {
	return (
		await httpClient.httpRequest<ListUserPrivateServersResponse>({
			url: getRobloxUrl("games", "/v1/private-servers/my-private-servers"),
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function listUserPasses({ userId, ...request }: ListUserPassesRequest) {
	return (
		await httpClient.httpRequest<ListUserPassesResponse>({
			url: `${getRobloxUrl("apis")}/game-passes/v1/users/${userId}/game-passes`,
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function deletePassFromInventory({ passId }: DeletePassFromInventoryRequest) {
	await httpClient.httpRequest<void>({
		url: `${getRobloxUrl("apis")}/game-passes/v1/game-passes/${passId}:revokeOwnership`,
		method: "POST",
		credentials: {
			type: "cookies",
			value: true,
		},
		expect: "none",
		errorHandling: "BEDEV2",
	});
}

export async function listUserCollectibleAssets({
	userId,
	...request
}: ListUserCollectibleAssetsRequest) {
	return (
		await httpClient.httpRequest<ListUserCollectibleAssetsResponse>({
			url: `${getRobloxUrl("inventory")}/v1/users/${userId}/assets/collectibles`,
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}
