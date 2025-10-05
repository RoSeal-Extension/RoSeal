import { getRobloxUrl } from "src/ts/utils/baseUrls.ts" with { type: "macro" };
import { getOrSetCache } from "../../cache.ts";
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

export async function getPassProductById({ passId }: GetPassByIdRequest) {
	return getOrSetCache({
		key: ["passes", passId, "productInfo"],
		fn: () =>
			httpClient
				.httpRequest<PassProductInfo>({
					url: `${getRobloxUrl("apis")}/game-passes/v1/game-passes/${passId}/product-info`,
					errorHandling: "BEDEV2",
					camelizeResponse: true,
					includeCredentials: true,
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
					errorHandling: "BEDEV2",
					camelizeResponse: true,
					includeCredentials: true,
				})
				.then((res) => res.body),
	});
}

export async function listUniversePasses({ universeId, ...request }: ListUniversePassesRequest) {
	return (
		await httpClient.httpRequest<ListUniversePassesResponse>({
			url: `${getRobloxUrl("apis")}/game-passes/v1/universes/${universeId}/game-passes`,
			search: request,
			camelizeResponse: true,
			includeCredentials: true,
		})
	).body;
}
