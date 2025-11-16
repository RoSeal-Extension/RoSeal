import { getRobloxUrl } from "src/ts/utils/baseUrls.ts" with { type: "macro" };
import { httpClient } from "../main.ts";
import type { Agent, PriceInformation } from "./assets.ts";

export type GetDeveloperProductByIdRequest = {
	developerProductId: number;
};

export type DeveloperProductDetails = {
	id: number;
	productTypeId: number;
	isPublicDomain: boolean;
	isForSale: boolean;
	priceInRobux: number | null;
	premiumPriceInRobux: number | null;
	robloxProductId: number | null;
	targetId: number;
	assetTypeId: number | null;
	creatorId: number;
	assetGenres: number;
	assetCategories: number;
	affiliateFeePercentage: number | null;
	isNew: boolean;
	created: string;
	updated: string;
};

export type GetDeveloperProductByProductIdRequest = {
	productId: number;
};

export type ProductCreator = {
	id: number;
	name: string | null;
	creatorType: Agent | null;
	creatorTargetId: number;
};

export type ProductDetails = {
	targetId: number;
	productType: string;
	assetId: number;
	productId: number;
	name: string;
	displayName: string;
	description: string | null;
	displayDescription: string | null;
	assetTypeId: number;
	creator: ProductCreator;
	iconImageAssetId: number;
	displayIconImageAssetId: number;
	created: string;
	updated: string;
	priceInRobux: number | null;
	premiumPriceInRobux: number | null;
	priceInTickets: number | null;
	isNew: boolean;
	isForSale: boolean;
	isPublicDomain: boolean;
	isLimited: boolean;
	isLimitedUnique: boolean;
	remaining: number | null;
	sales: number | null;
	minimumMembershipLevel: number;
	priceInformation?: PriceInformation | null;
	storePageEnabled: boolean | null;
	universeId: number;
	isImmutable: boolean | null;
};

export type ListUniverseDeveloperProductsRequest = {
	universeId: number;
	limit: number;
	cursor?: string;
};

export type ListedDeveloperProduct = {
	productId: number | null;
	developerProductId: number;
	name: string;
	description: string | null;
	iconImageAssetId: number | null;
	displayName: string;
	displayDescription: string | null;
	displayIcon: number | null;
	priceInRobux: number | null;
};

export type FullListedDeveloperProduct = ListedDeveloperProduct & ProductDetails;

export type ListUniverseDeveloperProductsResponse = {
	nextPageCursor: string | null;
	developerProducts: FullListedDeveloperProduct[];
};

export type ListStorePageDeveloperProductsRequest = {
	universeId: number;
	limit: number;
	cursor?: string;
};

export type ListStorePageDeveloperProductsResponse = {
	nextPageCursor: string | null;
	developerProducts: ListedDeveloperProduct[];
};

export type ListPendingDeveloperProductTransactionsRequest = {
	placeId: number;
	playerId: number;
	status: "pending";
	locationType?: "ExperienceDetailPage";
};

export type PendingDeveloperProductTransaction = {
	playerId: number;
	placeId: number;
	gameInstanceId: string;
	receipt: string;
	actionArgs: {
		key: "productId" | "currencyTypeId" | "unitPrice";
		value: string;
	}[];
	action: "Purchase";
};

export async function getDeveloperProductById({
	developerProductId,
}: GetDeveloperProductByIdRequest) {
	return (
		await httpClient.httpRequest<DeveloperProductDetails>({
			url: `${getRobloxUrl(
				"apis",
				"/developer-products",
			)}/v1/developer-products/${developerProductId}`,
			credentials: {
				type: "cookies",
				value: true,
			},
			errorHandling: "BEDEV2",
		})
	).body;
}

export async function getDeveloperProductByProductId({
	productId,
}: GetDeveloperProductByProductIdRequest): Promise<ProductDetails> {
	return (
		await httpClient.httpRequest<ProductDetails>({
			url: `${getRobloxUrl(
				"apis",
				"/developer-products",
			)}/v1/developer-products/${productId}/details`,
			credentials: {
				type: "cookies",
				value: true,
			},
			camelizeResponse: true,
			errorHandling: "BEDEV2",
		})
	).body;
}

export async function listUniverseDeveloperProducts({
	universeId,
	...request
}: ListUniverseDeveloperProductsRequest): Promise<ListUniverseDeveloperProductsResponse> {
	return (
		await httpClient.httpRequest<ListUniverseDeveloperProductsResponse>({
			url: `${getRobloxUrl(
				"apis",
			)}/developer-products/v2/universes/${universeId}/developerproducts`,
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
			camelizeResponse: true,
			errorHandling: "BEDEV2",
		})
	).body;
}

export async function listStorePageDeveloperProducts({
	universeId,
	...request
}: ListStorePageDeveloperProductsRequest) {
	return (
		await httpClient.httpRequest<ListStorePageDeveloperProductsResponse>({
			url: `${getRobloxUrl("apis")}/experience-store/v1/universes/${universeId}/store`,
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
			camelizeResponse: true,
			errorHandling: "BEDEV2",
		})
	).body;
}

export async function listPendingDeveloperProductTransactions(
	request: ListPendingDeveloperProductTransactionsRequest,
) {
	return (
		await httpClient.httpRequest<PendingDeveloperProductTransaction[]>({
			url: getRobloxUrl("apis", "/developer-products/v1/game-transactions"),
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
			camelizeResponse: true,
			errorHandling: "BEDEV2",
		})
	).body;
}
