import {
	type BatchGetAssetContentsRequestItem,
	batchGetAssetsContents,
	type RequestAssetContentsResponse,
} from "../requests/services/assets.ts";
import { BatchRequestProcessor, type ResponseItem } from "./batchRequestProcessor.ts";

const MAX_ATTEMPTS_PER_ITEM = 2;
const MAX_REQUESTS_PER_BATCH = 1;
const MAX_ITEMS_PER_REQUEST = 100;

export type AssetContentRequest = Omit<BatchGetAssetContentsRequestItem, "requestId"> & {
	refreshId?: number;
};

export const assetDeliveryProcessor = new BatchRequestProcessor({
	maxItemAttempts: MAX_ATTEMPTS_PER_ITEM,
	maxRequestsPerBatch: MAX_REQUESTS_PER_BATCH,
	processRequest: (requests: BatchGetAssetContentsRequestItem[]) => {
		return batchGetAssetsContents({
			requests,
			inBrowserRequest: true,
		});
	},
	getRequestKey: (request: Partial<AssetContentRequest>) => {
		return `${request.assetId ?? ""}:${request.version ?? ""}:${request.encoding ?? ""}:${request.accept ?? ""}:${request.assetFormat ?? ""}:${request.assetName ?? ""}:${request.assetType ?? ""}:${request.clientInsert ?? ""}:${request.contentRepresentationPriorityList ?? ""}:${request.doNotFallbackToBaselineRepresentation ?? ""}:${request.hash ?? ""}:${request.modulePlaceId ?? ""}:${request.placeId ?? ""}:${request["roblox-assetFormat"] ?? ""}:${request.scriptInsert ?? ""}:${request.serverPlaceId ?? ""}:${request.universeId ?? ""}:${request.refreshId ?? ""}`;
	},
	transformResponse: (res) => {
		const result: Record<
			string,
			ResponseItem<RequestAssetContentsResponse & { fromCache?: boolean }>
		> = {};
		for (const item of res) {
			result[item.requestId] = {
				retry: false,
				value: item,
			};
		}

		return result;
	},
	getRequestData: (queue) => {
		const requests: Record<string, BatchGetAssetContentsRequestItem> = {};

		let requestCount = 0;
		for (const request of queue) {
			requests[request.key] = {
				...request.value,
				requestId: request.key as string,
			};
			requestCount++;

			if (requestCount >= MAX_ITEMS_PER_REQUEST) break;
		}

		return requests;
	},
});

export type { BatchGetAssetContentsRequestItem, RequestAssetContentsResponse };
