import { getRobloxUrl } from "src/ts/utils/baseUrls" with { type: "json" };
import { getOrSetCache } from "../../cache";
import { httpClient } from "../main";
import type { MarketplaceItemType } from "./marketplace";
import type { SortOrder } from "./badges";

export type TradeStatusFilter = "Inbound" | "Outbound" | "Inactive" | "Completed";

export type TradeStatus =
	| "Unknown"
	| "Open"
	| "Pending"
	| "Completed"
	| "Expired"
	| "Declined"
	| "RejectedDueToError"
	| "Countered"
	| "Processing"
	| "InterventionRequired"
	| "TwoStepVerificationRequired";

export type ListTradesRequest = {
	tradeStatusType: TradeStatusFilter;
	limit?: number;
	sortOrder?: SortOrder;
};

export type ListedTradeUser = {
	id: number;
	name: string;
	displayName: string;
};

export type ListedTrade = {
	id: number;
	user: ListedTradeUser;
	created: string;
	expiration: string;
	isActive: boolean;
	status: TradeStatus;
};

export type ListTradesResponse = {
	previousPageCursor: string | null;
	nextPageCursor: string | null;
	data: ListedTrade[];
};

export type GetTradesCountRequest = {
	tradeStatusType: TradeStatus;
};

export type GetTradesCountResponse = {
	count: number;
};

export type TradeDataOfferItem = {
	collectibleItemInstanceId: string;
	itemTarget: {
		itemType: MarketplaceItemType;
		targetId: string;
	};
	itemName: string;
	serialNumber?: number | null;
	originalPrice: number;
	recentAveragePrice: number;
	assetStock?: number | null;
	isOnHold: boolean;
};

export type TradeDataOffer = {
	user: ListedTradeUser;
	robux: number;
	items: TradeDataOfferItem[];
};

export type TradeData = {
	tradeId: number;
	status: TradeStatus;
	participantAOffer: TradeDataOffer;
	participantBOffer: TradeDataOffer;
};

export type GetTradeByIdRequest = {
	tradeId: number;
};

export type GetCanTradeWithUserRequest = {
	userId: number;
};

export type UserCanTradeStatus =
	| "Unknown"
	| "CanTrade"
	| "CannotTradeWithSelf"
	| "SenderCannotTrade"
	| "ReceiverCannotTrade"
	| "SenderPrivacyTooStrict"
	| "UsersCannotTrade"
	| "TradeAccepterNeedsFriction";

export type GetCanTradeWithUserResponse = {
	canTrade: boolean;
	status: UserCanTradeStatus;
};

export async function listTrades({
	tradeStatusType,
	...request
}: ListTradesRequest): Promise<ListTradesResponse> {
	return (
		await httpClient.httpRequest<ListTradesResponse>({
			url: `${getRobloxUrl("trades")}/v1/trades/${tradeStatusType}`,
			search: request,
			includeCredentials: true,
		})
	).body;
}

export async function getTradesCount({
	tradeStatusType,
}: GetTradesCountRequest): Promise<GetTradesCountResponse> {
	return (
		await httpClient.httpRequest<GetTradesCountResponse>({
			url: `${getRobloxUrl("trades")}/v1/trades/${tradeStatusType}/count`,
			includeCredentials: true,
		})
	).body;
}

export async function getTradeById({ tradeId }: GetTradeByIdRequest): Promise<TradeData> {
	return (
		await httpClient.httpRequest<TradeData>({
			url: `${getRobloxUrl("trades")}/v2/trades/${tradeId}`,
			includeCredentials: true,
		})
	).body;
}

export async function getCanTradeWithUser({
	userId,
}: GetCanTradeWithUserRequest): Promise<GetCanTradeWithUserResponse> {
	return getOrSetCache({
		key: ["users", userId, "canTradeWith"],
		fn: () =>
			httpClient
				.httpRequest<GetCanTradeWithUserResponse>({
					url: `${getRobloxUrl("trades")}/v1/users/${userId}/can-trade-with`,
					includeCredentials: true,
				})
				.then((res) => res.body),
	});
}
