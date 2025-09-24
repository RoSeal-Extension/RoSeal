import {
	multigetProfileInsights,
	type UserProfileInsightView,
} from "../requests/services/users.ts";
import { BatchRequestProcessor, type ResponseItem } from "./batchRequestProcessor.ts";

const MAX_ATTEMPTS_PER_ITEM = 2;
const MAX_REQUESTS_PER_BATCH = 1;
const MAX_ITEMS_PER_REQUEST = 50;

export type UserProfileInsightsRequest = {
	userId: number;
	refreshId?: number;
};

export type UserProfileInsightsResponse = MappedOmit<UserProfileInsightView, "targetUser"> & {
	fromCache?: boolean;
};

export const profileInsightsProcessor = new BatchRequestProcessor({
	maxItemAttempts: MAX_ATTEMPTS_PER_ITEM,
	maxRequestsPerBatch: MAX_REQUESTS_PER_BATCH,
	processRequest: (data: UserProfileInsightsRequest[]) => {
		return multigetProfileInsights({
			rankingStrategy: "tc_info_boost",
			userIds: data.map((item) => item.userId),
		});
	},

	getRequestKey: (request: Partial<UserProfileInsightsRequest>) => {
		return request.userId!.toString();
	},
	transformResponse: (res, req) => {
		const result: Record<string, ResponseItem<UserProfileInsightsResponse>> = {};
		for (const item of res.userInsights) {
			result[item.targetUser] = {
				retry: false,
				value: item,
			};
		}

		for (const key in req) {
			if (!result[key]) {
				result[key] = {
					retry: false,
					value: {
						profileInsights: [],
					},
				};
			}
		}

		return result;
	},
	getRequestData: (queue) => {
		const requests: Record<string, UserProfileInsightsRequest> = {};

		let requestCount = 0;
		for (const request of queue) {
			requests[request.key] = {
				userId: request.value.userId,
			};
			requestCount++;
			if (requestCount >= MAX_ITEMS_PER_REQUEST) {
				break;
			}
		}

		return requests;
	},
});
