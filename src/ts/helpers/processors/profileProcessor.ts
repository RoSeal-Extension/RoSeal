import { getFeatureValue } from "../features/helpers.ts";
import {
	multigetProfileData,
	multigetUsersByIds,
	type ProfileDetail,
	type ProfileField,
	type ProfileFieldName,
} from "../requests/services/users.ts";
import { BatchRequestProcessor, type ResponseItem } from "./batchRequestProcessor.ts";

const MAX_ATTEMPTS_PER_ITEM = 2;
const MAX_REQUESTS_PER_BATCH = 10;
const MAX_ITEMS_PER_REQUEST = 150;

export type UserProfileRequest = {
	userId: number;
	refreshId?: number;
};

export type UserProfileResponse = ProfileDetail<
	"isVerified" | "isDeleted",
	"combinedName" | "displayName" | "username"
> & {
	fromCache?: boolean;
};

export const profileProcessor = new BatchRequestProcessor({
	maxItemAttempts: MAX_ATTEMPTS_PER_ITEM,
	maxRequestsPerBatch: MAX_REQUESTS_PER_BATCH,
	processRequest: (data: UserProfileRequest[]) => {
		return multigetProfileData({
			userIds: data.map((item) => item.userId),
			fields: [
				//"platformProfileId",
				"isVerified",
				"isDeleted",
				//"inExperienceIsVerified",
			],
			nameFields: [
				//"alias",
				"combinedName",
				//"contactName",
				"displayName",
				//"platformName",
				"username",
				//"inExperienceCombinedName",
			],
		}).then(async (data) => {
			const showDeletedUsersUsernames = await getFeatureValue("showDeletedUsersUsernames");
			if (!showDeletedUsersUsernames) return data;

			const userIdToDataMapping = new Map<number, UserProfileResponse>();
			for (const item of data.profileDetails) {
				if (item.isDeleted) {
					userIdToDataMapping.set(item.userId, item);
				}
			}

			if (!userIdToDataMapping.size) return data;

			return multigetUsersByIds({
				userIds: Array.from(userIdToDataMapping.keys()),
			}).then((data2) => {
				for (const item of data2) {
					const map = userIdToDataMapping.get(item.id);

					if (map) {
						if (map.names.combinedName) {
							map.names.combinedName = item.displayName;
						}

						if (map.names.displayName) {
							map.names.displayName = item.displayName;
						}

						if (map.names.username) {
							map.names.username = item.name;
						}
					}
				}

				return data;
			});
		});
	},
	getRequestKey: (request: Partial<UserProfileRequest>) => {
		return request.userId!.toString();
	},
	transformResponse: (res) => {
		const result: Record<string, ResponseItem<UserProfileResponse>> = {};
		for (const item of res.profileDetails) {
			result[item.userId] = {
				retry: false,
				value: item,
			};
		}

		return result;
	},
	getRequestData: (queue) => {
		const requests: Record<string, UserProfileRequest> = {};

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

export type { ProfileDetail, ProfileField, ProfileFieldName };
