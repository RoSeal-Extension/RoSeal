import { presenceTypes } from "src/ts/constants/presence.ts";
import {
	multigetUsersPresences,
	type OnlineFriend,
	type UserPresence,
} from "../requests/services/users.ts";
import { BatchRequestProcessor, type ResponseItem } from "./batchRequestProcessor.ts";

const MAX_ATTEMPTS_PER_ITEM = 2;
const MAX_REQUESTS_PER_BATCH = 1;
const MAX_ITEMS_PER_REQUEST = 50;

export type UserPresenceRequest = {
	userId: number;
	refreshId?: number;
};

export type UserProfileResponse = UserPresence & {
	fromCache?: boolean;
};

export const presenceProcessor = new BatchRequestProcessor({
	maxItemAttempts: MAX_ATTEMPTS_PER_ITEM,
	maxRequestsPerBatch: MAX_REQUESTS_PER_BATCH,
	processRequest: (data: UserPresenceRequest[]) => {
		return multigetUsersPresences({
			userIds: data.map((item) => item.userId),
		});
	},
	getRequestKey: (request: Partial<UserPresenceRequest>) => {
		return request.userId!.toString();
	},
	transformResponse: (res) => {
		const result: Record<string, ResponseItem<UserProfileResponse>> = {};
		for (const item of res.userPresences) {
			result[item.userId] = {
				retry: false,
				value: item,
			};
		}

		return result;
	},
	getRequestData: (queue) => {
		const requests: Record<string, UserPresenceRequest> = {};

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

export function updatePresenceFromOnlineFriends(data: OnlineFriend[]): UserPresence[] {
	const newData: UserPresence[] = [];
	for (const item of data) {
		const presenceType = presenceTypes.find(
			(type) => type.type === item.userPresence.userPresenceType,
		);

		if (presenceType) {
			const newItem = {
				userPresenceType: presenceType.typeId,
				gameId: item.userPresence.gameInstanceId,
				placeId: item.userPresence.placeId,
				rootPlaceId: item.userPresence.rootPlaceId,
				universeId: item.userPresence.universeId,
				userId: item.id,
				lastLocation: item.userPresence.lastLocation,
			};

			newData.push(newItem);
			presenceProcessor.updateItem(
				{
					userId: item.id,
				},
				newItem,
			);
		}
	}

	return newData;
}
