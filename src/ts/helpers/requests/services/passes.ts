import { getRobloxUrl } from "src/ts/utils/baseUrls.ts" with { type: "macro" };
import { getOrSetCache, getOrSetCaches } from "../../cache.ts";
import { httpClient } from "../main.ts";
import type { Agent, PriceInformation } from "./assets.ts";

export type GetPassByIdRequest = {
	passId: number;
};

export type PassCreator = {
	id: number;
	name: string | null;
	creatorType: Agent | null;
	creatorTargetId: number;
};

export type PassProductInfo = {
	targetId: number;
	productType: string;
	assetId: number;
	productId: number;
	name: string;
	description: string | null;
	assetTypeId: number;
	creator: PassCreator;
	iconImageAssetId: number;
	created: string;
	updated: string;
	priceInRobux: number | null;
	priceInTickets: number | null;
	isNew: boolean;
	isForSale: boolean;
	isPublicDomain: boolean;
	isLimited: boolean;
	isLimitedUnique: boolean;
	remaining: number | null;
	sales: number | null;
	minimumMembershipLevel: number;
	priceInformation: PriceInformation;
};

export type UniversePassesView = "Full";

export type ListUniversePassesRequest = {
	universeId: number;
	pageSize: number;
	pageToken?: string;
	passView?: UniversePassesView;
};

export type UniversePassDetailsCreator = {
	creatorType: Agent;
	creatorId: number;
	name: string;
	deprecatedId: number;
};

export type UniversePassDetails = {
	id: number;
	productId: number | null;
	name: string;
	displayName: string;
	displayDescription: string;
	price: number | null;
	isOwned: boolean;
	creator: UniversePassDetailsCreator | null;
	displayIconImageAssetId?: number | null;
	created: string;
	updated: string;
};

export type ListUniversePassesResponse = {
	gamePasses: UniversePassDetails[];
	nextPageToken?: string | null;
};

export type PassDetailsSalesData = {
	totalSales: number;
	salesPast7Days: number;
};

export type PassDetails = {
	gamePassId: number;
	name: string;
	description: string;
	isForSale: boolean;
	price: number | null;
	iconAssetId: number | null;
	placeId: number;
	marketPlaceFeesPercentage: number;
	gamePassSalesData: PassDetailsSalesData;
	createdTimestamp: string;
	updatedTimestamp: string;
	priceInformation: PriceInformation;
};

export type BatchPassOwnershipRequestIdentifier = {
	userId: number;
	gamePassId: number;
};

export type BatchGetPassOwnershipsRequest = {
	ownershipIdentifiers: BatchPassOwnershipRequestIdentifier[];
};

export type BatchPassOwnershipRequestIdentifierWithOwned = BatchPassOwnershipRequestIdentifier & {
	owned: boolean;
};

export async function getPassProductById({ passId }: GetPassByIdRequest) {
	return getOrSetCache({
		key: ["passes", passId, "productInfo"],
		fn: () =>
			httpClient
				.httpRequest<PassProductInfo>({
					url: `${getRobloxUrl("apis")}/game-passes/v1/game-passes/${passId}/product-info`,
					credentials: {
						type: "cookies",
						value: true,
					},
					camelizeResponse: true,
					errorHandling: "BEDEV2",
				})
				.then((res) => res.body),
	});
}

export async function getPassById({ passId }: GetPassByIdRequest) {
	return getOrSetCache({
		key: ["passes", passId, "details"],
		fn: () =>
			httpClient
				.httpRequest<PassDetails>({
					url: `${getRobloxUrl("apis")}/game-passes/v1/game-passes/${passId}/details`,
					credentials: {
						type: "cookies",
						value: true,
					},
					camelizeResponse: true,
					errorHandling: "BEDEV2",
				})
				.then((res) => res.body),
	});
}

export async function listUniversePasses({ universeId, ...request }: ListUniversePassesRequest) {
	return (
		await httpClient.httpRequest<ListUniversePassesResponse>({
			url: `${getRobloxUrl("apis")}/game-passes/v1/universes/${universeId}/game-passes`,
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
			camelizeResponse: true,
		})
	).body;
}

export async function batchGetPassOwnerships(request: BatchGetPassOwnershipsRequest) {
	return getOrSetCaches({
		baseKey: ["universes", "passes"],
		keys: request.ownershipIdentifiers.map((item) => ({
			id: `${item.userId}/${item.gamePassId}`,
			...item,
		})),
		fn: (request) =>
			httpClient
				.httpRequest<BatchGetPassOwnershipsRequest>({
					method: "POST",
					url: getRobloxUrl("apis", "/game-passes/v1/game-passes:batchGetOwnership"),
					body: {
						type: "json",
						value: {
							ownershipIdentifiers: request.map((item) => ({
								userId: item.userId,
								gamePassId: item.gamePassId,
							})),
						},
					},
					credentials: {
						type: "cookies",
						value: true,
					},
					camelizeResponse: true,
				})
				.then((data) => {
					const finalData: Record<string, BatchPassOwnershipRequestIdentifierWithOwned> =
						{};
					for (const item of data.body.ownershipIdentifiers) {
						finalData[`${item.userId}/${item.gamePassId}`] = {
							...item,
							owned: true,
						};
					}

					for (const item of request) {
						const key = `${item.userId}/${item.gamePassId}`;

						if (!(key in finalData)) {
							finalData[key] = {
								userId: item.userId,
								gamePassId: item.gamePassId,
								owned: false,
							};
						}
					}

					return finalData;
				}),
		batchLimit: 50,
	});
}
