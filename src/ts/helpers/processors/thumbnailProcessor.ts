import {
	type BatchThumbnailItem,
	type BatchThumbnailRequest,
	batchGetThumbnails as batchGetThumbnailsHttp,
} from "../requests/services/thumbnails.ts";
import { BatchRequestProcessor, type ResponseItem } from "./batchRequestProcessor.ts";

const MAX_ATTEMPTS_PER_ITEM = 25;
const MAX_ITEMS_PER_REQUEST = 100;
const MAX_REQUESTS_PER_BATCH = 5;
const MAX_IMAGE_ASSETS = 20;

export type ThumbnailRequest = Omit<BatchThumbnailRequest, "requestId"> & {
	isImageAsset?: boolean;
	refreshId?: number;
};

export const UNRETRYABLE_STATES = ["Completed", "Blocked", "Error"];

export const thumbnailProcessor = new BatchRequestProcessor({
	maxItemAttempts: MAX_ATTEMPTS_PER_ITEM,
	maxRequestsPerBatch: MAX_REQUESTS_PER_BATCH,
	processRequest: batchGetThumbnailsHttp,
	getRequestKey: (request: Partial<ThumbnailRequest>) => {
		return `${request.type}:${request.targetId ?? ""}:${request.token ?? ""}:${
			request.alias ?? ""
		}:${request.size ?? ""}:${request.format ?? "Webp"}:${request.isCircular ?? ""}`;
	},
	transformResponse: (res) => {
		const result: Record<
			string,
			ResponseItem<BatchThumbnailItem & { fromCache?: boolean }>
		> = {};
		for (const item of res) {
			result[item.requestId] = {
				retry: !UNRETRYABLE_STATES.includes(item.state) && item.state !== "Completed",
				value: item,
			};
		}

		return result;
	},
	getRequestData: (queue) => {
		const requests: Record<string, BatchThumbnailRequest> = {};

		let requestCount = 0;
		let imageAssets = 0;
		for (const request of queue) {
			if (!request.value.isImageAsset || imageAssets < MAX_IMAGE_ASSETS) {
				requests[request.key] = {
					format: "Webp",
					...request.value,
					isImageAsset: undefined,
					requestId: request.key as string,
				} as BatchThumbnailRequest;
				requestCount++;

				if (request.value.isImageAsset) imageAssets++;
				if (requestCount >= MAX_ITEMS_PER_REQUEST) break;
			}
		}

		return requests;
	},
});

export type { BatchThumbnailRequest, BatchThumbnailItem as ThumbnailItem };
